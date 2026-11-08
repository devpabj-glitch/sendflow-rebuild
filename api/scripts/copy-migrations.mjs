// Copia os arquivos .sql de migrações para dist/db/migrations.
// O tsc não copia recursos; sem isso, `node dist/index.js` e `node dist/db/migrate.js`
// não encontrariam os .sql (a migração automática no boot depende deles).
import { cpSync, mkdirSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const src = path.join(root, "src", "db", "migrations");
const dest = path.join(root, "dist", "db", "migrations");

mkdirSync(dest, { recursive: true });
const files = readdirSync(src).filter((f) => f.endsWith(".sql"));
for (const file of files) {
  cpSync(path.join(src, file), path.join(dest, file));
}
console.log(`migrações copiadas para dist/db/migrations (${files.length} arquivos .sql)`);
