-- 005_releases - Fatia 3 (Releases). Decisao D13 do dono (08/11/2026):
-- seguir exatamente a API original SendFlow (sendapi). Recurso = release
-- (POST/GET /api/v1/releases), NAO campaign.
-- type: enum fechado com os 3 tipos EXATOS do original - PROIBIDO inventar
-- "Aleatorio"/aleatorio ou qualquer outro. SEM unique de (org_id, lower(name))
-- (D11): homonimos permitidos. org_id ON DELETE RESTRICT: release nunca orfa.
-- project_id: text NULL SEM FK - D13 manda armazenar sem validacao; a fatia
-- PRJ adicionara validacao de existencia (pendencia registrada no contrato).
-- archived: boolean default false (D13) - SUBSTITUI o par ativa/arquivada;
-- muda so pelas acoes idempotentes POST /:id/archive e /:id/unarchive (D12).
-- release_accounts: juncao release<->conta (D13 accountIds) - semantica de
-- conjunto pela PK composta; duplicatas do array sao deduplicadas pela API.
-- Nao ha DELETE de release nesta fatia (decisao D5) nem algoritmo de
-- distribuicao (DEC-03 semantica segue aberta; CMP-03 e FALA).
CREATE TABLE releases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  name        text NOT NULL,
  type        text NOT NULL
              CHECK (type IN ('WhatsRelease','WhatsList','WhatsViralCampaign')),
  project_id  text NULL,
  archived    boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX releases_org_id_idx ON releases (org_id);
CREATE INDEX releases_org_archived_idx ON releases (org_id, archived);
-- Pre-provisionamento para busca por PREFIXO futura (nao serve ao ILIKE
-- '%t%' atual - mesma ressalva F2 2.1.5).
CREATE INDEX releases_org_name_lower_idx ON releases (org_id, lower(name));

CREATE TABLE release_accounts (
  release_id  uuid NOT NULL REFERENCES releases (id) ON DELETE CASCADE,
  account_id  uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  PRIMARY KEY (release_id, account_id)
);
