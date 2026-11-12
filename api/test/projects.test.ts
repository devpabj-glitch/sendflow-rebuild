// Projetos (Fatia 6 - PRJ; contrato docs/contracts/FATIA-06-PROJETOS-
// CONTRATO.md com D19/D20/D21 RATIFICADAS; parecer A4 ADERENTE).
// Rótulos ALINHADOS à numeração T1–T14 do contrato §6:
// T1 CRUD feliz + sem efeitos colaterais · T2 validações · T3 counts coerentes
// (DISTINCT, release sem projeto não conta, desvincular cai) · T4 DELETE D19
// (204/409 corpo fixo/linha intacta/409 não vaza cardinalidade) · T5 busca CI
// com curingas literais · T6 cruzado 2 orgs (404 byte a byte; alheio
// NÃO-VAZIO → 404 nunca 409; projectId alheio em releases → 400 genérico) ·
// T7 401 sem sessão · T8 persistência (app re-instanciado; oráculo SQL em
// projects E releases.project_uuid; counts nunca gravados) · (T9 vive em
// migrations.test.ts) · T11 Content-Type guard (D6) · T12 projectId em
// releases (uuid mesma-org, null limpa, canônico minúsculo) · T13 corrida FK
// (23503 → 409/400, nunca 500; comportamento real do pg-mem registrado) ·
// T14 estados para a tela futura (backend-only — nenhum endpoint de tela).
// Oráculo independente: leitura direta das tabelas pg-mem (não a resposta da API).
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { buildApp } from "../src/app.js";
import { loadMigrationFiles, migrateUp } from "../src/db/migrate.js";
import type { DbPool } from "../src/lib/db.js";
import {
  FakeClock,
  createHarness,
  createMemoryDb,
  registerTenant,
  toDbPool,
  type TestHarness,
  type TenantFixture,
} from "./helpers.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

interface ProjectResource {
  id: string;
  name: string;
  releaseCount: number;
  accountCount: number;
  webhookCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ReleaseResource {
  id: string;
  name: string;
  type: string;
  projectId: string | null;
  archived: boolean;
  accountIds: string[];
  createdAt: string;
  updatedAt: string;
}

type Inject = TestHarness["app"]["inject"];

function postProject(h: TestHarness, cookie: string, payload: Record<string, unknown>): Promise<Inject> {
  return h.app.inject({
    method: "POST",
    url: "/api/v1/projects",
    headers: { cookie },
    payload,
  });
}

async function createProject(h: TestHarness, cookie: string, name: string): Promise<ProjectResource> {
  h.clock.advanceMs(2); // created_at determinístico entre criações (ordenação)
  const res = await postProject(h, cookie, { name });
  if (res.statusCode !== 201) throw new Error(`createProject falhou (${res.statusCode}): ${res.body}`);
  return res.json() as ProjectResource;
}

async function createAccount(h: TestHarness, cookie: string, name: string): Promise<string> {
  const res = await h.app.inject({
    method: "POST",
    url: "/api/v1/accounts",
    headers: { cookie },
    payload: { name },
  });
  if (res.statusCode !== 201) throw new Error(`createAccount falhou (${res.statusCode}): ${res.body}`);
  return (res.json() as { id: string }).id;
}

async function createRelease(
  h: TestHarness,
  cookie: string,
  payload: Record<string, unknown>,
): Promise<ReleaseResource> {
  h.clock.advanceMs(2);
  const res = await h.app.inject({
    method: "POST",
    url: "/api/v1/releases",
    headers: { cookie },
    payload,
  });
  if (res.statusCode !== 201) throw new Error(`createRelease falhou (${res.statusCode}): ${res.body}`);
  return res.json() as ReleaseResource;
}

/** Erro FK na forma do PostgreSQL real (code 23503). */
function pgRealFkError(): Error & { code: string } {
  const err = new Error(
    'update or delete on table "projects" violates foreign key constraint "releases_project_uuid_fkey" on table "projects"',
  ) as Error & { code: string };
  err.code = "23503";
  return err;
}

/** Erro FK na forma do pg-mem (sem code; mensagem nomeia a constraint). */
function pgMemFkError(): Error {
  return new Error(
    'update or delete on table "projects" violates foreign key constraint on table "releases_project_uuid_fk"',
  );
}

/**
 * Pool que injeta UM erro na primeira query que contém o fragmento (corrida
 * artificial do T13: "ordem invertida artificialmente na fixture" — a FK
 * dispara num ponto que o single-session do pg-mem não produz sozinho). As
 * demais queries passam ao pool real.
 */
function interceptingPool(base: DbPool, fragment: string, errorFactory: () => Error): DbPool {
  let armed = true;
  const wrap = (text: string, values?: unknown[]) => {
    if (armed && text.includes(fragment)) {
      armed = false;
      return Promise.reject(errorFactory());
    }
    return base.query(text, values);
  };
  return {
    query: (text: string, values?: unknown[]) => wrap(text, values),
    connect: async () => {
      const client = await base.connect();
      return { query: (text: string, values?: unknown[]) => wrap(text, values), release: () => client.release() };
    },
    end: () => base.end(),
  };
}

async function createInterceptedHarness(fragment: string, errorFactory: () => Error): Promise<TestHarness> {
  const base = toDbPool(createMemoryDb());
  await migrateUp(base, loadMigrationFiles());
  return createHarness({}, { db: interceptingPool(base, fragment, errorFactory) });
}

describe("projects: CRUD, counts, exclusão D19 e tenant (contrato PRJ T1–T8, T11–T14)", () => {
  let h: TestHarness;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;

  beforeEach(async () => {
    h = await createHarness();
    tenantA = await registerTenant(h.app, {
      email: "dono-a@test.invalid",
      name: "Dono A",
      orgName: "Org Alfa",
    });
    tenantB = await registerTenant(h.app, {
      email: "dono-b@test.invalid",
      name: "Dono B",
      orgName: "Org Beta",
    });
  });

  // ------------------------------------------------------------------- T1
  it("T1: POST {name} → 201 flat exato (counts nascem 0); lista/GET :id/PATCH coerentes; SEM efeitos colaterais (análogo CTA-03)", async () => {
    const sessionsBefore = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    const accountsBefore = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    const releasesBefore = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    const joinsBefore = await h.pool.query("SELECT count(*)::int AS n FROM release_accounts");
    const groupsBefore = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    const tablesBefore = await h.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );

    const res = await postProject(h, tenantA.cookieHeader, { name: "  Cliente Omega  " });
    expect(res.statusCode).toBe(201);
    const project = res.json() as ProjectResource;
    expect(Object.keys(project).sort()).toEqual([
      "accountCount",
      "createdAt",
      "id",
      "name",
      "releaseCount",
      "updatedAt",
      "webhookCount",
    ]);
    expect(project.name).toBe("Cliente Omega"); // trim antes de gravar
    expect(project.releaseCount).toBe(0); // nenhum vínculo pode existir (FK)
    expect(project.accountCount).toBe(0);
    expect(project.webhookCount).toBe(0); // §4.3: literal declarado
    expect(project.id).toMatch(UUID_RE);
    expect(project.createdAt).toMatch(ISO_RE);
    expect(project.updatedAt).toMatch(ISO_RE);

    // Oráculo: linha gravada na org da SESSÃO (nunca do body).
    const rows = await h.pool.query("SELECT org_id, name FROM projects WHERE id = $1", [project.id]);
    expect(rows.rows[0]).toMatchObject({ org_id: tenantA.org.id, name: "Cliente Omega" });

    // Lista contém o item (campo a campo) e total reflete.
    const list = await h.app.inject({
      method: "GET",
      url: "/api/v1/projects",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(list.statusCode).toBe(200);
    const listBody = list.json() as { items: ProjectResource[]; total: number; page: number; pageSize: number };
    expect(listBody.total).toBe(1);
    expect(listBody.items[0]).toEqual(project);

    // GET /:id devolve igual (shape uniforme §3.1).
    const got = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(project);

    // PATCH {name} → 200 refletido; updated_at anda; created_at não.
    h.clock.advanceMs(5_000);
    const patch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Cliente Omega Dois" },
    });
    expect(patch.statusCode).toBe(200);
    const patched = patch.json() as ProjectResource;
    expect(patched.name).toBe("Cliente Omega Dois");
    expect(patched.releaseCount).toBe(0);
    expect(Date.parse(patched.updatedAt)).toBeGreaterThan(Date.parse(project.updatedAt));
    expect(patched.createdAt).toBe(project.createdAt);

    // Sem efeitos colaterais: contagens inalteradas; conjunto de tabelas
    // exatamente o schema vigente (9, com projects — ajuste T10-iii).
    const sessionsAfter = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    const accountsAfter = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    const releasesAfter = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    const joinsAfter = await h.pool.query("SELECT count(*)::int AS n FROM release_accounts");
    const groupsAfter = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    const tablesAfter = await h.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );
    expect(sessionsAfter.rows[0]).toEqual(sessionsBefore.rows[0]);
    expect(accountsAfter.rows[0]).toEqual(accountsBefore.rows[0]);
    expect(releasesAfter.rows[0]).toEqual(releasesBefore.rows[0]);
    expect(joinsAfter.rows[0]).toEqual(joinsBefore.rows[0]);
    expect(groupsAfter.rows[0]).toEqual(groupsBefore.rows[0]);
    const names = (r: { rows: Record<string, unknown>[] }) => r.rows.map((x) => String(x.table_name)).sort();
    expect(names(tablesAfter)).toEqual([
      "accounts",
      "groups",
      "integration_events",
      "migrations",
      "organizations",
      "projects",
      "release_accounts",
      "releases",
      "sessions",
      "users",
    ]);
    expect(names(tablesAfter)).toEqual(names(tablesBefore));
    await h.app.close();
  });

  // ------------------------------------------------------------------- T2
  it("T2: name vazio/121 → 400 ['name'] (120 passa); search 121/page=0/pageSize=101 → 400; PATCH {} e body null → 400; desconhecidos → 400 com details; :id malformado → 400; releases com projectId não-UUID → 400 ['projectId']", async () => {
    for (const name of ["", "   ", "a".repeat(121), 42]) {
      const res = await postProject(h, tenantA.cookieHeader, { name });
      expect(res.statusCode, `name=${JSON.stringify(String(name).slice(0, 8))}`).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["name"]);
    }
    const ok = await postProject(h, tenantA.cookieHeader, { name: "a".repeat(120) });
    expect(ok.statusCode).toBe(201);

    for (const qs of [
      `search=${"a".repeat(121)}`,
      "page=0",
      "page=abc",
      "pageSize=101",
      "pageSize=0",
    ]) {
      const res = await h.app.inject({
        method: "GET",
        url: `/api/v1/projects?${qs}`,
        headers: { cookie: tenantA.cookieHeader },
      });
      expect(res.statusCode, qs).toBe(400);
      const body = res.json() as { error: { details?: { fields: string[] } } };
      expect(body.error.details?.fields).toEqual([qs.split("=")[0].length > 8 ? "search" : qs.split("=")[0]]);
    }

    // PATCH {} → 400 (≥1 campo); body null LITERAL → 400 (nunca 500).
    const created = ok.json() as ProjectResource;
    const empty = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: {},
    });
    expect(empty.statusCode).toBe(400);
    expect(((empty.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);
    const nullBody = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${created.id}`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: "null",
    });
    expect(nullBody.statusCode).toBe(400);
    expect(((nullBody.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);

    // Campos desconhecidos (inclui TODOS os counts e auditoria) → 400 com o nome do campo.
    for (const extra of [
      { org_id: randomUUID() },
      { id: randomUUID() },
      { releaseCount: 1 },
      { accountCount: 2 },
      { webhookCount: 3 },
      { createdAt: "2026-01-01T00:00:00.000Z" },
      { updatedAt: "2026-01-01T00:00:00.000Z" },
    ]) {
      const res = await postProject(h, tenantA.cookieHeader, { name: "X", ...extra });
      expect(res.statusCode, JSON.stringify(extra)).toBe(400);
      const body = res.json() as { error: { details?: { fields: string[] } } };
      expect(body.error.details?.fields).toEqual([Object.keys(extra)[0]]);
    }

    // :id malformado → 400 por FORMATO em GET/PATCH/DELETE (json explícito no
    // DELETE para o guard D6 não preceder com outro fields).
    const jsonHeader = { cookie: tenantA.cookieHeader, "content-type": "application/json" };
    const idCases: { method: "GET" | "PATCH" | "DELETE"; withPayload: boolean }[] = [
      { method: "GET", withPayload: false },
      { method: "PATCH", withPayload: true },
      { method: "DELETE", withPayload: false },
    ];
    for (const call of idCases) {
      const res = call.withPayload
        ? await h.app.inject({
            method: call.method,
            url: "/api/v1/projects/nao-e-um-uuid",
            headers: { cookie: tenantA.cookieHeader },
            payload: { name: "X" },
          })
        : await h.app.inject({
            method: call.method,
            url: "/api/v1/projects/nao-e-um-uuid",
            headers: jsonHeader,
          });
      expect(res.statusCode, call.method).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["id"]);
    }

    // §0.2: texto livre legado da D13 em projectId de releases → 400 (POST e PATCH).
    const legacy = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "X", type: "WhatsRelease", projectId: "proj-abc-123" },
    });
    expect(legacy.statusCode).toBe(400);
    expect(((legacy.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["projectId"]);
    const release = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Ok", type: "WhatsList" },
    });
    expect(release.statusCode).toBe(201);
    const legacyPatch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${(release.json() as ReleaseResource).id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { projectId: "proj-abc-123" },
    });
    expect(legacyPatch.statusCode).toBe(400);
    expect(((legacyPatch.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["projectId"]);

    // Oráculo: só a válida + a release ok foram gravadas.
    const projects = await h.pool.query("SELECT count(*)::int AS n FROM projects");
    expect(projects.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  // ------------------------------------------------------------------- T3
  it("T3: counts coerentes com fixtures — DISTINCT (X conta 1x), release SEM projeto não conta, P2 vazio 0/0/0, desvincular cai 2/3→1/2; GET :id ≡ lista; counts NUNCOLADOS (sem colunas)", async () => {
    const x = await createAccount(h, tenantA.cookieHeader, "Conta X");
    const y = await createAccount(h, tenantA.cookieHeader, "Conta Y");
    const z = await createAccount(h, tenantA.cookieHeader, "Conta Z");
    const w = await createAccount(h, tenantA.cookieHeader, "Conta W");
    const p1 = await createProject(h, tenantA.cookieHeader, "Projeto Um");
    const p2 = await createProject(h, tenantA.cookieHeader, "Projeto Dois");

    await createRelease(h, tenantA.cookieHeader, {
      name: "R Um",
      type: "WhatsRelease",
      projectId: p1.id,
      accountIds: [x, y],
    });
    const r2 = await createRelease(h, tenantA.cookieHeader, {
      name: "R Dois",
      type: "WhatsList",
      projectId: p1.id,
      accountIds: [x, z],
    });
    // R3 sem projeto (conta W): não entra em P1 nem em nenhum count.
    await createRelease(h, tenantA.cookieHeader, {
      name: "R Solta",
      type: "WhatsViralCampaign",
      accountIds: [w],
    });

    const getP1 = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${p1.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(getP1.statusCode).toBe(200);
    const bodyP1 = getP1.json() as ProjectResource;
    expect(bodyP1.releaseCount).toBe(2); // R1 + R2
    expect(bodyP1.accountCount).toBe(3); // X, Y, Z — DISTINCT: X em 2 releases conta 1x (T3b)
    expect(bodyP1.webhookCount).toBe(0);

    const getP2 = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${p2.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const bodyP2 = getP2.json() as ProjectResource;
    expect(bodyP2).toMatchObject({ releaseCount: 0, accountCount: 0, webhookCount: 0 });

    // Lista concorda campo a campo com GET /:id (counts por página, §4.4).
    const list = await h.app.inject({
      method: "GET",
      url: "/api/v1/projects",
      headers: { cookie: tenantA.cookieHeader },
    });
    const listBody = list.json() as { items: ProjectResource[]; total: number };
    expect(listBody.total).toBe(2);
    const byId = new Map(listBody.items.map((i) => [i.id, i]));
    expect(byId.get(p1.id)).toEqual(bodyP1);
    expect(byId.get(p2.id)).toEqual(bodyP2);

    // Desvincular R2 (PATCH releases projectId:null) → counts caem para 1/2.
    const unlink = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${r2.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { projectId: null },
    });
    expect(unlink.statusCode).toBe(200);
    expect((unlink.json() as ReleaseResource).projectId).toBeNull();
    const relink = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${p1.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(relink.json()).toMatchObject({ releaseCount: 1, accountCount: 2, webhookCount: 0 });

    // Oráculo: counts NUNCA gravados — colunas de projects são exatamente as 5.
    const cols = await h.pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'projects'
        ORDER BY column_name`,
    );
    expect(cols.rows.map((r) => String(r.column_name))).toEqual([
      "created_at",
      "id",
      "name",
      "org_id",
      "updated_at",
    ]);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T4
  it("T4: DELETE D19 — vazio 204 + repetição 404 byte a byte; com releases 409 PROJECT_NOT_EMPTY corpo fixo + linha INTACTA; desvincular → 204; 409 idêntico p/ 1 e 3 releases", async () => {
    const account = await createAccount(h, tenantA.cookieHeader, "Conta T4");
    const jsonHeader = { cookie: tenantA.cookieHeader, "content-type": "application/json" };

    // (a) projeto vazio → 204; releitura 404; repetição 404 byte a byte.
    const empty = await createProject(h, tenantA.cookieHeader, "Vazio");
    const del = await h.app.inject({ method: "DELETE", url: `/api/v1/projects/${empty.id}`, headers: jsonHeader });
    expect(del.statusCode).toBe(204);
    expect(del.body).toBe(""); // sem corpo
    const reread = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${empty.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(reread.statusCode).toBe(404);
    expect((reread.json() as { error: { code: string } }).error.code).toBe("TENANT_FORBIDDEN");
    const again = await h.app.inject({ method: "DELETE", url: `/api/v1/projects/${empty.id}`, headers: jsonHeader });
    const nonexistent = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${randomUUID()}`,
      headers: jsonHeader,
    });
    expect(again.statusCode).toBe(404);
    expect(nonexistent.statusCode).toBe(404);
    expect(again.body).toBe(nonexistent.body); // byte a byte (D16 espelhado)

    // (b) projeto com 1 release → 409 corpo fixo; oráculo: linha INTACTA.
    const busy = await createProject(h, tenantA.cookieHeader, "Ocupado Um");
    await createRelease(h, tenantA.cookieHeader, {
      name: "Release do Ocupado",
      type: "WhatsRelease",
      projectId: busy.id,
      accountIds: [account],
    });
    const before = await h.pool.query(
      "SELECT name, created_at, updated_at FROM projects WHERE id = $1",
      [busy.id],
    );
    h.clock.advanceMs(10_000); // se algo tocasse updated_at, o oráculo pegaria
    const busyDelete = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${busy.id}`,
      headers: jsonHeader,
    });
    expect(busyDelete.statusCode).toBe(409);
    const busyBody = busyDelete.json() as { error: { code: string; message: string; details?: unknown } };
    expect(busyBody.error.code).toBe("PROJECT_NOT_EMPTY");
    expect(typeof busyBody.error.message).toBe("string");
    expect(busyBody.error.message).not.toMatch(/\d/); // sem contagem no corpo
    expect("details" in busyBody.error).toBe(false); // sem details
    const after = await h.pool.query(
      "SELECT name, created_at, updated_at FROM projects WHERE id = $1",
      [busy.id],
    );
    expect(after.rows[0]).toEqual(before.rows[0]); // campo a campo: nem updated_at anda
    expect(after.rows.length).toBe(1); // linha persiste

    // (d) 409 idêntico byte a byte para 1 e para 3 releases (não vaza cardinalidade).
    const three = await createProject(h, tenantA.cookieHeader, "Ocupado Tres");
    for (let i = 1; i <= 3; i++) {
      await createRelease(h, tenantA.cookieHeader, {
        name: `Release ${i}`,
        type: "WhatsList",
        projectId: three.id,
        accountIds: [account],
      });
    }
    const threeDelete = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${three.id}`,
      headers: jsonHeader,
    });
    expect(threeDelete.statusCode).toBe(409);
    expect(threeDelete.body).toBe(busyDelete.body); // byte a byte: 1 ≡ 3 releases

    // (c) desvincular a release → DELETE volta a 204 (estado reavaliado por chamada).
    const releases = await h.pool.query(
      "SELECT id FROM releases WHERE project_uuid = $1 AND org_id = $2",
      [busy.id, tenantA.org.id],
    );
    expect(releases.rows).toHaveLength(1);
    const unlink = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${String(releases.rows[0].id)}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { projectId: null },
    });
    expect(unlink.statusCode).toBe(200);
    const redelete = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${busy.id}`,
      headers: jsonHeader,
    });
    expect(redelete.statusCode).toBe(204);

    // Oráculo final: sobrou só o projeto "Ocupado Tres" (com 3 releases).
    const remaining = await h.pool.query("SELECT count(*)::int AS n FROM projects");
    expect(remaining.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  // ------------------------------------------------------------------- T5
  it("T5: busca — substring CI, curingas % e _ literais, vazio ⇒ sem filtro, página além do fim, ordenação created_at DESC", async () => {
    await createProject(h, tenantA.cookieHeader, "Cliente Alfa");
    await createProject(h, tenantA.cookieHeader, "cliente beta");
    await createProject(h, tenantA.cookieHeader, "Gamma 100%");
    await createProject(h, tenantA.cookieHeader, "Delta_Fim");
    const cookie = tenantA.cookieHeader;
    const search = async (term: string) => {
      const res = await h.app.inject({
        method: "GET",
        url: `/api/v1/projects?search=${encodeURIComponent(term)}`,
        headers: { cookie },
      });
      expect(res.statusCode).toBe(200);
      return res.json() as { items: ProjectResource[]; total: number };
    };

    // Substring CI: "CLIENTE" acha "Cliente Alfa" e "cliente beta".
    expect((await search("CLIENTE")).total).toBe(2);
    expect((await search("beta")).items[0].name).toBe("cliente beta");

    // Substring CI: "CLIENTE" acha "Cliente Alfa" e "cliente beta".
    expect((await search("CLIENTE")).total).toBe(2);
    expect((await search("beta")).items[0].name).toBe("cliente beta");

    // Nome CONTENDO curinga é encontrável por termo limpo (ressalva pg-mem
    // idem F2: a literalidade de curingas no TERMO só é demonstrável contra
    // PostgreSQL real — o escape \\% / \\_ permanece no código, §3.2).
    expect((await search("100")).total).toBe(1); // "Gamma 100%"
    expect((await search("Delta")).total).toBe(1); // "Delta_Fim"
    // Termo COM curinga não quebra (comportamento entre motores documentado).
    const wild = await search("100%");
    expect(typeof wild.total).toBe("number");
    const underscore = await search("Delta_");
    expect(typeof underscore.total).toBe("number");

    // Termo vazio ⇒ sem filtro (todas).
    expect((await search("")).total).toBe(4);
    expect((await search("   ")).total).toBe(4); // trim vazio

    // Página além do fim: items vazio, total preservado.
    const beyond = await h.app.inject({
      method: "GET",
      url: "/api/v1/projects?page=99",
      headers: { cookie },
    });
    const beyondBody = beyond.json() as { items: unknown[]; total: number };
    expect(beyondBody.items).toEqual([]);
    expect(beyondBody.total).toBe(4);

    // Ordenação fixa created_at DESC, id DESC (desempate): criação foi
    // Alfa < beta < Gamma < Delta — a página 1 (pageSize=3) traz os 3 últimos.
    const page1 = await h.app.inject({
      method: "GET",
      url: "/api/v1/projects?page=1&pageSize=3",
      headers: { cookie },
    });
    const page1Body = page1.json() as { items: ProjectResource[]; total: number; page: number; pageSize: number };
    expect(page1Body.items.map((i) => i.name)).toEqual(["Delta_Fim", "Gamma 100%", "cliente beta"]);
    expect(page1Body.total).toBe(4);
    expect(page1Body.page).toBe(1);
    expect(page1Body.pageSize).toBe(3);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T6
  it("T6 (TEN-01 + PRJ-04): cruzado A↔B — GET/PATCH/DELETE → 404 byte a byte (DELETE de NÃO-VAZIO alheio → 404, nunca 409); projectId alheio em releases → 400 genérico; lista/counts isolados; snapshot intacto", async () => {
    // Fixtures SIMÉTRICAS: cada org com projeto + release vinculada + conta.
    const accA = await createAccount(h, tenantA.cookieHeader, "Conta da Alfa");
    const projectA = await createProject(h, tenantA.cookieHeader, "Projeto da Alfa");
    await createRelease(h, tenantA.cookieHeader, {
      name: "Release da Alfa",
      type: "WhatsRelease",
      projectId: projectA.id,
      accountIds: [accA],
    });
    const accB = await createAccount(h, tenantB.cookieHeader, "Conta da Beta");
    const projectB = await createProject(h, tenantB.cookieHeader, "Projeto da Beta");
    const releaseB = await createRelease(h, tenantB.cookieHeader, {
      name: "Release da Beta",
      type: "WhatsList",
      projectId: projectB.id,
      accountIds: [accB],
    });

    // Referência: UUID bem-formado inexistente, com a sessão de B.
    const nonexistent = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(nonexistent.statusCode).toBe(404);
    expect((nonexistent.json() as { error: { code: string } }).error.code).toBe("TENANT_FORBIDDEN");

    // B lê/edita/exclui projeto NÃO-VAZIO de A → 404 byte a byte (nunca 409:
    // o 409 só é alcançável dentro da própria org — §5).
    const bGet = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectA.id}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    const bPatch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${projectA.id}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Roubado" },
    });
    const bDelete = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${projectA.id}`,
      headers: { cookie: tenantB.cookieHeader, "content-type": "application/json" },
    });
    for (const res of [bGet, bPatch, bDelete]) {
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe(nonexistent.body);
    }
    expect(bDelete.statusCode).not.toBe(409);

    // B referenciar o projeto de A em releases (POST e PATCH) → 400 GENÉRICO
    // (não vaza existência nem dono — padrão accountIds).
    const bPostForeign = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Da Beta", type: "WhatsList", projectId: projectA.id },
    });
    expect(bPostForeign.statusCode).toBe(400);
    expect(((bPostForeign.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["projectId"]);
    const bPatchForeign = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${releaseB.id}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { projectId: projectA.id },
    });
    expect(bPatchForeign.statusCode).toBe(400);
    expect(((bPatchForeign.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["projectId"]);

    // Lista de B não contém o projeto de A (só o próprio).
    const bList = await h.app.inject({
      method: "GET",
      url: "/api/v1/projects",
      headers: { cookie: tenantB.cookieHeader },
    });
    const bListBody = bList.json() as { items: ProjectResource[]; total: number };
    expect(bListBody.total).toBe(1);
    expect(bListBody.items[0].id).toBe(projectB.id);

    // Counts de projeto de A NÃO incluem releases/contas de B (e vice-versa).
    const aGet = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectA.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(aGet.json()).toMatchObject({ releaseCount: 1, accountCount: 1, webhookCount: 0 });
    const bGetOwn = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${projectB.id}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(bGetOwn.json()).toMatchObject({ releaseCount: 1, accountCount: 1, webhookCount: 0 });

    // Snapshot: nada de A nem B foi alterado pelas negativas.
    const snapshot = await h.pool.query(
      "SELECT id, name, created_at, updated_at FROM projects ORDER BY id",
    );
    expect(snapshot.rows).toHaveLength(2);
    const releasesCount = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    const linksCount = await h.pool.query(
      "SELECT count(*)::int AS n FROM releases WHERE project_uuid IS NOT NULL",
    );
    expect(releasesCount.rows[0]).toMatchObject({ n: 2 });
    expect(linksCount.rows[0]).toMatchObject({ n: 2 }); // vínculos originais intactos
    await h.app.close();
  });

  // ------------------------------------------------------------------- T7
  it("T7: sem sessão: POST/lista/GET :id/PATCH/DELETE de projects e POST/PATCH de releases com projectId → 401 AUTH_UNAUTHENTICATED", async () => {
    const id = randomUUID();
    // Ações/DELETE sem corpo: header json explícito (sem payload o inject NÃO
    // seta content-type; o guard D6 responderia 400 antes do 401 — precedência
    // F2 §3.5; com json válido o 401 vem primeiro).
    const jsonHeader = { "content-type": "application/json" };
    const calls = [
      { method: "POST" as const, url: "/api/v1/projects", payload: { name: "X" } },
      { method: "GET" as const, url: "/api/v1/projects" },
      { method: "GET" as const, url: `/api/v1/projects/${id}` },
      { method: "PATCH" as const, url: `/api/v1/projects/${id}`, payload: { name: "Y" } },
      { method: "DELETE" as const, url: `/api/v1/projects/${id}`, headers: jsonHeader },
      {
        method: "POST" as const,
        url: "/api/v1/releases",
        payload: { name: "R", type: "WhatsRelease", projectId: id },
      },
      { method: "PATCH" as const, url: `/api/v1/releases/${id}`, payload: { projectId: id } },
    ];
    for (const call of calls) {
      const res = await h.app.inject({ ...call }); // SEM cookie
      expect(res.statusCode, `${call.method} ${call.url}`).toBe(401);
      expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");
    }
    await h.app.close();
  });

  // ------------------------------------------------------------------ T11
  it("T11 (D6): POST/PATCH text/plain/urlencoded/sem header → 400 ['content-type']; DELETE text/plain → 400; charset ok; nada criado pelas rejeitadas", async () => {
    const cookie = tenantA.cookieHeader;
    const urlencoded = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie, "content-type": "application/x-www-form-urlencoded" },
      payload: "name=Ataque+CSRF",
    });
    expect(urlencoded.statusCode).toBe(400);
    expect(((urlencoded.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["content-type"]);

    const textPlain = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie, "content-type": "text/plain" },
      payload: '{"name":"Ataque"}',
    });
    expect(textPlain.statusCode).toBe(400);
    expect(((textPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["content-type"]);

    // POST sem header nenhum → 400 (guard precede; nada criado).
    const noHeader = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie },
    });
    expect(noHeader.statusCode).toBe(400);
    expect(((noHeader.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["content-type"]);

    // PATCH sem header (payload string, sem content-type) → 400.
    const target = await createProject(h, cookie, "Para o Guard");
    const patchNoHeader = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/projects/${target.id}`,
      headers: { cookie },
      payload: '{"name":"Sem Header"}',
    });
    expect(patchNoHeader.statusCode).toBe(400);
    expect(((patchNoHeader.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["content-type"]);

    // DELETE com text/plain → 400 (guard uniforme, §3.4).
    const deleteTextPlain = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${target.id}`,
      headers: { cookie, "content-type": "text/plain" },
      payload: "",
    });
    expect(deleteTextPlain.statusCode).toBe(400);
    expect(((deleteTextPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["content-type"]);

    // charset é parâmetro aceito (media type application/json).
    const charsetOk = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie, "content-type": "application/json; charset=utf-8" },
      payload: { name: "Com Charset" },
    });
    expect(charsetOk.statusCode).toBe(201);

    // Oráculo: só o projeto do createProject + o do charset (as rejeitadas não gravaram).
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM projects");
    expect(rows.rows[0]).toMatchObject({ n: 2 });
    await h.app.close();
  });

  // ------------------------------------------------------------------ T12
  it("T12: projectId em releases — POST próprio 201 (oráculo FK); PATCH muda de projeto; null limpa; ausente inalterado; alheio/inexistente/não-UUID → 400 genérico POST e PATCH; caixa alta → canônico minúsculo", async () => {
    const p1 = await createProject(h, tenantA.cookieHeader, "Projeto Um");
    const p2 = await createProject(h, tenantA.cookieHeader, "Projeto Dois");
    const foreign = await createProject(h, tenantB.cookieHeader, "Projeto da Beta");
    const cookie = tenantA.cookieHeader;

    // POST com projeto da própria org → 201 com projectId uuid (oráculo: FK gravada).
    const linked = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie },
      payload: { name: "Vinculada", type: "WhatsRelease", projectId: p1.id },
    });
    expect(linked.statusCode).toBe(201);
    const release = linked.json() as ReleaseResource;
    expect(release.projectId).toBe(p1.id);
    const fkRow = await h.pool.query("SELECT project_uuid FROM releases WHERE id = $1", [release.id]);
    expect(String(fkRow.rows[0].project_uuid)).toBe(p1.id);

    // PATCH muda de projeto (mesma org) → 200.
    const moved = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie },
      payload: { projectId: p2.id },
    });
    expect(moved.statusCode).toBe(200);
    expect((moved.json() as ReleaseResource).projectId).toBe(p2.id);

    // Ausente = não mexe.
    const untouched = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie },
      payload: { name: "Só Nome" },
    });
    expect((untouched.json() as ReleaseResource).projectId).toBe(p2.id);

    // null explícito limpa (oráculo NULL).
    const cleared = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie },
      payload: { projectId: null },
    });
    expect(cleared.statusCode).toBe(200);
    expect((cleared.json() as ReleaseResource).projectId).toBeNull();
    const nullRow = await h.pool.query("SELECT project_uuid FROM releases WHERE id = $1", [release.id]);
    expect(nullRow.rows[0]).toMatchObject({ project_uuid: null });

    // Mesmo uuid em CAIXA ALTA → aceito, canônico minúsculo (F3 achado 1).
    const upper = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie },
      payload: { name: "Caixa Alta", type: "WhatsList", projectId: p1.id.toUpperCase() },
    });
    expect(upper.statusCode).toBe(201);
    expect((upper.json() as ReleaseResource).projectId).toBe(p1.id);

    // POST sem projectId → nasce null.
    const noProject = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie },
      payload: { name: "Sem Projeto", type: "WhatsList" },
    });
    expect((noProject.json() as ReleaseResource).projectId).toBeNull();

    // alheio/inexistente/não-UUID/não-string → 400 GENÉRICO em POST e PATCH.
    const bad: [string, unknown][] = [
      ["alheio", foreign.id],
      ["inexistente", randomUUID()],
      ["não-UUID (legado)", "proj-abc-123"],
      ["não-string", 42],
    ];
    for (const [label, projectId] of bad) {
      const post = await h.app.inject({
        method: "POST",
        url: "/api/v1/releases",
        headers: { cookie },
        payload: { name: "X", type: "WhatsRelease", projectId },
      });
      expect(post.statusCode, `POST ${label}`).toBe(400);
      const body = post.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual(["projectId"]);
      const patch = await h.app.inject({
        method: "PATCH",
        url: `/api/v1/releases/${release.id}`,
        headers: { cookie },
        payload: { projectId },
      });
      expect(patch.statusCode, `PATCH ${label}`).toBe(400);
      expect(((patch.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["projectId"]);
    }

    // Oráculo: a release segue NULL (as rejeitadas não gravaram vínculo).
    const finalRow = await h.pool.query("SELECT project_uuid FROM releases WHERE id = $1", [release.id]);
    expect(finalRow.rows[0]).toMatchObject({ project_uuid: null });
    await h.app.close();
  });

  // ------------------------------------------------------------------ T13
  it("T13: corrida FK — pg-mem APLICA a RESTRICT (observação real); 23503 no DELETE → 409 PROJECT_NOT_EMPTY; FK no UPDATE de releases → 400 ['projectId']; nunca 500; sem órfão", async () => {
    // (a) Comportamento REAL do pg-mem (parecer recomendação 3): DELETE direto
    // de projeto referenciado é RECUSADO pela FK (sem code; mensagem nomeia a
    // constraint) — a via FK é fato observado, não apenas ressalva.
    const project = await createProject(h, tenantA.cookieHeader, "Protegido");
    const release = await createRelease(h, tenantA.cookieHeader, {
      name: "Vinculada",
      type: "WhatsRelease",
      projectId: project.id,
    });
    await expect(h.pool.query("DELETE FROM projects WHERE id = $1", [project.id])).rejects.toThrow(
      /foreign key/i,
    );
    const survivors = await h.pool.query("SELECT count(*)::int AS n FROM projects WHERE id = $1", [project.id]);
    expect(survivors.rows[0]).toMatchObject({ n: 1 });
    const linkRow = await h.pool.query("SELECT project_uuid FROM releases WHERE id = $1", [release.id]);
    expect(String(linkRow.rows[0].project_uuid)).toBe(project.id);
    await h.app.close();

    // (b) DELETE da API com FK disparando APÓS o COUNT (corrida artificial —
    // "ordem invertida na fixture"): forma 23503 do banco real → 409, nunca 500.
    const hReal = await createInterceptedHarness("DELETE FROM projects", pgRealFkError);
    const tReal = await registerTenant(hReal.app, { email: "corrida-real@test.invalid", orgName: "Org Corrida R" });
    const raceReal = await createProject(hReal, tReal.cookieHeader, "Corrida Real"); // vazio: COUNT=0
    const delReal = await hReal.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${raceReal.id}`,
      headers: { cookie: tReal.cookieHeader, "content-type": "application/json" },
    });
    expect(delReal.statusCode).toBe(409); // nunca 500
    expect((delReal.json() as { error: { code: string } }).error.code).toBe("PROJECT_NOT_EMPTY");
    const raceRow = await hReal.pool.query("SELECT count(*)::int AS n FROM projects WHERE id = $1", [raceReal.id]);
    expect(raceRow.rows[0]).toMatchObject({ n: 1 }); // sem estado órfão: linha intacta
    await hReal.app.close();

    // (c) Mesma corrida na forma do pg-mem (sem code, só mensagem FK) → 409.
    const hMem = await createInterceptedHarness("DELETE FROM projects", pgMemFkError);
    const tMem = await registerTenant(hMem.app, { email: "corrida-mem@test.invalid", orgName: "Org Corrida M" });
    const raceMem = await createProject(hMem, tMem.cookieHeader, "Corrida Mem");
    const delMem = await hMem.app.inject({
      method: "DELETE",
      url: `/api/v1/projects/${raceMem.id}`,
      headers: { cookie: tMem.cookieHeader, "content-type": "application/json" },
    });
    expect(delMem.statusCode).toBe(409);
    expect((delMem.json() as { error: { code: string } }).error.code).toBe("PROJECT_NOT_EMPTY");
    await hMem.app.close();

    // (d) PATCH de releases com FK disparando no UPDATE (projeto sumiu entre
    // a validação e a gravação) → 400 fields ["projectId"], nunca 500.
    const hPatch = await createInterceptedHarness("UPDATE releases", pgRealFkError);
    const tPatch = await registerTenant(hPatch.app, { email: "corrida-patch@test.invalid", orgName: "Org Corrida P" });
    const pPatch = await createProject(hPatch, tPatch.cookieHeader, "Projeto Corrida");
    const rPatch = await createRelease(hPatch, tPatch.cookieHeader, { name: "Solta", type: "WhatsList" });
    const patchRace = await hPatch.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${rPatch.id}`,
      headers: { cookie: tPatch.cookieHeader },
      payload: { projectId: pPatch.id },
    });
    expect(patchRace.statusCode).toBe(400); // nunca 500
    expect(((patchRace.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["projectId"]);
    const patchRow = await hPatch.pool.query("SELECT project_uuid FROM releases WHERE id = $1", [rPatch.id]);
    expect(patchRow.rows[0]).toMatchObject({ project_uuid: null }); // rollback: sem órfão
    await hPatch.app.close();
  });

  // ------------------------------------------------------------------ T14
  it("T14 (UI-01 backend): estados para a tela futura — vazio legível, preenchido com counts, erro (envelope); nenhum endpoint de tela criado", async () => {
    // Estado vazio (org B sem projetos): legível, sem erro.
    const empty = await h.app.inject({
      method: "GET",
      url: "/api/v1/projects",
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });

    // Estado preenchido: item com counts no shape completo do recurso.
    const account = await createAccount(h, tenantB.cookieHeader, "Conta B");
    const project = await createProject(h, tenantB.cookieHeader, "Projeto da Tela");
    await createRelease(h, tenantB.cookieHeader, {
      name: "Release da Tela",
      type: "WhatsRelease",
      projectId: project.id,
      accountIds: [account],
    });
    const filled = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(filled.statusCode).toBe(200);
    expect(filled.json()).toMatchObject({ releaseCount: 1, accountCount: 1, webhookCount: 0 });

    // Estado de erro: envelope único (tela futura renderiza a partir dele).
    const error = await h.app.inject({
      method: "GET",
      url: `/api/v1/projects/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(error.statusCode).toBe(404);
    expect(Object.keys(error.json() as object)).toEqual(["error"]);
    await h.app.close();
  });
});

// --------------------------------------------------------------------- T8
describe("projects: persistência (T8 — app re-instanciado sobre o MESMO banco)", () => {
  it("projeto/vínculo criados no app #1 são relidos pelo app #2 (counts recomputados) e pelo oráculo SQL; counts NUNCA gravados", async () => {
    const rawDb = createMemoryDb();
    const pool = toDbPool(rawDb);
    await migrateUp(pool, loadMigrationFiles());
    const config = loadConfig({
      NODE_ENV: "test",
      WEB_ORIGIN: "http://localhost:5173",
      REVISION: "test-rev",
    });

    const app1 = await buildApp({ db: pool, config, clock: new FakeClock(), logger: false });
    const tenant = await registerTenant(app1, { email: "persist@test.invalid", orgName: "Org Persist" });

    const createdRes = await app1.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Projeto Persistente" },
    });
    expect(createdRes.statusCode).toBe(201);
    const project = createdRes.json() as ProjectResource;

    const patchedRes = await app1.inject({
      method: "PATCH",
      url: `/api/v1/projects/${project.id}`,
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Projeto Persistente 2" },
    });
    expect(patchedRes.statusCode).toBe(200);

    const accountRes = await app1.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Conta Persistente" },
    });
    expect(accountRes.statusCode).toBe(201);
    const accountId = (accountRes.json() as { id: string }).id;

    const releaseRes = await app1.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenant.cookieHeader },
      payload: {
        name: "Persistente",
        type: "WhatsList",
        projectId: project.id,
        accountIds: [accountId],
      },
    });
    expect(releaseRes.statusCode).toBe(201);
    expect((releaseRes.json() as ReleaseResource).projectId).toBe(project.id);
    await app1.close(); // "reinício": app fechado, banco permanece

    const app2 = await buildApp({ db: pool, config, clock: new FakeClock(), logger: false });
    const got = await app2.inject({
      method: "GET",
      url: `/api/v1/projects/${project.id}`,
      headers: { cookie: tenant.cookieHeader }, // sessão também persistiu
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toMatchObject({
      id: project.id,
      name: "Projeto Persistente 2", // PATCH persistiu
      releaseCount: 1, // counts REcomputados na leitura (não são estado)
      accountCount: 1,
      webhookCount: 0,
    });

    const releaseGot = await app2.inject({
      method: "GET",
      url: `/api/v1/releases/${(releaseRes.json() as ReleaseResource).id}`,
      headers: { cookie: tenant.cookieHeader },
    });
    expect((releaseGot.json() as ReleaseResource).projectId).toBe(project.id);

    // Oráculo independente (SQL direto, não a resposta da API): projects E
    // releases.project_uuid campo a campo; counts SEM colunas (T8).
    const projectRow = await pool.query(
      "SELECT org_id, name FROM projects WHERE id = $1",
      [project.id],
    );
    expect(projectRow.rows[0]).toMatchObject({ org_id: tenant.org.id, name: "Projeto Persistente 2" });
    const linkRow = await pool.query(
      "SELECT project_uuid FROM releases WHERE id = $1",
      [(releaseRes.json() as ReleaseResource).id],
    );
    expect(String(linkRow.rows[0].project_uuid)).toBe(project.id);
    const cols = await pool.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'projects'
        ORDER BY column_name`,
    );
    expect(cols.rows.map((r) => String(r.column_name))).toEqual([
      "created_at",
      "id",
      "name",
      "org_id",
      "updated_at",
    ]);

    await app2.close();
    await pool.end();
  });
});
