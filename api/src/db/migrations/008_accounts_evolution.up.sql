-- 008_accounts_evolution - Fatia 7 (Contas QR). Vinculo account <-> instancia
-- Evolution API 2.3.7, estado real de conexao e auditoria de webhooks.
-- DROP dual-name: o PostgreSQL real nomeia o CHECK inline da 004 como
-- accounts_connection_status_check (nome default); o pg-mem (testes) chama-o
-- accounts_constraint_1 (verificado em probe offline 12/11 - ver 2.1.1 do
-- contrato). O nome que nao existe e no-op por IF EXISTS. Sem o drop efetivo,
-- o CHECK estreito da 004 recusaria os novos valores de imediato (falha alta).
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_connection_status_check;
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_constraint_1;
ALTER TABLE accounts ADD CONSTRAINT accounts_connection_status_check
  CHECK (connection_status IN ('nao_conectada','aguardando_qr','conectada','desconectada','banida'));

-- D2: nome deterministico 'g-' + 8 primeiros hex do uuid da conta; gravado
-- apenas no primeiro connect (criacao real da instancia). UNIQUE global: o
-- namespace de instancias da Evolution e global e o prefixo de 32 bits NAO
-- garante unicidade por si - a UNIQUE protege (colisao 23505 -> a API devolve
-- 409 EVOLUTION_INSTANCE_TAKEN no envelope padrao, nunca 500). Multiplos
-- NULLs sao validos (contas nunca conectadas).
ALTER TABLE accounts ADD COLUMN evolution_instance_name text NULL UNIQUE;
ALTER TABLE accounts ADD COLUMN phone text NULL;
ALTER TABLE accounts ADD COLUMN phone_jid text NULL;

-- D7: auditoria de TODOS os webhooks recebidos (inclusive instancia
-- desconhecida: org_id/account_id NULL). payload jsonb SEM o campo apikey e
-- COM qrcode.base64 anulada (redacao obrigatoria pela funcao unica do
-- adaptador - ver contrato 5.3/0.1.8; a Evolution inclui a apikey global no
-- corpo de todo webhook). Sem retencao/TTL nesta fatia (pendencia do
-- contrato 10).
CREATE TABLE integration_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  account_id  uuid NULL REFERENCES accounts (id) ON DELETE RESTRICT,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX integration_events_org_received_idx ON integration_events (org_id, received_at);
