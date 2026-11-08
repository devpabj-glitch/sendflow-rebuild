# grupos-api — Fatia 1 (Fundação)

API de autenticação de servidor, organização/tenant, PostgreSQL com migrações versionadas e API base do produto **Grupos**.

**Contrato técnico:** `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` (decisões do coordenador na seção §0) · **Parecer A4:** `docs/contracts/FATIA-01-FUNDACAO-PARECER.md`.

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
npm test             # vitest run — health, auth, ratelimit, migrations, tenant
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
- `down` da 001–003 dropa as tabelas da fundação — só em ambiente descartável/de teste.
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
npm run migrate:up                     # cria migrations/organizations/users/sessions
npm run migrate:status                 # 3 aplicadas, 0 pendentes
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

Erros: envelope único `{error:{code,message,details?}}` — códigos e status no contrato §5.5.

Cookie de sessão (D2): `grupos_session`; `HttpOnly; Secure; SameSite=None; Path=/`; sem `Domain`; token opaco — só sha256(token) é persistido.

## Notas operacionais

- **Deploy/provisionamento são do orquestrador** (D4): plano documental no contrato §13.
- Rate limit é **em memória** (por instância): correto com 1 réplica; revisar ao escalar. Três limitadores independentes: login por e-mail|IP (`AUTH_RATE_*`), login agregado por IP (`AUTH_LOGIN_IP_*`) e register por IP (`AUTH_REGISTER_*`).
- Sessões expiradas: purge preguiçoso na validação + best-effort no login (sem cron).
- A migração roda no boot antes de escutar; corrida entre instâncias (23505 no insert do controle) é tratada como "outra aplicou" — o boot segue (correção pós-auditoria A3).
- Pool do PostgreSQL real usa timeouts duros: conexão 10 s; statement/query 8 s; o healthcheck corre o `SELECT 1` contra um teto de 3 s (perdeu a corrida → `503 db:down`).
