// Contas (Fatia 2, contrato §§3–6): CRUD escopado por tenant.
// Rótulos ALINHADOS à numeração T1–T10 do contrato §6 (achado #6 do code-review):
// T1 CRUD feliz · T2 validações · T3 busca/paginação (inclui estado vazio UI-01)
// · T4 persistência (app re-instanciado sobre o mesmo banco) · T5 CTA-03
// (conta ≠ sessão/conexão/ID externo) · T6 cruzado 2 orgs (TEN-01 completa,
// 404 byte a byte) · T7 401 sem sessão · T10 Content-Type guard (D6, agora em
// preParsing — achado #2) + preflight CORS. (T8 migração vive em
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

interface AccountResource {
  id: string;
  name: string;
  type: string;
  isSpy: boolean;
  connectionStatus: string;
  createdAt: string;
  updatedAt: string;
}

function postAccount(
  h: TestHarness,
  cookie: string,
  payload: Record<string, unknown>,
): Promise<ReturnType<TestHarness["app"]["inject"]>> {
  return h.app.inject({
    method: "POST",
    url: "/api/v1/accounts",
    headers: { cookie },
    payload,
  });
}

describe("accounts: CRUD, validações e tenant (contrato T1–T3, T5–T7, T10)", () => {
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
  it("T1: POST só com name → 201 flat exato (trim, defaults, sem campo de conexão)", async () => {
    const res = await postAccount(h, tenantA.cookieHeader, { name: "  Loja Principal  " });
    expect(res.statusCode).toBe(201);

    const body = res.json() as AccountResource;
    expect(Object.keys(body).sort()).toEqual([
      "connectionStatus",
      "createdAt",
      "id",
      "isSpy",
      "name",
      "type",
      "updatedAt",
    ]);
    expect(body.name).toBe("Loja Principal"); // trim aplicado antes de gravar
    expect(body.type).toBe("WhatsApp"); // default §3.3
    expect(body.isSpy).toBe(false); // default §3.3
    expect(body.connectionStatus).toBe("nao_conectada"); // único estado honesto
    expect(body.id).toMatch(UUID_RE);
    expect(body.createdAt).toMatch(ISO_RE);
    expect(body.updatedAt).toMatch(ISO_RE);

    // Oráculo: linha gravada na org da SESSÃO com os mesmos valores.
    const rows = await h.pool.query(
      "SELECT org_id, name, type, is_spy, connection_status FROM accounts WHERE id = $1",
      [body.id],
    );
    expect(rows.rows[0]).toMatchObject({
      org_id: tenantA.org.id,
      name: "Loja Principal",
      type: "WhatsApp",
      is_spy: false,
      connection_status: "nao_conectada",
    });
    await h.app.close();
  });

  it("T1/T3: lista com busca e paginação — 25 contas, page=2 pageSize=10 → 10 itens, total 25; ordenação created_at DESC", async () => {
    // Estado vazio primeiro (UI-01): {items:[], total:0, page:1, pageSize:20}.
    const empty = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });

    // 25 contas com timestamps distintos (relógio falso avança 2 ms por criação).
    for (let i = 1; i <= 25; i++) {
      h.clock.advanceMs(2);
      const res = await postAccount(h, tenantA.cookieHeader, {
        name: `Conta ${String(i).padStart(2, "0")}`,
      });
      expect(res.statusCode).toBe(201);
    }

    const page2 = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts?page=2&pageSize=10",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(page2.statusCode).toBe(200);
    const body = page2.json() as { items: AccountResource[]; total: number; page: number; pageSize: number };
    expect(body.total).toBe(25);
    expect(body.page).toBe(2);
    expect(body.pageSize).toBe(10);
    expect(body.items).toHaveLength(10);
    // Novas primeiro: página 2 = 15ª..6ª mais recentes.
    expect(body.items.map((i) => i.name)).toEqual([
      "Conta 15", "Conta 14", "Conta 13", "Conta 12", "Conta 11",
      "Conta 10", "Conta 09", "Conta 08", "Conta 07", "Conta 06",
    ]);

    // Busca case-insensitive por substring: "cOnTa 0" → Conta 01..Conta 09.
    const search = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts?search=cOnTa%200",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(search.statusCode).toBe(200);
    const searchBody = search.json() as { items: AccountResource[]; total: number };
    expect(searchBody.total).toBe(9);
    expect(searchBody.items.every((i) => /conta 0\d/i.test(i.name))).toBe(true);

    // Nome CONTENDO curinga é encontrável por termo limpo (ressalva pg-mem: a
    // literalidade de curingas no TERMO só é demonstrável contra PostgreSQL real).
    await postAccount(h, tenantA.cookieHeader, { name: "Beta 100%" });
    const pct = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts?search=100",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(pct.statusCode).toBe(200);
    expect((pct.json() as { total: number }).total).toBe(1);

    // Termo COM curinga não quebra (comportamento entre motores documentado).
    const wild = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts?search=100%25",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(wild.statusCode).toBe(200);
    expect(typeof (wild.json() as { total: number }).total).toBe("number");

    // Página além do fim: items vazio, total preservado (contrato T3).
    const beyond = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts?page=99",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(beyond.statusCode).toBe(200);
    const beyondBody = beyond.json() as { items: unknown[]; total: number };
    expect(beyondBody.items).toEqual([]);
    expect(beyondBody.total).toBe(26);
    await h.app.close();
  });

  it("T1: PATCH name → 200 refletido (updated_at anda); GET /:id devolve igual", async () => {
    const created = (await (await postAccount(h, tenantA.cookieHeader, { name: "Antes" })).json()) as AccountResource;

    h.clock.advanceMs(5_000);
    const patch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Depois" },
    });
    expect(patch.statusCode).toBe(200);
    const patched = patch.json() as AccountResource;
    expect(patched.name).toBe("Depois");
    expect(patched.type).toBe("WhatsApp"); // não enviado → inalterado
    expect(patched.isSpy).toBe(false);
    expect(Date.parse(patched.updatedAt)).toBeGreaterThan(Date.parse(created.updatedAt));
    expect(patched.createdAt).toBe(created.createdAt); // criação não muda

    // PATCH de vários campos de uma vez.
    h.clock.advanceMs(5_000);
    const patchAll = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Depois 2", type: "Instagram", isSpy: true },
    });
    expect(patchAll.statusCode).toBe(200);
    const patchedAll = patchAll.json() as AccountResource;
    expect(patchedAll).toMatchObject({ name: "Depois 2", type: "Instagram", isSpy: true });

    const got = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(patchedAll);
    await h.app.close();
  });

  it("T3 (UI-01): lista com 0 itens → 200 com total 0 e items [] (transação de leitura vazia)", async () => {
    // Caso dirigido do achado #1: 0 linhas na transação COUNT×SELECT — o total
    // não pode sumir nem virar undefined (era a borda da corrida corrigida).
    const res = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts",
      headers: { cookie: tenantB.cookieHeader }, // tenant B recém-registrado: zero contas
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    await h.app.close();
  });

  // ------------------------------------------------------------------- T2
  it("T2: name vazio/só espaços/121 chars → 400 com details.fields; 120 chars passa", async () => {
    for (const name of ["", "   ", "a".repeat(121)]) {
      const res = await postAccount(h, tenantA.cookieHeader, { name });
      expect(res.statusCode, `name=${JSON.stringify(name.slice(0, 8))}…`).toBe(400);
      const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual(["name"]);
    }
    // Limite exato do contrato (1..120 pós-trim) aceito.
    const ok = await postAccount(h, tenantA.cookieHeader, { name: "a".repeat(120) });
    expect(ok.statusCode).toBe(201);

    // Oráculo: só a conta válida foi gravada.
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    expect(rows.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  it("T2: type vazio/só espaços/61 chars → 400; 60 chars passa; isSpy ausente → default false", async () => {
    for (const type of ["", "   ", "b".repeat(61)]) {
      const res = await postAccount(h, tenantA.cookieHeader, { name: "X", type });
      expect(res.statusCode, `type=${JSON.stringify(type.slice(0, 8))}…`).toBe(400);
      const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual(["type"]);
    }
    const ok = await postAccount(h, tenantA.cookieHeader, { name: "X", type: "b".repeat(60) });
    expect(ok.statusCode).toBe(201);

    const noSpy = await postAccount(h, tenantA.cookieHeader, { name: "Sem Flag" });
    expect((noSpy.json() as AccountResource).isSpy).toBe(false);

    const badSpy = await postAccount(h, tenantA.cookieHeader, { name: "X", isSpy: "true" });
    expect(badSpy.statusCode).toBe(400);
    expect((badSpy.json() as { error: { details?: { fields: string[] } } }).error.details?.fields).toEqual(["isSpy"]);
    await h.app.close();
  });

  it("T2: campos proibidos no body (org_id/connectionStatus/phone/id) → 400 com details", async () => {
    for (const extra of [
      { org_id: randomUUID() },
      { connectionStatus: "conectada" },
      { phone: "5511999999999" },
      { id: randomUUID() },
    ]) {
      const res = await postAccount(h, tenantA.cookieHeader, { name: "X", ...extra });
      expect(res.statusCode, JSON.stringify(extra)).toBe(400);
      const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual([Object.keys(extra)[0]]);
    }
    await h.app.close();
  });

  it("T2: paginação — page=0/abc e pageSize=0/101 → 400; pageSize=100 e defaults ok", async () => {
    for (const qs of ["page=0", "page=abc", "page=1.5", "pageSize=0", "pageSize=101"]) {
      const res = await h.app.inject({
        method: "GET",
        url: `/api/v1/accounts?${qs}`,
        headers: { cookie: tenantA.cookieHeader },
      });
      expect(res.statusCode, qs).toBe(400);
      const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual([qs.split("=")[0]]);
    }
    const boundary = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts?pageSize=100",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(boundary.statusCode).toBe(200);
    expect((boundary.json() as { pageSize: number }).pageSize).toBe(100);
    await h.app.close();
  });

  it("T2: PATCH {} → 400 (≥1 campo); PATCH {name:''} → 400", async () => {
    const created = (await (await postAccount(h, tenantA.cookieHeader, { name: "Ok" })).json()) as AccountResource;

    const empty = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: {},
    });
    expect(empty.statusCode).toBe(400);
    expect((empty.json() as { error: { details?: { fields: string[] } } }).error.details?.fields).toEqual(["body"]);

    const blank = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${created.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "" },
    });
    expect(blank.statusCode).toBe(400);
    expect((blank.json() as { error: { details?: { fields: string[] } } }).error.details?.fields).toEqual(["name"]);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T5
  it("T5 (CTA-03): criar/editar conta NÃO cria sessão/conexão/ID externo; estado honesto", async () => {
    const sessionsBefore = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    const tablesBefore = await h.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );

    const created = await postAccount(h, tenantA.cookieHeader, { name: "Espia", isSpy: true });
    expect(created.statusCode).toBe(201);
    const account = created.json() as AccountResource;

    h.clock.advanceMs(1_000);
    const patched = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: "Espia 2" },
    });
    expect(patched.statusCode).toBe(200);

    // (a) contagem de linhas de sessions INALTERADA por POST/PATCH de conta.
    const sessionsAfter = await h.pool.query("SELECT count(*)::int AS n FROM sessions");
    expect(sessionsAfter.rows[0]).toEqual(sessionsBefore.rows[0]);

    // (b) nenhuma tabela de conexão/credencial criada: conjunto exato esperado.
    const tablesAfter = await h.pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = current_schema()",
    );
    const names = (rows: { rows: Record<string, unknown>[] }) =>
      rows.rows.map((r) => String(r.table_name)).sort();
    expect(names(tablesAfter)).toEqual(["accounts", "migrations", "organizations", "sessions", "users"]);
    expect(names(tablesAfter)).toEqual(names(tablesBefore));

    // (c) leitura direta: connection_status honesto no banco.
    const raw = await h.pool.query(
      "SELECT connection_status, is_spy FROM accounts WHERE id = $1",
      [account.id],
    );
    expect(raw.rows[0]).toMatchObject({ connection_status: "nao_conectada", is_spy: true });

    // (d) resposta sem campo de sessão/conexão/credencial/ID externo.
    const serialized = JSON.stringify(account) + JSON.stringify(patched.json());
    expect(serialized).not.toMatch(/session|token|credential|external|phone|number|waId|providerId/i);

    // (e) tentativa de setar connectionStatus em entrada → 400 (POST e PATCH).
    const postWithStatus = await postAccount(h, tenantA.cookieHeader, {
      name: "X",
      connectionStatus: "conectada",
    });
    expect(postWithStatus.statusCode).toBe(400);
    const patchWithStatus = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { connectionStatus: "conectada" },
    });
    expect(patchWithStatus.statusCode).toBe(400);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T6
  it("T6 (TEN-01): cruzado A↔B — 404 byte a byte idêntico ao de UUID inexistente; malformado → 400", async () => {
    const created = await postAccount(h, tenantA.cookieHeader, { name: "Só da Alfa" });
    expect(created.statusCode).toBe(201);
    const account = created.json() as AccountResource;

    // Referência: UUID bem-formado inexistente, com a sessão de B.
    const nonexistent = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(nonexistent.statusCode).toBe(404);
    expect((nonexistent.json() as { error: { code: string } }).error.code).toBe("TENANT_FORBIDDEN");

    // B lê conta de A → 404 com corpo IDÊNTICO byte a byte (não vaza existência).
    const bGet = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(bGet.statusCode).toBe(404);
    expect(bGet.body).toBe(nonexistent.body);

    // B edita conta de A → 404 idêntico; PATCH de inexistente → 404 idêntico.
    const bPatch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Roubada" },
    });
    const bPatchMissing = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Nada" },
    });
    expect(bPatch.statusCode).toBe(404);
    expect(bPatchMissing.statusCode).toBe(404);
    expect(bPatch.body).toBe(nonexistent.body);
    expect(bPatchMissing.body).toBe(nonexistent.body);

    // Lista de B não contém a conta de A.
    const bList = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts",
      headers: { cookie: tenantB.cookieHeader },
    });
    expect((bList.json() as { items: unknown[]; total: number }).total).toBe(0);

    // :id malformado → 400 por FORMATO (independente de tenant), com fields.
    const malformed = await h.app.inject({
      method: "GET",
      url: "/api/v1/accounts/nao-e-um-uuid",
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(malformed.statusCode).toBe(400);
    expect((malformed.json() as { error: { code: string; details?: { fields: string[] } } }).error.details?.fields).toEqual(["id"]);

    // Snapshot: nada de A foi alterado pelas tentativas de B.
    const aGet = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(aGet.statusCode).toBe(200);
    expect((aGet.json() as AccountResource).name).toBe("Só da Alfa");
    await h.app.close();
  });

  // ------------------------------------------------------------------- T10
  it("T10 (D6): POST com text/plain ou sem Content-Type → 400; charset=utf-8 aceito; login idem (uniforme)", async () => {
    const textPlain = await h.app.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
      payload: '{"name":"Ataque CSRF"}',
    });
    expect(textPlain.statusCode).toBe(400);
    const body = textPlain.json() as { error: { code: string; details?: { fields: string[] } } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details?.fields).toEqual(["content-type"]);

    const noHeader = await h.app.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(noHeader.statusCode).toBe(400);
    expect((noHeader.json() as { error: { details?: { fields: string[] } } }).error.details?.fields).toEqual(["content-type"]);

    // Nada foi criado pelas tentativas rejeitadas.
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    expect(rows.rows[0]).toMatchObject({ n: 0 });

    // charset é parâmetro aceito (media type application/json).
    const charsetOk = await h.app.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json; charset=utf-8" },
      payload: { name: "Com Charset" },
    });
    expect(charsetOk.statusCode).toBe(201);

    // PATCH idem.
    const id = (charsetOk.json() as AccountResource).id;
    const patchTextPlain = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/accounts/${id}`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
      payload: '{"name":"X"}',
    });
    expect(patchTextPlain.statusCode).toBe(400);

    // Uniformização em auth: login com text/plain → 400 (não 401/500).
    const loginTextPlain = await h.app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { "content-type": "text/plain" },
      payload: '{"email":"x@test.invalid","password":"qualquer-coisa"}',
    });
    expect(loginTextPlain.statusCode).toBe(400);
    expect((loginTextPlain.json() as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");

    // Oráculo: continua 1 conta apenas.
    const rows2 = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    expect(rows2.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  it("T10 (D6): POST com application/x-www-form-urlencoded → 400 VALIDATION_ERROR fields [\"content-type\"] (nunca 415 do parser)", async () => {
    // Caso dirigido do achado #2: urlencoded NÃO tem parser registrado no
    // Fastify — com o guard em preValidation o parser respondia 415 ANTES de
    // qualquer hook; em preParsing o guard do app responde primeiro: 400 com
    // fields ["content-type"] (forma que um formulário HTML de atacante produza).
    const res = await h.app.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/x-www-form-urlencoded" },
      payload: "name=Ataque+CSRF+de+Formulario",
    });
    expect(res.statusCode).toBe(400); // exatamente 400 — 415 seria regressão
    const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.details?.fields).toEqual(["content-type"]);

    // Oráculo: nada foi criado.
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM accounts");
    expect(rows.rows[0]).toMatchObject({ n: 0 });
    await h.app.close();
  });

  it("T10 (D6): preflight OPTIONS de origem autorizada → 204 + ACAO exato; origem desconhecida SEM ACAO", async () => {
    const preflight = await h.app.inject({
      method: "OPTIONS",
      url: "/api/v1/accounts",
      headers: {
        origin: "http://localhost:5173",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });
    expect(preflight.statusCode).toBe(204);
    expect(preflight.headers["access-control-allow-origin"]).toBe("http://localhost:5173");
    expect(String(preflight.headers["access-control-allow-methods"])).toContain("POST");
    expect(String(preflight.headers["access-control-allow-headers"])).toContain("content-type");

    // Origem NÃO autorizada: preflight sem ACAO → browser bloqueia a requisição
    // de fato (fundamento D6: JSON força preflight; origem inválida falha ali).
    const evil = await h.app.inject({
      method: "OPTIONS",
      url: "/api/v1/accounts",
      headers: {
        origin: "https://malicioso.example",
        "access-control-request-method": "POST",
        "access-control-request-headers": "content-type",
      },
    });
    expect(evil.headers["access-control-allow-origin"]).toBeUndefined();
    await h.app.close();
  });

  // -------------------------------------------------------- T7 (contrato)
  it("T7: sem sessão: POST/lista/GET :id/PATCH → 401 AUTH_UNAUTHENTICATED (media type json válido passa pelo guard de preParsing)", async () => {
    const id = randomUUID();
    const calls = [
      { method: "POST" as const, url: "/api/v1/accounts", payload: { name: "X" } },
      { method: "GET" as const, url: "/api/v1/accounts" },
      { method: "GET" as const, url: `/api/v1/accounts/${id}` },
      { method: "PATCH" as const, url: `/api/v1/accounts/${id}`, payload: { name: "Y" } },
    ];
    for (const call of calls) {
      const res = await h.app.inject({ ...call }); // SEM cookie (payload objeto → inject seta application/json: o guard de preParsing passa e o 401 vem do requireAuth)
      expect(res.statusCode, `${call.method} ${call.url}`).toBe(401);
      expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");
    }
    await h.app.close();
  });
});

// --------------------------------------------------------------------- T4
describe("accounts: persistência (T4 — app re-instanciado sobre o MESMO banco)", () => {
  it("conta criada no app #1 é relida idêntica pelo app #2 e pelo oráculo SQL", async () => {
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
    const created = await app1.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Persistente", type: "WhatsApp", isSpy: true },
    });
    expect(created.statusCode).toBe(201);
    const account = created.json() as AccountResource;
    await app1.close(); // "reinício": app fechado, banco permanece

    const app2 = await buildApp({ db: pool, config, clock: new FakeClock(), logger: false });
    const got = await app2.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: tenant.cookieHeader }, // sessão também persistiu
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(account);

    // Oráculo independente (query SQL direta, não a resposta da API).
    const rows = await pool.query(
      "SELECT org_id, name, type, is_spy, connection_status FROM accounts WHERE id = $1",
      [account.id],
    );
    expect(rows.rows[0]).toMatchObject({
      org_id: tenant.org.id,
      name: "Persistente",
      type: "WhatsApp",
      is_spy: true,
      connection_status: "nao_conectada",
    });

    await app2.close();
    await pool.end();
  });
});
