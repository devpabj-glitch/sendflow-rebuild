-- 001_organizations (rollback)
-- O ALTER DROP CONSTRAINT e redundante no PostgreSQL real (o DROP TABLE ja leva
-- a constraint) e serve para limpar o catalogo do pg-mem, que deixa o
-- <tabela>_pkey fantasma apos DROP TABLE (teste do ciclo down->up).
ALTER TABLE organizations DROP CONSTRAINT IF EXISTS organizations_pkey;
DROP TABLE IF EXISTS organizations;
