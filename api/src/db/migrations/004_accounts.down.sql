-- 004_accounts (rollback)
-- Os DROP INDEX sao redundantes no PostgreSQL real (o DROP TABLE ja leva os
-- indices da tabela) e limpam o catalogo do pg-mem, que deixa indices fantasmas
-- apos DROP TABLE (teste do ciclo down->up identico nos dois motores).
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_pkey;
DROP TABLE IF EXISTS accounts;
DROP INDEX IF EXISTS accounts_org_id_idx;
DROP INDEX IF EXISTS accounts_org_name_lower_idx;
