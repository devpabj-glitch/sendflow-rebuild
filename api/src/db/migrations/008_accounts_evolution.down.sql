-- 008_accounts_evolution (down) - REVERSIVEL NO SCHEMA, NAO NOS DADOS
-- (contrato 8): perde a auditoria de webhooks (tabela inteira), o status
-- real, phone/phone_jid e o vinculo conta <-> instancia (a instancia segue
-- existindo na Evolution - orfa la; exclusao de instancia e fatia futura).
-- Normaliza os status ANTES de estreitar o CHECK (D7): contas nos 5 estados
-- viram 'nao_conectada' para o CHECK antigo da 004 voltar a valer sem erro.
-- DROP CONSTRAINT do pkey ANTES do DROP TABLE (mesmo padrao 004-007): o
-- pg-mem deixa CONSTRAINT FANTASMA apos DROP TABLE e o re-up falharia com
-- "integration_events_pkey already exists" (no PostgreSQL real e no-op).
DROP INDEX IF EXISTS integration_events_org_received_idx;
ALTER TABLE integration_events DROP CONSTRAINT IF EXISTS integration_events_pkey;
DROP TABLE IF EXISTS integration_events;

UPDATE accounts SET connection_status = 'nao_conectada'
 WHERE connection_status <> 'nao_conectada';
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_connection_status_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_connection_status_check
  CHECK (connection_status IN ('nao_conectada'));

ALTER TABLE accounts DROP COLUMN IF EXISTS evolution_instance_name;
ALTER TABLE accounts DROP COLUMN IF EXISTS phone;
ALTER TABLE accounts DROP COLUMN IF EXISTS phone_jid;
