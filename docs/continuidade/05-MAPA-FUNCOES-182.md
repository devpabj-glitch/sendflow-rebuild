# 05 — Mapa integral das 182 funções do PM-GRUPOS (por módulo)

Gerado em 08/11/2026 ~00:55 Brasília por extração mecânica, **sem reescrever nem inventar semântica**. Células completas, sem cortes.

**Como ler**
- **Classe / Requisito / Fonte / Aceitação PROPOSTA / Limite**: texto literal do PM (`fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md`). `Lnnn` = linha no PM. Pelo próprio PM (§0.2.1), a Aceitação é **critério proposto derivado**, não aceite aprovado. Itens [PROP] dependem de decisão.
- **Estado no backend LEGADO**: coluna de escopo/estado da matriz do repositório legado (Cursor Origin), cópia R88 em `fontes/legado/aderencia-prompt-mestre-v1-legado-R88.md` (a R89 alterou só `jobs.ts` e um teste). **Não vale para o sendflow-rebuild:** a portabilidade e a equivalência do legado não foram verificadas.
- **Rota/tela atual (candidata)**: por módulo, a partir de `06-INVENTARIO-ROTAS-SENDFLOW.md` (`main` 81d75b9). T = interação só local (localStorage), P = placeholder, demo = só no PR #6 não mergeado. É correspondência por nome. **Não comprova implementação da função; não há backend no `main`.**
- **Estado no sendflow-rebuild**: para todas as linhas = **NÃO VERIFICADO / sem implementação de função GRP**. Backend BASE existe desde 08/11/2026 (Fatia 1: auth de servidor, org/tenant, banco PostgreSQL com migrações reversíveis, API /api/v1 com healthcheck e CORS restrito; commits e14c4b7+d3bd71a no main) — porém nenhuma função GRP tem endpoint, contrato de produto, teste dirigido ou auditoria; as telas seguem com dados locais (localStorage).
- **Estado no repo (09/11/2026)**: coluna nova, por ID, com a taxonomia de 5 estados do dono — `FEITO` (com SHA e teste; "parcial" indica recorte com partes explicitamente puladas), `EM ANDAMENTO`, `PULADO` (por DEC-xx/LAC/EXC/ordem), `BLOQ-EXT` (provedor/integração externa, DIR-06) e `NÃO INICIADO`. Fontes: contratos por fatia em `docs/contracts/`, `DEV/WORKLOG.md` e histórico git do `main`.
- Legenda dos estados legados (cabeçalho da matriz): INF-ATUAL = existe na árvore legada segundo a matriz, sem aceite; PEND-ORDEM = aguarda ordem; BLOQ-EXT = depende de provedor/contrato externo; DEC-xx = decisão aberta (PM §9); LAC = lacuna de evidência; FIN = etapa visual final; RV = revisão; EXC = excluído; "escopo aprovado / recorte" = fatia legada com aceite limitado ao recorte (ver 01-ESTADO-E-MATRIZ, seção B).


## NAV — Shell, navegação global e visão geral inicial (PM L193)

**Rota/tela atual candidata:** Layout (menu/busca), `/whats/overview`, `/whats/accounts-campaigns`, `/profile`. **Estado no sendflow-rebuild:** PARCIAL (09/11/2026): shell de navegação + telas no front (SHA e5225f4→d3bd71a); busca global de grupos e colunas Contas/Campanhas do Overview leem a API real (1527df7, cb6cb62+6f9e75b); breadcrumb inexistente; Webhooks ainda local. Front não possui suíte de teste.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-NAV-01 (L196) | OBS-M | Navegação global por barra lateral recolhível (ícones) e expansível (rótulos), com item ativo destacado. | P1 01:14; P6 41:03; CF 22 | Expandir/recolher sem perder rota; item ativo indicado. | Ordem/nomes finais = DEC-01 | FIN | FEITO (front, shell sidebar recolhível/expansível; SHA e5225f4→d3bd71a; front não possui suíte de teste) |
| GRP-NAV-02 (L197) | OBS-M | Mapa de navegação contém, como áreas: Visão geral, Métricas, Projetos, Contas, Campanhas, Variáveis da campanha, Webhooks (entrada), Deep link, Automações, Webhooks de saída, Blacklists, Ações, Anti-spam, Alertas, Agente de IA, Modelos de mensagem, Broadcast, Leads, Broadcasts, Treinamentos, Equipe e itens "SendSpace", "SendAPI", "MCP (BETA)", "Histórico". | P6 41:03; P7 48:21 (Equipe) | Cada área prevista tem rota ou está marcada "pendente/fora de escopo" na matriz. | Vários itens **sem conteúdo amostrado** (GRP-ZZZ); não inventar funções | FIN | FEITO (parcial, front: menu com as áreas no shell; itens sem conteúdo ficam PULADOS por DEC — ver módulo ZZZ; SHA d3bd71a; front sem suíte) |
| GRP-NAV-03 (L198) | OBS-M | Breadcrumb visto nas telas de detalhe amostradas (ex.: Campanhas › campanha › aba). [PROP] presença em todas as telas e navegabilidade de cada nível. | P1 07:05; CF §3 | [PROP] Breadcrumb reflete hierarquia e é navegável. | Universalidade e clique nos níveis não comprovados | FIN | NÃO INICIADO (sem breadcrumb no app; existia só no PR #6 demo, não mergeado) |
| GRP-NAV-04 (L199) | OBS-M | Busca global com atalho de teclado e acesso a configurações no topo. | P1 01:14 | Atalho abre busca; escopo da busca = DEC-13. | Resultado de busca não amostrado | FIN | FEITO (parcial, front: busca global de grupos consulta a API; escopo geral da busca = DEC-13 aberta; SHA 1527df7) |
| GRP-NAV-05 (L200) | OBS-M | Visão geral inicial com cartão de perfil (acesso a configurações), cartão "Mapa Contas × Campanhas" com estado de saúde das associações e acesso a painel, e três colunas: Contas (contador N/limite, "+", busca, status), Campanhas (contador, "+", busca, cards com 4 métricas e status), Webhooks (contador, nome, tipo). | P1 01:14; CF 1 | Colunas listam dados reais do usuário; contadores batem com contagem persistida; vazio legível. | "∞" visto = sem limite exibido; limite por plano **fora** (EXC-01) | FIN + dados | FEITO (parcial, front: colunas Contas/Campanhas leem a API; coluna Webhooks ainda local; SHA cb6cb62+6f9e75b) |
| GRP-NAV-06 (L201) | OBS-M | Botão flutuante de ajuda/chat no canto (ver GRP-TRN). | P1 01:14; P9 1:03:29 | — | Suporte externo = DEC-09 | FIN | FEITO (front: botão de ajuda/atalhos local no shell; suporte externo = DEC-09; SHA d3bd71a) |
| GRP-NAV-07 (L202) | PROP | Estados de tela distinguíveis: carregando, vazio, erro, desabilitado, sem permissão. | CF §1 estados; P6 §D2 | Zero ≠ vazio ≠ erro ≠ carregando em todas as listas. | — | FIN | FEITO (parcial, front: estados por tela (vazio/carregando) nas telas da API; não auditado como diretriz global; SHA d3bd71a) |

## CTA — Contas (PM L204)

**Rota/tela atual candidata:** `/whats/accounts` — T. **Estado no sendflow-rebuild:** PARCIAL (08/11/2026, fatia Contas: e6a3e55+cb6cb62, verificado A3): CTA-01 IMPLEMENTADO no backend+front (criar com nome obrigatorio/toggle espia/tipo; lista com busca/paginacao; editar); CTA-02 PARCIAL (lista existe; status sempre 'nao_conectada' honesto, nunca online falso — status real depende de provedor/BLOQ-EXT); CTA-03 IMPLEMENTADO (criar/editar conta nao gera sessao/credencial/ID externo, teste dirigido); CTA-04 PULADO (contagem de ociosas = DEC-14); CTA-05/06 PULADOS (BLOQ-EXT provedor); DELETE de conta propositalmente ausente (decisao D5: sem amarra no PM; proposta futura para o dono). E2E HTTP provado; navegacao visual em browser nao provada.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-CTA-01 (L207) | OBS-M | Criar conta via modal: Nome (obrigatório), opção "conta espião" (toggle), Tipo (select; valor visto: WhatsApp). | P1 01:36; CF 2 | Nome vazio bloqueia; conta criada aparece na lista e no contador (visto 5→6, P1 03:32). | Semântica de "conta espião" **não explicada** → DEC-02 | INF-ATUAL parcial | FEITO (API+front; SHA e6a3e55+cb6cb62; testes da fatia 2 (48/48) com caso dirigido; verificação A3 aprovada) |
| GRP-CTA-02 (L208) | OBS-M | Lista de contas com avatar, indicador de status (online), acesso a configurações e detalhe. | P1 01:14 | Status exibido vem de estado real; sem integração = "não conectada/bloqueada", nunca "online" falso. | Status real depende de provedor (NT) | BLOQ-EXT | FEITO (parcial: status honesto sempre "nao_conectada" (DIR-04), nunca online falso; status real = BLOQ-EXT provedor; SHA e6a3e55; testes fatia 2) |
| GRP-CTA-03 (L209) | DIR+PROP | Criar/editar conta **não** cria sessão, credencial nem conexão implicitamente; conexão é etapa separada e bloqueada até contrato (DIR-06). | CK16 F01; DIR-06 | Teste: criar conta não gera sessão/ID externo. | Fluxo QR/ES real: NT/bloqueado | INF-ATUAL | FEITO (API; SHA e6a3e55; teste dirigido: criar/editar conta não gera sessão/credencial/ID externo; A3) |
| GRP-CTA-04 (L210) | OBS-M | Conta pode estar associada a campanhas e agrupada em projeto; "contas ociosas" = sem campanha ativa (texto da UI). | P6 40:16, 42:08 | Contagem de ociosas coerente com associações. | Fórmula = FALA/DEC-14 | escopo aprovado; contagem derivada | PULADO (DEC-14 — fórmula de contas ociosas) |
| GRP-CTA-05 (L211) | OBS-M | Alerta "Desconectadas nas últimas 24h" no painel de métricas. | P6 42:08 | Lista vazia legível; só eventos reais de desconexão. | Depende de provedor (NT) | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — evento de desconexão real depende de provedor; não iniciado) |
| GRP-CTA-06 (L212) | FALA (cap.) | Conectar número via fluxo do provedor (capítulo "como conectar seu número"). | CAP 01:20 | — | **Bloqueado** (DIR-06); vídeo não é contrato | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — fluxo de conexão do provedor bloqueado por DIR-06; não iniciado) |

## CMP — Campanhas (criação, tipos, lista global) (PM L214)

**Rota/tela atual candidata:** `/whats/campaigns` — T; PR #6: `/whats/campaigns/:id` (demo). **Estado no sendflow-rebuild:** PARCIAL (08/11/2026, fatia Campanhas 1628e9d+6f9e75b, verificado A3 com smoke real): CMP-01 IMPLEMENTADO (criar com nome obrigatório + tipo; edição); CMP-02 IMPLEMENTADO COM DECISÃO D13 DO DONO (tipos exatos WhatsRelease/WhatsList/WhatsViralCampaign; 'Aleatório' não existe — ordem direta supersede o 4º valor do PM; semântica de WhatsViralCampaign segue DEC-03 aberta); CMP-03 PULADO (semânticas FALA, nenhum algoritmo roda); CMP-04/06 PULADOS (fórmulas DEC-14; cards mostram zeros literais); CMP-05 PARCIAL (abas via archived true/false, busca, arquivar/desarquivar idempotente por item D12; seleção múltipla não implementada D10); CMP-07 PULADO (detalhe/12 abas = fatia futura); CMP-08 PARCIAL (edição sim; vínculo a projeto = campo projectId persistido sem FK até a fatia PRJ). Sem DELETE (D5). E2E HTTP provado; navegação visual não provada.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-CMP-01 (L217) | OBS-M | Criar campanha via modal: Nome (obrigatório, validação bloqueia vazio) + Tipo (select). | P1 03:32; CF 3 | Envio vazio bloqueado com mensagem; campanha aparece na lista. | — | INF-ATUAL | FEITO (API+front; SHA 1628e9d+6f9e75b; testes releases da fatia 3; A3 com smoke HTTP real) |
| GRP-CMP-02 (L218) | OBS-M | Tipo com **4 opções** vistas: "Campanha", "Lista", "Campanha viral", "Aleatório". | P1 04:05; CF 3 | As opções implementadas mapeiam para estratégias definidas. | "Campanha viral" **sem semântica** → DEC-03; não definir regra | DEC-03 | FEITO (com decisão D13 do dono: enum fechado WhatsRelease\|WhatsList\|WhatsViralCampaign, sem "Aleatório"; semântica de WhatsViralCampaign = DEC-03 aberta; SHA 1628e9d; testes fatia 3) |
| GRP-CMP-03 (L219) | FALA | Semânticas faladas: "Campanha" enche grupos em sequência sem repor anteriores; "Lista" repõe o grupo de menor ocupação; "Aleatório" distribui tráfego entre grupos. | P1 §C | Cada estratégia documentada e testada com dados sintéticos (INF: 3 distribuições já existentes). | Algoritmo real não provado; fala não é contrato | INF-ATUAL | PULADO (semânticas FALA; nenhum algoritmo de distribuição roda) |
| GRP-CMP-04 (L220) | OBS-M | Lista global de campanhas: período "últimos N dias" (7/14/21/28/90), totais Clicks, Entraram, Percentual de entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | P5 38:45/39:45; CF 20 | [PROP] Totais = soma das campanhas no filtro/período; zero legível. | Regra de agregação e fórmulas = DEC-14 | PEND-ORDEM | PULADO (DEC-14 — fórmulas/períodos de agregação) |
| GRP-CMP-05 (L221) | OBS-M | Abas Campanhas / Ativas / Arquivadas; ordenação (ex.: data de atualização); busca; grade de cards com 4 métricas; seleção múltipla e "Arquivar"; paginação; acesso "Contas e Campanhas" e "+ Campanha". | P5 38:45 | [PROP] Arquivar move para Arquivadas sem apagar dados; paginação correta. | Efeito de arquivar não demonstrado; desarquivar/excluir não amostrado (LAC) | escopo aprovado; arquivar por ids; filtro posterior | FEITO (parcial: abas via archived true/false, busca, arquivar/desarquivar por item (D12 idempotente); seleção múltipla PULADA por D10; SHA 1628e9d; testes fatia 3) |
| GRP-CMP-06 (L222) | OBS-M | Card de campanha mostra métricas resumidas, nome truncável e status. | P1 01:14; P5 38:45 | — | Quais 4 métricas exatas = DEC-14 | FIN | PULADO (DEC-14 — quais métricas; cards exibem zeros literais) |
| GRP-CMP-07 (L223) | OBS-M | Detalhe da campanha com **12 abas**: Visão geral, Contas associadas, Diagnósticos, Grupos, Solicitações de entrada, Atividades, Leadscoring, Mensagens, Mensagens recebidas, Calendário, Automações, Ações. | P1 07:05; CF 4 | Cada aba existente ou marcada pendente na matriz. | Diagnósticos, Mensagens, Mensagens recebidas, Calendário **sem conteúdo amostrado** (GRP-ZZZ) | FIN | PULADO (detalhe com 12 abas = fatia futura; não iniciado) |
| GRP-CMP-08 (L224) | RV | Vínculo da campanha a projeto (dropdown) e edição de campanha. | DL (Projetos); P5 §B | — | Não confirmado na amostragem | RV | FEITO (parcial: edição de campanha sim; vínculo a projeto persistido como projectId sem FK até a fatia PRJ; SHA 1628e9d; testes fatia 3) |

## ASC — Contas associadas da campanha (PM L226)

**Rota/tela atual candidata:** `/whats/accounts-campaigns` — T; PR #6 aba Contas associadas (demo). **Estado no sendflow-rebuild:** PARCIAL (08/11/2026, fatia ASC 7e0a755+06f8bf7, verificado A3): ASC-01 IMPLEMENTADO (associação por lista com checkbox via PATCH accountIds replace; contador N/M por campanha e por conta sempre do servidor; concorrência último-PATCH-vence declarada sem lock); ASC-02 PULADO (DEC-04); ASC-03 PULADO com pré-requisito ACM registrado (validação servidor da recusa de operação por conta não associada fica para a fatia de ações); ASC-04 PULADO (DEC-14; só critério determinístico 'não-arquivada sem contas' exibido como provisório). Associação a release arquivada permitida (comportamento contratado). E2E HTTP provado; navegação visual não provada.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-ASC-01 (L229) | OBS-M | Associar/desassociar contas à campanha por lista com checkbox e contador "N/M contas". | P1 07:05; CF 5 | Contador = associações persistidas. | — | INF-ATUAL parcial | FEITO (front na matriz Contas×Campanhas sobre PATCH /releases/:id {accountIds} replace (D13); contador N/M sempre do servidor; concorrência último-PATCH-vence declarada; SHA 7e0a755 front + 1628e9d backend; testes releases; A3) |
| GRP-ASC-02 (L230) | OBS-M | Configurações da associação com opções "especificar contas criadoras de grupos" e "especificar range de operação das contas" (Fechar/Salvar). | P1 07:05 | Opções persistem. | Papéis por conta e conteúdo do "range" **não confirmados** → DEC-04 | DEC-04 | PULADO (DEC-04) |
| GRP-ASC-03 (L231) | OBS-M | Contas não associadas aparecem com alerta "conta não associada à campanha" e sem checkbox nos assistentes de ação. | P4 30:03; CF 16 | [PROP] Backend recusa operação por conta não associada (não só UI). | Validação servidor = PROP (CK16 F02) | INF-ATUAL parcial | PULADO (pré-requisito ACM registrado; validação servidor na fatia de ações) |
| GRP-ASC-04 (L232) | OBS-M | "Campanhas expostas" = campanhas ativas sem cobertura adequada de contas (texto da UI). | P6 42:08 | Indicador coerente com associações. | "Adequada" = DEC-14 | DEC-14 | PULADO (DEC-14; só critério provisório "não-arquivada sem contas") |

## GRU — Grupos da campanha (lista, toolbar, filtros, linha) (PM L234)

**Rota/tela atual candidata:** `/whats/group-search` — T; PR #6 aba Grupos (demo). **Estado no sendflow-rebuild:** PARCIAL (09/11/2026, fatia Grupos c47a41a+1527df7, verificado A3): GRU-02 PARCIAL (busca nome/GID e filtro Todos/Cheios/Não cheios no backend + tela de busca global; 'Suspenso' pulado BLOQ-EXT); GRU-03 PARCIAL (contadores clicks/participants/limitPessoas SEPARADOS gravados, nenhum deriva do outro — DEC-05 aberta; seq derivada; clicks/participants sempre 0 até fonte futura FLX/VGC); GRU-04 IMPLEMENTADO (cheio manual idempotente SEM alterar contadores — oráculo; cheio derivado = manual OU participants>=limitPessoas, amarra DEC06 legada, gatilho fora); GRU-05 PARCIAL (marcação cheio/não-cheio por id; massa pulada D15; exclusão por id implementada D16); GRU-01/06/07/08/09/10 PULADOS (toolbar D17/DEC-05, fila futura, RV/LAC, sem consumidor). E2E HTTP provado; navegação visual não provada.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-GRU-01 (L237) | OBS-M | Toolbar: Criar grupos, Alterar grupos, Importar grupos, Atualizar links, Exportar grupos, Exportar leads, Atualizar leads, Participantes duplicados, Grupos duplicados. Vistos cinza sem grupos e amarelos com grupos. | P1 07:55; P3 21:08; CF 6 | [PROP] Ações que dependem de grupos ficam desabilitadas sem grupos e habilitadas com ≥1. | Desabilitação real inferida pela aparência (P1 §D); efeitos de atualizar links/leads = NT | recorte implementado; CSV de metadados | PULADO (D17 export / DEC-05; ações com efeito em provedor = NÃO INICIADO destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026, antes BLOQ-EXT) |
| GRP-GRU-02 (L238) | OBS-M | Filtros segmentados: Todos, Cheios, Não cheios, Suspenso; busca; vazio "nenhum registro". | P1 07:55; P4 26:40 | Filtros coerentes com contagens e busca. | Origem do estado "suspenso" = provedor (NT) | escopo aprovado; filtro técnico; busca posterior | FEITO (parcial: busca por nome/GID + filtros Todos/Cheios/Não cheios, API+front; filtro "Suspenso" NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026; antes BLOQ-EXT provedor); SHA c47a41a+1527df7; 16 testes groups; A3) |
| GRP-GRU-03 (L239) | OBS-M | Linha do grupo: número sequencial + nome, **Redirect x/limite**, **Cliques reais**, **Participantes**, copiar link, data, tipo ("Grupo normal"), select **Cheio Sim/Não** manual, ícone de dados, menu ⋮. | P3 21:08; P4 26:40; CF 12 | Três métricas separadas; nenhuma deriva da outra sem regra. | Significado exato de "Redirect" vs "Cliques reais" = DEC-05 | DEC-05 | FEITO (parcial: clicks/participants/limitPessoas gravados SEPARADOS (nenhum deriva do outro); clicks/participants sempre 0 até fonte futura FLX/VGC; DEC-05 aberta; SHA c47a41a; testes groups) |
| GRP-GRU-04 (L240) | OBS-M+PROP | Select "Cheio" Sim/Não manual visto na linha, ao lado das métricas Redirect/Cliques reais/Participantes. [PROP] "Cheio" manual separado da lotação calculada; marcar manualmente não altera contagens (critério proposto P4 §D1). | P4 26:40, §D1 | [PROP] Teste: marcar cheio não muda participantes/cliques. | Separação e precedência manual × automática não demonstradas = DEC-06 | DEC-06 | FEITO (manual idempotente SEM alterar contadores (oráculo SQL); cheio derivado = manual OU participants>=limitPessoas — amarra DEC06; gatilho fora; SHA c47a41a; testes groups) |
| GRP-GRU-05 (L241) | OBS-M | Seleção "Selecionar tudo (n/N)" e ações em massa: Marcar como cheio, Marcar como não cheio, Excluir. | P3 21:08; P4 26:40 | Massa afeta só selecionados; exclusão pede confirmação (PROP). | — | escopo aprovado; fatia implementada na API | FEITO (parcial: marcação cheio/não-cheio por id e exclusão por id (D16, 204/404); massa PULADA por D15; SHA c47a41a; testes groups) |
| GRP-GRU-06 (L242) | OBS-M | Menu ⋮: Detalhes, Marcar como cheio, Reprocessar cliques, Atualizar link de convite, Redefinir link de convite, Editar, Remover. | P3 24:05 | Cada item gera estado/ação rastreável; destrutivos confirmam. | Efeito em provedor NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — menu ⋮ com efeitos em provedor; não iniciado) |
| GRP-GRU-07 (L243) | OBS-E | Item "Alterar nome do grupo" visível na fila (P3 24:28), após edição de nome. [PROP] edição de nome gera ação própria na fila. | P3 24:28 | [PROP] Edição cria ação com estado próprio; não marca sucesso externo sem provedor. | Causalidade e persistência não provadas pela UI | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — rename via fila depende de provedor; não iniciado) |
| GRP-GRU-08 (L244) | RV/FALA (cap.) | Edição em massa de grupos (nome, descrição, admins) e exportação de dados (CSV citado). | CAP 27:05, 38:46; P4 §C | — | Modal de lote **não amostrado** (LAC-03) | RV | PULADO (LAC-03 — modal de lote não amostrado; RV) |
| GRP-GRU-09 (L245) | FALA (cap.) | Análise de grupos duplicados e participantes duplicados. | CAP 28:59; P3 §C | Botões existem (GRU-01). | Resultado/estado vazio não amostrado | PEND-ORDEM | PULADO (resultado/estado vazio não amostrados; aguarda definição) |
| GRP-GRU-10 (L246) | INF | Reservas internas idempotentes ("sempre disponíveis") e distribuição local existentes (relato). | IE; CK16 | Regressão: reservas continuam idempotentes. | Código não auditado | INF-ATUAL | PULADO (relato INF não auditado; sem consumidor local no repo novo) |

## CRG — Configuração de criação de grupos (template) e administradores (PM L248)

**Rota/tela atual candidata:** botão "Padrão de criação" em `/whats/campaigns` (candidato, conteúdo não verificado). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-CRG-01 (L251) | OBS-M | Modal com abas **Informações** / **Administradores**; trocar de aba não perde valores. | P1 09:10; P2 14:06, §E1 | Teste de preservação entre abas. | — | FIN | NÃO INICIADO |
| GRP-CRG-02 (L252) | OBS-M | Foto do grupo com editar/excluir. | P1 09:10 | Foto persiste; troca afeta só novos grupos. | Upload a provedor NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — upload de foto em provedor) |
| GRP-CRG-03 (L253) | OBS-C | Nome dos grupos (obrigatório) com contador de caracteres (visto 18/95). | P1 09:10; P2 10:34 | Contador e bloqueio acima do limite. | Limite do Grupos = DEC-12 | DEC-12 | PULADO (DEC-12) |
| GRP-CRG-04 (L254) | OBS-C | Descrição fixa (obrigatória) com contador (visto 0/2048 e 23/2048). | P1 08:26; P2 10:34 | Idem. | DEC-12 | DEC-12 | PULADO (DEC-12) |
| GRP-CRG-05 (L255) | OBS-C | Início da contagem (obrigatório; visto 1, 30, 25 — editável) e toggle "número de contagem no início" (antes/depois do nome). | P1 08:26–10:25; P2 10:34 | Numeração de novos grupos segue início e posição configurados. | Renumeração de existentes ≠ (CRG-12) | INF-ATUAL parcial | NÃO INICIADO |
| GRP-CRG-06 (L256) | OBS-C | "Quantidade de grupos sempre disponíveis" (reserva; visto 3) e "Limite de pessoas" (visto 350). | P1 08:26 | Campos obrigatórios persistem. | Valores não são defaults; manutenção de reserva = FALA (P2 §C) | INF-ATUAL parcial | NÃO INICIADO |
| GRP-CRG-07 (L257) | OBS-M | Toggles: Apenas admins podem enviar; Exigir aprovação de admin; Recusar automaticamente números bloqueados (antispam, antispam global e blacklist); Desativar criação de grupos; Criar comunidades em vez de grupos; Mensagens temporárias (select). | P1 08:26–09:55; P2 10:34–13:44 | Cada toggle persiste e tem estado visual claro. | Efeitos NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — efeitos dependem de provedor) |
| GRP-CRG-08 (L258) | OBS-M | Modo de criação segmentado **NORMAL / SEGURO**. | P1 08:26; P2 12:14 | Persistência. | "Seguro adia nome e foto" = FALA (P2 §C) → DEC-07 | DEC-07 | PULADO (DEC-07) |
| GRP-CRG-09 (L259) | OBS-M | Toggle "criar grupo aberto e fechar depois de 24h". | P1 08:26 | Persistência; agendamento de fechamento só como ação local. | Efeito NT; FALA | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — efeito NT) |
| GRP-CRG-10 (L260) | OBS-M | Aviso: alterações **não** se aplicam a grupos existentes, só a novos. | P1 08:26; P2 12:14/13:44 | Teste: salvar config não altera grupos existentes. | — | invariante do PM | NÃO INICIADO |
| GRP-CRG-11 (L261) | OBS-M | Aba Administradores: "+ Novo administrador"; seções "administradores de contas associadas" e "administradores de contas de criação associadas". | P2 14:06; CF 8 | Admins persistem ligados à config. | Campos DDI/número **não confirmados** | LAC | PULADO (LAC — campos não confirmados) |
| GRP-CRG-12 (L262) | OBS-M+PROP | Visto: botão Salvar do modal e, na aba Ações, itens "Campanha: Criar Grupo". [PROP] Salvar dá feedback real só após persistência, sem toast falso; salvar configuração **não** é criação concluída; criação gera ação na fila. | P2 14:06/14:22, §E2–3 | [PROP] Falha de persistência mostra erro; ação de criar aparece na fila. | Toast de sucesso **não confirmado**; vínculo salvar→ação não demonstrado | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — criação real + fila dependem de provedor) |

## IMP — Importação de grupos existentes (PM L264)

**Rota/tela atual candidata:** nenhuma rota identificada. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-IMP-01 (L267) | OBS-M | Assistente com etapas **Onde → Conta → Grupos → Confirmar**; avançar bloqueado sem seleção. | P3 22:32; CF 13 | Stepper preserva escolhas ao voltar. | Etapa Confirmar não amostrada | FIN | NÃO INICIADO |
| GRP-IMP-02 (L268) | OBS-M | Etapa Grupos: aviso de que a conta precisa ser administradora; Atualizar; contador "N selecionado(s)"; busca; ordenação; tabela Foto/Nome. | P3 22:32 | Contador exato. | Verificação real de admin = NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — verificação real de admin = NT) |
| GRP-IMP-03 (L269) | OBS-M | Grupos já associados à campanha aparecem marcados e desabilitados na seleção. [PROP] impedir dupla importação. | P3 22:32 | [PROP] Idempotência: reimportar não duplica. | Idempotência backend não provada | INF-ATUAL | NÃO INICIADO |
| GRP-IMP-04 (L270) | OBS-E | Item "Importar grupos" (com duração) visível na fila após a importação. [PROP] importação gera ação própria. | P3 23:40 | [PROP] Ação com estado próprio. | Persistência/estado final não legíveis | INF-ATUAL parcial | NÃO INICIADO |
| GRP-IMP-05 (L271) | OBS-M+FALA | Grupo importado preserva o nome original (visto) e recebe número/participantes exibidos. | P3 24:05; P4 24:33 | Sem "padronizar", não renomeia nem renumera. | Opções "registro de atividades"/"padronizar" **não confirmadas** → DEC-08 | DEC-08 | PULADO (DEC-08) |
| GRP-IMP-06 (L272) | INF | Importação LOCAL existente (relato). | CK16 F06 | Não afirmar sincronização com provedor. | Não auditado | INF-ATUAL | PULADO (relato INF não auditado) |

## FIL — Fila de ações (por campanha e global) (PM L274)

**Rota/tela atual candidata:** `/whats/actions` — T (fila global candidata); PR #6 aba Ações (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-FIL-01 (L277) | OBS-M | Sub-abas **Visão geral, Na fila, Agendado, Processando, Sucesso, Falhas**. | P2 14:22; CF 9 | [PROP] Cada ação aparece em exatamente um estado corrente. | Transições e máquina de estados não demonstradas (P3 23:40) | INF-ATUAL | NÃO INICIADO |
| GRP-FIL-02 (L278) | OBS-M | Filtro por intervalo de datas, "Agrupar: Sim/Não", paginação. | P2 14:22 | Filtro e paginação corretos. | — | escopo aprovado; intervalo técnico | NÃO INICIADO |
| GRP-FIL-03 (L279) | OBS-M | Ações em massa: Enviar agora, Reenviar ações travadas, Reprocessar, Cancelar, Excluir (desabilitadas sem seleção). | P2 14:22 | Cada ação de massa respeita estado (ex.: cancelar só não concluídas — PROP). | Semântica de "travada" = DEC-10 | DEC-10 | PULADO (DEC-10 — semântica de "travada") |
| GRP-FIL-04 (L280) | OBS-E | Item com selo "Agendado para <data hora>" e item com tempos de criação/início/fim e duração, visíveis na UI. | P2 14:22; P3 23:40 | [PROP] Registro de tempos reais da execução local. | Origem/persistência dos tempos desconhecidas; intervalo de ~10 min visto é exemplo | fatos por tentativa; docs precisos | PULADO (LAC — origem/persistência dos tempos) |
| GRP-FIL-05 (L281) | OBS-M | Botão "+ Adicionar" leva ao assistente de ação manual (MOD ACM). | P3 23:40; P4 30:03 | — | — | FIN | NÃO INICIADO |
| GRP-FIL-06 (L282) | OBS-M | Itens com ícones de contadores e status (verde/vermelho/amarelo). | P3 24:28 | — | Significado exato = DEC-10 | DEC-10 | PULADO (DEC-10) |
| GRP-FIL-07 (L283) | DIR+PROP | Nenhum estado afirma envio/criação real sem integração; conclusão local ≠ efeito externo; erro identificável e recuperável. | CF §6.3; CK16 F07; DIR-04 | "Sucesso" só quando o efeito do tipo da ação está confirmado; externos = bloqueado. | — | INF-ATUAL | NÃO INICIADO (diretriz DIR-04 para a fatia de ações) |
| GRP-FIL-08 (L284) | PROP | Distinguir avaliação/tentativa/conclusão persistida em observabilidade, sem renomear campos legados. | CHECKLIST-OBSERVABILIDADE-JOB-TICK-CONCLUSAO | Contadores batem com o banco. | Ver ENG-06 | INF-ATUAL | PULADO (ENG-06/PROP — observabilidade) |

## VGC — Visão geral da campanha, link único e gráficos (PM L286)

**Rota/tela atual candidata:** PR #6 aba Visão geral do detalhe (demo); `main`: nenhuma. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-VGC-01 (L289) | OBS-M | Período "últimos N dias" (7/14/21/28/90) e 8 KPIs: Clicks, Entraram, Percentual de entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | P2 14:46; CF 10 | KPIs = dados persistidos no período; zero exibido como zero. | Fórmulas = DEC-14 | PEND-ORDEM | PULADO (DEC-14) |
| GRP-VGC-02 (L290) | OBS-M | Card da campanha com acesso a Configurações. | P2 14:46 | — | — | FIN | NÃO INICIADO |
| GRP-VGC-03 (L291) | OBS-M | Card **Link de convite** (link único) com Editar e Copiar. | P2 14:46 | Copiar copia o link; editar não quebra redirecionamento existente (PROP). | Formato/domínio do link = DEC-11 | PEND-ORDEM | PULADO (DEC-11 — formato/domínio do link) |
| GRP-VGC-04 (L292) | OBS-M | Gráficos diários "Clicks" e "Entraram" com atualizar, períodos 7/14/21/28, seletor de datas e tela cheia. | P2 14:46/15:50 | Séries por dia batem com eventos registrados. | — | PEND-ORDEM | NÃO INICIADO |
| GRP-VGC-05 (L293) | FALA+PROP | Lotação/distribuição usa entradas/participantes, não cliques. | P2 §C, §E5 | Teste: cliques sem entrada não ocupam vaga. | FALA; política local documentada (CK16 F04) | INF-ATUAL | PULADO (FALA/PROP — política de lotação) |
| GRP-VGC-06 (L294) | OBS-M | Menu lateral de recursos da campanha (ver MOD REC), com "Métricas" como item inicial. | P2 14:46; P3 §A | — | — | FIN | NÃO INICIADO |

## REC — Recursos da campanha (menu lateral da visão geral) (PM L296)

**Rota/tela atual candidata:** PR #6 detalhe (demo); `main`: nenhuma. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-REC-01 (L300) | OBS-M | **Gerenciamento de tags** (item de menu). | P2 14:46 | Tela existe ou pendente. | Conteúdo **não amostrado** (LAC-04) | PEND-ORDEM | PULADO (LAC-04) |
| GRP-REC-02 (L301) | OBS-M | **Valores das variáveis**: tabela Nome / Tipo / Valor na campanha, copiar por linha, busca, paginação, "abrir painel de variáveis", Salvar. Tipos vistos: Data, Texto, Número; escopo GLOBAL visto. | P2 16:45; P3 16:52 | Valor por campanha persiste; variável usável no editor (ENT-14). | Painel global "Variáveis da campanha" não amostrado | PEND-ORDEM | NÃO INICIADO |
| GRP-REC-03 (L302) | OBS-M | **Cookie de redirecionamento** (toggle). | P3 17:07/17:36 | Toggle persiste. | "Mantém lead no mesmo grupo" = FALA; Safari/Apple não afirmar | PEND-ORDEM | NÃO INICIADO |
| GRP-REC-04 (L303) | OBS-M | **Anti-hacker** (item de menu). | P2 14:46; CAP 52:45 | — | Conteúdo não amostrado; eficácia FALA | PEND-ORDEM | PULADO (conteúdo não amostrado — LAC) |
| GRP-REC-05 (L304) | OBS-M | **Verificação de colaboradores** (item). | P2 14:46 | — | Conteúdo não amostrado; semântica DEC | PEND-ORDEM | PULADO (DEC — semântica não definida) |
| GRP-REC-06 (L305) | OBS-M | Item de integração "grupo VIP" ligado a plataforma de terceiros (rótulo cita Hotmart). | P2 14:46 | — | Não amostrado; integração NT | BLOQ-EXT | BLOQ-EXT (integração com terceiros) |
| GRP-REC-07 (L306) | OBS-M | **Gestão de comunidades** (item). | P2 14:46 | — | Não amostrado | PEND-ORDEM | NÃO INICIADO |
| GRP-REC-08 (L307) | OBS-M | **Atualização de links**, **Atualização periódica de links**, **Redefinir link de convite**. | P2 14:46; P3 20:34 | — | Efeito NT; FALA "link atualizado quando número é banido" (CAP 22:35) | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — efeito em provedor) |
| GRP-REC-09 (L308) | OBS-M | **Remover lead de campanhas anteriores**: toggle, select "campanhas anteriores", Salvar. | P3 19:36/20:34 | Seleção persiste. | Multisseleção não vista; efeito NT | BLOQ-EXT | BLOQ-EXT (efeito em provedor) |
| GRP-REC-10 (L309) | OBS-M | **Deep linking** (toggle); texto indica que libera pixel (Meta), desafio para bots e tradução automática. | P3 18:10 | Toggle persiste. | Telas de pixel/desafio/tradução **não amostradas** (LAC-05); pixel TikTok só em CAP 20:32 | PEND-ORDEM | PULADO (LAC-05) |
| GRP-REC-11 (L310) | OBS-M | **Checar participantes duplicados** (item). | P2 15:50 | — | Resultado não amostrado | PEND-ORDEM | NÃO INICIADO |
| GRP-REC-12 (L311) | OBS-M | **Métricas** (item ativo inicial). | P2 14:46 | — | = VGC | PEND-ORDEM | PULADO (DEC-14; acompanha VGC) |

## MSG — Editor de mensagem em blocos e opções de envio (PM L313)

**Rota/tela atual candidata:** nenhuma (PR #6 declara editor de mensagem fora). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-MSG-01 (L316) | OBS-M | Layout em 3 colunas: preview (fundo de conversa) com blocos; editor; opções de envio. | P4 27:33; P5 32:20 | — | Visual final = DIR-02 | FIN | NÃO INICIADO (visual final = DIR-02) |
| GRP-MSG-02 (L317) | OBS-M | Paleta de ~9 tipos de bloco: enquete, contato, evento, link, áudio, imagem, vídeo, arquivo, figurinha. | P4 27:33; CAP 32:12 | Cada tipo suportado tem validação própria. | Ícones inferidos pela forma; envio real NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — validação por tipo existe, envio real NT) |
| GRP-MSG-03 (L318) | OBS-M | Barra de formatação (negrito, itálico, tachado, código, citação), botão IA, campo de texto, Emoji, Modelos, Variáveis, "+ adicionar preview", Salvar (desabilitado sem conteúdo). | P4 27:33 | Salvar só com conteúdo válido. | Botão IA depende de provedor (NT) | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026; envio real destravado — botão IA segue BLOQ-EXT provedor de IA) (antes: BLOQ-EXT IA/envio NT) |
| GRP-MSG-04 (L319) | OBS-M | Blocos como cards com alça de arrastar, subir/descer, editar e excluir; múltiplos blocos (ex.: imagem com legenda + texto). | P4 30:38/31:57; P5 33:13 | Ordem e conteúdo preservados após editar/reordenar/excluir. | Reordenação inferida pelos controles | aceite do PM; cadeia na API | NÃO INICIADO |
| GRP-MSG-05 (L320) | OBS-C | Spintax no texto (ex.: `{a\ | b\ | c}`). | P4 31:57; P5 32:20 \\| Variação gerada só a partir das opções; spintax inválido não quebra a etapa. \\| Sem garantia anti-spam (FALA) | PEND-ORDEM | NÃO INICIADO |
| GRP-MSG-06 (L321) | OBS-M | Opções: Marcar todos (NÃO/SIM); Mensagens temporárias (NÃO/24H/7D/90D); Fixar mensagem (NÃO/24H/7D/30D); Velocidade (NÃO/RÁPIDA/NORMAL/LENTA/CUSTOM). | P4 27:33 | Persistem por ação. | Efeitos NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — efeitos NT) |
| GRP-MSG-07 (L322) | OBS-C | Envio em pacotes (itens por pacote, intervalo entre pacotes); período de envio (faixa 0H–24H); dias e horários (TODOS/SEG–DOM); **fuso horário explícito**. | P4 31:57; P5 32:20 | Configuração salva com fuso; envio fora da janela aguarda (FALA) só como regra local definida. | Valores do exemplo; continuação no dia seguinte = FALA (CAP 34:34) | INF-ATUAL parcial | NÃO INICIADO |
| GRP-MSG-08 (L323) | OBS-M | Itens de sidebar "Modelos de mensagem" e botão "Modelos" no editor. | P6 41:03; P4 27:33 | — | Tela de modelos não amostrada. INF: "modelos versionados" existem | INF | NÃO INICIADO |
| GRP-MSG-09 (L324) | INF+PROP | Persistência de rascunhos/versões/blocos preserva vínculos campanha/tenant/versão. | CHECKLIST-MIGRACAO-VINCULOS-MENSAGENS-QUATRO-TABELAS | Integridade provada por testes negativos. | Ver ENG-04 | INF-ATUAL | PULADO (ENG-04/PROP — vínculos entre tabelas) |

## ACM — Ação manual, ações administrativas e agendamento (PM L326)

**Rota/tela atual candidata:** `/whats/actions` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-ACM-01 (L329) | OBS-M | Assistente **Categoria → Campanha → Ação → Contas → Grupos → Conteúdo → Confirmar**. | P4 30:03; CF 16 | Avanço bloqueado sem escolha; estado preservado. | — | PEND-ORDEM | NÃO INICIADO |
| GRP-ACM-02 (L330) | OBS-M | Etapa Campanha com **seleção múltipla** de campanhas, busca e contador "n/N filtrado". | P5 34:10 | Contador correto; não altera campanhas não selecionadas. | — | PEND-ORDEM | NÃO INICIADO |
| GRP-ACM-03 (L331) | OBS-M | Etapa Contas: "todas as contas da campanha" / "contas específicas"; não associadas bloqueadas. | P4 30:03 | Backend recusa conta não associada. | — | PEND-ORDEM | NÃO INICIADO |
| GRP-ACM-04 (L332) | OBS-M | Ação "Trocar configuração": apenas admins / todos enviam; apenas admins / todos mudam configurações; exigir / permitir entrada sem aprovação. | P5 34:45; CF 18 | Escolha obrigatória. | Efeito NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — efeito NT) |
| GRP-ACM-05 (L333) | OBS-M | Ação "Privacidade avançada na conversa": Sim (ativar) / Não. | P5 35:45 | — | Efeito NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — efeito NT) |
| GRP-ACM-06 (L334) | FALA (cap.) | Ações em massa de nome, descrição e admins. | CAP 38:46 | — | Telas não amostradas | PEND-ORDEM | PULADO (telas não amostradas) |
| GRP-ACM-07 (L335) | OBS-M | Confirmar: resumo (categoria, campanhas, contas, grupos, preview com contador de mensagens); campo **Agendar** com seletor data/hora e OK. | P5 33:40; CF 17 | Resumo = escolhas feitas. | Data do exemplo não é default | INF-ATUAL parcial | NÃO INICIADO |
| GRP-ACM-08 (L336) | OBS-M | Dois botões: "Agendar envio para <data/hora>" e "Agendar e programar outra ação". [PROP] o segundo mantém o contexto (campanha, contas, grupos). | P5 33:40 | [PROP] Cada confirmação cria **uma** ação; sem duplicatas por duplo clique/reenvio. | Manutenção de contexto inferida do rótulo; segunda ação na lista não amostrada | PEND-ORDEM | NÃO INICIADO |
| GRP-ACM-09 (L337) | DIR | Envio real bloqueado até integração autorizada. | DIR-04/06 | Ação agendada fica "agendada/bloqueada", nunca "enviada". | — | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — diretriz DIR-04, envio real bloqueado) |

## AUT — Automações e cronograma (PM L339)

**Rota/tela atual candidata:** `/whats/automations` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-AUT-01 (L342) | OBS-M | Assistente **Campanha → Grupo → Gatilho → Conta → Ação → [Agendar] → Conteúdo → Confirmar**. | P4 27:08/27:33; P5 36:40; CF 14 | Etapas validadas; "Agendar" presente para recorrência. | Etapa Gatilho **não amostrada** | PEND-ORDEM | NÃO INICIADO |
| GRP-AUT-02 (L343) | OBS-M | Etapa Grupo: "todos os grupos da campanha" / "grupos específicos". | P4 27:08 | — | — | PEND-ORDEM | NÃO INICIADO |
| GRP-AUT-03 (L344) | OBS-M | Gatilho visto na lista: "ao encher grupo da campanha" (capítulo: boas-vindas quando o grupo enche). | P4 29:27; CAP 30:26 | [PROP] Gatilho dispara com base em estado local definido de "cheio", uma vez por ocorrência conforme contrato. | Disparo único e relação com Cheio manual não demonstrados = DEC-06 | DEC-06 | PULADO (DEC-06 — gatilho "ao encher grupo" adiado por decisão) |
| GRP-AUT-04 (L345) | OBS-M | Lista: toggle Ativado, contadores (incl. "Fila"), status, editar, ⋮; filtros Ativado/Desativado/Todos; "+ Adicionar", "Importar JSON"; massa Desativar/Ativar/Duplicar/Excluir. | P4 29:27 | Duplicar cria cópia independente; desativar não perde config. | Formato do JSON = DEC (não inventar) | escopo aprovado; duplicar uma, filtro de lista e massa de estado | NÃO INICIADO |
| GRP-AUT-05 (L346) | OBS-C | Cronograma: periodicidade 7 DIAS / 14 DIAS / 28 DIAS / MENSAL; dia da semana (TODOS, SEG–DOM); hora e minuto; iniciar/parar em (datas); fuso; **próxima execução estimada** exibida com fuso. | P5 36:40/37:50; CF 19 | Próxima execução coerente com fuso/regra. | "Dias do mês"/iniciar-pausar não vistos; fim de mês 29–31 e horário inexistente/ambíguo = DEC-15 | INF-ATUAL parcial + DEC-15 | NÃO INICIADO (DEC-15 ao implementar) |
| GRP-AUT-06 (L347) | OBS-M | Automações sob webhook (evento → ação) — ver MOD WHE. | P8 56:02 | — | — | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — evento de webhook externo) |
| GRP-AUT-07 (L348) | INF+PROP | **Estado histórico informado à época** do checklist de recorrência: mensal com políticas explícitas de horário inexistente/ambíguo; diária/semanal convertendo horário local diretamente, sem política selecionada. Estado vigente deve ser **reconfirmado por revisão** do responsável; este prompt não manda reverter nada hoje. | CHECKLIST-RECORRENCIA-DIARIA-SEMANAL-HORARIO-LOCAL | [PROP] Não mudar semântica de registros legados sem decisão. | Snapshot, não estado atual; ENG-05 | INF-ATUAL | PULADO (ENG-05 — snapshot histórico a reconfirmar) |

## PRJ — Projetos (PM L350)

**Rota/tela atual candidata:** `/whats/projects` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-PRJ-01 (L353) | OBS-M | Projeto (pasta) com Editar e Excluir (destrutivo destacado). | P6 40:16; CF 21 | Exclusão confirma e define destino dos itens (DEC-16). | Efeito de excluir não visto | recorte provado; exclusão do vazio e edição limitada | EM ANDAMENTO (fatia 6 Projetos na branch a1/projetos, commit 6690e06, sem merge e sem verificação A3; API /api/v1/projects + migração 007; 98/98 testes no worktree) |
| GRP-PRJ-02 (L354) | OBS-M | Período e 8 KPIs do projeto (mesmos rótulos dos da campanha). | P6 40:16 | [PROP] Totais somam só campanhas do projeto. | Agregação não demonstrada; DEC-14 | DEC-14 | EM ANDAMENTO (fatia 6 Projetos na branch a1/projetos, commit 6690e06, sem merge e sem verificação A3; API /api/v1/projects + migração 007; 98/98 testes no worktree); KPIs do projeto dependem de DEC-14 |
| GRP-PRJ-03 (L355) | OBS-M | Colunas Contas / Campanhas / Webhooks do projeto, com contador, vazio legível. | P6 40:16 | — | — | contas e webhooks de configuração derivados | EM ANDAMENTO (fatia 6 Projetos na branch a1/projetos, commit 6690e06, sem merge e sem verificação A3; API /api/v1/projects + migração 007; 98/98 testes no worktree) |
| GRP-PRJ-04 (L356) | FALA+PROP | Projetos separam campanhas por cliente. | P6 §C; CAP 43:05 | Testes negativos: dados de um projeto não aparecem em outro filtro. | Isolamento/permissão **não provado** | INF-ATUAL | EM ANDAMENTO (fatia 6 Projetos na branch a1/projetos, commit 6690e06, sem merge e sem verificação A3; API /api/v1/projects + migração 007; 98/98 testes no worktree); isolamento por projeto a validar na revisão |

## MET — Métricas globais e alertas (PM L358)

**Rota/tela atual candidata:** nenhuma (métricas 42:08 ausentes, segundo Referência e PR #6). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-MET-01 (L361) | OBS-M | Atalhos em chips (Campanhas, Contas, Automações, Webhooks, Contas × Campanhas). | P6 42:08 | — | São atalhos, não abas | PEND-ORDEM | NÃO INICIADO |
| GRP-MET-02 (L362) | OBS-M | Card "Alertas" recolhível com vazio legível. | P6 42:08 | — | Regras de alerta = DEC | PEND-ORDEM | PULADO (DEC — regras de alerta) |
| GRP-MET-03 (L363) | OBS-M | "O que precisa de atenção": N campanhas expostas; N contas ociosas. | P6 42:08 | Contagens coerentes. | Fórmula FALA/DEC-14 | escopo aprovado; parcial | PULADO (DEC-14) |
| GRP-MET-04 (L364) | OBS-M | "Operação do dia": Cliques hoje, Entradas hoje, média 7d, variação % vs média. | P6 42:08/42:24 | Variação calculada sobre dados reais; sem dados = vazio. | Fórmula exata DEC-14 | DEC-14 | PULADO (DEC-14) |
| GRP-MET-05 (L365) | OBS-M | Listas "campanhas ativas sem cliques hoje" e "desconectadas nas últimas 24h". | P6 42:08 | — | — | PEND-ORDEM | NÃO INICIADO |
| GRP-MET-06 (L366) | FALA (cap.) | Funil e análises gráficas globais. | CAP 44:51 | — | **Não amostrados** (LAC-06) | LAC-06 | PULADO (LAC-06) |

## LSC — Leadscoring (PM L368)

**Rota/tela atual candidata:** PR #6 aba Leadscoring (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-LSC-01 (L371) | OBS-C | Chips de status por tipo de evento com pontos **mostrados** (vistos: Recebeu 10, Visualizou 20, Reproduziu 40, Reagiu 50, Mensagem 60). | P6 43:55; CF 24 | [PROP] Tipos/pontos seguem a decisão DEC-17. | Se tipos/pontos são configuráveis ou fixos **não foi demonstrado** = DEC-17; valores = exemplo; cálculo NT | DEC-17 | PULADO (DEC-17) |
| GRP-LSC-02 (L372) | OBS-M | Gráfico "volume por hora — últimos 7 dias" com POR HORA/POR DIA, barras empilhadas por tipo. | P6 43:55 | — | Eventos dependem de provedor | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — eventos de provedor) |
| GRP-LSC-03 (L373) | OBS-M | Tabela #, Número (mascarado), Pontos, ⋮; paginação; busca; Exportar. | P6 43:55 | Número mascarado; exportação com permissão (PROP). | — | PEND-ORDEM | NÃO INICIADO |

## ATV — Atividades (PM L375)

**Rota/tela atual candidata:** PR #6 aba Atividades — só nome. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-ATV-01 (L378) | OBS-M | Aba "Atividades" existe na campanha. | P1 07:05; P6 43:55 | — | Conteúdo **não amostrado**; tabela número/grupo/evento/data e exportar = RV (LAC-07) | PEND-ORDEM | NÃO INICIADO |

## SOL — Solicitações de entrada (PM L380)

**Rota/tela atual candidata:** PR #6 aba Solicitações (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-SOL-01 (L383) | OBS-M | Sub-abas Pendentes / Processadas / Configurações; selo "N pendente(s)". | P6 44:06/45:01; CF 25 | Contagem coerente. | — | PEND-ORDEM | NÃO INICIADO |
| GRP-SOL-02 (L384) | OBS-M | Busca por número completo; aprovar/recusar selecionadas (desabilitados sem seleção). | P6 44:06 | Ação só sobre selecionadas; registro em Processadas. | Efeito NT | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026; parcial — aprovar/recusar real destravado, telas não iniciadas) (antes: BLOQ-EXT aprovar/recusar real NT) |
| GRP-SOL-03 (L385) | OBS-M | Estados carregando e vazio ("nenhuma solicitação pendente"). | P6 44:06/45:01 | — | — | PEND-ORDEM | NÃO INICIADO |
| GRP-SOL-04 (L386) | FALA+PROP | Sem tag, solicitação fica pendente; sem auto-aprovação implícita. | P6 §C, §D4 | — | Configurações por tag **não amostradas** (LAC-08) | LAC-08 | PULADO (LAC-08) |
| GRP-SOL-05 (L387) | OBS-M | Recusa automática de bloqueados configurada no template (CRG-07). | P1 09:10 | — | Funcionamento não demonstrado | BLOQ-EXT | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026) (antes: BLOQ-EXT — funcionamento real NT) |

## ASP — Anti-spam (PM L389)

**Rota/tela atual candidata:** `/whats/seguranca` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-ASP-01 (L392) | OBS-M | Abas Números bloqueados / Números administrativos / Contas associadas. | P6 46:10/47:45; CF 26 | — | Aba Contas associadas não amostrada | PEND-ORDEM | NÃO INICIADO |
| GRP-ASP-02 (L393) | OBS-M | Bloqueados: Analisar grupos, Exportar, Adicionar, Adicionar CSV, Adicionar CSV (admin), Excluir; busca com aviso de filtro por data/página; intervalo de datas; ordenação; tabela Nome/Número/Criação/Atualização/⋮. | P6 46:10 | Import CSV valida linhas; números mascarados. | "Analisar grupos" efeito NT | escopo aprovado; CSV da organização | NÃO INICIADO |
| GRP-ASP-03 (L394) | OBS-M | Administrativos: lista separada com Adicionar, Adicionar CSV, busca, ordenação alfabética, Nome/Número. | P6 47:45 | Número não pode estar nas duas listas sem conflito resolvido (PROP). | Precedência = DEC-18 | DEC-18 | PULADO (DEC-18) |
| GRP-ASP-04 (L395) | FALA (cap.) | Anti-spam global (compartilhado) e anti-hacker. | CAP 49:21, 52:45 | — | Compartilhamento global **não provado**; não definir | PEND-ORDEM | PULADO (FALA — não definir) |

## BLK — Blacklists (PM L397)

**Rota/tela atual candidata:** `/whats/seguranca` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-BLK-01 (L400) | OBS-M | Lista de blacklists; detalhe com nome, editar, ⋮ e abas Campanhas / Números. | P7 48:40/49:30; CF 27 | — | Aba Números não amostrada | PEND-ORDEM | NÃO INICIADO |
| GRP-BLK-02 (L401) | OBS-M | Aba Campanhas com lista de campanhas com checkbox (uma selecionada). [PROP] aplicação da lista por campanha selecionada. | P7 48:40 | [PROP] Não vaza para campanhas não marcadas. | Efeito da seleção não demonstrado | PEND-ORDEM | NÃO INICIADO |

## IAG — Agente de IA (rótulo da referência: "SendIA") (PM L403)

**Rota/tela atual candidata:** nenhuma (SendIA fora, segundo PR #6). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-IAG-01 (L406) | OBS-M | Lista de agentes e "+ Adicionar". | P7 50:31 | — | — | BLOQ-EXT | BLOQ-EXT (provedor de IA) |
| GRP-IAG-02 (L407) | OBS-M | Assistente **Escolher IA → Treinamento → Configurar**. | P7 51:21; CF 28 | Estado preservado entre etapas. | — | BLOQ-EXT | BLOQ-EXT (provedor de IA) |
| GRP-IAG-03 (L408) | OBS-C | Escolher IA: plataforma (2 opções vistas), tipo (texto simples / texto com tópico / assistente), modelo, **campo de credencial**, intervalo entre respostas (faixa em segundos). | P7 51:21 | Credencial mascarada, nunca reexibida/logada/exportada (PROP). | Na referência o campo aparece **sem máscara** — não reproduzir; provedor NT | BLOQ-EXT | BLOQ-EXT (provedor de IA; credencial) |
| GRP-IAG-04 (L409) | OBS-M | Treinamento: contadores texto/total/limite; "instruções de comportamento" com contador e resetar; "texto do treinamento". | P7 51:46 | Limites respeitados. | Valores exemplo; conteúdo não transcrito | BLOQ-EXT | BLOQ-EXT (provedor de IA) |
| GRP-IAG-05 (L410) | OBS-M | Regras "se o texto de resposta da IA contiver [texto] → então [multiselect]": remover pessoa do grupo, apagar mensagem da pessoa, marcar administradores, não responder mais. | P7 51:46/52:34 | [PROP] Validação de vazio/duplicata; prévia da ação. | [PROP] política própria e revisão humana para ações consequenciais = proposta pendente DEC-19 (não observada); NT | DEC-19 | PULADO (DEC-19) |
| GRP-IAG-06 (L411) | OBS-M | Configurar: nome; campanhas com checkbox e status; Sim/Não "responder sem '?'", "primeira resposta do bot sem IA", "responder administradores"; tipo Privado / Campanhas. | P7 53:42 | Escopo respeitado. | Campanhas sem checkbox = inferência | BLOQ-EXT | BLOQ-EXT (provedor de IA) |
| GRP-IAG-07 (L412) | OBS-M | Detalhe do agente: abas Visão geral / Threads / Ações; card com tipo, editar, ⋮; toggle de ativação. | P8 54:41 | Estado ativo inequívoco. | Rótulo ambíguo na referência — não inferir | BLOQ-EXT | BLOQ-EXT (provedor de IA) |

## WHE — Webhooks de entrada (integrações) (PM L414)

**Rota/tela atual candidata:** `/whats/webhooks` — T (ambíguo entrada/saída); `/whats/integracoes` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-WHE-01 (L417) | OBS-M | Lista com abas Integrações / Arquivadas, ordenação, "+ Webhook", cards. | P8 55:08; CF 29 | — | — | configuração local | NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026; eventos WhatsApp passam a existir) |
| GRP-WHE-02 (L418) | OBS-M | Criação com escolha de plataforma (~20 vistas, ex.: plataformas de cursos/pagamento, API genérica, CRM/e-mail, e-commerce; algumas BETA). | P8 55:08 | — | Campos Nome/Projeto **não legíveis**; cada plataforma exige contrato próprio (bloqueado) | BLOQ-EXT | BLOQ-EXT (contrato por plataforma) |
| GRP-WHE-03 (L419) | OBS-M | Detalhe: Visão geral / Contas associadas / Automações / Eventos; automação "quando <evento>" com Ativado e contadores. | P8 56:02 | — | Endpoint/URL **não** visto nem a definir aqui | vínculo explícito | BLOQ-EXT (endpoint externo) |
| GRP-WHE-04 (L420) | OBS-M | Assistente **Categoria → webhook → Configurações → Gatilho → Conta → Ação → Confirmar**. | P8 56:09 | — | Campo de produto não amostrado | BLOQ-EXT | BLOQ-EXT (assistente com ações externas) |
| GRP-WHE-05 (L421) | OBS-M | Eventos vistos (checkbox): compra aprovada, abandono de carrinho, impressão de boleto, pedido de reembolso, compra cancelada, compra estornada, compra completada, pagamento atrasado, compra expirada (lista continua). | P8 56:09 | — | Mapeamento por plataforma = contrato externo | BLOQ-EXT | BLOQ-EXT (mapeamento por plataforma) |
| GRP-WHE-06 (L422) | OBS-M | Ações vistas: enviar mensagem, enviar SMS, fazer ligação, requisição HTTP, tag condicional, remover/adicionar à campanha, remover lead, adicionar tag (lista continua). | P8 56:14 | — | SMS/ligação/HTTP = NT; bloqueados | BLOQ-EXT | BLOQ-EXT (SMS/ligação/HTTP NT) |

## WHS — Webhooks de saída (rótulo da referência: "Sendhooks") (PM L424)

**Rota/tela atual candidata:** `/whats/webhooks` — T (ambíguo); `/whats/integracoes` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-WHS-01 (L427) | OBS-M | Abas lista / Histórico; "+ Adicionar"; cards "envia eventos de <evento>" com info e excluir. | P8 57:32; CF 30 | — | Horários de envio de métricas = texto de UI, não regra | BLOQ-EXT | BLOQ-EXT (envio a destino externo) |
| GRP-WHS-02 (L428) | OBS-M | Estado de erro visível (limite de erros, código HTTP) com "Marcar como resolvido". | P8 57:32 | [PROP] Erro permanece visível até marcado como resolvido; contador coerente. | Persistência do erro não demonstrada | BLOQ-EXT | BLOQ-EXT (entrega externa) |
| GRP-WHS-03 (L429) | OBS-M | Criar: Nome, Link de destino, credencial gerada (mascarada), busca de eventos com contador; grupos de eventos CAMPANHA (métricas da campanha, métricas de mensagens, solicitações de entrada), GRUPOS (membro adicionado, membro removido, grupo suspenso, bloqueio de crescimento), CONTAS (conta banida, restrição temporária). | P8 59:01 | Lista de eventos declarada; sem eventos ocultos. | Credencial vista em claro — **não reproduzir** | BLOQ-EXT | BLOQ-EXT (envio externo) |
| GRP-WHS-04 (L430) | OBS-C | "Limite de erros até desativar" (stepper). | P8 59:01 | Desativação explícita e visível. | Valor exemplo | BLOQ-EXT | BLOQ-EXT (entrega externa) |
| GRP-WHS-05 (L431) | DIR | Nenhum envio a destino externo sem autorização. | DIR-04 | — | NT | BLOQ-EXT | BLOQ-EXT (diretriz DIR-04) |

## BRD — Broadcast(s) e Leads (PM L433)

**Rota/tela atual candidata:** `/whats/broadcasts` — P; `/whats/leads-groups` — P; `/whats/leads` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-BRD-01 (L436) | OBS-M | Broadcasts: vazio + "Cadastrar"; grade de cards com nome, status e alerta "nenhuma conta associada". | P8 1:01:01; P9 1:02:07; CF 31 | Alerta de dependência visível. | Detalhe/busca não amostrados | BLOQ-EXT | BLOQ-EXT (envio NT) |
| GRP-BRD-02 (L437) | OBS-M | Itens distintos "Broadcast", "Leads" e "Broadcasts" na sidebar. | P6 41:03; P8 1:01:01 | — | Diferença semântica = DEC-20 | DEC-20 | PULADO (DEC-20) |
| GRP-BRD-03 (L438) | FALA (cap.) | Mensagens um a um, SMS e ligação. | CAP 64:52 | — | NT; bloqueado | BLOQ-EXT | BLOQ-EXT (SMS/ligação NT) |

## TRN — Treinamentos e suporte (PM L440)

**Rota/tela atual candidata:** `/whats/contents` — P (bloqueado). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-TRN-01 (L443) | OBS-M | Grade de cursos com selo de conclusão. | P9 1:02:50; CF 32 | — | **Escopo = DEC-09**; não inventar player/checkout | DEC-09 | PULADO (DEC-09) |
| GRP-TRN-02 (L444) | OBS-M | Curso: voltar, barra de progresso, busca de aula, "continuar de onde parei", módulos recolhíveis com aulas numeradas e concluídas. | P9 1:02:55/1:03:17 | Progresso coerente com aulas concluídas. | Player **não confirmado** (RV) | DEC-09 | PULADO (DEC-09) |
| GRP-TRN-03 (L445) | OBS-M | Widget de ajuda: saudação, status de atendimento, iniciar conversa, artigos populares, artigo passo a passo. | P9 1:03:29/1:03:40/1:03:52 | Não bloqueia a página; indisponibilidade visível. | Suporte externo = DEC-09 | DEC-09 | PULADO (DEC-09) |

## ZZZ — Áreas vistas apenas como rótulo (sem conteúdo amostrado) (PM L447)

**Rota/tela atual candidata:** ver linha; parte das abas está no PR #6 só com o nome. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-ZZZ-01 (L451) | (rótulo; sem coluna Classe no PM) | Aba Diagnósticos (campanha) | P1 07:05 | — | conteúdo desconhecido | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-02 (L452) | (rótulo; sem coluna Classe no PM) | Aba Mensagens (campanha) | P1 07:05 | — | provável lista de mensagens/ações — não presumir | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-03 (L453) | (rótulo; sem coluna Classe no PM) | Aba Mensagens recebidas | P1 07:05 | — | depende de provedor (NT) | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-04 (L454) | (rótulo; sem coluna Classe no PM) | Aba Calendário | P1 07:05 | — | provável visão de agendamentos — não presumir | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-05 (L455) | (rótulo; sem coluna Classe no PM) | Variáveis da campanha (global) | P6 41:03; P2 16:45 ("abrir painel") | — | parcial | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-06 (L456) | (rótulo; sem coluna Classe no PM) | Deep link (global) | P6 41:03 | — | só toggle por campanha visto | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-07 (L457) | (rótulo; sem coluna Classe no PM) | Alertas (global) | P6 41:03 | — | só card no painel | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-08 (L458) | (rótulo; sem coluna Classe no PM) | Modelos de mensagem | P6 41:03 | — | INF: modelos versionados | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-09 (L459) | (rótulo; sem coluna Classe no PM) | Leads (global) | P6 41:03 | — | — | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-10 (L460) | (rótulo; sem coluna Classe no PM) | "SendSpace" | P6 41:03 | — | nome proprietário; semântica desconhecida | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-11 (L461) | (rótulo; sem coluna Classe no PM) | "SendAPI" | P6 41:03 | — | API pública do produto **não** definida aqui | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-12 (L462) | (rótulo; sem coluna Classe no PM) | "MCP" (BETA) | P6 41:03 | — | não definir | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-13 (L463) | (rótulo; sem coluna Classe no PM) | Histórico | P6 41:03 | — | — | DEC | PULADO (DEC — semântica desconhecida; não inventar) |
| GRP-ZZZ-14 (L464) | (rótulo; sem coluna Classe no PM) | Equipe | P7 48:21 | — | permissões/papéis **não demonstrados**; não inventar admin | DEC-21 | PULADO (DEC-21) |
| GRP-ZZZ-15 (L465) | (rótulo; sem coluna Classe no PM) | Mapa Contas × Campanhas / "Ver dashboard" | P1 01:14 | — | só cartão visto | DEC | PULADO (DEC — semântica desconhecida; não inventar) |

## VIS — Linguagem visual (para a etapa final de design, outro responsável — DIR-02/03) (PM L467)

**Rota/tela atual candidata:** todas (estilo global `app/src/styles/global.css`). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-VIS-01 (L470) | (rótulo; sem coluna Classe no PM) | OBS-M | Tema escuro; cards cinza-escuros com bordas sutis e cantos levemente arredondados; linha de destaque fina no topo. | — | CF §1; P1 01:14 | FIN | PULADO (fora de escopo por ordem do dono 09/11/2026 — etapa visual final encerrada (DIR-02/03)) |
| GRP-VIS-02 (L471) | (rótulo; sem coluna Classe no PM) | OBS-M | Uma cor de destaque para ação primária, foco, toggle ligado, aba ativa e etapa concluída (referência usa amarelo; **cor própria = DEC-01**); verde = online/sucesso; vermelho = excluir/erro/dependência; laranja = conclusão de curso/série. | — | CF §1 | FIN | PULADO (fora de escopo por ordem do dono 09/11/2026 — etapa visual final encerrada (DIR-02/03)) |
| GRP-VIS-03 (L472) | (rótulo; sem coluna Classe no PM) | OBS-M | Tipografia sans-serif; botões em caixa alta pequena; rótulos flutuantes. | — | CF §1 | FIN | PULADO (fora de escopo por ordem do dono 09/11/2026 — etapa visual final encerrada (DIR-02/03)) |
| GRP-VIS-04 (L473) | (rótulo; sem coluna Classe no PM) | OBS-M | Componentes: sidebar de ícones expansível, breadcrumb, abas sublinhadas, sub-abas, grupos segmentados, rádios em cards com ícone, checkbox em listas, toggles, select/multiselect, sliders simples e de faixa, seletor data/hora com OK, stepper 3–8 etapas, cards KPI, gráficos barras/linhas, tabelas paginadas, menus ⋮, modais com fundo escurecido e botão primário largo, selos (BETA, contadores, variação %), avisos inline, widget flutuante. | — | CF §1; GA | FIN | PULADO (fora de escopo por ordem do dono 09/11/2026 — etapa visual final encerrada (DIR-02/03)) |
| GRP-VIS-05 (L474) | (rótulo; sem coluna Classe no PM) | OBS-M | Estados: foco, desabilitado, validação obrigatória, vazio, carregando, erro de conector com "resolvido", alerta de dependência, selo "agendado para". | — | CF §1 | FIN | PULADO (fora de escopo por ordem do dono 09/11/2026 — etapa visual final encerrada (DIR-02/03)) |
| GRP-VIS-06 (L475) | (rótulo; sem coluna Classe no PM) | DIR | Alvo 88–96% de fidelidade qualitativa informado; não medido; sem medidas inventadas; sem copiar marca/textos. | — | DIR-03/08 | FIN | PULADO (fora de escopo por ordem do dono 09/11/2026 — etapa visual final encerrada (DIR-02/03)) |

## EXC — Conteúdo observado e excluído (PM L477)

**Rota/tela atual candidata:** não aplicável (conteúdo excluído). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-EXC-01 (L480) | (rótulo; sem coluna Classe no PM) | Página de planos/preços (3 colunas, assinatura via conversa externa, sem checkout) | P9 1:04:00–1:07:30; CF 33 | — | **Não é requisito**; preços/planos/limites não transcritos; sem checkout | EXC | PULADO (EXC — não é requisito do produto) |
| GRP-EXC-02 (L481) | (rótulo; sem coluna Classe no PM) | Logotipos/capas de terceiros, nomes de clientes, saudações personalizadas | P4 30:38; P9 1:02:07/1:02:50; P6 42:08 | — | Não reproduzir | EXC | PULADO (EXC — não é requisito do produto) |
| GRP-EXC-03 (L482) | (rótulo; sem coluna Classe no PM) | Alegações de eficácia anti-ban, "escudo", ROI, taxas | P2 §C/D; P7 §C; P8 §C | — | Não registrar como requisito | EXC | PULADO (EXC — não é requisito do produto) |

## INT — Integração com provedor de mensageria (Meta / WhatsApp) (PM L484)

**Rota/tela atual candidata:** nenhuma; `/whats/integracoes` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

> **DECISÃO D19 DO DONO (12/11/2026):** a integração WhatsApp deixa de ser Embedded Signup v5 da Meta e passa a ser **conexão por QR code via Evolution API 2.3.7** (self-hosted, estável; **2.4.x é RC e exige licença — NÃO usar**). Evolution dedicada ao Grupos no projeto Railway "grupos", com Postgres, Redis e volume persistentes próprios; comunicação pela rede interna do Railway; chave da Evolution (`AUTHENTICATION_API_KEY`) só em variável de ambiente. Efeitos nesta matriz: GRP-INT-01 SUBSTITUÍDO (ES v5 → QR Evolution); INT-03 e INT-05 OBSOLETAS (exigências contratuais Meta/código OAuth não existem no caminho QR); os IDs BLOQ-EXT que dependiam do provedor WhatsApp foram reclassificados para `NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026)`.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) | Estado no repo (09/11/2026) |
|---|---|---|---|---|---|------|
| GRP-INT-01 (L487) | DIR | Caminho de integração escolhido: Embedded Signup v5 em modalidade REGULAR (escolha informada de Loigo). | DIR-06; CK16 §estado | Preparação só com cliente desativado e sem Internet, quando ordenada. | **Não** prova Groups/Graph/OBA/capacidade; não vem do vídeo | INF-ATUAL + BLOQ-EXT | SUBSTITUÍDO (ES v5 descartado pela decisão D19 de 12/11/2026 — passa a conexão por QR code via Evolution API 2.3.7; antes: BLOQ-EXT integração ES v5 — DIR-06) |
| GRP-INT-02 (L488) | DIR+PROP | Sessão/vinculação separada da conta, com IDs externos distintos, origem, tenant, replay e readiness explícitos; nunca "conectado" falso. | CK16 F01; CHECKLIST-RETENCAO-REPLAY-ES5; CHECKLIST-TROCA-CODIGO-TOKEN-ES5 | Testes negativos sem rede. | Contrato oficial atual pendente | INF-ATUAL | PULADO (PROP — contrato oficial pendente) |
| GRP-INT-03 (L489) | DIR | Ativação real exige documentação oficial atual, conta, contrato, permissões/elegibilidade e autorização específica futura. | DIR-06; CK16 L71 | Sem isso: estado "bloqueado/não integrado". | Sem conexão/envio/deploy | BLOQ-EXT | OBSOLETA (exigência contratual Meta não existe no caminho QR da Evolution — decisão D19 de 12/11/2026; antes: BLOQ-EXT documentação/contrato/autorização específica) |
| GRP-INT-04 (L490) | PROP | Toda função que depende do provedor (criar/editar grupo real, enviar, aprovar entrada, ler participantes, detectar ban/desconexão) mantém estado local honesto até integração. | CF §6.3; DL | Matriz marca NT/bloqueado. | — | INF-ATUAL | NÃO INICIADO (diretriz transversal de honestidade de estado) |
| GRP-INT-05 (L491) | INF | **Estado histórico informado à época** do checklist: um gate recusava troca de código de autorização por credencial; mudar isso seria **nova função**, não endurecimento. Estado vigente do gate deve ser **reconfirmado por revisão**; este prompt não manda reverter nada hoje. | CHECKLIST-TROCA-CODIGO-TOKEN-ES5 §1–2 | [PROP] Enquanto o gate antigo vigorar, seus testes negativos permanecem. | Snapshot, não estado atual; decisão contratual pendente | BLOQ-EXT | OBSOLETA (checklist de troca de código OAuth do ES v5 não se aplica ao QR da Evolution — decisão D19 de 12/11/2026; antes: BLOQ-EXT decisão contratual pendente) |

## Contagem por estado legado (primeira cláusula da coluna de escopo)

- BLOQ-EXT: 42
- PEND-ORDEM: 33
- FIN: 20
- INF-ATUAL: 15
- DEC: 14
- INF-ATUAL parcial: 8
- escopo aprovado: 8
- DEC-14: 3
- DEC-09: 3
- EXC: 3
- RV: 2
- DEC-06: 2
- DEC-12: 2
- DEC-10: 2
- FIN + dados: 1
- DEC-03: 1
- DEC-04: 1
- recorte implementado: 1
- DEC-05: 1
- DEC-07: 1
- invariante do PM: 1
- LAC: 1
- DEC-08: 1
- fatos por tentativa: 1
- aceite do PM: 1
- INF: 1
- INF-ATUAL parcial + DEC-15: 1
- recorte provado: 1
- contas e webhooks de configuração derivados: 1
- LAC-06: 1
- DEC-17: 1
- LAC-08: 1
- DEC-18: 1
- DEC-19: 1
- configuração local: 1
- vínculo explícito: 1
- DEC-20: 1
- DEC-21: 1
- INF-ATUAL + BLOQ-EXT: 1

Total: 182 IDs.

## Contagem por estado no repo (09/11/2026, coluna nova por ID; atualizada 12/11/2026 pela decisão D19)

- FEITO (inclui "parcial" com partes puladas): 18
- EM ANDAMENTO (fatia 6 Projetos, WIP em a1/projetos): 4
- PULADO (DEC-xx / LAC / EXC / fora de escopo / aguarda definição): 72
- BLOQ-EXT (provedor/integração, DIR-06): 20
- NÃO INICIADO: 65
- SUBSTITUÍDO (D19 — ES v5 → Evolution QR): 1
- OBSOLETO (D19 — exigências Meta/OAuth fora do caminho QR): 2

Total: 182 IDs. Fonte: coluna "Estado no repo (09/11/2026)" acima. Atualização 12/11/2026 (decisão D19 — Evolution 2.3.7 destrava o provedor WhatsApp): 20 IDs BLOQ-EXT → NÃO INICIADO (destravado p/ Evolution 2.3.7) + INT-01 → SUBSTITUÍDO e INT-03/INT-05 → OBSOLETAS; BLOQ-EXT 43→20, NÃO INICIADO 45→65.

## Registro de mudanças de estado

- **08/11/2026** — Fatia 1 (Fundação) mergeada no main (e14c4b7, d3bd71a, bf3c051): backend base + auth de servidor + privacidade (e02196b remove capturas da referência do repo público). Nenhum ID GRP-* alterou de estado. Deploy/push bloqueados (credencial Railway / permissão) — produção segue no front estático 81d75b9.
- **08/11/2026** — Fatia 2 (Contas/CTA) mergeada no main (e6a3e55, cb6cb62, 743f06e): CTA-01/03 implementados, CTA-02 parcial honesto, CTA-04/05/06 pulados (DEC-14/BLOQ-EXT). Verificacao A3 APROVADA (smoke real). Nenhum outro modulo afetado.
- **08/11/2026** — Fatia 3 (Campanhas/CMP) mergeada (1628e9d, 6f9e75b, 6ce220a): CMP-01/02 implementados (tipos oficiais por D13 do dono), CMP-05/08 parciais, CMP-03/04/06/07 pulados (FALA/DEC-14/futuro). Backend /api/v1/releases + release_accounts. Verificação A3 APROVADA.
- **08/11/2026** — Fatia 4 (ASC) mergeada (7e0a755, 06f8bf7, d408657): ASC-01 implementado front-only sobre D13, ASC-02/03/04 pulados (DEC-04/ACM/DEC-14). Nenhum endpoint novo. Verificação A3 APROVADA.
- **09/11/2026** — Fatia 5 (Grupos/GRU) mergeada (c47a41a, 1527df7, a496cc8): GRU-02/03/04/05 parciais-implementados, demais pulados (DEC/BLOQ/futuro). Backend /api/v1/groups + migração 006. Verificação A3 APROVADA.
- **09/11/2026** — Coluna por ID "Estado no repo (09/11/2026)" criada para os 182 IDs (taxonomia de 5 estados do dono), a pedido do maestro. Fatia 6 (Projetos/PRJ) registrada como EM ANDAMENTO: WIP commitado na branch `a1/projetos` (6690e06) com 98/98 testes no worktree, sem merge e sem verificação A3. Etapa visual final declarada FORA DE ESCOPO por ordem do dono (VIS-01..06 → PULADO); clone de site de cassino que apareceu solto na raiz foi movido para fora do repositório. Publicação do main + branches no GitHub autorizada pelo dono nesta data.
- **12/11/2026** — **Decisão D19 do dono:** INT passa de Embedded Signup v5 da Meta para **conexão por QR code via Evolution API 2.3.7** (self-hosted, estável; 2.4.x é RC e exige licença — NÃO usar; Evolution dedicada no projeto Railway "grupos" com Postgres/Redis/volume próprios, rede interna, chave só em env). Reclassificados para `NÃO INICIADO (destravado p/ Evolution 2.3.7 — decisão D19 de 12/11/2026)`: CTA-05, CTA-06, GRU-06, GRU-07, CRG-02, CRG-07, CRG-09, CRG-12, IMP-02, REC-08, MSG-02, MSG-03 (envio real destravado; botão IA segue bloqueado por provedor de IA), MSG-06, ACM-04, ACM-05, ACM-09, AUT-06, LSC-02, SOL-02 (parcial — aprovar/recusar real), SOL-05. Parciais no próprio texto: GRU-01 (ações com efeito em provedor), GRU-02 (filtro Suspenso), WHE-01 (anotado como destravado). INT-01 → SUBSTITUÍDO (ES v5 descartado); INT-03/INT-05 → OBSOLETAS (exigências Meta/OAuth fora do caminho QR). Totais: BLOQ-EXT 43→20, NÃO INICIADO 45→65 (+SUBSTITUÍDO 1, OBSOLETO 2). Seguem BLOQ-EXT: IAG-01..04/06/07 (provedor de IA), WHE-02..06 (plataformas de terceiros), BRD-01/03, REC-06 (Hotmart), REC-09, WHS-01..05 (saída a destinos externos).
