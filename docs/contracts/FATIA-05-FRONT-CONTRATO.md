# CONTRATO FRONT — FATIA 5: GROUPSEARCH (GRUPOS)

> **Status:** implementado (front-only). **Branch:** `a2/grupos` (base `main` d408657). **Autor:** A2 Front. **Data:** 08/11/2026.
> **Base:** `docs/contracts/FATIA-05-GRUPOS-CONTRATO.md` (A1, worktree `sendflow-wt-a1`) — endpoints/shape §3, cheio derivado §4/§0.2, tenant §5.
> **Arquivos de código:** `app/src/lib/api.ts` (namespace `groups`), `app/src/types.ts` (`GroupApi`), `app/src/pages/GroupSearch.tsx`. **Zero mudança** em `app/src/styles/**`, `store.tsx`, `Overview.tsx`, demais páginas e `/api`.

## 1. Escopo

Tela `GroupSearch` migra do store local para a **lista global por org** `GET /api/v1/groups` (sem `releaseId` — a tela nunca teve filtro de release e **não** ganhou um; sem UI nova).

- **Busca:** `search` com debounce 400 ms + Enter (padrão F3/Campaigns). O servidor casa substring CI em `name` **OU** `gid` (A1 §3.2) — o placeholder "Nome do grupo ou GID" passa a ser verdadeiro (o legado filtrava só `name`: o `GroupItem` local não tinha gid).
- **Filtro cheio:** a tela **não tem** (Todos/Cheios/Não cheios) e **não** foi adicionado. `cheio: 'sim' | 'nao'` existe no namespace para a fatia da lista de grupos por campanha. "Suspenso": BLOQ-EXT, fora.
- **Ordenação:** o select existente (Mais recentes/Mais antigos) é aplicado **no cliente sobre a página** (servidor ordena fixo `created_at DESC, id DESC` — A1 §3.2): `recent` = como vem; `old` = página invertida. **Não é reordenação global** — declaração de escopo. No legado a opção "Mais antigos" não tinha efeito (`byCreatedDesc` incondicional).
- **Paginação/total:** `page`/`pageSize=12` pelo servidor; `total` vem da API (rege o estado vazio). A tela nunca teve pager próprio e **não** ganhou (sem botões novos — registrado §6).
- **Colunas mantidas 1:1:** Grupo = `name` · Participantes = `participants` (**0 honesto** — sem mutadores nesta fatia, A1 §9.3; o `participants` sintético do store NÃO foi migrado) · Conta = `—` e Categoria = `—` (o recurso do servidor não tem esses campos — DIR-04; "Grupo normal" só quando houver campo/decisão) · Campanha = nome da release resolvido por `releases.list` (mapa id→nome da 1ª página; 100 = `pageSize` máximo do servidor — além disso `—`; sem join no servidor nesta fatia; falha nesse fetch **não** derruba a lista de grupos) · Criado em = `createdAt`.
- **Tela permanece somente leitura+busca** (o que sempre foi): **nenhum botão de ação por linha adicionado** — sem marcar/desmarcar cheio, sem editar, sem excluir. `markFull`/`markNotFull` (idempotentes, D12; mexem só em `cheioManual`/`updatedAt` — GRU-04), `create`, `update` e `remove` (D16, 204) existem no namespace `groups` e serão consumidos pela fatia da **lista de grupos por campanha** (GRU-03/04/05). D15: sem endpoint em massa — quando houver seleção real, iterar por id.
- **`cheio` derivado (manual OU limite):** o front **nunca recomputa** — quando exibir, lê o campo derivado do servidor; `cheio` nunca é enviado em body (A1 §3.1).
- **Help text:** a frase do legado sobre busca "com 3 caracteres ou mais" foi removida — prometia comportamento que a API não tem (DIR-04). Nenhuma promessa nova.

## 2. Namespace `groups` (lib/api.ts)

`list({releaseId?, search?, cheio?: 'sim'|'nao', page?, pageSize?})` — `releaseId` ausente = lista global; `search` com trim; `cheio` ausente = todos (o literal `'todos'` nunca é enviado) · `create({releaseId, name, gid?, limitPessoas?})` · `get(id)` · `update(id, {name?, gid?, limitPessoas?})` · `markFull(id)`/`markNotFull(id)` (POST corpo `{}` — D6) · `remove(id)` (DELETE com header `Content-Type: application/json` explícito: o guard D6 do A1 §3.4 exige media type mesmo sem corpo; `204` → void). Tipo `GroupApi` conforme A1 §3.1.

## 3. Estados (todos honestos, classes existentes — zero estilo novo)

- **Carregando (1ª carga):** `gs-empty` "Carregando…"; recargas (nonce) mantêm a tabela sem piscar.
- **Erro de lista:** `gs-empty` com `errorText` (`NETWORK_ERROR`/`TIMEOUT`/`BAD_ERROR_BODY`/`INTERNAL_ERROR` → mensagens do padrão F3) + botão **"Tentar novamente"** (classe global existente `acc-outline`).
- **Vazio:** `gs-empty` original "Nenhum grupo encontrado." — `items:[]` do servidor (o "nenhum registro" do GRU-02); busca sem resultado cai no mesmo estado.

## 4. Smoke (roteiro orquestrador — API real, dados sintéticos; a tela cobre leitura, as mutações rodam pelo namespace/API)

1. **S1** login org A → criar release → `groups.create({releaseId, name, gid, limitPessoas})` → `201` com `clicks:0`, `participants:0`.
2. **S2** tela GroupSearch: buscar por nome → grupo aparece; Participantes `0` (honesto), Campanha = nome da release, Criado em preenchido.
3. **S3** buscar por GID → mesmo grupo (busca name OU gid no servidor).
4. **S4** `groups.markFull(id)` → resposta `cheioManual:true`; releitura (F5): `cheio:true` e **contadores intactos** (`participants`/`clicks` unchanged — GRU-04). Sem efeito visível nesta tela (coluna cheio não existe — registrado).
5. **S5** recarregar a tela → dados persistem (PER-01 no servidor).
6. **S6** org B cria grupo na própria release → busca de A **não** mostra grupo de B e vice-versa (lista org-scoped; padrão A1 §5).
7. **S7** API caída → erro honesto + "Tentar novamente".
8. **Excluir: NÃO aplicável à UI** (tela sem fluxo de exclusão desde a origem); `remove()` (D16) fica para a fatia consumidora.

## 5. types.ts

`GroupApi` adicionado; `GroupItem` **mantido** (store/Layout ainda usam — não tocados, instrução §4).

## 6. Fora de escopo

- **Toolbar GRU-01** (criar/importar/atualizar links/exportar) — export CSV é **D17**: pende DEC-05 (colunas).
- **Ações em massa (D15)** — sem endpoint (D10); sem UI de seleção "Selecionar tudo".
- **"Suspenso" (BLOQ-EXT)** — origem provedor; sem filtro/coluna.
- Link de convite, "Redirect x/limite" (DEC-05), tipo "Grupo normal", `seq` (null na lista global — A1 §4.2), gatilho "encher grupo", reservas.
- Filtro de release, filtro cheio, pager e contador visível na GroupSearch (a tela não tem; sem UI nova).
- Overview, store, demais páginas: intocados.

## 7. Decisões D15–D18

- **D15:** sem operação em massa — A2 itera `mark-full`/`mark-not-full`/`remove` **por id** quando houver seleção real.
- **D16:** `DELETE /api/v1/groups/:id` existe (`204`, hard delete local; massa nunca).
- **D17:** export CSV de grupos pende DEC-05 — fora desta fatia.
- **D18 (registrada aqui):** `cheio` é **sempre** o campo derivado do servidor (`cheioManual` OU `participants ≥ limitPessoas` — DEC-06 legado, A1 §0.2/§4.1); o front não recomputa, não infere e nunca envia `cheio` em body.

## 8. Gates

`npx tsc --noEmit` (0) · `npm run build` (ok) · `git diff main -- app/src/styles` **VAZIO** · arquivos: `GroupSearch.tsx`, `lib/api.ts`, `types.ts` (+ este contrato).

## 9. Riscos conhecidos

- Coluna Campanha `—` além de 100 releases (mapa da 1ª página) — gatilho de revisão: endpoint com join ou mapa paginado.
- Contadores sempre 0 até FLX/VGC (DIR-04) — zeros honestos, não o sintético do store.
- Ordenação "Mais antigos" é só dentro da página (herança do legado sem pager/sort global) — global depende de ordenação no servidor (contrato futuro).
