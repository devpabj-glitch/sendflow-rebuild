-- 007_projects - Fatia 6 (Projetos, PRJ). D19/D20/D21 do coordenador
-- (09/11/2026, parecer A4 ADERENTE): DELETE so do vazio (D19); a coluna
-- text project_id da D13 sai e a coluna uuid nova nasce NULL com FK real
-- (D20, backfill NULL); 409 PROJECT_NOT_EMPTY entra no vocabulario de erro
-- (D21). Nenhum valor text e convertido: os unicos valores vigentes sao
-- strings sinteticas de teste (nenhum deploy de producao ocorreu - perda
-- declarada: zero dado real; o down recria a coluna text VAZIA).
-- projects: tabela MINIMA - so name + auditoria (DEC-01/DEC-12 abertas; sem
-- cor/icone/ordem/descricao - nada disso tem amarra observada alem do nome).
-- org_id NOT NULL como toda tabela first-class, ON DELETE RESTRICT.
-- SEM unique de (org_id, name) nem de (org_id, lower(name)) (D11 estendida).
-- releases.project_uuid uuid NULL com FK ON DELETE RESTRICT: integridade que
-- a D13 deixou aberta; RESTRICT e defesa-de-profundidade do DELETE vazio-only
-- (corrida: 23503 no banco real, mensagem FK no pg-mem -> 409). A FK NAO
-- garante mesma-org: a coerencia releases.org_id = projects.org_id e imposta
-- pela validacao da API (padrao D13 accountIds), nao por trigger (pg-mem).
-- Ordem ADD->DROP na MESMA transacao (nota de ativacao do contrato): a coluna
-- uuid nasce como project_uuid, sem reuso do nome text na mesma migracao;
-- backfill NULL (nenhum dado atravessa), sem janela de leitura.
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  name        text NOT NULL,                       -- trim aplicado pela API antes de gravar; SEM unique (D11)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_org_id_idx ON projects (org_id);
CREATE INDEX projects_org_name_lower_idx ON projects (org_id, lower(name));  -- busca CI (idem F2/F5)

ALTER TABLE releases ADD COLUMN project_uuid uuid NULL REFERENCES projects (id) ON DELETE RESTRICT;
ALTER TABLE releases DROP COLUMN project_id;   -- coluna text da D13 sai (D20; valores sinteticos, nenhum dado real)
CREATE INDEX releases_project_uuid_idx ON releases (project_uuid);
