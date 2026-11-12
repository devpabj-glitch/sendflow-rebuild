// T2 (contrato F7 §7): adaptador Evolution SEM rede. Testes unitários do
// client/provider com fetchImpl falso (D8/F7-D8) + função única de redação
// (R1) + teste ESTRUTURAL: nenhuma rota importa/chama fetch.
// Fatos 1-4 validados em produção (12/11) fixam os shapes esperados:
// create exige integration "WHATSAPP-BAILEYS" e webhook no próprio body;
// connect devolve QR flat {pairingCode, code, base64} com base64 já data URL.
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEvolutionProvider, jidLocalPart } from "../src/providers/evolution/instance.js";
import { redactEvolutionWebhookPayload } from "../src/providers/evolution/redact.js";
import {
  EvolutionAuthError,
  EvolutionRequestError,
  EvolutionUnavailableError,
  isEvolutionError,
  type EvolutionFetchResponse,
  type FetchLike,
} from "../src/providers/evolution/types.js";

const BASE_URL = "http://evo.test.invalid";
const API_KEY = "apikey-global-de-teste";
const WEBHOOK_URL = "https://api.test.invalid/api/v1/webhooks/evolution";
const WEBHOOK_SECRET = "segredo-webhook-de-teste-32-chars!!";

interface RecordedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

/** fetchImpl falso: registra TODA chamada e devolve respostas programadas. */
function fakeFetch(responses: EvolutionFetchResponse[]): {
  fetchImpl: FetchLike;
  requests: RecordedRequest[];
} {
  const requests: RecordedRequest[] = [];
  const fetchImpl: FetchLike = async (url, init) => {
    requests.push({ url, method: init.method, headers: init.headers, body: init.body });
    const next = responses.shift();
    if (!next) throw new Error("fetch falso sem resposta programada");
    return next;
  };
  return { fetchImpl, requests };
}

function res(status: number, body: unknown): EvolutionFetchResponse {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
  };
}

function providerWith(fetchImpl: FetchLike, timeoutMs?: number) {
  return createEvolutionProvider({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    webhook: { url: WEBHOOK_URL, secret: WEBHOOK_SECRET },
    fetchImpl,
    timeoutMs,
  });
}

describe("T2: adaptador Evolution — create (fatos 1-3 do probe em produção)", () => {
  it("create envia integration WHATSAPP-BAILEYS + webhook completo no PRÓPRIO body (não existe webhook/set)", async () => {
    const { fetchImpl, requests } = fakeFetch([
      res(201, {
        instance: {
          instanceName: "g-3fa85f64",
          instanceId: "id-1",
          integration: "WHATSAPP-BAILEYS",
          status: "connecting",
        },
        hash: "TOKEN-POR-INSTANCIA-SECRETO",
        webhook: { enabled: true, url: WEBHOOK_URL },
      }),
    ]);
    const provider = providerWith(fetchImpl);
    const created = await provider.createInstance("g-3fa85f64");

    // Fato 2: webhook por instância nasce no create — corpo EXATO esperado.
    expect(requests).toHaveLength(1);
    expect(requests[0].method).toBe("POST");
    expect(requests[0].url).toBe(`${BASE_URL}/instance/create`);
    expect(JSON.parse(requests[0].body!)).toEqual({
      instanceName: "g-3fa85f64",
      qrcode: true,
      integration: "WHATSAPP-BAILEYS",
      webhook: {
        enabled: true,
        url: WEBHOOK_URL,
        byEvents: false,
        events: ["CONNECTION_UPDATE", "QRCODE_UPDATED"],
        base64: false,
        headers: { "x-grupos-evo-secret": WEBHOOK_SECRET },
      },
    });

    // Fato 3: só instance.{instanceName,instanceId,status}; hash DESCARTADO.
    expect(created).toEqual({
      instanceName: "g-3fa85f64",
      instanceId: "id-1",
      status: "connecting",
    });
  });

  it("apikey global viaja no HEADER (nunca na URL); header content-type só com body", async () => {
    const { fetchImpl, requests } = fakeFetch([res(200, { instance: { state: "open" } })]);
    const provider = providerWith(fetchImpl);
    await provider.connect("g-abc");
    expect(requests[0].headers.apikey).toBe(API_KEY);
    expect(requests[0].url).not.toContain(API_KEY);
    expect(requests[0].headers["content-type"]).toBeUndefined(); // GET sem body
  });
});

describe("T2: adaptador — connect normaliza os 3 shapes (fato 4)", () => {
  it("shape flat {pairingCode, code, base64} → {state:'connecting', qrDataUrl} (base64 JÁ é data URL)", async () => {
    const { fetchImpl, requests } = fakeFetch([
      res(200, { pairingCode: null, code: "2@ABC=", base64: "data:image/png;base64,QRFLAT" }),
    ]);
    const provider = providerWith(fetchImpl);
    const state = await provider.connect("g-abc");
    expect(state).toEqual({ state: "connecting", qrDataUrl: "data:image/png;base64,QRFLAT" });
    expect(requests[0].method).toBe("GET");
    expect(requests[0].url).toBe(`${BASE_URL}/instance/connect/g-abc`);
  });

  it("shape {instance:{state:'open'}} → conectada, sem QR", async () => {
    const { fetchImpl } = fakeFetch([res(200, { instance: { instanceName: "g-abc", state: "open" } })]);
    const provider = providerWith(fetchImpl);
    expect(await provider.connect("g-abc")).toEqual({ state: "open", qrDataUrl: null });
  });

  it("shape legado {qrcode:{base64}} → QR com state connecting", async () => {
    const { fetchImpl } = fakeFetch([
      res(200, { qrcode: { pairingCode: null, code: "2@X=", base64: "data:image/png;base64,QRLEGADO", count: 1 } }),
    ]);
    const provider = providerWith(fetchImpl);
    expect(await provider.connect("g-abc")).toEqual({
      state: "connecting",
      qrDataUrl: "data:image/png;base64,QRLEGADO",
    });
  });

  it("shape desconhecido/corpo vazio → {state:'unknown', qrDataUrl:null} sem lançar", async () => {
    const a = providerWith(fakeFetch([res(200, {})]).fetchImpl);
    expect(await a.connect("g-abc")).toEqual({ state: "unknown", qrDataUrl: null });
    // array JSON é shape desconhecido (não lança — corpo não-JSON lança, ver suite de erros)
    const b = providerWith(fakeFetch([res(200, [])]).fetchImpl);
    expect(await b.connect("g-abc")).toEqual({ state: "unknown", qrDataUrl: null });
  });
});

describe("T2: adaptador — fetchInstances/logout/delete", () => {
  it("fetchInstances: mapeia connectionStatus objeto OU string; DESCARTA token/hash", async () => {
    const { fetchImpl } = fakeFetch([
      res(200, [
        {
          instanceName: "g-abc",
          connectionStatus: { state: "open" },
          ownerJid: "5511999999999@s.whatsapp.net",
          number: "5511999999999",
          token: "TOKEN-SECRETO-1",
        },
        { name: "g-outro", connectionStatus: "connecting", token: "TOKEN-SECRETO-2" },
      ]),
    ]);
    const provider = providerWith(fetchImpl);
    const summaries = await provider.fetchInstances("g-abc");
    expect(summaries).toEqual([
      {
        instanceName: "g-abc",
        state: "open",
        ownerJid: "5511999999999@s.whatsapp.net",
        number: "5511999999999",
      },
      { instanceName: "g-outro", state: "connecting", ownerJid: null, number: null },
    ]);
    // token/hash nunca atravessam para os tipos nossos
    expect(JSON.stringify(summaries)).not.toContain("TOKEN-SECRETO");
  });

  it("fetchInstances: query instanceName na URL; 404 → lista vazia; não-array → vazio", async () => {
    const { fetchImpl, requests } = fakeFetch([res(200, [])]);
    const provider = providerWith(fetchImpl);
    expect(await provider.fetchInstances("g-abc")).toEqual([]);
    expect(requests[0].url).toBe(`${BASE_URL}/instance/fetchInstances?instanceName=g-abc`);

    const notFound = providerWith(fakeFetch([res(404, { message: "not found" })]).fetchImpl);
    await expect(notFound.fetchInstances("g-x")).resolves.toEqual([]);

    const weird = providerWith(fakeFetch([res(200, { nao: "array" })]).fetchImpl);
    await expect(weird.fetchInstances("g-x")).resolves.toEqual([]);
  });

  it("logout e delete usam DELETE nos paths da 2.3.7 (fato 6)", async () => {
    const logoutFetch = fakeFetch([res(200, { status: 404, message: "sem sessão" })]); // 2xx com corpo → ok
    const provider = providerWith(logoutFetch.fetchImpl);
    await provider.logout("g-abc");
    expect(logoutFetch.requests[0].method).toBe("DELETE");
    expect(logoutFetch.requests[0].url).toBe(`${BASE_URL}/instance/logout/g-abc`);

    const deleteFetch = fakeFetch([res(200, { status: 200, message: "deleted" })]);
    await providerWith(deleteFetch.fetchImpl).deleteInstance("g-abc");
    expect(deleteFetch.requests[0].url).toBe(`${BASE_URL}/instance/delete/g-abc`);
  });
});

describe("T2: adaptador — erros tipados SEM url/chave/corpo do provedor", () => {
  const networkFetch = (async () => {
    throw new Error("ECONNREFUSED simulado");
  }) as FetchLike;

  it("rede caída → EvolutionUnavailableError; 401/403 → EvolutionAuthError; 5xx → Unavailable; 4xx → RequestError(status)", async () => {
    await expect(providerWith(networkFetch).connect("g-abc")).rejects.toBeInstanceOf(
      EvolutionUnavailableError,
    );
    await expect(providerWith(fakeFetch([res(401, {})]).fetchImpl).connect("g-abc")).rejects.toBeInstanceOf(
      EvolutionAuthError,
    );
    await expect(providerWith(fakeFetch([res(403, {})]).fetchImpl).connect("g-abc")).rejects.toBeInstanceOf(
      EvolutionAuthError,
    );
    await expect(providerWith(fakeFetch([res(500, {})]).fetchImpl).connect("g-abc")).rejects.toBeInstanceOf(
      EvolutionUnavailableError,
    );
    await expect(providerWith(fakeFetch([res(503, {})]).fetchImpl).connect("g-abc")).rejects.toBeInstanceOf(
      EvolutionUnavailableError,
    );
    await expect(providerWith(fakeFetch([res(400, {})]).fetchImpl).connect("g-abc")).rejects.toBeInstanceOf(
      EvolutionRequestError,
    );
  });

  it("4xx carrega o status; isEvolutionError reconhece todos", async () => {
    const { fetchImpl } = fakeFetch([res(400, { message: "does not exist" })]);
    const provider = providerWith(fetchImpl);
    const err = await provider.connect("g-inexistente").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(EvolutionRequestError);
    expect((err as EvolutionRequestError).status).toBe(400);
    expect(isEvolutionError(err)).toBe(true);

    expect(isEvolutionError(new EvolutionUnavailableError("x"))).toBe(true);
    expect(isEvolutionError(new EvolutionAuthError("x"))).toBe(true);
    expect(isEvolutionError(new Error("x"))).toBe(false);
  });

  it("timeout (AbortController) → EvolutionUnavailableError de tempo limite; mensagem SEM host/url", async () => {
    // fetch que nunca resolve: só rejeita quando o sinal de abort dispara.
    const hanging: FetchLike = (_url, init) =>
      new Promise((_resolve, reject) => {
        init.signal.addEventListener("abort", () => reject(new Error("aborted")));
      });
    const provider = providerWith(hanging, 15);
    const err = await provider.connect("g-abc").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(EvolutionUnavailableError);
    expect((err as Error).message).toMatch(/tempo limite/);
    expect((err as Error).message).not.toContain(BASE_URL);
  });

  it("2xx com corpo não-JSON → EvolutionUnavailableError (shape inesperado); corpo vazio → null sem erro", async () => {
    const bad = providerWith(fakeFetch([res(200, "ok-não-json")]).fetchImpl);
    await expect(bad.connect("g-abc")).rejects.toBeInstanceOf(EvolutionUnavailableError);

    const empty = providerWith(fakeFetch([res(200, "")]).fetchImpl);
    await expect(empty.connect("g-abc")).resolves.toEqual({ state: "unknown", qrDataUrl: null });
  });
});

describe("T2/R1: função única de redação redactEvolutionWebhookPayload", () => {
  it("remove apikey em QUALQUER profundidade e anula qrcode.base64; preserva o resto", () => {
    const payload = {
      event: "QRCODE_UPDATED",
      instance: "g-abc",
      destination: "https://api.test.invalid/api/v1/webhooks/evolution",
      server_url: "https://evo.test.invalid",
      apikey: "CHAVE-GLOBAL-MARCADOR",
      data: {
        apikey: "CHAVE-GLOBAL-MARCADOR",
        qrcode: { pairingCode: null, code: "2@X=", base64: "data:image/png;base64,SEGREDOS", count: 3 },
        message: "QR code updated",
      },
    };
    const redacted = redactEvolutionWebhookPayload(payload);
    expect(JSON.stringify(redacted)).not.toContain("CHAVE-GLOBAL-MARCADOR");
    expect(JSON.stringify(redacted)).not.toContain("data:image");
    expect(redacted).toEqual({
      event: "QRCODE_UPDATED",
      instance: "g-abc",
      destination: "https://api.test.invalid/api/v1/webhooks/evolution",
      server_url: "https://evo.test.invalid",
      data: {
        qrcode: { pairingCode: null, code: null, base64: null, count: 3 },
        message: "QR code updated",
      },
    });
    // original intacto (cópia profunda)
    expect(payload.data.qrcode.base64).toBe("data:image/png;base64,SEGREDOS");
    expect(payload.apikey).toBe("CHAVE-GLOBAL-MARCADOR");
  });

  it("arrays, primitivos e objetos sem segredos passam ilesos; null/undefined seguros", () => {
    expect(redactEvolutionWebhookPayload(null)).toBe(null);
    expect(redactEvolutionWebhookPayload("texto")).toBe("texto");
    expect(redactEvolutionWebhookPayload(42)).toBe(42);
    // chave removida deixa o objeto VAZIO (remoção ≠ anulação — T8 prova ausência)
    expect(redactEvolutionWebhookPayload([{ apikey: "K" }, { ok: 1 }])).toEqual([{}, { ok: 1 }]);
  });

  it("jidLocalPart extrai a parte local do JID (ownerJid/wuid → phone)", () => {
    expect(jidLocalPart("5511999999999@s.whatsapp.net")).toBe("5511999999999");
    expect(jidLocalPart("sem-arroba")).toBe("sem-arroba");
  });
});

describe("T2: ESTRUTURAL — zero fetch direto nas rotas (D8)", () => {
  it("nenhum arquivo de src/routes chama fetch / importa cliente HTTP", () => {
    const routesDir = fileURLToPath(new URL("../src/routes", import.meta.url));
    const files = readdirSync(routesDir, { recursive: true })
      .map(String)
      .filter((f) => f.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0); // sanity: achou os arquivos
    for (const file of files) {
      const content = readFileSync(join(routesDir, file), "utf8");
      expect(content, `${file} não deve chamar fetch`).not.toMatch(/\bfetch\s*\(/);
      expect(content, `${file} não deve importar undici/node:http`).not.toMatch(/["']undici["']/);
      expect(content, `${file} não deve usar node:http`).not.toMatch(/node:http/);
      expect(content, `${file} não deve instanciar EvolutionHttpClient`).not.toMatch(
        /new\s+EvolutionHttpClient/,
      );
    }
  });
});
