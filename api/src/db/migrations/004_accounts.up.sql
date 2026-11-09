-- 004_accounts - Fatia 2 (Contas). Conta da organizacao (modulo CTA do PM).
-- SEM unique de (org_id, lower(name)): decisao 2.1.1 do contrato (homonimos
-- permitidos; unicidade nao demonstrada no PM - seria politica inventada).
-- org_id ON DELETE RESTRICT: conta nunca orfa (nao ha endpoint de exclusao
-- de org). is_spy: flag SEM interpretacao (DEC-02 aberta) - so armazenada.
-- connection_status: CHECK de valor unico - estado honesto enquanto nao ha
-- integracao de provedor (CTA-03 / BLOQ-EXT / DIR-04); novos valores so por
-- migracao futura. Nao ha DELETE de conta nesta fatia (decisao D5).
CREATE TABLE accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  name              text NOT NULL,
  type              text NOT NULL DEFAULT 'WhatsApp',
  is_spy            boolean NOT NULL DEFAULT false,
  connection_status text NOT NULL DEFAULT 'nao_conectada'
                    CHECK (connection_status IN ('nao_conectada')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX accounts_org_id_idx ON accounts (org_id);
CREATE INDEX accounts_org_name_lower_idx ON accounts (org_id, lower(name));
