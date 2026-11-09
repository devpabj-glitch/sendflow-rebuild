-- 005_releases (rollback) - D13: dropa a juncao primeiro (dependencia FK),
-- depois indices e tabela. Os DROP INDEX sao redundantes no PostgreSQL real
-- (o DROP TABLE ja leva os indices da tabela) e limpam o catalogo do pg-mem,
-- que deixa indices fantasmas apos DROP TABLE (mesmo padrao do 004 down).
ALTER TABLE release_accounts DROP CONSTRAINT IF EXISTS release_accounts_pkey;
DROP TABLE IF EXISTS release_accounts;
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_pkey;
DROP TABLE IF EXISTS releases;
DROP INDEX IF EXISTS releases_org_id_idx;
DROP INDEX IF EXISTS releases_org_archived_idx;
DROP INDEX IF EXISTS releases_org_name_lower_idx;
