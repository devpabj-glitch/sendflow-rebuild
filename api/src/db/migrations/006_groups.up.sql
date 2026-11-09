-- 006_groups - Fatia 5 (Grupos). D15-D18 do coordenador (08/11/2026):
-- sem massa (D15); DELETE por id RATIFICADO (D16) - massa sempre fora;
-- export CSV adiado (D17); recurso plano /api/v1/groups (D18).
-- AMARRA DEC-06 legado (docs/continuidade/fontes/backend-infra/
-- DECISAO-DEC06-GRUPO-CHEIO.md): cheio = manual OU teto calculado - cada
-- sinal basta (OR sem precedencia). NAO ha coluna cheio: derivado na leitura
-- (cheio_manual OR (limit_pessoas IS NOT NULL AND participants >=
-- limit_pessoas)) - sem estado duplicado, sem janela de inconsistencia.
-- NAO ha coluna seq: ordinal por release derivado na leitura (created_at,
-- id) - sem renumeracao em cascata; delete (D16) decai ordinais posteriores.
-- PM regra 7 (L110): clique <> entrada <> participante - clicks e
-- participants sao contadores SEPARADOS, nascem 0 e NENHUM endpoint desta
-- fatia os escreve (mutadores sao FLX/VGC futuros). Cliques nunca ocupam
-- vaga: o teto compara participants (VGC-05 + CRG-06).
-- release_id NOT NULL (ENT-04): pertence exclusivo a uma campanha; org_id
-- denormalizado para escopo tenant sem join; coerencia groups.org_id =
-- releases.org_id imposta pela API (padrao D13 accountIds), nao por trigger.
-- ON DELETE RESTRICT em org_id e release_id: sem delete silencioso em
-- cascata - decisao explicita quando release-delete existir (D5 vigora).
-- SEM unique de name (D11) nem de gid (D11 estendida - unicidade de GID
-- nao demonstrada; amarra real IMP-03 e do modulo IMP futuro).
-- "groups" e keyword NAO-reservada no PostgreSQL real (utilizavel sem
-- aspas); verificado tambem no parser do pg-mem (risco secao 9.1 do contrato).
CREATE TABLE groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  release_id    uuid NOT NULL REFERENCES releases (id) ON DELETE RESTRICT,
  name          text NOT NULL,                       -- trim aplicado pela API antes de gravar
  gid           text NULL,                           -- identificador do grupo no WhatsApp (GID); opcional
  clicks        integer NOT NULL DEFAULT 0,          -- PM regra 7: clique <> entrada <> participante
  participants  integer NOT NULL DEFAULT 0,          -- teto calculado compara este campo (DEC-06 legado + VGC-05)
  limit_pessoas integer NULL,                        -- limite de pessoas (CRG-06); NULL = sem teto calculado
  cheio_manual  boolean NOT NULL DEFAULT false,      -- sinal manual da DEC-06; muda SO pelas acoes mark-full/mark-not-full
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT groups_clicks_nonneg CHECK (clicks >= 0),
  CONSTRAINT groups_participants_nonneg CHECK (participants >= 0),
  CONSTRAINT groups_limit_positive CHECK (limit_pessoas IS NULL OR limit_pessoas >= 1)
);
CREATE INDEX groups_org_id_idx ON groups (org_id);
CREATE INDEX groups_release_id_idx ON groups (release_id);
CREATE INDEX groups_release_created_idx ON groups (release_id, created_at, id);   -- seq derivada (ordem de criacao)
CREATE INDEX groups_org_name_lower_idx ON groups (org_id, lower(name));           -- pre-provisionamento busca (idem F2 2.1.5)
CREATE INDEX groups_org_gid_lower_idx ON groups (org_id, lower(gid));             -- busca por GID (GroupSearch)
