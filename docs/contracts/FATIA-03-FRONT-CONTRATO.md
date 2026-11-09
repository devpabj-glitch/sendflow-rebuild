# CONTRATO DE INTEGRAÇÃO FRONT — FATIA 3: CAMPANHAS (tela de Campanhas na API /releases)

> **Status:** IMPLEMENTADO (registro pós-código, padrão da Fatia 2).
> **Fonte de verdade dos endpoints:** **D13 do dono (ordem direta, 08/11/2026)** — seguir EXATAMENTE a API original SendFlow: recurso `/releases` com tipos `'WhatsRelease' | 'WhatsList' | 'WhatsViralCampaign'` (não existe "Aleatório") e shape `{id, name, type, projectId: string|null, archived: boolean (default false), accountIds: string[], createdAt, updatedAt}`.
> **Divergência registrada:** o contrato A1 `docs/contracts/FATIA-03-CAMPANHAS-CONTRATO.md` (worktree `sendflow-wt-a1`) disponível na data desta fatia ainda é o **rascunho pré-D13** (enum pt-BR `campanha|lista|campanha_viral|aleatorio` + `status: ativa|arquivada`, sem §0.2). **A D13 prevalece** sobre qualquer trecho divergente daquele documento; ao A1 atualizar o contrato para a API `/releases`, este front já está alinhado.
> **Escritor único:** A2 (Front) em `app/src`. **Branch:** `a2/campanhas` (base `main` 743f06e). **Data:** 08/11/2026.
> Nenhum segredo/valor de variável aparece aqui (nomes só).

---

## 1. Escopo fechado

1. `app/src/lib/api.ts` — namespace `releases` tipado conforme D13: `list({search?, archived?, page?, pageSize?})` → `{items,total,page,pageSize}`; `create({name, type, projectId?, accountIds?})` → recurso flat; `get(id)`; `update(id, {name?, type?, projectId?, accountIds?})` (PATCH); `archive(id)` e `unarchive(id)` (POST, idempotentes — D12). **Sem `delete`** (D5). Tipos `ReleaseListQuery/ReleaseListResult/ReleaseCreateInput/ReleaseUpdateInput` no arquivo; `ReleaseApi`/`ReleaseType` em `types.ts` (importados).
2. `app/src/types.ts` — acrescentados `ReleaseType = 'WhatsRelease'|'WhatsList'|'WhatsViralCampaign'` e `ReleaseApi` (shape D13 exato). Tipos locais (`Campaign`, `CampaignStatus`, `CampaignMetrics`) **mantidos** — ainda usados por `store.tsx`, `Layout.tsx` (busca global) e `AccountsCampaigns.tsx`.
3. `app/src/pages/Campaigns.tsx` — troca do store local pelas chamadas da API (ver §3).
4. `app/src/pages/Overview.tsx` — card Campanhas lê `releases.list({page:1,pageSize:5})` (ver §4); Webhooks segue local.
5. `app/src/pages/AccountsCampaigns.tsx` e `app/src/store.tsx` — **INTOCADOS** (mapa Contas×Campanhas segue no store local; fatia futura).

### Fora de escopo (explícito)

- **ASC (associação campanha↔conta):** nenhum campo/fluxo novo de associação. O select "Conta associada" do modal legado **saiu** — os ids de conta do store local não são ids da API; mantê-lo enviaria dado falso. `accountIds` só é **exibido** como contagem real na linha do item.
- **PRJ (vínculo a projeto):** `projectId` existe no recurso e viaja nos tipos, mas a tela não cria UI para ele (nenhuma tela mostra projeto hoje).
- **Métricas/KPIs (DEC-14 aberta):** os 8 cards e a linha do item mostram zeros — **dado real** (nenhum evento existe); nenhum número inventado (DIR-04).
- **Arquivar em massa (D10):** sem seleção em massa — a tela legada **nunca teve** checkbox/botão de massa; nada foi desabilitado porque nada existia. Se um dia existir, iterar `archive(id)` por id.
- **DELETE (D5):** nenhum botão/fluxo de exclusão; a API não expõe.
- Detalhe de campanha/12 abas (CMP-07), períodos reais (CMP-04), migração de dados locais `localStorage` (decisão A1: sem migração), telas/estilos/classes/layout novos (zero diff em `app/src/styles` — verificado).

## 2. Arquivos tocados (lista final real — `git diff main --stat`)

| # | Arquivo | Ação |
|---|---|---|
| 1 | `app/src/lib/api.ts` | Namespace `releases` (6 funções) + tipos de query/resultado/entrada; `apiFetch` intocado — **D6 garantida** (Content-Type `application/json` sempre que há corpo; archive/unarchive enviam `'{}'`, como `authLogout`). |
| 2 | `app/src/types.ts` | +`ReleaseType`, +`ReleaseApi` (shape D13 exato). |
| 3 | `app/src/pages/Campaigns.tsx` | Rewiring de dados (ver §3). |
| 4 | `app/src/pages/Overview.tsx` | Card Campanhas → API (ver §4); estados extraídos para helper `cardOf` (sem classe nova). |
| 5 | `docs/contracts/FATIA-03-FRONT-CONTRATO.md` | Este documento. |

**NÃO tocados:** `store.tsx`, `AccountsCampaigns.tsx`, `data/seed.ts`, `styles/**` (diff vazio), demais páginas/componentes, `/api` (backend A1).

## 3. Campaigns.tsx — decisões de implementação

- **Fetch:** efeito em `[search, page, tab, nonce]`; `nonce` serve ao retry e ao refresh pós-criação/edição/arquivamento (a API é a fonte da verdade — sem atualização otimista). `pageSize=12` fixo da tela.
- **Abas → filtro de servidor (diferente da F2):** a API expõe `archived`. Campanhas = filtro **ausente** (todas); Ativas = `archived=false`; Arquivadas = `archived=true`. Rótulos visuais das 3 abas mantidos ("Campanhas/Ativas/Arquivadas").
- **Select de tipo (D13):** EXATAMENTE 3 opções — rótulos humanizados "Campanha" (`WhatsRelease`), "Lista" (`WhatsList`), "Campanha viral" (`WhatsViralCampaign`); **os valores enviados são os 3 exatos**. "Aleatório" não existe e não aparece. Default do modal de criação: `WhatsRelease`. Ao editar, o select mostra o valor real do servidor; valor fora da lista (não deveria ocorrer) cai no rótulo cru via fallback honesto.
- **Modal criar/editar:** `{name, type}` no POST; `{name, type}` no PATCH (só o que a tela edita — `projectId`/`accountIds` jamais são enviados, preservando os valores do servidor). Nome obrigatório (vazio não submete; trim). O select **Status** saiu do modal (a API não aceita `archived` no PATCH — status muda só por ação); o select **Conta associada** saiu (ASC futuro, dado local não é id da API).
- **Arquivar/desarquivar (D12):** ação por item, idempotente (`POST /:id/archive` | `/:id/unarchive`), no rodapé do modal de edição ("Arquivar"/"Desarquivar" conforme o estado real) — é a única via do legado para trocar status (contrato A1 §3.4) e o grid do item (`.acc-list li`, 4 colunas fixas no CSS) não comporta outro botão sem quebrar layout. Após a ação: modal fecha, lista relê do servidor.
- **Métricas (DEC-14 aberta):** os 8 cards e os `0 cliques` da linha mostram zeros — é o dado real (nenhum evento). O seletor de período 7/14/21/28/90 permanece visualmente (zero mudança de estilos); os valores não mudam porque não há evento por período. `percentual de entrada` = 0 pela fórmula existente (0 cliques).
- **Linha do item:** `{Tipo} · {Sem conta | N contas} · {0 cliques}` — `type` vira rótulo humano; `accountIds.length` é dado real da API (nomes de conta não são resolvíveis no front com dado honesto — ASC futura); rótulo de status `Ativa`/`Arquivada` derivado de `archived`.
- **Contador:** `{from}-{to} de {total}` usa `total`/`page` da resposta da API.
- **Busca:** debounce 400 ms + Enter confirma (padrão F2); termo trimado vai em `search`.
- **Ordenação:** select visual mantido; ordenação real é a fixa do servidor (`created_at DESC`), coerente com a única opção "Data de criação".
- **Histórico local:** `audit('Campanha criada/atualizada/arquivada/desarquivada', …)` com id real da API — feature local (fatia futura), comportamento preservado.

## 4. Overview.tsx — card Campanhas

- Lê `releases.list({page:1, pageSize:5})`: `value` = `String(total)` (o "0/∞" estático saiu — total puro, mesma decisão da F2 para Contas); conteúdo: vazio → "Nenhum registro encontrado"; com itens → nomes da 1ª página separados por " · "; carregando → "Carregando…"; erro → "Não foi possível carregar as campanhas." + "Tentar novamente".
- Card Contas: comportamento idêntico ao da F2 (helper `cardOf` compartilhado, sem mudança visual). Card Webhooks: intocado (local).

## 5. Estados UI contratados

| Estado | Apresentação (elementos/classes existentes) |
|---|---|
| Carregando (1ª carga) | `acc-empty` "Carregando…" (refetch mantém a lista anterior — dado real) |
| Erro de lista | `acc-empty` com texto por `ApiError.code` + botão `acc-outline` "Tentar novamente" |
| Vazio | `acc-empty` "Nenhum registro encontrado" (por aba/busca) |
| Salvando | botão "Salvar" desabilitado durante o envio; erro do salvar em `acc-note` com `role="alert"` dentro do modal |
| Ação de arquivar | botão "Arquivar/Desarquivar" desabilitado durante o envio; erro na mesma `acc-note` |

## 6. Roteiro de smoke (PENDENTE — orquestrador pós-merge, com API real; nada foi executado, nenhum mock)

Pré: API A1 no ar com `/api/v1/releases` conforme D13 (proxy Vite `/api`), migrações aplicadas, `GET /api/v1/health` 200; dados 100% sintéticos.

| # | Passo | Esperado |
|---|---|---|
| S1 | Login (conta sintética) | Sessão criada; navega para o app |
| S2 | Overview | Card Campanhas mostra `total` real e nomes da 1ª página |
| S3 | Campanhas → "+ Campanha": nome "Smoke Lista" + tipo **Lista** → Salvar | 201; item no topo com rótulo "Lista"; `total` soma; valor enviado é `type='WhatsList'` (aba Network) |
| S4 | Select de tipo | Exatamente 3 opções — Campanha, Lista, Campanha viral; **nenhuma "Aleatório"** |
| S5 | Buscar "smoke" (digitar e Enter) | Lista filtra por `search` no servidor; vazio honesto ao não achar |
| S6 | Editar nome → Salvar | PATCH `{name, type}` 200; nome atualizado; `projectId`/`accountIds` não enviados |
| S7 | Editar → "Arquivar" | Item sai de Ativas/Campanhas e aparece em Arquivadas com rótulo "Arquivada"; repetir a ação (desde Arquivadas → "Desarquivar") volta sem erro (idempotente, D12) |
| S8 | Abas | Campanhas = todas; Ativas = `archived=false`; Arquivadas = `archived=true` (query na aba Network) |
| S9 | F5 (recarregar) | Campanhas persistem (servidor é a fonte; nada vem do localStorage) |
| S10 | Parar a API → abrir Campanhas | Erro honesto + "Tentar novamente"; subir a API → retry recarrega |
| S11 | Verificar ausências | Nenhum fluxo de exclusão (D5); nenhuma seleção em massa (D10); métricas todas 0 (DEC-14); sem DELETE/massa na aba Network |

## 7. Decisões registradas / riscos

- **D13 (aplicada):** tipos exatos `WhatsRelease|WhatsList|WhatsViralCampaign` no select e no fio; sem "Aleatório". Rótulos visuais humanizados ("Campanha/Lista/Campanha viral") — apenas tradução de rótulo, valor intacto.
- **D5 (sem delete):** aplicada — nenhum fluxo de exclusão criado.
- **D10 (sem arquivar em massa):** aplicada — sem endpoint em massa e sem seleção em massa na tela (nunca existiu na tela legada; nada precisou ser desabilitado). Iteração por id fica registrada como caminho se massa um dia existir.
- **D12 (idempotência):** ações `archive`/`unarchive` repetidas tratam-se como sucesso; a UI depende do estado real devolvido pelo servidor (relê a lista após cada ação).
- **Risco 1 — contrato A1 desatualizado na data:** o documento do A1 ainda descreve a API pré-D13 (`/campaigns`, enum pt-BR, `status`). Se o backend entregar aquele shape, esta tela quebrará honestamente (erro de rede/validação), **não silenciosamente**. Alinhamento A1↔D13 é pré-condição do smoke.
- **Risco 2 — arquivar só via modal:** a ação é duas interações (Editar → Arquivar); um botão direto na linha exigiria 5ª coluna no grid CSS do item (proibido quebrar layout). Reavaliar com decisão de design na fatia de polimento.
- **Risco 3 — contagem sem nomes de conta:** `accountIds.length` mostra quantas associações existem, não quais (ids da API não são resolvíveis com o store local). Honesto e reversível na fatia ASC.
- **Risco 4 — seletor de período com zeros:** permanece visualmente (zero mudança de estilos); zeros são o dado real por período. Se a decisão de design for remover, é fatia de polimento.
- **Risco 5 — smoke pendente:** sem backend D13 no ar, nada foi executado; S1–S11 ficam para o orquestrador pós-merge (como nas Fatias 1/2). Nenhum mock apresentado como real.

---

**Data:** 08/11/2026 · **Autor:** A2 Front · **Branch:** `a2/campanhas` · **Status:** implementado; gates verdes; smoke pendente (§6).
