// Runner de migrações transacional: up | down | status (contrato §7).
// Mesmo runner para PostgreSQL real e pg-mem (testes) — pool injetado.
// Cada migração roda em UMA transação com insert-first na tabela de controle:
// duas instâncias correndo juntas colidem na UNIQUE(name) e a segunda TRATA a
// colisão como "outra instância aplicou" — relê o status e SEGUE (log
// informativo; o bootstrap não morre por corrida — correção pós-auditoria A3).
//
// Convenção: NNN_nome.up.sql + NNN_nome.down.sql (NNN sequencial, nunca renumerado;
// correção = nova migração). Checksum = sha256 dos arquivos normalizados (LF) —
// edição de migração já aplicada falha alto, nada é reaplicado/descartado em silêncio.
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { DbClient, DbPool, QueryExecutor } from "../lib/db.js";
import { loadConfig } from "../config.js";
import { createPool } from "./pool.js";

export interface MigrationFile {
  id: number;
  name: string;
  upSql: string;
  downSql: string;
  checksum: string;
}

export interface MigrationStatus {
  applied: { name: string; appliedAt: Date }[];
  pending: string[];
}

const MIGRATIONS_DIR = fileURLToPath(new URL("./migrations", import.meta.url));

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Normaliza finais de linha (LF) para o checksum/execução: checkout Windows ≠ Linux sem falsa divergência. */
function normalize(sql: string): string {
  return sql.replace(/\r\n/g, "\n");
}

export function loadMigrationFiles(dir: string = MIGRATIONS_DIR): MigrationFile[] {
  const entries = readdirSync(dir)
    .filter((f) => f.endsWith(".up.sql") || f.endsWith(".down.sql"))
    .sort();

  const byId = new Map<number, { name: string; up?: string; down?: string }>();
  for (const entry of entries) {
    const match = /^(\d+)_(.+)\.(up|down)\.sql$/.exec(entry);
    if (!match) throw new Error(`Arquivo de migração com nome inválido: ${entry}`);
    const id = Number(match[1]);
    const name = `${match[1]}_${match[2]}`;
    const record = byId.get(id) ?? { name };
    const content = normalize(readFileSync(path.join(dir, entry), "utf8"));
    if (match[3] === "up") record.up = content;
    else record.down = content;
    byId.set(id, record);
  }

  const files: MigrationFile[] = [];
  for (const [id, record] of [...byId.entries()].sort((a, b) => a[0] - b[0])) {
    if (record.up === undefined || record.down === undefined) {
      throw new Error(`Migração ${record.name} incompleta: par .up.sql/.down.sql é obrigatório.`);
    }
    files.push({
      id,
      name: record.name,
      upSql: record.up,
      downSql: record.down,
      checksum: sha256(`${record.up}\n---down---\n${record.down}`),
    });
  }
  return files;
}

async function ensureMigrationsTable(executor: QueryExecutor): Promise<void> {
  // Existência checada antes: no pg-mem, o "IF NOT EXISTS" em tabela JÁ existente
  // deixa nós do AST não lidos e ERRA (limite conhecido do pg-mem); no PostgreSQL
  // real o IF NOT EXISTS do CREATE segue como salvaguarda contra criação concorrente.
  const exists = await executor.query(
    `SELECT 1 FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_name = 'migrations' LIMIT 1`,
  );
  if (exists.rows.length > 0) return;
  await executor.query(`CREATE TABLE IF NOT EXISTS migrations (
    id         serial PRIMARY KEY,
    name       text NOT NULL UNIQUE,
    checksum   text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`);
}

async function getApplied(executor: QueryExecutor): Promise<Map<string, string>> {
  const res = await executor.query("SELECT name, checksum FROM migrations ORDER BY id ASC");
  const applied = new Map<string, string>();
  for (const row of res.rows) {
    applied.set(String(row.name), String(row.checksum));
  }
  return applied;
}

/** Falha alto se checksum de migração aplicada divergiu (ENG-04 — nada silencioso). */
function assertNoDivergence(applied: Map<string, string>, files: MigrationFile[]): void {
  for (const file of files) {
    const recorded = applied.get(file.name);
    if (recorded !== undefined && recorded !== file.checksum) {
      throw new Error(
        `Migração "${file.name}" já aplicada com checksum divergente — o arquivo foi editado após a aplicação. Corrija criando uma NOVA migração (nunca edite migração aplicada).`,
      );
    }
  }
  for (const name of applied.keys()) {
    if (!files.some((f) => f.name === name)) {
      throw new Error(`Migração aplicada "${name}" não existe mais nos arquivos — estado do banco não corresponde ao código.`);
    }
  }
}

/** Migrações rodam num cliente dedicado quando o pool fornece connect() (pg real); pg-mem também suporta. */
async function acquireClient(pool: DbPool | QueryExecutor): Promise<{ client: QueryExecutor; release: () => void }> {
  if (typeof (pool as DbPool).connect === "function") {
    const client: DbClient = await (pool as DbPool).connect();
    return { client, release: () => client.release() };
  }
  return { client: pool, release: () => undefined };
}

export interface MigrateUpResult {
  applied: string[];
  alreadyApplied: number;
  /** Migrações que esta instância NÃO aplicou: outra venceu a corrida (23505) e seguiu. */
  raced: string[];
}

/** Unique violation do PostgreSQL (corrida no insert da tabela de controle). */
function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; message?: string };
  return (
    e?.code === "23505" || /duplicate key|unique constraint/i.test(String(e?.message ?? ""))
  );
}

export async function migrateUp(
  pool: DbPool | QueryExecutor,
  files: MigrationFile[] = loadMigrationFiles(),
): Promise<MigrateUpResult> {
  const { client, release } = await acquireClient(pool);
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    assertNoDivergence(applied, files);
    const toApply = files.filter((f) => !applied.has(f.name));
    const raced: string[] = [];

    for (const file of toApply) {
      await client.query("BEGIN");
      try {
        // Insert-first: a UNIQUE(name) exclui execuções concorrentes (§7).
        await client.query("INSERT INTO migrations (name, checksum) VALUES ($1, $2)", [
          file.name,
          file.checksum,
        ]);
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        if (isUniqueViolation(err)) {
          // Corrida: outra instância aplicou ENTRE o nosso SELECT e o INSERT.
          // Relê o estado, confirma o registro e SEGUE (correção pós-auditoria A3).
          const appliedNow = await getApplied(client);
          if (!appliedNow.has(file.name)) {
            throw new Error(
              `Violação de unicidade inesperada em "${file.name}" sem registro aplicado — investigar manualmente.`,
            );
          }
          raced.push(file.name);
          continue;
        }
        throw new Error(
          `Falha ao aplicar migração "${file.name}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      try {
        await client.query(file.upSql);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw new Error(
          `Falha ao aplicar migração "${file.name}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    const racedSet = new Set(raced);
    return {
      applied: toApply.filter((f) => !racedSet.has(f.name)).map((f) => f.name),
      alreadyApplied: applied.size,
      raced,
    };
  } finally {
    release();
  }
}

export async function migrateDown(
  pool: DbPool | QueryExecutor,
  files: MigrationFile[] = loadMigrationFiles(),
  count: number = 1,
): Promise<{ rolledBack: string[] }> {
  const { client, release } = await acquireClient(pool);
  try {
    await ensureMigrationsTable(client);
    const applied = await getApplied(client);
    assertNoDivergence(applied, files);

    // Mais recentes primeiro (ordem inversa de dependência).
    const appliedNames = [...applied.keys()].reverse();
    const target = Number.isFinite(count) ? Math.min(count, appliedNames.length) : appliedNames.length;

    const rolledBack: string[] = [];
    for (const name of appliedNames.slice(0, target)) {
      const file = files.find((f) => f.name === name);
      if (!file) throw new Error(`Migração aplicada "${name}" sem arquivo correspondente.`);
      await client.query("BEGIN");
      try {
        await client.query(file.downSql);
        await client.query("DELETE FROM migrations WHERE name = $1", [name]);
        await client.query("COMMIT");
      } catch (err) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw new Error(
          `Falha ao reverter migração "${name}": ${err instanceof Error ? err.message : String(err)}`,
        );
      }
      rolledBack.push(name);
    }
    return { rolledBack };
  } finally {
    release();
  }
}

export async function migrateStatus(
  pool: DbPool | QueryExecutor,
  files: MigrationFile[] = loadMigrationFiles(),
): Promise<MigrationStatus> {
  const { client, release } = await acquireClient(pool);
  try {
    await ensureMigrationsTable(client);
    const res = await client.query("SELECT name, applied_at FROM migrations ORDER BY id ASC");
    const appliedRows = res.rows.map((row) => ({
      name: String(row.name),
      appliedAt: row.applied_at instanceof Date ? row.applied_at : new Date(String(row.applied_at)),
    }));
    const appliedNames = new Set(appliedRows.map((row) => row.name));
    // Falha alto em divergência (§7): o caller decide como reportar.
    const applied = await getApplied(client);
    assertNoDivergence(applied, files);
    return {
      applied: appliedRows,
      pending: files.filter((f) => !appliedNames.has(f.name)).map((f) => f.name),
    };
  } finally {
    release();
  }
}

// ---------------------------------------------------------------------------
// CLI: tsx src/db/migrate.ts <up|down|status> [n|all]
// ---------------------------------------------------------------------------

const USAGE = "uso: npm run migrate:up | npm run migrate:down [n|all] | npm run migrate:status";

export async function runCli(argv: string[]): Promise<number> {
  const [command, countArg] = argv;
  if (command !== "up" && command !== "down" && command !== "status") {
    console.error(USAGE);
    return 1;
  }
  const config = loadConfig(process.env, { requireDatabaseUrl: true });
  const pool = createPool(config.databaseUrl!);
  try {
    const files = loadMigrationFiles();
    if (command === "up") {
      const result = await migrateUp(pool, files);
      console.log(
        result.applied.length === 0
          ? `migrações em dia (no-op); aplicadas: ${result.alreadyApplied}`
          : `aplicadas ${result.applied.length}: ${result.applied.join(", ")}`,
      );
      if (result.raced.length > 0) {
        console.log(
          `corrida concorrente: ${result.raced.length} já aplicada(s) por outra instância (23505): ${result.raced.join(", ")}`,
        );
      }
    } else if (command === "down") {
      let count = 1;
      if (countArg === "all") count = Number.POSITIVE_INFINITY;
      else if (countArg !== undefined) {
        if (!/^\d+$/.test(countArg) || Number(countArg) <= 0) {
          console.error("argumento de down deve ser um inteiro positivo ou 'all'");
          return 1;
        }
        count = Number(countArg);
      }
      const result = await migrateDown(pool, files, count);
      console.log(
        result.rolledBack.length === 0
          ? "nenhuma migração aplicada para reverter"
          : `revertidas ${result.rolledBack.length}: ${result.rolledBack.join(", ")}`,
      );
    } else {
      const status = await migrateStatus(pool, files);
      console.log(`aplicadas (${status.applied.length}): ${status.applied.map((a) => a.name).join(", ") || "-"}`);
      console.log(`pendentes (${status.pending.length}): ${status.pending.join(", ") || "-"}`);
    }
    return 0;
  } finally {
    await pool.end();
  }
}

function isMainModule(): boolean {
  const argv1 = process.argv[1];
  if (!argv1) return false;
  try {
    let self = import.meta.url;
    let invoked = pathToFileURL(argv1).href;
    if (process.platform === "win32") {
      self = self.toLowerCase();
      invoked = invoked.toLowerCase();
    }
    return self === invoked;
  } catch {
    return false;
  }
}

if (isMainModule()) {
  runCli(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err: unknown) => {
      console.error(err instanceof Error ? err.message : String(err));
      process.exitCode = 1;
    });
}
