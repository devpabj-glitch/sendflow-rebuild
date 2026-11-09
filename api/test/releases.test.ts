// Releases (Fatia 3, contrato emendado pela DECISAO D13 do dono - ordem direta,
// precedencia maxima): seguir exatamente a API original SendFlow (sendapi).
// Rótulos ALINHADOS à numeração T1–T11 do contrato §6 (emendado):
// T1 CRUD feliz com os 3 tipos oficiais · T2 validações (incl. 'aleatorio' →
// 400 — PROIBIDO inventar, D13) · T3 busca/filtro archived/paginação ·
// T4 persistência (app re-instanciado sobre o mesmo banco) · T5 análogo CTA-03
// (release não gera grupo/link/ação/sessão; dedupe/replace da junção) ·
// T6 cruzado 2 orgs (404 byte a byte) · T7 401 sem sessão · T10 idempotência
// archive/unarchive · T11 Content-Type guard (D6). (T8 migração vive em
// migrations.test.ts; T9 regressão = gates em DEV/VERIFY.md.)
// Oráculo independente: leitura direta das tabelas pg-mem (não a resposta da API).
import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { loadConfig } from "../src/config.js";
import { buildApp } from "../src/app.js";
import { loadMigrationFiles, migrateUp } from "../src/db/migrate.js";
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

// D13: enum fechado — os 3 tipos EXATOS da API original. Nada além disso.
const OFFICIAL_TYPES = ["WhatsRelease", "WhatsList", "WhatsViralCampaign"] as const;

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

function postRelease(
  h: TestHarness,
  cookie: string,
  payload: Record<string, unknown>,
): Promise<ReturnType<TestHarness["app"]["inject"]>> {
  return h.app.inject({
    method: "POST",
    url: "/api/v1/releases",
    headers: { cookie },
    payload,
  });
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

describe("releases: CRUD, validações e tenant (contrato D13 T1–T3, T5–T7, T10/T11)", () => {
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
  it("T1: POST com cada um dos 3 tipos OFICIAIS → 201 flat exato (defaults D13)", async () => {
    for (const type of OFFICIAL_TYPES) {
      h.clock.advanceMs(2);
      const res = await postRelease(h, tenantA.cookieHeader, { name: `  Release ${type}  `, type });
      expect(res.statusCode, type).toBe(201);
      const body = res.json() as ReleaseResource;
      expect(Object.keys(body).sort()).toEqual([
        "accountIds",
        "archived",
        "createdAt",
        "id",
        "name",
        "projectId",
        "type",
        "updatedAt",
      ]);
      expect(body.name).toBe(`Release ${type}`); // trim antes de gravar
      expect(body.type).toBe(type);
      expect(body.projectId).toBeNull(); // default null (sem projeto nesta fatia)
      expect(body.archived).toBe(false); // default false (D13 substitui ativa/arquivada)
      expect(body.accountIds).toEqual([]); // sem associações
      expect(body.id).toMatch(UUID_RE);
      expect(body.createdAt).toMatch(ISO_RE);
      expect(body.updatedAt).toMatch(ISO_RE);

      // Oráculo: linha gravada na org da SESSÃO, sem junção.
      const rows = await h.pool.query(
        "SELECT org_id, name, type, project_uuid, archived FROM releases WHERE id = $1",
        [body.id],
      );
      expect(rows.rows[0]).toMatchObject({
        org_id: tenantA.org.id,
        name: `Release ${type}`,
        type,
        project_uuid: null,
        archived: false,
      });
    }
    await h.app.close();
  });

  it("T1: POST com accountIds próprios → flat inclui (dedupe!); GET /:id devolve igual; lista contém item", async () => {
    const account1 = await createAccount(h, tenantA.cookieHeader, "Conta Um");
    const account2 = await createAccount(h, tenantA.cookieHeader, "Conta Dois");

    // Duplicatas deduplicadas (semântica de conjunto): [a1,a2,a2,a1] → [a1,a2].
    const res = await postRelease(h, tenantA.cookieHeader, {
      name: "Com Contas",
      type: "WhatsList",
      accountIds: [account2, account1, account2, account1],
    });
    expect(res.statusCode).toBe(201);
    const release = res.json() as ReleaseResource;
    expect(release.accountIds).toEqual([account1, account2].sort()); // ordem lexicográfica

    // Oráculo: EXATAMENTE 1 linha por conta na junção (dedupe persistido).
    const join = await h.pool.query(
      "SELECT account_id FROM release_accounts WHERE release_id = $1 ORDER BY account_id",
      [release.id],
    );
    expect(join.rows.map((r) => String(r.account_id))).toEqual([account1, account2].sort());

    // GET /:id devolve igual (byte a byte no shape).
    const got = await h.app.inject({
      method: "GET",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(release);

    // Lista contém o item (com accountIds agregados) e total reflete.
    const list = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader },
    });
    const listBody = list.json() as { items: ReleaseResource[]; total: number };
    expect(listBody.total).toBe(1);
    expect(listBody.items[0].accountIds).toEqual([account1, account2].sort());
    await h.app.close();
  });

  it("T1: PATCH name/type → 200 refletido (updated_at anda); projectId persiste e LIMPA com null", async () => {
    // Ajuste declarado T10-ii: fixture text sintética ("proj-abc-123") virou
    // uuid de projeto criado na fixture (a validação agora é UUID — Fatia 6).
    const projectRes = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Projeto da Release" },
    });
    expect(projectRes.statusCode).toBe(201);
    const projectId = (projectRes.json() as { id: string }).id;

    const created = (await (await postRelease(h, tenantA.cookieHeader, {
      name: "Antes",
      type: "WhatsRelease",
      projectId,
    })).json()) as ReleaseResource;
    expect(created.projectId).toBe(projectId); // persiste (uuid com FK — Fatia 6 PRJ)

    h.clock.advanceMs(5_000);
    const patch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Depois", type: "WhatsViralCampaign" },
    });
    expect(patch.statusCode).toBe(200);
    const patched = patch.json() as ReleaseResource;
    expect(patched.name).toBe("Depois");
    expect(patched.type).toBe("WhatsViralCampaign");
    expect(patched.projectId).toBe(projectId); // não enviado → inalterado
    expect(Date.parse(patched.updatedAt)).toBeGreaterThan(Date.parse(created.updatedAt));
    expect(patched.createdAt).toBe(created.createdAt); // criação não muda

    // null explícito LIMPA o projectId.
    h.clock.advanceMs(5_000);
    const cleared = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { projectId: null },
    });
    expect(cleared.statusCode).toBe(200);
    expect((cleared.json() as ReleaseResource).projectId).toBeNull();
    const raw = await h.pool.query("SELECT project_uuid FROM releases WHERE id = $1", [created.id]);
    expect(raw.rows[0]).toMatchObject({ project_uuid: null });
    await h.app.close();
  });

  it("T1: PATCH accountIds substitui o conjunto por inteiro (semântica replace D13)", async () => {
    const account1 = await createAccount(h, tenantA.cookieHeader, "Conta Um");
    const account2 = await createAccount(h, tenantA.cookieHeader, "Conta Dois");
    const release = (await (await postRelease(h, tenantA.cookieHeader, {
      name: "Junção",
      type: "WhatsRelease",
      accountIds: [account1, account2],
    })).json()) as ReleaseResource;

    // Replace: [a1,a2] → [a1] (a2 sai da junção, não fica "acumulada").
    const patch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { accountIds: [account1] },
    });
    expect(patch.statusCode).toBe(200);
    expect((patch.json() as ReleaseResource).accountIds).toEqual([account1]);
    const join1 = await h.pool.query(
      "SELECT account_id FROM release_accounts WHERE release_id = $1",
      [release.id],
    );
    expect(join1.rows).toHaveLength(1);

    // Replace por vazio: conjunto zerado.
    const emptied = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { accountIds: [] },
    });
    expect(emptied.statusCode).toBe(200);
    expect((emptied.json() as ReleaseResource).accountIds).toEqual([]);
    const join2 = await h.pool.query(
      "SELECT count(*)::int AS n FROM release_accounts WHERE release_id = $1",
      [release.id],
    );
    expect(join2.rows[0]).toMatchObject({ n: 0 });

    // PATCH sem accountIds: conjunto vigente preservado.
    const untouched = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Só Nome" },
    });
    expect((untouched.json() as ReleaseResource).accountIds).toEqual([]);
    await h.app.close();
  });

  it("T1: archive → 200 archived:true; unarchive → 200 archived:false (D12/D13)", async () => {
    const release = (await (await postRelease(h, tenantA.cookieHeader, {
      name: "Para Arquivar",
      type: "WhatsList",
    })).json()) as ReleaseResource;

    h.clock.advanceMs(1_000);
    const archive = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/archive`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(archive.statusCode).toBe(200);
    expect((archive.json() as ReleaseResource).archived).toBe(true);

    h.clock.advanceMs(1_000);
    const unarchive = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/unarchive`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(unarchive.statusCode).toBe(200);
    expect((unarchive.json() as ReleaseResource).archived).toBe(false);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T2
  it("T2: type ausente → 400 fields ['type']; 'aleatorio' → 400 (D13: PROIBIDO inventar); minúsculas/estrangeiros → 400", async () => {
    // Ausente (schema required).
    const missing = await postRelease(h, tenantA.cookieHeader, { name: "X" });
    expect(missing.statusCode).toBe(400);
    expect((missing.json() as { error: { code: string; details?: { fields: string[] } } }).error).toMatchObject({
      code: "VALIDATION_ERROR",
    });
    expect(
      ((missing.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["type"]);

    // Caso explícito da D13: 'aleatorio' NÃO existe. Nem minúsculas do
    // oficial, nem valores do rascunho pré-D13, nem tipo numérico.
    for (const type of [
      "aleatorio",
      "Aleatorio",
      "campanha",
      "lista",
      "campanha_viral",
      "whatsrelease",
      "whats-list",
      "Whats Release",
      "Random",
      "",
      123,
    ]) {
      const res = await postRelease(h, tenantA.cookieHeader, { name: "X", type });
      expect(res.statusCode, `type=${JSON.stringify(type)}`).toBe(400);
      const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual(["type"]);
    }

    // Oráculo: nenhuma release gravada pelas tentativas rejeitadas.
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    expect(rows.rows[0]).toMatchObject({ n: 0 });
    await h.app.close();
  });

  it("T2: name vazio/só espaços/121 → 400 fields ['name']; 120 passa; projectId não-UUID (legado text) → 400; null aceito", async () => {
    for (const name of ["", "   ", "a".repeat(121)]) {
      const res = await postRelease(h, tenantA.cookieHeader, { name, type: "WhatsRelease" });
      expect(res.statusCode, `name=${JSON.stringify(name.slice(0, 8))}…`).toBe(400);
      expect(
        ((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
      ).toEqual(["name"]);
    }
    const ok = await postRelease(h, tenantA.cookieHeader, {
      name: "a".repeat(120),
      type: "WhatsRelease",
    });
    expect(ok.statusCode).toBe(201);

    // Ajuste declarado T10-ii: a validação de projectId agora é UUID + existe
    // + mesma org (Fatia 6 PRJ); o comprimento >120 cai no mesmo 400 genérico.
    for (const projectId of ["p".repeat(121), "proj-abc-123", 42]) {
      const res = await postRelease(h, tenantA.cookieHeader, {
        name: "X",
        type: "WhatsRelease",
        projectId,
      });
      expect(res.statusCode, `projectId=${JSON.stringify(String(projectId).slice(0, 6))}…`).toBe(400);
      expect(
        ((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
      ).toEqual(["projectId"]);
    }
    // projectId null no POST = nasce sem projeto (aceito, D13/Fatia 6).
    const nullOk = await postRelease(h, tenantA.cookieHeader, {
      name: "Sem Projeto",
      type: "WhatsList",
      projectId: null,
    });
    expect(nullOk.statusCode).toBe(201);
    expect((nullOk.json() as ReleaseResource).projectId).toBeNull();

    // Só a válida + a null foram gravadas.
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    expect(rows.rows[0]).toMatchObject({ n: 2 });
    await h.app.close();
  });

  it("T2: accountIds não-array/não-UUID/inexistente/conta de OUTRA org → 400 fields ['accountIds'] genérico", async () => {
    const own = await createAccount(h, tenantA.cookieHeader, "Conta Própria");
    const foreign = await createAccount(h, tenantB.cookieHeader, "Conta da Beta");

    const cases: [string, unknown][] = [
      ["não-array (string)", "not-an-array"],
      ["elemento não-UUID", ["nao-e-um-uuid"]],
      ["UUID inexistente", [randomUUID()]],
      ["conta de outra org", [foreign]],
      ["mistura própria+alheia", [own, foreign]],
    ];
    for (const [label, accountIds] of cases) {
      const res = await postRelease(h, tenantA.cookieHeader, {
        name: "X",
        type: "WhatsRelease",
        accountIds,
      });
      expect(res.statusCode, label).toBe(400);
      const body = res.json() as {
        error: { code: string; message: string; details?: { fields: string[] } };
      };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Entrada inválida."); // mensagem genérica
      expect(body.error.details?.fields).toEqual(["accountIds"]); // sem revelar quais
    }

    // Oráculo: nada gravado (nem release, nem junção) pelas tentativas.
    const releases = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    const joins = await h.pool.query("SELECT count(*)::int AS n FROM release_accounts");
    expect(releases.rows[0]).toMatchObject({ n: 0 });
    expect(joins.rows[0]).toMatchObject({ n: 0 });
    await h.app.close();
  });

  // -------------------------------------- Pós-auditoria F3 (code-review, achados 1/3/4)
  it("PÓS-AUDITORIA F3 (achado 1): POST accountIds com o MESMO uuid em caixa alta e baixa → 201 com 1 associação canônica minúscula", async () => {
    const account = await createAccount(h, tenantA.cookieHeader, "Conta Caixa");
    const res = await postRelease(h, tenantA.cookieHeader, {
      name: "Caixa Única",
      type: "WhatsList",
      accountIds: [account.toUpperCase(), account],
    });
    expect(res.statusCode).toBe(201);
    const release = res.json() as ReleaseResource;
    expect(release.accountIds).toEqual([account]); // dedupe case-insensitive, canônico minúsculo
    // Oráculo: exatamente 1 linha na junção, com o id em caixa baixa.
    const join = await h.pool.query(
      "SELECT account_id FROM release_accounts WHERE release_id = $1",
      [release.id],
    );
    expect(join.rows).toHaveLength(1);
    expect(String(join.rows[0].account_id)).toBe(account);
    await h.app.close();
  });

  it("PÓS-AUDITORIA F3 (achado 3): POST com body null LITERAL (Content-Type json, corpo \"null\") → 400 fields ['body']", async () => {
    // JSON.parse("null") devolve null (não undefined): o guard `== null`
    // cobre o null literal → 400, nunca 500 por TypeError no cast.
    const nullBody = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: "null",
    });
    expect(nullBody.statusCode).toBe(400);
    expect(
      ((nullBody.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["body"]);
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    expect(rows.rows[0]).toMatchObject({ n: 0 }); // nada criado
    await h.app.close();
  });

  it("PÓS-AUDITORIA F3 (achado 4): POST accountIds [123] → 400 fields ['accountIds'] (primeiro segmento, sem índice)", async () => {
    // Item não-string: o ajv aponta instancePath "/accountIds/0" — o handler
    // extrai só o PRIMEIRO segmento → "accountIds", nunca "accountIds/0".
    const numeric = await postRelease(h, tenantA.cookieHeader, {
      name: "X",
      type: "WhatsRelease",
      accountIds: [123],
    });
    expect(numeric.statusCode).toBe(400);
    expect(
      ((numeric.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["accountIds"]);
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    expect(rows.rows[0]).toMatchObject({ n: 0 }); // nada criado
    await h.app.close();
  });

  it("T2: campos proibidos no body (org_id/archived/status/id/accountId singular) → 400 com details", async () => {
    for (const extra of [
      { org_id: randomUUID() },
      { archived: true },
      { status: "arquivada" },
      { id: randomUUID() },
      { accountId: randomUUID() },
    ]) {
      const res = await postRelease(h, tenantA.cookieHeader, {
        name: "X",
        type: "WhatsRelease",
        ...extra,
      });
      expect(res.statusCode, JSON.stringify(extra)).toBe(400);
      const body = res.json() as { error: { details?: { fields: string[] } } };
      expect(body.error.details?.fields).toEqual([Object.keys(extra)[0]]);
    }

    // PATCH idem: archived NUNCA em body (D12/D13).
    const release = (await (await postRelease(h, tenantA.cookieHeader, {
      name: "Ok",
      type: "WhatsRelease",
    })).json()) as ReleaseResource;
    const patchArchived = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { archived: true },
    });
    expect(patchArchived.statusCode).toBe(400);
    expect(
      ((patchArchived.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["archived"]);

    // PATCH {} → 400 (≥1 campo).
    const empty = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: {},
    });
    expect(empty.statusCode).toBe(400);
    expect(((empty.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);

    // Oráculo: a release segue archived=false (nada mudou pelas tentativas).
    const raw = await h.pool.query("SELECT archived FROM releases WHERE id = $1", [release.id]);
    expect(raw.rows[0]).toMatchObject({ archived: false });
    await h.app.close();
  });

  it("T2: query — archived=maybe → 400; page=0/pageSize=101 → 400; :id malformado → 400", async () => {
    for (const qs of ["archived=maybe", "archived=1", "archived=TRUE", "page=0", "page=abc", "pageSize=101"]) {
      const res = await h.app.inject({
        method: "GET",
        url: `/api/v1/releases?${qs}`,
        headers: { cookie: tenantA.cookieHeader },
      });
      expect(res.statusCode, qs).toBe(400);
      const body = res.json() as { error: { details?: { fields: string[] } } };
      expect(body.error.details?.fields).toEqual([qs.split("=")[0]]);
    }
    // :id malformado → 400 por FORMATO (independente de tenant), com fields.
    const idCases: { method: "GET" | "PATCH" | "POST"; url: string; withPayload: boolean }[] = [
      { method: "GET", url: "/api/v1/releases/nao-e-um-uuid", withPayload: false },
      { method: "PATCH", url: "/api/v1/releases/nao-e-um-uuid", withPayload: true },
      { method: "POST", url: "/api/v1/releases/nao-e-um-uuid/archive", withPayload: false },
    ];
    for (const call of idCases) {
      const res = call.withPayload
        ? await h.app.inject({
            method: call.method,
            url: call.url,
            headers: { cookie: tenantA.cookieHeader },
            payload: { name: "X" },
          })
        : await h.app.inject({
            method: call.method,
            url: call.url,
            headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
          });
      expect(res.statusCode, `${call.method} ${call.url}`).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["id"]);
    }
    await h.app.close();
  });

  // ------------------------------------------------------------------- T3
  it("T3: filtro archived=true/false/ausente, busca CI, paginação e ordenação", async () => {
    // Estado vazio primeiro (UI-01).
    const empty = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });

    const account = await createAccount(h, tenantA.cookieHeader, "Conta da Lista");
    const mk = async (name: string, type: (typeof OFFICIAL_TYPES)[number], accountIds?: string[]) => {
      h.clock.advanceMs(2);
      const res = await postRelease(h, tenantA.cookieHeader, { name, type, accountIds });
      expect(res.statusCode).toBe(201);
      return res.json() as ReleaseResource;
    };
    await mk("Promo Alpha", "WhatsRelease");
    const withAccounts = await mk("Lista Beta", "WhatsList", [account]);
    await mk("Viral Gama", "WhatsViralCampaign");
    const archivedOne = await mk("Promo Arquivada", "WhatsRelease");
    const arch = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${archivedOne.id}/archive`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(arch.statusCode).toBe(200);

    // Filtro archived: 1 arquivada, 3 não-arquivadas, ausente = todas (4).
    const onlyArchived = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?archived=true",
      headers: { cookie: tenantA.cookieHeader },
    });
    const archivedBody = onlyArchived.json() as { items: ReleaseResource[]; total: number };
    expect(archivedBody.total).toBe(1);
    expect(archivedBody.items[0].name).toBe("Promo Arquivada");
    expect(archivedBody.items[0].archived).toBe(true);

    const notArchived = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?archived=false",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((notArchived.json() as { total: number; items: ReleaseResource[] }).total).toBe(3);
    expect(
      (notArchived.json() as { items: ReleaseResource[] }).items.every((i) => !i.archived),
    ).toBe(true);

    const all = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((all.json() as { total: number }).total).toBe(4);

    // Busca CI por substring + filtro combinado; itens incluem accountIds.
    const search = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?search=promo&archived=false",
      headers: { cookie: tenantA.cookieHeader },
    });
    const searchBody = search.json() as { items: ReleaseResource[]; total: number };
    expect(searchBody.total).toBe(1);
    expect(searchBody.items[0].name).toBe("Promo Alpha");

    const byAccount = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?search=lista%20beta",
      headers: { cookie: tenantA.cookieHeader },
    });
    const byAccountBody = byAccount.json() as { items: ReleaseResource[]; total: number };
    expect(byAccountBody.total).toBe(1);
    expect(byAccountBody.items[0].id).toBe(withAccounts.id);
    expect(byAccountBody.items[0].accountIds).toEqual([account]);

    // Ordenação created_at DESC (desempate id): a arquivada (última criada) primeiro.
    const ordered = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?pageSize=2",
      headers: { cookie: tenantA.cookieHeader },
    });
    const orderedBody = ordered.json() as { items: ReleaseResource[]; total: number; page: number; pageSize: number };
    expect(orderedBody.items.map((i) => i.name)).toEqual(["Promo Arquivada", "Viral Gama"]);
    expect(orderedBody.total).toBe(4);
    expect(orderedBody.page).toBe(1);
    expect(orderedBody.pageSize).toBe(2);

    // Página além do fim: items vazio, total preservado.
    const beyond = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?page=99",
      headers: { cookie: tenantA.cookieHeader },
    });
    const beyondBody = beyond.json() as { items: unknown[]; total: number };
    expect(beyondBody.items).toEqual([]);
    expect(beyondBody.total).toBe(4);

    // Nome CONTENDO curinga é encontrável por termo limpo (ressalva pg-mem F2 §9.1).
    await mk("Beta 100%", "WhatsRelease");
    const pct = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases?search=100",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((pct.json() as { total: number }).total).toBe(1);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T5
  it("T5 (análogo CTA-03): criar/editar/arquivar release NÃO gera grupo/link/ação/sessão/métrica", async () => {
    // Ajuste declarado T10-ii: projectId da fixture agora é uuid real (Fatia 6).
    const projectRes = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Projeto Isolado" },
    });
    expect(projectRes.statusCode).toBe(201);
    const projectId = (projectRes.json() as { id: string }).id;

    const sessionsBefore = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    const accountsBefore = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    const tablesBefore = await h.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );

    const created = await postRelease(h, tenantA.cookieHeader, { name: "Isolada", type: "WhatsRelease" });
    expect(created.statusCode).toBe(201);
    const release = created.json() as ReleaseResource;

    h.clock.advanceMs(1_000);
    const patched = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Isolada 2", projectId },
    });
    expect(patched.statusCode).toBe(200);
    const archived = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/archive`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(archived.statusCode).toBe(200);

    // (a) contagens de sessions e accounts INALTERADAS (release sem accountIds).
    const sessionsAfter = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    const accountsAfter = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    expect(sessionsAfter.rows[0]).toEqual(sessionsBefore.rows[0]);
    expect(accountsAfter.rows[0]).toEqual(accountsBefore.rows[0]);

    // (b) conjunto exato de tabelas: nada de links/ações/sessões nasceu.
    // (Fatia 5, ajuste aditivo declarado: groups da 006; Fatia 6 idem:
    // projects da 007 — o conjunto do T5 acompanha o schema vigente.)
    const tablesAfter = await h.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );
    const names = (rows: { rows: Record<string, unknown>[] }) =>
      rows.rows.map((r) => String(r.table_name)).sort();
    expect(names(tablesAfter)).toEqual([
      "accounts",
      "groups",
      "migrations",
      "organizations",
      "projects",
      "release_accounts",
      "releases",
      "sessions",
      "users",
    ]);
    expect(names(tablesAfter)).toEqual(names(tablesBefore));

    // (c) leitura direta: colunas da linha = nome/tipo/project_uuid/archived + auditoria.
    const raw = await h.pool.query(
      "SELECT name, type, project_uuid, archived, created_at, updated_at FROM releases WHERE id = $1",
      [release.id],
    );
    expect(Object.keys(raw.rows[0]).sort()).toEqual(["archived", "created_at", "name", "project_uuid", "type", "updated_at"]);
    expect(raw.rows[0]).toMatchObject({ name: "Isolada 2", type: "WhatsRelease", project_uuid: projectId, archived: true });

    // (d) junção vazia (sem accountIds) + resposta sem campo de grupo/link/ação/métrica.
    const joins = await h.pool.query(
      "SELECT count(*)::int AS n FROM release_accounts WHERE release_id = $1",
      [release.id],
    );
    expect(joins.rows[0]).toMatchObject({ n: 0 });
    const serialized = JSON.stringify(release) + JSON.stringify(patched.json()) + JSON.stringify(archived.json());
    expect(serialized).not.toMatch(/group|grupo|link|acao|action|metric|kpi|period/i);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T6
  it("T6 (TEN-01): cruzado A↔B — 404 byte a byte idêntico ao de UUID inexistente; accountIds alheio → 400", async () => {
    const accountA = await createAccount(h, tenantA.cookieHeader, "Conta da Alfa");
    const created = await postRelease(h, tenantA.cookieHeader, {
      name: "Só da Alfa",
      type: "WhatsRelease",
      accountIds: [accountA],
    });
    expect(created.statusCode).toBe(201);
    const release = created.json() as ReleaseResource;

    // Referência: UUID bem-formado inexistente, com a sessão de B.
    const nonexistent = await h.app.inject({
      method: "GET",
      url: `/api/v1/releases/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(nonexistent.statusCode).toBe(404);
    expect((nonexistent.json() as { error: { code: string } }).error.code).toBe("TENANT_FORBIDDEN");

    // B lê/arquiva/desarquiva/edita release de A → 404 com corpo IDÊNTICO byte a byte.
    const bGet = await h.app.inject({
      method: "GET",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(bGet.statusCode).toBe(404);
    expect(bGet.body).toBe(nonexistent.body);

    const bPatch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Roubada" },
    });
    const bArchive = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/archive`,
      headers: { cookie: tenantB.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    const bUnarchive = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/unarchive`,
      headers: { cookie: tenantB.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    for (const res of [bPatch, bArchive, bUnarchive]) {
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe(nonexistent.body);
    }

    // PATCH/archive de inexistente → 404 idêntico.
    const bPatchMissing = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Nada" },
    });
    expect(bPatchMissing.statusCode).toBe(404);
    expect(bPatchMissing.body).toBe(nonexistent.body);

    // B referenciar a CONTA de A em accountIds → 400 genérico (não vaza existência).
    const bWithForeignAccount = await postRelease(h, tenantB.cookieHeader, {
      name: "Da Beta",
      type: "WhatsList",
      accountIds: [accountA],
    });
    expect(bWithForeignAccount.statusCode).toBe(400);
    expect(
      ((bWithForeignAccount.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["accountIds"]);

    // Lista de B não contém a release de A; B não ganhou nada.
    const bList = await h.app.inject({
      method: "GET",
      url: "/api/v1/releases",
      headers: { cookie: tenantB.cookieHeader },
    });
    expect((bList.json() as { items: unknown[]; total: number }).total).toBe(0);

    // Snapshot: nada de A foi alterado pelas tentativas de B.
    const aGet = await h.app.inject({
      method: "GET",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(aGet.statusCode).toBe(200);
    expect(aGet.json()).toEqual(release); // arquivamento de B não passou
    const releasesCount = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    const joinsCount = await h.pool.query("SELECT count(*)::int AS n FROM release_accounts");
    expect(releasesCount.rows[0]).toMatchObject({ n: 1 });
    expect(joinsCount.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  // ------------------------------------------------------------------- T7
  it("T7: sem sessão: POST/lista/GET :id/PATCH/archive/unarchive → 401 AUTH_UNAUTHENTICATED", async () => {
    const id = randomUUID();
    // Ações sem corpo: header json explícito (sem payload o inject NÃO seta
    // content-type; o guard D6 responderia 400 antes do 401 — precedência
    // declarada no contrato F2 §3.5. Com json válido, 401 vem primeiro).
    const jsonHeader = { "content-type": "application/json" };
    const calls = [
      { method: "POST" as const, url: "/api/v1/releases", payload: { name: "X", type: "WhatsRelease" } },
      { method: "GET" as const, url: "/api/v1/releases" },
      { method: "GET" as const, url: `/api/v1/releases/${id}` },
      { method: "PATCH" as const, url: `/api/v1/releases/${id}`, payload: { name: "Y" } },
      { method: "POST" as const, url: `/api/v1/releases/${id}/archive`, headers: jsonHeader },
      { method: "POST" as const, url: `/api/v1/releases/${id}/unarchive`, headers: jsonHeader },
    ];
    for (const call of calls) {
      const res = await h.app.inject({ ...call }); // SEM cookie
      expect(res.statusCode, `${call.method} ${call.url}`).toBe(401);
      expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");
    }
    await h.app.close();
  });

  // ------------------------------------------------------------ T10/T11
  it("T10 (D12): ações idempotentes — archive 2x → 200 mesmo valor; unarchive idem; nenhum outro campo muda", async () => {
    // Ajuste declarado T10-ii: "proj-fixo" virou uuid de projeto da fixture.
    const projectRes = await h.app.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Projeto Fixo" },
    });
    expect(projectRes.statusCode).toBe(201);
    const projectId = (projectRes.json() as { id: string }).id;

    const account = await createAccount(h, tenantA.cookieHeader, "Conta Estável");
    const release = (await (await postRelease(h, tenantA.cookieHeader, {
      name: "Estável",
      type: "WhatsViralCampaign",
      projectId,
      accountIds: [account],
    })).json()) as ReleaseResource;

    const call = async (action: "archive" | "unarchive"): Promise<ReleaseResource> => {
      h.clock.advanceMs(1_000); // updated_at sempre avança (relógio falso)
      const res = await h.app.inject({
        method: "POST",
        url: `/api/v1/releases/${release.id}/${action}`,
        headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      return res.json() as ReleaseResource;
    };

    const a1 = await call("archive");
    expect(a1.archived).toBe(true);
    const a2 = await call("archive"); // 2x: sem 409/422, mesmo valor
    expect(a2.archived).toBe(true);
    expect(Date.parse(a2.updatedAt)).toBeGreaterThanOrEqual(Date.parse(a1.updatedAt)); // monotônico
    const { archived: _a, updatedAt: _u, ...restA1 } = a1;
    const { archived: _b, updatedAt: _v, ...restA2 } = a2;
    expect(restA2).toEqual(restA1); // nenhum outro campo muda

    const u1 = await call("unarchive");
    expect(u1.archived).toBe(false);
    const u2 = await call("unarchive");
    expect(u2.archived).toBe(false);
    const { archived: _c, updatedAt: _w, ...restU1 } = u1;
    const { archived: _d, updatedAt: _x, ...restU2 } = u2;
    expect(restU2).toEqual(restU1);

    // Sequência archive→unarchive→archive termina arquivada.
    const seq = await call("archive");
    await call("unarchive");
    const end = await call("archive");
    expect(seq.archived).toBe(true);
    expect(end.archived).toBe(true);
    await h.app.close();
  });

  it("T11 (D6): POST text/plain/urlencoded/sem header → 400 fields ['content-type']; charset ok; ações com corpo ausente → 200", async () => {
    // urlencoded (forma que um formulário HTML de atacante produz) → 400, nunca 415.
    const urlencoded = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/x-www-form-urlencoded" },
      payload: "name=Ataque+CSRF&type=WhatsRelease",
    });
    expect(urlencoded.statusCode).toBe(400);
    expect(
      ((urlencoded.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["content-type"]);

    const textPlain = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
      payload: '{"name":"Ataque","type":"WhatsRelease"}',
    });
    expect(textPlain.statusCode).toBe(400);
    expect(
      ((textPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["content-type"]);

    // Sem header nenhum → 400 (guard precede; nada criado).
    const noHeader = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(noHeader.statusCode).toBe(400);
    expect(
      ((noHeader.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["content-type"]);
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    expect(rows.rows[0]).toMatchObject({ n: 0 });

    // charset é parâmetro aceito (media type application/json).
    const charsetOk = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json; charset=utf-8" },
      payload: { name: "Com Charset", type: "WhatsRelease" },
    });
    expect(charsetOk.statusCode).toBe(201);
    const release = charsetOk.json() as ReleaseResource;

    // Corpo AUSENTE com json nas rotas com schema (parser escopado entrega
    // undefined; o ajv NÃO valida body undefined) → 400 fields ["body"],
    // nunca 500 por TypeError.
    const postNoBody = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
    });
    expect(postNoBody.statusCode).toBe(400);
    expect(((postNoBody.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);
    const patchNoBody = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
    });
    expect(patchNoBody.statusCode).toBe(400);
    expect(((patchNoBody.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);

    // JSON malformado → 400 VALIDATION_ERROR (mesma semântica do parser default).
    const malformed = await h.app.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: "{not json",
    });
    expect(malformed.statusCode).toBe(400);
    expect((malformed.json() as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");

    // Ações: header json + CORPO AUSENTE → 200 (T11 do contrato).
    const archiveNoBody = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/archive`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
    });
    expect(archiveNoBody.statusCode).toBe(200);
    expect((archiveNoBody.json() as ReleaseResource).archived).toBe(true);

    // Ação com text/plain → 400 (guard uniforme).
    const unarchiveTextPlain = await h.app.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/unarchive`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
      payload: "{}",
    });
    expect(unarchiveTextPlain.statusCode).toBe(400);
    expect(
      ((unarchiveTextPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields),
    ).toEqual(["content-type"]);
    await h.app.close();
  });
});

// --------------------------------------------------------------------- T4
describe("releases: persistência (T4 — app re-instanciado sobre o MESMO banco)", () => {
  it("release criada (com projectId e accountIds) no app #1 é relida idêntica pelo app #2 e pelo oráculo SQL", async () => {
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
    const accountRes = await app1.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Conta Persistente" },
    });
    expect(accountRes.statusCode).toBe(201);
    const accountId = (accountRes.json() as { id: string }).id;

    // Ajuste declarado T10-ii: "proj-persist" virou uuid de projeto da fixture.
    const projectRes = await app1.inject({
      method: "POST",
      url: "/api/v1/projects",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Projeto Persistente" },
    });
    expect(projectRes.statusCode).toBe(201);
    const projectId = (projectRes.json() as { id: string }).id;

    const created = await app1.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Persistente", type: "WhatsList", projectId, accountIds: [accountId] },
    });
    expect(created.statusCode).toBe(201);
    const release = created.json() as ReleaseResource;

    const archived = await app1.inject({
      method: "POST",
      url: `/api/v1/releases/${release.id}/archive`,
      headers: { cookie: tenant.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(archived.statusCode).toBe(200);
    const archivedRelease = archived.json() as ReleaseResource;
    await app1.close(); // "reinício": app fechado, banco permanece

    const app2 = await buildApp({ db: pool, config, clock: new FakeClock(), logger: false });
    const got = await app2.inject({
      method: "GET",
      url: `/api/v1/releases/${release.id}`,
      headers: { cookie: tenant.cookieHeader }, // sessão também persistiu
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(archivedRelease); // archived:true persistiu

    // Lista também reflete (total + accountIds no item).
    const list = await app2.inject({
      method: "GET",
      url: "/api/v1/releases?archived=true",
      headers: { cookie: tenant.cookieHeader },
    });
    const listBody = list.json() as { items: ReleaseResource[]; total: number };
    expect(listBody.total).toBe(1);
    expect(listBody.items[0].accountIds).toEqual([accountId]);

    // Oráculo independente (query SQL direta, não a resposta da API).
    const rows = await pool.query(
      "SELECT org_id, name, type, project_uuid, archived FROM releases WHERE id = $1",
      [release.id],
    );
    expect(rows.rows[0]).toMatchObject({
      org_id: tenant.org.id,
      name: "Persistente",
      type: "WhatsList",
      project_uuid: projectId,
      archived: true,
    });
    const joins = await pool.query(
      "SELECT release_id, account_id FROM release_accounts WHERE release_id = $1",
      [release.id],
    );
    expect(joins.rows).toHaveLength(1);
    expect(String(joins.rows[0].account_id)).toBe(accountId);

    await app2.close();
    await pool.end();
  });
});
