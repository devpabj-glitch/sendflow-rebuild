# CONTRATO TÉCNICO — FATIA 2: CONTAS (CRUD de contas da organização, módulo CTA do PM)

> **Status:** APROVADO PARA IMPLEMENTAÇÃO — parecer A4 **FAVORÁVEL COM RESSALVAS** (`FATIA-02-CONTAS-PARECER.md`); R1–R3 resolvidas pelas decisões do coordenador na **§0.1**.
> **Repositório:** sendflow-rebuild. **Branch:** `a1/contas` (base `main` d4907fa). **Autor:** A1 Backend. **Data:** 08/11/2026.
> **Variáveis só por nome:** nenhum segredo, token, senha ou valor de variável aparece neste documento.
> **Fontes:** `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` (herança integral), `docs/continuidade/05-MAPA-FUNCOES-182.md` §"CTA — Contas", `docs/continuidade/fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md` (§1 regras 3/5/6/7, §2 DIR, §9.1 DEC-02), `docs/continuidade/fontes/qualidade/MATRIZ-VALIDACAO-SENDFLOW-INTEGRACAO-V1.md`, `app/src/pages/Accounts.tsx`, `app/src/types.ts`, `app/src/data/seed.ts`.

---

## 0. Herança da Fatia 1 (vale integralmente; nada é redefinido aqui)

Esta fatia **herda sem alteração** o contrato vigente da Fundação:

- **Envelope de erro único** (Fundação §5.5): toda resposta de erro é `{ "error": { "code", "message", "details"? } }`. Nenhum código novo é criado nesta fatia — apenas usa `VALIDATION_ERROR`, `AUTH_UNAUTHENTICATED`, `TENANT_FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR` já contratados.
- **Sessão/cookie** (§5.4): `grupos_session`, TTL 72 h (D1), token opaco hasheado. Os endpoints de contas **exigem sessão válida** via `requireAuth`.
- **Tenant** (§6, ENG-02): `orgId` vem **exclusivamente** da sessão; `org_id` em body/query nunca é confiado.
- **Migrações** (§7): runner transacional up/down/status com checksum; convenção `NNN_nome.up.sql`/`.down.sql`; comentários SQL em **ASCII puro** (lição WIN1252, Fundação §16.8).
- **CORS** (§9), **healthcheck** (§8), **variáveis de ambiente** (§10 — **nenhuma variável nova nesta fatia**), **estratégia de testes offline pg-mem** (§11) e **gates** (§11/REG-01: `typecheck` + `test` + `build` + `audit` em `/api`).
- Diretrizes transversais: DIR-04 (nada fake — estado honesto "não conectada"), DIR-06 (nenhuma integração Meta), ENG-01 (conta ≠ sessão/credencial ≠ IDs externos), ENG-12 (este documento é o contrato prévio exigido).

**Mudanças em código da Fundação (declaradas):** registro das rotas novas em `api/src/app.ts` e adição de `api/src/routes/accounts.ts` + migração 004 + testes; e o guard de Content-Type (D6/§3.5) aplicado **também às rotas de auth existentes** (uniformização): register/login já rejeitavam corpo não-JSON indiretamente pela validação de schema (string ≠ objeto) e passam a rejeitar com o erro explícito de media type; logout (sem schema) passa a exigir o header. REG-01 protege o restante do comportamento.

### 0.1 Decisões do coordenador aceitas (08/11/2026 — vinculam esta fatia; aplicadas ao contrato e ao código)

- **D5 — `DELETE /api/v1/accounts/:id` fica FORA da Fatia 2.** Parecer A4 R1: o endpoint não tem amarra em nenhum ID GRP-CTA-01..06 nem na tela legada (`app/src/pages/Accounts.tsx` não tem ação de excluir) — é extra sob a regra "sem extras" (PM §1 regra 6). O coordenador decidiu **remover** o endpoint deste contrato e do código: nenhum código de delete nesta fatia. **Registro: proposta futura, requer decisão do dono** — quando uma função especificada exigir exclusão, a semântica (hard delete vs. RESTRICT/409/cascata/soft-delete) volta como contrato novo; a nota que estava em §3.4 sobre revisão obrigatória na fatia ASC segue válida para essa futura proposta. §§ 3.2, 3.4, 4, 6 e 10 refletem a remoção.
- **D6 — CSRF (resolve a ressalva R2 do parecer):** a Fundação §14.7 prometeu rever o tema "quando as mutações de produto chegassem"; esta fatia as introduz. **Avaliação registrada em §3.5:** todas as rotas mutantes (POST/PATCH) — de accounts **e** de auth (register/login/logout, uniformização) — passam a exigir `Content-Type: application/json` via guard explícito (`api/src/lib/contentType.ts`): media type ≠ `application/json` (parâmetros como `charset` são aceitos), incluindo header ausente → `400 VALIDATION_ERROR`. Fundamento: `Content-Type: application/json` torna a requisição **não-simples** (spec Fetch) e **força preflight CORS**; **origem não autorizada falha no preflight → o browser não envia a requisição**. Complementam: CORS por origens exatas com `credentials`, nenhuma rota GET mutadora, cookie `SameSite=None; Secure; HttpOnly`. **Sem token CSRF nesta fatia** — decisão registrada; rever se surgirem mutações via formulários HTML ou novos content-types.
- **D7 — Correções editoriais (resolve a ressalva R3 do parecer):** rótulos "IMPLEMENTADO" da §1 trocados por **"A IMPLEMENTAR NESTE CONTRATO"** (este documento precede o código); ponteiros internos corrigidos ("§4.8" → §3.3; "(§7, caso T5)" e "(§7, caso T6)" → §6, casos T5/T6).

---

## 1. IDs do PM — cobertos e pulados

| ID do PM | Requisito (síntese literal do mapa) | Situação | Motivo / base |
|---|---|---|---|
| **GRP-CTA-01** | Criar conta via modal: Nome (obrigatório), toggle "conta espiã", Tipo (select; valor visto: WhatsApp). Nome vazio bloqueia; conta criada aparece na lista e no contador. | **A IMPLEMENTAR NESTE CONTRATO (backend)** | `POST /api/v1/accounts` com `name` obrigatório, `isSpy` flag **armazenada sem interpretação** (DEC-02 aberta — §11), `type` default `'WhatsApp'`. Modal/contador são tela (A2); o `total` da lista serve ao contador. |
| **GRP-CTA-02** | Lista de contas com avatar, indicador de status; status vem de estado real; sem integração = "não conectada", nunca "online" falso. | **A IMPLEMENTAR NESTE CONTRATO (parcial declarado)** | Lista com busca por nome + paginação; campo `connectionStatus` existe e é **sempre** `'nao_conectada'` (único valor no CHECK). **Avatar:** fora de escopo (sem fonte real de imagem; inicial/letra é decisão de tela da A2). Status real depende de provedor → resto do requisito permanece **BLOQ-EXT**. |
| **GRP-CTA-03** (DIR+PROP) | Criar/editar conta **não** cria sessão, credencial, conexão nem ID externo; conexão é etapa separada bloqueada até contrato (DIR-06). Teste: criar conta não gera sessão/ID externo. | **A IMPLEMENTAR NESTE CONTRATO (com teste dirigido)** | §3.3: a API não aceita `connectionStatus` em entrada; nenhuma tabela de sessão/conexão de conta existe; teste de contagem de tabelas/linhas obrigatório (§6, caso T5). |
| **GRP-CTA-04** | Conta associada a campanhas/agrupada em projeto; "contas ociosas" = sem campanha ativa. | **PULADO** | Associações a campanhas/projetos não existem (futuro: módulos ASC/PRJ); fórmula de ociosas = **FALA/DEC-14** (não decidir). |
| **GRP-CTA-05** | Alerta "Desconectadas nas últimas 24h" (só eventos reais de desconexão). | **PULADO** | **BLOQ-EXT** — depende de eventos reais de provedor (inexistentes). |
| **GRP-CTA-06** | Conectar número via fluxo do provedor. | **PULADO** | **BLOQ-EXT / DIR-06** — fluxo QR/ES real bloqueado sem contrato, conta e autorização específica. |

**Fora de escopo declarado (não construir, mesmo que "pareça fácil"):** tudo citado acima (CTA-04/05/06, semântica de "conta espiã" — DEC-02, associações a campanhas/projetos — ASC/PRJ futuros, avatar real, qualquer integração externa), **e também:** telefone/número da conta (campo não existe no servidor — número é artefato de conexão com provedor, BLOQ-EXT), exclusão em massa, arquivamento de conta, contador de ociosas, campos de métrica, upload, webhooks, papéis por conta (DEC-04), limites por plano (EXC-01).

---

## 2. Modelo de dados — migração `004_accounts`

Arquivos: `api/src/db/migrations/004_accounts.up.sql` + `004_accounts.down.sql` (comentários em ASCII puro). Convenções herdadas: UUID com `gen_random_uuid()`, `timestamptz` UTC, `updated_at` mantido pela aplicação (sem triggers), `ON DELETE RESTRICT` para `org_id` (conta nunca órfã; não há endpoint de exclusão de org).

```sql
-- 004_accounts.up.sql
CREATE TABLE accounts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id            uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  name              text NOT NULL,                       -- trim aplicado pela API antes de gravar
  type              text NOT NULL DEFAULT 'WhatsApp',    -- string livre; sem enum (ver 2.1)
  is_spy            boolean NOT NULL DEFAULT false,      -- flag SEM interpretacao (DEC-02 aberta)
  connection_status text NOT NULL DEFAULT 'nao_conectada'
                    CHECK (connection_status IN ('nao_conectada')),  -- unico valor honesto ate integracao (CTA-03/BLOQ-EXT)
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX accounts_org_id_idx ON accounts (org_id);
CREATE INDEX accounts_org_name_lower_idx ON accounts (org_id, lower(name));  -- pre-provisionamento p/ busca por PREFIXO futura (nao serve ao ILIKE '%t%' atual - ver 2.1.5)

-- 004_accounts.down.sql
DROP TABLE IF EXISTS accounts;
```

### 2.1 Decisões técnicas novas (registradas — PM §1 regra 6; nenhuma DEC do §9.1 é decidida aqui)

1. **SEM constraint de unicidade de nome por org** (`org_id + lower(name)` livre para duplicar). **Justificativa:** o PM não demonstra unicidade (nenhuma tela/erro de duplicata amostrado; CTA-01 só exige nome obrigatório); impor unicidade seria inventar política. Homônimos são inofensivos no CRUD atual. Se o dono decidir unicidade, entra como **migração futura** (com tratamento de dados existentes) — não como edição da 004. **Pendente de ratificação do coordenador (não bloqueia).**
2. **`type` string livre (trim, 1..60), default `'WhatsApp'`** — o PM mostra um select com **um único valor visto** ("WhatsApp"); criar enum fechado seria inventar lista não demonstrada. O default espelha o valor observado. DEC-12/DEC futura pode fechar a lista — aí vira migração/validação nova.
3. **`is_spy` (JSON `isSpy`) boolean, default `false`, armazenado sem nenhuma interpretação** — DEC-02 aberta; nenhum comportamento do servidor deriva deste flag nesta fatia.
4. **`connection_status` com CHECK de valor único** — o banco **impede** fisicamente qualquer outro estado enquanto a integração de provedor não existir; quando existir, novos valores entram por migração (decisão futura). A API **nunca aceita** este campo em entrada (§3.3).
5. Índice composto `(org_id, lower(name))` **NÃO serve à busca implementada nesta fatia** (correção pós-auditoria, achado #3 do code-review): a busca é por *contains* — `name ILIKE '%termo%'` com curinga **à esquerda** — e um índice B-tree não atende padrão com prefixo curingado (varredura completa da org em ambos os casos; o índice simples de `org_id` já delimita essa varredura ao tenant). O índice existe como **pré-provisionamento para uma futura busca por prefixo** (`lower(name) LIKE 'termo%'`, sargable sobre a expressão indexada), caso o dono a especifique — se isso não acontecer, ele deve ser revertido por migração futura em vez de permanecer sem leitor. **Custo de escrita declarado:** uma manutenção extra de índice por INSERT em `accounts` e por UPDATE que toque `name`/`org_id` — desprezível no volume atual (contas por org na casa de dezenas), medível apenas em escala; reavaliar com evidência. Ordenação (`created_at DESC, id DESC`) usa sort — volume por org é pequeno; reavaliar só com evidência de escala.

---

## 3. Endpoints (todos exigem sessão válida; prefixo `/api/v1`)

Recurso novo em `api/src/routes/accounts.ts`. Corpos JSON; **media type `application/json` obrigatório nas mutações (D6 — §3.5)**; respostas de sucesso **sem** envelope de erro (herança). Sem sessão → `401 AUTH_UNAUTHENTICATED` em todos (fundação §5.5).

### 3.1 Forma do recurso (JSON, nomes camelCase — convenção da Fundação)

```json
{
  "id": "uuid",
  "name": "string",
  "type": "string",
  "isSpy": false,
  "connectionStatus": "nao_conectada",
  "createdAt": "ISO-8601 UTC (ex.: 2026-11-08T12:00:00.000Z)",
  "updatedAt": "ISO-8601 UTC"
}
```

Sem qualquer ID externo, telefone, número ou credencial (CTA-03). Respostas de recurso único retornam o objeto **direto** (flat) — a Fundação envolve `register`/`me` em chaves porque devolvem 2 entidades; aqui é 1 só. **Contrato técnico novo registrado.**

### 3.2 Tabela de endpoints

| Método/rota | Entrada | Sucesso | Efeitos e regras |
|---|---|---|---|
| `POST /api/v1/accounts` | `{name, type?, isSpy?}` | `201` + recurso | Cria a conta com `org_id` **da sessão**. **Não** cria sessão, credencial, conexão nem ID externo (CTA-03). `connectionStatus` nasce `'nao_conectada'`. |
| `GET /api/v1/accounts?search=&page=&pageSize=` | query opcional | `200 {items: [recurso], total, page, pageSize}` | Escopado por org da sessão. Busca: substring **case-insensitive** em `name` ( `%`/`_`/`\` do termo escapados literalmente — curingas não são sintaxe de usuário). Ordenação fixa `created_at DESC, id DESC`. |
| `GET /api/v1/accounts/:id` | — | `200` + recurso | `:id` UUID. Da própria org; senão 404 genérico (§4). |
| `PATCH /api/v1/accounts/:id` | `{name? \| type? \| isSpy?}` (≥1 campo) | `200` + recurso atualizado | Atualiza só campos fornecidos; `updated_at` sempre atualizado. **Não** toca conexão (CTA-03). |
| ~~`DELETE /api/v1/accounts/:id`~~ | — | — | **REMOVIDO por D5 (§0.1):** sem amarra no PM; nenhum código de delete nesta fatia. Proposta futura, requer decisão do dono (§3.4). |

### 3.3 Validações (defaults de contrato técnico novo — registrados; DEC-12 permanece aberta e pode sobrescrever por decisão do coordenador)

| Campo/param | Regra | Erro |
|---|---|---|
| `name` (POST/PATCH) | string; **trim** antes de validar/gravar; comprimento **1..120** pós-trim; obrigatório no POST | `400 VALIDATION_ERROR` (details lista campos) |
| `type` | string; trim; **1..60** pós-trim; opcional; default `'WhatsApp'` (só no POST) | idem |
| `isSpy` | boolean opcional; default `false` | idem (tipo errado → 400) |
| `search` | string opcional; trim; vazio ⇒ sem filtro; ≤120 pós-trim | `400` se exceder |
| `page` | inteiro ≥ 1; default **1** | `400` se < 1 ou não inteiro |
| `pageSize` | inteiro **1..100**; default **20** | `400` se fora da faixa (sem clamp silencioso) |
| `:id` | formato UUID | malformado → `400 VALIDATION_ERROR` (erro de formato, independente de tenant); bem-formado desconhecido/alheio → `404` genérico |
| body | `additionalProperties: false` | campo desconhecido (inclui `org_id`, `id`, `connectionStatus`, `phone`) → `400 VALIDATION_ERROR` |

**Nota sobre `org_id` no body:** a Fundação (§6) diz "ignorado, nunca confiado". Aqui a enforcement é **mais estrita**: rejeição 400 em vez de ignoração — o valor nunca é confiado de qualquer forma; a rejeição explícita elimina ambiguidade para a A2. Registrado como contrato técnico novo desta fatia; não enfraquece ENG-02.

### 3.4 Exclusão — FORA da Fatia 2 (D5)

`DELETE /api/v1/accounts/:id` **não existe nesta fatia** (decisão D5, §0.1): nenhum ID CTA pede exclusão e a tela legada não a exporta — incluir seria extra proibido. **Registro: proposta futura, requer decisão do dono.** Quando uma função especificada exigir exclusão, a semântica deve ser decidida em contrato novo — sem associações hoje, hard delete seria a semântica mínima, mas com associações conta↔campanha (fatia ASC futura) a escolha entre RESTRICT com 409, cascata ou soft-delete **é decisão futura** (DEC-16 é análoga e segue aberta); migrar hard→RESTRICT depois de dados reais criados é migração sensível.

### 3.5 Content-Type obrigatório nas mutações — avaliação CSRF (D6, resolve R2)

- **Regra:** todas as rotas mutantes desta fatia e da Fundação (POST/PATCH: accounts criar/editar; auth register/login/logout) exigem `Content-Type: application/json` — media type exato, com parâmetros aceitos (ex.: `application/json; charset=utf-8`). Qualquer outro media type (`text/plain`, `application/x-www-form-urlencoded`, `multipart/*`, …) **ou header ausente** → `400 VALIDATION_ERROR` (details `fields: ["content-type"]`), rejeitado **antes do parser de content-type do Fastify** — nunca o 415 do parser (correção pós-auditoria, achado #2). Guard explícito em `api/src/lib/contentType.ts`, aplicado como hook `preParsing` (única fase de rota anterior ao parser); `requireAuth` permanece em `preValidation` — para media type não-json o 400 precede o 401 (precedência que o 415 do parser já tinha de fato), e com json válido o 401 segue vindo primeiro.
- **Avaliação CSRF (Fundação §14.7 retomada):** na especificação Fetch, uma requisição com `Content-Type: application/json` **não é "simple request"** — o browser **força preflight CORS** (`OPTIONS`) antes de enviá-la; **origem não autorizada falha no preflight e a requisição de fato nunca é enviada**. Um site atacante não consegue produzir POST/PATCH com esse media type sem passar pelo preflight (formulários HTML e `fetch` simples só geram `text/plain`, `application/x-www-form-urlencoded` e `multipart/form-data` — todos rejeitados pelo guard). Complementos vigentes: CORS por origens exatas (sem wildcard) com `credentials`, nenhuma rota GET mutadora, cookie `SameSite=None; Secure; HttpOnly` (não legível por script). **Conclusão: mitigado; sem token CSRF nesta fatia.** Rever se forem aceitos novos content-types, mutações via formulários ou navegadores legados sem preflight.

---

## 4. Regras de tenant (ENG-02) — iguais à Fundação, agora com ID de recurso

- `org_id` deriva **sempre** de `req.user.orgId` (sessão). Toda query: `WHERE org_id = $...`.
- `GET`/`PATCH /:id` de recurso de **outra org** ou **inexistente** → `404` com corpo **TENANT_FORBIDDEN genérico, byte a byte idêntico** ao de id inexistente (não vaza existência) — conforme Fundação §5.5.
- `POST`/`GET` lista nunca recebem `org_id` de entrada (rejeitados como campo desconhecido, §3.3).
- **Testes negativos cruzados com 2 orgs são obrigatórios** (§6, caso T6) — é a primeira fatia com endpoint por ID; a limitação declarada na Fundação §14.3 (TEN-01 parcial) **é encerrada aqui**.

---

## 5. Rate limit

**Herda apenas a sessão** (401 sem sessão válida; bloqueios de login/register da Fundação continuam protegendo a superfície de auth). **Nenhum rate limit específico para contas** — justificativa: mutações autenticadas, org-scoped, sem superfície de força bruta ou enumeração sensível (TENANT_FORBIDDEN já é genérico); adicionar limitador aqui seria política nova não exigida. Registrado; se o coordenador quiser, entra como env nomeada em fatia futura. **Nenhuma variável de ambiente nova.**

---

## 6. Testes dirigidos (suíte offline, pg-mem, fixtures 2 tenants — herda helpers da Fundação §11)

Arquivos: `api/test/accounts.test.ts` (+ extensão de `migrations.test.ts`). Todos via `fastify.inject()`, sem porta/rede/Docker; dados 100% sintéticos; fixture cria org A + dono A e org B + dono B com os dois cookies.

| # | Caso | Esperado |
|---|---|---|
| T1 | CRUD feliz: POST (só `name`) → 201 com shape §3.1 (`type='WhatsApp'`, `isSpy=false`, `connectionStatus='nao_conectada'`, UUID, timestamps); lista contém o item e `total` reflete; GET/:id devolve igual; PATCH `{name,type,isSpy}` → 200 refletido (só campos enviados). **Sem DELETE (D5).** | conformidade exata de shape/status |
| T2 | Validações: `name` vazio/só espaços → 400; 121 chars → 400; `type` vazio → 400; `page=0`, `pageSize=0`, `pageSize=101` → 400; body `{}` no PATCH → 400 (≥1 campo); campos desconhecidos (`connectionStatus`, `org_id`, `phone`) → 400 com details. | envelope Fundação em todos |
| T3 | Busca/paginação: nomes com caixa variada; `search` case-insensitive por substring; termo contendo `%`/`_` tratado literal (**ressalva pg-mem**: literalidade de curinga no TERMO só é demonstrável contra PostgreSQL real — o pg-mem não parseia `ESCAPE` e trata `\` como literal; o código escapa `\`→`\\`, `%`→`\%`, `_`→`\_` com o escape default do LIKE, correto no PG real; na suíte offline asserta-se que nomes **contendo** curingas são encontráveis por termo limpo, e que termo com curinga não quebra); `total` = contagem filtrada; página além do fim → `items: []` com `total` preservado; ordenação `created_at DESC` estável (desempate por `id`). | asserts nominais |
| T4 | Persistência (PER-01): após POST, re-instanciar app/reabrir Pool sobre a mesma store e reler por **oráculo independente** (query SQL direta); valores conferem campo a campo. | releitura ≠ própria resposta |
| T5 | **CTA-03 (teste dirigido do PM):** antes/depois de POST e PATCH — (a) contagem de linhas de `sessions` inalterada; (b) lista de tabelas do schema **idêntica** ao conjunto esperado {organizations, users, sessions, migrations, accounts} (nenhuma tabela de conexão/credencial criada); (c) leitura direta: `connection_status='nao_conectada'`; (d) POST/PATCH com `connectionStatus` no body → 400. | contagens batem; estado honesto |
| T6 | Cruzado (TEN-01): conta criada em A; org B faz GET/:id e PATCH com esse id → **404 TENANT_FORBIDDEN com corpo idêntico ao de UUID inexistente** (comparação byte a byte); PATCH de inexistente → 404; `:id` malformado → 400; snapshot antes/depois das tabelas confirma que nada de B foi alterado. **Sem DELETE (D5).** | isolamento leitura+escrita |
| T7 | Sem sessão: 4 endpoints (POST, lista, GET/:id, PATCH) sem cookie → 401 `AUTH_UNAUTHENTICATED`. | envelope Fundação |
| T8 | Migração (MIG-01, extensão): ciclo up → status (4 aplicadas) → up idempotente → down (004) → tabela `accounts` ausente, demais intactas → up re-aplica. | reversível |
| T9 | Regressão (REG-01): suíte integral da Fundação (health, auth, ratelimit, migrations, tenant) roda sem regressão junto com a nova; gates `typecheck`/`test`/`build`/`audit` após o último diff, com inventário e exit codes. Ajustes aditivos declarados e necessários: lista de migrações 3→4 em `migrations.test.ts` (previsto no T8) e header `Content-Type` nas 2 chamadas de logout em `auth.test.ts` (efeito do guard D6 uniforme). | sem regressão |
| T10 | Content-Type guard (D6/§3.5): POST accounts com `text/plain` → 400 `VALIDATION_ERROR` (fields `content-type`); POST sem header → 400; `application/json; charset=utf-8` → aceito; login com `text/plain` → 400 (uniformização auth); preflight `OPTIONS` de origem autorizada → 204 com `Access-Control-Allow-Origin` da origem exata (e origem não autorizada **sem** ACAO). | guard uniforme |

---

## 7. Mapeamento com a MATRIZ-VALIDACAO

| Critério | Como esta fatia atende | Evidência |
|---|---|---|
| **TEN-01** | **Agora COMPLETA com ID de recurso**: testes cruzados HTTP com 2 tenants em GET/PATCH por id (T6), 404 genérico sem vazar existência, snapshot antes/depois. Encerra a limitação declarada na Fundação §14.3. | L |
| **ERR-01** | Tabela entrada→esperado por endpoint (T2/T6/T7) com asserts de status/corpo/envelope herdado; nenhum código novo. | E+L |
| **PER-01** | T4: reabertura de Pool/app + oráculo independente. Reinício real de processo segue sendo evidência H em ambiente autorizado (limitação pg-mem herdada). | L |
| **UI-01** | Backend fornece os estados: vazio (`items: []`, `total: 0`), preenchido (lista), erro (envelope). **Telas são da A2** — este contrato define os dados que sustentam vazio/preenchido/erro da tela de Contas. | L (A2) |
| **E2E-01** | Roteiro contratado: login → criar conta → reler (GET lista/`:id`) → conferir persistência. Evidência H colhida pelo orquestrador em ambiente autorizado pós-deploy. | H (orquestrador) |
| **REG-01** | T9: suíte integral + gates após último diff, inventário nominal e exit codes. | L |

---

## 8. Plano de rollback

- `004_accounts.down.sql` = `DROP TABLE IF EXISTS accounts` — **destrutivo por definição** (todas as contas da tabela somem; não há acervo em produção hoje, mas o será após uso real). **Sempre** dump antes; preferir **correção para frente** (migração nova) conforme Fundação §7; `down` só com ordem do orquestrador, congelamento de deploys e verificação `status` + healthcheck + smoke autenticado após.
- Rollback do *código* independe do schema (rotas novas somem, tabela pode ficar vazia e inócua) — declarar que reverter PR sem reverter migração é seguro (tabela órfã sem leitores).

---

## 9. Riscos e limitações declaradas

1. **pg-mem ≠ PostgreSQL real** (herdado): DDL conservador (sem triggers/functions) mitiga; smoke em banco real no gate de deploy autorizado. **Novo nesta fatia:** o pg-mem não parseia a cláusula `ESCAPE` e trata `\` como literal no padrão do LIKE — a busca usa o **escape default** do LIKE/ILIKE do PostgreSQL real (`\%`, `\_`, `\\`, sem cláusula `ESCAPE`, termo sempre por parâmetro). Para termos **sem** `\`/`%`/`_` o comportamento é idêntico nos dois motores; a literalidade de curingas no termo (contrato §3.2) fica demonstrável apenas contra PostgreSQL real (evidência H no deploy; ver T3). **Achado #1 (adicionado pós-auditoria):** o pg-mem também não parseia a cláusula `OVER` (window functions) nem `SET TRANSACTION` em sentença separada — por isso a lista usa **transação explícita de leitura** (`BEGIN ISOLATION LEVEL REPEATABLE READ` em cliente dedicado do pool) em vez de `count(*) OVER()`: um único snapshot para COUNT e SELECT, sintaxe válida nos dois motores; contra PostgreSQL real a window function permanece opção futura (menos um round-trip) se o pg-mem sair da suíte.
2. **Sem unicidade de nome por org** (decisão §2.1.1): homônimos possíveis — intencional; UI lista por id, não por nome. Sujeito a ratificação.
3. **`type` string livre**: valores inconsistentes são possíveis (sem enum porque lista fechada não foi demonstrada — não inventar). Fechamento futuro = migração/validação nova.
4. **`isSpy` sem semântica** (DEC-02): a UI (A2) pode exibir o rótulo do toggle, mas **nenhum** comportamento de servidor deriva do flag; se a DEC-02 atribuir semântica, pode exigir mudança de tipo/validação.
5. **Exclusão de conta**: fora da Fatia 2 por **D5** (§3.4) — proposta futura que **requer decisão do dono**; a semântica (hard vs. RESTRICT/cascata/soft-delete) deve ser decidida antes de qualquer implementação, idealmente antes da fatia ASC criar associações.
6. **Busca só por `name`**: o modelo local legado buscava `name + phone` (`Accounts.tsx`), mas `phone` **não existe** no servidor (número é artefato de provedor — BLOQ-EXT); a busca da API é só por nome. A A2 não deve esperar busca por telefone.
7. **`connection_status` com valor único**: qualquer exibição de "online/conectada" na tela seria fake (DIR-04); o contrato **impede** no banco e na API — a tela honesta mostra "Não conectada" para todas.
8. **Contador do CTA-01** ("5→6" do vídeo): atendido pelo `total` da lista; valor do vídeo é exemplo, não regra.

## 10. Pendências que dependem de decisão (nenhuma DEC do PM §9.1 é decidida aqui)

| Item | Situação |
|---|---|
| **DELETE de conta** (removido por D5) | **Proposta futura, requer decisão do dono** — sem amarra no PM (parecer R1); nenhuma ação pedida agora. |
| **DEC-02** (semântica de "conta espiã") | **ABERTA** — flag apenas armazenada/devolvida; nenhum comportamento derivado. |
| **DEC-12** (limites de campos no Grupos) | **ABERTA** — os defaults técnicos (name 1..120, type 1..60, pageSize 1..100/default 20) são **provisórios**, registrados em §3.3 para operar; o coordenador pode ratificar ou sobrescrever (vira migração/ajuste de validação). |
| **Ratificação da ausência de unique** em `(org_id, lower(name))` (§2.1.1) | Pendente de ciência do coordenador — não bloqueia implementação. |
| CTA-04 (DEC-14), CTA-05/06 (BLOQ-EXT/DPR-06), ASC/PRJ, avatar | Fora desta fatia (§1); nenhuma ação pedida agora. |

**Nenhuma pendência nova criada que bloqueie a implementação.**

## 11. Notas de alinhamento para a A2 (tela de Contas)

- `Account` local (`types.ts`: `phone`, `status: connected|disconnected|no_session`) **não vira** semântica de servidor: sem `phone`; `status` é substituído por `connectionStatus='nao_conectada'` (único estado honesto). Abas "Conectadas/Desconectadas/Sem sessão" não têm dado real que as distinga — não falsificar (DIR-04).
- Modal de criar/editar: `name` obrigatório, `type` (default WhatsApp), toggle espiã → `{name, type?, isSpy?}`; busca/paginação → `search/page/pageSize` com resposta `{items,total,page,pageSize}`.
- `seed.ts` de contas já é vazio — nada deixa de existir no servidor; os dados locais (localStorage) **não são migrados** (nenhuma decisão de migração de semântica legada — PM §1 regra 5).

---

**Data:** 08/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/contas` · **Status:** aprovado para implementação (parecer A4 + decisões do coordenador §0.1); código nesta branch.
