// Modulo de instancia da Evolution 2.3.7 (D8/F7-D8): create / connect /
// fetchInstances / logout / delete. Rotas NUNCA importam daqui diretamente —
// recebem EvolutionProvider injetado (AppContext.evolution) para testar sem
// rede. Shapes: referencia offline (D9) + fatos 1-4 validados em producao
// (12/11): create EXIGE integration "WHATSAPP-BAILEYS" e leva o webhook da
// instancia no proprio body (NAO existe webhook/set na 2.3.7); connect
// devolve QR flat {pairingCode, code, base64} com base64 JA data URL.
import { EvolutionHttpClient } from "./client.js";
import { EvolutionRequestError } from "./types.js";
import type {
  EvolutionInstanceCreated,
  EvolutionInstanceState,
  EvolutionInstanceSummary,
  EvolutionProvider,
  EvolutionWebhookConfig,
  FetchLike,
} from "./types.js";

export interface EvolutionProviderDeps {
  baseUrl: string;
  apiKey: string;
  webhook: EvolutionWebhookConfig;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

const WEBHOOK_EVENTS = ["CONNECTION_UPDATE", "QRCODE_UPDATED"] as const;

// Leitura defensiva (contrato 5.3): helpers que nunca lancam por campo
// ausente/inesperado — o processamento segue com o que houver.
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

/** state a partir de connectionStatus (string "open" ou {state}). */
function readState(connectionStatus: unknown): string | null {
  if (typeof connectionStatus === "string") return connectionStatus;
  const asObject = asRecord(connectionStatus);
  return asObject ? asString(asObject.state) : null;
}

function phoneOfJid(jid: string): string {
  return jid.split("@")[0] ?? jid;
}

export function jidLocalPart(jid: string): string {
  return phoneOfJid(jid);
}

export function createEvolutionProvider(deps: EvolutionProviderDeps): EvolutionProvider {
  const client = new EvolutionHttpClient({
    baseUrl: deps.baseUrl,
    apiKey: deps.apiKey,
    fetchImpl: deps.fetchImpl,
    timeoutMs: deps.timeoutMs,
  });

  return {
    // Fatos 1-3: integration OBRIGATORIA "WHATSAPP-BAILEYS" e webhook por
    // instancia no PROPRIO create (unica forma na 2.3.7). hash (token por
    // instancia) e descartado — nunca persistido nem logado.
    async createInstance(instanceName: string): Promise<EvolutionInstanceCreated> {
      const response = await client.request({
        method: "POST",
        path: "/instance/create",
        body: {
          instanceName,
          qrcode: true,
          integration: "WHATSAPP-BAILEYS",
          webhook: {
            enabled: true,
            url: deps.webhook.url,
            byEvents: false,
            events: [...WEBHOOK_EVENTS],
            base64: false,
            headers: { "x-grupos-evo-secret": deps.webhook.secret },
          },
        },
      });
      const instance = asRecord(asRecord(response)?.instance);
      return {
        instanceName: asString(instance?.instanceName) ?? instanceName,
        instanceId: asString(instance?.instanceId),
        status: asString(instance?.status),
      };
    },

    // Fato 4 + referencia: normaliza os shapes de /instance/connect/:name em
    // {state, qrDataUrl} — QR flat {pairingCode, code, base64} (base64 ja e
    // data URL), {instance:{state}} quando open, {qrcode:{base64}} defensor.
    async connect(instanceName: string): Promise<EvolutionInstanceState> {
      const response = await client.request({
        method: "GET",
        path: `/instance/connect/${encodeURIComponent(instanceName)}`,
      });
      const body = asRecord(response);
      if (!body) return { state: "unknown", qrDataUrl: null };

      // (a) QR flat: {pairingCode, code, base64}
      const flatBase64 = asString(body.base64);
      if (flatBase64 !== null) {
        return { state: "connecting", qrDataUrl: flatBase64 };
      }
      // (b) state open: {instance: {instanceName, state}}
      const instance = asRecord(body.instance);
      const openState = instance ? asString(instance.state) : null;
      if (openState !== null) {
        return { state: openState, qrDataUrl: null };
      }
      // (c) legado/deriva: {qrcode: {base64, ...}}
      const qrcode = asRecord(body.qrcode);
      const wrappedBase64 = qrcode ? asString(qrcode.base64) : null;
      if (wrappedBase64 !== null) {
        return { state: "connecting", qrDataUrl: wrappedBase64 };
      }
      return { state: "unknown", qrDataUrl: null };
    },

    async fetchInstances(instanceName: string): Promise<EvolutionInstanceSummary[]> {
      let response: unknown;
      try {
        response = await client.request({
          method: "GET",
          path: "/instance/fetchInstances",
          query: { instanceName },
        });
      } catch (err) {
        // 404 = "instancia nao existe" na 2.3.7 (NotFoundException da
        // referencia): normaliza para lista vazia. Demais erros propagam.
        if (err instanceof EvolutionRequestError && err.status === 404) {
          return [];
        }
        throw err;
      }
      if (!Array.isArray(response)) return [];
      const summaries: EvolutionInstanceSummary[] = [];
      for (const item of response) {
        const record = asRecord(item);
        if (!record) continue;
        summaries.push({
          instanceName: asString(record.instanceName) ?? asString(record.name),
          state: readState(record.connectionStatus),
          ownerJid: asString(record.ownerJid),
          number: asString(record.number),
          // token/hash deliberadamente NAO lidos (nunca persistidos).
        });
      }
      return summaries;
    },

    async logout(instanceName: string): Promise<void> {
      await client.request({
        method: "DELETE",
        path: `/instance/logout/${encodeURIComponent(instanceName)}`,
      });
    },

    // Sem consumidor nesta fatia (D10/F7-D10): presente para completude.
    async deleteInstance(instanceName: string): Promise<void> {
      await client.request({
        method: "DELETE",
        path: `/instance/delete/${encodeURIComponent(instanceName)}`,
      });
    },
  };
}
