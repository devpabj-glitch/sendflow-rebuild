-- 007_projects (rollback) - D20: reversivel NO SCHEMA, NAO nos dados: qualquer
-- vinculo project->release gravado entre o up e o down NAO volta (a coluna
-- text project_id renasce VAZIA; a tabela projects some com os nomes). Dump
-- antes, sempre; correcao-para-frente preferida (Fundacao 7). Acoplamento
-- novo declarado no contrato 8: reverter o CODIGO de releases sem este down
-- quebra INSERT/PATCH (text -> coluna uuid) - reverter codigo exige reverter
-- a migracao, jamais um so lado.
-- Ordem: constraint FK e coluna uuid saem ANTES de projects (dependencia). Os
-- DROP CONSTRAINT sao redundantes no PostgreSQL real (o DROP COLUMN ja leva
-- as constraints da coluna) e limpam o catalogo do pg-mem, que deixa
-- CONSTRAINT FANTASMA apos DROP COLUMN (limite registrado no contrato 9.2;
-- nomes cobertos: releases_project_uuid_fk do pg-mem e
-- releases_project_uuid_fkey do PostgreSQL real). DROP INDEX fantasmas idem
-- (mesmo padrao do 004/005/006 down).
DROP INDEX IF EXISTS releases_project_uuid_idx;
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_project_uuid_fk;
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_project_uuid_fkey;
ALTER TABLE releases DROP COLUMN IF EXISTS project_uuid;
ALTER TABLE releases ADD COLUMN project_id text NULL;   -- formato D13 restaurado, COLUNA VAZIA (perda declarada D20)
DROP INDEX IF EXISTS projects_org_name_lower_idx;
DROP INDEX IF EXISTS projects_org_id_idx;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_pkey;
DROP TABLE IF EXISTS projects;
