// Rotas de autenticação (contrato §5.1): register, login, logout, me.
// Cookie de sessão (D2): grupos_session; SameSite=None; Secure; HttpOnly; Path=/; sem Domain.
import type { FastifyInstance, FastifyPluginAsync, FastifyReply } from "fastify";
import type { AppContext } from "../app.js";
import { SESSION_COOKIE_NAME } from "../config.js";
import { makeRequireAuth } from "../middleware/requireAuth.js";
import {
  assertRegisterPasswordPolicy,
  getDummyPasswordHash,
  hashPassword,
  verifyPassword,
} from "../auth/password.js";
import {
  createSession,
  deleteSessionByToken,
  purgeExpiredSessions,
} from "../auth/session.js";
import {
  emailTaken,
  invalidCredentials,
  rateLimited,
} from "../lib/errors.js";

// Mesma regra de e-mail do front legado (preservação de contrato — §5.1).
const EMAIL_PATTERN = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$";

const registerSchema = {
  body: {
    type: "object",
    required: ["email", "password", "name"],
    additionalProperties: false,
    properties: {
      email: { type: "string", minLength: 3, maxLength: 254, pattern: EMAIL_PATTERN },
      // D1: mínimo 8 — contrato novo da API (o auth local de 4 deixa de existir).
      password: { type: "string", minLength: 8, maxLength: 128 },
      name: { type: "string", minLength: 1, maxLength: 200 },
      orgName: { type: "string", minLength: 1, maxLength: 200 },
    },
  },
} as const;

const loginSchema = {
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      // No login a senha não tem mínimo declarado: qualquer entrada inadequada
      // responde AUTH_INVALID_CREDENTIALS genérico (não revela política nem e-mail).
      email: { type: "string", minLength: 3, maxLength: 254 },
      password: { type: "string", minLength: 1, maxLength: 128 },
    },
  },
} as const;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isUniqueViolation(err: unknown): boolean {
  const anyErr = err as { code?: string; message?: string };
  return (
    anyErr?.code === "23505" || /duplicate key|unique constraint/i.test(String(anyErr?.message ?? ""))
  );
}

function setSessionCookie(reply: FastifyReply, token: string, ctx: AppContext): void {
  reply.setCookie(SESSION_COOKIE_NAME, token, {
    path: "/",
    httpOnly: true,
    secure: true, // D2: sempre (navegadores modernos aceitam Secure em localhost)
    sameSite: "none", // D2: sempre (produção cross-origin entre domínios Railway)
    maxAge: Math.floor(ctx.config.sessionTtlMs / 1000),
  });
}

interface RegisterBody {
  email: string;
  password: string;
  name: string;
  orgName?: string;
}

interface LoginBody {
  email: string;
  password: string;
}

export function authRoutes(ctx: AppContext): FastifyPluginAsync {
  return async (app: FastifyInstance) => {
    const requireAuth = makeRequireAuth({ db: ctx.db, clock: ctx.clock });

    // ------------------------------------------------------------------ register
    app.post(
      "/api/v1/auth/register",
      { schema: registerSchema },
      async (request, reply) => {
        // Rate limit do register SOMENTE por IP (correção pós-auditoria A3):
        // chave `register|<ip>` na instância própria do limiter; conta TODA
        // tentativa (não só falhas) — a 11ª na janela recebe 429.
        const ip = request.ip; // trustProxy: 1 — X-Forwarded-For do edge Railway (§5.3)
        const gate = ctx.registerLimiter.check("register", ip);
        if (gate.blocked) throw rateLimited(gate.retryAfterSeconds);
        ctx.registerLimiter.recordFailure("register", ip); // register: toda tentativa conta

        const body = request.body as RegisterBody;
        const email = normalizeEmail(body.email);
        assertRegisterPasswordPolicy(body.password); // defesa em profundidade (schema já valida)
        const name = body.name.trim();
        // orgName ausente → nome derivado do e-mail (contrato §5.1): "Organização de {parte-local}".
        const orgName = body.orgName?.trim() || `Organização de ${email.split("@")[0]}`;

        // 409 AUTH_EMAIL_TAKEN preserva o contrato vigente do front (D1).
        const existing = await ctx.db.query(
          "SELECT 1 FROM users WHERE lower(email) = lower($1) LIMIT 1",
          [email],
        );
        if (existing.rows.length > 0) throw emailTaken();

        const passwordHash = await hashPassword(body.password); // scrypt async (não bloqueia o loop)
        const now = ctx.clock.now();

        // Org + usuário dono + sessão (login automático) em UMA transação.
        const client = await ctx.db.connect();
        try {
          await client.query("BEGIN");
          const orgRes = await client.query(
            "INSERT INTO organizations (name, created_at, updated_at) VALUES ($1, $2, $2) RETURNING id, name",
            [orgName, now],
          );
          const orgRow = orgRes.rows[0] as { id: string; name: string };
          const userRes = await client.query(
            `INSERT INTO users (org_id, email, password_hash, name, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, $5) RETURNING id, email, name`,
            [orgRow.id, email, passwordHash, name, now],
          );
          const userRow = userRes.rows[0] as { id: string; email: string; name: string };
          const session = await createSession(client, userRow.id, ctx.clock, ctx.config.sessionTtlMs);
          await client.query("COMMIT");

          setSessionCookie(reply, session.token, ctx);
          return reply.code(201).send({
            user: { id: userRow.id, email: userRow.email, name: userRow.name },
            org: { id: orgRow.id, name: orgRow.name },
          });
        } catch (err) {
          await client.query("ROLLBACK").catch(() => undefined);
          if (isUniqueViolation(err)) throw emailTaken(); // corrida de registro simultâneo
          throw err;
        } finally {
          client.release();
        }
      },
    );

    // ------------------------------------------------------------------ login
    app.post(
      "/api/v1/auth/login",
      { schema: loginSchema },
      async (request, reply) => {
        const body = request.body as LoginBody;
        const email = normalizeEmail(body.email);
        const ip = request.ip; // trustProxy: 1 — X-Forwarded-For do edge Railway (§5.3)

        // Gate DUPLO, ANTES de verificar credenciais: por e-mail|IP (§5.3) e o
        // agregado por IP puro (anti-stuffing — correção pós-auditoria A3; a
        // chave com prefixo vazio nunca colide com e-mail: schema exige ≥3 chars).
        // Retry-After ÚNICO: o MAIOR bloqueio ativo entre os dois (nunca divergente).
        const emailGate = ctx.rateLimiter.check(email, ip);
        const ipGate = ctx.loginIpLimiter.check("", ip);
        if (emailGate.blocked || ipGate.blocked) {
          throw rateLimited(Math.max(emailGate.retryAfterSeconds, ipGate.retryAfterSeconds));
        }

        const res = await ctx.db.query(
          `SELECT u.id, u.email, u.name, u.password_hash, u.org_id, o.name AS org_name
             FROM users u
             JOIN organizations o ON o.id = u.org_id
            WHERE lower(u.email) = lower($1)
            LIMIT 1`,
          [email],
        );
        const row = res.rows[0] as
          | { id: string; email: string; name: string; password_hash: string; org_id: string; org_name: string }
          | undefined;

        // Mesma mensagem e mesmo esforço nos dois casos (§5.5): verificação dummy
        // queima o tempo do scrypt quando o e-mail não existe.
        const referenceHash = row?.password_hash ?? (await getDummyPasswordHash());
        const passwordOk = await verifyPassword(body.password, referenceHash);

        if (!row || !passwordOk) {
          ctx.rateLimiter.recordFailure(email, ip);
          ctx.loginIpLimiter.recordFailure("", ip); // agregado por IP (mesma falha conta 1× em cada)
          throw invalidCredentials(); // 401 genérico — não revela qual campo errou
        }

        // Sucesso limpa a janela e-mail|IP (§5.1). O agregado por IP NÃO é limpo:
        // falhas envelhecem pela janela — sucesso de terceiro no mesmo IP (NAT)
        // não zeraria o histórico de um atacante.
        ctx.rateLimiter.recordSuccess(email, ip);
        await purgeExpiredSessions(ctx.db, ctx.clock); // best effort (§4 nota)
        const session = await createSession(ctx.db, row.id, ctx.clock, ctx.config.sessionTtlMs);
        setSessionCookie(reply, session.token, ctx);
        return reply.code(200).send({
          user: { id: row.id, email: row.email, name: row.name },
          org: { id: row.org_id, name: row.org_name },
        });
      },
    );

    // ------------------------------------------------------------------ logout
    app.post("/api/v1/auth/logout", async (request, reply) => {
      const token = request.cookies?.[SESSION_COOKIE_NAME];
      if (token) {
        await deleteSessionByToken(ctx.db, token);
      }
      reply.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
      return reply.code(204).send(); // idempotente: sem sessão também 204
    });

    // ------------------------------------------------------------------ me
    app.get("/api/v1/auth/me", { preHandler: requireAuth }, async (request, reply) => {
      const session = request.authSession!; // garantido pelo requireAuth
      return reply.code(200).send({
        user: { id: session.user.id, email: session.user.email, name: session.user.name },
        org: { id: session.org.id, name: session.org.name },
      });
    });
  };
}
