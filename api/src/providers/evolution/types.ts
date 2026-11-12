// Tipos puros do adaptador Evolution (D8/F7-D8): mapeiam respostas da
// Evolution API 2.3.7 para tipos NOSSOS. Sem fetch, sem IO — apenas dados.
// Shapes lidos da referencia offline (D9) e validados em producao 12/11
// (fatos 1-4 do probe do orquestrador: create exige "WHATSAPP-BAILEYS";
// nao existe webhook/set; connect devolve {pairingCode, code, base64} flat).

/** Configuracao do webhook por instancia (viaj no body do create - fato 2). */
export interface EvolutionWebhookConfig {
  /** EVOLUTION_WEBHOOK_URL: URL publica completa do endpoint /api/v1/webhooks/evolution. */
  url: string;
  /** EVOLUTION_WEBHOOK_SECRET: valor do header x-grupos-evo-secret. */
  secret: string;
}

/** Resposta mapeada do POST /instance/create (hash/token DESCARTADO - fato 3). */
export interface EvolutionInstanceCreated {
  instanceName: string;
  instanceId: string | null;
  status: string | null;
}

/**
 * Resposta normalizada do GET /instance/connect/:name. O connect da 2.3.7
 * devolve shapes distintos por estado (fato 4 + referencia): QR flat
 * {pairingCode, code, base64} quando ha QR vigente; {instance:{state}} quando
 * open; o adaptador normaliza tudo para {state, qrDataUrl}.
 */
export interface EvolutionInstanceState {
  state: string;
  /** Data URL pronta para <img> (o base64 da Evolution JA e data URL) ou null. */
  qrDataUrl: string | null;
}

/** Resumo de instancia do GET /instance/fetchInstances (token/hash descartados). */
export interface EvolutionInstanceSummary {
  instanceName: string | null;
  state: string | null;
  ownerJid: string | null;
  number: string | null;
}

/**
 * Contrato do adaptador consumido pelas rotas (injecao - ZERO fetch nas
 * rotas). deleteInstance existe no modulo mas NAO tem consumidor nesta fatia
 * (D10 - excluir instancia e fatia futura; presente para completude do
 * modulo de instancia).
 */
export interface EvolutionProvider {
  createInstance(instanceName: string): Promise<EvolutionInstanceCreated>;
  connect(instanceName: string): Promise<EvolutionInstanceState>;
  fetchInstances(instanceName: string): Promise<EvolutionInstanceSummary[]>;
  logout(instanceName: string): Promise<void>;
  deleteInstance(instanceName: string): Promise<void>;
}

// ---- Fetch injetavel (testes sem rede) ------------------------------------

export interface EvolutionFetchResponse {
  status: number;
  ok: boolean;
  text(): Promise<string>;
}

export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body?: string;
    signal: AbortSignal;
  },
) => Promise<EvolutionFetchResponse>;

// ---- Erros tipados (mensagens SEM url/chave/corpo da Evolution) ------------

/** Rede/timeout/5xx: provedor indisponivel -> rotas traduzem para 502. */
export class EvolutionUnavailableError extends Error {
  constructor(
    message: string,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "EvolutionUnavailableError";
  }
}

/** 401/403 da Evolution contra a nossa apikey -> rotas traduzem para 502. */
export class EvolutionAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvolutionAuthError";
  }
}

/** Outro 4xx do provedor (estado recusado etc.) -> rotas traduzem para 502. */
export class EvolutionRequestError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "EvolutionRequestError";
    this.status = status;
  }
}

export function isEvolutionError(err: unknown): boolean {
  return (
    err instanceof EvolutionUnavailableError ||
    err instanceof EvolutionAuthError ||
    err instanceof EvolutionRequestError
  );
}
