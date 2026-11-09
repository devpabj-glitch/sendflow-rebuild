# CONTRATO TÉCNICO — FATIA 4: CONTAS×CAMPANHAS (ASC — Contas associadas da campanha)

> **Status:** CONTRATO DOCUMENTAL — **sem código nesta fatia no backend**. A hipótese (backend já coberto pela D13; fatia majoritariamente front) foi **VALIDADA contra o código** e é formalizada aqui.
> **Repositório:** sendflow-rebuild. **Branch:** `a1/asc` (base `main`). **Autor:** A1 Backend. **Data:** 08/11/2026.
> Nenhum segredo/valor de variável aparece aqui (nomes só).
> **Fontes:** `docs/contracts/FATIA-03-CAMPANHAS-CONTRATO.md` (§0.2 D13, §2.1.5, §3.2–3.3) e `FATIA-03-FRONT-CONTRATO.md` (§1.5, §2 "NÃO tocados", Risco 3), `docs/continuidade/05-MAPA-FUNCOES-182.md` §"ASC" (GRP-ASC-01..04), `PROMPT-MESTRE-GRUPOS.md` §9.1 (DEC-04, ENG-02), `app/src/pages/AccountsCampaigns.tsx`, `app/src/types.ts`, `api/src/routes/releases.ts`, `api/test/releases.test.ts`.

---

## 0. Decisões herdadas — e NENHUMA decisão nova

Vigorem integralmente, sem redefinição: **D5** (sem DELETE), **D6** (Content-Type `application/json` em toda mutação — guard preParsing), **D10** (sem operação em massa; front itera por id), **D11** (sem unique de nome), **D13** (recurso `/releases`; `accountIds` em tabela de junção `release_accounts`; PATCH com **semântica replace**; **dedupe** com semântica de conjunto; validação: TODOS os ids existem E pertencem à **mesma org**; ordem lexicográfica na resposta). Herda ainda o envelope de erro, sessão/cookie, tenant ENG-02 e gates REG-01 das Fatias 1–3.

**Nenhuma nova decisão "D" é criada.** O cruzamento client-side (§2) e a ausência de endpoint novo são **decisões técnicas registradas** — mesmo precedente da dedupe da D13 ("decisão técnica registrada" no contrato F3 §0.2). Motivo adicional: a numeração "D14" colidiria com a **DEC-14 do PM §9.1** (fórmulas de KPI) e geraria confusão permanente; a numeração da série D fica preservada para o dono.

## 1. IDs do PM — cobertos e pulados

| ID | Requisito (síntese do mapa) | Situação | Base |
|---|---|---|---|
| **GRP-ASC-01** | Associar/desassociar contas à campanha por lista com checkbox e contador "N/M contas". Aceitação PM: contador = associações persistidas. | **CONTRATADO (front-only)** | Backend **já existe e está testado**: `PATCH /api/v1/releases/:id {accountIds}` (replace, D13). Tela = `AccountsCampaigns.tsx` reescrita sobre a API (matriz `accounts.list` × `releases.list`). Sem código de servidor. |
| **GRP-ASC-02** | Opções "contas criadoras de grupos" / "range de operação" (Fechar/Salvar). | **PULADO** | **DEC-04** (papéis por conta e conteúdo do "range" não confirmados). Nenhum campo, coluna ou endpoint é criado. |
| **GRP-ASC-03** | Conta não associada bloqueada em assistentes de ação; [PROP] backend recusa a operação. | **PULADO nesta fatia** | Depende do módulo **ACM (assistente de ação)**, que não existe. Registrado como **pré-requisito futuro** (§7). Observação: o invariante ENG-02 ("vínculo campanha–conta validado no servidor") **já é satisfeito hoje** pela validação de `accountIds` no POST/PATCH (org alheia/inexistente → 400); o que falta é a *recusa de operação* — que só existe quando houver operação. |
| **GRP-ASC-04** | "Campanhas expostas" = campanhas ativas sem cobertura adequada. | **PULADO** | "Adequada" = **DEC-14**. Se a A2 mantiver o rótulo visual "Campanhas expostas" da tela atual, o único critério contratável é o determinístico **`archived=false` E `accountIds.length=0`** (dado real, espelho da regra local vigente) — sem prometer "cobertura adequada" (DIR-04). |

**Fora de escopo declarado:** papéis/range por conta (DEC-04), recusa de operação por conta não associada (ACM futuro), qualquer noção de cobertura "adequada" (DEC-14), migração de dados locais (`localStorage` não tem ids da API — idem F2/F3), DELETE (D5), operação em massa de associação (D10: cada release salva é 1 PATCH).

## 2. Superfície backend — declaração formal

**NENHUM endpoint novo. NENHUMA migração nova. NENHUMA mudança em `/api`.** O mecanismo único da associação é o **PATCH existente**:

- **Mecanismo:** `PATCH /api/v1/releases/:id` com `{accountIds}` — **replace** do conjunto por inteiro, na mesma transação (delete+insert da `release_accounts`); validação: todo id deve existir e pertencer à mesma org, senão `400 VALIDATION_ERROR fields ["accountIds"]` genérico; duplicatas deduplicadas; resposta em ordem lexicográfica. `POST /releases` com `accountIds` também existe (criação já associada) — a matriz usa só o PATCH.
- **Leituras:** `GET /api/v1/accounts` (`{items,total,page,pageSize}`) e `GET /api/v1/releases` (idem; **cada item já vem com `accountIds`** agregados por página — segunda query com `IN`, sem N+1). Ambas org-scoped (ENG-02/TEN-01).

### Avaliação: endpoint dedicado × cruzamento client-side

Avaliados `GET /releases/:id/accounts` e `GET /accounts/:id/releases`. **RECOMENDAÇÃO: CRUZAMENTO CLIENTE.** Justificativa: (1) a tela precisa **das duas listas completas de qualquer forma** — nomes das contas para as linhas, releases para as colunas e o "M" dos contadores; endpoints dedicados devolveriam **subconjunto de dado que o front já tem em mãos**; (2) semântica nova nula (a associação já viaja em cada item da lista); (3) endpoint novo = superfície nova (rota, testes, guard de tenant, manutenção) com **zero capacidade nova** hoje; (4) volume pequeno por construção.

**Limite de escala declarado:** a matriz cruza A contas × R releases no cliente, e as listas paginam em até 100 itens/página (fetch-all via paginação quando a tela quiser tudo). Para orgs com **centenas+ de contas e releases simultaneamente**, ou quando houver medição de gargalo, revisitar com um endpoint agregado paginado (§7). Até lá, sem superfície nova.

## 3. Comportamento do front contratado (para a A2 — tela `AccountsCampaigns.tsx`)

1. **Matriz:** linhas = `accounts.list`; colunas = `releases.list` (default: **todas**, `archived` ausente; filtro por `archived` disponível se a A2 quiser abas). Associar conta a release **arquivada** não é bloqueado — nenhuma fonte amarra; não inventar regra.
2. **Checkbox por célula:** toggle = **1 PATCH** com o **conjunto completo novo** (`accountIds: [...]`) — nunca delta; a semântica é replace (D13) e o front monta o array a partir do conjunto vigente do servidor. Sem atualização otimista obrigatória; recomendação: célula/botão desabilitado durante o envio + releitura pós-resposta (padrão `nonce` da F3).
3. **Contador N/M (aceitação do PM = associações persistidas):** por campanha, `N = accountIds.length` do servidor e `M = total` de contas da org; por conta, `N =` nº de releases cujo `accountIds` contém a conta e `M = total` de releases. Derivados no cliente; `N` sempre reflete o **servidor** (persistido), nunca estado local não confirmado.
4. **Alerta derivado:** "conta ociosa" = conta com 0 associações (filtro local); "campanha exposta" somente no critério determinístico do §1 (ASC-04). Zero backend novo.
5. **KPIs da tela:** "Conectadas/Desconectadas" **não têm dado binário real** — `connectionStatus` tem o valor único `'nao_conectada'` (CHECK no banco, F2). A A2 não inventa Online/Offline (DIR-04); adapta ou retira os cards.
6. **Estados:** carregando (1ª carga), erro de lista (`ApiError.code` + "Tentar novamente"), vazio ("Nenhum registro encontrado") — padrões F2/F3, dados sustentados por `items: []`/`total: 0`.
7. **Concorrência (declarado):** **dois editores — último PATCH vence, sem lock, sem ETag/versioning.** Toggles partindo do mesmo snapshot podem perder o intermédio silenciosamente (A adiciona conta 1; B adiciona conta 2; o último PATCH apaga a 1). Aceito no volume atual; reler a release imediatamente antes do PATCH reduz a janela, não elimina. Nenhuma mudança de servidor nesta fatia.
8. `store.tsx` local (`Account.campaignIds`, `Campaign.accountId`) **não contém ids da API** — a tela reescreve sobre a API; sem migração de `localStorage` (decisão F2/F3 mantida).

## 4. Testes dirigidos

- **Backend: NENHUM teste novo.** A suíte vigente — **70/70** (7 arquivos) — já cobre o que a ASC exercita: replace do conjunto (`releases.test.ts` T1), dedupe (incl. caixa alta/baixa pós-auditoria), validação de `accountIds` (não-array/não-UUID/inexistente/**conta de outra org** → 400 genérico), cruzado TEN-01 (404 byte a byte + `accountIds` alheio → 400), persistência por oráculo SQL e reversibilidade da migração 005. Gates REG-01 seguem como gate de regressão do front-merge.
- **Smoke front (orquestrador, API real, dados sintéticos):** S1 login → S2 matriz carrega contas e releases **da própria org** → S3 marcar checkbox conta×release (Network: `PATCH /releases/:id` com `accountIds:[id]`) → S4 recarregar (F5) e a associação **persiste** → S5 desmarcar (PATCH com conjunto sem o id) → S6 contador **N/M atualiza** no eixo campanha e no eixo conta → S7 **cruzado org:** a matriz da org B não mostra nenhum dado de A (herança TEN-01 — listas org-scoped; nenhuma chamada cross-org existe para testar, a impossibilidade é o assert) → S8 API caída → erro honesto + "Tentar novamente".

## 5. Mapeamento com a MATRIZ-VALIDACAO

| Critério | Como esta fatia atende | Evidência |
|---|---|---|
| **UI-01** | Estados vazios/carregando/erro sustentados pelos dados existentes (`items:[]`, `total:0`, envelope) — §3.6. | L (A2) |
| **E2E-01** | Roteiro S1–S8 do smoke (§4) — associação persistida de ponta a ponta. | H (orquestrador) |
| **TEN-01** | **Herdado sem código novo**: listas org-scoped + testes cruzados existentes (T6 releases, T6 accounts); smoke S7 confirma no cliente. | L + H |

## 6. Riscos

1. **Escala do cruzamento cliente** — declarada no §2; gatilho de revisão registrado.
2. **Lost-update em edição concorrente** — §3.7; aceito, mitigável no cliente (releitura pré-PATCH).
3. **"Exposta"/"ociosa" são leituras derivadas sem semântica PM** — DEC-14/DEC-04 abertas; a tela não promete mais que o dado.
4. **KPIs de conexão inexistentes** — §3.5; risco de a A2 "emprestar" o Online/Offline local (falso); contratado contra.
5. **Associação a release arquivada permitida** — sem amarra em fonte alguma; comportamento declarado, não bug.
6. **Um PATCH por release salva** (D10, sem massa) — N chamadas idempotentes; custo desprezível no volume atual.

## 7. Pendências que dependem de decisão/fatia futura

| Item | Situação |
|---|---|
| **DEC-04** (papéis por conta, "range de operação") | **ABERTA** — ASC-02 pulado; sem coluna/campo criado. |
| **DEC-14** ("cobertura adequada", KPIs) | **ABERTA** — ASC-04 pulado; só o critério determinístico (§1) é contratável. |
| **ASC-03** (backend recusa operação de conta não associada) | **PRÉ-REQUISITO: módulo ACM (assistente de ação)** — não existe; quando existir, o contrato do ACM herda a validação "conta ∈ `accountIds` da release" como regra de servidor (ENG-02 já satisfeito no vínculo pela validação existente). |
| **Endpoint agregado paginado** (escala da matriz) | **CONDICIONAL** — só quando o limite do §2 for medido como gargalo; exigirá contrato próprio. |
| **DELETE de release** | Intocado — proposta futura, decisão do dono (D5). |

**Nenhuma pendência bloqueia a fatia** — ela não produz código de servidor.

---

**Data:** 08/11/2026 · **Autor:** A1 Backend · **Branch:** `a1/asc` · **Status:** contrato documental; backend declarado completo pela D13; implementação é da A2 (front).
