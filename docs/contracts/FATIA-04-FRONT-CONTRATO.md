# CONTRATO FRONT — FATIA 4: CONTAS×CAMPANHAS (ASC)

> **Status:** implementado (front-only). **Branch:** `a2/asc` (base `main`). **Autor:** A2 Front. **Data:** 08/11/2026.
> **Base:** `docs/contracts/FATIA-04-ASC-CONTRATO.md` (A1) e `FATIA-04-ASC-PARECER.md` (A4, veredito ADERENTE com 2 ressALvas — ambas ACATADAS, ver §5).
> **Arquivo único de código:** `app/src/pages/AccountsCampaigns.tsx`. **Zero mudança** em `lib/api.ts`, `types.ts`, `store.tsx`, `Overview.tsx`, `app/src/styles/**` e `/api`.

## 1. Escopo (GRUPOS ASC-01, front-only)

Tela `AccountsCampaigns` reescrita do store local para a API:

- **Carga:** `accounts.list` × `releases.list` em paralelo (`Promise.all`), `archived` ausente = todas as releases. A tela nunca teve pager próprio — **fetch-all via paginação** (concatena páginas de 100 até `total`) mantém o comportamento visual de cruzamento completo. Limite de escala herdado do contrato A1 §2 (gatilho de revisão: endpoint agregado quando medido como gargalo).
- **Matriz (aba "Matriz"):** linhas = contas, colunas = releases, célula = **checkbox** = associação. Associação a release arquivada NÃO é bloqueada (contrato A1 §3.1; nenhuma fonte amarra).
- **Toggle:** 1 `PATCH /api/v1/releases/:id` com `{accountIds: conjuntoCompleto}` — **replace, nunca delta** (D13). **Sem atualização otimista**: os checkboxes da **coluna inteira da release** ficam desabilitados durante o envio (duas células da mesma release compartilham o mesmo conjunto; toggles concorrentes no cliente gerariam PATCH de snapshots distintos — lost-update §3.7 do A1) e o estado vem **da resposta do PATCH** (verdade do servidor). Erro → mensagem `role="alert"` acima da tabela; a célula permanece no último estado confirmado (rollback implícito: nada não confirmado é exibido). Declaração: **escolhido loading-no-item + resposta do servidor** (em vez de otimista com rollback) porque o contador N/M nunca pode refletir estado local não confirmado (aceitação do PM).
- **Contadores N/M (sempre do servidor):** por campanha, no cabeçalho da coluna = `accountIds.length` / total de contas; por conta, no rótulo da linha = nº de releases cujo `accountIds` a contém / total de releases. Derivados client-side do `accountIds` retornado pela API.
- **Abas "Por conta"/"Por campanha":** mantidas com dados da API — Por conta lista as releases associadas; Por campanha lista os nomes das contas associadas. Filtro local nos botões de alerta (ver §5).
- **Histórico local (`useStore().audit`):** mantido apenas para o log de auditoria local (precedente F2/F3); nenhum dado de associação vem do store.

## 2. KPIs (adaptação — contrato A1 §3.5)

`connectionStatus` só tem `'nao_conectada'` (F2): os cards **Conectadas/Desconectadas saem** (não há dado binário real; DIR-04 — nunca Online/Offline). Os 4 cards (layout `grid kpis` preservado) passam a ser, todos determinísticos:

| Card | Valor | Fonte |
|---|---|---|
| Contas | total de contas da org | `accounts.list` (fetch-all) |
| Campanhas | total de releases da org | `releases.list` (fetch-all) |
| Sem associações | contas com 0 associações | derivado (Ressalva 1) |
| Com conta associada | releases com ≥1 conta | derivado |

Sem cores de saúde nos cards novos (nenhuma semântica PM por trás — DEC-14 aberta).

## 3. Estados

- **Carregando (1ª carga):** `EmptyState "Carregando…"` dentro do card; recargas (nonce) mantêm os dados anteriores sem piscar.
- **Erro de lista:** `EmptyState` com `errorText` (código `ApiError` — NETWORK_ERROR/TIMEOUT/BAD_ERROR_BODY/INTERNAL_ERROR) + botão **"Tentar novamente"** (reexecuta as duas cargas). Falha em qualquer lista derruba a tela toda (estado honesto, sem meia-matriz).
- **Vazio:** sem contas ou sem releases → `EmptyState` específico por eixo; linhas filtradas a zero → `EmptyState "Nenhuma conta/campanha encontrada"`.
- **Erro de toggle:** mensagem inline `role="alert"`; sem alteração da célula.

## 4. Smoke (roteiro do orquestrador — API real, dados sintéticos)

1. **S1** login em org A → tela abre: contas e releases **apenas da org A** carregam (listas org-scoped, TEN-01).
2. **S2** aba Matriz: checkbox conta×release **desmarcado**; contadores N/M visíveis nos dois eixos.
3. **S3** marcar checkbox → Network: `PATCH /api/v1/releases/:id` com `accountIds: [<idConta>]` (conjunto completo); coluna desabilita durante o envio.
4. **S4** recarregar (F5) → associação **persiste** (checkbox marcado).
5. **S5** desmarcar → PATCH com conjunto sem o id.
6. **S6** contadores N/M **atualizam nos dois eixos** (coluna e linha) a partir do servidor.
7. **S7** login em org B → matriz de B **não mostra nenhum dado de A** (impossibilidade herdada do tenant; o assert é a ausência).
8. **S8** API caída → erro honesto + "Tentar novamente".

## 5. RessALvas do parecer — ACATADAS

1. **"Conta ociosa" NÃO é exibido como oficial.** Rótulo neutro **"Sem associações"** (filtro de alerta, badge da tabela, badge do card e KPI), critério determinístico declarado: conta com **0 associações** em todas as releases. Badge em tom neutro (`muted`), não `warning`.
2. **"Campanhas expostas" → "Campanhas sem contas (N · provisório)"** no filtro; badge "Exposta" → **"Sem contas"**. Escolha registrada: **marcar como provisório no rótulo** (menos invasivo que remover o controle — mantém layout e o filtro existente), critério determinístico `!archived && accountIds.length === 0`, SEM prometer "cobertura adequada" (DEC-14 aberta; DIR-04).

## 6. Fora de escopo

- **ASC-02** (contas criadoras de grupos / range de operação) — DEC-04 aberta; nenhum campo/coluna criado.
- **ASC-03** (recusa de operação para conta não associada) — depende do módulo ACM (inexistente).
- **ASC-04** ("cobertura adequada") — DEC-14 aberta; só o critério determinístico acima é exibido.
- **KPIs/métricas DEC-14** — nenhum número inventado; contadores são contagens puras de associações persistidas.
- Endpoint agregado, migração de `localStorage`, DELETE (D5), operação em massa (D10 — cada release salva é 1 PATCH).

## 7. Gates

- `npx tsc --noEmit` (0 erros) · `npm run build` (ok) · `git diff main -- app/src/styles` VAZIO · nenhum arquivo além de `AccountsCampaigns.tsx` + este contrato.

## 8. Riscos conhecidos (herdados do contrato A1)

- Lost-update entre dois editores (§3.7 A1): último PATCH vence; mitigado no cliente apenas pela desabilitação da coluna durante o envio.
- Escala do cruzamento cliente (A1 §2): fetch-all de contas e releases; gatilho de revisão declarado.
- Rótulo "Campanhas sem contas · provisório" mudará de significado quando DEC-14 fechar.
