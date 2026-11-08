// Middleware de autenticação (contrato §6): lê o cookie, valida a sessão e
// anexa req.user {id, email, name, orgId}. Sem sessão válida → 401 AUTH_UNAUTHENTICATED.
// Regra de tenant (ENG-02): orgId vem EXCLUSIVAMENTE da sessão — nunca do request.
import type { FastifyReply, FastifyRequest } from "fastify";
import type { Clock } from "../lib/time.js";
import type { QueryExecutor } from "../lib/db.js";
import { SESSION_COOKIE_NAME } from "../config.js";
import { unauthenticated } from "../lib/errors.js";
import { validateSession, type SessionContext, type SessionUser } from "../auth/session.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: SessionUser;
    authSession?: SessionContext;
  }
}

export type RequireAuth = (request: FastifyRequest, reply: FastifyReply) => Promise<void>;

export function makeRequireAuth(deps: { db: QueryExecutor; clock: Clock }): RequireAuth {
  return async function requireAuth(request, _reply) {
    const token = request.cookies?.[SESSION_COOKIE_NAME];
    if (!token) throw unauthenticated();

    const session = await validateSession(deps.db, token, deps.clock);
    if (!session) throw unauthenticated();

    request.user = session.user;
    request.authSession = session;
  };
}
