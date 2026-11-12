// Envelope de erro único (ERR-01): { error: { code, message, details? } }
// Códigos estáveis e status HTTP definidos no contrato §5.5.
import type { FastifyError, FastifyInstance, FastifyReply } from "fastify";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "AUTH_INVALID_CREDENTIALS"
  | "AUTH_UNAUTHENTICATED"
  | "AUTH_RATE_LIMITED"
  | "AUTH_EMAIL_TAKEN"
  | "TENANT_FORBIDDEN"
  | "NOT_FOUND"
  | "PROJECT_NOT_EMPTY"
  | "ACCOUNT_CONNECTED"
  | "EVOLUTION_NOT_CONNECTED"
  | "EVOLUTION_INSTANCE_TAKEN"
  | "EVOLUTION_UNAVAILABLE"
  | "EVOLUTION_NOT_CONFIGURED"
  | "EVOLUTION_WEBHOOK_SECRET_INVÁLIDO"
  | "INTERNAL_ERROR";

export interface ErrorEnvelope {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly headers?: Record<string, string>;

  constructor(
    code: ErrorCode,
    status: number,
    message: string,
    options?: { details?: unknown; headers?: Record<string, string> },
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = options?.details;
    this.headers = options?.headers;
  }
}

// ---- Construtores (mensagens estáveis; nunca incluem dados de usuário) ----

export function validationError(details?: unknown): AppError {
  return new AppError("VALIDATION_ERROR", 400, "Entrada inválida.", { details });
}

export function invalidCredentials(): AppError {
  return new AppError("AUTH_INVALID_CREDENTIALS", 401, "E-mail ou senha inválidos.");
}

export function unauthenticated(): AppError {
  return new AppError("AUTH_UNAUTHENTICATED", 401, "Não autenticado.");
}

export function rateLimited(retryAfterSeconds: number): AppError {
  return new AppError("AUTH_RATE_LIMITED", 429, "Muitas tentativas. Tente novamente mais tarde.", {
    headers: { "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) },
  });
}

export function emailTaken(): AppError {
  return new AppError("AUTH_EMAIL_TAKEN", 409, "Este e-mail já está cadastrado.");
}

export function tenantForbidden(): AppError {
  // Corpo genérico e idêntico ao de recurso inexistente — não vaza existência (ENG-02).
  return new AppError("TENANT_FORBIDDEN", 404, "Recurso não encontrado.");
}

// Fatia 6 (PRJ, D19/D21): 409 de estado, NÃO de validação — o recurso está
// íntegro e recusa a exclusão. Mensagem genérica FIXA, sem details, sem
// contagem: corpo byte a byte igual para qualquer projeto não-vazio (não
// vaza cardinalidade; o releaseCount real só aparece no GET da própria org).
export function projectNotEmpty(): AppError {
  return new AppError("PROJECT_NOT_EMPTY", 409, "O projeto contém campanhas vinculadas.");
}

// Fatia 7 (Contas QR, F7-D3/D5): estados de conexao com o provedor Evolution.
// Mensagens FIXAS e genéricas — sem detalhe de rede/URL/chave/instância
// (T14); mutações de status só por evidência do provedor, os 409/502/503
// abaixo NUNCA mudam o estado persistido (honestidade DIR-04).

/** 409: connect ou GET /qr em conta já conectada (F7-D5). */
export function accountConnected(): AppError {
  return new AppError("ACCOUNT_CONNECTED", 409, "A conta já está conectada.");
}

/**
 * 409: disconnect em conta não-conectada (§0.1.4) ou GET /qr em conta sem
 * instância Evolution — nunca conectada (emenda R2 do parecer A4).
 */
export function evolutionNotConnected(): AppError {
  return new AppError("EVOLUTION_NOT_CONNECTED", 409, "A conta não está conectada a uma instância do provedor.");
}

/**
 * 409: violação da UNIQUE de evolution_instance_name (colisão do prefixo de
 * 32 bits entre contas distintas — §2.1.2/R3): envelope padrão, nunca 500.
 */
export function evolutionInstanceTaken(): AppError {
  return new AppError("EVOLUTION_INSTANCE_TAKEN", 409, "Nome de instância do provedor já utilizado por outra conta.");
}

/** 502: falha de chamada ao provedor (rede/timeout/5xx/401 da apikey) — status intacto. */
export function evolutionUnavailable(): AppError {
  return new AppError("EVOLUTION_UNAVAILABLE", 502, "Provedor de conexão indisponível.");
}

/** 503: EVOLUTION_API_KEY vazia (provider desabilitado — F7-D8) — status intacto. */
export function evolutionNotConfigured(): AppError {
  return new AppError("EVOLUTION_NOT_CONFIGURED", 503, "Provedor de conexão não configurado.");
}

/** 401: webhook sem/errado x-grupos-evo-secret (F7-D6; nome literal com acento). */
export function evolutionWebhookSecretInvalid(): AppError {
  return new AppError("EVOLUTION_WEBHOOK_SECRET_INVÁLIDO", 401, "Segredo do webhook inválido.");
}

function envelope(code: ErrorCode, message: string, details?: unknown): ErrorEnvelope {
  const body: ErrorEnvelope = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return body;
}

function validationFields(error: FastifyError): { fields: string[] } {
  const fields = (error.validation ?? [])
    .map((v) => {
      // Achado 4 (pós-auditoria F3): só o PRIMEIRO segmento do instancePath
      // (ex.: "/accountIds/0" → "accountIds") — o campo rejeitado, sem
      // índice/segmento aninhado. Vazio segue para missing/additional/fallback.
      const instancePath = String(v.instancePath ?? "").replace(/^\//, "").split("/")[0];
      const missing = v.params?.missingProperty !== undefined ? String(v.params.missingProperty) : "";
      const additional =
        v.params?.additionalProperty !== undefined ? String(v.params.additionalProperty) : "";
      return instancePath || missing || additional || "body";
    })
    .filter(Boolean);
  return { fields: fields.length > 0 ? fields : ["body"] };
}

// Handler global (setErrorHandler — não setResponseFormatter) + 404 padronizado.
export function registerErrorHandler(app: FastifyInstance, opts: { isProduction: boolean }): void {
  app.setErrorHandler((error: Error, request, reply: FastifyReply) => {
    if (error instanceof AppError) {
      for (const [key, value] of Object.entries(error.headers ?? {})) {
        reply.header(key, value);
      }
      return reply.code(error.status).send(envelope(error.code, error.message, error.details));
    }

    const fastifyError = error as FastifyError;

    // Erros de validação de schema do Fastify (ajv) → 400 com campos rejeitados.
    if (Array.isArray(fastifyError.validation)) {
      return reply
        .code(400)
        .send(envelope("VALIDATION_ERROR", "Entrada inválida.", validationFields(fastifyError)));
    }

    // Outros 4xx do pipeline (JSON malformado, content-type etc.) → VALIDATION_ERROR genérico.
    const status = fastifyError.statusCode ?? 500;
    if (status >= 400 && status < 500) {
      return reply.code(status).send(envelope("VALIDATION_ERROR", "Entrada inválida."));
    }

    // Erro não previsto: 500 com mensagem genérica em produção; detalhe só no log (sem PII).
    request.log.error(
      { err: error, method: request.method, url: request.url },
      "erro interno não tratado",
    );
    const message = opts.isProduction ? "Erro interno." : (error.message ?? "Erro interno.");
    return reply.code(500).send(envelope("INTERNAL_ERROR", message));
  });

  app.setNotFoundHandler((_request, reply) => {
    return reply.code(404).send(envelope("NOT_FOUND", "Rota não encontrada."));
  });
}
