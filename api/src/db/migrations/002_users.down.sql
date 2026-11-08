-- 002_users (rollback)
-- Os DROP INDEX sao redundantes no PostgreSQL real (o DROP TABLE ja leva os
-- indices da tabela) e limpam o catalogo do pg-mem, que deixa indices fantasmas
-- apos DROP TABLE (teste do ciclo down->up identico nos dois motores).
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_pkey;
DROP TABLE IF EXISTS users;
DROP INDEX IF EXISTS users_email_lower_unique;
DROP INDEX IF EXISTS users_org_id_idx;
