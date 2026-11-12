// Falso do adaptador Evolution (T2 — D8): SEM rede, registra TODA chamada e
// permite programar respostas/falhas. Compartilhado pelos testes de rota
// (accountsConnection/evolutionWebhook) — os testes de client usam fetchImpl
// falso em evolutionAdapter.test.ts.
import { loadConfig, type AppConfig } from "../../src/config.js";
import { buildApp } from "../../src/app.js";
import { loadMigrationFiles, migrateUp } from "../../src/db/migrate.js";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import type { DbPool } from "../../src/lib/db.js";
import type { EvolutionProvider } from "../../src/providers/evolution/types.js";
import {
  EvolutionRequestError,
  EvolutionUnavailableError,
  type EvolutionInstanceCreated,
  type EvolutionInstanceState,
  type EvolutionInstanceSummary,
} from "../../src/providers/evolution/types.js";
import { FakeClock, createMemoryDb, registerTenant, toDbPool, type TenantFixture } from "../helpers.js";

export const SYNTHETIC_QR = "data:image/png;base64,U1lOVEhFVElDLVFSLUZBVElBMDc=";

export interface RecordedCall {
  op: "createInstance" | "connect" | "fetchInstances" | "logout" | "deleteInstance";
  instanceName: string;
}

export interface FakeInstanceState {
  state: string;
  ownerJid: string | null;
  number: string | null;
}

export class FakeEvolutionProvider implements EvolutionProvider {
  /** Instâncias "existentes" no provedor falso. */
  readonly instances = new Map<string, FakeInstanceState>();
  /** Log de TODA chamada recebida (asserts de sequência/ausência). */
  readonly calls: RecordedCall[] = [];
  /** true = toda chamada lança EvolutionUnavailableError (T5). */
  failAll = false;
  /** Resposta programada do connect (default: QR sintético). */
  connectNext: EvolutionInstanceState | null = null;

  private record(op: RecordedCall["op"], instanceName: string): void {
    this.calls.push({ op, instanceName });
  }

  private failIfAsked(): void {
    if (this.failAll) {
      throw new EvolutionUnavailableError("provedor falso indisponível (fixture)");
    }
  }

  ops(): string[] {
    return this.calls.map((c) => c.op);
  }

  count(op: RecordedCall["op"]): number {
    return this.calls.filter((c) => c.op === op).length;
  }

  /**Fixture direta: instância "já existente" no provedor (sem passar pela API). */
  seed(instanceName: string, state: string, ownerJid: string | null = null): FakeInstanceState {
    const seeded: FakeInstanceState = { state, ownerJid, number: ownerJid?.split("@")[0] ?? null };
    this.instances.set(instanceName, seeded);
    return seeded;
  }

  async createInstance(instanceName: string): Promise<EvolutionInstanceCreated> {
    this.record("createInstance", instanceName);
    this.failIfAsked();
    this.instances.set(instanceName, { state: "connecting", ownerJid: null, number: null });
    return { instanceName, instanceId: `fake-${instanceName}`, status: "connecting" };
  }

  async connect(instanceName: string): Promise<EvolutionInstanceState> {
    this.record("connect", instanceName);
    this.failIfAsked();
    const instance = this.instances.get(instanceName);
    if (!instance) {
      // 2.3.7: connect de instância inexistente → 400 "does not exist".
      throw new EvolutionRequestError(400, "instância inexistente (fixture)");
    }
    if (this.connectNext !== null) return this.connectNext;
    if (instance.state === "open") return { state: "open", qrDataUrl: null };
    return { state: instance.state, qrDataUrl: SYNTHETIC_QR };
  }

  async fetchInstances(instanceName: string): Promise<EvolutionInstanceSummary[]> {
    this.record("fetchInstances", instanceName);
    this.failIfAsked();
    const instance = this.instances.get(instanceName);
    if (!instance) return [];
    return [
      {
        instanceName,
        state: instance.state,
        ownerJid: instance.ownerJid,
        number: instance.number,
      },
    ];
  }

  async logout(instanceName: string): Promise<void> {
    this.record("logout", instanceName);
    this.failIfAsked();
    const instance = this.instances.get(instanceName);
    if (instance && instance.state === "close") {
      // 2.3.7 recusa logout de não-conectada (nosso 409 antecipa; aqui simula).
      throw new EvolutionRequestError(400, "instância não conectada (fixture)");
    }
    if (instance) instance.state = "close";
  }

  async deleteInstance(instanceName: string): Promise<void> {
    this.record("deleteInstance", instanceName);
    this.failIfAsked();
    this.instances.delete(instanceName);
  }
}

export interface EvolutionHarness {
  app: FastifyInstance;
  clock: FakeClock;
  pool: DbPool;
  config: AppConfig;
  fake: FakeEvolutionProvider;
  tenantA: TenantFixture;
  tenantB: TenantFixture;
}

interface HarnessOptions {
  provider?: FakeEvolutionProvider | null;
  env?: NodeJS.ProcessEnv;
}

/**
 * Harness Fatia 7: banco pg-mem migrado + app real com provider Evolution
 * INJETADO (default: falso habilitado; `provider: null` modela
 * EVOLUTION_API_KEY vazia; `provider: undefined` deixa o app construir da
 * env — usado para provar o 503 com env vazia).
 */
export async function createEvolutionHarness(opts: HarnessOptions = {}): Promise<EvolutionHarness> {
  const rawDb = createMemoryDb();
  const pool = toDbPool(rawDb);
  await migrateUp(pool, loadMigrationFiles());
  const config = loadConfig({
    NODE_ENV: "test",
    WEB_ORIGIN: "http://localhost:5173",
    REVISION: "test-rev",
    EVOLUTION_WEBHOOK_SECRET: "teste-secret-webhook-fatia7-com-32-chars",
    ...opts.env,
  });
  const clock = new FakeClock();
  const provider =
    opts.provider === undefined ? new FakeEvolutionProvider() : opts.provider;
  const app = await buildApp({
    db: pool,
    config,
    clock,
    logger: false,
    evolution: provider as EvolutionProvider | null,
  });
  const tenantA = await registerTenant(app, {
    email: "dono-a@test.invalid",
    name: "Dono A",
    orgName: "Org Alfa",
  });
  const tenantB = await registerTenant(app, {
    email: "dono-b@test.invalid",
    name: "Dono B",
    orgName: "Org Beta",
  });
  return {
    app,
    clock,
    pool,
    config,
    fake: provider as FakeEvolutionProvider,
    tenantA,
    tenantB,
  };
}

/** Cria uma conta na org do tenant e devolve o recurso (id incluso). */
export async function createAccount(
  app: FastifyInstance,
  cookie: string,
  name = "Conta Teste",
): Promise<{ id: string }> {
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/accounts",
    headers: { cookie },
    payload: { name },
  });
  if (res.statusCode !== 201) throw new Error(`createAccount falhou: ${res.statusCode} ${res.body}`);
  return res.json() as { id: string };
}

/** POST de webhook com secret correto (header custom do create/setWebhook). */
export function postWebhook(
  app: FastifyInstance,
  body: unknown,
  secret = "teste-secret-webhook-fatia7-com-32-chars",
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "POST",
    url: "/api/v1/webhooks/evolution",
    headers: { "content-type": "application/json", "x-grupos-evo-secret": secret },
    payload: body,
  });
}
