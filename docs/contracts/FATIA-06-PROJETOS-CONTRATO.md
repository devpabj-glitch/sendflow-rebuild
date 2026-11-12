# CONTRATO TÉCNICO — FATIA 6: PROJETOS (PRJ — pasta de cliente, vínculo de releases e contadores derivados)

> **Status:** **IMPLEMENTAÇÃO LIBERADA** — **Nota de ativação (09/11/2026, precedente F5 §0):** parecer A4 **ADERENTE** (`FATIA-06-PROJETOS-PARECER.md`) emitido e D-PENDs 1–3 **RATIFICADOS pelo dono como D19/D20/D21** (ver §0.1); toda condicional "se ratificado" desta versão fica resolvida. Emenda técnica da implementação (D20): a coluna uuid nasce como **`releases.project_uuid`** (ADD **antes** do DROP da coluna text `project_id` — sem reuso do nome na mesma transação); o down remove `project_uuid`/FK e recria `project_id text NULL` vazia; API e respostas seguem `projectId` (§3) em tudo o mais. Fatia **BACKEND-ONLY**: a tela `/whats/projects` é `Placeholder` (PM regra 1 — telas finais depois) e a A2 **não toca** em nada desta fatia (§1, §10).
> **Repositório:** sendflow-rebuild. **Branch:** `a1/projetos` (base `main` a496cc8). **Autor:** A1 Backend. **Data:** 09/11/2026.
> **Variáveis só por nome:** nenhum segredo, token, senha ou valor de variável aparece neste documento.
> **Fontes:** `docs/continuidade/05-MAPA-FUNCOES-182.md` §"PRJ — Projetos" (GRP-PRJ-01..04, L353–356) e §"GRU" (precedente de DELETE por id da D16), `docs/continuidade/fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md` (§9.1 DEC-14/DEC-16; ENT-13; FLX-10; regra 6), `docs/contracts/FATIA-03-CAMPANHAS-CONTRATO.md` (**§2.1.4 e §3** — `releases.project_id text NULL` sem FK por D13, com a pendência expressa: "a fatia PRJ adicionará validação" — este documento É essa fatia), `docs/contracts/FATIA-05-GRUPOS-CONTRATO.md` (§0 herança integral, DELETE D16, padrões de teste/matrizes), `api/src/routes/releases.ts` (validação atual `projectId` = trim 1..120 text), `api/src/db/migrations/` (001–006 vigentes), `app/src/pages/Placeholder.tsx` (tela de projetos = placeholder), matriz R88 coluna legado (PRJ: "recorte provado; exclusão do vazio e edição limitada"; `project-delete.test.ts` citado em `fontes/qualidade/AUDITORIA-INDEPENDENTE-PRJ01-R79.md` — **só matriz, nenhum código legado é contrato**).

---

## 0. Herança das Fatias 1–5 (vale integralmente; nada é redefinido aqui)

- **Envelope de erro único** (`{error:{code,message,details?}}`). Códigos de recurso vigentes: `VALIDATION_ERROR`, `AUTH_UNAUTHENTICATED`, `TENANT_FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR` (409 já existe no produto no auth como `AUTH_EMAIL_TAKEN`). **Esta fatia adiciona 1 código novo** (`PROJECT_NOT_EMPTY`, ratificado D21).
- **Sessão/cookie** `grupos_session` (TTL 72 h, D1): todos os endpoints exigem `requireAuth`.
- **Tenant ENG-02:** `orgId` vem exclusivamente da sessão; `org_id` em body/query nunca é confiado (campo desconhecido → 400).
- **Migrações** transacionais up/down/status com checksum, comentários ASCII; **D6** (Content-Type `application/json` em TODA mutação, guard `preParsing` — DELETE incluído, por uniformidade F5 §3.4); **D5** (sem DELETE de conta/release — **mantém**; o DELETE proposto aqui é o de **projeto**, com amarra própria no PM, ver D-PEND-1); **D10** (sem operação em massa); **D11** (sem unique de nome — estendida a `projects.name`); **D13** (`/releases` com `projectId` text sem FK — **pendência desta fatia**, §0.2); **D16** (precedente de DELETE por id: `204`, repetição → `404` genérico byte a byte, massa nunca — espelhado no D-PEND-1).
- Padrões reutilizados: resposta flat de recurso único (F2 §3.1), busca substring CI com curingas escapados (F2 §3.2), paginação `{items,total,page,pageSize}`, ordenação fixa `created_at DESC, id DESC`, transação de leitura para COUNT+SELECT no mesmo snapshot (F2 §9.1), **404 TENANT_FORBIDDEN genérico byte a byte** (F2 §4), validação de referência por body "existe E é da mesma org → senão 400 genérico" (padrão D13 de `accountIds`, estendido a `projectId` em releases), parser escopado (corpo ausente com CT json → `undefined`), CORS/healthcheck/env (nenhuma variável nova), suíte offline pg-mem, gates REG-01 (`typecheck`+`test`+`build`+`audit`).
- Diretrizes: DIR-04 (estado honesto, zero fake — nasce `webhookCount:0` declarado), DIR-06 (nenhuma integração externa), PM regra 6 (nada além do especificado), PM regra 1 (telas finais depois — backend-only).

**Mudanças em código declaradas (quando autorizada a implementação):** registro de rotas em `api/src/app.ts`, `api/src/routes/projects.ts`, migração `007_projects.{up,down}.sql`, `api/test/projects.test.ts`, **+ alterações DECLARADAS em `api/src/routes/releases.ts`** (validação de `projectId` passa a UUID+mesma-org, §3.3) **e em testes existentes** (`releases.test.ts` e `migrations.test.ts` — inventário nominal no T10). Fora disso, nenhum comportamento existente muda.

### 0.1 D-PENDs — RESOLVIDOS pela ratificação do dono (D19/D20/D21, 09/11/2026; parecer A4 ADERENTE)

- **D-PEND-1 — DELETE de projeto — EXCLUSÃO SÓ DE PROJETO VAZIO — RATIFICADO como D19.** `DELETE /api/v1/projects/:id`: sem releases vinculadas → `204` sem corpo (repetição → `404` genérico byte a byte, padrão D16); **com ≥1 release vinculada → `409 PROJECT_NOT_EMPTY` com corpo genérico FIXO** (não revela quantas nem quais — vazamento de contagem é dado; corpo byte a byte igual para qualquer projeto não-vazio), **projeto permanece intacto** (nenhuma coluna muda — oráculo SQL no teste T4). Delete de projeto **não-vazio fica PENDENTE da DEC-16** (destino dos itens não decidido). Amarra: GRP-PRJ-01 (OBS-M, "Excluir" destrutivo destacado — P6 40:16) + legado provado (matriz R88: "exclusão do vazio"; `project-delete.test.ts`). **Sem massa em qualquer hipótese (D10).**
- **D-PEND-2 — Migração da coluna `releases.project_id` — REMOÇÃO do `text` + coluna `uuid` nova com backfill NULL — RATIFICADO como D20.** A migração 007 (i) cria `projects`, (ii) **DROP da coluna `project_id` text (D13)**, (iii) ADD coluna uuid NULL `REFERENCES projects ON DELETE RESTRICT` (na implementação: `project_uuid`, ADD antes do DROP — nota de ativação), (iv) índice. **Backfill = NULL para todas as linhas** (nenhum valor text é convertido). Justificativa registrada: os valores text atuais são strings **livres, sem FK e sem semântica de produto** (exemplos sintéticos em teste: `"proj-abc-123"`, `"proj-x"`, `"proj-persist"`; nenhum deploy de produção ocorreu — não existe dado real a preservar); "converter casando por nome" seria inventar vínculo. **Perda declarada: zero dado real; coluna text não é restaurável com valores** (o down recria a coluna vazia, §8).
- **D-PEND-3 — Código de erro NOVO `PROJECT_NOT_EMPTY` (HTTP 409) — RATIFICADO como D21 e validado pelo parecer A4 (seção específica favorável).** Corpo `{error:{code:"PROJECT_NOT_EMPTY",message}}` com mensagem **genérica fixa**, sem `details`, sem contagem, idêntica para qualquer projeto não-vazio (não vaza existência/quantidade de itens). Precedente de 409: `AUTH_EMAIL_TAKEN` (F1).
- **D-PEND-4 — Defaults técnicos provisórios (DEC-12 aberta):** `name` 1..120 pós-trim; `search` ≤120; `page` ≥1 default 1; `pageSize` 1..100 default 20. Herda o espírito F2/F3/F5; o coordenador ratifica ou sobrescreve. **Não bloqueia.**

### 0.2 D13 cumprida — a pendência expressa da Fatia 3

A D13 mandou `projectId` text sem FK e registrou: "a fatia PRJ adicionará validação" (F3 §2.1.4, §10). Esta fatia **é** a fatia PRJ: `projectId` passa a **UUID validado** (existe E pertence à mesma org → senão `400` genérico `fields ["projectId"]`, padrão `accountIds`) no **POST e no PATCH** de `/api/v1/releases`; a resposta devolve `projectId` uuid ou `null`. Nenhum outro campo/endpoint de releases muda (§3.3).

### 0.3 Nenhuma decisão "D" nova

As escolhas de engenharia abaixo são **decisões técnicas registradas** (precedente F5 §0.4): recurso plano `/api/v1/projects` (§3), counts **computados na leitura, sem colunas** (§4), `webhookCount` constante 0 (§4.3), sem unique de nome (D11), 409 sem contagem (D-PEND-1/3). A série "D" permanece reservada ao dono; a numeração D19+ fica livre para as ratificações dos D-PENDs.

---

## 1. IDs do PM — cobertos e pulados

| ID | Requisito (síntese literal do mapa) | Situação | Base / motivo |
|---|---|---|---|
| **GRP-PRJ-01** | Projeto (pasta) com Editar e Excluir (destrutivo destacado). | **A CONTRATAR (parcial declarado)** | Editar = `PATCH {name}`. Excluir = `DELETE` **só do vazio** (D-PEND-1): vazio → `204`; com releases → `409 PROJECT_NOT_EMPTY`, linha intacta — exclui DEC-16 da fatia. "Pasta" e "destrutivo destacado" = tela futura (A2, após ordem de UI). Legado provou o recorte "exclusão do vazio" (matriz R88) — a proposta segue a evidência. |
| **GRP-PRJ-02** | Período e 8 KPIs do projeto (mesmos rótulos dos da campanha). | **PULADO** | Limite literal do PM: "Agregação não demonstrada; DEC-14" (fórmulas abertas). Nenhum endpoint de KPI, nenhum período, nenhuma coluna de métrica (PM regra 6; DIR-04). Pendência §10. |
| **GRP-PRJ-03** | Colunas Contas / Campanhas / Webhooks do projeto, com contador, vazio legível. | **A CONTRATAR como computed** | `releaseCount` = COUNT de releases com `project_id` do projeto; `accountCount` = COUNT DISTINCT de contas associadas às releases do projeto (via `release_accounts`); `webhookCount` = **0 constante** — módulo de webhooks NÃO existe no rebuild; exibir 0 é o estado honesto (DIR-04), **declarado no contrato e na resposta** (§4.3). Sem endpoints novos: counts fazem parte do recurso (§3.1/§4). |
| **GRP-PRJ-04** | Projetos separam campanhas por cliente; isolamento (FALA+PROP, "não provado"). | **A CONTRATAR (substrato + provas)** | Vínculo real `releases.project_id` (uuid, FK, validação mesma-org §0.2) + isolamento por tenant herdado (TEN-01): testes negativos T6/T12 — projeto de org A não aparece/não é alterado/excluído por B (**404** byte a byte); releases de B **não podem** apontar para projeto de A (400 genérico) e **não contam** nos counts de projeto de A (predicado com `org_id`, §4). FLX-10: "totais só do projeto" — counts filtram exclusivamente pelo `project_id` do recurso. |

**Fora de escopo declarado (não construir, mesmo que "pareça fácil"):** 8 KPIs e período (PRJ-02/DEC-14); DELETE de projeto não-vazio e qualquer "destino dos itens" (DEC-16); movimentação em massa de releases entre projetos (D10); webhook real/contagem real de webhooks; tela, cards, pasta visual, confirmação de exclusão em UI (A2, PM regra 1); busca global (DEC-13); `projectName` em releases (nenhuma amarra no PM — o recurso leva `projectId`); renomear/recriar cascata; integração externa em qualquer forma (DIR-06).

---

## 2. Modelo de dados — migração `007_projects`

Arquivos: `api/src/db/migrations/007_projects.up.sql` + `007_projects.down.sql` (comentários ASCII puro). Convenções herdadas: UUID com `gen_random_uuid()`, `timestamptz` UTC, `updated_at` mantido pela aplicação (sem triggers — pg-mem), `ON DELETE RESTRICT` para `org_id`.

```sql
-- 007_projects.up.sql
CREATE TABLE projects (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  name        text NOT NULL,                       -- trim aplicado pela API antes de gravar; SEM unique (D11)
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_org_id_idx ON projects (org_id);
CREATE INDEX projects_org_name_lower_idx ON projects (org_id, lower(name));  -- busca CI (idem F2/F5)

-- D20 (RATIFICADA): a coluna text da D13 sai; a uuid nasce NULL (backfill NULL).
ALTER TABLE releases DROP COLUMN project_id;
ALTER TABLE releases ADD COLUMN project_id uuid NULL REFERENCES projects (id) ON DELETE RESTRICT;
CREATE INDEX releases_project_id_idx ON releases (project_id);

-- 007_projects.down.sql (reversivel no schema; dados do vinculo NAO voltam - ver §8)
DROP INDEX IF EXISTS releases_project_id_idx;
ALTER TABLE releases DROP COLUMN IF EXISTS project_id;      -- remove a uuid+FK (dependencia de projects)
ALTER TABLE releases ADD COLUMN project_id text NULL;      -- restaura o formato D13 (COLUNA VAZIA)
DROP INDEX IF EXISTS projects_org_name_lower_idx;
DROP INDEX IF EXISTS projects_org_id_idx;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_pkey;
DROP TABLE IF EXISTS projects;
```

### 2.1 Decisões técnicas do modelo

1. **`projects` mínima:** só `name` + auditoria. Nenhuma coluna de cor/ícone/ordem/descrição (DEC-01/DEC-12 abertas; nada disso tem amarra observada além do nome). `org_id NOT NULL` como toda tabela first-class.
2. **`releases.project_id uuid NULL` + `ON DELETE RESTRICT`** (D-PEND-2): FK real fecha a integridade que a D13 deixou aberta. **RESTRICT** é dupla defesa do D-PEND-1: mesmo que a checagem da API (`COUNT` de releases) seja contornada por corrida/SQL direto, o banco recusa apagar projeto referenciado (23503 → mapeado para `409 PROJECT_NOT_EMPTY`, §9.3). A FK **não** garante mesma-org — a coerência `releases.org_id = projects.org_id` é imposta pela **validação da API** (§5, padrão D13 de `accountIds`); trigger é excluída (pg-mem).
3. **Ordem DROP→ADD na mesma transação:** como o backfill é NULL (nenhum dado atravessa), dropar o `text` e adicionar a `uuid` com o mesmo nome é a forma mais simples e atômica; não há janela de leitura (transação de migração).
4. **Down devolve o formato D13, não os dados:** a coluna `text` renasce **vazia** — a perda de vínculos no down é irreversível e está declarada no §8 (alerta de dono).

---

## 3. Endpoints (todos exigem sessão válida; prefixo `/api/v1`)

Recurso novo em `api/src/routes/projects.ts`. Corpos JSON; **media type `application/json` obrigatório em TODA mutação (D6 herdado, guard `preParsing`, DELETE incluído — F5 §3.4)**; respostas de sucesso sem envelope de erro. Sem sessão → `401 AUTH_UNAUTHENTICATED` em todos. Recurso **plano** `/api/v1/projects` (precedente: `/accounts`, `/releases`, `/groups` — id globalmente único; aninhar não adiciona capacidade).

### 3.1 Forma do recurso (JSON camelCase; counts SEMPRE computados — §4)

```json
{
  "id": "uuid",
  "name": "string",
  "releaseCount": 0,      // computado (§4.1) - nunca aceito em body
  "accountCount": 0,      // computado (§4.2) - nunca aceito em body
  "webhookCount": 0,      // constante 0 (§4.3) - módulo inexistente, honesto
  "createdAt": "ISO-8601 UTC",
  "updatedAt": "ISO-8601 UTC"
}
```

Respostas de recurso único retornam o objeto direto (flat — F2 §3.1). **Shape uniforme em TODAS as respostas** (POST/GET/PATCH, item de lista): counts fazem parte do recurso (decisão registrada §0.3) — a lista os computa por página com queries agrupadas (§4.4), sem custo N+1. Nada além disso (sem KPIs, período, cor, ícone, webhooks reais — §1).

### 3.2 Tabela de endpoints

| Método/rota | Entrada | Sucesso | Efeitos e regras |
|---|---|---|---|
| `POST /api/v1/projects` | `{name}` | `201` + recurso | Cria a linha com `org_id` da sessão; counts nascem 0 (nenhuma release pode referenciar projeto inexistente). **Não** cria release, grupo, link, ação, sessão nem métrica (DIR-04/DIR-06; análogo CTA-03; teste T1). |
| `GET /api/v1/projects?search=&page=&pageSize=` | query opcional | `200 {items,total,page,pageSize}` | Escopado por org da sessão. `search`: substring CI em `lower(name)`, curingas do termo escapados (F2 §3.2). Ordenação fixa `created_at DESC, id DESC`. COUNT+SELECT na mesma transação de leitura (F2 §9.1); counts dos itens da página pela query agrupada (§4.4). Vazio legível: `items:[]`, `total:0` (PRJ-03 "vazio legível"). |
| `GET /api/v1/projects/:id` | — | `200` + recurso | `:id` UUID da própria org; senão `404` genérico byte a byte (§5). Counts computados (§4.1–4.3). |
| `PATCH /api/v1/projects/:id` | `{name}` (≥1 campo) | `200` + recurso | Edita **somente** `name` local. Counts/`id`/`org_id`/timestamps em body → campo desconhecido → `400`. `updated_at` sempre atualizado. |
| `DELETE /api/v1/projects/:id` | — | `204` sem corpo **OU** `409` | **D19 (RATIFICADA):** dentro da transação, `COUNT` de releases com `project_id = :id AND org_id = $sessão`; **0 → hard delete da linha → `204`**; repetição → `404` genérico byte a byte (D16). **≥1 → `409 PROJECT_NOT_EMPTY`**, corpo genérico fixo (D21), **nenhuma coluna muda** (T4). **Sem massa em qualquer caso (D10).** |

### 3.3 Mudança nos endpoints de releases (herança D13 — §0.2; A4 deve validar)

| Método/rota | Mudança |
|---|---|
| `POST /api/v1/releases` | `projectId` (opcional) passa a exigir **UUID** + existência + **mesma org** → senão `400 VALIDATION_ERROR fields ["projectId"]` com mensagem genérica (padrão `accountIds`, não revela se existe nem de quem é). `null` explícito → nasce sem projeto; ausente → `null`. Substitui a validação text 1..120 (D13 previu esta mudança). |
| `PATCH /api/v1/releases/:id` | Idem: `projectId` UUID validado (mesma org) → `200` com `projectId` uuid; `null` explícito limpa (grava NULL); ausente = não mexe. Desvincular todas as releases de um projeto torna-o "vazio" para o DELETE (T4c). |
| Respostas de `/releases` | `projectId` devolve **uuid \| null** (coluna nova). Nenhum outro campo muda; `accountIds`/`archived`/ações D12 intocados. |

### 3.4 Validações (defaults provisórios — D-PEND-4; DEC-12 aberta)

| Campo/param | Regra | Erro |
|---|---|---|
| `name` (POST/PATCH projects) | string; trim antes de validar/gravar; 1..120 pós-trim; obrigatório no POST; PATCH exige ≥1 campo | `400` (details lista campos) |
| `projectId` (POST/PATCH releases) | string UUID (regex produto, case-insensitive → canônico minúsculo); deve existir em `projects` E pertencer à mesma org da sessão; `null` limpa; ausente = não mexe | ausente-inválido/não-UUID/inexistente/alheio → `400` `fields ["projectId"]` **genérico** |
| `search` | trim; vazio ⇒ sem filtro; ≤120 | `400` se exceder |
| `page`/`pageSize` | ≥1 default 1; 1..100 default 20; sem clamp silencioso | `400` |
| `:id` | UUID | malformado → `400` (independente de tenant); bem-formado desconhecido/alheio → `404` genérico |
| body (POST/PATCH projects) | `additionalProperties: false` | desconhecido — inclui `org_id`, `id`, `releaseCount`, `accountCount`, `webhookCount`, `createdAt`, `updatedAt` — → `400` |
| `DELETE` | sem query/body lidos; guard D6 do media type aplica (uniformidade F5) | CT ≠ json → `400 fields ["content-type"]` |

### 3.5 Content-Type guard (D6) — herdado sem alteração

POST, PATCH e DELETE de `/projects` usam o guard `preParsing` da F2: media type ≠ `application/json` (parâmetros aceitos) ou ausente → `400 VALIDATION_ERROR` antes do parser. Teste T11.

---

## 4. Counts computados (PRJ-03) — NENHUM é armazenado

### 4.1 `releaseCount` — campanhas do projeto

```
SELECT COUNT(*) FROM releases WHERE project_id = $project AND org_id = $org
```

Determinístico (relação direta pela FK). O predicado carrega `org_id` por uniformidade tenant (§5) — a validação da API já garante que release vinculada é da mesma org (§0.2).

### 4.2 `accountCount` — contas indiretas via releases do projeto

```
SELECT COUNT(DISTINCT ra.account_id)
  FROM release_accounts ra
  JOIN releases r ON r.id = ra.release_id
 WHERE r.project_id = $project AND r.org_id = $org
```

`DISTINCT` = **conta única por projeto** (ENT-13: projeto "agrupa contas"): a mesma conta associada a 2 releases do mesmo projeto conta 1 (FLX-10 "totais só do projeto"; teste T3b). Conta associada a release **sem** projeto não entra em nenhum count.

### 4.3 `webhookCount` — constante `0`, declarada

Módulo de webhooks **não existe** no rebuild (nenhuma tabela/rota). O count devolve `0` literal, **sem query** — estado honesto (DIR-04): a resposta afirma "0 webhooks no projeto" porque não há entidade que possa existir, não porque foi contada. Quando o módulo WHE existir, vira COUNT real (pendência §10). A A2/tela futura não deve exibir outro valor que não o do servidor.

### 4.4 Counts na LISTA — 2 queries agrupadas por página

Após o SELECT da página (ids `$pageIds`), 2 queries agrupadas (mesma transação de leitura — snapshot coerente com a lista):

```
SELECT project_id, COUNT(*) AS c
  FROM releases WHERE project_id = ANY($pageIds) AND org_id = $org GROUP BY project_id

SELECT r.project_id, COUNT(DISTINCT ra.account_id) AS c
  FROM release_accounts ra JOIN releases r ON r.id = ra.release_id
 WHERE r.project_id = ANY($pageIds) AND r.org_id = $org GROUP BY r.project_id
```

Projetos sem releases recebem 0 (ausência no GROUP BY). `ANY($1)` = mesmo mecanismo da validação de `accountIds` (F3, testado no pg-mem). `webhookCount` = 0 em todos. Custo: constante por página (2 queries), independente do total — escala declarada §9.5.

---

## 5. Tenant (ENG-02) + coerência projeto↔release

- `org_id` deriva **sempre** de `req.user.orgId`; toda query de `projects` carrega `WHERE org_id = $...`; UPDATE/DELETE têm a org **no próprio predicado** (nunca "busca e altera" em dois passos). Counts sempre com `org_id` no predicado (§4).
- `GET`/`PATCH`/`DELETE` por id de projeto de outra org ou inexistente → `404` com corpo **TENANT_FORBIDDEN genérico, byte a byte idêntico** ao de id inexistente (F2 §4 — não vaza existência). Vale inclusive para o DELETE: projeto alheio **não-vazio** também responde `404` (nunca `409` — o 409 só é alcançável dentro da própria org; não vaza cardinalidade alheia).
- **POST/PATCH de `/releases` com `projectId` de outra org ou inexistente → `400 VALIDATION_ERROR fields ["projectId"]` genérico** (espelho D13 de `accountIds`; validação dentro da transação — corrida residual FK mapeada §9.3).
- **Isolamento PRJ-04:** releases de B jamais apontam para projeto de A (validação §3.3); counts de projeto de A só enxergam releases de A (predicado `org_id`); lista de A não contém projetos de B. Testes cruzados obrigatórios (T6).
- `org_id`/`id` em body/query nunca confiados (campo desconhecido → 400).

---

## 6. Testes dirigidos (suíte offline pg-mem; fixtures 2 tenants — herda helpers F1/F2)

Arquivo: `api/test/projects.test.ts` (+ alterações DECLARADAS em `releases.test.ts` e `migrations.test.ts` — T10). Todos via `fastify.inject()`, sem porta/rede/Docker; dados 100% sintéticos; org A + dono A e org B + dono B com os dois cookies.

| # | Caso | Esperado |
|---|---|---|
| T1 | CRUD feliz: POST `{name}` → `201` com shape §3.1 (`releaseCount:0`, `accountCount:0`, `webhookCount:0`); lista contém o item e `total` reflete; GET/:id devolve igual; PATCH `{name}` → 200 refletido. Criação **sem efeitos colaterais** (análogo CTA-03): contagens de `sessions`/`accounts`/`releases` inalteradas; conjunto de tabelas do schema = {organizations, users, sessions, migrations, accounts, releases, release_accounts, groups, **projects**}. | conformidade exata de shape/status |
| T2 | Validações: `name` vazio/só espaços/121 → 400 (120 passa); `search` 121 → 400; `page=0`/`pageSize=101` → 400; PATCH `{}` → 400; body null literal → 400; desconhecidos no body (`org_id`, `id`, `releaseCount`, `accountCount`, `webhookCount`) → 400 com details; `:id` malformado → 400 em GET/PATCH/DELETE; **POST/PATCH `/releases` com `projectId` não-UUID (ex.: texto livre legado) → 400 `fields ["projectId"]`**. | envelope Fundação em todos |
| T3 | **Counts coerentes com fixtures (PRJ-03):** projeto P1 com R1 (contas X,Y) e R2 (contas X,Z) → `releaseCount:2`, `accountCount:3` (**DISTINCT: X conta 1x** — T3b); R3 **sem** projeto (conta W) → não entra em P1 nem em nenhum count; P2 vazio → `0/0/0`; `webhookCount:0` em todos; GET/:id e lista concordam campo a campo; desvincular R2 (PATCH releases `projectId:null`) → counts caem para `1/2` na releitura. | determinismo dos derivados |
| T4 | **Exclusão (D-PEND-1 dirigido):** (a) projeto vazio → DELETE `204` sem corpo; releitura → `404`; repetição → `404` byte a byte igual ao de UUID inexistente; (b) projeto com 1 release → DELETE `409 PROJECT_NOT_EMPTY` corpo fixo (sem contagem no corpo); **oráculo SQL campo a campo: linha do projeto intacta** (name/created_at/updated_at idênticos — nem `updated_at` anda); (c) desvincular a release → DELETE volta a `204` (estado vazio reavaliado por chamada); (d) 409 é idêntico byte a byte para projeto com 1 e com 3 releases (não vaza cardinalidade). | vazio ok / não-vazio 409 intacto |
| T5 | Busca: nomes com caixa variada; substring CI; curingas `%`/`_` no termo tratados literalmente (escape F2 §3.2); vazio ⇒ sem filtro; página além do fim → `items:[]` com `total` preservado; ordenação `created_at DESC` estável (desempate `id`). | asserts nominais |
| T6 | **Cruzado (TEN-01 + PRJ-04):** projeto criado em A; org B faz GET/:id, PATCH, DELETE → **404 byte a byte igual ao de UUID inexistente** (inclusive DELETE de projeto não-vazio de A → 404, nunca 409); B faz POST/PATCH `/releases` com `projectId` de A → **400 genérico** (não vaza existência); lista de B não contém projeto de A; **counts de projeto de A não incluem releases/contas de B** (fixtures simétricas); snapshot antes/depois: nada de A nem B alterado pelas negativas. | isolamento leitura+escrita+referência+counts |
| T7 | Sem sessão: todas as rotas (POST, lista, GET/:id, PATCH, DELETE de projects; POST/PATCH releases com projectId) sem cookie → `401 AUTH_UNAUTHENTICATED`. | envelope Fundação |
| T8 | Persistência (PER-01): após POST/PATCH/vínculo de releases, re-instanciar app/Pool sobre a mesma store e reler por **oráculo SQL direto** em `projects` E `releases.project_id`; counts NUNCA gravados (colunas inexistentes no oráculo); vínculo uuid persiste campo a campo. | releitura ≠ própria resposta |
| T9 | Migração (MIG-01): up → status (7 aplicadas) → up idempotente → down (007) → `projects` ausente, **`releases.project_id` volta a existir como `text` NULL e VAZIA** (conferência: INSERT de release com valor text no estado down é aceito; após re-up, valor text é recusado) → demais 6 intactas → up re-aplica. | reversível no schema |
| T10 | **Regressão (REG-01) — inventário nominal:** suíte integral vigente (**86 casos em 8 arquivos** na data da F5: accounts 16, auth 10, groups 16, health 3, migrations 9, releases 20, ratelimit 8, tenant 4) roda sem regressão junto com a nova; gates `typecheck`/`test`/`build`/`audit` após o último diff. **Ajustes DECLARADOS (consequência direta dos D-PENDs, não regressão):** (i) `migrations.test.ts`: 6→7 migrações (down-1 passa a reverter 007); (ii) `releases.test.ts`: fixtures com `projectId` text sintético (`"proj-abc-123"`, `"proj-x"`, `"proj-fixo"`, `"proj-persist"`) passam a 400 pela validação nova — substituir por **uuid de projeto criado na fixture** ou `null`, mesma intenção assertiva; (iii) conjunto de tabelas do T5-análogo de releases 8→9 incluindo `projects`. | sem regressão; ajustes listados |
| T11 | Content-Type guard (D6): POST/PATCH de projects com `text/plain` e `application/x-www-form-urlencoded` → 400 `VALIDATION_ERROR` (fields `content-type`); PATCH sem header → 400; DELETE com `text/plain` → 400; `application/json; charset=utf-8` → aceito. | guard uniforme nas rotas novas |
| T12 | **projectId em releases (CMP-08/PRJ-04 dirigido):** POST `/releases` com `projectId` da própria org → `201` com `projectId` uuid (oráculo: FK gravada); PATCH muda de projeto (mesma org) → 200; PATCH `projectId:null` limpa; ausente = inalterado; alheio/inexistente/não-UUID → 400 genérico em POST e PATCH; **mesmo uuid em caixa alta → aceito e canônico minúsculo** (padrão pós-auditoria F3 achado 1). | vínculo validado mesma-org |
| T13 | 409 × corrida (defesa FK): DELETE de projeto vazio concorrente com PATCH de release vinculando-o (ordem invertida artificialmente na fixture) → FK 23503 capturada → resposta `409 PROJECT_NOT_EMPTY` (DELETE) ou `400 fields ["projectId"]` (PATCH), nunca `500`; sem estado órfão (oráculo). | corrida mapeada |
| T14 | UI-01 backend: estados para a tela futura — vazio (`items:[]`, `total:0`), preenchido com counts, erro (envelope); nenhum endpoint de tela é criado (backend-only declarado). | estados disponíveis |

**Smoke E2E (orquestrador, API real, dados sintéticos — E2E-01):** login → criar projeto → criar 2 releases (1 com projectId do projeto e 2 contas, 1 sem) → GET/:id com `releaseCount:1` e `accountCount:2` → desvincular a release → DELETE do projeto `204` → recriar + vincular → DELETE `409` e projeto persiste → **cruzado:** org B não vê o projeto de A (lista vazia; 404 por id) e não consegue vincular release a ele (400).

---

## 7. Mapeamento com a MATRIZ-VALIDACAO

| Critério | Como esta fatia atende | Evidência |
|---|---|---|
| **TEN-01** | T6: cruzado em leitura/escrita/exclusão/referência/counts (projectId alheio → 400 genérico; DELETE alheio → 404 mesmo não-vazio; counts só da org), 404 byte a byte, snapshot antes/depois; org no predicado de todo UPDATE/DELETE e counts. | L |
| **ERR-01** | Tabela entrada→esperado por endpoint (T2/T4/T6/T7/T11/T12/T13) com asserts de status/corpo/envelope herdado + 1 código novo documentado (D-PEND-3). | E+L |
| **PER-01** | T8: reabertura de Pool/app + oráculo SQL independente em `projects` e `releases.project_id`. Reinício real de processo segue como evidência H em ambiente autorizado (limitação pg-mem herdada). | L |
| **UI-01** | T14: backend fornece vazio/preenchido/erro. **Tela é Placeholder e PERMANECE** — A2 não toca (PM regra 1); nenhuma UI é construída nesta fatia. | L (A2 futura) |
| **E2E-01** | Roteiro S do §6 (login → criar → vincular → counts → desvincular → excluir/reexcluir → cruzado). Evidência H colhida pelo orquestrador em ambiente autorizado. | H (orquestrador) |
| **REG-01** | T10: suíte integral (86/86 nominal) + gates após o último diff, com os 3 ajustes declarados (i–iii). | L |

---

## 8. Plano de rollback

- `007_projects.down.sql` remove índice, coluna uuid (e a FK), **recria `releases.project_id text NULL`** (formato D13) e dropa `projects`. **ALERTA DE DONO — perda real de vínculos:** qualquer vínculo project→release gravado entre o up e o down **não volta** (a coluna text renasce vazia; a tabela `projects` some com os nomes). O down é reversível **no schema**, não **nos dados** — declarado no D-PEND-2 e aqui. **Sempre** dump antes; preferir **correção para frente** (migração nova) conforme Fundação §7; `down` só com ordem do orquestrador, congelamento de deploys e verificação `status` + healthcheck + smoke autenticado após.
- **Rollback do código × schema — acoplamento novo:** reverter o PR **sem** rodar o down deixa a coluna `uuid` com FK no banco e o código velho escrevendo text livre → INSERT/PATCH de release com `projectId` text falha no banco (23503) — o par código/schema da F3 **não é mais independente** a partir desta fatia. Regra: reverter código de releases exige reverter a migração (ou vice-versa jamais sozinho); rotas de `/projects` somem sem leitores e tabela órfã é inócua (idem F2/F3/F5 §8 — só o lado projects).
- Down não encontra dependências além da ordem já escrita (coluna uuid é dropada antes de `projects`).

---

## 9. Riscos e limitações declarados

1. **D-PENDs 1–3 RESOLVIDOS (D19/D20/D21, §0.1):** o DELETE vazio-only com 409, o drop da coluna text e o código `PROJECT_NOT_EMPTY` estão RATIFICADOS e implementados nesta fatia; o restante da fatia (CRUD sem DELETE, vínculo uuid, counts) independia deles, mas a migração 007 é escrita de uma vez (o up completo é indivisível — transação). Delete de projeto **não-vazio** segue PENDENTE da DEC-16 (§10).
2. **pg-mem × FK na prática:** o parser aceita FK (F3 usa 23503), mas a **aplicação** da restrição no pg-mem pode diferir do PostgreSQL real; a checagem de vazio da API (COUNT na transação do DELETE) é o gate primário; a FK RESTRICT é defesa-de-profundidade para o banco real. Teste T9/T13 registram o comportamento real obtido.
3. **Corridas residuais (janelas herdadas F3 §9.10.i, agora com consumidor real):** validação de `projectId` na transação do POST/PATCH de releases + DELETE concorrente do projeto → 23503 → `400 fields ["projectId"]` genérico (T13); DELETE×DELETE idempotente por natureza (2º → 404). Sem estado órfão aceito.
4. **409 não vaza cardinalidade:** corpo fixo byte a byte para 1 ou N releases (T4d); o `releaseCount` real só aparece em GET autenticado da própria org.
5. **Escala dos counts na lista:** 2 queries agrupadas por página (custo constante por página, §4.4) — adequado ao perfil do produto; índice `releases_project_id_idx` sustenta o GROUP BY; revisitável com medição.
6. **`webhookCount:0` é literal:** conta zero **não consultada** — quando o módulo WHE existir, o count vira COUNT real e a resposta muda de valor (não de shape) — transição declarada, não silenciosa (§10).
7. **Perda da coluna text (D-PEND-2):** nenhum dado real existe (sem deploy de produção); valores sintéticos de teste são substituídos (T10-ii). O down recria a coluna **vazia** (§8).
8. **Counts são leitura, não estado:** computados no snapshot da resposta; não há coluna a desincronizar (mesmo argumento `cheio`/`seq` da F5), mas leituras simultâneas a escritas podem divergir entre duas chamadas — consistência por resposta, não entre respostas.
9. **A2/tela futura:** placeholder permanece; a tela de projetos só existe após ordem de UI (PM regra 1) e consumirá `GET /projects` + `GET /:id` com counts; KPIs da tela (PRJ-02) **não têm endpoint** — não exibir zeros falsos como se KPI fossem (DIR-04; differencial counts × KPI declarado no §1).

---

## 10. Pendências que dependem de decisão/fatia futura

| Item | Situação |
|---|---|
| **D-PEND-1 (DELETE vazio-only + 409)** | **RESOLVIDO pela D19** (§0.1) — implementado nesta fatia. Delete de não-vazio = **PENDENTE DEC-16** (destino dos releases/contas/webhooks ao excluir projeto com itens). |
| **D-PEND-2 (drop coluna text + uuid + backfill NULL)** | **RESOLVIDO pela D20** (§0.1) — perda declarada (zero dado real; down recria coluna text vazia). Coluna uuid implementada como `releases.project_uuid` (nota de ativação). |
| **D-PEND-3 (código novo `PROJECT_NOT_EMPTY`)** | **RESOLVIDO pela D21 e validado pelo parecer A4** (seção específica). |
| **`accountCount` (derivação indireta)** | **SEMÂNTICA REGISTRADA (parecer, ressalva 2):** conta DISTINCT de contas via `release_accounts` das releases do projeto (§4.2) — o projeto NÃO tem vínculo direto com conta no PM. **Levar à DEC-16:** quando o dono decidir a exclusão não-vazia, reconfirmar (ou revisar) a derivação "contas do projeto = contas das releases do projeto". |
| **DEC-16** | **ABERTA** — efeito de excluir projeto não-vazio sobre contas/campanhas/webhooks. Esta fatia a contorna (409); não a decide. |
| **DEC-14** | **ABERTA** — PRJ-02 (8 KPIs + período) pulado; nenhum endpoint/coluna de métrica criado. |
| **DEC-12** | **ABERTA** — defaults provisórios do D-PEND-4 (name 1..120 etc.) ratificáveis. |
| **DEC-01** | **ABERTA** — identidade visual/nomes da tela (pasta, destaque do destrutivo) = A2 após ordem de UI. |
| **Tela de projetos** | Placeholder permanece até ordem de UI (PM regra 1); A2 não toca nesta fatia (backend-only registrado). |
| **webhooks no projeto** | Módulo WHE inexistente; `webhookCount:0` literal; vira COUNT real na fatia do módulo. |
| **`projectName` em releases** | Não criado (nenhuma amarra no PM); se a tela futura pedir, é campo derivado de leitura (LEFT JOIN) — decisão da fatia de UI. |

**Ativação (09/11/2026):** contrato aprovado pelo parecer A4 (ADERENTE) e D-PENDs 1–3 ratificados pelo dono (D19/D20/D21, §0.1) — **implementação executada nesta fatia**. As pendências remanescentes (DEC-01/12/14/16 e itens de UI) não bloqueiam.

---

**Data:** 09/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/projetos` (base `main` a496cc8) · **Status:** contrato **ATIVADO** (parecer A4 ADERENTE + D19/D20/D21 ratificadas, §0.1) — implementação da Fatia 6 executada.
