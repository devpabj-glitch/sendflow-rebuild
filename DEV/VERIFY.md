# Verify

## Fatia 1 (Fundação) — /api (A1, 08/11/2026) — REVERIFICADO pós-correções A3

Gates rodados dentro de `/api` DEPOIS do último diff do pacote de correções A3 (contrato §16; ambiente Node 24.21.0, offline):

- `npm run typecheck` (tsc --noEmit, strict) → **0 erros**.
- `npm test` (vitest run) → **34/34 testes passando** em 5 arquivos: health (3), auth (10), ratelimit (8), migrations (9), tenant (4). 100% offline (fastify.inject + pg-mem). Novos: 11º register por IP → 429 (relógio falso); stuffing com e-mails distintos → 429 pelo agregado por IP (env AUTH_LOGIN_IP_RATE_MAX=3); corrida 23505 no insert do controle → up segue e relata (stub) + caso degenerado 23505-sem-registro → falha alto; health com query que nunca resolve → 503 db:down pela corrida de timeout (50 ms injetado); varredura remove 200 entradas expiradas no 64º check.
- `npm run build` → dist/ + 6 arquivos .sql copiados (agora ASCII puro).
- `npm audit` → **0 vulnerabilidades** (nenhuma dependência nova adicionada).
- `npm run lint` → **não existe por decisão declarada** (contrato §11: eslint adiado para fatia futura com config compartilhada; nenhum script vazio criado).

Declaração trustProxy: Fastify 5.12 não tipa `number`; usado `(address, hop) => hop < 1` — forma tipada EXATAMENTE equivalente a `trustProxy: 1` (proxy-addr compila N para `i < N`), auditável em `app.ts`.

Mapeamento × MATRIZ-VALIDACAO (nesta fatia): AUTH-01 (E+L ok), ERR-01 (E+L ok), MIG-01 (L ok — ciclo up/status/idempotente/down/up + checksum + corrida 23505 em stub; NUNCA produção), TEN-01 (L parcial — sem endpoints com ID; HTTP cruzado completo na fatia 2), PER-01 (L parcial — pg-mem não prova reinício de processo; evidência H no deploy autorizado), REG-01 (L ok — gates após o último diff), REL-01 (P+H — colher no deploy do orquestrador: REVISION/RAILWAY_GIT_COMMIT_SHA no healthcheck).

Declarações: pg-mem 3.0.14 exige (a) `gen_random_uuid` registrada como `impure` (senão cacheia e colide PK) e (b) `.down.sql` com DROP CONSTRAINT/DROP INDEX explícitos (catálogo fantasma após DROP TABLE) — ambos comentados no código; PostgreSQL real (13+, alvo Railway) não é afetado. Suíte contra PostgreSQL verdadeiro fica para quando o orquestrador provisionar o banco (smoke pós-deploy §13.7). Comentários dos .sql em ASCII puro (cluster WIN1252 do verificador).

## Primeira rodada (pré-A3, 08/11/2026)

- `npm install` → lockfile criado (159 pacotes); `npm audit` → **0 vulnerabilidades** (produção e dev; vitest elevado a 5.1.0 para zerar alertas de tinypool/@vitest/mocker).
- `npm run typecheck` → 0 erros; `npm test` → 28/28; `npm run build` → dist/ + 6 .sql; `node dist/index.js` sem DATABASE_URL → fail-fast claro (exit 1); CLI `dist/db/migrate.js` usage/exit corretos; `migrate:status` contra host inalcançável → erro gracioso (exit 1, sem hang).

## Anteriores (front)

- Sessão CDP 9222, rotas `/whats/overview`, `/whats/accounts`, `/whats/campaigns`. Prints em `checks/live/`.
- Grupos fotografado em 1920×991 via Playwright em http://127.0.0.1:5173.
- Comparação visual lado a lado. Não houve suíte automatizada de percentual; a nota é leitura de layout, densidade, cor e componentes.
