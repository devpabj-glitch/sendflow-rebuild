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

function envelope(code: ErrorCode, message: string, details?: unknown): ErrorEnvelope {
  const body: ErrorEnvelope = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return body;
}

function validationFields(error: FastifyError): { fields: string[] } {
  const fields = (error.validation ?? [])
    .map((v) => {
      const instancePath = String(v.instancePath ?? "").replace(/^\//, "");
      const missing = v.params?.missingProperty !== undefined ? String(v.params.missingProperty) : "";
      return instancePath || missing || "?";
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
