# CONTRATO DE INTEGRAÇÃO FRONT — FATIA 2: CONTAS (tela de Contas na API)

> **Status:** IMPLEMENTADO (registro pós-código, padrão da Fatia 1 §9).
> **Fonte de verdade dos endpoints:** `docs/contracts/FATIA-02-CONTAS-CONTRATO.md` (A1 Backend, worktree `sendflow-wt-a1`). Este documento não redefine endpoint, código de erro ou validação — apenas consome.
> **Escritor único:** A2 (Front) em `app/src`. **Branch:** `a2/contas` (base `main` d4907fa). **Data:** 08/11/2026.
> Nenhum segredo/valor de variável aparece aqui (nomes só).

---

## 1. Escopo fechado

1. `app/src/lib/api.ts` — namespace `accounts` tipado conforme contrato A1 §3.2: `list({search?,page?,pageSize?})` → `{items,total,page,pageSize}`; `create({name,type?,isSpy?})` → recurso flat; `get(id)`; `update(id,{name?,type?,isSpy?})` (PATCH). **Sem `delete`** (D5).
2. `app/src/pages/Accounts.tsx` — troca `data.accounts` (store local) pelas chamadas da API: carregamento, erro com retry, vazio, busca (debounce 400 ms; Enter confirma), paginação do contrato (`pageSize=12`, fixo da tela), criação/edição nos modais existentes (nome obrigatório, tipo, toggle conta espiã), contador = `total` da API. Sem exclusão (não existia na tela e não foi adicionada — D5).
3. `app/src/pages/Overview.tsx` — coluna Contas lê `accounts.list({page:1,pageSize:5})`: contador = `total`, itens = nomes da 1ª página ("·"-separados); Campanhas/Webhooks seguem locais (fatias futuras), valores inalterados.
4. `app/src/types.ts` — acrescentado `AccountApi` (id, name, type, isSpy, connectionStatus, createdAt, updatedAt) + `AccountConnectionStatus = 'nao_conectada'`. Tipos locais (`Account`, `AccountStatus`) **mantidos** (Layout, Campaigns, AccountsCampaigns, store ainda usam).
5. `app/src/store.tsx` — **intocado**. `data.accounts` tem outros consumidores além de Accounts.tsx (verificado: `Layout.tsx` busca global, `AccountsCampaigns.tsx`, `Campaigns.tsx`); Accounts.tsx apenas parou de consumir.

### Fora de escopo (explícito)

- **DELETE de conta (D5 do coordenador):** o endpoint nao existe nesta fatia (removido do contrato e do codigo A1). Nenhum botao ou fluxo de exclusao no front.
- **Webhooks/Campanhas/associações:** seguem no store local (futuras fatias). Nada migrado.
- Telefone da conta (campo não existe no servidor — A1 §1 "fora de escopo"); avatar real (BLOQ-EXT); conexão de número (CTA-06/DPR-06); migração dos dados locais de `localStorage` (decisão A1 §11: sem migração).
- Telas novas, estilos, classes, layout (zero diff em `app/src/styles` — verificado).

## 2. Arquivos tocados (lista final real — `git diff main --stat`)

| # | Arquivo | Ação |
|---|---|---|
| 1 | `app/src/lib/api.ts` | +33 linhas: `import type { AccountApi }`, tipos `AccountListQuery/Result/CreateInput/UpdateInput`, namespace `accounts` (list/create/get/update). `apiFetch` intocado — **D6 garantida**: já envia `Content-Type: application/json` sempre que há corpo (linha 41, herdado da Fatia 1). |
| 2 | `app/src/pages/Accounts.tsx` | Rewiring de dados (ver §3). |
| 3 | `app/src/pages/Overview.tsx` | Coluna Contas → API (ver §4). |
| 4 | `app/src/types.ts` | +16 linhas: `AccountConnectionStatus`, `AccountApi`. |

**NÃO tocados:** `store.tsx`, `data/seed.ts`, `styles/**` (diff vazio), demais páginas/componentes, `/api` (backend A1), `vite.config.ts`/`.env.example` (proxy da Fatia 1 serve).

## 3. Accounts.tsx — decisões de implementação

- **Fetch:** efeito em `[search, page, nonce]`; `nonce` serve ao retry e ao refresh pós-criação/edição (a API é a fonte da verdade — sem atualização otimista).
- **Estados honestos:** carregando (`Carregando…` no elemento `acc-empty` existente, só na 1ª carga; refetch mantém a lista anterior, que é real), erro (mensagem + "Tentar novamente" reusando a classe `acc-outline` da própria tela; mapa por `ApiError.code` igual ao da Fatia 1: `NETWORK_ERROR`/`TIMEOUT` → conectividade; `BAD_ERROR_BODY`/`INTERNAL_ERROR` → erro de servidor; resto → mensagem honesta do servidor), vazio (`Nenhum registro encontrado`, texto existente).
- **Status honesto (DIR-04):** `connectionStatus='nao_conectada'` → rótulo **"Sem sessão"** já existente na tela (escolhido sobre "Desconectada" porque não sugere evento de desconexão — CTA-05 é BLOQ-EXT). **Nunca "Conectada"/"Online".** Abas: "Sem sessão" mostra tudo (mapeamento `statusOf`); "Conectadas"/"Desconectadas" ficam vazias com o vazio honesto — é o dado real, não falsificação (A1 §11: abas não têm dado que as distinga). Abas filtram no cliente sobre a página corrente (a API não expõe filtro por status — §3.2 do contrato A1); o pager reflete a consulta da API (`search/page`).
- **Contador:** `{from}-{to} de {total}` usa `total`/`page` da resposta da API (contrato A1 §9.8).
- **Busca:** debounce 400 ms preservando o comportamento visual (filtra ao digitar); Enter confirma imediato; termo vai trimado (contrato A1 §3.3); busca só por nome — sublinha da linha trocou `phone` (não existe no servidor) por `type` (dado real).
- **Modal:** mesmos elementos/classes (`form-grid`, `lbl`, `btn`). Campos: Nome (obrigatório; vazio não submete), Tipo (select; opções: `WhatsApp` + o tipo atual se diferente — única lista demonstrada, DEC-12 aberta), Conta espiã (checkbox — DEC-02: flag sem semântica, só armazenada). Erro do salvar: `<p className="acc-note" role="alert">` (classe existente da tela); botão Salvar desabilitado durante o envio. Campos `status`/`phone` antigos saem (sem dado real).
- **Histórico local:** chamadas `audit('Conta criada/atualizada', …)` mantidas com o id real da API — o histórico é feature local (fatia futura), comportamento preservado sem fabricar dado de servidor.
- **Ordenação:** o select visual fica como está; a ordenação real é a fixa do servidor (`created_at DESC, id DESC` — contrato A1 §3.2), coerente com a única opção "Data de criação".

## 4. Overview.tsx — coluna Contas

- Card Contas: `value` = `String(total)` (o "/1" estático saiu — limite por plano é EXC-01, o servidor não impõe limite; contador tipo "5→6" do PM = total puro, A1 §9.8). Conteúdo do `<p>`: vazio → "Nenhum registro encontrado" (texto existente); com itens → nomes da 1ª página (`pageSize=5`) separados por " · "; carregando → "Carregando…"; erro → "Não foi possível carregar as contas." + "Tentar novamente" (botão simples, discreto, sem classe nova).
- Campanhas ("0/∞") e Webhooks ("0") intocados.

## 5. Roteiro de smoke (PENDENTE — orquestrador pós-merge, com API real; nada foi executado, nenhum mock)

Pré: API A1 no ar (proxy Vite `/api` → `:8787`), migrações aplicadas, `GET /api/v1/health` 200; dados 100% sintéticos.

| # | Passo | Esperado |
|---|---|---|
| S1 | `register` (curl/UI) + login | Sessão criada; navega para `/whats/overview` |
| S2 | Overview | Card Contas mostra total real; lista de nomes reflete a API |
| S3 | Contas → "+ Conta" só com nome → Salvar | 201; conta aparece na lista (topo) e `total` soma; coluna de status mostra "Sem sessão" — nunca "Online" |
| S4 | Criar com toggle espiã + tipo | `isSpy`/`type` persistem no editar |
| S5 | Buscar por nome (digitar e Enter) | Lista filtra por `search`; termo com %/_ tratado literal (A1 T3) |
| S6 | Editar nome → Salvar | PATCH 200; nome atualizado após reload |
| S7 | F5 (recarregar) | Contas persistem (servidor é a fonte; nada vem do localStorage) |
| S8 | Parar a API → abrir Contas | Erro honesto + "Tentar novamente"; subir a API → retry recarrega |
| S9 | Verificar ausência de DELETE | Nenhum botão/fluxo de exclusão na tela (D5); aba Network sem `DELETE /api/v1/accounts` |

## 6. Gates (executados após o último diff, em `app/`)

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| `npm run build` (`tsc --noEmit && vite build`) | ✅ 61 módulos; index.html 0,79 kB · CSS 63,23 kB · JS 296,68 kB |
| `git diff main -- app/src/styles` | ✅ vazio (UI-02) |
| `git diff main --stat` | ✅ apenas `lib/api.ts`, `pages/Accounts.tsx`, `pages/Overview.tsx`, `types.ts` (+ este doc) |

## 7. Decisões registradas / riscos

- **D5 (sem delete):** aplicada — nenhum fluxo de exclusao criado; o contrato A1 tambem nao expoe DELETE (proposta futura, decisao do dono).
- **D6 (Content-Type json nas mutações):** aplicada por construção — `apiFetch` envia `Content-Type: application/json` quando há corpo (herdado da Fatia 1; nenhuma mutação usa query/body não-JSON).
- **Risco 1 — abas ficam "vazias demais":** "Conectadas"/"Desconectadas" sempre vazias é o dado real (`nao_conectada` é o único valor do CHECK); trocar visual das abas é decisão de design (fora do escopo).
- **Risco 2 — aba filtra página, não o total:** a API não filtra por status; pager mostra total da consulta. Declarado; se incomodar, vira `search` por status em fatia futura com o backend.
- **Risco 3 — tipo em select fechado:** só "WhatsApp" (+ valor atual ao editar); valores criados por outra via aparecem ao editar. DEC-12 aberta pode fechar a lista (A1 §2.1.2).
- **Risco 4 — `total` do Overview pode listar menos nomes que o total:** `pageSize=5` no card; total é o do servidor. Discreto e honesto.
- **Risco 5 — smoke pendente:** sem banco local, nenhum servidor foi subido; S1–S9 ficam para o orquestrador pós-merge (como na Fatia 1). Nenhum mock apresentado como real (PM regra 3).

---

**Data:** 08/11/2026 · **Autor:** A2 Front · **Branch:** `a2/contas` · **Status:** implementado; gates verdes; smoke pendente (§5).
