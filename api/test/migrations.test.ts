// Migrações (contrato §7 / MIG-01): MESMO runner e MESMOS arquivos de produção,
// em instância pg-mem descartável por caso. Nunca produção.
// Ciclo: up → status → up idempotente → down 1 → down all → up de novo → checksum.
// Correção pós-auditoria A3: corrida de migração (23505 no insert do controle)
// tratada como "outra instância aplicou" — up segue e relata status.
import { describe, expect, it } from "vitest";
import {
  loadMigrationFiles,
  migrateDown,
  migrateStatus,
  migrateUp,
  type MigrationFile,
} from "../src/db/migrate.js";
import type { DbPool } from "../src/lib/db.js";
import { createMemoryDb, toDbPool } from "./helpers.js";

function freshPool() {
  return toDbPool(createMemoryDb());
}

/**
 * Executor-stub que simula corrida REAL de migração: o INSERT de controle da
 * 001_organizations falha com 23505 PORQUE "outra instância" acabou de aplicar
 * (o registro entra no estado aplicado no mesmo instante) — o runner deve
 * reler o status, confirmar e SEGUIR com as demais.
 */
function racingPool(): DbPool {
  const applied = new Map<string, string>();
  let controlTable = false;
  const query = async (text: string, values?: unknown[]) => {
    const sql = text.trim();
    if (sql.includes("information_schema.tables")) {
      return { rows: controlTable ? [{}] : [] };
    }
    if (sql.startsWith("CREATE TABLE IF NOT EXISTS migrations")) {
      controlTable = true;
      return { rows: [] };
    }
    if (sql.startsWith("SELECT name, checksum FROM migrations")) {
      return { rows: [...applied.entries()].map(([name, checksum]) => ({ name, checksum })) };
    }
    if (sql.startsWith("SELECT name, applied_at FROM migrations")) {
      return { rows: [...applied.keys()].map((name) => ({ name, applied_at: new Date() })) };
    }
    if (sql.startsWith("INSERT INTO migrations")) {
      const name = String(values?.[0]);
      const checksum = String(values?.[1]);
      if (name === "001_organizations" && !applied.has(name)) {
        // A outra instância venceu a corrida: registra (commit dela) e a NOSSA
        // insert colide na UNIQUE(name) — erro PostgreSQL 23505.
        applied.set(name, checksum);
        const err = new Error(
          'duplicate key value violates unique constraint "migrations_name_key"',
        ) as Error & { code: string };
        err.code = "23505";
        throw err;
      }
      applied.set(name, checksum);
      return { rows: [] };
    }
    return { rows: [] }; // BEGIN/COMMIT/ROLLBACK/DDL
  };
  return {
    query,
    connect: async () => ({ query, release: () => undefined }),
    end: async () => undefined,
  };
}

describe("runner de migrações (up/down/status)", () => {
  it("up aplica as 7 migrações na ordem; status lista 7 aplicadas e 0 pendentes", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    expect(files.map((f) => f.name)).toEqual([
      "001_organizations",
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
      "007_projects",
    ]);

    const up = await migrateUp(pool, files);
    expect(up.applied).toEqual([
      "001_organizations",
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
      "007_projects",
    ]);

    const status = await migrateStatus(pool, files);
    expect(status.applied).toHaveLength(7);
    expect(status.pending).toEqual([]);
    await pool.end();
  });

  it("up em dia é no-op idempotente (0 aplicadas, 7 já registradas)", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const again = await migrateUp(pool, files);
    expect(again.applied).toEqual([]);
    expect(again.alreadyApplied).toBe(7);

    const status = await migrateStatus(pool, files);
    expect(status.pending).toEqual([]);
    await pool.end();
  });

  it("down 1 reverte a mais recente (007_projects); status mostra 6 aplicadas; T9: project_id volta como text NULL e VAZIA", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const down = await migrateDown(pool, files, 1);
    expect(down.rolledBack).toEqual(["007_projects"]);

    const status = await migrateStatus(pool, files);
    expect(status.applied.map((a) => a.name)).toEqual([
      "001_organizations",
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
    ]);
    // Down reversível no schema (Fatia 6 T9): projects ausente, demais intactas.
    await expect(pool.query("SELECT count(*) FROM projects")).rejects.toThrow();
    const releases = await pool.query("SELECT count(*)::int AS n FROM releases");
    expect(releases.rows[0]).toMatchObject({ n: 0 });

    // T9 (contrato PRJ §6): releases.project_id volta a existir como text
    // NULL E VAZIA (perda declarada D20 — coluna recriada sem valores).
    const col = await pool.query(
      `SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'releases' AND column_name = 'project_id'`,
    );
    expect(col.rows).toHaveLength(1);
    expect(String(col.rows[0].data_type)).toBe("text");

    // Conferência positiva: INSERT de release com valor text no estado down
    // é ACEITO (a coluna text voltou)...
    const org = await pool.query("INSERT INTO organizations (name) VALUES ('down-007') RETURNING id");
    const orgId = String(org.rows[0].id);
    const relDown = await pool.query(
      "INSERT INTO releases (org_id, name, type, project_id) VALUES ($1, 'r-down', 'WhatsRelease', 'proj-text-ok') RETURNING project_id",
      [orgId],
    );
    expect(String(relDown.rows[0].project_id)).toBe("proj-text-ok");

    // ...e após o RE-UP o valor text é RECUSADO (coluna text saiu de novo).
    const reUp = await migrateUp(pool, files);
    expect(reUp.applied).toEqual(["007_projects"]);
    const colUuid = await pool.query(
      `SELECT data_type FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'releases' AND column_name = 'project_uuid'`,
    );
    expect(String(colUuid.rows[0].data_type)).toBe("uuid");
    await expect(
      pool.query(
        "INSERT INTO releases (org_id, name, type, project_id) VALUES ($1, 'r-down-2', 'WhatsList', 'x')",
        [orgId],
      ),
    ).rejects.toThrow();

    // Demais 6 intactas: groups segue consultável.
    const groups = await pool.query("SELECT count(*)::int AS n FROM groups");
    expect(groups.rows[0]).toMatchObject({ n: 0 });
    await pool.end();
  });

  it("down all reverte tudo na ordem inversa (7 → 0); up de novo aplica 7", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const downAll = await migrateDown(pool, files, Number.POSITIVE_INFINITY);
    expect(downAll.rolledBack).toEqual([
      "007_projects",
      "006_groups",
      "005_releases",
      "004_accounts",
      "003_sessions",
      "002_users",
      "001_organizations",
    ]);

    const status = await migrateStatus(pool, files);
    expect(status.applied).toEqual([]);

    // Re-aplicação: DDL re-entrante após rollback total.
    const up = await migrateUp(pool, files);
    expect(up.applied).toHaveLength(7);
    await pool.end();
  });

  it("checksum de migração JÁ APLICADA editada → falha alta nomeando o arquivo (up e status)", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    // Simula edição pós-aplicação: mesmo name, conteúdo (checksum) divergente.
    const tampered: MigrationFile[] = files.map((f) =>
      f.name === "002_users" ? { ...f, checksum: "deadbeef".repeat(8) } : f,
    );

    await expect(migrateUp(pool, tampered)).rejects.toThrow(/002_users.*checksum divergente/s);
    await expect(migrateStatus(pool, tampered)).rejects.toThrow(/002_users.*checksum divergente/s);
    await pool.end();
  });

  it("migração aplicada que sumiu dos arquivos → falha alta (estado do banco ≠ código)", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);
    const missing = files.filter((f) => f.name !== "003_sessions");
    await expect(migrateStatus(pool, missing)).rejects.toThrow(/003_sessions/);
    await pool.end();
  });

  it("DDL de fato aplicado: INSERT usa default gen_random_uuid após up; falha após down all (contagens)", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const inserted = await pool.query(
      "INSERT INTO organizations (name) VALUES ('contagem') RETURNING id",
    );
    expect(String((inserted.rows[0] as { id: unknown }).id)).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    await migrateDown(pool, files, Number.POSITIVE_INFINITY);
    await expect(pool.query("SELECT count(*) FROM organizations")).rejects.toThrow();
    await pool.end();
  });

  it("corrida concorrente (A3): 23505 no insert do controle → up SEGUE, relata corrida e status final correto", async () => {
    const pool = racingPool();
    const files = loadMigrationFiles();

    // Não lança: a 001 é tratada como "outra instância aplicou"; 002..007 aplicam.
    const up = await migrateUp(pool, files);
    expect(up.raced).toEqual(["001_organizations"]);
    expect(up.applied).toEqual([
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
      "007_projects",
    ]);
    expect(up.alreadyApplied).toBe(0); // estado lido ANTES da corrida: nada aplicado

    // Relato de status pós-corrida: as 7 registradas, 0 pendentes.
    const status = await migrateStatus(pool, files);
    expect(status.applied.map((a) => a.name)).toEqual([
      "001_organizations",
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
      "007_projects",
    ]);
    expect(status.pending).toEqual([]);
    await pool.end();
  });

  it("23505 SEM registro aplicado pela outra instância → ainda falha alto (estado inconsistente)", async () => {
    // Stub degenerado: o insert do controle colide (23505) mas o registro NÃO
    // aparece no re-read — o runner não pode presumir sucesso silencioso.
    const files = loadMigrationFiles();
    let controlTable = false;
    const query = async (text: string, values?: unknown[]) => {
      const sql = text.trim();
      if (sql.includes("information_schema.tables")) return { rows: controlTable ? [{}] : [] };
      if (sql.startsWith("CREATE TABLE IF NOT EXISTS migrations")) {
        controlTable = true;
        return { rows: [] };
      }
      if (sql.startsWith("SELECT name, checksum FROM migrations")) return { rows: [] }; // SEMPRE vazio
      if (sql.startsWith("INSERT INTO migrations")) {
        void values;
        const err = new Error(
          'duplicate key value violates unique constraint "migrations_name_key"',
        ) as Error & { code: string };
        err.code = "23505";
        throw err;
      }
      return { rows: [] };
    };
    const pool: DbPool = {
      query,
      connect: async () => ({ query, release: () => undefined }),
      end: async () => undefined,
    };

    await expect(migrateUp(pool, files)).rejects.toThrow(/unicidade inesperada.*001_organizations/s);
    await pool.end();
  });
});
