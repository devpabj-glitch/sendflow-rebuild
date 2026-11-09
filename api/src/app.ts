// Montagem do Fastify (injetável nos testes): cookie, CORS restrito, rotas,
// errorHandler do envelope único, logger sem corpo/PII (ENG-09).
import Fastify, { type FastifyInstance, type FastifyLoggerOptions } from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import type { DbPool } from "./lib/db.js";
import type { Clock } from "./lib/time.js";
import { SystemClock } from "./lib/time.js";
import type { AppConfig } from "./config.js";
import { LoginRateLimiter } from "./auth/rateLimit.js";
import { registerErrorHandler } from "./lib/errors.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { accountsRoutes } from "./routes/accounts.js";
import { releasesRoutes } from "./routes/releases.js";

export interface AppContext {
  db: DbPool;
  config: AppConfig;
  clock: Clock;
  /** Login: janela de tentativas falhadas por chave e-mail|IP (§5.3). */
  rateLimiter: LoginRateLimiter;
  /** Register: limite por IP puro, chave `register|<ip>` (correção pós-auditoria A3). */
  registerLimiter: LoginRateLimiter;
  /** Login: agregado por IP puro para FALHAS (anti-stuffing — correção pós-auditoria A3). */
  loginIpLimiter: LoginRateLimiter;
  /** Corrida de timeout do SELECT 1 no healthcheck (default 3000 ms; testes encurtam). */
  dbHealthTimeoutMs: number;
}

export interface BuildAppDeps {
  db: DbPool;
  config: AppConfig;
  clock?: Clock;
  rateLimiter?: LoginRateLimiter;
  registerLimiter?: LoginRateLimiter;
  loginIpLimiter?: LoginRateLimiter;
  dbHealthTimeoutMs?: number;
  /** false silencia o logger (testes); default: logger com nível do LOG_LEVEL. */
  logger?: boolean | FastifyLoggerOptions;
}

export async function buildApp(deps: BuildAppDeps): Promise<FastifyInstance> {
  const clock = deps.clock ?? new SystemClock();
  const limiter = (opts: { max: number; windowMs: number; blockMs: number }): LoginRateLimiter =>
    new LoginRateLimiter(opts, clock);
  const ctx: AppContext = {
    db: deps.db,
    config: deps.config,
    clock,
    rateLimiter:
      deps.rateLimiter ??
      limiter({
        max: deps.config.authRateMax,
        windowMs: deps.config.authRateWindowMs,
        blockMs: deps.config.authRateBlockMs,
      }),
    registerLimiter:
      deps.registerLimiter ??
      limiter({
        max: deps.config.authRegisterRateMax,
        windowMs: deps.config.authRegisterRateWindowMs,
        blockMs: deps.config.authRegisterRateBlockMs,
      }),
    loginIpLimiter:
      deps.loginIpLimiter ??
      limiter({
        max: deps.config.authLoginIpRateMax,
        windowMs: deps.config.authLoginIpRateWindowMs,
        // Mesmo bloqueio do login (AUTH_RATE_BLOCK_MS) — sem Retry-After divergente.
        blockMs: deps.config.authRateBlockMs,
      }),
    dbHealthTimeoutMs: deps.dbHealthTimeoutMs ?? 3_000,
  };

  const app = Fastify({
    // IP de origem do rate limit atrás do proxy Railway (X-Forwarded-For) — §5.3/§14.14.
    // Correção pós-auditoria A3: confiar em EXATAMENTE 1 hop (o edge do Railway)
    // — equivalente tipado a `trustProxy: 1`, que o tipo do Fastify 5 não expõe
    // (proxy-addr compila número N para (addr, i) => i < N). Antes: true
    // (confiava em qualquer cadeia). Revalidar se a topologia de proxy mudar.
    trustProxy: (_address: string, hop: number) => hop < 1,
    // O default do Fastify (removeAdditional + coerceTypes) engolia campo
    // proibido e convertia "true" em boolean. O contrato da Fatia 2 exige 400.
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: false,
      },
    },
    // Log de request: método/url/hostname/endereço — SEM corpo, sem e-mail, sem
    // token, sem cookie (nosso endpoints não usam query strings com PII).
    logger:
      deps.logger === undefined || deps.logger === true
        ? { level: deps.config.logLevel }
        : deps.logger,
  });

  await app.register(cookie);

  // CORS restrito por origens exatas (§9): sem wildcard; credentials para o cookie.
  await app.register(cors, {
    origin: deps.config.webOrigins,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["content-type"],
    maxAge: 600,
  });

  registerErrorHandler(app, { isProduction: deps.config.isProduction });

  await app.register(healthRoutes(ctx));
  await app.register(authRoutes(ctx));
  await app.register(accountsRoutes(ctx));
  await app.register(releasesRoutes(ctx));

  return app;
}
