// Fatia 7 (contrato §5/§7): webhook de entrada POST /api/v1/webhooks/evolution.
// T6 secret (tempo constante, env vazia = tudo inválido); T7 mapeamento D4 com
// oráculos SQL; T8 redação R1 com MARKER sintético (banco + stdout/stderr +
// resposta); T9 tenant por instanceName; anti-storm 200 (§5.2.4).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAccount, createEvolutionHarness, postWebhook, type EvolutionHarness } from "./fakes/evolution.js";

const SECRET = "teste-secret-webhook-fatia7-com-32-chars";
const MARKER = "EVO-APIKEY-MARKER-7f3a9c";

interface AccountStateRow {
  connection_status: string;
  phone: string | null;
  phone_jid: string | null;
}

async function accountState(h: EvolutionHarness, accountId: string): Promise<AccountStateRow> {
  const res = await h.pool.query(
    "SELECT connection_status, phone, phone_jid FROM accounts WHERE id = $1",
    [accountId],
  );
  return res.rows[0] as AccountStateRow;
}

async function eventsDump(h: EvolutionHarness): Promise<string> {
  const res = await h.pool.query(
    "SELECT org_id, account_id, event_type, payload FROM integration_events",
  );
  return JSON.stringify(res.rows);
}

let h: EvolutionHarness;

beforeEach(async () => {
  h = await createEvolutionHarness();
});

afterEach(async () => {
  await h.app.close();
});

describe("T6: autenticação do webhook (D6 — §5.1)", () => {
  it("sem header x-grupos-evo-secret → 401 EVOLUTION_WEBHOOK_SECRET_INVÁLIDO; NADA auditado", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/v1/webhooks/evolution",
      headers: { "content-type": "application/json" },
      payload: { event: "CONNECTION_UPDATE", instance: "g-x", data: {} },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toEqual({
      error: { code: "EVOLUTION_WEBHOOK_SECRET_INVÁLIDO", message: "Segredo do webhook inválido." },
    });
    expect(await eventsDump(h)).toBe("[]"); // nada gravado ANTES do 401
  });

  it("secret ERRADO → 401 (mesmo corpo); payload NÃO chega ao banco", async () => {
    const res = await postWebhook(h.app, { event: "CONNECTION_UPDATE", instance: "g-x" }, "secret-errado");
    expect(res.statusCode).toBe(401);
    expect((res.json() as { error: { code: string } }).error.code).toBe("EVOLUTION_WEBHOOK_SECRET_INVÁLIDO");
    expect(await eventsDump(h)).toBe("[]");
  });

  it("env VAZIA → toda requisição é inválida (401) mesmo com o secret que estava configurado", async () => {
    const off = await createEvolutionHarness({ env: { EVOLUTION_WEBHOOK_SECRET: "" } });
    const res = await postWebhook(off.app, { event: "CONNECTION_UPDATE", instance: "g-x" }, SECRET);
    expect(res.statusCode).toBe(401);
    expect((res.json() as { error: { code: string } }).error.code).toBe("EVOLUTION_WEBHOOK_SECRET_INVÁLIDO");
    await off.app.close();
  });

  it("body sem application/json → 400 VALIDATION_ERROR ANTES de qualquer efeito (guard D6)", async () => {
    const res = await h.app.inject({
      method: "POST",
      url: "/api/v1/webhooks/evolution",
      headers: { "content-type": "text/plain", "x-grupos-evo-secret": SECRET },
      payload: "não-json",
    });
    expect(res.statusCode).toBe(400);
    expect((res.json() as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    expect(await eventsDump(h)).toBe("[]");
  });

  it("body sem event/instance string → 400 VALIDATION_ERROR (schema mínimo §5.1.3)", async () => {
    for (const body of [{ instance: "g-x" }, { event: "CONNECTION_UPDATE" }, { event: 1, instance: "g-x" }, {}]) {
      const res = await postWebhook(h.app, body);
      expect(res.statusCode, JSON.stringify(body)).toBe(400);
      expect((res.json() as { error: { code: string } }).error.code).toBe("VALIDATION_ERROR");
    }
    expect(await eventsDump(h)).toBe("[]");
  });
});

describe("T7: mapeamento D4 (§5.3) — mutação só por evidência, com oráculo SQL", () => {
  async function connectAccount(name: string): Promise<{ id: string; instance: string }> {
    const account = await createAccount(h.app, h.tenantA.cookieHeader, name);
    const instance = `g-${account.id.slice(0, 8)}`;
    await h.pool.query(
      "UPDATE accounts SET evolution_instance_name = $2, connection_status = 'aguardando_qr' WHERE id = $1",
      [account.id, instance],
    );
    return { id: account.id, instance };
  }

  it("CONNECTION_UPDATE state=open com wuid → conectada + phone/phone_jid; evento auditado com vínculo de org", async () => {
    const { id, instance } = await connectAccount("Abre");
    const res = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance,
      destination: "https://api.test.invalid/api/v1/webhooks/evolution",
      apikey: "k",
      data: { state: "open", statusReason: 200, wuid: "5511999999999@s.whatsapp.net" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({});

    expect(await accountState(h, id)).toEqual({
      connection_status: "conectada",
      phone: "5511999999999",
      phone_jid: "5511999999999@s.whatsapp.net",
    });
    // Auditoria com org/conta da instância (resolve tenant pelo instanceName).
    const audit = await h.pool.query(
      "SELECT org_id, account_id, event_type FROM integration_events",
    );
    expect(audit.rows[0]).toMatchObject({
      org_id: h.tenantA.org.id,
      account_id: id,
      event_type: "CONNECTION_UPDATE",
    });
  });

  it("CONNECTION_UPDATE close (statusReason 500) → desconectada; phone PRESERVA (último conhecido)", async () => {
    const { id, instance } = await connectAccount("Cai");
    await h.pool.query(
      "UPDATE accounts SET connection_status='conectada', phone='5511888888888', phone_jid='5511888888888@s.whatsapp.net' WHERE id=$1",
      [id],
    );

    const res = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance,
      data: { state: "close", statusReason: 500 },
    });
    expect(res.statusCode).toBe(200);
    expect(await accountState(h, id)).toEqual({
      connection_status: "desconectada",
      phone: "5511888888888",
      phone_jid: "5511888888888@s.whatsapp.net",
    });
  });

  it("CONNECTION_UPDATE close com statusReason 401/403 (núm. OU string) → banida", async () => {
    const a = await connectAccount("Banida 401");
    const r1 = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance: a.instance,
      data: { state: "close", statusReason: 401 },
    });
    expect(r1.statusCode).toBe(200);
    expect((await accountState(h, a.id)).connection_status).toBe("banida");

    const b = await connectAccount("Banida 403");
    const r2 = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance: b.instance,
      data: { state: "close", statusReason: "403" }, // string numérica
    });
    expect(r2.statusCode).toBe(200);
    expect((await accountState(h, b.id)).connection_status).toBe("banida");
  });

  it("CONNECTION_UPDATE connecting → audit only (sem mudança de status)", async () => {
    const { id, instance } = await connectAccount("Conectando");
    const res = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance,
      data: { state: "connecting", statusReason: 0 },
    });
    expect(res.statusCode).toBe(200);
    expect((await accountState(h, id)).connection_status).toBe("aguardando_qr"); // intacto
  });

  it("QRCODE_UPDATED com base64 → aguardando_qr (sem persistir o QR); SEM base64 (limite) → sem mudança", async () => {
    const { id, instance } = await connectAccount("QR");
    const withQr = await postWebhook(h.app, {
      event: "QRCODE_UPDATED",
      instance,
      data: { qrcode: { pairingCode: null, code: "2@X=", base64: "data:image/png;base64,QRREAL", count: 1 } },
    });
    expect(withQr.statusCode).toBe(200);
    expect((await accountState(h, id)).connection_status).toBe("aguardando_qr");

    const limited = await postWebhook(h.app, {
      event: "QRCODE_UPDATED",
      instance,
      data: { message: "QR code limit reached", qrcode: { pairingCode: null, code: null, base64: null } },
    });
    expect(limited.statusCode).toBe(200);
    expect((await accountState(h, id)).connection_status).toBe("aguardando_qr"); // sem regressão

    // D4: o QR recebido NÃO está em nenhuma tabela (payload redigido).
    expect(await eventsDump(h)).not.toContain("data:image");
  });

  it("evento FORA do par (MESSAGES_UPSERT) → 200 audit only, sem mutação (§0.1.9)", async () => {
    const { id, instance } = await connectAccount("Deriva");
    const res = await postWebhook(h.app, {
      event: "MESSAGES_UPSERT",
      instance,
      data: { messages: [] },
    });
    expect(res.statusCode).toBe(200);
    expect((await accountState(h, id)).connection_status).toBe("aguardando_qr");
    const dump = await eventsDump(h);
    expect(dump).toContain("MESSAGES_UPSERT"); // auditado
  });

  it("body sem data / data não-objeto → 200 sem quebrar (leitura defensiva)", async () => {
    const { id, instance } = await connectAccount("Sem data");
    const noData = await postWebhook(h.app, { event: "CONNECTION_UPDATE", instance });
    expect(noData.statusCode).toBe(200);
    const weirdData = await postWebhook(h.app, {
      event: "QRCODE_UPDATED",
      instance,
      data: "string",
    });
    expect(weirdData.statusCode).toBe(200);
    expect((await accountState(h, id)).connection_status).toBe("aguardando_qr");
  });
});

describe("T8/R1: redação — apikey nunca vaza (banco, stdout/stderr, resposta)", () => {
  it("payload com MARKER em apikey (topo E aninhado) → integration_events sem a chave; stdout/stderr/resposta sem o MARKER", async () => {
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Redação");
    const instance = `g-${account.id.slice(0, 8)}`;
    await h.pool.query(
      "UPDATE accounts SET evolution_instance_name = $2 WHERE id = $1",
      [account.id, instance],
    );

    // Captura TUDO que o processo escreve em stdout/stderr durante o request.
    let captured = "";
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation((chunk => {
      captured += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    }) as typeof process.stdout.write);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation((chunk => {
      captured += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    }) as typeof process.stderr.write);

    let response: Awaited<ReturnType<typeof postWebhook>>;
    try {
      response = await postWebhook(h.app, {
        event: "QRCODE_UPDATED",
        instance,
        apikey: MARKER, // a Evolution manda a apikey GLOBAL aqui (topo)
        data: {
          apikey: MARKER, // ...e algumas versões repetem aninhado
          qrcode: { pairingCode: null, code: `2@${MARKER}=`, base64: `data:image/png;base64,${MARKER}`, count: 2 },
        },
      });
    } finally {
      stdoutSpy.mockRestore();
      stderrSpy.mockRestore();
    }

    expect(response.statusCode).toBe(200);
    // (a) resposta sem o marker
    expect(response.body).not.toContain(MARKER);
    // (b) stdout/stderr sem o marker (nenhum log vazou a chave)
    expect(captured).not.toContain(MARKER);
    // (c) banco: linha auditada existe, SEM apikey em qualquer profundidade e sem QR
    const row = await h.pool.query(
      "SELECT payload FROM integration_events WHERE event_type = 'QRCODE_UPDATED'",
    );
    expect(row.rows).toHaveLength(1);
    const payload = JSON.stringify(row.rows[0].payload);
    expect(payload).not.toContain(MARKER);
    expect(payload).not.toContain("apikey"); // chave AUSENTE, não só o valor
    expect(payload).not.toContain("data:image"); // qrcode.base64 anulada
    // campos não-segredo preservados (auditoria continua legível); QR todo anulado
    expect(payload).toContain(instance);
    expect(JSON.parse(payload).data.qrcode).toEqual({
      pairingCode: null,
      code: null, // token "2@..." também não persiste (D4 emenda da implementação)
      base64: null,
      count: 2,
    });
  });
});

describe("T9: tenant pelo instanceName + instância desconhecida + anti-storm", () => {
  it("webhook da instância do tenant B NÃO toca contas do tenant A; org correta no evento", async () => {
    const accountB = await createAccount(h.app, h.tenantB.cookieHeader, "Do B");
    const instanceB = `g-${accountB.id.slice(0, 8)}`;
    await h.pool.query("UPDATE accounts SET evolution_instance_name=$2 WHERE id=$1", [
      accountB.id,
      instanceB,
    ]);
    const accountA = await createAccount(h.app, h.tenantA.cookieHeader, "Do A");

    const res = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance: instanceB,
      data: { state: "open", wuid: "5511777777777@s.whatsapp.net" },
    });
    expect(res.statusCode).toBe(200);

    expect(await accountState(h, accountB.id)).toMatchObject({
      connection_status: "conectada",
      phone: "5511777777777",
    });
    // A intocado (nem status, nem phone) e SEM evento para a org A.
    expect(await accountState(h, accountA.id)).toEqual({
      connection_status: "nao_conectada",
      phone: null,
      phone_jid: null,
    });
    const events = await h.pool.query(
      "SELECT org_id FROM integration_events",
    );
    expect(events.rows).toHaveLength(1);
    expect(String(events.rows[0].org_id)).toBe(h.tenantB.org.id);
  });

  it("instância DESCONHECIDA → 204; auditada com org/account NULL e tipo UNKNOWN_INSTANCE", async () => {
    const res = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance: "g-nao-existe",
      apikey: "x",
      data: { state: "open" },
    });
    expect(res.statusCode).toBe(204);
    expect(res.body).toBe("");

    const rows = await h.pool.query(
      "SELECT org_id, account_id, event_type FROM integration_events",
    );
    expect(rows.rows).toHaveLength(1);
    expect(rows.rows[0]).toEqual({
      org_id: null,
      account_id: null,
      event_type: "UNKNOWN_INSTANCE",
    });
  });

  it("anti-storm (§5.2.4): falha INTERNA pós-validação → 200 {} (retry da Evolution não vira storm)", async () => {
    const account = await createAccount(h.app, h.tenantA.cookieHeader, "Storm");
    const instance = `g-${account.id.slice(0, 8)}`;
    await h.pool.query("UPDATE accounts SET evolution_instance_name=$2 WHERE id=$1", [
      account.id,
      instance,
    ]);
    // Quebra o armazenamento de auditoria: INSERT de integration_events falha.
    await h.pool.query("DROP TABLE integration_events");

    const res = await postWebhook(h.app, {
      event: "CONNECTION_UPDATE",
      instance,
      data: { state: "open", wuid: "5511666666666@s.whatsapp.net" },
    });
    expect(res.statusCode).toBe(200); // NÃO vira 5xx (retry-safe)
    expect(res.json()).toEqual({});
  });
});
