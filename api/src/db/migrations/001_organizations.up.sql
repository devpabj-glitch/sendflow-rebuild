-- 001_organizations - Fatia 1 (Fundacao). Contrato: docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md secao 4
-- (comentarios em ASCII puro - o verificador de deploy le o cluster em WIN1252)
CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
