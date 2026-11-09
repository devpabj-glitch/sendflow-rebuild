-- 006_groups (rollback) - dropa a tabela de grupos (D16: nenhuma outra
-- tabela referencia groups hoje - sem FKs entrantes). Os DROP INDEX sao
-- redundantes no PostgreSQL real (o DROP TABLE ja leva os indices da
-- tabela) e limpam o catalogo do pg-mem, que deixa indices fantasmas
-- apos DROP TABLE (mesmo padrao do 004/005 down). DESTRUTIVO por
-- definicao (registros e contadores somem) - dump antes, sempre.
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_pkey;
DROP TABLE IF EXISTS groups;
DROP INDEX IF EXISTS groups_org_gid_lower_idx;
DROP INDEX IF EXISTS groups_org_name_lower_idx;
DROP INDEX IF EXISTS groups_release_created_idx;
DROP INDEX IF EXISTS groups_release_id_idx;
DROP INDEX IF EXISTS groups_org_id_idx;
