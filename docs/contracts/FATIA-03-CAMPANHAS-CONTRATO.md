# CONTRATO TÉCNICO — FATIA 3: CAMPANHAS (CRUD de campanhas da organização, módulo CMP do PM)

> **Status:** EMENDADO PELA DECISÃO D13 DO DONO (§0.2 — ordem direta, 08/11/2026; precedência máxima). O D-PEND-1 está RESOLVIDO pelo dono (enum = os 3 tipos oficiais da API sendapi). O recurso chama-se **release** (`/api/v1/releases`), não `campaign`. Este contrato agora rege o código desta fatia.
> **Repositório:** sendflow-rebuild. **Branch:** `a1/campanhas` (base `main` 743f06e). **Autor:** A1 Backend. **Data:** 08/11/2026.
> **Variáveis só por nome:** nenhum segredo, token, senha ou valor de variável aparece neste documento.
> **Fontes:** `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` e `docs/contracts/FATIA-02-CONTAS-CONTRATO.md` (herança integral), `docs/continuidade/05-MAPA-FUNCOES-182.md` §"CMP — Campanhas" (GRP-CMP-01..08), `docs/continuidade/fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md` (§4.3 CMP, §9.1 DEC-03/DEC-14, §1 regras 3/5/6/7), `docs/continuidade/fontes/qualidade/MATRIZ-VALIDACAO-SENDFLOW-INTEGRACAO-V1.md`, `app/src/pages/Campaigns.tsx`, `app/src/types.ts`, `app/src/pages/AccountsCampaigns.tsx`.

---

## 0. Herança das Fatias 1 e 2 (vale integralmente; nada é redefinido aqui)

Esta fatia **herda sem alteração** os contratos vigentes da Fundação e da Fatia 2:

- **Envelope de erro único** (Fundação §5.5): `{ "error": { "code", "message", "details"? } }`. Nenhum código novo: usa `VALIDATION_ERROR`, `AUTH_UNAUTHENTICATED`, `TENANT_FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR` já contratados.
- **Sessão/cookie** (§5.4): `grupos_session`, TTL 72 h (D1). Todos os endpoints desta fatia **exigem sessão válida** via `requireAuth`.
- **Tenant** (ENG-02): `orgId` vem **exclusivamente** da sessão; `org_id` em body/query nunca é confiado (rejeitado como campo desconhecido — F2 §3.3).
- **Migrações** (§7): runner transacional up/down/status com checksum; `NNN_nome.up.sql`/`.down.sql`; comentários SQL em ASCII puro (lição WIN1252).
- **Guard de Content-Type (D6/F2 §3.5):** TODAS as mutações desta fatia (POST criar, PATCH editar, POST archive/unarchive) exigem `Content-Type: application/json` — regra herdada, nenhum ajuste.
- **CORS** (Fundação §9), **healthcheck** (§8), **variáveis de ambiente** (§10 — **nenhuma variável nova nesta fatia**), **suíte offline pg-mem** (§11) e **gates** (REG-01: `typecheck` + `test` + `build` + `audit` em `/api`).
- Diretrizes transversais: DIR-04 (estado honesto), DIR-06 (nenhuma integração externa), ENG-01 (campanha não é conta, não é grupo, não é link), ENG-12 (este documento é o contrato prévio).
- **Padrões estabelecidos na F2 que esta fatia reutiliza:** resposta flat de recurso único (F2 §3.1), busca por substring case-insensitive com escape de curingas (F2 §3.2), paginação `page`/`pageSize` com envelope `{items,total,page,pageSize}` (F2 §3.2), ordenação fixa `created_at DESC, id DESC`, transação explícita de leitura para COUNT+SELECT no mesmo snapshot (F2 §9.1), 404 TENANT_FORBIDDEN genérico byte a byte (F2 §4), sem rate limit próprio (F2 §5).

**Mudanças em código declaradas:** registro das rotas novas em `api/src/app.ts`, adição de `api/src/routes/releases.ts`, migração `005_releases` (com a junção `release_accounts`) e testes. **Nenhum comportamento existente é alterado** (REG-01 protege via T9).

### 0.1 Decisões do coordenador PENDENTES (decidir antes da implementação; nenhuma DEC do PM §9.1 é decidida aqui)

- **D-PEND-1 — "Campanha viral" no enum de `type` (BLOQUEIA o §2).** O PM CMP-02 observa **4 opções no select** ("Campanha", "Lista", "Campanha viral", "Aleatório") e o limite diz: "'Campanha viral' sem semântica → DEC-03; **não definir regra**". Duas opções:
  - **(A) RECOMENDADA — enum COM os 4 valores** (`campanha`, `lista`, `campanha_viral`, `aleatorio`): o valor é **armazenado e devolvido sem nenhuma interpretação** — nenhum algoritmo, semântica ou comportamento de servidor deriva de `type` nesta fatia (CMP-03 é FALA; DEC-03 permanece aberta). Fundamento: (i) a opção é **observada** no select do produto de referência — o enum fechado espelha fielmente a observação, sem inventar; (ii) bloquear o valor seria **inventar política** (o PM não diz "bloquear"; diz "não definir regra" — armazenar uma string não define regra nenhuma); (iii) coerência com o precedente F2: lá `type` ficou string livre porque só **1** valor foi visto; aqui **4** valores foram vistos — enum fechado é o espelho correto da amostra em ambos os casos.
  - **(B) ALTERNATIVA — enum com 3 valores (viral bloqueado):** POST/PATCH com `type='campanha_viral'` → `400 VALIDATION_ERROR`. Exigiria justificativa de produto ("não aceitar o que a referência aceita") que nenhuma fonte amarra; fica registrada como opção legítima do coordenador.
  - **Custo da troca hoje: zero** (decisão antes de aplicar a migração: muda o CHECK do §2, a validação do §3.3 e um caso do T2; mais nenhum ponto do contrato é afetado). O restante deste documento assume **(A)** e marca os pontos afetados.
- **D-PEND-2 — Ratificar os defaults técnicos provisórios (DEC-12 segue aberta):** `name` 1..120 pós-trim; `type` obrigatório no POST (sem default inventado — §3.3); `page` ≥ 1 default 1; `pageSize` 1..100 default 20; `search` ≤ 120. Todos espelham F2 §3.3; o coordenador ratifica ou sobrescreve. **Não bloqueia.**
- **D-PEND-3 — Ratificar a AUSÊNCIA do endpoint de arquivar em massa** (§3.5: front itera `POST /:id/archive` por id). Reversível a qualquer momento por contrato adicional. **Não bloqueia.**
- **D-PEND-4 — Ratificar a ausência de unique `(org_id, lower(name))`** (§2.1.2, mesma justificativa F2 §2.1.1). **Não bloqueia.**

> **RESOLUÇÃO REGISTRADA (08/11/2026):** D-PEND-1..4 foram todos decididos pelo dono via **D13 (§0.2)** — que também renomeia o recurso, troca o enum, troca `status` por `archived` boolean e acrescenta `projectId`/`accountIds`. Os textos de §0.1 permanecem apenas como registro histórico da análise; onde §0.1 e §0.2 conflitam, **§0.2 vence**.

### 0.2 Decisão D13 do dono (ordem direta — precedência máxima; aplica-se a todo o documento; em conflito com qualquer seção, D13 vence)

Decisão do dono (08/11/2026): seguir exatamente a API original SendFlow (fonte: documentação oficial sendapi). Emenda o parecer A4 e resolve o D-PEND-1:

- **Endpoints:** `POST /api/v1/releases` e `GET /api/v1/releases` (**releases**, NÃO campaigns; o prefixo `/api/v1` é nosso).
- **Tipos EXATOS (enum fechado, só estes 3):** `'WhatsRelease'`, `'WhatsList'`, `'WhatsViralCampaign'`. **PROIBIDO** inventar "Aleatório"/`'aleatorio'` ou qualquer outro valor.
- **Campos do recurso:** `name` (string), `type` (string obrigatória, um dos 3), `projectId` (string, **OPCIONAL** — ainda sem tabela de projetos; armazenar como `text NULL`, sem FK, declarando que a fatia PRJ adicionará validação), `archived` (boolean, default `false` — **SUBSTITUI** o status ativa/arquivada), `accountIds` (array de IDs de contas associadas — persistir em tabela de junção; validar que TODOS existem e pertencem à MESMA org do usuário; duplicatas no array são deduplicadas com semântica de conjunto — decisão técnica registrada).
- **Regras:** POST /releases cria com name+type (+projectId?/accountIds? opcionais); GET /releases retorna a lista DO USUÁRIO AUTENTICADO (tenant); SEM algoritmo de distribuição; SEM arquivamento em massa; SEM unique no nome.
- **Aceitação:** type válido → cria e aparece na lista; type inválido/ausente → 400; testes verdes; build limpo.

**Decisões anteriores que seguem vigentes:** D5 (sem DELETE), D6 (content-type json em mutantes, guard preParsing), D10 (sem massa), D11 (sem unique), D12 (archive/unarchive idempotentes como AÇÕES `POST /:id/archive` e `/:id/unarchive` que setam `archived=true/false` — mantidos, espelhando o boolean do original).

---

## 1. IDs do PM — cobertos e pulados

| ID do PM | Requisito (síntese literal do mapa) | Situação | Motivo / base |
|---|---|---|---|
| **GRP-CMP-01** | Criar campanha via modal: Nome (obrigatório, validação bloqueia vazio) + Tipo (select). | **A CONTRATAR NESTE DOCUMENTO (backend)** | `POST /api/v1/campaigns` com `name` obrigatório (trim, 1..120) e `type` obrigatório no enum de 4 valores (D-PEND-1). Modal é tela (A2); "aparece na lista" = lista + `total`. **Divergência legado×PM registrada:** o modal local (`Campaigns.tsx`) tem Nome + Status + Conta associada (sem Tipo); o PM especifica Nome + Tipo — **o PM prevalece** (o legado local não é contrato, PM §1 regra 5). O "Padrão de criação" do legado declara literalmente "novas campanhas nascem ativas, sem conta obrigatória" — ancora o default `status='ativa'` (§2) e a ausência de conta (ASC futuro). |
| **GRP-CMP-02** | Tipo com **4 opções** vistas: "Campanha", "Lista", "Campanha viral", "Aleatório". | **A CONTRATAR (parcial declarado)** | Enum fechado de 4 valores, `CHECK` no banco + validação de schema (§2/§3.3) — sujeito a **D-PEND-1**. A aceitação do PM ("as opções implementadas mapeiam para estratégias definidas") é atendida **no que é contratável hoje**: os 4 valores são aceitos e persistidos; a *estratégia* de cada um é FALA/DEC — **nenhuma semântica roda** (CMP-03). "Campanha viral" criável **sem regra** (limite literal do PM). |
| **GRP-CMP-03** | Semânticas faladas: "Campanha" enche grupos em sequência sem repor; "Lista" repõe o de menor ocupação; "Aleatório" distribui tráfego. | **PULADO (semântica)** | **FALA — "fala não é contrato"** (limite literal). Nenhum algoritmo de distribuição existe ou é especificado aqui; algoritmo real é módulo VGC/futuro. O backend nesta fatia **armazena o tipo sem interpretá-lo**. |
| **GRP-CMP-04** | Lista global com período (7/14/21/28/90) e totais Clicks, Entraram, % entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | **PULADO** | Regra de agregação e fórmulas = **DEC-14** (limite literal). O "zero legível" (aceitação PROP) até existiria sem fórmula, mas os totais exigem regra de soma por período não decidida — contratar só o zero seria meia função; **pular e registrar** (§10). |
| **GRP-CMP-05** | Abas Campanhas/Ativas/Arquivadas; ordenação; busca; grade de cards com 4 métricas; seleção múltipla e "Arquivar"; paginação; acessos "+ Campanha"/"Contas e Campanhas". | **A CONTRATAR (núcleo backend)** | Núcleo implementável: `status` persistido (`ativa`/`arquivada`) + **filtro por status na lista** (`?status=` — as 3 abas) + busca + paginação + **arquivar/desarquivar por id** como ações idempotentes (§3.4). Recorte legado aprovado (matriz R88: "escopo aprovado; arquivar por ids; filtro posterior") ampara o par status+arquivar. Seleção múltipla em massa e cards são tela (A2); métricas do card = CMP-06 (pulado). Desarquivar **não é amostrado** (LAC) mas tem amarra legada: o modal de edição local troca status Arquivada→Ativa (§3.4). |
| **GRP-CMP-06** | Card de campanha com métricas resumidas, nome truncável e status. | **PULADO (métricas)** | Quais 4 métricas exatas = **DEC-14** (limite literal). O `status` (para o rótulo do card) e o `name` já são servidos pela lista; o resto espera DEC-14. |
| **GRP-CMP-07** | Detalhe da campanha com **12 abas** (Visão geral … Ações). | **PULADO nesta fatia** | Tela de detalhe é **fatia futura** (roteiro PR #6); as abas Diagnósticos, Mensagens, Mensagens recebidas e Calendário **não têm conteúdo amostrado** (GRP-ZZZ). Nada de detalhe aqui. |
| **GRP-CMP-08** | Vínculo da campanha a projeto (dropdown) e edição de campanha. | **A CONTRATAR (parcial: edição)** | **Edição** de `name`/`type` = `PATCH /:id` (espelho do CMP-01; classe RV com edição demonstrada no legado local — botão Editar + modal). **Vínculo a projeto:** PULADO — projeto é módulo PRJ futuro (campo não existe; registrar como pendência da fatia PRJ, §10). |
| — (sem ID) | Exclusão de campanha. | **FORA (padrão D5)** | Nenhum ID CMP pede exclusão; o limite do CMP-05 registra expressamente "desarquivar/**excluir** não amostrado (LAC)". Mesma regra D5 da F2: sem amarra → sem delete; proposta futura exige decisão do dono (§10). |

**Fora de escopo declarado (não construir, mesmo que "pareça fácil"):** semânticas/algoritmos de distribuição (CMP-03/FALA), qualquer métrica ou KPI (CMP-04/06/DEC-14), vínculo campanha↔conta (`accountId` do legado = ASC futuro), vínculo campanha↔projeto (PRJ futuro), tela de detalhe e 12 abas (CMP-07), arquivar em massa (§3.5), DELETE, períodos "últimos N dias", campos de fórmula (% entrada, grupos cheios/disponíveis), exportações, "Padrão de criação" como endpoint (texto estático de tela — A2).

---

## 2. Modelo de dados — migração `005_releases` (forma final — D13 §0.2 substitui o rascunho `005_campaigns`)

Arquivos: `api/src/db/migrations/005_releases.up.sql` + `005_releases.down.sql` (comentários em ASCII puro). Convenções herdadas: UUID com `gen_random_uuid()`, `timestamptz` UTC, `updated_at` mantido pela aplicação (sem triggers), `ON DELETE RESTRICT` para `org_id` (release nunca órfã; não há endpoint de exclusão de org).

```sql
-- 005_releases.up.sql
CREATE TABLE releases (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  name        text NOT NULL,                      -- trim aplicado pela API antes de gravar
  type        text NOT NULL
              CHECK (type IN ('WhatsRelease','WhatsList','WhatsViralCampaign')),  -- D13: os 3 tipos EXATOS da API sendapi
  project_id  text NULL,                          -- D13: opcional, SEM FK - fatia PRJ adicionara validacao
  archived    boolean NOT NULL DEFAULT false,     -- D13: substitui o par ativa/arquivada; espelha o boolean do original
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX releases_org_id_idx ON releases (org_id);
CREATE INDEX releases_org_archived_idx ON releases (org_id, archived);          -- filtro ?archived= (aba arquivadas)
CREATE INDEX releases_org_name_lower_idx ON releases (org_id, lower(name));     -- pre-provisionamento (idem F2 2.1.5)

-- D13: accountIds persistem em tabela de juncao (semantica de conjunto)
CREATE TABLE release_accounts (
  release_id  uuid NOT NULL REFERENCES releases (id) ON DELETE CASCADE,
  account_id  uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  PRIMARY KEY (release_id, account_id)
);

-- 005_releases.down.sql (reversivel: join primeiro, depois indices e tabela)
ALTER TABLE release_accounts DROP CONSTRAINT IF EXISTS release_accounts_pkey;
DROP TABLE IF EXISTS release_accounts;
ALTER TABLE releases DROP CONSTRAINT IF EXISTS releases_pkey;
DROP TABLE IF EXISTS releases;
DROP INDEX IF EXISTS releases_org_id_idx;
DROP INDEX IF EXISTS releases_org_archived_idx;
DROP INDEX IF EXISTS releases_org_name_lower_idx;
```

### 2.1 Decisões técnicas (reescritas pela D13; as do rascunho pré-D13 ficam superadas)

1. **`type` enum fechado de 3 valores EXATOS** (`'WhatsRelease'`/`'WhatsList'`/`'WhatsViralCampaign'`) — D13: espelho literal da API original SendFlow. "Aleatório"/`aleatorio` NÃO existe (proibido inventar). CHECK no banco + validação de schema/handler. Ajuste futuro = migração + validação novas.
2. **SEM constraint de unicidade de nome por org** (D11 ratificado pela D13) — mesma justificativa F2 §2.1.1.
3. **`archived` boolean NOT NULL DEFAULT false** (D13) substitui o rascunho `status ativa|arquivada`. A API **nunca aceita** `archived` em body de criação/edição (campo desconhecido → 400); muda **exclusivamente** pelas ações idempotentes `POST /:id/archive`/`/:id/unarchive` (D12), que setam `true`/`false`.
4. **`project_id text NULL`, SEM FK** (D13): ainda não há tabela de projetos. Armazenado/devolvido como veio (`projectId` string ≤120); **a fatia PRJ adicionará validação de existência** — pendência registrada (§10).
5. **`release_accounts` (tabela de junção, D13):** PK composta `(release_id, account_id)` já dá a semântica de conjunto; `ON DELETE CASCADE` nos dois lados (não há DELETE de release nesta fatia — D5 — mas a FK não cria órfãs). Inserção e substituição do conjunto acontecem **na mesma transação** do recurso. **Duplicatas no array de entrada são deduplicadas** (decisão técnica registrada); a validação exige que TODOS os ids existam E pertençam à MESMA org → senão `400 VALIDATION_ERROR fields ["accountIds"]` com **mensagem genérica** (não revela quais ids nem por quê). Ordem do array na resposta: **lexicográfica** (determinística entre POST/PATCH/GET).
6. **Índices:** `(org_id, archived)` atende ao filtro da lista; `(org_id, lower(name))` é pré-provisionamento para busca por prefixo futura (não serve ao `ILIKE '%t%'` atual — ressalva herdada F2 §2.1.5); `(org_id)` base do escopo tenant.
7. **Sem colunas de métrica, período ou distribuição** (CMP-03/04/06 seguem pulados; DEC-14 aberta; sem algoritmo — D13).

---

## 3. Endpoints (todos exigem sessão válida; prefixo `/api/v1`; forma final — D13 §0.2)

Recurso novo em `api/src/routes/releases.ts`. Corpos JSON; **media type `application/json` obrigatório nas mutações (D6 herdado — F2 §3.5, sem ajustes)**; respostas de sucesso **sem** envelope de erro. Sem sessão → `401 AUTH_UNAUTHENTICATED` em todos.

### 3.1 Forma do recurso (JSON, nomes camelCase — convenção herdada)

```json
{
  "id": "uuid",
  "name": "string",
  "type": "WhatsRelease | WhatsList | WhatsViralCampaign",
  "projectId": "string | null",
  "archived": false,
  "accountIds": ["uuid"],
  "createdAt": "ISO-8601 UTC (ex.: 2026-11-08T12:00:00.000Z)",
  "updatedAt": "ISO-8601 UTC"
}
```

Sem métricas, período, link, grupo ou qualquer campo de associação além de `accountIds` (CMP-03/04/06 pulados; vínculo a contas veio pela D13). `accountIds` em ordem lexicográfica (determinística entre POST/PATCH/GET). Respostas de recurso único retornam o objeto **direto** (flat — padrão F2 §3.1).

### 3.2 Tabela de endpoints

| Método/rota | Entrada | Sucesso | Efeitos e regras |
|---|---|---|---|
| `POST /api/v1/releases` | `{name, type, projectId?, accountIds?}` | `201` + recurso | Cria com `org_id` **da sessão**; `archived:false`, `projectId:null`, `accountIds:[]` quando ausentes (D13). `accountIds` validados (existem + mesma org; dedupe) e gravados na junção **na mesma transação**. **Não** cria grupo, link, ação, sessão nem qualquer métrica (análogo CTA-03; teste T5). Nenhum algoritmo deriva de `type`. |
| `GET /api/v1/releases?search=&archived=&page=&pageSize=` | query opcional | `200 {items, total, page, pageSize}` | Escopado por org da sessão (D13: lista DO usuário autenticado). `archived`: `true` \| `false` \| **ausente = todas**. Busca: substring **case-insensitive** em `name` com curingas do termo escapados literalmente (padrão F2 §3.2). Ordenação fixa `created_at DESC, id DESC`. Cada item inclui `accountIds` (agregação por página — caminho declarado: **segunda query da transação** com `IN` sobre os ids da página; não N+1). |
| `GET /api/v1/releases/:id` | — | `200` + recurso | `:id` UUID. Da própria org; senão 404 genérico (§4). Recurso + junção lidos na mesma transação de leitura (par coerente). |
| `PATCH /api/v1/releases/:id` | `{name? \| type? \| projectId? \| accountIds?}` (≥1 campo) | `200` + recurso atualizado | **`archived` NUNCA em body** (campo desconhecido → 400; muda só pelas ações §3.4). `accountIds` **substitui o conjunto por inteiro** (semântica replace, D13) na mesma transação (delete+insert da junção). `projectId: null` explícito limpa o valor. `updated_at` sempre atualizado. |
| `POST /api/v1/releases/:id/archive` | corpo vazio ou `{}` | `200` + recurso com `archived:true` | **Ação idempotente (D12, ratificada pela D13):** repetir → `200` com o recurso. Nenhuma linha removida; só `archived`/`updated_at` mudam. |
| `POST /api/v1/releases/:id/unarchive` | corpo vazio ou `{}` | `200` + recurso com `archived:false` | **Ação idempotente (D12):** repetir → `200`; espelha o boolean `archived` do original. |
| ~~`DELETE /api/v1/releases/:id`~~ | — | — | **SEM DELETE (padrão D5):** sem amarra; proposta futura, requer decisão do dono (§10). |
| ~~`POST /api/v1/releases/archive` (massa)~~ | — | — | **FORA (D10):** front itera `POST /:id/archive` por id. |

### 3.3 Validações (defaults técnicos herdados; DEC-12 segue aberta)

| Campo/param | Regra | Erro |
|---|---|---|
| `name` (POST/PATCH) | string; **trim** antes de validar/gravar; **1..120** pós-trim; obrigatório no POST | `400 VALIDATION_ERROR` (details lista campos) |
| `type` | obrigatório no POST; opcional no PATCH; valor ∈ **{'WhatsRelease','WhatsList','WhatsViralCampaign'}** (D13 — enum fechado) | ausente/fora do enum → `400` com `fields ["type"]` |
| `projectId` | opcional (POST/PATCH); string; trim; **1..120** pós-trim; `null` explícito aceito para **limpar**; ausente = não mexe | `400` com `fields ["projectId"]` |
| `accountIds` | opcional (POST/PATCH); array de strings **UUID**; duplicatas deduplicadas (semântica de conjunto, D13); TODO id deve **existir** E pertencer à **mesma org** da sessão | não-array/elemento não-UUID/inexistente/alheio → `400 VALIDATION_ERROR fields ["accountIds"]` com **mensagem genérica** (não revela quais) |
| `search` | string opcional; trim; vazio ⇒ sem filtro; ≤120 pós-trim | `400` se exceder |
| `archived` (query) | opcional; literal `'true'` \| `'false'`; ausente ⇒ sem filtro (todas) | `400` se outro valor |
| `page` | inteiro ≥ 1; default **1** | `400` se < 1 ou não inteiro |
| `pageSize` | inteiro **1..100**; default **20** | `400` se fora da faixa (sem clamp silencioso) |
| `:id` | formato UUID | malformado → `400` (erro de formato, independente de tenant); bem-formado desconhecido/alheio → `404` genérico |
| body (POST/PATCH) | `additionalProperties: false` | campo desconhecido — inclui `org_id`, `id`, `archived`, `status`, `accountId` (singular), qualquer métrica — → `400 VALIDATION_ERROR` |

### 3.4 Arquivar/desarquivar — AÇÕES idempotentes (D12 ratificada pela D13)

`POST /:id/archive` seta `archived=true`; `POST /:id/unarchive` seta `archived=false` — espelho do **boolean** do original SendFlow (D13). Repetir a ação → `200` com o recurso no estado pedido (não há transição inválida a especificar); `updated_at` atualiza; nenhum outro campo muda. A API **nunca aceita** `archived` em body — elimina estados inconsistentes ("criar já arquivada") e mantém o modelo auditável. Corpo das ações: vazio (ausente) ou `{}` — nenhuma propriedade é lida; o header `Content-Type: application/json` **continua obrigatório** (D6 herdado, uniforme para toda mutação).

### 3.5 Arquivar em massa — FORA desta fatia (D10)

Sem política composta de erros inventada (ids alheios/inexistentes/duplicados no meio exigiria semântica que nenhuma fonte amarra); a A2 itera `POST /:id/archive` por id. Reversível por contrato adicional quando houver necessidade real demonstrada.

### 3.6 Content-Type guard (D6) — herdado sem alteração

Todas as 4 rotas mutantes (POST criar, PATCH, archive, unarchive) passam pelo mesmo guard `preParsing` da F2: media type ≠ `application/json` (parâmetros aceitos) ou header ausente → `400 VALIDATION_ERROR` antes do parser. Avaliação CSRF da F2 §3.5 permanece válida sem revisão. Teste T10/T11.

---

## 4. Regras de tenant (ENG-02) — iguais à F2, estendidas às ações

- `org_id` deriva **sempre** de `req.user.orgId`. Toda query: `WHERE org_id = $...`; as ações archive/unarchive atualizam **com condição de org no próprio UPDATE** (nunca "busca e atualiza" em dois passos sem tenant).
- `GET`/`PATCH`/`POST /:id/{archive,unarchive}` de recurso de **outra org** ou **inexistente** → `404` com corpo **TENANT_FORBIDDEN genérico, byte a byte idêntico** ao de id inexistente (não vaza existência) — conforme F2 §4.
- `POST`/`GET` lista nunca recebem `org_id` de entrada (rejeitados como campo desconhecido, §3.3).
- **Testes negativos cruzados com 2 orgs são obrigatórios** (§6, T6) — incluindo as ações por id, que são a primeira superfície de **mutação por id** do produto.

---

## 5. Rate limit

**Herda apenas a sessão** (401 sem sessão válida). **Nenhum rate limit específico para campanhas** — mesma justificativa F2 §5: mutações autenticadas, org-scoped, sem superfície de força bruta ou enumeração sensível (404 genérico). **Nenhuma variável de ambiente nova.**

---

## 6. Testes dirigidos (suíte offline, pg-mem, fixtures 2 tenants — herda helpers F1/F2)

Arquivos: `api/test/releases.test.ts` (+ extensão de `migrations.test.ts`). Todos via `fastify.inject()`, sem porta/rede/Docker; dados 100% sintéticos; fixture cria org A + dono A e org B + dono B com os dois cookies.

| # | Caso | Esperado |
|---|---|---|
| T1 | CRUD feliz com os **3 tipos oficiais** + ações: POST `{name,type}` de cada tipo → `201` com shape §3.1 (`archived:false`, `projectId:null`, `accountIds:[]`, UUID, timestamps); lista contém o item e `total` reflete; GET/:id devolve igual; PATCH `{name,type,projectId,accountIds}` → 200 refletido; archive → `200` `archived:true`; unarchive → `200` `archived:false`. **Sem DELETE (D5).** | conformidade exata de shape/status |
| T2 | Validações: `name` vazio/só espaços/121 → 400; **`type` ausente no POST → 400 fields ["type"]**; **`type='aleatorio'` → 400 (caso explícito da D13 — proibido inventar)**; `type` em minúsculas/roubado (`'whatsrelease'`) → 400; `projectId` 121 → 400; `accountIds` não-array/não-UUID/inexistente/**conta de outra org** → 400 fields ["accountIds"] com mensagem genérica; `archived` inválido na query → 400; `page=0`, `pageSize=101` → 400; PATCH `{}` → 400; campos desconhecidos no body (`archived`, `status`, `org_id`, `id`, `accountId` singular) → 400 com details; `:id` malformado → 400. | envelope Fundação em todos |
| T3 | Busca/filtro/paginação: nomes com caixa variada; `search` CI por substring (ressalva pg-mem herdada F2 §9.1); **filtro `archived`**: criar 2 não-arquivadas + 1 arquivada → `archived=false` devolve 2, `archived=true` devolve 1, ausente devolve 3, `total` = contagem filtrada em todos; página além do fim → `items: []` com `total` preservado; ordenação `created_at DESC` estável (desempate por `id`); **cada item da lista inclui `accountIds`**. | asserts nominais |
| T4 | Persistência (PER-01): após POST/PATCH/archive, re-instanciar app/reabrir Pool sobre a mesma store e reler por **oráculo independente** (query SQL direta em `releases` E `release_accounts`); valores conferem campo a campo (incl. `archived` após cada ação). | releitura ≠ própria resposta |
| T5 | **Análogo CTA-03 (teste dirigido):** criar/editar release **não gera grupo, link, ação, sessão ou métrica** — (a) conjunto de tabelas do schema idêntico ao esperado {organizations, users, sessions, migrations, accounts, releases, release_accounts}; (b) contagens de `accounts` e `sessions` inalteradas pela criação de release **sem** accountIds; (c) leitura direta: colunas da linha = nome/tipo/project_id/archived/auditoria, nada mais; (d) **dedupe**: POST com o mesmo accountId 2x → 1 linha na junção; **replace**: PATCH `accountIds:[outro]` substitui o conjunto por inteiro. | contagens batem; sem efeitos colaterais |
| T6 | Cruzado (TEN-01): release criada em A; org B faz GET/:id, PATCH, archive e unarchive com esse id → **404 TENANT_FORBIDDEN com corpo idêntico ao de UUID inexistente** (comparação byte a byte); PATCH/archive de inexistente → 404; **B referenciar conta de A em `accountIds` → 400** (não vaza existência da conta); snapshot antes/depois confirma que nada de A nem de B foi alterado pelas chamadas negativas. | isolamento leitura+escrita+ações |
| T7 | Sem sessão: 6 endpoints (POST, lista, GET/:id, PATCH, archive, unarchive) sem cookie → 401 `AUTH_UNAUTHENTICATED`. | envelope Fundação |
| T8 | Migração (MIG-01, extensão): ciclo up → status (5 aplicadas) → up idempotente → down (005) → tabelas `releases`/`release_accounts` ausentes, demais intactas → up re-aplica. | reversível |
| T9 | Regressão (REG-01): suíte integral vigente (Fundação + Contas — 50 casos na data da F2) roda sem regressão junto com a nova; gates `typecheck`/`test`/`build`/`audit` após o último diff. Ajuste aditivo declarado: lista de migrações 4→5 em `migrations.test.ts`. Nenhuma mudança em `auth.test.ts`. | sem regressão |
| T10 | **Idempotência das ações (D12):** archive em não-arquivada → 200 `archived:true`; archive de novo → 200 `archived:true` (sem 409/422, `updated_at` atualiza); unarchive em arquivada → 200 `archived:false`; unarchive de novo → 200; sequência archive→unarchive→archive termina `archived:true`; `updated_at` monotônico não-decrescente; nenhum outro campo muda (comparação campo a campo). | ações idempotentes |
| T11 | Content-Type guard (D6 herdado): POST releases com `text/plain`/`application/x-www-form-urlencoded` → 400 `VALIDATION_ERROR` (fields `content-type`); PATCH sem header → 400; **archive/unarchive com header `application/json` e corpo ausente → 200**; `application/json; charset=utf-8` → aceito. | guard uniforme nas rotas novas |

---

## 7. Mapeamento com a MATRIZ-VALIDACAO

| Critério | Como esta fatia atende | Evidência |
|---|---|---|
| **TEN-01** | Testes cruzados com 2 tenants em GET/PATCH **e ações por id** (T6), 404 genérico byte a byte, snapshot antes/depois; UPDATE das ações com tenant no predicado (§4). | L |
| **ERR-01** | Tabela entrada→esperado por endpoint (T2/T6/T7) com asserts de status/corpo/envelope herdado; nenhum código novo. | E+L |
| **PER-01** | T4: reabertura de Pool/app + oráculo independente (incl. status pós-ação). Reinício real de processo segue como evidência H em ambiente autorizado (limitação pg-mem herdada). | L |
| **UI-01** | Backend fornece os estados: vazio (`items: []`, `total: 0`), preenchido (lista com filtro de abas), erro (envelope). **Telas são da A2** — este contrato define os dados que sustentam as abas Campanhas/Ativas/Arquivadas. | L (A2) |
| **E2E-01** | Roteiro contratado: login → criar campanha → reler (lista/`:id`) → arquivar → conferir aba Arquivadas (`status=arquivada`). Evidência H colhida pelo orquestrador em ambiente autorizado pós-deploy. | H (orquestrador) |
| **REG-01** | T9: suíte integral + gates após último diff, inventário nominal e exit codes. | L |

---

## 8. Plano de rollback

- `005_releases.down.sql` dropa `release_accounts` primeiro (junção) e depois `releases` — **destrutivo por definição** (todas as releases e associações somem; sem acervo em produção hoje, mas haverá após uso real). **Sempre** dump antes; preferir **correção para frente** (migração nova) conforme Fundação §7; `down` só com ordem do orquestrador, congelamento de deploys e verificação `status` + healthcheck + smoke autenticado após.
- Nenhuma OUTRA tabela aponta FK para `releases` — o down não encontra dependências após a junção.
- Rollback do *código* independe do schema (rotas novas somem; tabela órfã sem leitores é inócua) — reverter PR sem reverter migração é seguro, idem F2 §8.

---

## 9. Riscos e limitações declaradas

1. **pg-mem ≠ PostgreSQL real** (herdado F1/F2): DDL conservador (sem triggers/functions); busca com escape default do LIKE (ressalva de `ESCAPE` herdada — F2 §9.1); lista com transação explícita de leitura em vez de `count(*) OVER()` (pg-mem não parseia `OVER`). Smoke em banco real no gate de deploy autorizado.
2. **Enum de `type` congelado por CHECK (3 valores oficiais — D13):** qualquer ajuste (novo tipo, renome, remoção) vira migração + validação novas com tratamento de dados existentes. `"Aleatório"/aleatorio` NÃO existe por ordem expressa do dono.
3. **`WhatsViralCampaign` criável sem semântica (DEC-03 — PARCIALMENTE resolvida pelo dono quanto ao conjunto de tipos):** o valor É aceito e devolvido (decisão D13), e **nada além disso** — nenhum comportamento, métrica ou distribuição existe; a SEMÂNTICA do tipo segue ABERTA (§10). A A2 não deve prometer efeito na tela (DIR-04).
4. **`archived` só muda por ação:** sem `PATCH archived`/`PATCH status` — a A2 usa os botões/ações `POST /:id/archive`/`/:id/unarchive` (idempotentes). Registro explícito para evitar expectativa errada do front.
5. **Sem arquivar em massa (D10):** a A2 faz N chamadas idempotentes — custo de rede desprezível no volume atual; revertível por contrato adicional se escalar.
6. **Homônimos possíveis** (sem unique, D11): intencional, idem F2; UI distingue por id/datas.
7. **Sem métricas em lugar nenhum:** CMP-04/06 esperam DEC-14; a lista/card da A2 não deve exibir números que o servidor não tem (DIR-04 — zero fake).
8. **Contador/abas da tela** atendidos por `total` + `archived=...`; o valor "12 por página" do legado é exemplo de tela — o backend expõe `pageSize` negociável (default 20).
9. **`projectId` sem validação de existência (D13):** string livre ≤120 até a fatia PRJ; a A2 não deve tratar como FK real.
10. **Registro pós-auditoria (code-review F3, achados baixos):**
    - **Corrida FK residual × future delete de contas:** a validação de `accountIds` (existência + mesma org) roda DENTRO da transação do POST/PATCH, mas entre o SELECT de validação e o INSERT na junção uma conta pode ser apagada por requisição concorrente — hoje inofensiva porque **não existe DELETE de conta** (D5). Quando a fatia de delete existir, capturar a violação FK **23503** no INSERT da `release_accounts` e devolver **400 `fields ["accountIds"]`** (erro genérico, mesma semântica da validação), com ROLLBACK da transação.
    - **Mudanças em código da F3 além do inventário do §"Mudanças em código declaradas" (divergências de documentação apontadas pela verificação, agora declaradas):** (i) ajuste de 1 linha em `api/src/lib/errors.ts` — fallback de `validationFields` `"?"`→`"body"` — caso alcançável apenas pelo parser escopado de releases (corpo ausente com Content-Type json), sem efeito sobre rotas de auth/accounts; (ii) ajuste aditivo em `api/test/accounts.test.ts` — conjunto de tabelas do T5 (CTA-03) 5→7, incluindo `releases`/`release_accounts` da migração 005.

## 10. Pendências que dependem de decisão

| Item | Situação |
|---|---|
| **D-PEND-1 — conjunto de tipos** | **RESOLVIDO pela D13 do dono (§0.2):** enum fechado = `WhatsRelease`/`WhatsList`/`WhatsViralCampaign` (API original). Sem "Aleatório". |
| **DEC-03** ("Campanha viral") | **PARCIALMENTE resolvida pela D13 quanto ao CONJUNTO DE TIPOS** (`WhatsViralCampaign` integra o enum por ordem do dono). A **semântica** do tipo (o que uma campanha viral FAZ) **SEGUE ABERTA** — "não definir regras" (PM §9.1); nenhum algoritmo nesta fatia. |
| **DEC-14** (fórmulas de KPIs — CMP-04/06) | **ABERTA** — pulados; zero implementável sem fórmula foi avaliado e rejeitado como meia função (§1). |
| **DEC-16** (efeito de excluir projeto sobre releases) | **ABERTA (futura)** — `project_id` hoje é `text` sem FK (D13); registrar para a fatia PRJ. |
| **Validação de `projectId` (CMP-08)** | **PENDÊNCIA DA FATIA PRJ** — D13 manda armazenar como texto sem FK; PRJ adicionará validação de existência (e decidirá FK/tabela). |
| **Vínculo release↔contas** | **RESOLVIDO pela D13 nesta fatia** — `accountIds` + tabela `release_accounts` (§2.1.5); o `accountId` singular do legado vira o conjunto `accountIds`. |
| **DELETE de release** | **Proposta futura, requer decisão do dono** — sem amarra; semântica (hard vs. cascata/soft, destino da junção) em contrato novo quando uma função especificada exigir. |
| **D-PEND-2/3/4** (defaults DEC-12; sem massa; sem unique) | **Resolvidos na prática:** D10 (sem massa) e D11 (sem unique) ratificados pela D13; defaults herdados da F2 seguem provisórios (DEC-12 aberta). |

**Nenhuma pendência bloqueia a implementação** — D13 (§0.2) decide tudo o que era bloqueante.

## 11. Notas de alinhamento para a A2 (tela de Campanhas/Releases)

- `Campaign` local (`types.ts`: `status: 'active'|'archived'`, `accountId`, `metricsByPeriod`) **não vira** semântica de servidor: o servidor fala **`archived` boolean** (D13) e **`accountIds`** (conjunto, tabela de junção); `metricsByPeriod` **não existe** na API (DEC-14 futura) — não exibir números que não vêm do servidor (DIR-04).
- Recurso/rotas: `/api/v1/releases` (D13). Modal criar/editar: `{name, type, projectId?, accountIds?}` no POST; `{name?, type?, projectId?, accountIds?}` no PATCH — **sem `archived` em body** (arquivar/desarquivar são botões/ações `POST /:id/archive`/`/:id/unarchive`, idempotentes). Rótulos do select de tipo = os 3 valores oficiais: `WhatsRelease`, `WhatsList`, `WhatsViralCampaign` (sem "Aleatório" — proibido, D13).
- Abas: todas = sem `archived`; ativas = `archived=false`; arquivadas = `archived=true`; busca/paginação → `search/archived/page/pageSize` com `{items,total,page,pageSize}` (cada item já vem com `accountIds`). O período de 90 dias e os 8 totais (CMP-04) **não têm dado** — não falsificar.
- `WhatsViralCampaign` é só um valor armazenado — nenhuma semântica/promessa na tela (DEC-03 semântica aberta).
- "Padrão de criação" e "+ Campanha"/"Contas e Campanhas"/"Buscar grupos" são navegação/texto de tela — nada de endpoint próprio.
- `seed.ts` de campanhas já é vazio — nada deixa de existir no servidor; dados locais (localStorage) **não são migrados** (idem F2).

---

**Data:** 08/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/campanhas` · **Status:** emendado pela Decisão D13 do dono (§0.2) — vigente para a implementação.
