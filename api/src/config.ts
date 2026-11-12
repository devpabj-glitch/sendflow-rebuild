// Parse de variáveis de ambiente com fail-fast. Variáveis são referenciadas
// APENAS por nome; valores NUNCA são logados nem incluídos em mensagens de erro.

export interface AppConfig {
  isProduction: boolean;
  port: number;
  databaseUrl: string | undefined;
  webOrigins: string[];
  authRateMax: number;
  authRateWindowMs: number;
  authRateBlockMs: number;
  authRegisterRateMax: number;
  authRegisterRateWindowMs: number;
  authRegisterRateBlockMs: number;
  authLoginIpRateMax: number;
  authLoginIpRateWindowMs: number;
  sessionTtlHours: number;
  sessionTtlMs: number;
  revision: string;
  logLevel: string;
  /** Fatia 7 (F7-D8): Evolution API 2.3.7 — base do adaptador (default: rede interna Railway). */
  evolutionBaseUrl: string;
  /** Apikey GLOBAL da Evolution. VAZIA = provider desabilitado (503 nas rotas de conexão). */
  evolutionApiKey: string;
  /** URL pública completa do endpoint /api/v1/webhooks/evolution (campo webhook do create). */
  evolutionWebhookUrl: string;
  /** Segredo do header x-grupos-evo-secret (autentica o webhook e vai no create da instância). */
  evolutionWebhookSecret: string;
}

// D2: nome do cookie de sessão (constante de contrato; sem atributo Domain).
export const SESSION_COOKIE_NAME = "grupos_session";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

function parsePositiveInt(
  raw: string | undefined,
  name: string,
  fallback: number,
): number {
  const value = raw?.trim();
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value) || Number(value) <= 0) {
    // Mensagem cita o NOME da variável, nunca o valor.
    throw new ConfigError(`${name} deve ser um inteiro positivo.`);
  }
  return Number(value);
}

export function loadConfig(
  env: NodeJS.ProcessEnv = process.env,
  opts: { requireDatabaseUrl?: boolean } = {},
): AppConfig {
  const nodeEnv = (env.NODE_ENV ?? "development").trim();
  const isProduction = nodeEnv === "production";

  const port = parsePositiveInt(env.PORT, "PORT", 8787);

  const databaseUrl = env.DATABASE_URL?.trim() || undefined;
  if (opts.requireDatabaseUrl && !databaseUrl) {
    throw new ConfigError(
      "DATABASE_URL é obrigatória para subir o servidor ou rodar migrações (os testes usam pg-mem e não a exigem).",
    );
  }

  const webOrigins = (env.WEB_ORIGIN ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  if (webOrigins.includes("*")) {
    throw new ConfigError("WEB_ORIGIN não aceita wildcard (*): liste origens exatas separadas por vírgula.");
  }
  if (isProduction && webOrigins.length === 0) {
    throw new ConfigError("WEB_ORIGIN é obrigatória em produção (NODE_ENV=production): origens exatas do front, separadas por vírgula.");
  }

  // D1 (decidido): 5 tentativas / janela 300000 ms / bloqueio 900000 ms — sobrescrevível por env, por nome.
  const authRateMax = parsePositiveInt(env.AUTH_RATE_MAX, "AUTH_RATE_MAX", 5);
  const authRateWindowMs = parsePositiveInt(env.AUTH_RATE_WINDOW_MS, "AUTH_RATE_WINDOW_MS", 300_000);
  const authRateBlockMs = parsePositiveInt(env.AUTH_RATE_BLOCK_MS, "AUTH_RATE_BLOCK_MS", 900_000);

  // Correção pós-auditoria A3: register sem limite → limite próprio SOMENTE por IP
  // (defaults 10 tentativas / 300000 ms / bloqueio 900000 ms).
  const authRegisterRateMax = parsePositiveInt(env.AUTH_REGISTER_RATE_MAX, "AUTH_REGISTER_RATE_MAX", 10);
  const authRegisterRateWindowMs = parsePositiveInt(
    env.AUTH_REGISTER_RATE_WINDOW_MS,
    "AUTH_REGISTER_RATE_WINDOW_MS",
    300_000,
  );
  const authRegisterRateBlockMs = parsePositiveInt(
    env.AUTH_REGISTER_BLOCK_MS,
    "AUTH_REGISTER_BLOCK_MS",
    900_000,
  );

  // Correção pós-auditoria A3 (stuffing): agregado por IP para FALHAS de login
  // (defaults 30 falhas / 300000 ms; bloqueio = AUTH_RATE_BLOCK_MS, mesmo 900 s).
  const authLoginIpRateMax = parsePositiveInt(env.AUTH_LOGIN_IP_RATE_MAX, "AUTH_LOGIN_IP_RATE_MAX", 30);
  const authLoginIpRateWindowMs = parsePositiveInt(
    env.AUTH_LOGIN_IP_RATE_WINDOW_MS,
    "AUTH_LOGIN_IP_RATE_WINDOW_MS",
    300_000,
  );

  const sessionTtlHours = parsePositiveInt(env.SESSION_TTL_HOURS, "SESSION_TTL_HOURS", 72);

  const revision = env.REVISION?.trim() || env.RAILWAY_GIT_COMMIT_SHA?.trim() || "dev";
  const logLevel = env.LOG_LEVEL?.trim() || "info";

  // Fatia 7 (F7-D8): nomes apenas; valores NUNCA logados. Default do baseUrl
  // = rede interna do Railway (mesmo ambiente da api); em dev local apontar
  // para a URL pública do serviço evolution (a interna não resolve fora).
  const evolutionBaseUrl = env.EVOLUTION_BASE_URL?.trim() || "http://evolution.railway.internal:8080";
  const evolutionApiKey = env.EVOLUTION_API_KEY?.trim() ?? "";
  const evolutionWebhookUrl = env.EVOLUTION_WEBHOOK_URL?.trim() ?? "";
  const evolutionWebhookSecret = env.EVOLUTION_WEBHOOK_SECRET?.trim() ?? "";

  return {
    isProduction,
    port,
    databaseUrl,
    webOrigins,
    authRateMax,
    authRateWindowMs,
    authRateBlockMs,
    authRegisterRateMax,
    authRegisterRateWindowMs,
    authRegisterRateBlockMs,
    authLoginIpRateMax,
    authLoginIpRateWindowMs,
    sessionTtlHours,
    sessionTtlMs: sessionTtlHours * 3_600_000,
    revision,
    logLevel,
    evolutionBaseUrl,
    evolutionApiKey,
    evolutionWebhookUrl,
    evolutionWebhookSecret,
  };
}
