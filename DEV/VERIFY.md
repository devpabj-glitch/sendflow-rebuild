# Verify

## Fatia 2 (Contas) — PACOTE PÓS-AUDITORIA #1/#2/#3/#6 — /api (A1, 08/11/2026, branch a1/contas)

Gates RE-RODADOS dentro de `/api` APÓS o último diff do pacote de correções do code-review (achados #1, #2, #3, #6 — nada além):

- `npm run typecheck` → **0 erros**.
- `npm test` → **50/50** em 6 arquivos: accounts (**16** — eram 14; +2 casos novos: urlencoded→400 e lista vazia), auth (10), health (3), migrations (9), ratelimit (8), tenant (4).
- `npm run build` → dist/ + **8 arquivos .sql**.
- `npm audit --omit=dev` → **0 vulnerabilidades**.

O que o pacote mudou (e como foi verificado):

- **#1 corrida COUNT×SELECT (lista):** transação de leitura única — `ctx.db.connect()` (cliente dedicado) + `BEGIN ISOLATION LEVEL REPEATABLE READ` + COUNT + SELECT + `COMMIT` (`ROLLBACK` sem mascarar erro original). **Decisão declarada com probe:** pg-mem 3.0.x NÃO parseia `count(*) OVER()` ("cláusula OVER não implementada") nem `SET TRANSACTION` separado; `BEGIN ISOLATION LEVEL ...` em sentença única parseia no pg-mem E é SQL padrão do PostgreSQL real → caminho válido nos DOIS motores (window function permanece opção futura contra PG real). Em pool real, BEGIN/COMMIT exigem cliente fixo — queries soltas no pool podem trocar de conexão (mesmo padrão já usado no register). Borda 0 itens coberta por caso dedicado (total 0, items []) + defensiva `?? 0`.
- **#2 guard de content-type em `preParsing`:** verificado no fonte do Fastify 5 (lib/route.js: runPreParsing roda ANTES de handle-request/contentTypeParser) — agora QUALQUER media type não-json (inclusive urlencoded/multipart, sem parser registrado) → **400 VALIDATION_ERROR fields ["content-type"]**, nunca 415 do parser. Caso novo: POST `application/x-www-form-urlencoded` → 400 com fields `["content-type"]` + oráculo (nada criado). Ordem declarada: requireAuth segue em preValidation; para não-json o 400 precede o 401 (precedência que o 415 do parser já tinha de fato); json válido → 401 primeiro (T7 re-passado). Comentário impreciso corrigido ("antes de qualquer leitura do corpo" → fase correta: antes do parser de content-type do Fastify). Contrato §3.5 atualizado na mesma linha.
- **#3 contrato §2.1.5:** justificativa do índice `(org_id, lower(name))` corrigida — NÃO serve à busca contains atual (`ILIKE '%t%'`, curinga à esquerda); é pré-provisionamento para busca por prefixo futura; custo de escrita declarado. Comentário inline do SQL em §2 idem. O .sql da migração 004 NÃO foi tocado (checksum preservado; lá não havia a alegação incorreta).
- **#6 rótulos dos testes:** renumerados para a numeração T1–T10 do contrato §6 (CTA-03 T3→T5; cruzado T4→T6; persistência T5→T4; content-type T6→T10; 401=T7 explícito; lista/busca T1/T3) + mapa no cabeçalho do arquivo (T8 vive em migrations.test.ts; T9 = gates).

Ressalva do pacote: `SET TRANSACTION ISOLATION LEVEL` como sentença separada não é utilizável (pg-mem não parseia) — o nível de isolamento entra pelo `BEGIN ISOLATION LEVEL REPEATABLE READ` (sentença única). Snapshots REPEATABLE READ no pg-mem são best-effort do adapter single-session; a garantia forte (mesmo snapshot nas 2 queries) é a do PostgreSQL real — mesmo padrão de ressalva pg-mem≠PG da §9.1.

## Fatia 2 (Contas) — /api (A1, 08/11/2026, branch a1/contas)

Gates rodados dentro de `/api` APÓS o último diff (contrato FATIA-02-CONTAS §0.1: D5 sem DELETE, D6 guard de Content-Type, D7 editoriais):

- `npm run typecheck` → **0 erros**.
- `npm test` → **48/48** em 6 arquivos: accounts (14 — T1 CRUD/busca/paginação, T2 validações, T3 CTA-03, T4 cruzado byte a byte, T5 persistência app#1→app#2 + oráculo SQL, T6 content-type + preflight, 401 sem sessão), auth (10), health (3), migrations (9 — ciclo 4 migrações), ratelimit (8), tenant (4). Os 34 testes da Fundação passam com os 2 ajustes aditivos declarados no contrato §6 T9 (header Content-Type nos 2 logouts do auth.test; lista 3→4 no migrations.test).
- `npm run build` → dist/ + **8 arquivos .sql** (004_accounts incluída).
- `npm audit --omit=dev` → **0 vulnerabilidades** (nenhuma dependência nova).
- `npm run lint` → não existe por decisão declarada (herdado da Fatia 1 §11).

Cobertura × contrato: TEN-01 ENCERRADA (T4: GET/PATCH cruzado 2 orgs com corpo 404 idêntico byte a byte ao de UUID inexistente; `:id` malformado → 400); CTA-03 com teste dirigido (contagem de `sessions` inalterada por POST/PATCH, conjunto de tabelas exato {organizations, users, sessions, migrations, accounts}, leitura direta `connection_status='nao_conectada'`, `connectionStatus` em entrada → 400); D6 (POST `text/plain`/sem header → 400 fields `content-type`; `charset=utf-8` aceito; login uniforme; preflight OPTIONS de origem autorizada → 204 + ACAO exato, origem desconhecida sem ACAO).

Ressalvas declaradas (contrato §9.1): pg-mem não parseia `ESCAPE` e trata `\` como literal no LIKE — o código escapa `\%`/`\_`/`\\` com o escape default do ILIKE do PostgreSQL real; literalidade de curingas no TERMO é evidência H no banco real do deploy. PER-01 em pg-mem = app re-instanciado sobre o mesmo banco (T5); reinício de processo real fica para o orquestrador. Sem DELETE de conta (D5).

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
