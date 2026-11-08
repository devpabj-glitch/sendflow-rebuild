// Pool pg a partir de DATABASE_URL (contrato §10).
// TLS: ligado quando o host do DATABASE_URL é railway.internal (rede privada
// Railway) ou quando SSL_REQUIRED=1 — sempre por nome, valor nunca logado.
import pg from "pg";
import type { DbPool } from "../lib/db.js";

export function createPool(databaseUrl: string): DbPool {
  let host = "";
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    // String de conexão em formato inesperado: segue sem TLS; erro real aparece na 1ª query.
  }
  const sslRequired = process.env.SSL_REQUIRED === "1" || /railway\.internal/i.test(host);
  const pool = new pg.Pool({
    connectionString: databaseUrl,
    ssl: sslRequired ? { rejectUnauthorized: false } : undefined,
    max: 10,
    // Correção pós-auditoria A3 (hangs): conexão não pode esperar indefinidamente…
    connectionTimeoutMillis: 10_000,
    // …e cada statement/query tem teto duro (statement_timeout roda no servidor;
    // query_timeout é cancelado pelo cliente). Só o pool REAL do pg recebe estas
    // opções — os testes usam o adaptador do pg-mem (test/helpers.ts), que não
    // passa por createPool, logo não precisa de guard.
    statement_timeout: 8_000,
    query_timeout: 8_000,
  });
  return pool as unknown as DbPool;
}
