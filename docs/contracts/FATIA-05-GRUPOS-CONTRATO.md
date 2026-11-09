# CONTRATO TÉCNICO — FATIA 5: GRUPOS (GRU — grupos da campanha: modelo, lista, filtros e cheio)

> **Status:** CONTRATO DOCUMENTAL — **implementação LIBERADA** (parecer A4 ADERENTE; decisões finais **D15–D18 aplicadas na §0.1** em 08/11/2026 — toda condicional "se ratificado" lê-se ATIVA). Define o modelo de dados e as APIs necessárias às funções GRU-02/03/04 (+ substrato de GRU-05), com as pendências de dono isoladas em §0.1/§10.
> **Repositório:** sendflow-rebuild. **Branch:** `a1/grupos` (base `main` d408657). **Autor:** A1 Backend. **Data:** 08/11/2026.
> **Variáveis só por nome:** nenhum segredo, token, senha ou valor de variável aparece neste documento.
> **Fontes:** `docs/continuidade/05-MAPA-FUNCOES-182.md` §"GRU — Grupos da campanha" (GRP-GRU-01..10, L234–246), `docs/continuidade/fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md` (§1 regra 7 — clique ≠ entrada ≠ participante ≠ reserva; §9.1 DEC-05/DEC-06/DEC-12; FLX-02; VGC-05; CRG-06; AUT-03), `docs/continuidade/fontes/backend-infra/DECISAO-DEC06-GRUPO-CHEIO.md` (decisão direta do dono — **amarra**, ver §0.2), `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md`, `FATIA-02-CONTAS-CONTRATO.md`, `FATIA-03-CAMPANHAS-CONTRATO.md` (D13 §0.2), `FATIA-04-ASC-CONTRATO.md` (padrões de herança sem decisão nova), `app/src/pages/GroupSearch.tsx` (tela atual — modelo de busca nome/GID), `api/src/routes/releases.ts` + `api/test/releases.test.ts` (padrões de rota/teste), matriz R88 coluna legado (GRU-02 "escopo aprovado; filtro técnico; busca posterior"; GRU-05 "escopo aprovado; fatia implementada na API" — **só matriz, nenhum código legado é contrato**).

---

## 0. Herança das Fatias 1–4 (vale integralmente; nada é redefinido aqui)

- **Envelope de erro único** (`{error:{code,message,details?}}`), códigos existentes apenas: `VALIDATION_ERROR`, `AUTH_UNAUTHENTICATED`, `TENANT_FORBIDDEN`, `NOT_FOUND`, `INTERNAL_ERROR`.
- **Sessão/cookie** `grupos_session` (TTL 72 h, D1): todos os endpoints exigem `requireAuth`.
- **Tenant ENG-02:** `orgId` vem exclusivamente da sessão; `org_id` em body/query nunca é confiado (campo desconhecido → 400).
- **Migrações** transacionais up/down/status com checksum, comentários ASCII; **D6** (Content-Type `application/json` em TODA mutação, guard `preParsing`); **D5** (sem DELETE — ver D-PEND-2); **D10** (sem operação em massa — ver D-PEND-1); **D11** (sem unique de nome — estendida aqui a `gid`, §2.1); **D12** (mudanças de estado booleanas como AÇÕES idempotentes `POST /:id/<acao>` — base de mark-full/mark-not-full); **D13** (recurso `/releases`; validação de referência por body: todo id referenciado deve existir E pertencer à mesma org, senão `400` genérico — padrão `accountIds` aplicado aqui a `releaseId`).
- Padrões reutilizados: resposta flat de recurso único (F2 §3.1), busca substring CI com curingas escapados (F2 §3.2), paginação `{items,total,page,pageSize}` (F2 §3.2), ordenação fixa `created_at DESC, id DESC`, transação de leitura para COUNT+SELECT no mesmo snapshot (F2 §9.1), **404 TENANT_FORBIDDEN genérico byte a byte** (F2 §4), CORS/healthcheck/env (nenhuma variável nova), suíte offline pg-mem, gates REG-01 (`typecheck`+`test`+`build`+`audit`).
- Diretrizes: DIR-04 (estado honesto, zero fake), DIR-06 (nenhuma integração externa), ENG-01 (grupo ≠ campanha ≠ conta ≠ lead), PM §1 regra 7 (**clique ≠ entrada ≠ participante ≠ reserva** — nenhum contador deriva de outro).

**Mudanças em código declaradas (quando autorizada a implementação):** registro de rotas em `api/src/app.ts`, `api/src/routes/groups.ts`, migração `006_groups` e `api/test/groups.test.ts` (+ ajustes aditivos declarados no §6/T10). Nenhum comportamento existente muda.

### 0.1 D-PENDs — RESOLVIDOS pelas decisões finais D15–D18 do coordenador (08/11/2026, aplicadas antes da implementação)

> **Nota de ativação (parecer A4, ressALVA 1):** a **D16 RATIFICOU o DELETE** — toda condicional "se ratificado" deste documento lê-se **ATIVA** desde 08/11/2026. Decisões do coordenador: **D15** (sem massa — A2 itera por id), **D16** (`DELETE /api/v1/groups/:id` RATIFICADO: `204`; repetição → `404`; massa sempre fora), **D17** (export CSV adiado até DEC-05), **D18** (endpoint plano `/api/v1/groups` com `releaseId` em body/query — ratifica a escolha do §3). D-PEND-4 (defaults DEC-12) segue **provisório** (herdado F2/F3); D-PEND-5 respondido pelo parecer A4 (contrato não decide — §10).

- **D-PEND-1 — Ações em massa (GRU-05): RESOLVIDO pela D15 — SEM massa.** A2 itera `POST /:id/mark-full`/`mark-not-full` por id (ações idempotentes). A semântica bulk fica registrada acima para contrato futuro (`POST /api/v1/groups/mark-full-bulk {ids, value}` — dedupe, validação todos-existem-e-da-mesma-org → `400 fields ["ids"]` genérico, all-or-nothing). Massa de **exclusão** permanece FORA sempre (D10 + D16).
- **D-PEND-2 — DELETE de grupo por id: RESOLVIDO pela D16 — RATIFICADO e ATIVO.** Hard delete da linha LOCAL (nenhum efeito externo — DIR-04), `204` sem corpo; repetição → `404` genérico byte a byte (§5); **exclusão em massa FORA em qualquer hipótese** (D10 + D16). Amarra dupla no PM: GRU-05 (OBS-M, P3 21:08; P4 26:40) "Excluir" e GRU-06 (OBS-M, P3 24:05) "Remover" no menu ⋮; a D5 da F2 previu o retorno da semântica quando uma função especificada exigir.
- **D-PEND-3 — Exportar grupos (GRU-01): RESOLVIDO pela D17 — ADIADO** para a fatia seguinte de GRU, **após** DEC-05 definir as colunas. Toolbar inteira: pulada (§1).
- **D-PEND-4 — Ratificar defaults técnicos provisórios (DEC-12 aberta):** `name` 1..120 pós-trim; `gid` 1..120 pós-trim; `limitPessoas` inteiro 1..100000 quando presente; `search` ≤ 120; `page` ≥ 1 default 1; `pageSize` 1..100 default 20; query `cheio` ∈ {`todos`,`sim`,`nao`}, ausente = `todos`; vocabulário camelCase com os termos exatos da DEC-06 (`cheio`, `cheioManual`, `limitPessoas`) — herda o espírito F2/F3. O coordenador ratifica ou sobrescreve. **Não bloqueia.**
- **D-PEND-5 — DEC-05 ("Redirect" × "Cliques reais"): PARECER A4 NECESSÁRIO.** Nenhum campo de "Redirect" é criado nesta fatia (§0.3); se o parecer concluir que Redirect é um **terceiro contador distinto**, a migração aditiva futura acrescenta a coluna (custo zero hoje). O contrato atual armazena `clicks` e `participants` **separados, sem fórmula cruzada** — nenhuma das interpretações possíveis da DEC-05 é prejudicada.

### 0.2 AMARRA DEC-06 legado (decisão direta do dono — não é decisão nova desta fatia)

Fonte: `docs/continuidade/fontes/backend-infra/DECISAO-DEC06-GRUPO-CHEIO.md` (07/11/2026, mensagem direta do usuário, verificada por ReadTranscript). Efeito contratual adotado **literalmente**:

1. **Cheio = marcação manual OU teto calculado local. Cada sinal basta independentemente** (OR sem precedência): `cheio = cheioManual OR (limitPessoas IS NOT NULL AND participants >= limitPessoas)`.
2. Marcação manual abaixo do teto → cheio. **Desmarcar manual NÃO elimina o sinal do teto** (aplicação do OR, não precedência nova).
3. O **gatilho "encher grupo"** (disparar uma vez na passagem F=false→true, sem repetir enquanto cheio, rearmando após esvaziar — adendo do mesmo arquivo) **NÃO é implementado nesta fatia**: não existe consumidor (AUT/FIL são módulos futuros). A DEC-06 do PM §9.1 segue **formalmente aberta quanto ao gatilho** (o próprio documento legado declara não fechá-la); a classificação/filtros — a parte que esta fatia exerce — fica resolvida pela amarra. Pendência registrada (§10).
4. O teto calculado compara **PARTICIPANTES** com o **limite de pessoas** (CRG-06 "Limite de pessoas"; VGC-05: lotação usa entradas/participantes, **não cliques**; PM regra 7: clique ≠ entrada ≠ participante). Cliques **nunca** ocupam vaga nem influenciam `cheio`.

### 0.3 DEC-05 aberta — consequência no modelo

Os contadores `clicks` e `participants` existem **separados** (PM regra 7; FLX-02: "clique ≠ entrada ≠ participante em todos os contadores"), **nenhum deriva do outro** e nenhum terceiro contador ("Redirect") é criado sem decisão. O significado exato de "Redirect x/limite" na linha (GRU-03) é **decisão de exibição da A2 pendente de DEC-05**; o servidor não afirma nada além dos campos que tem (DIR-04).

### 0.4 Nenhuma decisão "D" nova

As escolhas de engenharia abaixo são **decisões técnicas registradas** (mesmo precedente da dedupe da D13 e de toda a F4, que também não criou número D): recurso plano `/api/v1/groups` (§3), `cheio` **derivado sem coluna** (§4), `seq` **derivada** (§4.2), `org_id` denormalizado em `groups` (§2.1.2), sem unique de `gid` (§2.1.4). Motivo adicional (herdado da F4): a numeração "D14+" colidiria com as DEC-14/DEC-xx do PM §9.1; a série D permanece reservada ao dono.

---

## 1. IDs do PM — cobertos e pulados

| ID | Requisito (síntese literal do mapa) | Situação | Base / motivo |
|---|---|---|---|
| **GRP-GRU-02** | Filtros segmentados Todos/Cheios/Não cheios/**Suspenso**; busca; vazio "nenhum registro". | **A CONTRATAR (parcial declarado)** | Implementáveis com estado local: `cheio=(todos\|sim\|nao)` (DEC-06 legado §0.2) + busca nome/GID + paginação + vazio honesto (`items:[]`, `total:0`). **"Suspenso" PULADO:** o limite do PM é literal — "Origem do estado 'suspenso' = provedor (NT)"; não existe estado local de suspensão, e um filtro que só pode devolver vazio seria função inventada (PM regra 6). Pendência §10. |
| **GRP-GRU-03** | Linha: número sequencial + nome, Redirect x/limite, Cliques reais, Participantes, copiar link, data, tipo ("Grupo normal"), select Cheio Sim/Não manual, ícone de dados, menu ⋮. | **A CONTRATAR (substrato de dados)** | Colunas `name`, `gid`, `clicks`, `participants`, `limit_pessoas` + `seq` **derivada** (§4.2) + `created_at` sustentam a linha. **Parciais declarados:** "Redirect x/limite" = exibição da A2 pendente de **DEC-05** (§0.3); **sem campo de link de convite** (provedor NT; link único = DEC-11/VGC futuro — "copiar link" não tem dado, não falsificar); **sem coluna de tipo** (valor único observado "Grupo normal" — rótulo estático de tela até o template CRG-07 existir); ícone/menu = tela (GRU-06). |
| **GRP-GRU-04** | Select "Cheio" Sim/Não manual na linha; [PROP] marcar manualmente **não altera contagens** (P4 §D1). | **A CONTRATAR (núcleo)** | Ações idempotentes `POST /:id/mark-full`/`mark-not-full` (padrão D12) mexem **somente** em `cheio_manual`/`updated_at` — teste dirigido T4 compara campo a campo. Classificação cheio = amarra DEC-06 legado (§0.2). |
| **GRP-GRU-05** | "Selecionar tudo (n/N)" + ações em massa: Marcar como cheio, Marcar como não cheio, Excluir. | **PARCIAL + D-PEND-1/2** | Seleção e iteração são da A2 sobre as ações por id contratadas em GRU-04. **Bulk:** D-PEND-1 (recomendação: NÃO — D10 mantém). **Excluir:** D-PEND-2 (amarra dupla no PM; recomendação: DELETE por id SIM, massa NUNCA). Confirmação prévia = tela (aceitação PROP do PM). |
| **GRP-GRU-01** | Toolbar: Criar/Alterar/Importar grupos, Atualizar links, Exportar grupos/leads, Atualizar leads, Participantes duplicados, Grupos duplicados. | **PULADO (toolbar)** | Criar/Importar = CRG/IMP futuros (criação real depende de provedor — NT); Alterar/Atualizar links = BLOQ-EXT; leads/duplicados = GRU-08/09 e módulos futuros. **Exceção avaliada:** Exportar grupos CSV (autocontido) — **D-PEND-3, recomendação PULAR** até DEC-05 (colunas). O `POST /api/v1/groups` desta fatia NÃO é o "Criar grupos" do PM: é o **registro local** sem o qual GRU-02/03/05 não têm linhas (PM regra 6: modelo necessário às funções especificadas; nenhum efeito externo é afirmado). |
| **GRP-GRU-06** | Menu ⋮: Detalhes, Marcar como cheio, Reprocessar cliques, Atualizar/Redesenhar link, Editar, Remover. | **PULADO (menu)** — itens absorvidos | Menu inteiro é BLOQ-EXT (efeitos em provedor NT) e tela. Substratos locais já cobertos por outros IDs: "Marcar como cheio" = GRU-04; "Editar" = `PATCH` local do registro (sem ação na fila — GRU-07); "Detalhes" = `GET /:id`; "Remover" = D-PEND-2. Reprocessar cliques/link = sem dado (fora). |
| **GRP-GRU-07** | "Alterar nome do grupo" gera ação na fila após edição. | **PULADO (fila)** | Módulo FIL não existe. O `PATCH {name}` desta fatia edita **somente o registro local** e não afirma renomear o grupo real (DIR-04). Quando FIL existir, decidir se edição gera ação — dependência registrada (§10). |
| **GRP-GRU-08** | Edição em massa (nome, descrição, admins) e exportação de dados. | **PULADO** | Classe RV/FALA (cap.); modal de lote não amostrado (LAC-03). Massa também esbarra em D10. |
| **GRP-GRU-09** | Grupos duplicados / participantes duplicados. | **PULADO** | Resultado/estado vazio não amostrado (LAC); sem algoritmo decidido. |
| **GRP-GRU-10** | Reservas internas idempotentes e distribuição local. | **PULADO** | Nenhum consumidor de reserva existe nesta fatia (sem link único, sem distribuição — FLX futuro); criar tabela de reservas agora seria extra (PM regra 6). Pendência §10. |

**Fora de escopo declarado (não construir, mesmo que "pareça fácil"):** estado "suspenso" e qualquer filtro sobre ele; mutadores de `clicks`/`participants` (nenhum endpoint desta fatia altera contadores — o fluxo de clique/entrada é FLX/VGC futuro; os contadores nascem 0 e só leitura existe); link de convite (individual ou único); gatilho "encher grupo"; reservas; numeração por template (início da contagem — CRG-05); renumeração; export CSV (D-PEND-3); operações em massa (D-PEND-1); integração/provedor em qualquer forma (DIR-06).

---

## 2. Modelo de dados — migração `006_groups`

Arquivos: `api/src/db/migrations/006_groups.up.sql` + `006_groups.down.sql` (comentários em ASCII puro). Convenções herdadas: UUID com `gen_random_uuid()`, `timestamptz` UTC, `updated_at` mantido pela aplicação (sem triggers — pg-mem), `ON DELETE RESTRICT` para `org_id`.

```sql
-- 006_groups.up.sql
CREATE TABLE groups (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations (id) ON DELETE RESTRICT,
  release_id    uuid NOT NULL REFERENCES releases (id) ON DELETE RESTRICT,
  name          text NOT NULL,                       -- trim aplicado pela API antes de gravar
  gid           text NULL,                           -- identificador do grupo no WhatsApp (GID); opcional
  clicks        integer NOT NULL DEFAULT 0,          -- PM regra 7: clique <> entrada <> participante
  participants  integer NOT NULL DEFAULT 0,          -- teto calculado compara este campo (DEC-06 legado + VGC-05)
  limit_pessoas integer NULL,                        -- limite de pessoas (CRG-06); NULL = sem teto calculado
  cheio_manual  boolean NOT NULL DEFAULT false,      -- sinal manual da DEC-06; muda SO pelas acoes mark-full/mark-not-full
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT groups_clicks_nonneg CHECK (clicks >= 0),
  CONSTRAINT groups_participants_nonneg CHECK (participants >= 0),
  CONSTRAINT groups_limit_positive CHECK (limit_pessoas IS NULL OR limit_pessoas >= 1)
);
CREATE INDEX groups_org_id_idx ON groups (org_id);
CREATE INDEX groups_release_id_idx ON groups (release_id);
CREATE INDEX groups_release_created_idx ON groups (release_id, created_at, id);   -- seq derivada (ordem de criacao)
CREATE INDEX groups_org_name_lower_idx ON groups (org_id, lower(name));           -- pre-provisionamento busca (idem F2 2.1.5)
CREATE INDEX groups_org_gid_lower_idx ON groups (org_id, lower(gid));             -- busca por GID (GroupSearch)

-- 006_groups.down.sql (reversivel; nenhum objeto referencia groups hoje)
DROP INDEX IF EXISTS groups_org_gid_lower_idx;
DROP INDEX IF EXISTS groups_org_name_lower_idx;
DROP INDEX IF EXISTS groups_release_created_idx;
DROP INDEX IF EXISTS groups_release_id_idx;
DROP INDEX IF EXISTS groups_org_id_idx;
ALTER TABLE groups DROP CONSTRAINT IF EXISTS groups_pkey;
DROP TABLE IF EXISTS groups;
```

### 2.1 Decisões técnicas do modelo

1. **`groups` como nome de tabela:** `GROUPS` é keyword **não-reservada** no PostgreSQL (utilizável sem aspas). Risco declarado quanto ao parser do pg-mem no §9; se rejeitar, o renome volta ao coordenador ANTES de aplicar (custo zero hoje).
2. **`release_id NOT NULL` + `org_id` denormalizado:** pertença exclusiva a uma campanha (ENT-04 [PROP]) vira FK obrigatória. `org_id` é tecnicamente derivável via release, mas é mantido (como toda tabela first-class do produto) para escopo tenant **sem join** na lista global da tela GroupSearch ("grupos que estão em alguma campanha deste cliente" = `WHERE org_id = $`). A FK **não** garante que o grupo é da mesma org que a release — a coerência `groups.org_id = releases.org_id` é imposta pela **validação da API** (§5, mesmo padrão D13 de `accountIds`); imposição por trigger é excluída (pg-mem). **`ON DELETE RESTRICT`:** não existe DELETE de release (D5), logo CASCADE×RESTRICT são indiferentes hoje; RESTRICT é escolhido por **segurança de dados** — se um dia houver delete de release, ele esbarrará na FK e forçará decisão explícita em vez de apagar silenciosamente contadores/auditoria de grupos.
3. **Contadores NOT NULL DEFAULT 0, sem mutador nesta fatia:** nascem 0; nenhum endpoint desta fatia os altera (mutações chegam com FLX/VGC). CHECKs de não-negatividade defendem o invariante no banco. `limit_pessoas` NULL = sem teto calculado (grupo nunca fica cheio pelo sinal automático).
4. **SEM coluna `cheio` e SEM coluna `seq`** — ambos **derivados na leitura** (§4; evita estado duplicado e renumeração). **SEM unique de `gid`** (nem de nome — D11): a unicidade de GID por org é inferência não observada; a amarra real (IMP-03, reimportar não duplica) pertence ao módulo IMP futuro — pendência §10. `gid` NULL admite múltiplas linhas NULL.
5. **Sem colunas de link, tipo, descrição, admins, reservas ou suspensão** — nada disso tem dado local hoje (§1).

---

## 3. Endpoints (todos exigem sessão válida; prefixo `/api/v1`)

Recurso novo em `api/src/routes/groups.ts`. Corpos JSON; **media type `application/json` obrigatório em TODA mutação (D6 herdado, guard `preParsing`, sem ajustes)**; respostas de sucesso sem envelope de erro. Sem sessão → `401 AUTH_UNAUTHENTICATED` em todos.

**Escolha registrada — recurso PLANO `/api/v1/groups` (e não aninhado `/releases/:releaseId/groups`):** (i) a tela GroupSearch exige lista **global por org** (sem releaseId) — um recurso só aninhado não a serve, e duplicar famílias de rota cria superfície sem capacidade nova; (ii) todas as mutações por id (`PATCH`, ações, eventual DELETE) são achatadas por natureza (id globalmente único) — aninhar só o POST criaria assimetria; (iii) a validação do pai (`releaseId` existe + mesma org → senão `400` genérico) reutiliza o padrão D13 de referência por body, já testado; (iv) precedente do repo: todos os recursos são planos (`/accounts`, `/releases`). `releaseId` viaja no body do POST e como filtro opcional na lista.

### 3.1 Forma do recurso (JSON camelCase; vocabulário DEC-06 — D-PEND-4)

```json
{
  "id": "uuid",
  "releaseId": "uuid",
  "name": "string",
  "gid": "string | null",
  "seq": "int | null",       // derivado (§4.2); null em listas sem releaseId unico
  "clicks": 0,
  "participants": 0,
  "limitPessoas": null,     // SEM teto por default; valor ilustrativo 350 (CRG-06) NUNCA é default (parecer A4, ressALVA 2)
  "cheioManual": false,
  "cheio": true,              // DERIVADO, somente leitura (§4) - nunca aceito em body
  "createdAt": "ISO-8601 UTC",
  "updatedAt": "ISO-8601 UTC"
}
```

Respostas de recurso único retornam o objeto direto (flat — F2 §3.1). Nada além disso (sem link, tipo, métricas, reserva, suspensão — §1).

### 3.2 Tabela de endpoints

| Método/rota | Entrada | Sucesso | Efeitos e regras |
|---|---|---|---|
| `POST /api/v1/groups` | `{releaseId, name, gid?, limitPessoas?}` | `201` + recurso | Cria registro **local** com `org_id` da sessão; `clicks=0`, `participants=0`, `cheioManual=false`; `gid:null`, `limitPessoas:null` quando ausentes. `releaseId` validado (existe + mesma org → senão `400` genérico, §5). **Não** cria grupo real, link, ação, sessão nem métrica (DIR-04/DIR-06; teste T1). Criar grupo em release **arquivada** não é bloqueado (sem amarra — mesmo precedente F4 §3.1). |
| `GET /api/v1/groups?releaseId=&search=&cheio=&page=&pageSize=` | query opcional | `200 {items,total,page,pageSize}` | Escopado por org da sessão. `releaseId` ausente = **todos os grupos da org** (busca global GroupSearch). `cheio` ∈ {`todos`(default/ausente), `sim`, `nao`} — predicado derivado do §4. `search`: substring CI em `lower(name)` **OU** `lower(gid)`, curingas do termo escapados (F2 §3.2). Ordenação fixa `created_at DESC, id DESC`. `seq` nos itens: preenchido quando a lista filtra **um único** `releaseId`; senão `null` (§4.2). COUNT+SELECT na mesma transação de leitura (F2 §9.1). |
| `GET /api/v1/groups/:id` | — | `200` + recurso | `:id` UUID da própria org; senão `404` genérico byte a byte (§5). `seq` sempre computado (§4.2). |
| `PATCH /api/v1/groups/:id` | `{name?, gid?, limitPessoas?}` (≥1 campo) | `200` + recurso | Edita **somente o registro local** (nenhum efeito externo; GRU-07 é fila futura). `gid:null` limpa; `limitPessoas:null` remove o teto. `releaseId`, `clicks`, `participants`, `cheioManual`, `cheio`, `seq`, `id`, `org_id` em body → campo desconhecido → `400`. `updated_at` sempre atualizado. |
| `POST /api/v1/groups/:id/mark-full` | corpo vazio ou `{}` | `200` + recurso com `cheioManual:true` | **Ação idempotente (D12):** repetir → `200`. Mexe SOMENTE em `cheio_manual`/`updated_at` — contadores e demais campos intocados (GRU-04; T4). **Não** dispara gatilho (§0.2.3). |
| `POST /api/v1/groups/:id/mark-not-full` | corpo vazio ou `{}` | `200` + recurso com `cheioManual:false` | Idem; se o teto continua atingido, `cheio` devolvido segue `true` (DEC-06 legado regra 2 — OR, T11). |
| `DELETE /api/v1/groups/:id` | — | `204` sem corpo | **D16 RATIFICADA (§0.1) — ATIVO:** hard delete da linha local; dependências futuras (reservas/eventos) esbarrarão em FK quando existirem. Repetir → `404` genérico byte a byte. **Sem massa em qualquer caso (D10 + D15 + D16).** Efeito declarado (§9.7): ordinais `seq` posteriores na release DECRECEM (derivação sem coluna). |
| ~~`POST /api/v1/groups/mark-full-bulk`~~ | — | — | **FORA nesta fatia (D10 / D-PEND-1):** A2 itera ações por id. Semântica pronta para contrato futuro (§0.1). |
| ~~`GET /api/v1/groups/export.csv`~~ | — | — | **FORA nesta fatia (D-PEND-3):** colunas dependem de DEC-05. |

### 3.3 Validações (defaults provisórios — D-PEND-4; DEC-12 aberta)

| Campo/param | Regra | Erro |
|---|---|---|
| `releaseId` (POST) | obrigatório; string UUID; deve existir E pertencer à mesma org da sessão | ausente/não-UUID/inexistente/alheio → `400 VALIDATION_ERROR fields ["releaseId"]` com **mensagem genérica** (não revela qual nem por quê — padrão D13) |
| `name` (POST/PATCH) | string; trim antes de validar/gravar; 1..120 pós-trim; obrigatório no POST | `400` (details lista campos) |
| `gid` (POST/PATCH) | opcional; string; trim; 1..120 pós-trim; `null` explícito limpa; ausente = não mexe; sem validação de formato (formato de GID não é especificado — não inventar) | `400` com `fields ["gid"]` |
| `limitPessoas` (POST/PATCH) | opcional; inteiro 1..100000; `null` explícito remove o teto; ausente = não mexe | `400` com `fields ["limitPessoas"]` |
| `search` | trim; vazio ⇒ sem filtro; ≤120 | `400` se exceder |
| `cheio` (query) | literal `todos` \| `sim` \| `nao`; ausente ⇒ `todos` | `400` se outro valor |
| `releaseId` (query) | opcional; UUID; **bem-formado mas inexistente/alheio ⇒ `200` com `items:[]`,`total:0`** (filtro sem correspondência honesto; não vaza existência — alternativa 404 foi avaliada e rejeitada: filtro ≠ acesso a recurso). **PADRÃO NOVO no produto (parecer A4, ressALva 3) — comunicado à A2:** lista vazia com `releaseId` válido ≠ id errado (typo é coberto pelo `400` de malformado); vale para futuros filtros por referência | malformado → `400` |
| `page`/`pageSize` | ≥1 default 1; 1..100 default 20; sem clamp silencioso | `400` |
| `:id` | UUID | malformado → `400` (independente de tenant); bem-formado desconhecido/alheio → `404` genérico |
| body (POST/PATCH) | `additionalProperties: false` | desconhecido — inclui `org_id`, `id`, `seq`, `clicks`, `participants`, `cheio`, `cheioManual`, `releaseId` (no PATCH) — → `400` |
| body das ações (mark-full/mark-not-full) | **DECISÃO DE CONTRATO (emenda pós-auditoria; prática real herdada da F3 §3.4 — archive/unarchive idem):** o corpo **não é lido** — sem schema, sem `additionalProperties`; corpo ausente é aceito com `Content-Type: application/json` (parser escopado da F3); qualquer propriedade enviada é **ignorada** (nem `org_id`/`clicks` em body de ação gera erro). Consistência com a F3 preferida a prometer `additionalProperties:false` que o código não aplica. | sem erro de corpo válido/inválido; o guard D6 (media type ≠ json) segue obrigatório → `400 fields ["content-type"]` |

### 3.4 Content-Type guard (D6) — herdado sem alteração

As mutações (POST, PATCH, mark-full, mark-not-full, DELETE — D16 ativa; DELETE sem corpo também passa pelo guard por uniformidade) usam o guard `preParsing` da F2: media type ≠ `application/json` (parâmetros aceitos) ou ausente → `400 VALIDATION_ERROR` antes do parser. Teste T13.

---

## 4. Campos derivados — `cheio` e `seq` (NENHUM é armazenado)

### 4.1 `cheio` (DEC-06 legado, §0.2 — expressão de leitura)

```
cheio = cheioManual OR (limitPessoas IS NOT NULL AND participants >= limitPessoas)
```

- Computado em toda resposta e usado como predicado do filtro `cheio=sim|nao` (`NOT (...)` para `nao`). **Sem coluna materializada:** sem estado duplicado, sem job de sincronização, sem janela de inconsistência entre sinal manual e teto — a DEC-06 legado é uma função pura dos dois sinais no momento da leitura, exatamente "cada sinal basta".
- Filtro avaliado por expressão na query (sem índice dedicado — volumes atuais; §9).
- O **gatilho de borda** (disparar na passagem F=false→true, rearmando) **não existe nesta fatia** (§0.2.3): sem consumidor, nada transiciona. Quando AUT/FIL existirem, a detecção de transição exigirá histórico de estados/eventos — **pendência registrada (§10)**; o campo derivado puro é justamente o insumo que aquela fatia precisará.

### 4.2 `seq` — número sequencial por release, DERIVADO (decisão registrada)

Ordinal de criação **dentro da release** (1 = mais antigo), pela ordem estável `(created_at ASC, id ASC)`:

- **Lista com `releaseId` único:** 1 query ordinal por página — ids de TODOS os grupos da release ordenados ASC → mapa id→ordinal; itens da página recebem `seq` do mapa. Exato sob qualquer filtro/paginação (o ordinal não depende do filtro — é da release inteira). Escala declarada: nº de grupos da release (§9).
- **`GET /:id`, `PATCH`, ações, DELETE:** 1 query `COUNT` de predecessores do item na sua release — `WHERE release_id=$ AND org_id=$ AND (created_at < c OR (created_at = c AND id < i))` — predicados planos (sem row-constructor, sem `OVER` — pg-mem não parseia `OVER`, lição F2/F3); `seq = count + 1`.
- **Lista sem `releaseId` (busca global):** `seq: null` — a tela GroupSearch não exibe número sequencial (colunas atuais: Grupo/Participantes/Conta/Campanha/Categoria/Criado em); computar ordinal por item em lista multi-release custaria N queries sem consumidor.
- **Por que derivada:** o DELETE da D16 (ativo) assume o custo documentado: **ordinais posteriores decrescem** após exclusão (§9.7 — sem renumeração armazenada, sem cascata a cada inserção: novo grupo entra no fim e **não renumera** existentes (T12)). Armazenar `seq` criaria renumeração em cascata a cada inserção/delete e estado a desincronizar — mesmo argumento do §4.1. Numeração configurável por template ("início da contagem", CRG-05) é pendência do módulo CRG (§10).

---

## 5. Tenant (ENG-02) + validação da release da mesma org

- `org_id` deriva **sempre** de `req.user.orgId`; toda query carrega `WHERE org_id = $...`; UPDATEs das ações e do PATCH têm a org **no próprio predicado** (nunca "busca e atualiza" em dois passos sem tenant). DELETE (se ratificado) idem.
- `GET`/`PATCH`/ações/DELETE por id de recurso de outra org ou inexistente → `404` com corpo **TENANT_FORBIDDEN genérico, byte a byte idêntico** ao de id inexistente (F2 §4 — não vaza existência).
- **POST com `releaseId` de outra org ou inexistente → `400 VALIDATION_ERROR fields ["releaseId"]` genérico** (espelho D13 de `accountIds`: referência por body falha na validação de domínio, não no lookup de recurso; mensagem não revela se o id existe nem de quem é). Essa validação roda **dentro da transação** do INSERT (janela de corrida FK residual documentada como a F3 §9.10.i — inofensiva enquanto não há DELETE de release).
- **Lista com `releaseId` alheio/inexistente → `200` vazio honesto** (§3.3): filtro sem correspondência; zero vazamento (org sem grupos na própria release também devolve vazio).
- `org_id`/`id` em body/query nunca confiados (campo desconhecido → 400).
- **Testes cruzados com 2 orgs são obrigatórios** (T6), incluindo release alheia como filtro e como referência de POST, e snapshot antes/depois provando que nada foi alterado pelas chamadas negativas.

---

## 6. Testes dirigidos (suíte offline pg-mem; fixtures 2 tenants — herda helpers F1/F2)

Arquivo: `api/test/groups.test.ts` (+ extensão de `migrations.test.ts` e ajustes aditivos declarados). Todos via `fastify.inject()`, sem porta/rede/Docker; dados 100% sintéticos; org A + dono A e org B + dono B com os dois cookies.

| # | Caso | Esperado |
|---|---|---|
| T1 | CRUD feliz + ações: POST `{releaseId,name,gid,limitPessoas}` → `201` com shape §3.1 (`clicks:0`, `participants:0`, `cheioManual:false`, `cheio` coerente com §4.1, `seq` correto); lista contém o item e `total` reflete; GET/:id devolve igual; PATCH `{name,gid,limitPessoas}` → 200 refletido; mark-full → `200` `cheioManual:true`; mark-not-full → `200` `cheioManual:false`. Criação **não gera** grupo real/link/ação/sessão (contagens de `sessions` e de linhas em `releases`/`accounts` inalteradas — análogo CTA-03). | conformidade exata de shape/status |
| T2 | Validações: `name` vazio/só espaços/121 → 400; `gid` 121 → 400; `limitPessoas` 0/negativo/não-inteiro/100001 → 400; `releaseId` ausente/não-UUID/inexistente/**de outra org** → 400 `fields ["releaseId"]` genérico; `cheio=xyz` na query → 400; `releaseId` malformado na query → 400; `page=0`,`pageSize=101` → 400; PATCH `{}` → 400; desconhecidos no body (`clicks`,`participants`,`cheio`,`cheioManual`,`seq`,`releaseId` no PATCH, `org_id`,`id`) → 400 com details; `:id` malformado → 400. | envelope Fundação em todos |
| T3 | **Filtros `cheio` × DEC-06 legado:** fixtures — G1 manual=true, teto nulo (cheio **por manual**); G2 manual=false, participants<limite (não cheio); G3 manual=false, participants≥limite (cheio **por teto**); G4 manual=true E participants≥limite (ambos); G5 manual=false, teto nulo (não cheio). `cheio=sim` → {G1,G3,G4}; `cheio=nao` → {G2,G5}; ausente/`todos` → 5; `total` = contagem filtrada em todos; **regra 2:** mark-not-full em G4 → resposta com `cheio:true` (teto ainda atingido) e G4 permanece em `sim`; página além do fim → `items:[]` com `total` preservado; ordenação `created_at DESC` estável (desempate `id`). | coerência manual-OU-calculado |
| T4 | **GRU-04 dirigido (P4 §D1):** snapshot campo a campo antes/depois de mark-full e mark-not-full — `clicks`, `participants`, `limit_pessoas`, `name`, `gid`, `release_id`, `created_at` **idênticos**; somente `cheio_manual`/`updated_at` mudam; oráculo SQL confirma contadores intocados. | marcar manual NÃO altera contagens |
| T5 | Busca: nomes/GIDs com caixa variada; `search` CI por substring em name **OU** gid (ex.: termo que só casa GID); curingas `%`/`_` no termo tratados literalmente (escape F2 §3.2, ressalva pg-mem herdada); termo >120 → 400; vazio ⇒ sem filtro. | asserts nominais |
| T6 | Cruzado (TEN-01): grupo criado em A (release de A); org B faz GET/:id, PATCH, mark-full, mark-not-full, DELETE com esse id → **404 TENANT_FORBIDDEN byte a byte igual ao de UUID inexistente**; B faz POST com `releaseId` de A → **400 genérico** (não vaza existência da release); B lista com `releaseId` de A → `200 {items:[],total:0}`; snapshot antes/depois: nada de A nem B alterado pelas negativas. | isolamento leitura+escrita+ações+referência |
| T7 | Sem sessão: todas as rotas (POST, lista, GET/:id, PATCH, 2 ações, DELETE) sem cookie → `401 AUTH_UNAUTHENTICATED`. | envelope Fundação |
| T8 | Persistência (PER-01): após POST/PATCH/ações, re-instanciar app/Pool sobre a mesma store e reler por **oráculo SQL direto** em `groups`; conferência campo a campo (incl. `cheio_manual` pós-ação e contadores intactos); `cheio`/`seq` NUNCA gravados (colunas inexistentes no oráculo). | releitura ≠ própria resposta |
| T9 | Migração (MIG-01): up → status (6 aplicadas) → up idempotente → down (006) → `groups` ausente, demais intactas → up re-aplica. | reversível |
| T10 | Regressão (REG-01): suíte integral vigente (**70/70, 7 arquivos, na data da F4**) roda sem regressão junto com a nova; gates `typecheck`/`test`/`build`/`audit` após o último diff. Ajustes aditivos declarados: migrações 5→6 em `migrations.test.ts`; conjunto de tabelas do CTA-03 (`accounts.test.ts` T5) 7→8 incluindo `groups` (padrão F3 §9.10.ii). | sem regressão |
| T11 | Idempotência das ações (D12): mark-full em já-cheio-manual → 200 `cheioManual:true` (sem 409/422); mark-not-full idem; sequência full→not-full→full termina `true`; `updated_at` monotônico não-decrescente; nenhum outro campo muda (comparação campo a campo). | ações idempotentes |
| T12 | `seq` derivada: 3 grupos numa release (ordem de criação) → seq 1,2,3 na lista com `releaseId`; 4º grupo criado depois → seq 4 e **ordinais dos anteriores inalterados**; GET/:id devolve `seq` individual; lista **sem** `releaseId` → todos os itens com `seq:null`; filtro `cheio` não perturba ordinais; grupos de outra release da mesma org têm ordinal independente (1,2,... da própria release). | derivação exata, sem renumeração |
| T13 | Content-Type guard (D6): POST/PATCH com `text/plain` e `application/x-www-form-urlencoded` → 400 `VALIDATION_ERROR` (fields `content-type`); PATCH sem header → 400; **ações com `application/json` e corpo ausente → 200**; `application/json; charset=utf-8` → aceito. | guard uniforme nas rotas novas |

**Smoke E2E (orquestrador, API real, dados sintéticos — E2E-01):** login → criar release → criar 3 grupos (1 com limite baixo) → lista `?releaseId=` com `cheio=todos|sim|nao` coerente → mark-full num grupo → recarregar (F5) e o `cheioManual` **persiste** com contadores intactos → busca por GID encontra o grupo → **cruzado:** org B não vê nenhum grupo de A (lista global vazia; 404 por id).

---

## 7. Mapeamento com a MATRIZ-VALIDACAO

| Critério | Como esta fatia atende | Evidência |
|---|---|---|
| **TEN-01** | T6: cruzado em leitura/escrita/ações/referência (`releaseId` alheio → 400 genérico; filtro alheio → vazio honesto), 404 byte a byte, snapshot antes/depois; org no predicado de todo UPDATE (§5). | L |
| **ERR-01** | Tabela entrada→esperado por endpoint (T2/T6/T7) com asserts de status/corpo/envelope herdado; nenhum código novo. | E+L |
| **PER-01** | T8: reabertura de Pool/app + oráculo SQL independente. Reinício real de processo segue como evidência H em ambiente autorizado (limitação pg-mem herdada). | L |
| **UI-01** | Backend fornece os estados: vazio (`items:[]`, `total:0` — o "nenhum registro" do GRU-02), preenchido (lista com filtros), erro (envelope). Telas são da A2 (lista da campanha + GroupSearch global). | L (A2) |
| **E2E-01** | Roteiro S do §6 (login → criar → filtrar → marcar cheio → persistir → buscar por GID → cruzado). Evidência H colhida pelo orquestrador em ambiente autorizado. | H (orquestrador) |
| **REG-01** | T10: suíte integral (70/70) + gates após o último diff, inventário nominal e exit codes; ajustes aditivos declarados. | L |

---

## 8. Plano de rollback

- `006_groups.down.sql` dropa `groups` — **destrutivo por definição** (registros e contadores somem). **Sempre** dump antes; preferir **correção para frente** (migração nova) conforme Fundação §7; `down` só com ordem do orquestrador, congelamento de deploys e verificação `status` + healthcheck + smoke autenticado após.
- **Nenhum objeto referencia `groups` hoje** (sem FKs entrantes, sem junções) — o down não encontra dependências.
- Rollback do *código* independe do schema (rotas somem; tabela órfã sem leitores é inócua) — reverter PR sem reverter migração é seguro, idem F2/F3 §8.

---

## 9. Riscos e limitações declarados

1. **pg-mem × keyword `GROUPS`:** não-reservada no PostgreSQL real, mas o parser do pg-mem pode rejeitar o identificador. Detectado no primeiro `up` do T9; se falhar, o renome da tabela (ex.: `whats_groups`) volta ao coordenador **antes** de qualquer aplicação — custo zero enquanto nada está aplicado.
2. **pg-mem ≠ PostgreSQL real** (herdado): sem triggers/functions; busca com escape default do LIKE (ressalva `ESCAPE` F2 §9.1); sem funções de janela (`OVER`) — por isso `seq` usa mapa ordinal/`COUNT` com predicados planos (§4.2) e a lista usa transação explícita de leitura.
3. **Contadores sempre 0 nesta fatia:** sem mutadores (fluxo de clique/entrada é FLX/VGC futuro), a tela da A2 exibirá zeros honestos — DIR-04; não falsificar (o legado local `store.tsx` tem `participants` sintético — não migrar, idem F2/F3).
4. **Escala do mapa ordinal de `seq`** (§4.2): 1 query que materializa todos os ids da release por página. Adequado a dezenas/centenas de grupos por campanha (perfil do produto); revisitável com coluna materializada se algum release atingir milhares (mesmo formato de gatilho do §2 da F4).
5. **Filtro `cheio` sem índice dedicado:** predicado derivado avaliado na query; volumes atuais pequenos; índice parcial (`WHERE cheio_manual`) só cobre metade do OR — sem ganho real; reavaliar com medição.
6. **`cheio` derivado não guarda histórico:** a DEC-06 legado exige gatilho de **borda** (false→true) que precisa de transição observada; sem AUT/FIL não há consumidor, mas a fatia futura deverá adicionar registro de eventos/transições — não reutilizar `updated_at` para isso (impreciso). Pendência §10.
7. **DELETE (D16 ativa) decrementa ordinais `seq` posteriores na release** — consequência inevitável da derivação sem coluna; efeito REAL (não hipotético — parecer A4, ressALva 4) e declarado: sem consumers de `seq` no servidor hoje, o impacto é só visual. **A A2 não deve tratar o número sequencial da linha como identidade estável entre exclusões** (usar `id`).
8. **`org_id` denormalizado pode divergir por SQL direto** (a FK não cruza tabelas): a API impõe a coerência (§5); operação manual fora da API é fora de contrato.
9. **Corrida FK residual × future delete de releases:** validação de `releaseId` dentro da transação; captura de FK 23503 → `400 fields ["releaseId"]` quando release-delete existir (mesma nota F3 §9.10.i).
10. **Sem "Suspenso", sem link, sem tipo, sem export** (§1) — a A2 não deve exibir colunas/dados que o servidor não tem (DIR-04).

---

## 10. Pendências que dependem de decisão/fatia futura

| Item | Situação |
|---|---|
| **DEC-05** (Redirect × Cliques reais) | **ABERTA — parecer A4 (D-PEND-5).** Contadores já separados; se "Redirect" for 3º contador distinto → migração aditiva futura. Exibição "x/limite" é da A2, sem semântica de servidor. |
| **DEC-06 (gatilho "encher grupo")** | **Aberta quanto ao gatilho** (amarra de classificação já aplicada, §0.2): disparo de borda exige módulo AUT/FIL + registro de transições; colunas atuais são o insumo. |
| **DEC-12** (limites de campos) | **ABERTA** — defaults provisórios do D-PEND-4 (120/120/100000 etc.) ratificáveis pelo coordenador. |
| **D-PEND-1** (massa mark-full) | **RESOLVIDO pela D15** (sem massa; A2 itera por id). Semântica bulk fica registrada para contrato futuro. |
| **D-PEND-2** (DELETE por id) | **RESOLVIDO pela D16** (ratificado e ATIVO: 204; repetição → 404; massa sempre fora). |
| **D-PEND-3** (Export CSV — GRU-01) | **RESOLVIDO pela D17** (adiado até DEC-05 definir colunas). Toolbar toda pulada. |
| **ENT-04 [PROP] link próprio 1:1** | **PENDENTE de DEC-11** (parecer A4, recomendação 3): a pertença exclusiva a uma campanha JÁ é FK obrigatória (`release_id`); o link 1:1 do grupo vem com o link de convite/DEC-11 (FLX) — sem coluna hoje (§2.1.5). |
| **"Suspenso"** (GRU-02) | **BLOQ-EXT** — origem provedor (NT); sem estado local; quando houver integração, volta como campo+filtro. |
| **Unique de `gid`** | Adiada para o módulo **IMP** (amarra real: IMP-03 reimportar não duplica); hoje sem unique (D11 estendida). |
| **Reservas (GRU-10)** | Sem consumidor (FLX futuro); tabela de reservas na fatia do link único/distribuição. |
| **`seq` por template (CRG-05/CRG-12)** | Numeração com "início da contagem"/renumeração é do módulo CRG; `seq` derivado é a forma zero-invenção atual. |
| **GRU-07 (edição gera ação na fila)** | Dependência **FIL**; PATCH local já existe sem ação — decidir na fatia da fila. |
| **DELETE de release × grupos** | Inexistente (D5); FK RESTRICT (§2.1.2) força decisão explícita no futuro. |

**Nenhuma pendência bloqueia a fatia** — D-PEND-1/2/3 resolvidos por D15/D16/D17, D-PEND-4 segue provisório (DEC-12 aberta), D-PEND-5 respondido pelo parecer A4; o núcleo (modelo + lista/filtros/busca + cheio manual×calculado + DELETE D16) independe de todas.

---

**Data:** 08/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/grupos` (base `main` d408657) · **Status:** contrato documental **aplicado** — implementação liberada pelo parecer A4 (ADERENTE) com as decisões D15–D18 do coordenador ativas (§0.1).
