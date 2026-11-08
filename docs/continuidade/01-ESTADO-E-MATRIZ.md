# 01 — Estado verificável: pronto no recorte / em andamento / pendente

Snapshot de 08/11/2026 ~00:55 (Brasília). Regra deste documento: "aceite" significa **aceite técnico limitado ao recorte descrito**, com a fonte que o evidencia. Nunca significa módulo completo nem produção. Relato de agente fica marcado como **relato**.

## A. sendflow-rebuild (repositório ATUAL, GitHub, público)
| Item | Estado | Evidência | Limite |
|---|---|---|---|
| Front publicado (home, login, termos, privacidade, painel `/whats/*`) | Em produção como **front estático** | `main` `81d75b9` (PR #5); deployment Railway `e151577d` SUCCESS 00:09:59; `GET /` HTTP 200 00:33:43 (`fontes/backend-infra/ESTADO-INFRA-20261108.md`); rotas lidas no código (`06-INVENTARIO-ROTAS-SENDFLOW.md`) | Dados e auth **só no navegador** (localStorage); sem API/banco. 7 rotas são placeholder |
| Home/login responsivos | Aprovados pelo usuário, **segundo relato** da Referência e do coordenador | `fontes/contribuicoes/CONTRIBUICAO-REFERENCIA-20261108.md` | Qualidade não auditou o responsivo. Público autenticado não validado |
| Revisão visual interna das 20 rotas | **Relato** da Referência: as 4 principais em 360/390/473/768/1440 sem overflow, as demais em 473/1440 | mesma contribuição | Sem percentual de fidelidade: não há método nem medição. Os percentuais de `DEV/HANDOFF.md` são autodeclarados |
| Demo visual dos módulos (PR #6, `cursor/demo-module-visual-c444`, head `19c4c8c`) | Aberto, **não mergeado, não publicado**, `mergeable_state: clean` | Leitura GitHub: PR e lista de arquivos (19); corpo do PR | Dados fictícios; não é integração. 5 testes e tsc **relatados**. Faltam evidências de Contas e Contas×Campanhas desktop/mobile (Referência) |
| Integração banco/API/auth (1ª fatia) | **Em andamento** desde ~00:34 | Escritor `bc-ab0ec626-43a9-5ef3-a765-6d432c89cfb7` (contribuição do coordenador; `fontes/qualidade/MATRIZ-VALIDACAO-SENDFLOW-INTEGRACAO-V1.md` L9) | Nenhum commit, branch, gate ou contrato recebido. `main` continuava em `81d75b9` na leitura |
| Matriz de validação da integração | Preparada; **os 11 critérios estão NÃO AVALIADO** | `fontes/qualidade/MATRIZ-VALIDACAO-SENDFLOW-INTEGRACAO-V1.md` | Aguarda commit e artefatos |
| 182 funções do PM | **NÃO VERIFICADO / sem backend** | `05-MAPA-FUNCOES-182.md` | Tela existente não é função implementada |

## B. Backend LEGADO (Cursor Origin, parado): recortes registrados
**A portabilidade e a equivalência para o sendflow-rebuild não foram verificadas.** O backend legado (Next.js + SQLite, escritor `bc-68876892`, último commit relatado `c244ad1`) está parado desde 07/11 22:15 (ordem de manutenção do usuário, relatada pelo coordenador). Os recortes abaixo servem como **especificação e referência de testes**, não como entrega do repositório novo.

Colunas de evidência:
- **QA documental**: auditoria independente copiada em `fontes/qualidade/`. A Qualidade não reexecutou testes; gates e commits são relato do escritor.
- **Aceite do coordenador**: só quando há fonte.
- **Só matriz**: estado registrado pelo escritor legado na matriz, sem auditoria QA localizada neste pacote.

| ID | Recorte | Testes citados (repo legado) | QA documental (arquivo, conclusão) | Aceite do coordenador | Fora do recorte |
|---|---|---|---|---|---|
| GRP-WHE-01 / WHE-03 | Cadastro local de webhook de entrada; vínculo explícito a campanhas (WH-IN-CONFIG v1) | `incoming-webhooks.test.ts`, `incoming-webhooks-gaps.test.ts` | `AUDITORIA-INDEPENDENTE-WHE-R75.md`, `…-R77.md`: suficiência documental para aceite técnico do recorte (rev. `71b45a49…`) | Não verificado neste pacote | Recepção/integração; detalhe da referência |
| GRP-PRJ-01 | Edição de metadados do projeto com preservação/reabertura (PRJ01-EDIT-PERSIST v1) | `project-edit-persist.test.ts` | `…-PRJ01-R79.md`: E1–E5 suficientes (rev. `ad55863…`) | Não verificado | Exclusão do projeto vazio (`project-delete.test.ts`): **só matriz**; destino dos itens |
| GRP-AUT-04 (a) | Filtro de listagem por status persistido (AUT04-STATUS-READ v1) | `automation-status-filter.test.ts` | `…-AUT04-R80.md`: F0–F6 suficientes (rev. `82d130e…`) | Não verificado | UI, motor |
| GRP-AUT-04 (b) | Ativar/desativar a seleção de automações locais (AUT04-BULK-STATE) | `automation-bulk-state.test.ts` | `…-AUT04-R88.md`: insuficiente (Δ1–Δ3 e S75) → `…-AUT04-R89.md`: suficiência documental limitada, delta vazio (rev. `c244ad1`; 201 testes/53 arquivos **relatados**) | **Relato** de aceite limitado (`fontes/backend-infra/CONTRIBUICAO-CONTINUIDADE-20261108.md` L11) | JSON, duplicar/excluir em massa, 7/14/28, gatilho ao encher |
| GRP-AUT-04 (c) | Duplicar uma automação | `automation-duplicate.test.ts` | Sem auditoria QA localizada. A matriz legada registra a cópia de uma; a Backend relata "só pacote + parecer, sem implementação final comprovada" (divergência não resolvida) | Não | **Só matriz** |
| GRP-GRU-01 | CSV autenticado de metadados locais de grupos (GRU01-EXPORT-LOCAL v1) | `group-export.test.ts` | `…-GRU01-R81.md`: G0–G6 suficientes (rev. `8525e71…`) | Não verificado | Leads, convites, provedor |
| GRP-CMP-05 | Listagem de campanhas filtrada pelo status persistido (CMP05-STATUS-READ v1) | `campaign-status-filter.test.ts` | `…-CMP05-R82.md`: insuficiente (Δ1) → `…-CMP05-R83.md`: Δ1 fechado, suficiência (rev. `3ae3991…`) | Não verificado | Arquivamento por ids (`campaign-archive.test.ts`): **só matriz**; lista completa |
| GRP-GRU-02 | Busca literal por nome na lista local de grupos (GRU02-NAME-SEARCH v1) | `group-name-search.test.ts` | `…-GRU02-R84.md`: insuficiente (Δ1) → `…-GRU02-R85.md`: Δ1 fechado, suficiência (rev. `a66de57…`) | **Sim**: "ACEITO coordenador recorte LIMITADO" (transcript da Qualidade, mensagem do coordenador após R85) | Toolbar, UI |
| GRP-GRU-02 / GRU-04 | Classificação cheio = manual OU calculado e filtros Cheios/Não cheios (DEC06) | `group-fullness.test.ts` | `…-DEC06-R86.md`: suficiência documental do recorte; gatilho **não implementado** (rev. `f096ddc0`; 198/52 **relatados**) | **Relato** do Supervisor-pai: aceite limitado às 18:20 | Gatilho "encher grupo"; unificação status/roteamento |
| GRP-CTA-04 / MET-03 | Contagem derivada de contas ociosas | `idle-accounts.test.ts` | — | — | **Só matriz** |
| GRP-GRU-05 | Ação em massa de grupos na API | `group-bulk.test.ts` | — | — | **Só matriz** |
| GRP-CRG-10 | Invariante ao salvar o modelo | `template-save-invariant.test.ts` | — | — | **Só matriz** |
| GRP-FIL-02 / FIL-04 | Janela de job; tempos por tentativa | `job-window.test.ts`, `execution-times.test.ts` | — | — | **Só matriz** |
| GRP-MSG-04 | Cadeia A/B/C de mensagens | `message-order.test.ts` | — | — | **Só matriz** |
| GRP-PRJ-03 | Contagens derivadas de contas e webhooks por projeto | `project-accounts.test.ts`, `incoming-webhooks.test.ts` | Parte webhooks coberta pelo contexto R75/R77; contagem de contas: — | — | **Só matriz** (parcial) |
| GRP-ASP-02 | Importação CSV de blacklist da organização | `blocklist-import.test.ts` | — | — | **Só matriz** |

Resumo: 8 recortes têm auditoria QA documental suficiente (WHE, PRJ-01 edição, AUT-04 filtro, AUT-04 massa, GRU-01, CMP-05 filtro, GRU-02 busca, DEC06). Aceite do coordenador com fonte: 1 direto no transcript (GRU-02, R85) e 2 por relato (AUT-04 massa, DEC06). Os demais itens da matriz legada são **registro do escritor**, sem aceite evidenciado neste pacote.

Contagem legada por estado (182 IDs; detalhe ao fim de `05-MAPA-FUNCOES-182.md`): BLOQ-EXT 42, PEND-ORDEM 33, FIN 20, INF-ATUAL 25 (15 + 8 parcial + 2 combinados), DEC-xx 36, recortes registrados 16, LAC 3, outros 7 (FIN+dados 1, EXC 3, RV 2, INF 1).

## C. Pendente ou bloqueado (decisão de produto, não técnico)
- Gatilho "encher grupo": `fontes/backend-infra/PACOTE-GATILHO-ENCHER-GRUPO-CICLO.md` diz "ESPECIFICAÇÃO PENDENTE… NÃO PRONTO PARA DESPACHO"; QI/Q3/Q4 adiadas pelo usuário em 07/11 19:16 (**relato** do coordenador).
- DEC-01…DEC-21 e LAC do PM §9; BLOQ-EXT depende de provedor WhatsApp/Meta (PM MOD INT).
- Prompt mestre original histórico: ausente.
