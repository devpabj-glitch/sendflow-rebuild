// Grupos (Fatia 5 - GRU; contrato docs/contracts/FATIA-05-GRUPOS-CONTRATO.md
// com D15-D18 aplicadas; parecer A4 ADERENTE). Rótulos ALINHADOS à numeração
// T1-T13 do contrato §6:
// T1 CRUD feliz (shape §3.1, PATCH, ações D12) · T2 validações (incl.
// releaseId inexistente/alheio → 400 genérico; campos proibidos clicks/
// participants/cheio/cheioManual/seq/releaseId-no-PATCH) · T3 filtros cheio ×
// DEC-06 legado (manual OU teto) · T4 GRU-04 DIRIGIDO (marcar manual não
// altera contadores — oráculo SQL antes/depois) · T5 busca name OU gid ·
// T6 cruzado 2 orgs (404 byte a byte; POST releaseId alheio → 400; lista
// releaseId alheio → 200 vazio honesto) · T7 401 sem sessão · T8 persistência
// (app re-instanciado) · T11 idempotência das ações · T12 seq derivada por
// release (incl. decaimento pós-DELETE D16) · T13 Content-Type guard (D6).
// (T9 migração vive em migrations.test.ts — agora 6 migrações; T10 regressão
// = gates em DEV/VERIFY.md.)
// FIXTURE declarada: nenhum endpoint escreve participants/clicks (fonte
// futura = FLX/VGC), portanto os fixtures do T3 semeiam participants por SQL
// direto (oráculo) — única forma honesta de montar os estados da DEC-06.
// Oráculo independente: leitura direta das tabelas pg-mem (não a resposta).
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

interface GroupResource {
  id: string;
  releaseId: string;
  name: string;
  gid: string | null;
  seq: number | null;
  clicks: number;
  participants: number;
  limitPessoas: number | null;
  cheioManual: boolean;
  cheio: boolean;
  createdAt: string;
  updatedAt: string;
}

function postGroup(
  h: TestHarness,
  cookie: string,
  payload: Record<string, unknown>,
): Promise<ReturnType<TestHarness["app"]["inject"]>> {
  return h.app.inject({
    method: "POST",
    url: "/api/v1/groups",
    headers: { cookie },
    payload,
  });
}

async function createRelease(h: TestHarness, cookie: string, name: string): Promise<string> {
  const res = await h.app.inject({
    method: "POST",
    url: "/api/v1/releases",
    headers: { cookie },
    payload: { name, type: "WhatsRelease" },
  });
  if (res.statusCode !== 201) throw new Error(`createRelease falhou (${res.statusCode}): ${res.body}`);
  return (res.json() as { id: string }).id;
}

async function createGroup(
  h: TestHarness,
  cookie: string,
  payload: Record<string, unknown>,
): Promise<GroupResource> {
  const res = await postGroup(h, cookie, payload);
  if (res.statusCode !== 201) throw new Error(`createGroup falhou (${res.statusCode}): ${res.body}`);
  return res.json() as GroupResource;
}

/** Semeia participants/clicks por SQL direto (fixture declarada — sem mutador na fatia). */
async function seedCounters(h: TestHarness, groupId: string, participants: number, clicks = 0): Promise<void> {
  await h.pool.query(`UPDATE groups SET participants = $1, clicks = $2 WHERE id = $3`, [
    participants,
    clicks,
    groupId,
  ]);
}

async function rawGroup(h: TestHarness, groupId: string): Promise<Record<string, unknown>> {
  const rows = await h.pool.query(`SELECT * FROM groups WHERE id = $1`, [groupId]);
  return rows.rows[0] ?? {};
}

describe("groups: CRUD, cheio DEC-06, validações e tenant (contrato T1–T7, T11–T13)", () => {
  let h: TestHarness;
  let tenantA: TenantFixture;
  let tenantB: TenantFixture;
  let releaseA: string;

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
    releaseA = await createRelease(h, tenantA.cookieHeader, "Release da Alfa");
  });

  // ------------------------------------------------------------------- T1
  it("T1: POST → 201 flat exato (defaults §3.1: clicks/participants 0, cheioManual/cheio false, gid/limitPessoas null, seq 1); GET /:id devolve igual; lista contém; criação sem efeitos colaterais", async () => {
    const sessionsBefore = (await h.pool.query("SELECT count(*)::int AS n FROM sessions")).rows[0];
    const releasesBefore = (await h.pool.query("SELECT count(*)::int AS n FROM releases")).rows[0];
    const accountsBefore = (await h.pool.query("SELECT count(*)::int AS n FROM accounts")).rows[0];

    const created = await postGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "  Grupo Principal  ",
      gid: " 1203630x@ggroup.test ",
      limitPessoas: 350,
    });
    expect(created.statusCode).toBe(201);
    const body = created.json() as GroupResource;
    expect(Object.keys(body).sort()).toEqual([
      "cheio",
      "cheioManual",
      "clicks",
      "createdAt",
      "gid",
      "id",
      "limitPessoas",
      "name",
      "participants",
      "releaseId",
      "seq",
      "updatedAt",
    ]);
    expect(body.name).toBe("Grupo Principal"); // trim antes de gravar
    expect(body.gid).toBe("1203630x@ggroup.test"); // trim APENAS (sem normalização de caixa)
    expect(body.releaseId).toBe(releaseA);
    expect(body.clicks).toBe(0); // nasce 0; nenhum endpoint desta fatia escreve
    expect(body.participants).toBe(0);
    expect(body.limitPessoas).toBe(350);
    expect(body.cheioManual).toBe(false);
    expect(body.cheio).toBe(false); // 0 < 350 e sem manual → não cheio (§4.1)
    expect(body.seq).toBe(1); // 1º grupo da release
    expect(body.id).toMatch(UUID_RE);
    expect(body.createdAt).toMatch(ISO_RE);
    expect(body.updatedAt).toMatch(ISO_RE);

    // Oráculo: linha gravada na org da SESSÃO com release da MESMA org.
    const raw = await rawGroup(h, body.id);
    expect(raw).toMatchObject({
      org_id: tenantA.org.id,
      release_id: releaseA,
      name: "Grupo Principal",
      gid: "1203630x@ggroup.test",
      clicks: 0,
      participants: 0,
      limit_pessoas: 350,
      cheio_manual: false,
    });

    // Defaults sem gid/limitPessoas: null/null (350 do exemplo NUNCA é default).
    h.clock.advanceMs(5); // created_at distintos → ordinais determinísticos
    const minimal = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "Mínimo" });
    expect(minimal.gid).toBeNull();
    expect(minimal.limitPessoas).toBeNull();
    expect(minimal.cheio).toBe(false); // sem teto e sem manual → nunca cheio automático
    expect(minimal.seq).toBe(2);

    // GET /:id devolve igual (mesmo shape).
    const got = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups/${body.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(body);

    // Lista da release contém os itens e total reflete.
    const list = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?releaseId=${releaseA}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const listBody = list.json() as { items: GroupResource[]; total: number };
    expect(listBody.total).toBe(2);
    expect(listBody.items.map((i) => i.id).sort()).toEqual([body.id, minimal.id].sort());

    // Análogo CTA-03: criar grupo NÃO gera sessão/release/account/link/ação.
    expect((await h.pool.query("SELECT count(*)::int AS n FROM sessions")).rows[0]).toEqual(sessionsBefore);
    expect((await h.pool.query("SELECT count(*)::int AS n FROM releases")).rows[0]).toEqual(releasesBefore);
    expect((await h.pool.query("SELECT count(*)::int AS n FROM accounts")).rows[0]).toEqual(accountsBefore);
    await h.app.close();
  });

  it("T1: PATCH name/gid/limitPessoas → 200 refletido; null LIMPA gid e REMOVE o teto; mark-full/mark-not-full (D12)", async () => {
    const group = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Antes",
      gid: "antes@ggroup.test",
      limitPessoas: 10,
    });

    h.clock.advanceMs(5_000);
    const patch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { name: " Depois ", gid: " depois@ggroup.test ", limitPessoas: 20 },
    });
    expect(patch.statusCode).toBe(200);
    const patched = patch.json() as GroupResource;
    expect(patched.name).toBe("Depois");
    expect(patched.gid).toBe("depois@ggroup.test");
    expect(patched.limitPessoas).toBe(20);
    expect(Date.parse(patched.updatedAt)).toBeGreaterThan(Date.parse(group.updatedAt));
    expect(patched.createdAt).toBe(group.createdAt);
    expect(patched.seq).toBe(group.seq); // PATCH não perturba o ordinal

    // null explícito: limpa gid e remove o teto calculado.
    h.clock.advanceMs(5_000);
    const cleared = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { gid: null, limitPessoas: null },
    });
    expect(cleared.statusCode).toBe(200);
    const clearedBody = cleared.json() as GroupResource;
    expect(clearedBody.gid).toBeNull();
    expect(clearedBody.limitPessoas).toBeNull();
    const rawCleared = await rawGroup(h, group.id);
    expect(rawCleared).toMatchObject({ gid: null, limit_pessoas: null });

    // Ações D12: mark-full → cheioManual true (cheio true); mark-not-full → false.
    h.clock.advanceMs(1_000);
    const full = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${group.id}/mark-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(full.statusCode).toBe(200);
    const fullBody = full.json() as GroupResource;
    expect(fullBody.cheioManual).toBe(true);
    expect(fullBody.cheio).toBe(true); // manual basta (OR, §4.1)

    h.clock.advanceMs(1_000);
    const notFull = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${group.id}/mark-not-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(notFull.statusCode).toBe(200);
    expect((notFull.json() as GroupResource).cheioManual).toBe(false);
    expect((notFull.json() as GroupResource).cheio).toBe(false); // sem teto (removido acima)
    await h.app.close();
  });

  // ------------------------------------------------------------------- T2
  it("T2: name vazio/só espaços/121 → 400 ['name']; gid vazio/121 → 400 ['gid']; limitPessoas 0/negativo/não-inteiro/100001 → 400 ['limitPessoas']; limites 120 e 1..100000 passam", async () => {
    for (const name of ["", "   ", "a".repeat(121)]) {
      const res = await postGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name });
      expect(res.statusCode, `name=${JSON.stringify(name.slice(0, 8))}…`).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["name"]);
    }
    for (const gid of ["", "   ", "g".repeat(121)]) {
      const res = await postGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "X", gid });
      expect(res.statusCode, `gid=${JSON.stringify(gid.slice(0, 6))}…`).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["gid"]);
    }
    for (const limitPessoas of [0, -5, 1.5, 100001, "10", true]) {
      const res = await postGroup(h, tenantA.cookieHeader, {
        releaseId: releaseA,
        name: "X",
        limitPessoas,
      });
      expect(res.statusCode, `limitPessoas=${JSON.stringify(limitPessoas)}`).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
        "limitPessoas",
      ]);
    }
    // Fronteiras válidas: 120 caracteres, teto 1 e 100000.
    const ok120 = await postGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "a".repeat(120),
      gid: "g".repeat(120),
    });
    expect(ok120.statusCode).toBe(201);
    const ok1 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "Teto 1", limitPessoas: 1 });
    expect(ok1.limitPessoas).toBe(1);
    expect(ok1.cheio).toBe(false); // participants 0 < 1
    const okMax = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Teto Max",
      limitPessoas: 100_000,
    });
    expect(okMax.limitPessoas).toBe(100_000);

    // Oráculo: só as 3 válidas gravadas.
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    expect(rows.rows[0]).toMatchObject({ n: 3 });
    await h.app.close();
  });

  it("T2: releaseId ausente/não-UUID/inexistente/de OUTRA org → 400 ['releaseId'] GENÉRICO (padrão D13 accountIds); PATCH {} → 400 ['body']; body null literal → 400 ['body']", async () => {
    const releaseB = await createRelease(h, tenantB.cookieHeader, "Release da Beta");
    const cases: [string, Record<string, unknown>][] = [
      ["ausente (schema required)", { name: "X" }],
      ["não-UUID", { releaseId: "nao-e-um-uuid", name: "X" }],
      ["UUID inexistente", { releaseId: randomUUID(), name: "X" }],
      ["release de outra org", { releaseId: releaseB, name: "X" }],
    ];
    for (const [label, payload] of cases) {
      const res = await postGroup(h, tenantA.cookieHeader, payload);
      expect(res.statusCode, label).toBe(400);
      const body = res.json() as { error: { code: string; message: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Entrada inválida."); // mensagem genérica
      expect(body.error.details?.fields).toEqual(["releaseId"]); // não revela qual nem por quê
    }

    // PATCH {} → 400 (≥1 campo).
    const group = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "Ok" });
    const empty = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: {},
    });
    expect(empty.statusCode).toBe(400);
    expect(((empty.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);

    // Corpo "null" literal (parser JSON.parse("null") → null) → 400, nunca 500.
    const nullBody = await h.app.inject({
      method: "POST",
      url: "/api/v1/groups",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: "null",
    });
    expect(nullBody.statusCode).toBe(400);
    expect(((nullBody.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["body"]);

    // Oráculo: nada gravado pelas tentativas rejeitadas (só o "Ok").
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    expect(rows.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  it("T2: campos proibidos no body (org_id/id/clicks/participants/cheio/cheioManual/seq; releaseId no PATCH) → 400 com details", async () => {
    for (const extra of [
      { org_id: randomUUID() },
      { id: randomUUID() },
      { clicks: 99 },
      { participants: 99 },
      { cheio: true },
      { cheioManual: true },
      { seq: 7 },
    ]) {
      const res = await postGroup(h, tenantA.cookieHeader, {
        releaseId: releaseA,
        name: "X",
        ...extra,
      });
      expect(res.statusCode, JSON.stringify(extra)).toBe(400);
      const body = res.json() as { error: { details?: { fields: string[] } } };
      expect(body.error.details?.fields).toEqual([Object.keys(extra)[0]]);
    }

    // PATCH: releaseId é IMUTÁVEL (campo desconhecido → 400; sem re-parenting).
    const group = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "Ok" });
    const otherRelease = await createRelease(h, tenantA.cookieHeader, "Outra Release");
    const patchRelease = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader },
      payload: { releaseId: otherRelease },
    });
    expect(patchRelease.statusCode).toBe(400);
    expect(((patchRelease.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "releaseId",
    ]);
    // Oráculo: release_id inalterado.
    expect(await rawGroup(h, group.id)).toMatchObject({ release_id: releaseA });
    await h.app.close();
  });

  it("T2: query — cheio=xyz e releaseId malformado → 400; page=0/pageSize=101 → 400; :id malformado → 400 em GET/PATCH/mark-full/DELETE", async () => {
    for (const qs of ["cheio=xyz", "cheio=SIM", "cheio=1", "releaseId=nao-e-uuid", "page=0", "page=abc", "pageSize=101"]) {
      const res = await h.app.inject({
        method: "GET",
        url: `/api/v1/groups?${qs}`,
        headers: { cookie: tenantA.cookieHeader },
      });
      expect(res.statusCode, qs).toBe(400);
      const body = res.json() as { error: { details?: { fields: string[] } } };
      expect(body.error.details?.fields).toEqual([qs.split("=")[0]]);
    }
    const group = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "Ok" });
    const idCases: { method: "GET" | "PATCH" | "POST" | "DELETE"; suffix: string; withPayload: boolean }[] = [
      { method: "GET", suffix: "", withPayload: false },
      { method: "PATCH", suffix: "", withPayload: true },
      { method: "POST", suffix: "/mark-full", withPayload: false },
      { method: "DELETE", suffix: "", withPayload: false },
    ];
    for (const call of idCases) {
      const headers: Record<string, string> = { cookie: tenantA.cookieHeader, "content-type": "application/json" };
      const res = await h.app.inject({
        method: call.method,
        url: `/api/v1/groups/nao-e-um-uuid${call.suffix}`,
        headers,
        ...(call.withPayload ? { payload: { name: "Y" } } : {}),
      });
      expect(res.statusCode, `${call.method} ${call.suffix || "(id)"}`).toBe(400);
      expect(((res.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["id"]);
    }
    expect(group.id).toMatch(UUID_RE);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T3
  it("T3: filtros cheio × DEC-06 legado — sim={manual OU teto atingido}; nao=restante; todos; regra 2 (desmarcar manual não elimina teto); página além do fim", async () => {
    // Fixtures (§6 T3): participants semeados por SQL (fixture declarada).
    const g1 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "G1 manual" });
    await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${g1.id}/mark-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    }); // manual=true, teto nulo → cheio POR MANUAL
    h.clock.advanceMs(2);
    const g2 = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "G2 abaixo",
      limitPessoas: 10,
    });
    await seedCounters(h, g2.id, 3); // manual=false, 3<10 → NÃO cheio
    h.clock.advanceMs(2);
    const g3 = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "G3 no teto",
      limitPessoas: 5,
    });
    await seedCounters(h, g3.id, 5); // manual=false, 5>=5 → cheio POR TETO
    h.clock.advanceMs(2);
    const g4 = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "G4 ambos",
      limitPessoas: 5,
    });
    await seedCounters(h, g4.id, 5);
    await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${g4.id}/mark-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    }); // manual=true E teto atingido → AMBOS os sinais
    h.clock.advanceMs(2);
    const g5 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "G5 nada" });
    // manual=false, teto nulo → NÃO cheio (só manual tornaria)

    const ids = (body: { items: GroupResource[] }) => body.items.map((i) => i.id).sort();
    const sim = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?cheio=sim`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const simBody = sim.json() as { items: GroupResource[]; total: number };
    expect(simBody.total).toBe(3);
    expect(ids(simBody)).toEqual([g1.id, g3.id, g4.id].sort());

    const nao = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?cheio=nao`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const naoBody = nao.json() as { items: GroupResource[]; total: number };
    expect(naoBody.total).toBe(2);
    expect(ids(naoBody)).toEqual([g2.id, g5.id].sort());

    const todos = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((todos.json() as { total: number }).total).toBe(5); // ausente = todos
    const explicitTodos = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?cheio=todos`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((explicitTodos.json() as { total: number }).total).toBe(5);

    // Regra 2 (DEC-06 legado): desmarcar manual de G4 NÃO elimina o teto —
    // resposta com cheio:true e G4 permanece no filtro sim.
    h.clock.advanceMs(1_000);
    const unmark = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${g4.id}/mark-not-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(unmark.statusCode).toBe(200);
    const unmarked = unmark.json() as GroupResource;
    expect(unmarked.cheioManual).toBe(false);
    expect(unmarked.cheio).toBe(true); // teto 5 >= 5 segue atingido
    const simAfter = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?cheio=sim`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(ids(simAfter.json() as { items: GroupResource[] })).toEqual([g1.id, g3.id, g4.id].sort());

    // Cliques NUNCA ocupam vaga: G2 com 50 cliques e 3/10 participantes
    // continua NÃO cheio (PM regra 7 / VGC-05).
    await seedCounters(h, g2.id, 3, 50);
    const clicksDontFill = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?cheio=sim&search=G2`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((clicksDontFill.json() as { total: number }).total).toBe(0);

    // Página além do fim: items vazio, total preservado.
    const beyond = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?page=99`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const beyondBody = beyond.json() as { items: unknown[]; total: number };
    expect(beyondBody.items).toEqual([]);
    expect(beyondBody.total).toBe(5);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T4
  it("T4 (GRU-04 dirigido, P4 §D1): marcar/desmarcar manual NÃO altera clicks/participants/limitPessoas/name/gid/release_id/created_at — oráculo SQL campo a campo", async () => {
    const group = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Estável",
      gid: "estavel@ggroup.test",
      limitPessoas: 7,
    });
    await seedCounters(h, group.id, 4, 9); // contadores NÃO nulos para provar que não mudam
    const before = await rawGroup(h, group.id);

    h.clock.advanceMs(1_000);
    const full = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${group.id}/mark-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(full.statusCode).toBe(200);
    const afterFull = await rawGroup(h, group.id);
    for (const column of ["name", "gid", "clicks", "participants", "limit_pessoas", "release_id", "created_at", "id", "org_id"]) {
      expect(afterFull[column], `mark-full: ${column}`).toEqual(before[column]);
    }
    expect(afterFull.cheio_manual).not.toEqual(before.cheio_manual); // ÚNICO sinal que muda
    expect(String(afterFull.updated_at)).not.toBe(String(before.updated_at));

    h.clock.advanceMs(1_000);
    const notFull = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${group.id}/mark-not-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(notFull.statusCode).toBe(200);
    const afterNotFull = await rawGroup(h, group.id);
    for (const column of ["name", "gid", "clicks", "participants", "limit_pessoas", "release_id", "created_at", "id", "org_id"]) {
      expect(afterNotFull[column], `mark-not-full: ${column}`).toEqual(before[column]);
    }
    expect(afterNotFull.cheio_manual).toEqual(before.cheio_manual); // voltou a false

    // Oráculo de contadores: exatamente 9 cliques e 4 participantes.
    expect(afterNotFull).toMatchObject({ clicks: 9, participants: 4, limit_pessoas: 7 });
    // Resposta coerente: 4 < 7 e manual false → cheio false.
    expect((notFull.json() as GroupResource).cheio).toBe(false);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T5
  it("T5: busca CI por substring em name OU gid; termo que só casa GID encontra; curinga no DADO é encontrável por termo limpo; search 121 → 400; vazio ⇒ sem filtro", async () => {
    const g1 = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Promo Alpha",
      gid: "gid-one@ggroup.test",
    });
    h.clock.advanceMs(2);
    const g2 = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Sem Termo Aqui",
      gid: "WingZZ@ggroup.test", // termo "wing" só existe NESTE gid
    });
    h.clock.advanceMs(2);
    const g3 = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Promo 100%",
      gid: "pct@ggroup.test", // curinga como DADO (ressalva pg-mem F2 §9.1)
    });

    const byName = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?search=PROMO`, // caixa invertida → CI
      headers: { cookie: tenantA.cookieHeader },
    });
    const byNameBody = byName.json() as { items: GroupResource[]; total: number };
    expect(byNameBody.total).toBe(2);
    expect(byNameBody.items.map((i) => i.id).sort()).toEqual([g1.id, g3.id].sort());
    expect(byNameBody.items.every((i) => /promo/i.test(i.name))).toBe(true);

    // Termo que só existe no GID: encontra o grupo (name não casa).
    const byGid = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?search=WING`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const byGidBody = byGid.json() as { items: GroupResource[]; total: number };
    expect(byGidBody.total).toBe(1);
    expect(byGidBody.items[0].id).toBe(g2.id);

    // Curinga como DADO é encontrável por termo limpo.
    const pct = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?search=100`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((pct.json() as { total: number }).total).toBe(1);

    // Busca combinada com releaseId (escopo da release).
    const scoped = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?releaseId=${releaseA}&search=alpha`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((scoped.json() as { total: number }).total).toBe(1);

    // search vazio ⇒ sem filtro (3 grupos).
    const emptySearch = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?search=`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((emptySearch.json() as { total: number }).total).toBe(3);

    // 121 caracteres → 400 ['search'].
    const tooLong = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?search=${"a".repeat(121)}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(tooLong.statusCode).toBe(400);
    expect(((tooLong.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual(["search"]);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T6
  it("T6 (TEN-01): cruzado A↔B — GET/PATCH/mark-full/mark-not-full/DELETE → 404 byte a byte; POST com releaseId alheio → 400 genérico; lista com releaseId alheio → 200 VAZIO; snapshot intacto", async () => {
    const group = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Só da Alfa",
      gid: "alfa@ggroup.test",
      limitPessoas: 10,
    });
    const before = await rawGroup(h, group.id);

    // Referência: UUID bem-formado inexistente, com a sessão de B.
    const nonexistent = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups/${randomUUID()}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(nonexistent.statusCode).toBe(404);
    expect((nonexistent.json() as { error: { code: string } }).error.code).toBe("TENANT_FORBIDDEN");

    const jsonHeader = { cookie: tenantB.cookieHeader, "content-type": "application/json" };
    const bGet = await h.app.inject({ method: "GET", url: `/api/v1/groups/${group.id}`, headers: { cookie: tenantB.cookieHeader } });
    const bPatch = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantB.cookieHeader },
      payload: { name: "Roubado" },
    });
    const bFull = await h.app.inject({ method: "POST", url: `/api/v1/groups/${group.id}/mark-full`, headers: jsonHeader, payload: {} });
    const bNotFull = await h.app.inject({ method: "POST", url: `/api/v1/groups/${group.id}/mark-not-full`, headers: jsonHeader, payload: {} });
    const bDelete = await h.app.inject({ method: "DELETE", url: `/api/v1/groups/${group.id}`, headers: jsonHeader });
    for (const res of [bGet, bPatch, bFull, bNotFull, bDelete]) {
      expect(res.statusCode).toBe(404);
      expect(res.body).toBe(nonexistent.body); // byte a byte: inexistente ≡ alheio
    }

    // B referencia a RELEASE de A no POST → 400 genérico (não vaza existência).
    const bPostForeignRelease = await postGroup(h, tenantB.cookieHeader, {
      releaseId: releaseA,
      name: "Da Beta",
    });
    expect(bPostForeignRelease.statusCode).toBe(400);
    expect(((bPostForeignRelease.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "releaseId",
    ]);

    // B lista com releaseId alheio → 200 vazio honesto (PADRÃO NOVO §3.3);
    // idêntico ao que a própria org B sem grupos devolveria (zero vazamento).
    const bListForeign = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?releaseId=${releaseA}`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect(bListForeign.statusCode).toBe(200);
    expect(bListForeign.json()).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    const bListGlobal = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups`,
      headers: { cookie: tenantB.cookieHeader },
    });
    expect((bListGlobal.json() as { total: number }).total).toBe(0);

    // Snapshot: nada de A foi alterado pelas negativas de B.
    const after = await rawGroup(h, group.id);
    expect(after).toEqual(before);
    const count = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    expect(count.rows[0]).toMatchObject({ n: 1 });
    await h.app.close();
  });

  // ------------------------------------------------------------------- T7
  it("T7: sem sessão: POST/lista/GET :id/PATCH/mark-full/mark-not-full/DELETE → 401 AUTH_UNAUTHENTICATED", async () => {
    const id = randomUUID();
    // Ações/DELETE sem corpo: header json explícito (sem payload o inject NÃO
    // seta content-type; o guard D6 responderia 400 antes do 401 — precedência
    // declarada no contrato F2 §3.5. Com json válido, 401 vem primeiro).
    const jsonHeader = { "content-type": "application/json" };
    const calls = [
      { method: "POST" as const, url: "/api/v1/groups", payload: { releaseId: randomUUID(), name: "X" } },
      { method: "GET" as const, url: "/api/v1/groups" },
      { method: "GET" as const, url: `/api/v1/groups/${id}` },
      { method: "PATCH" as const, url: `/api/v1/groups/${id}`, payload: { name: "Y" } },
      { method: "POST" as const, url: `/api/v1/groups/${id}/mark-full`, headers: jsonHeader },
      { method: "POST" as const, url: `/api/v1/groups/${id}/mark-not-full`, headers: jsonHeader },
      { method: "DELETE" as const, url: `/api/v1/groups/${id}`, headers: jsonHeader },
    ];
    for (const call of calls) {
      const res = await h.app.inject({ ...call }); // SEM cookie
      expect(res.statusCode, `${call.method} ${call.url}`).toBe(401);
      expect((res.json() as { error: { code: string } }).error.code).toBe("AUTH_UNAUTHENTICATED");
    }
    await h.app.close();
  });

  // ------------------------------------------------------------ T11
  it("T11 (D12): mark-full 2x → 200 mesmo valor (sem 409/422); sequência full→not-full→full termina true; nenhum outro campo muda; updated_at monotônico", async () => {
    const group = await createGroup(h, tenantA.cookieHeader, {
      releaseId: releaseA,
      name: "Estável",
      gid: "estavel11@ggroup.test",
      limitPessoas: 30,
    });
    const call = async (action: "mark-full" | "mark-not-full"): Promise<GroupResource> => {
      h.clock.advanceMs(1_000); // updated_at sempre avança (relógio falso)
      const res = await h.app.inject({
        method: "POST",
        url: `/api/v1/groups/${group.id}/${action}`,
        headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
        payload: {},
      });
      expect(res.statusCode).toBe(200);
      return res.json() as GroupResource;
    };

    const f1 = await call("mark-full");
    expect(f1.cheioManual).toBe(true);
    const f2 = await call("mark-full"); // 2x: idempotente, sem 409/422
    expect(f2.cheioManual).toBe(true);
    expect(Date.parse(f2.updatedAt)).toBeGreaterThanOrEqual(Date.parse(f1.updatedAt));
    const { cheioManual: _a, cheio: _b, updatedAt: _u, ...restF1 } = f1;
    const { cheioManual: _c, cheio: _d, updatedAt: _v, ...restF2 } = f2;
    expect(restF2).toEqual(restF1); // nenhum outro campo muda

    const n1 = await call("mark-not-full");
    expect(n1.cheioManual).toBe(false);
    expect(n1.cheio).toBe(false); // 0 < 30 (teto não atingido nesta fixture)
    const n2 = await call("mark-not-full");
    expect(n2.cheioManual).toBe(false);

    // Sequência termina cheio-manual.
    const end = await call("mark-full");
    expect(end.cheioManual).toBe(true);
    expect(end.cheio).toBe(true);
    await h.app.close();
  });

  // ------------------------------------------------------------------- T12
  it("T12: seq derivada por release — 1,2,3 na ordem de criação; 4º entra no fim SEM renumerar; GET /:id individual; lista sem releaseId → seq null; filtro cheio não perturba; releases independentes; DELETE do 1º reordena 1,2", async () => {
    const g1 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "A1" });
    h.clock.advanceMs(5);
    const g2 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "A2" });
    h.clock.advanceMs(5);
    const g3 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "A3" });

    const seqMap = async (qs: string): Promise<Map<string, number>> => {
      const res = await h.app.inject({
        method: "GET",
        url: `/api/v1/groups?releaseId=${releaseA}${qs}`,
        headers: { cookie: tenantA.cookieHeader },
      });
      const body = res.json() as { items: GroupResource[] };
      return new Map(body.items.map((i) => [i.id, i.seq as number]));
    };
    let map = await seqMap("");
    expect(map.get(g1.id)).toBe(1);
    expect(map.get(g2.id)).toBe(2);
    expect(map.get(g3.id)).toBe(3);

    // 4º grupo: entra no fim; ordinais dos anteriores INALTERADOS.
    h.clock.advanceMs(5);
    const g4 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "A4" });
    map = await seqMap("");
    expect(map.get(g4.id)).toBe(4);
    expect(map.get(g1.id)).toBe(1);
    expect(map.get(g2.id)).toBe(2);
    expect(map.get(g3.id)).toBe(3);

    // GET /:id devolve seq individual.
    const got2 = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups/${g2.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect((got2.json() as GroupResource).seq).toBe(2);

    // Lista SEM releaseId (busca global): todos com seq null (§4.2).
    const global = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const globalItems = (global.json() as { items: GroupResource[] }).items;
    expect(globalItems.every((i) => i.seq === null)).toBe(true);
    expect(globalItems).toHaveLength(4);

    // Outra release da MESMA org: ordinais independentes (1,2 da própria).
    const releaseA2 = await createRelease(h, tenantA.cookieHeader, "Release Dois da Alfa");
    h.clock.advanceMs(5);
    const b1 = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA2, name: "B1" });
    h.clock.advanceMs(5);
    await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA2, name: "B2" });
    const listA2 = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups?releaseId=${releaseA2}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    const mapA2 = new Map(
      ((listA2.json() as { items: GroupResource[] }).items.map((i) => [i.name, i.seq as number])),
    );
    expect(mapA2.get("B1")).toBe(1);
    expect(mapA2.get("B2")).toBe(2);
    expect(b1.seq).toBe(1); // POST já devolve o ordinal da própria release

    // Filtro cheio NÃO perturba ordinais (ordinal é da release inteira).
    await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${g3.id}/mark-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    map = await seqMap("&cheio=nao");
    expect(map.get(g1.id)).toBe(1); // g1 não-cheio segue ordinal 1
    expect(map.has(g3.id)).toBe(false);

    // DELETE do 1º (D16): ordinais posteriores DECRECEM (§9.7) — 2,3,4 → 1,2,3.
    const del = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/groups/${g1.id}`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
    });
    expect(del.statusCode).toBe(204);
    map = await seqMap("");
    expect(map.get(g2.id)).toBe(1);
    expect(map.get(g3.id)).toBe(2);
    expect(map.get(g4.id)).toBe(3);
    await h.app.close();
  });

  // ----------------------------------------------- DELETE D16 (T6/T12 base)
  it("DELETE (D16): 204 sem corpo; releitura → 404; repetição → 404 byte a byte igual ao de UUID inexistente; delete LOCAL (sem efeito externo)", async () => {
    const group = await createGroup(h, tenantA.cookieHeader, { releaseId: releaseA, name: "Para Excluir" });
    const jsonHeader = { cookie: tenantA.cookieHeader, "content-type": "application/json" };

    const del = await h.app.inject({ method: "DELETE", url: `/api/v1/groups/${group.id}`, headers: jsonHeader });
    expect(del.statusCode).toBe(204);
    expect(del.body).toBe(""); // sem corpo

    // Releitura: 404 com corpo TENANT_FORBIDDEN genérico.
    const reread = await h.app.inject({
      method: "GET",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(reread.statusCode).toBe(404);
    expect((reread.json() as { error: { code: string } }).error.code).toBe("TENANT_FORBIDDEN");

    // Repetição → 404 IDÊNTICO byte a byte ao de UUID inexistente.
    const again = await h.app.inject({ method: "DELETE", url: `/api/v1/groups/${group.id}`, headers: jsonHeader });
    const nonexistent = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/groups/${randomUUID()}`,
      headers: jsonHeader,
    });
    expect(again.statusCode).toBe(404);
    expect(nonexistent.statusCode).toBe(404);
    expect(again.body).toBe(nonexistent.body);

    // Oráculo: linha sumiu do banco LOCAL; nada mais tocou.
    const count = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    expect(count.rows[0]).toMatchObject({ n: 0 });
    const releases = await h.pool.query("SELECT count(*)::int AS n FROM releases");
    expect(releases.rows[0]).toMatchObject({ n: 1 }); // release intacta
    await h.app.close();
  });

  // ------------------------------------------------------------------- T13
  it("T13 (D6): POST/PATCH text/plain/urlencoded/sem header → 400 ['content-type']; charset ok; ações com corpo ausente → 200; DELETE text/plain → 400", async () => {
    const urlencoded = await h.app.inject({
      method: "POST",
      url: "/api/v1/groups",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/x-www-form-urlencoded" },
      payload: `releaseId=${releaseA}&name=Ataque+CSRF`,
    });
    expect(urlencoded.statusCode).toBe(400);
    expect(((urlencoded.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "content-type",
    ]);

    const textPlain = await h.app.inject({
      method: "POST",
      url: "/api/v1/groups",
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
      payload: `{"releaseId":"${releaseA}","name":"Ataque"}`,
    });
    expect(textPlain.statusCode).toBe(400);
    expect(((textPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "content-type",
    ]);

    // Sem header nenhum → 400 (guard precede; nada criado).
    const noHeader = await h.app.inject({
      method: "POST",
      url: "/api/v1/groups",
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(noHeader.statusCode).toBe(400);
    expect(((noHeader.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "content-type",
    ]);
    const rows = await h.pool.query("SELECT count(*)::int AS n FROM groups");
    expect(rows.rows[0]).toMatchObject({ n: 0 });

    // charset é parâmetro aceito (media type application/json).
    const charsetOk = await h.app.inject({
      method: "POST",
      url: "/api/v1/groups",
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json; charset=utf-8" },
      payload: { releaseId: releaseA, name: "Com Charset" },
    });
    expect(charsetOk.statusCode).toBe(201);
    const group = charsetOk.json() as GroupResource;

    // PATCH sem header → 400.
    const patchNoHeader = await h.app.inject({
      method: "PATCH",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader },
    });
    expect(patchNoHeader.statusCode).toBe(400);
    expect(((patchNoHeader.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "content-type",
    ]);

    // Ações: header json + CORPO AUSENTE → 200 (T13 do contrato).
    const markNoBody = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${group.id}/mark-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
    });
    expect(markNoBody.statusCode).toBe(200);
    expect((markNoBody.json() as GroupResource).cheioManual).toBe(true);

    // Ação com text/plain → 400 (guard uniforme).
    const actionTextPlain = await h.app.inject({
      method: "POST",
      url: `/api/v1/groups/${group.id}/mark-not-full`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
      payload: "{}",
    });
    expect(actionTextPlain.statusCode).toBe(400);
    expect(((actionTextPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "content-type",
    ]);

    // DELETE com text/plain → 400 (guard por uniformidade, §3.4); com json → 204.
    const deleteTextPlain = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "text/plain" },
    });
    expect(deleteTextPlain.statusCode).toBe(400);
    expect(((deleteTextPlain.json() as { error: { details?: { fields: string[] } } }).error.details?.fields)).toEqual([
      "content-type",
    ]);
    const deleteOk = await h.app.inject({
      method: "DELETE",
      url: `/api/v1/groups/${group.id}`,
      headers: { cookie: tenantA.cookieHeader, "content-type": "application/json" },
    });
    expect(deleteOk.statusCode).toBe(204);
    await h.app.close();
  });
});

// --------------------------------------------------------------------- T8
describe("groups: persistência (T8 — app re-instanciado sobre o MESMO banco)", () => {
  it("grupo criado/editado/marcado no app #1 é relido idêntico pelo app #2 e pelo oráculo SQL (cheio/seq NUNCA gravados)", async () => {
    const rawDb = createMemoryDb();
    const pool = toDbPool(rawDb);
    await migrateUp(pool, loadMigrationFiles());
    const config = loadConfig({
      NODE_ENV: "test",
      WEB_ORIGIN: "http://localhost:5173",
      REVISION: "test-rev",
    });

    const app1 = await buildApp({ db: pool, config, clock: new FakeClock(), logger: false });
    const tenant = await registerTenant(app1, { email: "persist-grupos@test.invalid", orgName: "Org Persist" });
    const releaseRes = await app1.inject({
      method: "POST",
      url: "/api/v1/releases",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Persistente", type: "WhatsRelease" },
    });
    expect(releaseRes.statusCode).toBe(201);
    const releaseId = (releaseRes.json() as { id: string }).id;

    const created = await app1.inject({
      method: "POST",
      url: "/api/v1/groups",
      headers: { cookie: tenant.cookieHeader },
      payload: { releaseId, name: "Grupo Persistente", gid: "persist@ggroup.test", limitPessoas: 40 },
    });
    expect(created.statusCode).toBe(201);

    const patched = await app1.inject({
      method: "PATCH",
      url: `/api/v1/groups/${(created.json() as GroupResource).id}`,
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Grupo Persistente 2" },
    });
    expect(patched.statusCode).toBe(200);
    const full = await app1.inject({
      method: "POST",
      url: `/api/v1/groups/${(created.json() as GroupResource).id}/mark-full`,
      headers: { cookie: tenant.cookieHeader, "content-type": "application/json" },
      payload: {},
    });
    expect(full.statusCode).toBe(200);
    const expected = full.json() as GroupResource;
    expect(expected.cheioManual).toBe(true);
    await app1.close(); // "reinício": app fechado, banco permanece

    const app2 = await buildApp({ db: pool, config, clock: new FakeClock(), logger: false });
    const got = await app2.inject({
      method: "GET",
      url: `/api/v1/groups/${expected.id}`,
      headers: { cookie: tenant.cookieHeader }, // sessão também persistiu
    });
    expect(got.statusCode).toBe(200);
    expect(got.json()).toEqual(expected); // cheioManual:true persistiu; contadores intactos

    // Lista também reflete (total + seq).
    const list = await app2.inject({
      method: "GET",
      url: `/api/v1/groups?releaseId=${releaseId}`,
      headers: { cookie: tenant.cookieHeader },
    });
    const listBody = list.json() as { items: GroupResource[]; total: number };
    expect(listBody.total).toBe(1);
    expect(listBody.items[0].seq).toBe(1);

    // Oráculo independente: colunas EXATAS da linha — cheio/seq NUNCA gravados
    // (inexistentes); contadores 0; cheio_manual persistiu pós-ação.
    const rows = await pool.query(`SELECT * FROM groups WHERE id = $1`, [expected.id]);
    const row = rows.rows[0] as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual([
      "cheio_manual",
      "clicks",
      "created_at",
      "gid",
      "id",
      "limit_pessoas",
      "name",
      "org_id",
      "participants",
      "release_id",
      "updated_at",
    ]);
    expect(row).toMatchObject({
      org_id: tenant.org.id,
      release_id: releaseId,
      name: "Grupo Persistente 2",
      gid: "persist@ggroup.test",
      clicks: 0,
      participants: 0,
      limit_pessoas: 40,
      cheio_manual: true,
    });

    await app2.close();
    await pool.end();
  });
});
