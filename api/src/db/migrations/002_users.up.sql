-- 002_users - Fatia 1 (Fundacao). E-mail unico GLOBAL via indice em lower(email)
-- (equivalente pratico ao citext, portatil para pg-mem). Contrato secao 4.
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  email         text NOT NULL,
  password_hash text NOT NULL,
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));
CREATE INDEX users_org_id_idx ON users (org_id);
