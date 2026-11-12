// Fatia 7 (contrato §4/§7): rotas de conexão de contas — POST connect, GET qr,
// POST disconnect. Provider Evolution SEMPRE falso/injetado (T2, zero rede);
// oráculos por SQL direto no pg-mem (status/instanceName/phone). Regra central
// F7-D3 (honestidade): 409/502/503 NUNCA mutam estado — provado por oráculo.
import { describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { createHarness, registerTenant } from "./helpers.js";
import {
  SYNTHETIC_QR,
  createAccount,
  createEvolutionHarness,
  type EvolutionHarness,
} from "./fakes/evolution.js";

/** UPDATE direto (fixture de estado no banco — o que só webhook/evidência fariam na vida real). */
async function setAccountState(
  h: EvolutionHarness,
  accountId: string,
  fields: { status?: string; instanceName?: string | null; phone?: string | null; phoneJid?: string | null },
): Promise<void> {
  const sets: string[] = [];
  const params: unknown[] = [accountId];
  if (fields.status !== undefined) {
    params.push(fields.status);
    sets.push(`connection_status = $${params.length}`);
  }
  if (fields.instanceName !== undefined) {
    params.push(fields.instanceName);
    sets.push(`evolution_instance_name = $${params.length}`);
  }
  if (fields.phone !== undefined) {
    params.push(fields.phone);
    sets.push(`phone = $${params.length}`);
  }
  if (fields.phoneJid !== undefined) {
    params.push(fields.phoneJid);
    sets.push(`phone_jid = $${params.length}`);
  }
  await h.pool.query(`UPDATE accounts SET ${sets.join(", ")} WHERE id = $1`, params);
}

async function accountRow(h: EvolutionHarness, accountId: string) {
  const res = await h.pool.query(
    "SELECT connection_status, evolution_instance_name, phone, phone_jid FROM accounts WHERE id = $1",
    [accountId],
  );
  return res.rows[0] as {
    connection_status: string;
    evolution_instance_name: string | null;
    phone: string | null;
    phone_jid: string | null;
  };
}

function connectInject(h: EvolutionHarness, cookie: string, accountId: string) {
  return h.app.inject({
    method: "POST",
    url: `/api/v1/accounts/${accountId}/connect`,
    headers: { cookie },
    payload: {},
  });
}

describe("T1: POST /accounts/:id/connect — fluxo feliz e vínculo determinístico", () => {
  it("conta nova → 200 {account, qrDataUrl}; status aguardando_qr; instanceName 'g-'+hex8 gravado; ops fetch→create→connect", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Loja QR");

    const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(res.statusCode).toBe(200);

    const body = res.json() as { account: Record<string, unknown>; qrDataUrl: string | null };
    expect(Object.keys(body).sort()).toEqual(["account", "qrDataUrl"]);
    expect(body.qrDataUrl).toBe(SYNTHETIC_QR); // data URL pronta para <img>
    expect(Object.keys(body.account).sort()).toEqual([
      "connectionStatus",
      "createdAt",
      "id",
      "isSpy",
      "name",
      "phone",
      "type",
      "updatedAt",
    ]);
    expect(body.account.connectionStatus).toBe("aguardando_qr");
    expect(body.account.phone).toBe(null); // sem phone até a 1ª conexão de fato

    // Oráculo SQL: vínculo determinístico D2 + estado por evidência do QR.
    const row = await accountRow(h, account.id);
    expect(row.evolution_instance_name).toBe(`g-${account.id.slice(0, 8)}`);
    expect(row.connection_status).toBe("aguardando_qr");

    // Sequência exata: pergunta (fetchInstances) → cria (uma vez) → connect.
    expect(h.fake.ops()).toEqual(["fetchInstances", "createInstance", "connect"]);
    await h.app.close();
  });

  it("re-connect em não-conectada NÃO recria instância (fetchInstances acha) e gera QR novo (§0.1.5)", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Reconnect");
    expect((await connectInject(h, h.tenantA.cookieHeader, account.id)).statusCode).toBe(200);

    const again = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(again.statusCode).toBe(200);
    const body = again.json() as { qrDataUrl: string | null };
    expect(body.qrDataUrl).toBe(SYNTHETIC_QR);

    expect(h.fake.count("createInstance")).toBe(1); // SEM segundo create
    expect(h.fake.ops()).toEqual([
      "fetchInstances",
      "createInstance",
      "connect",
      "fetchInstances",
      "connect",
    ]);
    await h.app.close();
  });

  it("instância JÁ existente no provedor (seed) → connect reutiliza, SEM create", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Existente");
    h.fake.seed(`g-${account.id.slice(0, 8)}`, "connecting");

    const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(res.statusCode).toBe(200);
    expect(h.fake.count("createInstance")).toBe(0);
    expect(h.fake.ops()).toEqual(["fetchInstances", "connect"]);
    // vínculo também materializa quando a instância já existia
    expect((await accountRow(h, account.id)).evolution_instance_name).toBe(`g-${account.id.slice(0, 8)}`);
    await h.app.close();
  });

  it("conta já conectada → 409 ACCOUNT_CONNECTED SEM chamar o provedor", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Já ligada");
    await setAccountState(h, account.id, { status: "conectada", instanceName: "g-xyz" });

    const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: { code: "ACCOUNT_CONNECTED", message: "A conta já está conectada." },
    });
    expect(h.fake.calls).toHaveLength(0); // nenhuma chamada ao provedor
    expect((await accountRow(h, account.id)).connection_status).toBe("conectada");
    await h.app.close();
  });

  it("R3: colisão da UNIQUE de evolution_instance_name → 409 EVOLUTION_INSTANCE_TAKEN (nunca 500)", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Colidida");
    const prefix = `g-${account.id.slice(0, 8)}`;

    // Fixture: OUTRA conta (outra org) já ocupa o prefixo de 32 bits.
    await h.pool.query(
      "INSERT INTO accounts (org_id, name, evolution_instance_name) VALUES ($1, 'Ocupante', $2)",
      [h.tenantB.org.id, prefix],
    );

    const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(res.statusCode).toBe(409);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("EVOLUTION_INSTANCE_TAKEN");
    // Oráculo: a conta NÃO ganhou o nome (ficou NULL); o ocupante intacto.
    expect((await accountRow(h, account.id)).evolution_instance_name).toBe(null);
    const occupant = await h.pool.query(
      "SELECT org_id FROM accounts WHERE evolution_instance_name = $1",
      [prefix],
    );
    expect(String(occupant.rows[0].org_id)).toBe(h.tenantB.org.id);
    await h.app.close();
  });
});

describe("T3: GET /accounts/:id/qr — QR vigente, efêmero e honesto", () => {
  it("conta aguardando_qr → 200 {qrDataUrl, connectionStatus}; QR NÃO persiste em nenhuma tabela", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Com QR");
    await (async () => {
      const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
      expect(res.statusCode).toBe(200);
    })();

    const res = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { qrDataUrl: string | null; connectionStatus: string };
    expect(Object.keys(body).sort()).toEqual(["connectionStatus", "qrDataUrl"]);
    expect(body.qrDataUrl).toBe(SYNTHETIC_QR);
    expect(body.connectionStatus).toBe("aguardando_qr");

    // Oráculo D4: nenhuma coluna/tabela guarda o QR (nem accounts nem auditoria).
    const accountsDump = await h.pool.query(
      "SELECT id, name, type, is_spy, connection_status, phone, phone_jid FROM accounts",
    );
    expect(JSON.stringify(accountsDump.rows)).not.toContain("data:image");
    const events = await h.pool.query("SELECT payload FROM integration_events");
    expect(JSON.stringify(events.rows)).not.toContain("data:image");
    await h.app.close();
  });

  it("QR ainda não gerado → qrDataUrl:null; conta conectada → 409 ACCOUNT_CONNECTED", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Sem QR");
    // Fixture coerente: conta JÁ pediu connect (aguardando_qr) mas o provedor
    // ainda não tem QR → sem evidência, status permanece o que estava.
    await setAccountState(h, account.id, { status: "aguardando_qr", instanceName: "g-noqr" });
    h.fake.seed("g-noqr", "connecting");
    h.fake.connectNext = { state: "connecting", qrDataUrl: null };

    const noQr = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect(noQr.statusCode).toBe(200);
    expect(noQr.json()).toEqual({ qrDataUrl: null, connectionStatus: "aguardando_qr" });

    await setAccountState(h, account.id, { status: "conectada" });
    const connected = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect(connected.statusCode).toBe(409);
    expect((connected.json() as { error: { code: string } }).error.code).toBe("ACCOUNT_CONNECTED");
    await h.app.close();
  });

  it("R2: conta SEM instância (nunca conectada) → 409 EVOLUTION_NOT_CONNECTED SEM chamar o provedor", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Virgem");

    const res = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json()).toEqual({
      error: {
        code: "EVOLUTION_NOT_CONNECTED",
        message: "A conta não está conectada a uma instância do provedor.",
      },
    });
    // Oráculo R2: ZERO chamadas ao provedor (nem fetch, nem connect).
    expect(h.fake.calls).toHaveLength(0);
    expect((await accountRow(h, account.id)).connection_status).toBe("nao_conectada");
    await h.app.close();
  });

  it("falha do provedor → 502 EVOLUTION_UNAVAILABLE com status ANTERIOR preservado (oráculo)", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Falha QR");
    await setAccountState(h, account.id, { status: "aguardando_qr", instanceName: "g-failqr" });
    h.fake.seed("g-failqr", "connecting");
    h.fake.failAll = true;

    const res = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect(res.statusCode).toBe(502);
    const body = res.json() as { error: { code: string } };
    expect(body.error.code).toBe("EVOLUTION_UNAVAILABLE");
    expect((await accountRow(h, account.id)).connection_status).toBe("aguardando_qr"); // intacto
    await h.app.close();
  });
});

describe("T4: POST /accounts/:id/disconnect — logout (nunca delete)", () => {
  async function connectedAccount(h: EvolutionHarness, name: string) {
    const account = await createAccount(h.app, h.tenantA.cookieHeader, name);
    const instanceName = `g-${account.id.slice(0, 8)}`;
    await setAccountState(h, account.id, {
      status: "conectada",
      instanceName,
      phone: "5511999999999",
      phoneJid: "5511999999999@s.whatsapp.net",
    });
    h.fake.seed(instanceName, "open", "5511999999999@s.whatsapp.net");
    return { account, instanceName };
  }

  it("conectada → 200 desconectada; logout chamado, delete NUNCA; phone preservado (§0.1.2)", async () => {
    const h = await createEvolutionHarness();
    const { account, instanceName } = await connectedAccount(h, "Desligar");

    const res = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${account.id}/disconnect`,
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    const body = res.json() as { account: Record<string, unknown> };
    expect(Object.keys(body).sort()).toEqual(["account"]);
    expect(body.account.connectionStatus).toBe("desconectada");
    expect(body.account.phone).toBe("5511999999999"); // último número persiste

    // Oráculo: logout sim, delete não; instância segue existindo no provedor.
    expect(h.fake.ops()).toEqual(["fetchInstances", "logout"]);
    expect(h.fake.count("deleteInstance")).toBe(0);
    expect(h.fake.instances.has(instanceName)).toBe(true); // logout ≠ delete (D5/F7-D10)
    expect(await accountRow(h, account.id)).toMatchObject({
      connection_status: "desconectada",
      phone: "5511999999999",
      phone_jid: "5511999999999@s.whatsapp.net",
    });
    await h.app.close();
  });

  it("não-conectada → 409 EVOLUTION_NOT_CONNECTED sem chamar o provedor", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Solta");

    const res = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${account.id}/disconnect`,
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    });
    expect(res.statusCode).toBe(409);
    expect((res.json() as { error: { code: string } }).error.code).toBe("EVOLUTION_NOT_CONNECTED");
    expect(h.fake.calls).toHaveLength(0);
    await h.app.close();
  });

  it("instância AUSENTE no provedor → desconectada SEM logout (conexão já não existia)", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Órfã");
    await setAccountState(h, account.id, { status: "conectada", instanceName: "g-orfa" });
    // SEM seed: provedor não conhece a instância.

    const res = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${account.id}/disconnect`,
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    });
    expect(res.statusCode).toBe(200);
    expect((res.json() as { account: { connectionStatus: string } }).account.connectionStatus).toBe(
      "desconectada",
    );
    expect(h.fake.ops()).toEqual(["fetchInstances"]); // logout não chamado
    await h.app.close();
  });
});

describe("T5: falhas do provedor/config — 502/503 SEM mutação (D3/D8)", () => {
  it("connect com provedor caído → 502 e conta INTACTA (sem instanceName, sem status)", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "502");
    h.fake.failAll = true;

    const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(res.statusCode).toBe(502);
    expect((res.json() as { error: { code: string } }).error.code).toBe("EVOLUTION_UNAVAILABLE");
    expect(await accountRow(h, account.id)).toEqual({
      connection_status: "nao_conectada",
      evolution_instance_name: null,
      phone: null,
      phone_jid: null,
    });
    await h.app.close();
  });

  it("provider desabilitado (injetado null = EVOLUTION_API_KEY vazia) → 503 EVOLUTION_NOT_CONFIGURED nos 3 endpoints, status intacto", async () => {
    const h = await createEvolutionHarness({ provider: null });
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Sem provider");
    await setAccountState(h, account.id, { instanceName: "g-off" }); // p/ qr passar do 409 R2

    const connect = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(connect.statusCode).toBe(503);
    expect((connect.json() as { error: { code: string } }).error.code).toBe("EVOLUTION_NOT_CONFIGURED");

    const qr = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect(qr.statusCode).toBe(503);

    await setAccountState(h, account.id, { status: "conectada" });
    const disconnect = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${account.id}/disconnect`,
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    });
    expect(disconnect.statusCode).toBe(503);

    expect((await accountRow(h, account.id)).connection_status).toBe("conectada"); // intacto
    await h.app.close();
  });

  it("503 também no caminho REAL da config: buildApp sem EVOLUTION_API_KEY → provider null", async () => {
    // Harness puro (helpers) NÃO injeta evolution: o app constrói da config,
    // que vem SEM EVOLUTION_API_KEY → provider desabilitado (F7-D8).
    const h = await createHarness();
    const tenant = await registerTenant(h.app, { email: "dono@test.invalid", orgName: "Org" });
    const created = await h.app.inject({
      method: "POST",
      url: "/api/v1/accounts",
      headers: { cookie: tenant.cookieHeader },
      payload: { name: "Config vazia" },
    });
    const account = created.json() as { id: string };

    const res = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${account.id}/connect`,
      headers: { cookie: tenant.cookieHeader },
      payload: {},
    });
    expect(res.statusCode).toBe(503);
    expect((res.json() as { error: { code: string } }).error.code).toBe("EVOLUTION_NOT_CONFIGURED");
    await h.app.close();
  });
});

describe("T9/T10/T12/T14: tenant, exposure de phone, CT guard e envelope", () => {
  it("T9: connect/qr/disconnect em conta de OUTRA org → 404 byte a byte igual ao de UUID inexistente", async () => {
    const h = await createEvolutionHarness();
    const foreign = await createAccount(h.app, h.tenantB.cookieHeader, "Do B");

    for (const path of ["connect", "qr", "disconnect"]) {
      const method = path === "qr" ? "GET" : "POST";
      const cross = await h.app.inject({
        method,
        url: `/api/v1/accounts/${foreign.id}/${path}`,
        headers: { cookie: h.tenantA.cookieHeader },
        ...(method === "POST" ? { payload: {} } : {}),
      });
      const missing = await h.app.inject({
        method,
        url: `/api/v1/accounts/${randomUUID()}/${path}`,
        headers: { cookie: h.tenantA.cookieHeader },
        ...(method === "POST" ? { payload: {} } : {}),
      });
      expect(cross.statusCode, path).toBe(404);
      expect(missing.statusCode, path).toBe(404);
      expect(cross.body, path).toBe(missing.body); // byte-identical (ENG-02)
    }
    expect(h.fake.calls).toHaveLength(0); // nada chegou ao provedor
    await h.app.close();
  });

  it("T10: phone exposto como LEITURA após conexão; evolutionInstanceName/phone/connectionStatus REJEITADOS em entrada", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Telefone");
    const instanceName = `g-${account.id.slice(0, 8)}`;
    await setAccountState(h, account.id, { instanceName });
    h.fake.seed(instanceName, "open", "5511999999999@s.whatsapp.net");

    // Conexão de fato (fetchInstances open + ownerJid) → phone materializa.
    const res = await connectInject(h, h.tenantA.cookieHeader, account.id);
    expect(res.statusCode).toBe(200);
    expect((res.json() as { account: { phone: string } }).account.phone).toBe("5511999999999");

    const got = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${account.id}`,
      headers: { cookie: h.tenantA.cookieHeader },
    });
    expect((got.json() as { phone: string }).phone).toBe("5511999999999");

    // Entrada: campos de conexão continuam proibidos (CTA-03 + F7).
    for (const extra of [{ evolutionInstanceName: "g-hack" }, { phone: "111" }]) {
      const post = await h.app.inject({
        method: "POST",
        url: "/api/v1/accounts",
        headers: { cookie: h.tenantA.cookieHeader },
        payload: { name: "X", ...extra },
      });
      expect(post.statusCode, JSON.stringify(extra)).toBe(400);
      expect((post.json() as { error: { details?: { fields: string[] } } }).error.details?.fields).toEqual([
        Object.keys(extra)[0],
      ]);

      const patch = await h.app.inject({
        method: "PATCH",
        url: `/api/v1/accounts/${account.id}`,
        headers: { cookie: h.tenantA.cookieHeader },
        payload: { name: "Y", ...extra },
      });
      expect(patch.statusCode, JSON.stringify(extra)).toBe(400);
    }
    await h.app.close();
  });

  it("T12: connect/disconnect sem application/json → 400 VALIDATION_ERROR fields [content-type]; :id malformado → 400 [id]", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "CT");

    for (const path of ["connect", "disconnect"]) {
      const res = await h.app.inject({
        method: "POST",
        url: `/api/v1/accounts/${account.id}/${path}`,
        headers: { cookie: h.tenantA.cookieHeader, "content-type": "text/plain" },
        payload: "",
      });
      expect(res.statusCode, path).toBe(400);
      const body = res.json() as { error: { code: string; details?: { fields: string[] } } };
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.details?.fields).toEqual(["content-type"]);
    }

    const badId = await h.app.inject({
      method: "POST",
      url: "/api/v1/accounts/nao-e-uuid/connect",
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    });
    expect(badId.statusCode).toBe(400);
    expect((badId.json() as { error: { details?: { fields: string[] } } }).error.details?.fields).toEqual([
      "id",
    ]);
    await h.app.close();
  });

  it("T14: envelope {error:{code,message}} em 100% dos códigos novos; sem detalhe de rede/URL/chave/instância", async () => {
    const h = await createEvolutionHarness();
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Envelope");

    // ACCOUNT_CONNECTED
    await setAccountState(h, account.id, { status: "conectada" });
    const connected = await connectInject(h, h.tenantA.cookieHeader, account.id);
    // EVOLUTION_NOT_CONNECTED (disconnect em não-conectada)
    const notConnected = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${randomUUID()}/disconnect`,
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    }); // 404 TENANT_FORBIDDEN — não serve; usa a própria conta após reset
    await setAccountState(h, account.id, { status: "nao_conectada", instanceName: null });
    const disconnect409 = await h.app.inject({
      method: "POST",
      url: `/api/v1/accounts/${account.id}/disconnect`,
      headers: { cookie: h.tenantA.cookieHeader },
      payload: {},
    });
    // EVOLUTION_INSTANCE_TAKEN
    await h.pool.query(
      "INSERT INTO accounts (org_id, name, evolution_instance_name) VALUES ($1, 'Ocupa', $2)",
      [h.tenantB.org.id, `g-${account.id.slice(0, 8)}`],
    );
    const taken = await connectInject(h, h.tenantA.cookieHeader, account.id);
    // EVOLUTION_UNAVAILABLE
    const outra = await createAccount(h.app, h.tenantA.cookieHeader, "Outra");
    await setAccountState(h, outra.id, { instanceName: `g-${outra.id.slice(0, 8)}` });
    h.fake.seed(`g-${outra.id.slice(0, 8)}`, "connecting");
    h.fake.failAll = true;
    const qr502 = await h.app.inject({
      method: "GET",
      url: `/api/v1/accounts/${outra.id}/qr`,
      headers: { cookie: h.tenantA.cookieHeader },
    });

    const responses: Array<[string, object]> = [
      ["ACCOUNT_CONNECTED", connected.json()],
      ["EVOLUTION_NOT_CONNECTED", disconnect409.json()],
      ["EVOLUTION_INSTANCE_TAKEN", taken.json()],
      ["EVOLUTION_UNAVAILABLE", qr502.json()],
      // EVOLUTION_NOT_CONFIGURED coberto no T5; WEBHOOK_SECRET no evolutionWebhook.test.ts
    ];
    void notConnected;
    for (const [code, raw] of responses) {
      const body = raw as { error: Record<string, unknown> };
      expect(Object.keys(body).sort(), code).toEqual(["error"]);
      expect(Object.keys(body.error).sort(), code).toEqual(["code", "message"]);
      expect(body.error.code, code).toBe(code);
      expect(typeof body.error.message, code).toBe("string");
      expect(JSON.stringify(body), code).not.toMatch(/http|apikey|secret|g-[0-9a-f]{8}/i);
    }
    await h.app.close();
  });
});
