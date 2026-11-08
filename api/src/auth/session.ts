// Sessão com token opaco (contrato §5.4): o token viaja só no cookie httpOnly;
// no banco persiste exclusivamente sha256(token) (char(64) hex).
import { createHash, randomBytes } from "node:crypto";
import type { Clock } from "../lib/time.js";
import type { QueryExecutor } from "../lib/db.js";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  orgId: string;
}

export interface SessionContext {
  sessionId: string;
  user: SessionUser;
  org: { id: string; name: string };
}

const LAST_USED_TOUCH_THRESHOLD_MS = 60_000;

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function generateSessionToken(): string {
  // 256 bits aleatórios, base64url.
  return randomBytes(32).toString("base64url");
}

function asDate(value: unknown): Date {
  return value instanceof Date ? value : new Date(String(value));
}

export async function createSession(
  db: QueryExecutor,
  userId: string,
  clock: Clock,
  ttlMs: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = generateSessionToken();
  const now = clock.now();
  const expiresAt = new Date(now.getTime() + ttlMs);
  await db.query(
    `INSERT INTO sessions (user_id, token_hash, created_at, expires_at, last_used_at)
     VALUES ($1, $2, $3, $4, $3)`,
    [userId, sha256Hex(token), now, expiresAt],
  );
  return { token, expiresAt };
}

export async function validateSession(
  db: QueryExecutor,
  token: string,
  clock: Clock,
): Promise<SessionContext | null> {
  const tokenHash = sha256Hex(token);
  const res = await db.query(
    `SELECT s.id AS session_id, s.expires_at, s.last_used_at,
            u.id AS user_id, u.email, u.name, u.org_id,
            o.id AS org_id2, o.name AS org_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN organizations o ON o.id = u.org_id
      WHERE s.token_hash = $1
      LIMIT 1`,
    [tokenHash],
  );
  const row = res.rows[0];
  if (!row) return null;

  const now = clock.now();
  const expiresAt = asDate(row.expires_at);
  if (expiresAt.getTime() <= now.getTime()) {
    // Expiração preguiçosa: expirada encontrada em validação é apagada (contrato §4).
    await db.query("DELETE FROM sessions WHERE token_hash = $1", [tokenHash]);
    return null;
  }

  const lastUsed = asDate(row.last_used_at);
  if (now.getTime() - lastUsed.getTime() > LAST_USED_TOUCH_THRESHOLD_MS) {
    // Throttle: só toca last_used_at se >60s (observabilidade, sem renovação de TTL).
    try {
      await db.query("UPDATE sessions SET last_used_at = $1 WHERE id = $2", [now, row.session_id]);
    } catch {
      // best effort: falha no touch não invalida a sessão
    }
  }

  return {
    sessionId: String(row.session_id),
    user: {
      id: String(row.user_id),
      email: String(row.email),
      name: String(row.name),
      orgId: String(row.org_id),
    },
    org: { id: String(row.org_id2), name: String(row.org_name) },
  };
}

export async function deleteSessionByToken(db: QueryExecutor, token: string): Promise<boolean> {
  const res = await db.query("DELETE FROM sessions WHERE token_hash = $1", [sha256Hex(token)]);
  return (res.rowCount ?? 1) > 0;
}

// Best effort, chamado no login (contrato §4 nota): limpeza fora do caminho crítico.
export async function purgeExpiredSessions(db: QueryExecutor, clock: Clock): Promise<void> {
  try {
    await db.query("DELETE FROM sessions WHERE expires_at <= $1", [clock.now()]);
  } catch {
    // best effort
  }
}
