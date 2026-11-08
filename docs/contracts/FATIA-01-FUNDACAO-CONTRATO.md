# CONTRATO TÉCNICO — FATIA 1: FUNDAÇÃO (auth de servidor, tenant, banco, migrações, API base)

> **Status:** APROVADO PARA IMPLEMENTAÇÃO — parecer A4 FAVORÁVEL COM RESSALVAS (`FATIA-01-FUNDACAO-PARECER.md`); ressalvas R1/R2 atendidas pelas decisões do coordenador (§0). Implementação na branch `a1/foundation`, serviço `/api`.
> **Repositório:** sendflow-rebuild (público). **Nenhum segredo, token, senha ou valor de variável aparece neste documento** — variáveis só por nome.
> **Fontes:** `docs/continuidade/LEIA-ME-CONTINUIDADE.md`, `03-PENDENCIAS-E-PROXIMOS-PASSOS.md` (§4.1, §5), `fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md` (PM-GRUPOS v1.0: §1 regras 1–12, §2 DIR, §6 ENG, §7), `fontes/qualidade/MATRIZ-VALIDACAO-SENDFLOW-INTEGRACAO-V1.md`, `fontes/backend-infra/PREPARO-API-BANCO.md`, `fontes/backend-infra/ESTADO-INFRA-20261108.md`, `app/src/auth.ts`, `app/src/store.tsx`.

---

## 0. Decisões do coordenador aceitas (08/11/2026)

Registradas pelo coordenador após o parecer A4 (FAVORÁVEL COM RESSALVAS). A Ressalva **R2** fica resolvida pela **D1** e a **R1** pela **D3**. Estas decisões são a autorização de implementação dos pontos pendenciados em §15.1–15.3.

- **D1 — Defaults viram contrato técnico novo (decidido):** rate limit do login = **5 tentativas / janela 300 s / bloqueio 900 s** (sobrescrevíveis por env `AUTH_RATE_MAX`, `AUTH_RATE_WINDOW_MS`, `AUTH_RATE_BLOCK_MS` — por nome); **TTL da sessão 72 h** (`SESSION_TTL_HOURS`); **senha mínima 8 caracteres** — contrato **NOVO** da API; o antigo auth local com mínimo 4 deixa de existir junto com o próprio auth local (nota de compatibilidade da R2(iii) registrada em §14.13); **e-mail duplicado no register → 409 `AUTH_EMAIL_TAKEN`** (preserva o contrato vigente do `app/src/auth.ts`: "Este e-mail já está cadastrado").
- **D2 — Cookie de sessão:** `SameSite=None; Secure; HttpOnly; Path=/` **sempre**, em qualquer ambiente (produção é cross-origin entre domínios Railway; localhost via proxy Vite é same-origin e navegadores modernos aceitam `Secure` em localhost). **Sem atributo `Domain`** (mantém viável o prefixo `__Host-` em produção se o dono decidir usá-lo — o nome do cookie é transparente para o front, que nunca o lê, por ser `httpOnly`). Nome do cookie: **`grupos_session`**.
- **D3 — A política de bloqueio por tentativas é contrato técnico NOVO** (atende R1): não é "replicação" de checklist legado — `CHECKLIST-LOGIN-BORDA` não consta do pacote de fontes (relato INF, não prova, e o front legado não tem bloqueio algum). Reformulação aplicada no §5.3.
- **D4 — Divisão de trabalho:** o A1 **não provisiona nada no Railway nem faz deploy/git** — o orquestrador cuida. O A1 entrega **código + testes + runbook** (`/api/README.md`). O plano §13 permanece documental (não é autorização).

Ajustes decorrentes aplicados ao corpo deste contrato: §2 (testes via `fastify.inject()`, sem supertest — requisito "tudo offline"), §3 (layout final implementado), §4 (DDL final: 3 migrações, `gen_random_uuid()`, e-mail `text` + unique index em `lower(email)`), §5.3 (reformulação D3), §5.4 (cookie D2), §10 (nomes `AUTH_RATE_*`/`SSL_REQUIRED`), §13.3 (nomes de env atualizados), §14/§15 (decisões e compatibilidade registradas).

---

## 1. Escopo e fora de escopo

### 1.1 Dentro do escopo (fechado)
1. **API HTTP em `/api`** (novo serviço no monorepo): Node + TypeScript + Fastify, escutando em `0.0.0.0:$PORT`.
2. **Autenticação de servidor:** registro (org + usuário dono), login com janela de bloqueio por tentativas, logout, sessão por cookie `httpOnly` com token opaco hasheado no banco, `GET /me`.
3. **Organização/tenant:** modelo mínimo — cada usuário pertence a exatamente **1 organização**; **sem papéis, sem admin global** (DEC-21 não decidida: nada inventado).
4. **Banco de dados PostgreSQL** com **migrações SQL versionadas e reversíveis** (up/down) e runner próprio (`up`/`down`/`status`).
5. **API base:** envelope de erro único, healthcheck com revision, CORS restrito por origens exatas.
6. **Remoção do usuário com senha fixa** semeado em `app/src/auth.ts` (credencial fixa em código é risco registrado em 03 §3). A troca do fluxo de login no front é da A2; esta fatia remove o seed e define os endpoints. **Sequenciamento:** a remoção só entra no PR junto com o rewiring da A2, coordenado pelo orquestrador, para não quebrar o login vigente.
7. **Testes offline** (sem Docker, sem rede) cobrindo os itens acima.

### 1.2 Fora de escopo (não construir, mesmo que "pareça fácil")
- Qualquer módulo de produto: contas, campanhas, grupos, projetos, fila, mensagens, automações, webhooks (fatias 2+). Nenhum ID `GRP-*` de módulo é coberto diretamente por esta fatia.
- Envio externo de qualquer natureza (WhatsApp/SMS/e-mail/HTTP de terceiros) — DIR-04/06, EXC-06.
- E-mail real: verificação de e-mail, recuperação de senha, qualquer envio. O e-mail é **apenas identificador local**.
- Papéis, permissões, equipe, admin global (DEC-21); métricas (MET/DEC-14); seed de demonstração em produção; cron/limpeza agendada; multi-réplica; rate limit distribuído; 2FA; troca de senha.

### 1.3 IDs do PM envolvidos (transversais, não funcionais)
| ID | Aplicação nesta fatia |
|---|---|
| ENG-01 (conta ≠ sessão ≠ IDs externos) | Analogia aplicada ao que existe aqui: **usuário ≠ sessão** são entidades separadas; trocar/refazer sessão não altera o usuário nem a organização. |
| ENG-02 (escopo tenant + testes negativos cruzados) | §6: `org_id` deriva **sempre** da sessão, nunca do request; guard pronto; testes negativos obrigatórios. |
| ENG-03 (tarefa ≠ tentativa ≠ efeito) | N/A nesta fatia (sem fila). |
| ENG-04 (preservação de dados/migrações) | §7: migrações reversíveis, idempotentes, sem descarte silencioso; checksum detecta alteração de migração já aplicada. Não há acervo em produção ainda (Railway não tem banco — ESTADO-INFRA-20261108 §"Persistência"), então a 001 **cria** schema novo; nada é migrado de semântica legada. |
| ENG-05 (tempo/fuso) | Parcial: todos os timestamps em UTC (`timestamptz`); fuso explícito por registro não se aplica a nada desta fatia. |
| ENG-06 (observabilidade) | Parcial: healthcheck e erros com código estável; sem contadores de negócio. |
| ENG-07 (backup honesto) | Política apontada no §13: dump antes de cada deploy **é responsabilidade do orquestrador**; a fatia não implementa backup. |
| ENG-08 (auth: só contrato existente, nenhuma política nova) | A única política de auth herdada do legado é o **bloqueio por tentativas em janela** (CHECKLIST-LOGIN-BORDA). Esta fatia replica exatamente isso (valores via env); não introduz lockout permanente, captcha, 2FA nem outra política. |
| ENG-09 (segredos/PII) | Senha hasheada com scrypt+salt; token de sessão jamais armazenado/logado em claro (só sha-256); logs não contêm senha, token nem cookie; nenhuma credencial em código (remove o seed fixo). |
| ENG-12 (transporte/API: contrato explícito antes de implementar) | **Este documento é o contrato** exigido pelo ENG-12 para as APIs novas da fatia. |
| DIR-01 (backend primeiro), DIR-04 (nada fake), DIR-07 (fatia coordenada) | Respeitados: fundação antes de UI final; nenhum dado demo apresentado como real; escopo fechado pelo orquestrador. |

Critérios da MATRIZ-VALIDACAO endereçados: **AUTH-01, TEN-01, PER-01, ERR-01, MIG-01, REG-01, REL-01** (mapeamento no §12). UI-01/UI-02/E2E-01 são da A2/orquestrador.

---

## 2. Stack e justificativa

**Node.js 22 LTS + TypeScript (em `/api`)** — Mesmo runtime e mesmo gerenciador (npm) já usados pelo front no Railway (RAILPACK), o que elimina uma variável de build no deploy; TypeScript nativo para o repositório (o front já é TS); janela de suporte longa. Uma só linguagem no monorepo reduz custo de auditoria da A3.

**Fastify** — Framework maduro, com **validação de JSON Schema embutida** (ajv interno: os contratos de entrada ficam declarados no próprio schema da rota, sem dependência extra de validação), plugins oficiais de cookie e CORS, e teste via `inject()`/supertest. Superfície menor que frameworks com DI/decorators — menos semântica oculta para auditar. Nada de Nest/Express legado.

**PostgreSQL (serviço gerenciado Railway, produção)** — Alvo mandatório pela definição da fatia. Motivos técnicos: **DDL transacional** (cada migração roda em uma transação — requisito prático para ENG-04), tipos de tempo (`timestamptz`) corretos, restrições/índices auditáveis em SQL puro.

**Migrações SQL versionadas em arquivos + runner próprio (sem ORM)** — O diff de cada mudança de schema é SQL visível (a auditoria da A3 lê SQL, não geração de ORM); o runner é pequeno, auditável e dependency-light; MIG-01 exige reversibilidade e idempotência explícitas — mais fácil provar em 150 linhas de runner próprio do que em ferramenta genérica.

**vitest + `fastify.inject()`** — vitest é rápido, nativo de TypeScript e coerente com o ecossistema do repo; `inject()` exercita o pipeline HTTP completo do Fastify (rotas, schemas, hooks, cabeçalhos e `Set-Cookie`) **sem abrir porta e sem rede** — atende o requisito "tudo offline" (§11) sem dependência extra (supertest descartado por decisão do coordenador de implementação).

**pg-mem (testes offline)** — Escolha para a suíte offline; justificativa e **limitações declaradas** no §11. Produção nunca usa pg-mem.

**scrypt via `node:crypto` (std) para hash de senha** — scrypt é memory-hard, recomendado contemporaneamente, e está **na stdlib do Node** — nenhuma dependência nativa a compilar no Windows local (argon2 exigiria binário; bcrypt idem). Verificação com `timingSafeEqual`. sha-256 (`node:crypto`) para o hash do token de sessão no banco.

---

## 3. Layout de diretórios de `/api`

```
api/
  package.json
  tsconfig.json
  vitest.config.ts
  .env.example              # SOMENTE nomes de variáveis, sem valores
  src/
    index.ts                # bootstrap: config fail-fast, pool, migrate:up automático (§7), listen 0.0.0.0:$PORT, shutdown gracioso (SIGTERM/SIGINT)
    app.ts                  # monta Fastify (cookie, CORS, errorHandler, rotas, logger sem PII) — injetável nos testes
    config.ts               # leitura/validação das variáveis de ambiente (por nome; nunca loga valores)
    middleware/
      requireAuth.ts        # preHandler: cookie → sessão → req.user {id,email,name,orgId}; senão 401 AUTH_UNAUTHENTICATED (§6)
    routes/
      health.ts             # GET /api/v1/health (§8)
      auth.ts               # POST register/login/logout + GET me (§5.1)
    auth/
      password.ts           # scrypt hash/verify + política mínima (8 — D1)
      session.ts            # token opaco + sha256; create/validate/delete/purgeExpired; last_used_at com throttle 60 s
      rateLimit.ts          # janela de tentativas falhadas do login (§5.3; relógio injetável)
    db/
      pool.ts               # pg.Pool a partir de DATABASE_URL (TLS por host railway.internal ou SSL_REQUIRED)
      migrate.ts            # runner transacional: up | down | status (§7) — mesmo runner para pg real e pg-mem; também CLI
      migrations/
        001_organizations.up.sql / .down.sql
        002_users.up.sql / .down.sql
        003_sessions.up.sql / .down.sql
    lib/
      errors.ts             # AppError + envelope único + setErrorHandler (§5.5)
      time.ts               # Clock (sistema; testes injetam relógio falso)
  scripts/
    copy-migrations.mjs     # build copia os .sql para dist (tsc não copia recursos)
  test/
    helpers.ts              # pg-mem + mesmo runner/migrações + buildApp de teste + fixture de 2 tenants
    health.test.ts
    auth.test.ts
    ratelimit.test.ts
    migrations.test.ts
    tenant.test.ts          # todas offline (fastify.inject, sem porta, sem rede, sem Docker)
```

---

## 4. Modelo de dados — DDL final (migrações 001–003; implementado)

Decisões declaradas: **UUIDs com `DEFAULT gen_random_uuid()`** (nativa do PostgreSQL moderno e suportada por pg-mem; a aplicação também pode fornecer ids explícitos); **sem triggers, sem functions, sem extensões** — o e-mail fica `text` com **unique index em `lower(email)`** (equivalente prático ao `citext`, mais portátil para pg-mem); `updated_at` mantido pela aplicação; todos os timestamps `timestamptz` em **UTC**; `org_id` em toda tabela de dado.

```sql
-- 001_organizations.up.sql
CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- 002_users.up.sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  email         text NOT NULL,              -- normalizado: trim + lowercase; identificador LOCAL
  password_hash text NOT NULL,              -- formato §5.2 (scrypt)
  name          text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email));  -- GLOBAL: login não tem contexto de org (preserva contrato vigente: e-mail único)
CREATE INDEX users_org_id_idx ON users (org_id);

-- 003_sessions.up.sql
CREATE TABLE sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token_hash   char(64) NOT NULL,           -- sha-256 hex do token opaco; token claro NUNCA é persistido
  created_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX sessions_token_hash_unique ON sessions (token_hash);
CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
```

Cada `.down.sql` dropa a própria tabela (`DROP TABLE IF EXISTS ...`); o rollback total remove na ordem inversa de dependência (003 → 002 → 001).

Notas:
- Tabela de controle do runner: `migrations (id serial PRIMARY KEY, name text NOT NULL UNIQUE, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())` — checksum = sha-256 do arquivo com finais de linha normalizados (LF), para não divergir entre checkouts Windows/Linux.
- `ON DELETE RESTRICT` em `users.org_id`: usuário nunca fica órfão (não há endpoint de exclusão de org nesta fatia). `ON DELETE CASCADE` existe **apenas** em `sessions.user_id`: sessão é artefato efêmero de autenticação, não dado de negócio; o cascade nunca dispara via API nesta fatia. Declarado para revisão da A3.
- E-mail único **global** (index em `lower(email)`), não por org: o login identifica o usuário só pelo e-mail; unicidade por org criaria ambiguidade. Contrato técnico novo registrado (Recomendação 1 do parecer atendida — cf. §15).
- Expiração de sessão é verificada de forma **preguiçosa** (`expires_at` comparado a cada uso); sessão expirada encontrada em validação é apagada; `purgeExpired` best-effort no login. Lote/cron fica para fatia futura — declarado no §14.
- Tabelas de produto (contas/campanhas/grupos…) **não existem** aqui; todas nascerão com `org_id` (ENG-02) nas fatias 2+.

---

## 5. Autenticação

### 5.1 Endpoints

Todos sob prefixo `/api/v1`. Corpos JSON. Respostas de sucesso **não** usam o envelope de erro.

| Método/rota | Entrada | Sucesso | Efeitos |
|---|---|---|---|
| `POST /api/v1/auth/register` | `{email, password, name, orgName?}` | `201` `{user:{id,email,name}, org:{id,name}}` + cookie de sessão (login automático) | Cria **org + usuário dono** em UMA transação. Sem e-mail real. `orgName` ausente → nome derivado do e-mail (`"Organização de {parte-local}"`). E-mail já cadastrado → `409 AUTH_EMAIL_TAKEN` (D1 — preserva contrato vigente). |
| `POST /api/v1/auth/login` | `{email, password}` | `200` `{user:{…}, organization:{…}}` + cookie | Valida credenciais; sucesso zera o contador da janela de tentativas. |
| `POST /api/v1/auth/logout` | — | `204` + cookie limpo | Apaga a linha de sessão; **idempotente** (sem sessão também 204). |
| `GET /api/v1/auth/me` | — (sessão exigida) | `200` `{user:{…}, organization:{…}}` | Retorna os dados da própria sessão. |

Validação mínima de entrada (JSON Schema por rota): e-mail até 254 caracteres no formato `^[^\s@]+@[^\s@]+\.[^\s@]+$` (mesma regra do front atual — preservação de contrato existente), normalizado `trim+lowercase` antes de gravar/comparar; senha de **8 a 128 caracteres** (**mínimo decidido em D1**: contrato novo da API — o antigo auth local de 4 deixa de existir com o próprio auth local; a A2 rewiring o front); `name`/`orgName` de 1 a 200 caracteres.

### 5.2 Hash de senha (scrypt)
- Formato armazenado em `password_hash`: `scrypt$N$r$p$salt_hex$hash_hex` (parâmetros e comprimentos fixos no código; salt aleatório de 16 bytes por usuário; hash de 64 bytes).
- Verificação: recomputa com os parâmetros/salt do registro e compara com `timingSafeEqual`.
- Nunca logar, exportar ou reexibir `password_hash` (ENG-09).

### 5.3 Janela de tentativas do login (contrato técnico NOVO — reformulado por D3; atende R1/ENG-08)
- **Origem declarada:** a política de bloqueio por tentativas em janela é política de auth existente **por relato (INF — `CHECKLIST-LOGIN-BORDA-*`, fora do pacote de fontes; relato não é prova)**, e o front legado (`app/src/auth.ts`) **não tem bloqueio algum** (login local com tentativas ilimitadas). Por decisão **D3**, o que esta fatia implementa é **contrato técnico novo** — não replicação de checklist legado — com os valores decididos em **D1**.
- Contador em memória por chave `(e-mail normalizado | IP de origem)`; conta somente tentativas **falhadas** dentro da janela; após **5 tentativas falhadas dentro de 300 s**, bloqueia novas tentativas dessa chave por **900 s** (valores D1; sobrescrevíveis por env `AUTH_RATE_MAX` / `AUTH_RATE_WINDOW_MS` / `AUTH_RATE_BLOCK_MS`, por nome).
- **Agregado por IP para falhas de login (correção pós-auditoria A3 — stuffing):** além da chave e-mail|IP, toda falha também alimenta um contador por **IP puro**: `AUTH_LOGIN_IP_RATE_MAX` (default **30**) falhas dentro de `AUTH_LOGIN_IP_RATE_WINDOW_MS` (default **300000 ms**) bloqueiam aquele IP por `AUTH_RATE_BLOCK_MS` (mesmo 900 s). E-mails distintos do mesmo IP continuam contando no agregado; o `Retry-After` é **único** — o **maior bloqueio ativo** entre os dois limitadores (nunca divergente). Sucesso de login limpa apenas a chave e-mail|IP (o agregado por IP envelhece pela janela).
- **Register com rate limit (correção pós-auditoria A3):** `POST /register` tem limite próprio **somente por IP**: `AUTH_REGISTER_RATE_MAX` (default **10**) tentativas dentro de `AUTH_REGISTER_RATE_WINDOW_MS` (default **300000 ms**) → bloqueio de `AUTH_REGISTER_BLOCK_MS` (default **900000 ms**). Conta **toda** tentativa (não só falhas); a 11ª do mesmo IP na janela recebe `429 AUTH_RATE_LIMITED`.
- Durante o bloqueio: `429 AUTH_RATE_LIMITED` com cabeçalho `Retry-After` (segundos restantes). Tentativa falhada = resultado `AUTH_INVALID_CREDENTIALS`; credencial correta durante bloqueio **também** recebe 429 (não revela se a senha está certa). Login bem-sucedido **limpa a chave** (zera o contador). Limpeza lazy de entradas expiradas; relógio injetável para testes.
- Contador em memória: zera em restart e é por instância — aceitável com 1 réplica (configuração atual do projeto); declarado no §14. IP de origem lido com `trustProxy` (X-Forwarded-For do proxy Railway — Recomendação 4 do parecer atendida; declarado).

### 5.4 Sessão (token opaco)
- No login/registro: gera token aleatório de 256 bits (`crypto.randomBytes(32).base64url`), envia no cookie, grava **apenas** `sha256(token)` em `sessions.token_hash`. Comparação por igualdade do hash (+ `timingSafeEqual` pós-fetch).
- Cookie (**D2, decidido**): nome **`grupos_session`**, `HttpOnly`, `SameSite=None`, `Secure`, `Path=/`, **sem atributo `Domain`** — **sempre**, em qualquer ambiente (produção é cross-origin entre domínios Railway; localhost via proxy Vite é same-origin e navegadores modernos aceitam `Secure` em localhost). Sem prefixo `__Host-` por ora; a ausência de `Domain` mantém o prefixo viável no futuro se o dono decidir. `Max-Age = SESSION_TTL_HOURS × 3600` (decidido: 72 h — D1). TTL fixo, sem renovação deslizante (mínimo viável; declarado); `last_used_at` atualizado com throttle de 60 s (observabilidade).
- **Cookie × CORS (comportamento medido — correção pós-auditoria A3):** o cookie é emitido pela rota independentemente do CORS; se a origem pedinte não está autorizada, a resposta vem **sem** `allow-origin` e o navegador **descarta** o cookie — o header `Set-Cookie` presente é inerte (cf. §9).
- **Não há `SESSION_SECRET`**: o token é opaco e validado por lookup no banco; não há assinatura/JWT a forjar. (Registrado para o A3 não esperar a variável.)

### 5.5 Envelope de erro único (ERR-01)
Toda resposta de erro, de qualquer endpoint, é exatamente:
```json
{ "error": { "code": "CODIGO_ESTAVEL", "message": "mensagem humana", "details": { } } }
```
`details` é opcional (presente só quando há conteúdo útil, ex.: campos rejeitados na validação). `message` nunca inclui stack, SQL, internals ou dados de outro tenant.

| Código | HTTP | Quando |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Corpo/entrada inválida (details lista campos). |
| `AUTH_INVALID_CREDENTIALS` | 401 | Login com e-mail/senha inexistentes ou errados — **mensagem idêntica e mesmo tempo-para-responder nos dois casos** (não distingue e-mail existente). |
| `AUTH_UNAUTHENTICATED` | 401 | Endpoint protegido sem sessão válida/expirada. |
| `AUTH_RATE_LIMITED` | 429 | Janela de tentativas excedida — login por e-mail\|IP, login agregado por IP ou register por IP (+ `Retry-After`). |
| `AUTH_EMAIL_TAKEN` | 409 | Registro com e-mail já cadastrado. **Tradeoff declarado:** revela existência do e-mail para preservar o UX do fluxo atual do front ("Este e-mail já está cadastrado") — contrato existente preservado; anti-enumeração estrita pode ser decidida depois pelo dono (§15). |
| `TENANT_FORBIDDEN` | 404 | Acesso a recurso de outro tenant/inexistente — **corpo genérico idêntico ao de recurso inexistente** (não vaza existência). Aplica-se a partir da fatia 2 (endpoints com ID); nesta fatia o guard já existe e é testado em nível de serviço. |
| `NOT_FOUND` | 404 | Rota inexistente. |
| `INTERNAL_ERROR` | 500 | Erro não previsto — mensagem genérica; detalhe só no log do servidor (sem vazar). |

> **Método inexistente em rota existente:** o Fastify responde `404 NOT_FOUND` (não há código 405 nesta fatia — comportamento medido e aceito; `METHOD_NOT_ALLOWED` foi removido da tabela — correção pós-auditoria A3).

---

## 6. Sessão, tenant e middleware

- Plugin `auth`: lê o cookie → `sha256` → `SELECT s.id, s.expires_at, u.id, u.email, u.name, u.org_id, o.id, o.name FROM sessions s JOIN users u … JOIN organizations o …` → rejeita se ausente/expirada (limpando a expirada) → decora `req.user = {id, email, name, orgId}` e `req.organization = {id, name}`.
- **Regra de tenant (ENG-02):** `orgId` vem **exclusivamente** da sessão. `org_id` em body/query/header é **ignorado** (nunca confiado). Todo endpoint futuro de dado recebe `req.user.orgId` e toda query leva `WHERE org_id = $1`. Helper `requireSameOrg(resourceOrgId, req.user.orgId)` lança `TENANT_FORBIDDEN` (404 genérico).
- `GET /api/v1/auth/me` é o único endpoint protegido desta fatia; ele já é org-scoped por construção (não aceita parâmetro).
- **Testes negativos cruzados obrigatórios** (ENG-02): fixture com **2 tenants** (§11); nesta fatia: token de A nunca resolve sessão/dados de B; tentativa de sessão inexistente/adulterada → 401; guard `requireSameOrg` unit-testado com ids sintéticos cruzados → 404 genérico. Os testes cruzados em nível HTTP com IDs de recursos entram na fatia 2 (primeira fatia com endpoints que recebem ID) — mapeado no §12 como limitação declarada da TEN-01.

---

## 7. Migrações

- **Convenção:** `api/src/db/migrations/NNN_nome.up.sql` + `NNN_nome.down.sql` (NNN sequencial, nunca renumerado; correção = nova migração).
- **Runner** `api/src/db/migrate.ts` com comandos: `up` (aplica todos os pendentes), `down` (reverte **a última** aplicada; argumento `n`/`all` reverte mais — uso em ambiente de teste/descartável), `status` (lista aplicadas/pendentes + estado do checksum). Executável via `npm run migrate:up` / `npm run migrate:down [n|all]` / `npm run migrate:status` no serviço (correção pós-auditoria A3: antes citava `db:migrate`, que não existe); usa o mesmo Pool/DATABASE_URL do app.
- **Tabela de controle** criada pelo próprio runner (bootstrap idempotente): `migrations (id serial PRIMARY KEY, name text NOT NULL UNIQUE, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())` (nome harmonizado com §4 — correção pós-auditoria A3).
- **Idempotência e exclusão mútua:** cada migração roda em UMA transação que **insere primeiro** a linha em `migrations` (UNIQUE em `name`) e aplica o DDL em seguida; migração já registrada é pulada; se duas instâncias correrem juntas, o insert da segunda falha por unicidade (23505) e ela **relê o status, confirma o registro e SEGUE** com as demais — corrida de migração não derruba o bootstrap (log informativo; correção pós-auditoria A3. Sem advisory lock — pg-mem não suporta; DDL transacional do PostgreSQL garante atomicidade).
- **Integridade:** checksum (sha-256 do arquivo) gravado na aplicação; `status`/`up` comparam e **falham alto** (erro explícito nomeando o arquivo) se um arquivo já aplicado foi editado — nada é reaplicado ou descartado silenciosamente (ENG-04).
- **Plano de rollback (produção):** preferir **correção para frente** (nova migração). Se `down` for indispensável: (1) orquestrador garante dump recente; (2) congela deploys; (3) `down` da migração alvo revisando o `.down.sql` contra o dump; (4) verificação `status` + healthcheck + smoke autenticado. O `.down.sql` da 001 dropa as três tabelas — **destrutivo por definição** (schema inicial, sem acervo), e só roda onde ordenado.
- **Testes (MIG-01):** em instância pg-mem descartável por caso: `up` → `status` (1 aplicada) → `up` de novo (idempotente, 0 pendentes) → `down` → `status` (0 aplicadas) → `up` re-aplica; contagens de tabelas/índices antes/depois registradas no log do teste.

---

## 8. Healthcheck

`GET /api/v1/health` — **sem autenticação**, sem toque em dados de tenant.
- Banco acessível: `200` `{ "status": "ok", "revision": "<rev>", "db": "up" }`
- Banco inacessível: `503` `{ "status": "degraded", "revision": "<rev>", "db": "down" }`
- `revision` = env `REVISION` injetada no build/deploy; fallback automático para `RAILWAY_GIT_COMMIT_SHA` (variável automática do Railway em deploy por GitHub); ausente ambas → `"unknown"` (o plano de deploy §13 exige que uma das duas exista — é o que fecha REL-01).
- A checagem de banco é um `SELECT 1` com timeout curto; falha nunca derruba o processo.

## 9. CORS

- `WEB_ORIGIN` = lista **exata** de origens permitidas, separadas por vírgula (ex.: a origem pública do front). Comparação string exata, **sem wildcard** (`*` é rejeitado na leitura da config), sem sufixo/prefixo.
- Origem não autorizada — **comportamento real medido (correção pós-auditoria A3)**: a resposta **não inclui** `access-control-allow-origin` (o plugin apenas omite o header; o CORS é exigido pelo navegador, não imposto pelo servidor). O header `Set-Cookie` **pode estar presente** na resposta de register/login (a rota processa normalmente), mas é **inerte**: sem `allow-origin` o navegador descarta a resposta e o cookie nunca se instala. Requests sem `Origin` (curl, healthcheck do Railway) são respondidos normalmente, mas endpoints de sessão exigem o cookie que só nasce de origem autorizada.
- `credentials: true` (cookie), `methods: GET,POST,PUT,PATCH,DELETE,OPTIONS`, `maxAge` de preflight curto (600 s), cabeçalhos permitidos restritos ao necessário (`content-type`).

## 10. Variáveis de ambiente (nomes → uso; nenhum valor)

| Nome | Uso |
|---|---|
| `NODE_ENV` | `production` **exige** `WEB_ORIGIN` (fail-fast no boot) e mensagens de erro enxutas (cookie é `Secure` sempre — D2). |
| `PORT` | Porta de escuta (default `8787`; Railway injeta a própria). |
| `DATABASE_URL` | String de conexão PostgreSQL do serviço de banco (rede privada Railway). **Obrigatória só ao subir o servidor/migrations** — os testes usam pg-mem e não a exigem. |
| `SSL_REQUIRED` | `1` força TLS no pool; o pool também liga TLS automaticamente quando o host de `DATABASE_URL` é `*.railway.internal` (detecção por nome de host; valor nunca logado). |
| `WEB_ORIGIN` | Origens exatas do front para CORS (§9), separadas por vírgula. Obrigatória em produção. |
| `SESSION_TTL_HOURS` | TTL da sessão/cookie (decidido D1: 72). |
| `AUTH_RATE_MAX` | N tentativas falhadas antes do bloqueio (decidido D1: 5). |
| `AUTH_RATE_WINDOW_MS` | Janela de contagem, em ms (decidido D1: 300000). |
| `AUTH_RATE_BLOCK_MS` | Duração do bloqueio, em ms (decidido D1: 900000). Também usado como bloqueio do agregado por IP do login (§5.3). |
| `AUTH_REGISTER_RATE_MAX` | Tentativas de register por IP antes do bloqueio (correção pós-auditoria A3; default 10). |
| `AUTH_REGISTER_RATE_WINDOW_MS` | Janela de contagem do register, em ms (correção pós-auditoria A3; default 300000). |
| `AUTH_REGISTER_BLOCK_MS` | Duração do bloqueio do register, em ms (correção pós-auditoria A3; default 900000). |
| `AUTH_LOGIN_IP_RATE_MAX` | Falhas de login agregadas por IP puro antes do bloqueio — anti-stuffing (correção pós-auditoria A3; default 30). |
| `AUTH_LOGIN_IP_RATE_WINDOW_MS` | Janela do agregado por IP, em ms (correção pós-auditoria A3; default 300000). |
| `REVISION` | Identificador de revisão exibido no healthcheck (default `dev`; fallback `RAILWAY_GIT_COMMIT_SHA` quando `REVISION` ausente). |
| `LOG_LEVEL` | Verbosidade de log (default `info`); logs nunca contêm senha/token/cookie/e-mail em claro. |
| *(front, A2)* `VITE_API_URL` | URL pública da API no build do front — registrada aqui só por nome, para coordenação. |

`.env.example` em `/api` lista **somente os nomes**. `SESSION_SECRET` **não existe** (justificado no §5.4).

## 11. Estratégia de testes offline (Windows, sem Docker, sem rede)

**Escolha: pg-mem** (descartadas: SQLite — divergência de dialeto grande demais para rodar os mesmos `.sql` do PostgreSQL e exigiria dialeto duplo; embedded-postgres — binário externo para baixar/gerenciar, frágil no Windows e contra o espírito offline).

- Cada teste cria um **pg-mem novo**, executa o runner `up` com os **mesmos arquivos** de migração, e sobe o app real (Fastify + supertest) apontando o Pool para o adaptador do pg-mem. A suíte não sabe que não é PostgreSQL — o SQL é o de produção.
- **Fixtures de 2 tenants:** helper cria org A + dono A e org B + dono B (dados 100% sintéticos, ex.: `owner-a@test.invalid`), loga ambos e devolve os dois cookies para o teste cruzar.
- **Rate limit:** teste de integração erra a senha N vezes e espera 429 na N+1-ésima com `Retry-After`; teste de unidade da janela com **relógio falso** (injeção de clock) cobrindo virada de janela, reset por sucesso e expiração do bloqueio.
- **Limitações declaradas (honestas):** pg-mem **não é** o motor real — fidelidade parcial de tipos/erros/índices; sem isolamento de transações real; **persistência entre reinícios de processo não é provável em memória** (PER-01 é provada no nível "reabertura de conexão/Pool e re-instantiação do app sobre a mesma store"); divergências só aparecendo em SQL exótico — mitigado por DDL conservador (sem triggers/functions/extensões/sequences). A prova contra PostgreSQL verdadeiro acontece no gate de deploy autorizado (smoke pós-deploy, §13) e em eventuais execuções locais com Postgres real se o dono as disponibilizar.
- Gates da fatia (REG-01): `npm run typecheck`, `npm test`, `npm run build`, `npm audit` (alvo 0) em `/api`, executados **depois do último diff**, com inventário nominal antes/depois e exit code registrado. Front gates correm por conta da A2. **Sem lint nesta fatia** (correção pós-auditoria A3): eslint seria dependência nova sem config estabelecida — adiado para fatia futura com config flat compartilhada; nenhum script vazio foi criado.

## 12. Mapeamento contrato × critérios da MATRIZ-VALIDACAO

| Critério | O que exige | Artefato deste contrato que o satisfaz | Classe de evidência |
|---|---|---|---|
| **AUTH-01** | Login aceito/recusado; sessão expira; logout invalida; permissões conforme papéis contratados | §5.1–5.4 (endpoints, scrypt, cookie, TTL); testes `auth.login/logout/me.test.ts` com asserts nominais por caso (credencial certa/errada, expirada, logout→me→401). Papéis contratados nesta fatia: **nenhum** — acesso binário autenticado; declarado para o auditor não procurar papéis. | E+L |
| **TEN-01** | Isolamento em leitura/escrita; ID foreign/inexistente recusado sem vazar dado nem existência | §6 (orgId só da sessão; `TENANT_FORBIDDEN` 404 genérico); fixture 2 tenants (§11). **Limitação declarada:** sem endpoints com ID de recurso nesta fatia, o teste cruzado HTTP completo é na fatia 2; aqui provamos sessão cruzada + guard unitário. | L |
| **PER-01** | Persistência após reload/nova sessão/reinício | Testes re-abrem Pool/re-instanciam app sobre a mesma store e releem por oráculo independente (query direta). **Limitação declarada:** pg-mem é em memória; reinício real de processo/serviço só é provável em ambiente descartável autorizado (H) no deploy. | L |
| **ERR-01** | Erros exatamente conforme contrato (status, envelope, campos) | §5.5 tabela código→status + envelope único; `errors.test.ts` percorre a tabela entrada→esperado com asserts de status/corpo. | E+L |
| **MIG-01** | Migração: aplicação, idempotência, reversibilidade/rollback seguro em cópia isolada | §7 (runner, transação insert-first, checksum, down); `migrate.test.ts` executa ciclo up/status/up/idempotente/down/up em instância pg-mem descartável com contagens antes/depois e log. Nunca produção. | L |
| **REG-01** | Regressão: foco da fatia + suíte + typecheck/lint/build depois do último diff | §11 gates (typecheck + test + build + audit; lint adiado — correção pós-auditoria A3) com inventário nominal e logs de exit; suíte integral roda junto com os testes novos da fatia. | L |
| **REL-01** | commit → build → deploy SUCCESS → checagem pública/autenticada da mesma revisão | §8 (revision via `REVISION`/`RAILWAY_GIT_COMMIT_SHA`) + §13 (ordem de deploy, healthcheck, rollback). Evidência colhida pelo orquestrador no deploy autorizado. | P+H |

## 13. Plano de deploy Railway (projeto "grupos", ambiente production)

**Nenhuma etapa abaixo é autorização; executar somente com ordem expressa do usuário (política de continuidade §5). Dump do banco antes de cada deploy é responsabilidade do orquestrador.**

1. **Banco:** criar serviço **PostgreSQL** no projeto/ambiente production; a Railway expõe a URL privada — referenciá-la **por nome** (`DATABASE_URL`) na API. Backups/retention do banco ficam no plano Railway — política de dump do orquestrador por cima.
2. **API:** criar serviço de aplicação a partir do repositório GitHub `devpabj-glitch/sendflow-rebuild`, branch `main`, **root directory `/api`**, RAILPACK Node; build `npm install && npm run build` (tsc); start `npm run migrate:up && npm run start` (migração idempotente no boot — single-replica, exclusão pela UNIQUE de `migrations`; bind `0.0.0.0:$PORT`).
3. **Variáveis da API (nomes):** `NODE_ENV`, `DATABASE_URL` (ref. privada ao banco), `SSL_REQUIRED` (se aplicável), `WEB_ORIGIN` (origem exata do front), `SESSION_TTL_HOURS`, `AUTH_RATE_MAX`, `AUTH_RATE_WINDOW_MS`, `AUTH_RATE_BLOCK_MS`, `LOG_LEVEL`. As novas envs de rate limit do register/login por IP (§10: `AUTH_REGISTER_*`, `AUTH_LOGIN_IP_*`) são **opcionais** — todas têm defaults. `REVISION`: usar a automática `RAILWAY_GIT_COMMIT_SHA` (ou injetar `REVISION` no pipeline do orquestrador).
4. **Healthcheck do serviço:** HTTP `GET /api/v1/health`, critério 200 (db "up"), janela e retry padrão Railway.
5. **Domínio público da API:** gerar domínio `*.up.railway.app` do serviço API (nome exato decidido na execução).
6. **Front:** serviço `sendflow-rebuild` existente recebe a variável de build `VITE_API_URL` (URL pública da API) e é redeployado **depois** da API responder 200 no healthcheck — parte da A2.
7. **Verificação pós-deploy (REL-01):** deployment terminal SUCCESS; `GET /api/v1/health` público → 200 com `revision` == SHA do commit implantado; smoke autenticado com conta de teste criada pelo fluxo seguro do orquestrador (registro → me → logout → me 401); nada de seed demo.
8. **Rollback:** redeployar o deployment anterior pelo Railway (build/imagem do deployment são preservados pelo Railway); se o rollback exigir schema, seguir §7 (dump → `down` → verificação). Front pode ser revertido independentemente (só aponta para `VITE_API_URL`).
9. Ordem resumida: **banco → API (com migração) → healthcheck 200 → front com `VITE_API_URL` → verificação REL-01.**

## 14. Riscos e limitações declaradas

1. **pg-mem ≠ PostgreSQL real:** cobertura de testes offline não substitui o motor real; mitigação: DDL conservador + smoke em banco real no gate de deploy autorizado (§13.7).
2. **PER-01 parcial:** reinício real de processo não é provável offline (memória); evidência H fica para o deploy.
3. **TEN-01 parcial nesta fatia:** teste cruzado HTTP com IDs de recursos só na fatia 2 (aqui não há endpoints com ID); guard e sessão cruzada testados agora.
4. **Rate limit em memória:** zera no restart; por instância (vira incorreto com >1 réplica — configurado 1 réplica; revisar se escalar).
5. **Sem recuperação de senha / verificação de e-mail:** senha perdida = conta inacessível até fatia futura com infra de e-mail (que exige autorização específica — envio externo). Risco operacional declarado.
6. **`AUTH_EMAIL_TAKEN` (409) revela existência de e-mail** no registro: tradeoff para preservar UX do contrato atual do front; conversível para anti-enumeração por decisão do dono.
7. **CSRF:** `SameSite=None` (D2) remove a proteção same-site do cookie; mitigação restante = CORS restrito por origens exatas com `credentials` + endpoints mutadores só POST + JSON only; sem token CSRF dedicado nesta fatia (superfície mínima: register/login/logout); revisitar quando as mutações de produto chegarem.
8. **Cookie `SameSite=None` exige `Secure`:** já sempre emitido assim (D2) — o par só é aceito pelo navegador sobre HTTPS (produção) e em localhost pelos navegadores modernos (via proxy Vite o tráfego é same-origin). Sem atributo `Domain`; prefixo `__Host-` segue viável no futuro.
9. **Migração no boot:** janela curta no início do deploy; aceitável com 1 réplica e migração transacional; alternativa (passo de migração separado pelo orquestrador) documentada no runner.
10. **Limpeza de sessões expiradas é preguiçosa** (sem cron; purge best-effort no login): tabela pode crescer até a próxima fatia de limpeza — declarado.
11. **Usuário fixo do front:** enquanto a A2 não rewiring, o seed de `app/src/auth.ts` precisa ser removido no mesmo passo coordenado (§1.1.6); ninguém deve usar aquela credencial (risco já registrado em 03 §3).
12. **Repositório público:** contrato e código não contêm valores de variáveis; `.env` fora do VCS; logs sem PII/senha/token (ENG-09).
13. **Compatibilidade da senha mínima 8 (R2(iii)):** usuários registrados no auth local legado com senha de 4–7 caracteres **não poderão** usar essa senha na API quando o front for rewiring (o localStorage nunca foi fonte da API; não há migração de credencial). Re-registro com senha ≥ 8 será necessário; a A2/orquestrador devem comunicar. O antigo mínimo 4 deixa de existir junto com o auth local (D1).
14. **Rate limit por `(e-mail|IP)` com `trustProxy`:** atrás do proxy Railway o IP vem de `X-Forwarded-For`; o proxy do provedor sobrescreve o header. Correção pós-auditoria A3: `trustProxy: 1` — o edge do Railway é o **único hop confiável** (antes: `true`, que confiava em qualquer cadeia); revalidar se a topologia mudar.

---

**Data:** 08/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/foundation` · **Status:** implementado sob as decisões do coordenador (§0); auditoria A3 aprovou para merge com correções — correções aplicadas (§16).

## 15. Pendências que dependem de decisão do dono

1. ~~Valores default do limitador de login e TTL de sessão~~ — **DECIDIDO em D1** (5/300 s/900 s; 72 h). Registrado como contrato técnico novo.
2. ~~Política mínima de senha (8 × preservar 4)~~ — **DECIDIDO em D1**: mínimo 8 é contrato novo da API; o antigo auth local (mínimo 4) deixa de existir junto com o próprio auth local. Compatibilidade registrada em §14.13.
3. ~~`AUTH_EMAIL_TAKEN` 409 × anti-enumeração~~ — **DECIDIDO em D1**: preserva 409 (contrato vigente); migração para anti-enumeração continua possível por decisão futura (§14.6).
4. **Recuperação de senha / verificação de e-mail** — exige infra de envio externo (bloqueado sem autorização e sem decisão).
5. **Multi-usuário por organização / papéis** (DEC-21) — fora desta fatia; schema já nasce com `users.org_id` para não travar a evolução. **Ciência registrada (Recomendação 1 do parecer):** e-mail único **global** é contrato técnico novo desta fatia; DEC-21 futura (multi-usuário por org) pode exigir revisão via migração. **Ciência registrada (Recomendação 2):** login automático no registro (201 + cookie) é comportamento **NOVO** — o front legado não abre sessão no registro; a A2 não deve esperar o comportamento antigo.
6. **Domínio público final da API e do front** (afeta `WEB_ORIGIN`/`VITE_API_URL` — nomes já reservados).
7. **Autorização expressa de deploy/provisionamento** — este plano não é autorização (política de continuidade §5); por D4, provisioning/deploy/git são do orquestrador.

## 16. Correções pós-auditoria A3 (08/11/2026)

Pacote aplicado em `a1/foundation` após a A3 aprovar a Fatia 1 para merge **com correções**. Nove mudanças, cada uma referida ao achado da auditoria:

1. **trustProxy** — `true` → `1` em `app.ts`: o edge do Railway é o único hop confiável; revalidar se a topologia mudar (§14.14).
2. **timeouts** — pool real do pg ganha `connectionTimeoutMillis: 10000` e, por conexão, `statement_timeout: 8000` + `query_timeout: 8000` (via PoolConfig do pg; pg-mem usa adaptador próprio nos testes e não passa por estas opções) — `db/pool.ts`.
3. **migrate concorrente** — unique violation (23505) no insert da tabela de controle passa a significar "outra instância aplicou": relê o status, confirma o registro e segue (log informativo); o bootstrap não morre por corrida — `db/migrate.ts` (§7).
4. **register sem limite** — `POST /register` ganha rate limit próprio **somente por IP**: `AUTH_REGISTER_RATE_MAX`/`AUTH_REGISTER_RATE_WINDOW_MS`/`AUTH_REGISTER_BLOCK_MS` (defaults 10/300000/900000); 11ª tentativa do IP na janela → `429` — `routes/auth.ts` (§5.3).
5. **stuffing por IP** — segundo limiter agregado por IP puro para **falhas** de login: `AUTH_LOGIN_IP_RATE_MAX`/`AUTH_LOGIN_IP_RATE_WINDOW_MS` (defaults 30/300000; bloqueio = `AUTH_RATE_BLOCK_MS`); aplicado junto ao limiter e-mail|IP; `Retry-After` único = maior bloqueio ativo — `auth/rateLimit.ts`/`routes/auth.ts` (§5.3).
6. **Map unbounded** — `LoginRateLimiter` ganha varredura de expiração: a cada 64 operações de check, entradas totalmente expiradas saem do Map (cap de crescimento) — `auth/rateLimit.ts`.
7. **scryptSync** — hash/verify migram para scrypt **async** promissificado (não bloqueiam o event loop); formato do hash idêntico (`scrypt$N$r$p$salt_hex$hash_hex`) — `auth/password.ts` (§5.2).
8. **WIN1252** — comentários dos 6 arquivos `.sql` de migração convertidos para **ASCII puro** (sem acentos/setas/em-dashes): o verificador de deploy bateu num cluster WIN1252 — `src/db/migrations/*.sql`.
9. **cookie/CORS** — §5.4/§9 passam a documentar o comportamento real medido: resposta a origem não autorizada não inclui `allow-origin`; o header `Set-Cookie` pode estar presente mas é **inerte** sem `allow-origin` (o navegador descarta o cookie).

Gates desta fatia (§11): `typecheck` + `test` + `build` + `audit` — lint adiado para fatia futura com config compartilhada (nenhum script vazio criado).
