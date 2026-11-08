-- 003_sessions (rollback)
-- Os DROP INDEX sao redundantes no PostgreSQL real (o DROP TABLE ja leva os
-- indices da tabela) e limpam o catalogo do pg-mem, que deixa indices fantasmas
-- apos DROP TABLE (teste do ciclo down->up identico nos dois motores).
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_pkey;
DROP TABLE IF EXISTS sessions;
DROP INDEX IF EXISTS sessions_token_hash_unique;
DROP INDEX IF EXISTS sessions_user_id_idx;
DROP INDEX IF EXISTS sessions_expires_at_idx;
