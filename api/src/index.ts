// Bootstrap (contrato §13.2/D4): config fail-fast → pool → migrate:up automático
// (idempotente, transacional) → listen 0.0.0.0:PORT → shutdown gracioso.
// Provisionamento/deploy são do orquestrador (D4) — este arquivo só sobe o servidor.
import { loadConfig } from "./config.js";
import { createPool } from "./db/pool.js";
import { loadMigrationFiles, migrateUp } from "./db/migrate.js";
import { buildApp } from "./app.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env, { requireDatabaseUrl: true });
  const pool = createPool(config.databaseUrl!);

  // Migração automática no boot (§7/§13.2): idempotente; em dia = no-op.
  const files = loadMigrationFiles();
  const migrationResult = await migrateUp(pool, files);

  const app = await buildApp({ db: pool, config });
  await app.listen({ port: config.port, host: "0.0.0.0" });

  app.log.info(
    {
      port: config.port,
      migrationsApplied: migrationResult.applied.length,
      migrationsAlready: migrationResult.alreadyApplied,
      migrationsRaced: migrationResult.raced.length, // corrida com outra instância: seguiu (correção pós-auditoria A3)
      revision: config.revision,
    },
    "grupos-api iniciada",
  );

  let shuttingDown = false;
  const shutdown = (signal: string): void => {
    if (shuttingDown) return;
    shuttingDown = true;
    app.log.info({ signal }, "desligando");
    void (async () => {
      try {
        await app.close();
        await pool.end();
      } finally {
        process.exit(0);
      }
    })();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

main().catch((err: unknown) => {
  console.error("falha ao iniciar grupos-api:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
