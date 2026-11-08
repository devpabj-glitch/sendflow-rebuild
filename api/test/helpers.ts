// Helpers de teste (contrato §11): pg-mem + MESMO runner/arquivos de migração +
// app real (Fastify) via inject — 100% offline, sem porta, sem Docker, sem rede.
import { randomUUID } from "node:crypto";
import { newDb, DataType, type IMemoryDb } from "pg-mem";
import type { FastifyInstance, LightMyRequestResponse } from "fastify";
import { loadConfig, type AppConfig } from "../src/config.js";
import { buildApp } from "../src/app.js";
import { loadMigrationFiles, migrateUp } from "../src/db/migrate.js";
import type { DbClient, DbPool } from "../src/lib/db.js";

/**
 * Configura o pg-mem para comportar como PostgreSQL moderno:
 * gen_random_uuid() é NATIVA no PostgreSQL 13+ (alvo de produção); o pg-mem
 * implementa poucas funções nativas, então registramos o equivalente aqui.
 * `impure: true` é essencial: sem ele o pg-mem simplifica a função como
 * constante e TODOS os ids colidiriam na PRIMARY KEY.
 * Os arquivos .sql são IDÊNTICOS para pg real e pg-mem.
 */
export function createMemoryDb(): IMemoryDb {
  const db = newDb();
  db.public.registerFunction({
    name: "gen_random_uuid",
    returns: DataType.uuid,
    impure: true,
    implementation: () => randomUUID(),
  });
  return db;
}

/** Relógio falso injetável: sessões e rate limit "andam no tempo" sem sleeps. */
export class FakeClock {
  private t: number;
  constructor(startMs: number = Date.parse("2026-11-08T12:00:00.000Z")) {
    this.t = startMs;
  }
  now(): Date {
    return new Date(this.t);
  }
  advanceMs(ms: number): void {
    this.t += ms;
  }
}

interface RawPgMemPool {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number }>;
  connect?(): Promise<RawPgMemClient>;
  end?(): Promise<void>;
}

interface RawPgMemClient {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount?: number }>;
  release?(): void;
}

/** Adaptador pg-mem → DbPool: mesmo contrato do pg real (Pool com connect/end). */
export function toDbPool(db: IMemoryDb): DbPool {
  const pgLib = db.adapters.createPg();
  const raw = new pgLib.Pool() as unknown as RawPgMemPool;
  const query = (text: string, values?: unknown[]) => raw.query(text, values);
  return {
    query,
    connect: async (): Promise<DbClient> => {
      if (typeof raw.connect === "function") {
        const client = await raw.connect();
        return {
          query: (text: string, values?: unknown[]) => client.query(text, values),
          release: () => client.release?.(),
        };
      }
      // Fallback: pg-mem é single-session — o próprio pool serve de cliente.
      return { query, release: () => undefined };
    },
    end: async () => {
      if (typeof raw.end === "function") await raw.end();
    },
  };
}

export interface TestHarness {
  app: FastifyInstance;
  clock: FakeClock;
  pool: DbPool;
  config: AppConfig;
  rawDb: IMemoryDb;
}

export async function createHarness(
  env: NodeJS.ProcessEnv = {},
  opts: { db?: DbPool; dbHealthTimeoutMs?: number } = {},
): Promise<TestHarness> {
  const rawDb = createMemoryDb();
  const pool = opts.db ?? toDbPool(rawDb);
  const config = loadConfig({
    NODE_ENV: "test",
    WEB_ORIGIN: "http://localhost:5173",
    REVISION: "test-rev",
    ...env,
  });
  // Pool customizado (ex.: brokenPool/hangingPool) pula migração — o fixture já decide o estado.
  if (!opts.db) {
    await migrateUp(pool, loadMigrationFiles());
  }
  const clock = new FakeClock();
  const app = await buildApp({ db: pool, config, clock, logger: false, dbHealthTimeoutMs: opts.dbHealthTimeoutMs });
  return { app, clock, pool, config, rawDb };
}

/** Pool quebrado (db "down") para o healthcheck 503 — nunca sobe processo nenhum. */
export function brokenPool(): DbPool {
  const boom = async (): Promise<never> => {
    throw new Error("db indisponível (fixture)");
  };
  const client = { query: boom as never, release: () => undefined };
  return {
    query: boom as never,
    connect: async () => client,
    end: async () => undefined,
  };
}

/** Pool PENDURADO (correção pós-auditoria A3): query que nunca resolve NEM rejeita. */
export function hangingPool(): DbPool {
  const never = (): Promise<never> => new Promise(() => undefined);
  const client = { query: never as never, release: () => undefined };
  return {
    query: never as never,
    connect: async () => client,
    end: async () => undefined,
  };
}

// ---- Cookie helpers (inject devolve set-cookie como string | string[]) ----

export function setCookieHeaderOf(res: LightMyRequestResponse): string {
  const raw = res.headers["set-cookie"];
  return Array.isArray(raw) ? raw[0] : (raw ?? "");
}

export function sessionTokenOf(res: LightMyRequestResponse): string {
  const match = /grupos_session=([^;]+)/.exec(setCookieHeaderOf(res));
  if (!match) throw new Error("resposta sem cookie grupos_session");
  return match[1];
}

export function cookieHeaderFor(token: string): string {
  return `grupos_session=${token}`;
}

// ---- Fixtures de tenant (dados 100% sintéticos, domínio .test.invalid) ----

export interface TenantFixture {
  email: string;
  password: string;
  user: { id: string; email: string; name: string };
  org: { id: string; name: string };
  cookieHeader: string;
}

export async function registerTenant(
  app: FastifyInstance,
  spec: { email: string; password?: string; name?: string; orgName?: string },
): Promise<TenantFixture> {
  const password = spec.password ?? "senha-super-secreta";
  const res = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: {
      email: spec.email,
      password,
      name: spec.name ?? "Dono",
      ...(spec.orgName ? { orgName: spec.orgName } : {}),
    },
  });
  if (res.statusCode !== 201) {
    throw new Error(`registerTenant falhou (${res.statusCode}): ${res.body}`);
  }
  const body = res.json() as { user: TenantFixture["user"]; org: TenantFixture["org"] };
  return {
    email: spec.email,
    password,
    user: body.user,
    org: body.org,
    cookieHeader: cookieHeaderFor(sessionTokenOf(res)),
  };
}

export function loginInject(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "POST",
    url: "/api/v1/auth/login",
    payload: { email, password },
  });
}

export function meInject(app: FastifyInstance, cookieHeader: string): Promise<LightMyRequestResponse> {
  return app.inject({
    method: "GET",
    url: "/api/v1/auth/me",
    headers: { cookie: cookieHeader },
  });
}
