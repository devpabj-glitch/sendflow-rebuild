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
  it("up aplica as 8 migrações na ordem; status lista 8 aplicadas e 0 pendentes", async () => {
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
      "008_accounts_evolution",
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
      "008_accounts_evolution",
    ]);

    const status = await migrateStatus(pool, files);
    expect(status.applied).toHaveLength(8);
    expect(status.pending).toEqual([]);
    await pool.end();
  });

  it("up em dia é no-op idempotente (0 aplicadas, 8 já registradas)", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const again = await migrateUp(pool, files);
    expect(again.applied).toEqual([]);
    expect(again.alreadyApplied).toBe(8);

    const status = await migrateStatus(pool, files);
    expect(status.pending).toEqual([]);
    await pool.end();
  });

  it("T11 (F7): down 1 reverte SÓ a 008 — colunas/tabela somem, status normaliza p/ nao_conectada, CHECK estreito volta, re-up OK com múltiplos NULLs e UNIQUE enforced", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    // Fixture: 1 org; contas nos 5 estados do CHECK largo (F7-D3/D7), 2 com
    // instance NULL (nunca conectadas) e 1 com instance real; 1 evento auditado.
    const org = await pool.query("INSERT INTO organizations (name) VALUES ('t11') RETURNING id");
    const orgId = String(org.rows[0].id);
    const statuses = ["nao_conectada", "aguardando_qr", "conectada", "desconectada", "banida"];
    let firstAccountId = "";
    for (const status of statuses) {
      const acc = await pool.query(
        "INSERT INTO accounts (org_id, name, connection_status) VALUES ($1, $2, $3) RETURNING id",
        [orgId, `acc-${status}`, status],
      );
      if (firstAccountId === "") firstAccountId = String(acc.rows[0].id);
    }
    await pool.query("UPDATE accounts SET evolution_instance_name = 'g-t11' WHERE id = $1", [
      firstAccountId,
    ]);
    await pool.query(
      "INSERT INTO integration_events (org_id, account_id, event_type, payload) VALUES ($1, $2, 'CONNECTION_UPDATE', $3)",
      [orgId, firstAccountId, { event: "CONNECTION_UPDATE", state: "open" }],
    );

    // DOWN 1: reverte apenas a 008.
    const down = await migrateDown(pool, files, 1);
    expect(down.rolledBack).toEqual(["008_accounts_evolution"]);
    const status1 = await migrateStatus(pool, files);
    expect(status1.applied).toHaveLength(7);

    // Tabela de auditoria e colunas novas sumiram.
    await expect(pool.query("SELECT count(*) FROM integration_events")).rejects.toThrow();
    for (const column of ["evolution_instance_name", "phone", "phone_jid"]) {
      const col = await pool.query(
        `SELECT data_type FROM information_schema.columns
          WHERE table_schema = current_schema() AND table_name = 'accounts' AND column_name = '${column}'`,
      );
      expect(col.rows, column).toHaveLength(0);
    }

    // Normalização ANTES do CHECK estreito: os 5 estados viraram nao_conectada.
    const afterDown = await pool.query(
      "SELECT connection_status, count(*)::int AS n FROM accounts GROUP BY connection_status",
    );
    expect(afterDown.rows).toEqual([{ connection_status: "nao_conectada", n: 5 }]);

    // CHECK estreito da 004 volta a valer (dual-name drop devolveu o estado).
    await expect(
      pool.query("UPDATE accounts SET connection_status = 'conectada' WHERE id = $1", [
        firstAccountId,
      ]),
    ).rejects.toThrow();

    // RE-UP da 008: os 5 valores voltam a ser aceitos; múltiplos NULLs OK
    // (contas nunca conectadas); UNIQUE de evolution_instance_name enforced.
    const reUp = await migrateUp(pool, files);
    expect(reUp.applied).toEqual(["008_accounts_evolution"]);
    for (const status of statuses) {
      await pool.query("UPDATE accounts SET connection_status = $1 WHERE id = $2", [
        status,
        firstAccountId,
      ]);
    }
    await expect(
      pool.query("UPDATE accounts SET connection_status = 'estado-inválido' WHERE id = $1", [
        firstAccountId,
      ]),
    ).rejects.toThrow();
    await pool.query(
      "INSERT INTO accounts (org_id, name) VALUES ($1, 'null-1'), ($1, 'null-2')",
      [orgId],
    ); // 2+ contas com instance NULL: PostgreSQL aceita múltiplos NULL
    await pool.query("UPDATE accounts SET evolution_instance_name = 'g-t11-b' WHERE name = 'null-1'");
    await expect(
      pool.query("UPDATE accounts SET evolution_instance_name = 'g-t11-b' WHERE name = 'null-2'"),
    ).rejects.toThrow(/unique|duplicat/i);
    await pool.end();
  });

  it("down 2 reverte 008+007; T9 (PRJ): project_id volta text NULL e VAZIA; re-up aplica as 2", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const down = await migrateDown(pool, files, 2);
    expect(down.rolledBack).toEqual(["008_accounts_evolution", "007_projects"]);

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
    expect(reUp.applied).toEqual(["007_projects", "008_accounts_evolution"]);
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

    // Demais intactas: groups segue consultável.
    const groups = await pool.query("SELECT count(*)::int AS n FROM groups");
    expect(groups.rows[0]).toMatchObject({ n: 0 });
    await pool.end();
  });

  it("down all reverte tudo na ordem inversa (8 → 0); up de novo aplica 8", async () => {
    const pool = freshPool();
    const files = loadMigrationFiles();
    await migrateUp(pool, files);

    const downAll = await migrateDown(pool, files, Number.POSITIVE_INFINITY);
    expect(downAll.rolledBack).toEqual([
      "008_accounts_evolution",
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
    expect(up.applied).toHaveLength(8);
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

    // Não lança: a 001 é tratada como "outra instância aplicou"; 002..008 aplicam.
    const up = await migrateUp(pool, files);
    expect(up.raced).toEqual(["001_organizations"]);
    expect(up.applied).toEqual([
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
      "007_projects",
      "008_accounts_evolution",
    ]);
    expect(up.alreadyApplied).toBe(0); // estado lido ANTES da corrida: nada aplicado

    // Relato de status pós-corrida: as 8 registradas, 0 pendentes.
    const status = await migrateStatus(pool, files);
    expect(status.applied.map((a) => a.name)).toEqual([
      "001_organizations",
      "002_users",
      "003_sessions",
      "004_accounts",
      "005_releases",
      "006_groups",
      "007_projects",
      "008_accounts_evolution",
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
