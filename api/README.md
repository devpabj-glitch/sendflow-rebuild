# grupos-api — Fatia 1 (Fundação) + Fatia 2 (Contas) + Fatia 3 (Releases) + Fatia 5 (Grupos) + Fatia 6 (Projetos)

API de autenticação de servidor, organização/tenant, PostgreSQL com migrações versionadas, API base, CRUD de contas, CRUD de releases, CRUD de grupos e CRUD de projetos do produto **Grupos**.

**Contratos técnicos:** `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` (decisões na §0) · `docs/contracts/FATIA-02-CONTAS-CONTRATO.md` (decisões D5/D6/D7 na §0.1) · `docs/contracts/FATIA-03-CAMPANHAS-CONTRATO.md` (**emendado pela Decisão D13 do dono na §0.2** — releases, tipos oficiais sendapi, `archived`, `accountIds`, `projectId`) · `docs/contracts/FATIA-05-GRUPOS-CONTRATO.md` (grupos; **D15–D18 aplicadas na §0.1**; amarra DEC-06 legado: cheio = manual OU teto) · `docs/contracts/FATIA-06-PROJETOS-CONTRATO.md` (projetos; **D19/D20/D21 RATIFICADAS na §0.1**; `projectId` de releases agora uuid validado mesma-org) · **Pareceres A4:** `docs/contracts/FATIA-0{1,2,3,5,6}-*-PARECER.md`.

## Pré-requisitos

- **Node.js 22+** (testado em Node 24) e **npm**.
- Nada mais para testar: a suíte roda **100% offline** (pg-mem + `fastify.inject()`; sem Docker, sem Postgres, sem rede).
- Para `npm run dev` contra banco real: um PostgreSQL acessível (local ou outro).

## Instalação

```bash
cd api
npm install          # cria package-lock.json
```

## Testes (offline — sem DATABASE_URL, sem Docker)

```bash
npm test             # vitest run — health, auth, ratelimit, migrations, tenant, accounts, releases, groups, projects
npm run typecheck    # tsc --noEmit
npm run build        # tsc + cópia dos .sql para dist/
```

## Migrações (up / down / status)

Requerem `DATABASE_URL` apontando para um PostgreSQL **real**. Em dev sem banco local, use `npm test` (pg-mem roda os mesmos arquivos):

```bash
DATABASE_URL=postgres://... npm run migrate:up      # aplica pendentes (idempotente; em dia = no-op)
DATABASE_URL=postgres://... npm run migrate:status  # lista aplicadas/pendentes; falha alto em checksum divergente
DATABASE_URL=postgres://... npm run migrate:down    # reverte a última (passe "all" para tudo — DESTRUTIVO)
```

- Runner transacional com insert-first na tabela `migrations` (exclusão mútua entre instâncias).
- **Nunca edite migração já aplicada** — o checksum (sha256, LF-normalizado) diverge e o runner **falha alto** nomeando o arquivo. Correção = nova migração `NNN_nome.{up,down}.sql`.
- `down` da 001–007 dropa as tabelas (fundação + contas + releases/junção + grupos + projetos; o down da 007 **recria `releases.project_id text NULL` VAZIA** — perda declarada D20) — só em ambiente descartável/de teste.
- No boot do servidor (`npm start` / Railway) as migrações pendentes são aplicadas automaticamente (idempotente).

## Desenvolvimento

```bash
# com Postgres local:
DATABASE_URL=postgres://usuario:senha@localhost:5432/grupos npm run dev
# sem banco: os testes cobrem tudo; health "db up" só faz sentido com banco.
```

- Escuta em `0.0.0.0:8787` (default; `PORT` sobrescreve).
- Shutdown gracioso em SIGTERM/SIGINT (fecha server e pool).

### Proxy do Vite (front, A2)

Para o front em `http://localhost:5173` falar com a API em dev sem CORS:

```ts
// app/vite.config.ts
server: {
  proxy: {
    "/api": { target: "http://localhost:8787", changeOrigin: true },
  },
}
```

Com o proxy, o navegador vê same-origin (o cookie `SameSite=None; Secure` funciona em localhost nos navegadores modernos). Em produção o front chama a URL pública da API (`VITE_API_URL`) com credenciais — as origens exatas devem estar listadas em `WEB_ORIGIN` da API.

### Healthcheck

```bash
curl -s http://localhost:8787/api/v1/health
# 200: {"status":"ok","revision":"...","db":"up"}   |   503: {"status":"degraded","revision":"...","db":"down"}
```

Critério de saúde do Railway: HTTP 200. `revision` = env `REVISION` (fallback `RAILWAY_GIT_COMMIT_SHA`, default `"dev"`).

## Variáveis de ambiente (nomes; ver `.env.example`)

| Nome | Uso |
|---|---|
| `NODE_ENV` | `production` exige `WEB_ORIGIN` (fail-fast) e enxuga mensagens de erro. |
| `PORT` | Porta de escuta (default `8787`; Railway injeta a própria). |
| `DATABASE_URL` | Conexão PostgreSQL. **Obrigatória para servidor/migrations**; testes não exigem (pg-mem). |
| `SSL_REQUIRED` | `1` força TLS no pool (TLS automático para hosts `*.railway.internal`). |
| `WEB_ORIGIN` | Origens exatas do front para CORS (vírgula; sem wildcard). Obrigatória em produção. |
| `SESSION_TTL_HOURS` | TTL da sessão/cookie (decidido D1: `72`). |
| `AUTH_RATE_MAX` / `AUTH_RATE_WINDOW_MS` / `AUTH_RATE_BLOCK_MS` | Rate limit do login por e-mail\|IP (D1: `5` / `300000` / `900000`). |
| `AUTH_REGISTER_RATE_MAX` / `AUTH_REGISTER_RATE_WINDOW_MS` / `AUTH_REGISTER_BLOCK_MS` | Rate limit do **register** por IP (correção pós-auditoria A3; defaults `10` / `300000` / `900000`) — 11ª tentativa do IP na janela → 429. |
| `AUTH_LOGIN_IP_RATE_MAX` / `AUTH_LOGIN_IP_RATE_WINDOW_MS` | Agregado por IP para **falhas** de login — anti-stuffing (correção pós-auditoria A3; defaults `30` / `300000`; bloqueio = `AUTH_RATE_BLOCK_MS`). |
| `REVISION` | Revisão no healthcheck (default `dev`; fallback `RAILWAY_GIT_COMMIT_SHA`). |
| `LOG_LEVEL` | Verbosidade (default `info`). Logs sem corpo/PII (e-mail nunca em claro). |

Nenhum valor real é comitado: `.env` fica fora do VCS (`.gitignore` cobre `.env`/`.env.*` e preserva `.env.example`).

## Contra um PostgreSQL de verdade

As migrações são idênticas às usadas nos testes (mesmos arquivos `src/db/migrations/*.sql`):

```bash
export DATABASE_URL="postgres://..."   # local ou Railway (rede privada)
npm run migrate:up                     # cria migrations/organizations/users/sessions/accounts/releases(+release_accounts)/groups/projects
npm run migrate:status                 # 7 aplicadas, 0 pendentes
npm run dev                            # ou npm run build && npm start
curl -s localhost:8787/api/v1/health   # {"status":"ok",...,"db":"up"}
```

## Endpoints (prefixo `/api/v1`)

| Método/rota | Descrição |
|---|---|
| `GET /api/v1/health` | Sem auth; `200 ok` / `503 degraded` + `revision`. |
| `POST /api/v1/auth/register` | `{email, password, name, orgName?}` → `201 {user, org}` + cookie (login automático). Senha 8–128 (D1). E-mail duplicado → `409 AUTH_EMAIL_TAKEN`. |
| `POST /api/v1/auth/login` | `{email, password}` → `200 {user, org}` + cookie. Com bloqueio → `429 AUTH_RATE_LIMITED` + `Retry-After`. |
| `POST /api/v1/auth/logout` | Invalida a sessão e limpa o cookie → `204` (idempotente). |
| `GET /api/v1/auth/me` | Exige sessão → `200 {user, org}` (org SEMPRE da sessão — ENG-02). |
| `POST /api/v1/accounts` | (Fatia 2) Exige sessão → `201` + recurso flat da conta. |
| `GET /api/v1/accounts?search=&page=&pageSize=` | (Fatia 2) Lista paginada da org da sessão → `200 {items, total, page, pageSize}`. |
| `GET /api/v1/accounts/:id` | (Fatia 2) Exige sessão → `200` + recurso; alheio/inexistente → `404 TENANT_FORBIDDEN` genérico. |
| `PATCH /api/v1/accounts/:id` | (Fatia 2) `{name?, type?, isSpy?}` (≥1 campo) → `200` + recurso atualizado. |
| `POST /api/v1/releases` | (Fatia 3, D13; projectId validado na Fatia 6) `{name, type, projectId?, accountIds?}` → `201` + recurso flat. `type` ∈ `WhatsRelease`\|`WhatsList`\|`WhatsViralCampaign` (enum fechado, ordem direta do dono — a API original SendFlow). `projectId` = **uuid de projeto da MESMA org** (ou `null`). |
| `GET /api/v1/releases?search=&archived=&page=&pageSize=` | (Fatia 3) Lista paginada da org da sessão → `200 {items, total, page, pageSize}`; cada item inclui `accountIds`. |
| `GET /api/v1/releases/:id` | (Fatia 3) Exige sessão → `200` + recurso; alheio/inexistente → `404 TENANT_FORBIDDEN` genérico. |
| `PATCH /api/v1/releases/:id` | (Fatia 3; projectId validado na Fatia 6) `{name?, type?, projectId?, accountIds?}` (≥1 campo; `archived` NUNCA em body) → `200`; `accountIds` substitui o conjunto por inteiro; `projectId` uuid mesma-org ou `null` limpa. |
| `POST /api/v1/releases/:id/archive` | (Fatia 3, D12) Ação idempotente → `200` com `archived:true`. |
| `POST /api/v1/releases/:id/unarchive` | (Fatia 3, D12) Ação idempotente → `200` com `archived:false`. |
| `POST /api/v1/groups` | (Fatia 5, D18) `{releaseId, name, gid?, limitPessoas?}` → `201` + recurso flat. `releaseId` deve existir e ser da MESMA org → senão `400` genérico. `cheio`/`seq` derivados de leitura. |
| `GET /api/v1/groups?releaseId=&search=&cheio=&page=&pageSize=` | (Fatia 5) Lista paginada da org → `200 {items, total, page, pageSize}`. `releaseId` ausente = todos; alheio/inexistente → `200` vazio honesto. `cheio` ∈ `todos`\|`sim`\|`nao`; busca CI em name OU gid. |
| `GET /api/v1/groups/:id` | (Fatia 5) → `200` + recurso (com `seq`); alheio/inexistente → `404 TENANT_FORBIDDEN` genérico. |
| `PATCH /api/v1/groups/:id` | (Fatia 5) `{name?, gid?, limitPessoas?}` (≥1 campo; `releaseId` imutável, `clicks`/`participants`/`cheioManual`/`cheio` NUNCA em body) → `200`. |
| `POST /api/v1/groups/:id/mark-full` | (Fatia 5, D12) Ação idempotente → `200` com `cheioManual:true` (só `cheio_manual`/`updated_at` mudam). |
| `POST /api/v1/groups/:id/mark-not-full` | (Fatia 5, D12) Ação idempotente → `200` com `cheioManual:false` (teto atingido mantém `cheio:true`). |
| `DELETE /api/v1/groups/:id` | (Fatia 5, **D16**) Hard delete LOCAL → `204`; repetição → `404` genérico; **massa FORA sempre** (D10/D15). |
| `POST /api/v1/projects` | (Fatia 6) `{name}` → `201` + recurso flat com counts (`releaseCount`/`accountCount`/`webhookCount` nascem 0). |
| `GET /api/v1/projects?search=&page=&pageSize=` | (Fatia 6) Lista paginada da org → `200 {items, total, page, pageSize}`; counts computados por página (2 queries agrupadas). |
| `GET /api/v1/projects/:id` | (Fatia 6) → `200` + recurso com counts; alheio/inexistente → `404 TENANT_FORBIDDEN` genérico (mesmo não-vazio no DELETE → 404, nunca 409). |
| `PATCH /api/v1/projects/:id` | (Fatia 6) `{name}` (≥1 campo) → `200` + recurso. |
| `DELETE /api/v1/projects/:id` | (Fatia 6, **D19**) Exclusão SÓ de projeto VAZIO → `204`; com releases vinculadas → `409 PROJECT_NOT_EMPTY` corpo fixo (D21; delete de não-vazio pendente DEC-16); repetição → `404` genérico. |

Erros: envelope único `{error:{code,message,details?}}` — códigos e status no contrato §5.5.

**Mutações exigem `Content-Type: application/json`** (Fatia 2, D6 — estendido às rotas de releases da Fatia 3, de grupos da Fatia 5 e de projetos da Fatia 6, inclusive os `DELETE` por uniformidade): POST/PATCH/ações de releases e groups, DELETE de groups, POST/PATCH/DELETE de projects e POST/PATCH de accounts e register/login/logout rejeitam qualquer outro media type (ou header ausente) com `400 VALIDATION_ERROR` antes de ler o corpo — `application/json; charset=utf-8` é aceito. Fundamento: JSON força preflight CORS e origem não autorizada falha no preflight (sem token CSRF nesta fatia — avaliação no contrato da Fatia 2 §3.5).

Cookie de sessão (D2): `grupos_session`; `HttpOnly; Secure; SameSite=None; Path=/`; sem `Domain`; token opaco — só sha256(token) é persistido.

### Contas (Fatia 2) — exemplos curl sintéticos

Recurso (flat, camelCase; sem qualquer telefone/ID externo/credencial — CTA-03):

```json
{
  "id": "uuid",
  "name": "Loja Principal",
  "type": "WhatsApp",
  "isSpy": false,
  "connectionStatus": "nao_conectada",
  "createdAt": "2026-11-08T12:00:00.000Z",
  "updatedAt": "2026-11-08T12:00:00.000Z"
}
```

```bash
COOKIE="grupos_session=<token-opaco>"   # obtido no register/login

# Criar (201; defaults: type=WhatsApp, isSpy=false, connectionStatus=nao_conectada)
curl -s -X POST http://localhost:8787/api/v1/accounts \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"Loja Principal","isSpy":false}'

# Listar com busca (case-insensitive por substring no name) e paginação (page>=1; pageSize 1..100, default 20)
curl -s "http://localhost:8787/api/v1/accounts?search=loja&page=1&pageSize=20" -H "Cookie: $COOKIE"
# 200: {"items":[...],"total":1,"page":1,"pageSize":20}

# Ler por id (da própria org; alheio/inexistente -> 404 TENANT_FORBIDDEN identico; UUID malformado -> 400)
curl -s http://localhost:8787/api/v1/accounts/00000000-0000-4000-8000-000000000000 -H "Cookie: $COOKIE"

# Editar (parcial: >=1 campo; updated_at sempre anda)
curl -s -X PATCH http://localhost:8787/api/v1/accounts/00000000-0000-4000-8000-000000000000 \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"Loja Matriz","type":"WhatsApp","isSpy":true}'
```

Regras rápidas: `name` 1..120 e `type` 1..60 pós-trim (defaults provisórios — DEC-12 aberta); `search` ≤120; `page`/`pageSize` fora da faixa → `400` (sem clamp); `org_id`, `connectionStatus`, `phone` e qualquer campo desconhecido no body → `400 VALIDATION_ERROR`; `org_id` vem SEMPRE da sessão. **Não há `DELETE` de conta** (decisão D5 — proposta futura, requer decisão do dono). Ordenação fixa `created_at DESC, id DESC`.

### Releases (Fatia 3, Decisão D13) — exemplos curl sintéticos

Recurso (flat, camelCase; `type` com os 3 valores EXATOS da API original SendFlow — D13):

```json
{
  "id": "uuid",
  "name": "Black Friday",
  "type": "WhatsRelease",
  "projectId": null,
  "archived": false,
  "accountIds": ["00000000-0000-4000-8000-000000000000"],
  "createdAt": "2026-11-08T12:00:00.000Z",
  "updatedAt": "2026-11-08T12:00:00.000Z"
}
```

```bash
COOKIE="grupos_session=<token-opaco>"   # obtido no register/login

# Criar (201; type OBRIGATORIO e so aceita WhatsRelease | WhatsList | WhatsViralCampaign
# — 'aleatorio' ou qualquer outro valor -> 400. accountIds: contas da MESMA org,
# duplicatas deduplicadas; projectId: UUID de projeto da MESMA org (ou null;
# texto livre legado -> 400 — Fatia 6 pagou a pendencia da D13)
curl -s -X POST http://localhost:8787/api/v1/releases \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"Black Friday","type":"WhatsRelease","projectId":"00000000-0000-4000-8000-00000000000a","accountIds":["00000000-0000-4000-8000-000000000000"]}'

# Listar (busca CI por substring no name; archived=true|false, ausente = todas;
# page>=1; pageSize 1..100 default 20; cada item vem com accountIds)
curl -s "http://localhost:8787/api/v1/releases?search=black&archived=false&page=1&pageSize=20" -H "Cookie: $COOKIE"
# 200: {"items":[...],"total":1,"page":1,"pageSize":20}

# Ler por id (da propria org; alheio/inexistente -> 404 TENANT_FORBIDDEN identico; UUID malformado -> 400)
curl -s http://localhost:8787/api/v1/releases/00000000-0000-4000-8000-000000000001 -H "Cookie: $COOKIE"

# Editar (parcial: >=1 campo; archived NUNCA em body; accountIds SUBSTITUI o
# conjunto por inteiro; projectId null limpa)
curl -s -X PATCH http://localhost:8787/api/v1/releases/00000000-0000-4000-8000-000000000001 \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"BF 2","type":"WhatsList","projectId":null,"accountIds":[]}'

# Arquivar/desarquivar (acoes idempotentes D12; corpo vazio ok; archived boolean D13)
curl -s -X POST http://localhost:8787/api/v1/releases/00000000-0000-4000-8000-000000000001/archive \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE"
curl -s -X POST http://localhost:8787/api/v1/releases/00000000-0000-4000-8000-000000000001/unarchive \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE"
```

Regras rápidas (D13 + Fatia 6): `type` enum fechado — **proibido inventar valores** ("Aleatório" não existe); `archived` default `false` e só muda pelas ações acima; `accountIds` de outra org ou inexistente → `400` genérico (não revela quais); `projectId` = **uuid** que deve existir e ser da **mesma org** (ou `null` — ausente no POST = `null`, ausente no PATCH = não mexe; texto livre legado → `400` genérico, pendência D13 paga pela Fatia 6); **sem DELETE** (D5), **sem arquivar em massa** (D10 — itere por id), **sem unique de nome** (D11), **sem algoritmo de distribuição** (semântica de `WhatsViralCampaign` segue aberta — DEC-03). Ordenação fixa `created_at DESC, id DESC`.

### Grupos (Fatia 5, D15–D18) — exemplos curl sintéticos

Recurso (flat, camelCase; vocabulário DEC-06; `cheio` e `seq` DERIVADOS de leitura — nunca aceitos em body):

```json
{
  "id": "uuid",
  "releaseId": "uuid",
  "name": "Grupo Black Friday 1",
  "gid": "1203630abcdef@ggroup.test",
  "seq": 1,
  "clicks": 0,
  "participants": 0,
  "limitPessoas": null,
  "cheioManual": false,
  "cheio": false,
  "createdAt": "2026-11-08T12:00:00.000Z",
  "updatedAt": "2026-11-08T12:00:00.000Z"
}
```

```bash
COOKIE="grupos_session=<token-opaco>"   # obtido no register/login

# Criar registro LOCAL (201; defaults: gid null, limitPessoas null — o 350 de
# CRG-06 e valor ILUSTRATIVO, nunca default; clicks/participants nascem 0 e
# NENHUM endpoint desta fatia os escreve - fonte futura e FLX/VGC).
# releaseId: obrigatorio, deve existir E ser da MESMA org -> senao 400 generico.
curl -s -X POST http://localhost:8787/api/v1/groups \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"releaseId":"00000000-0000-4000-8000-000000000001","name":"Grupo Black Friday 1","gid":"1203630abcdef@ggroup.test","limitPessoas":350}'

# Listar (releaseId opcional: ausente = TODOS os grupos da org - busca global;
# alheio/inexistente -> 200 {items:[],total:0} vazio honesto, PADRAO NOVO da
# Fatia 5; malformado -> 400). cheio: todos|sim|nao (DEC-06: cheio = manual OU
# participants >= limitPessoas - cada sinal basta). busca CI substring em
# name OU gid. Ordenacao fixa created_at DESC, id DESC. seq vem preenchida SO
# na lista com releaseId unico (nao e identidade estavel: DELETE decai ordinais
# posteriores - use id).
curl -s "http://localhost:8787/api/v1/groups?releaseId=00000000-0000-4000-8000-000000000001&search=black&cheio=todos&page=1&pageSize=20" -H "Cookie: $COOKIE"
# 200: {"items":[...],"total":1,"page":1,"pageSize":20}

# Ler por id (da propria org; alheio/inexistente -> 404 TENANT_FORBIDDEN identico; UUID malformado -> 400)
curl -s http://localhost:8787/api/v1/groups/00000000-0000-4000-8000-000000000002 -H "Cookie: $COOKIE"

# Editar registro LOCAL (parcial: >=1 campo; releaseId IMUTAVEL; clicks/
# participants/cheioManual/cheio/seq NUNCA em body; gid null limpa;
# limitPessoas null remove o teto calculado)
curl -s -X PATCH http://localhost:8787/api/v1/groups/00000000-0000-4000-8000-000000000002 \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"BF 2","limitPessoas":null}'

# Marcar/desmarcar cheio manual (acoes idempotentes D12; corpo vazio ok;
# mexem SOMENTE em cheioManual/updated_at - contadores intocados; desmarcar
# NAO elimina o sinal do teto: cheio segue true se participants >= limitPessoas)
curl -s -X POST http://localhost:8787/api/v1/groups/00000000-0000-4000-8000-000000000002/mark-full \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE"
curl -s -X POST http://localhost:8787/api/v1/groups/00000000-0000-4000-8000-000000000002/mark-not-full \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE"

# Excluir (D16 RATIFICADO: hard delete LOCAL, 204 sem corpo; repeticao -> 404
# identico; massa FORA sempre - D10/D15/D16)
curl -s -X DELETE http://localhost:8787/api/v1/groups/00000000-0000-4000-8000-000000000002 \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE"
```

Regras rápidas (Fatia 5): `name`/`gid` 1..120 pós-trim (gid com **trim apenas**, sem normalização de caixa — busca é CI via `lower()`); `limitPessoas` inteiro 1..100000 ou `null` (DEC-12 provisória); `search` ≤120; `cheio`/`seq`/`org_id`/`id` e qualquer campo desconhecido no body → `400`; **sem operações em massa** (D15 — itere por id); **sem export CSV** (D17 — adiado até DEC-05); sem coluna "Suspenso"/link/tipo (provedor NT — DIR-04); cliques nunca ocupam vaga (o teto compara `participants`).

### Projetos (Fatia 6, D19–D21) — exemplos curl sintéticos

Recurso (flat, camelCase; counts SEMPRE computados na leitura — nunca aceitos em body; `webhookCount` é 0 literal — módulo de webhooks inexistente):

```json
{
  "id": "uuid",
  "name": "Cliente Omega",
  "releaseCount": 2,
  "accountCount": 3,
  "webhookCount": 0,
  "createdAt": "2026-11-09T12:00:00.000Z",
  "updatedAt": "2026-11-09T12:00:00.000Z"
}
```

```bash
COOKIE="grupos_session=<token-opaco>"   # obtido no register/login

# Criar (201; counts nascem 0 — nenhuma release pode referenciar projeto
# inexistente; name 1..120 pós-trim; SEM unique de nome — D11)
curl -s -X POST http://localhost:8787/api/v1/projects \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"Cliente Omega"}'

# Listar com busca CI por substring no name e paginacao (page>=1; pageSize
# 1..100 default 20; counts por pagina em 2 queries agrupadas — sem N+1)
curl -s "http://localhost:8787/api/v1/projects?search=omega&page=1&pageSize=20" -H "Cookie: $COOKIE"
# 200: {"items":[...],"total":1,"page":1,"pageSize":20}

# Ler por id (da propria org; alheio/inexistente -> 404 TENANT_FORBIDDEN
# identico; UUID malformado -> 400)
curl -s http://localhost:8787/api/v1/projects/00000000-0000-4000-8000-00000000000a -H "Cookie: $COOKIE"

# Editar (parcial: >=1 campo; so name; updated_at sempre anda)
curl -s -X PATCH http://localhost:8787/api/v1/projects/00000000-0000-4000-8000-00000000000a \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE" \
  -d '{"name":"Cliente Omega Dois"}'

# Excluir (D19: SO projeto VAZIO - 204 sem corpo; repeticao -> 404 identico;
# com releases vinculadas -> 409 PROJECT_NOT_EMPTY corpo FIXO sem contagem,
# linha intacta; nao-vazio pendente DEC-16; massa FORA - D10; o guard D6
# aplica: DELETE exige Content-Type application/json)
curl -s -X DELETE http://localhost:8787/api/v1/projects/00000000-0000-4000-8000-00000000000a \
  -H "Content-Type: application/json" -H "Cookie: $COOKIE"
```

Regras rápidas (Fatia 6): `name` 1..120 pós-trim (defaults provisórios DEC-12); `search` ≤120; `releaseCount` = releases com `projectId` do projeto; `accountCount` = **DISTINCT** de contas via `release_accounts` das releases do projeto (derivação indireta — ENT-13/FLX-10; a mesma conta em 2 releases conta 1x); `webhookCount` = 0 declarado (módulo WHE inexistente — DIR-04); counts/org_id/id/datas em body → `400`; DELETE alheio (vazio ou NÃO-VAZIO) → `404` nunca `409`; corrida FK (release vinculada entre o COUNT e o DELETE) → banco recusa (RESTRICT) → `409`; reversão da migração 007 recria `releases.project_id text` **vazia** (perda declarada D20) — **reverter o código de releases exige reverter a migração** (acoplamento declarado no contrato §8).

## Notas operacionais

- **Deploy/provisionamento são do orquestrador** (D4): plano documental no contrato §13.
- Rate limit é **em memória** (por instância): correto com 1 réplica; revisar ao escalar. Três limitadores independentes: login por e-mail|IP (`AUTH_RATE_*`), login agregado por IP (`AUTH_LOGIN_IP_*`) e register por IP (`AUTH_REGISTER_*`).
- Sessões expiradas: purge preguiçoso na validação + best-effort no login (sem cron).
- A migração roda no boot antes de escutar; corrida entre instâncias (23505 no insert do controle) é tratada como "outra aplicou" — o boot segue (correção pós-auditoria A3).
- Pool do PostgreSQL real usa timeouts duros: conexão 10 s; statement/query 8 s; o healthcheck corre o `SELECT 1` contra um teto de 3 s (perdeu a corrida → `503 db:down`).
