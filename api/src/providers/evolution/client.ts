// Client HTTP fino da Evolution (D8/F7-D8): UNICO ponto com rede do adaptador.
// fetch injetavel (testes sem rede), apikey global via header `apikey`
// (nunca em URL/query/log), timeout por AbortController. Erros sempre tipados
// (types.ts) e com mensagem SEM url/chave/corpo da Evolution - o detalhe que
// interessa (status) viaja no tipo, nao no texto.
import type { FetchLike } from "./types.js";
import {
  EvolutionAuthError,
  EvolutionRequestError,
  EvolutionUnavailableError,
} from "./types.js";

const DEFAULT_TIMEOUT_MS = 15_000;

const defaultFetch: FetchLike = (url, init) => fetch(url, init);

export interface EvolutionClientDeps {
  baseUrl: string;
  apiKey: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

interface RequestOptions {
  method: "GET" | "POST" | "DELETE";
  path: string;
  /** Valores de query string (URLSearchParams; valores nunca sao segredos). */
  query?: Record<string, string>;
  body?: unknown;
}

function withoutTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

export class EvolutionHttpClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(deps: EvolutionClientDeps) {
    this.baseUrl = withoutTrailingSlash(deps.baseUrl.trim());
    this.apiKey = deps.apiKey;
    this.fetchImpl = deps.fetchImpl ?? defaultFetch;
    this.timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  /**
   * Executa uma chamada e devolve o JSON parseado (null quando o corpo e
   * vazio). 2xx -> dado; 401/403 -> EvolutionAuthError; >=500 ->
   * EvolutionUnavailableError; demais 4xx -> EvolutionRequestError(status).
   */
  async request(options: RequestOptions): Promise<unknown> {
    const url = new URL(this.baseUrl + options.path);
    for (const [key, value] of Object.entries(options.query ?? {})) {
      url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = { apikey: this.apiKey };
    let body: string | undefined;
    if (options.body !== undefined) {
      headers["content-type"] = "application/json";
      body = JSON.stringify(options.body);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let text: string;
    let status: number;
    try {
      const response = await this.fetchImpl(url.toString(), {
        method: options.method,
        headers,
        body,
        signal: controller.signal,
      });
      status = response.status;
      text = await response.text();
    } catch (err) {
      // Abort do timeout ou falha de rede: indisponibilidade, mensagem fixa
      // (o nome do host/erro nativo nao vem junto - sem vazamento).
      throw new EvolutionUnavailableError(
        controller.signal.aborted
          ? "Evolution nao respondeu no tempo limite."
          : "Falha de rede ao chamar a Evolution.",
        { cause: err },
      );
    } finally {
      clearTimeout(timer);
    }

    if (status === 401 || status === 403) {
      throw new EvolutionAuthError("Evolution rejeitou a apikey global.");
    }
    if (status >= 500) {
      throw new EvolutionUnavailableError("Evolution respondeu com erro de servidor.");
    }
    if (status < 200 || status >= 300) {
      throw new EvolutionRequestError(status, "Evolution recusou a chamada.");
    }

    const trimmed = text.trim();
    if (trimmed === "") return null;
    try {
      return JSON.parse(trimmed) as unknown;
    } catch {
      // Corpo nao-JSON em 2xx: tratamos como indisponibilidade (shape inesperado).
      throw new EvolutionUnavailableError("Resposta nao-JSON da Evolution.");
    }
  }
}
