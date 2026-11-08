# 05 — Mapa integral das 182 funções do PM-GRUPOS (por módulo)

Gerado em 08/11/2026 ~00:55 Brasília por extração mecânica, **sem reescrever nem inventar semântica**. Células completas, sem cortes.

**Como ler**
- **Classe / Requisito / Fonte / Aceitação PROPOSTA / Limite**: texto literal do PM (`fontes/prompt-mestre/PROMPT-MESTRE-GRUPOS.md`). `Lnnn` = linha no PM. Pelo próprio PM (§0.2.1), a Aceitação é **critério proposto derivado**, não aceite aprovado. Itens [PROP] dependem de decisão.
- **Estado no backend LEGADO**: coluna de escopo/estado da matriz do repositório legado (Cursor Origin), cópia R88 em `fontes/legado/aderencia-prompt-mestre-v1-legado-R88.md` (a R89 alterou só `jobs.ts` e um teste). **Não vale para o sendflow-rebuild:** a portabilidade e a equivalência do legado não foram verificadas.
- **Rota/tela atual (candidata)**: por módulo, a partir de `06-INVENTARIO-ROTAS-SENDFLOW.md` (`main` 81d75b9). T = interação só local (localStorage), P = placeholder, demo = só no PR #6 não mergeado. É correspondência por nome. **Não comprova implementação da função; não há backend no `main`.**
- **Estado no sendflow-rebuild**: para todas as linhas = **NÃO VERIFICADO / sem backend**. Nenhuma função GRP tem contrato, teste dirigido ou auditoria no repositório novo.
- Legenda dos estados legados (cabeçalho da matriz): INF-ATUAL = existe na árvore legada segundo a matriz, sem aceite; PEND-ORDEM = aguarda ordem; BLOQ-EXT = depende de provedor/contrato externo; DEC-xx = decisão aberta (PM §9); LAC = lacuna de evidência; FIN = etapa visual final; RV = revisão; EXC = excluído; "escopo aprovado / recorte" = fatia legada com aceite limitado ao recorte (ver 01-ESTADO-E-MATRIZ, seção B).


## NAV — Shell, navegação global e visão geral inicial (PM L193)

**Rota/tela atual candidata:** Layout (menu/busca), `/whats/overview`, `/whats/accounts-campaigns`, `/profile` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-NAV-01 (L196) | OBS-M | Navegação global por barra lateral recolhível (ícones) e expansível (rótulos), com item ativo destacado. | P1 01:14; P6 41:03; CF 22 | Expandir/recolher sem perder rota; item ativo indicado. | Ordem/nomes finais = DEC-01 | FIN |
| GRP-NAV-02 (L197) | OBS-M | Mapa de navegação contém, como áreas: Visão geral, Métricas, Projetos, Contas, Campanhas, Variáveis da campanha, Webhooks (entrada), Deep link, Automações, Webhooks de saída, Blacklists, Ações, Anti-spam, Alertas, Agente de IA, Modelos de mensagem, Broadcast, Leads, Broadcasts, Treinamentos, Equipe e itens "SendSpace", "SendAPI", "MCP (BETA)", "Histórico". | P6 41:03; P7 48:21 (Equipe) | Cada área prevista tem rota ou está marcada "pendente/fora de escopo" na matriz. | Vários itens **sem conteúdo amostrado** (GRP-ZZZ); não inventar funções | FIN |
| GRP-NAV-03 (L198) | OBS-M | Breadcrumb visto nas telas de detalhe amostradas (ex.: Campanhas › campanha › aba). [PROP] presença em todas as telas e navegabilidade de cada nível. | P1 07:05; CF §3 | [PROP] Breadcrumb reflete hierarquia e é navegável. | Universalidade e clique nos níveis não comprovados | FIN |
| GRP-NAV-04 (L199) | OBS-M | Busca global com atalho de teclado e acesso a configurações no topo. | P1 01:14 | Atalho abre busca; escopo da busca = DEC-13. | Resultado de busca não amostrado | FIN |
| GRP-NAV-05 (L200) | OBS-M | Visão geral inicial com cartão de perfil (acesso a configurações), cartão "Mapa Contas × Campanhas" com estado de saúde das associações e acesso a painel, e três colunas: Contas (contador N/limite, "+", busca, status), Campanhas (contador, "+", busca, cards com 4 métricas e status), Webhooks (contador, nome, tipo). | P1 01:14; CF 1 | Colunas listam dados reais do usuário; contadores batem com contagem persistida; vazio legível. | "∞" visto = sem limite exibido; limite por plano **fora** (EXC-01) | FIN + dados |
| GRP-NAV-06 (L201) | OBS-M | Botão flutuante de ajuda/chat no canto (ver GRP-TRN). | P1 01:14; P9 1:03:29 | — | Suporte externo = DEC-09 | FIN |
| GRP-NAV-07 (L202) | PROP | Estados de tela distinguíveis: carregando, vazio, erro, desabilitado, sem permissão. | CF §1 estados; P6 §D2 | Zero ≠ vazio ≠ erro ≠ carregando em todas as listas. | — | FIN |

## CTA — Contas (PM L204)

**Rota/tela atual candidata:** `/whats/accounts` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-CTA-01 (L207) | OBS-M | Criar conta via modal: Nome (obrigatório), opção "conta espião" (toggle), Tipo (select; valor visto: WhatsApp). | P1 01:36; CF 2 | Nome vazio bloqueia; conta criada aparece na lista e no contador (visto 5→6, P1 03:32). | Semântica de "conta espião" **não explicada** → DEC-02 | INF-ATUAL parcial |
| GRP-CTA-02 (L208) | OBS-M | Lista de contas com avatar, indicador de status (online), acesso a configurações e detalhe. | P1 01:14 | Status exibido vem de estado real; sem integração = "não conectada/bloqueada", nunca "online" falso. | Status real depende de provedor (NT) | BLOQ-EXT |
| GRP-CTA-03 (L209) | DIR+PROP | Criar/editar conta **não** cria sessão, credencial nem conexão implicitamente; conexão é etapa separada e bloqueada até contrato (DIR-06). | CK16 F01; DIR-06 | Teste: criar conta não gera sessão/ID externo. | Fluxo QR/ES real: NT/bloqueado | INF-ATUAL |
| GRP-CTA-04 (L210) | OBS-M | Conta pode estar associada a campanhas e agrupada em projeto; "contas ociosas" = sem campanha ativa (texto da UI). | P6 40:16, 42:08 | Contagem de ociosas coerente com associações. | Fórmula = FALA/DEC-14 | escopo aprovado; contagem derivada |
| GRP-CTA-05 (L211) | OBS-M | Alerta "Desconectadas nas últimas 24h" no painel de métricas. | P6 42:08 | Lista vazia legível; só eventos reais de desconexão. | Depende de provedor (NT) | BLOQ-EXT |
| GRP-CTA-06 (L212) | FALA (cap.) | Conectar número via fluxo do provedor (capítulo "como conectar seu número"). | CAP 01:20 | — | **Bloqueado** (DIR-06); vídeo não é contrato | BLOQ-EXT |

## CMP — Campanhas (criação, tipos, lista global) (PM L214)

**Rota/tela atual candidata:** `/whats/campaigns` — T; PR #6: `/whats/campaigns/:id` (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-CMP-01 (L217) | OBS-M | Criar campanha via modal: Nome (obrigatório, validação bloqueia vazio) + Tipo (select). | P1 03:32; CF 3 | Envio vazio bloqueado com mensagem; campanha aparece na lista. | — | INF-ATUAL |
| GRP-CMP-02 (L218) | OBS-M | Tipo com **4 opções** vistas: "Campanha", "Lista", "Campanha viral", "Aleatório". | P1 04:05; CF 3 | As opções implementadas mapeiam para estratégias definidas. | "Campanha viral" **sem semântica** → DEC-03; não definir regra | DEC-03 |
| GRP-CMP-03 (L219) | FALA | Semânticas faladas: "Campanha" enche grupos em sequência sem repor anteriores; "Lista" repõe o grupo de menor ocupação; "Aleatório" distribui tráfego entre grupos. | P1 §C | Cada estratégia documentada e testada com dados sintéticos (INF: 3 distribuições já existentes). | Algoritmo real não provado; fala não é contrato | INF-ATUAL |
| GRP-CMP-04 (L220) | OBS-M | Lista global de campanhas: período "últimos N dias" (7/14/21/28/90), totais Clicks, Entraram, Percentual de entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | P5 38:45/39:45; CF 20 | [PROP] Totais = soma das campanhas no filtro/período; zero legível. | Regra de agregação e fórmulas = DEC-14 | PEND-ORDEM |
| GRP-CMP-05 (L221) | OBS-M | Abas Campanhas / Ativas / Arquivadas; ordenação (ex.: data de atualização); busca; grade de cards com 4 métricas; seleção múltipla e "Arquivar"; paginação; acesso "Contas e Campanhas" e "+ Campanha". | P5 38:45 | [PROP] Arquivar move para Arquivadas sem apagar dados; paginação correta. | Efeito de arquivar não demonstrado; desarquivar/excluir não amostrado (LAC) | escopo aprovado; arquivar por ids; filtro posterior |
| GRP-CMP-06 (L222) | OBS-M | Card de campanha mostra métricas resumidas, nome truncável e status. | P1 01:14; P5 38:45 | — | Quais 4 métricas exatas = DEC-14 | FIN |
| GRP-CMP-07 (L223) | OBS-M | Detalhe da campanha com **12 abas**: Visão geral, Contas associadas, Diagnósticos, Grupos, Solicitações de entrada, Atividades, Leadscoring, Mensagens, Mensagens recebidas, Calendário, Automações, Ações. | P1 07:05; CF 4 | Cada aba existente ou marcada pendente na matriz. | Diagnósticos, Mensagens, Mensagens recebidas, Calendário **sem conteúdo amostrado** (GRP-ZZZ) | FIN |
| GRP-CMP-08 (L224) | RV | Vínculo da campanha a projeto (dropdown) e edição de campanha. | DL (Projetos); P5 §B | — | Não confirmado na amostragem | RV |

## ASC — Contas associadas da campanha (PM L226)

**Rota/tela atual candidata:** `/whats/accounts-campaigns` — T; PR #6 aba Contas associadas (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-ASC-01 (L229) | OBS-M | Associar/desassociar contas à campanha por lista com checkbox e contador "N/M contas". | P1 07:05; CF 5 | Contador = associações persistidas. | — | INF-ATUAL parcial |
| GRP-ASC-02 (L230) | OBS-M | Configurações da associação com opções "especificar contas criadoras de grupos" e "especificar range de operação das contas" (Fechar/Salvar). | P1 07:05 | Opções persistem. | Papéis por conta e conteúdo do "range" **não confirmados** → DEC-04 | DEC-04 |
| GRP-ASC-03 (L231) | OBS-M | Contas não associadas aparecem com alerta "conta não associada à campanha" e sem checkbox nos assistentes de ação. | P4 30:03; CF 16 | [PROP] Backend recusa operação por conta não associada (não só UI). | Validação servidor = PROP (CK16 F02) | INF-ATUAL parcial |
| GRP-ASC-04 (L232) | OBS-M | "Campanhas expostas" = campanhas ativas sem cobertura adequada de contas (texto da UI). | P6 42:08 | Indicador coerente com associações. | "Adequada" = DEC-14 | DEC-14 |

## GRU — Grupos da campanha (lista, toolbar, filtros, linha) (PM L234)

**Rota/tela atual candidata:** `/whats/group-search` — T; PR #6 aba Grupos (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-GRU-01 (L237) | OBS-M | Toolbar: Criar grupos, Alterar grupos, Importar grupos, Atualizar links, Exportar grupos, Exportar leads, Atualizar leads, Participantes duplicados, Grupos duplicados. Vistos cinza sem grupos e amarelos com grupos. | P1 07:55; P3 21:08; CF 6 | [PROP] Ações que dependem de grupos ficam desabilitadas sem grupos e habilitadas com ≥1. | Desabilitação real inferida pela aparência (P1 §D); efeitos de atualizar links/leads = NT | recorte implementado; CSV de metadados |
| GRP-GRU-02 (L238) | OBS-M | Filtros segmentados: Todos, Cheios, Não cheios, Suspenso; busca; vazio "nenhum registro". | P1 07:55; P4 26:40 | Filtros coerentes com contagens e busca. | Origem do estado "suspenso" = provedor (NT) | escopo aprovado; filtro técnico; busca posterior |
| GRP-GRU-03 (L239) | OBS-M | Linha do grupo: número sequencial + nome, **Redirect x/limite**, **Cliques reais**, **Participantes**, copiar link, data, tipo ("Grupo normal"), select **Cheio Sim/Não** manual, ícone de dados, menu ⋮. | P3 21:08; P4 26:40; CF 12 | Três métricas separadas; nenhuma deriva da outra sem regra. | Significado exato de "Redirect" vs "Cliques reais" = DEC-05 | DEC-05 |
| GRP-GRU-04 (L240) | OBS-M+PROP | Select "Cheio" Sim/Não manual visto na linha, ao lado das métricas Redirect/Cliques reais/Participantes. [PROP] "Cheio" manual separado da lotação calculada; marcar manualmente não altera contagens (critério proposto P4 §D1). | P4 26:40, §D1 | [PROP] Teste: marcar cheio não muda participantes/cliques. | Separação e precedência manual × automática não demonstradas = DEC-06 | DEC-06 |
| GRP-GRU-05 (L241) | OBS-M | Seleção "Selecionar tudo (n/N)" e ações em massa: Marcar como cheio, Marcar como não cheio, Excluir. | P3 21:08; P4 26:40 | Massa afeta só selecionados; exclusão pede confirmação (PROP). | — | escopo aprovado; fatia implementada na API |
| GRP-GRU-06 (L242) | OBS-M | Menu ⋮: Detalhes, Marcar como cheio, Reprocessar cliques, Atualizar link de convite, Redefinir link de convite, Editar, Remover. | P3 24:05 | Cada item gera estado/ação rastreável; destrutivos confirmam. | Efeito em provedor NT | BLOQ-EXT |
| GRP-GRU-07 (L243) | OBS-E | Item "Alterar nome do grupo" visível na fila (P3 24:28), após edição de nome. [PROP] edição de nome gera ação própria na fila. | P3 24:28 | [PROP] Edição cria ação com estado próprio; não marca sucesso externo sem provedor. | Causalidade e persistência não provadas pela UI | BLOQ-EXT |
| GRP-GRU-08 (L244) | RV/FALA (cap.) | Edição em massa de grupos (nome, descrição, admins) e exportação de dados (CSV citado). | CAP 27:05, 38:46; P4 §C | — | Modal de lote **não amostrado** (LAC-03) | RV |
| GRP-GRU-09 (L245) | FALA (cap.) | Análise de grupos duplicados e participantes duplicados. | CAP 28:59; P3 §C | Botões existem (GRU-01). | Resultado/estado vazio não amostrado | PEND-ORDEM |
| GRP-GRU-10 (L246) | INF | Reservas internas idempotentes ("sempre disponíveis") e distribuição local existentes (relato). | IE; CK16 | Regressão: reservas continuam idempotentes. | Código não auditado | INF-ATUAL |

## CRG — Configuração de criação de grupos (template) e administradores (PM L248)

**Rota/tela atual candidata:** botão "Padrão de criação" em `/whats/campaigns` (candidato, conteúdo não verificado). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-CRG-01 (L251) | OBS-M | Modal com abas **Informações** / **Administradores**; trocar de aba não perde valores. | P1 09:10; P2 14:06, §E1 | Teste de preservação entre abas. | — | FIN |
| GRP-CRG-02 (L252) | OBS-M | Foto do grupo com editar/excluir. | P1 09:10 | Foto persiste; troca afeta só novos grupos. | Upload a provedor NT | BLOQ-EXT |
| GRP-CRG-03 (L253) | OBS-C | Nome dos grupos (obrigatório) com contador de caracteres (visto 18/95). | P1 09:10; P2 10:34 | Contador e bloqueio acima do limite. | Limite do Grupos = DEC-12 | DEC-12 |
| GRP-CRG-04 (L254) | OBS-C | Descrição fixa (obrigatória) com contador (visto 0/2048 e 23/2048). | P1 08:26; P2 10:34 | Idem. | DEC-12 | DEC-12 |
| GRP-CRG-05 (L255) | OBS-C | Início da contagem (obrigatório; visto 1, 30, 25 — editável) e toggle "número de contagem no início" (antes/depois do nome). | P1 08:26–10:25; P2 10:34 | Numeração de novos grupos segue início e posição configurados. | Renumeração de existentes ≠ (CRG-12) | INF-ATUAL parcial |
| GRP-CRG-06 (L256) | OBS-C | "Quantidade de grupos sempre disponíveis" (reserva; visto 3) e "Limite de pessoas" (visto 350). | P1 08:26 | Campos obrigatórios persistem. | Valores não são defaults; manutenção de reserva = FALA (P2 §C) | INF-ATUAL parcial |
| GRP-CRG-07 (L257) | OBS-M | Toggles: Apenas admins podem enviar; Exigir aprovação de admin; Recusar automaticamente números bloqueados (antispam, antispam global e blacklist); Desativar criação de grupos; Criar comunidades em vez de grupos; Mensagens temporárias (select). | P1 08:26–09:55; P2 10:34–13:44 | Cada toggle persiste e tem estado visual claro. | Efeitos NT | BLOQ-EXT |
| GRP-CRG-08 (L258) | OBS-M | Modo de criação segmentado **NORMAL / SEGURO**. | P1 08:26; P2 12:14 | Persistência. | "Seguro adia nome e foto" = FALA (P2 §C) → DEC-07 | DEC-07 |
| GRP-CRG-09 (L259) | OBS-M | Toggle "criar grupo aberto e fechar depois de 24h". | P1 08:26 | Persistência; agendamento de fechamento só como ação local. | Efeito NT; FALA | BLOQ-EXT |
| GRP-CRG-10 (L260) | OBS-M | Aviso: alterações **não** se aplicam a grupos existentes, só a novos. | P1 08:26; P2 12:14/13:44 | Teste: salvar config não altera grupos existentes. | — | invariante do PM |
| GRP-CRG-11 (L261) | OBS-M | Aba Administradores: "+ Novo administrador"; seções "administradores de contas associadas" e "administradores de contas de criação associadas". | P2 14:06; CF 8 | Admins persistem ligados à config. | Campos DDI/número **não confirmados** | LAC |
| GRP-CRG-12 (L262) | OBS-M+PROP | Visto: botão Salvar do modal e, na aba Ações, itens "Campanha: Criar Grupo". [PROP] Salvar dá feedback real só após persistência, sem toast falso; salvar configuração **não** é criação concluída; criação gera ação na fila. | P2 14:06/14:22, §E2–3 | [PROP] Falha de persistência mostra erro; ação de criar aparece na fila. | Toast de sucesso **não confirmado**; vínculo salvar→ação não demonstrado | BLOQ-EXT |

## IMP — Importação de grupos existentes (PM L264)

**Rota/tela atual candidata:** nenhuma rota identificada. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-IMP-01 (L267) | OBS-M | Assistente com etapas **Onde → Conta → Grupos → Confirmar**; avançar bloqueado sem seleção. | P3 22:32; CF 13 | Stepper preserva escolhas ao voltar. | Etapa Confirmar não amostrada | FIN |
| GRP-IMP-02 (L268) | OBS-M | Etapa Grupos: aviso de que a conta precisa ser administradora; Atualizar; contador "N selecionado(s)"; busca; ordenação; tabela Foto/Nome. | P3 22:32 | Contador exato. | Verificação real de admin = NT | BLOQ-EXT |
| GRP-IMP-03 (L269) | OBS-M | Grupos já associados à campanha aparecem marcados e desabilitados na seleção. [PROP] impedir dupla importação. | P3 22:32 | [PROP] Idempotência: reimportar não duplica. | Idempotência backend não provada | INF-ATUAL |
| GRP-IMP-04 (L270) | OBS-E | Item "Importar grupos" (com duração) visível na fila após a importação. [PROP] importação gera ação própria. | P3 23:40 | [PROP] Ação com estado próprio. | Persistência/estado final não legíveis | INF-ATUAL parcial |
| GRP-IMP-05 (L271) | OBS-M+FALA | Grupo importado preserva o nome original (visto) e recebe número/participantes exibidos. | P3 24:05; P4 24:33 | Sem "padronizar", não renomeia nem renumera. | Opções "registro de atividades"/"padronizar" **não confirmadas** → DEC-08 | DEC-08 |
| GRP-IMP-06 (L272) | INF | Importação LOCAL existente (relato). | CK16 F06 | Não afirmar sincronização com provedor. | Não auditado | INF-ATUAL |

## FIL — Fila de ações (por campanha e global) (PM L274)

**Rota/tela atual candidata:** `/whats/actions` — T (fila global candidata); PR #6 aba Ações (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-FIL-01 (L277) | OBS-M | Sub-abas **Visão geral, Na fila, Agendado, Processando, Sucesso, Falhas**. | P2 14:22; CF 9 | [PROP] Cada ação aparece em exatamente um estado corrente. | Transições e máquina de estados não demonstradas (P3 23:40) | INF-ATUAL |
| GRP-FIL-02 (L278) | OBS-M | Filtro por intervalo de datas, "Agrupar: Sim/Não", paginação. | P2 14:22 | Filtro e paginação corretos. | — | escopo aprovado; intervalo técnico |
| GRP-FIL-03 (L279) | OBS-M | Ações em massa: Enviar agora, Reenviar ações travadas, Reprocessar, Cancelar, Excluir (desabilitadas sem seleção). | P2 14:22 | Cada ação de massa respeita estado (ex.: cancelar só não concluídas — PROP). | Semântica de "travada" = DEC-10 | DEC-10 |
| GRP-FIL-04 (L280) | OBS-E | Item com selo "Agendado para <data hora>" e item com tempos de criação/início/fim e duração, visíveis na UI. | P2 14:22; P3 23:40 | [PROP] Registro de tempos reais da execução local. | Origem/persistência dos tempos desconhecidas; intervalo de ~10 min visto é exemplo | fatos por tentativa; docs precisos |
| GRP-FIL-05 (L281) | OBS-M | Botão "+ Adicionar" leva ao assistente de ação manual (MOD ACM). | P3 23:40; P4 30:03 | — | — | FIN |
| GRP-FIL-06 (L282) | OBS-M | Itens com ícones de contadores e status (verde/vermelho/amarelo). | P3 24:28 | — | Significado exato = DEC-10 | DEC-10 |
| GRP-FIL-07 (L283) | DIR+PROP | Nenhum estado afirma envio/criação real sem integração; conclusão local ≠ efeito externo; erro identificável e recuperável. | CF §6.3; CK16 F07; DIR-04 | "Sucesso" só quando o efeito do tipo da ação está confirmado; externos = bloqueado. | — | INF-ATUAL |
| GRP-FIL-08 (L284) | PROP | Distinguir avaliação/tentativa/conclusão persistida em observabilidade, sem renomear campos legados. | CHECKLIST-OBSERVABILIDADE-JOB-TICK-CONCLUSAO | Contadores batem com o banco. | Ver ENG-06 | INF-ATUAL |

## VGC — Visão geral da campanha, link único e gráficos (PM L286)

**Rota/tela atual candidata:** PR #6 aba Visão geral do detalhe (demo); `main`: nenhuma. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-VGC-01 (L289) | OBS-M | Período "últimos N dias" (7/14/21/28/90) e 8 KPIs: Clicks, Entraram, Percentual de entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | P2 14:46; CF 10 | KPIs = dados persistidos no período; zero exibido como zero. | Fórmulas = DEC-14 | PEND-ORDEM |
| GRP-VGC-02 (L290) | OBS-M | Card da campanha com acesso a Configurações. | P2 14:46 | — | — | FIN |
| GRP-VGC-03 (L291) | OBS-M | Card **Link de convite** (link único) com Editar e Copiar. | P2 14:46 | Copiar copia o link; editar não quebra redirecionamento existente (PROP). | Formato/domínio do link = DEC-11 | PEND-ORDEM |
| GRP-VGC-04 (L292) | OBS-M | Gráficos diários "Clicks" e "Entraram" com atualizar, períodos 7/14/21/28, seletor de datas e tela cheia. | P2 14:46/15:50 | Séries por dia batem com eventos registrados. | — | PEND-ORDEM |
| GRP-VGC-05 (L293) | FALA+PROP | Lotação/distribuição usa entradas/participantes, não cliques. | P2 §C, §E5 | Teste: cliques sem entrada não ocupam vaga. | FALA; política local documentada (CK16 F04) | INF-ATUAL |
| GRP-VGC-06 (L294) | OBS-M | Menu lateral de recursos da campanha (ver MOD REC), com "Métricas" como item inicial. | P2 14:46; P3 §A | — | — | FIN |

## REC — Recursos da campanha (menu lateral da visão geral) (PM L296)

**Rota/tela atual candidata:** PR #6 detalhe (demo); `main`: nenhuma. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-REC-01 (L300) | OBS-M | **Gerenciamento de tags** (item de menu). | P2 14:46 | Tela existe ou pendente. | Conteúdo **não amostrado** (LAC-04) | PEND-ORDEM |
| GRP-REC-02 (L301) | OBS-M | **Valores das variáveis**: tabela Nome / Tipo / Valor na campanha, copiar por linha, busca, paginação, "abrir painel de variáveis", Salvar. Tipos vistos: Data, Texto, Número; escopo GLOBAL visto. | P2 16:45; P3 16:52 | Valor por campanha persiste; variável usável no editor (ENT-14). | Painel global "Variáveis da campanha" não amostrado | PEND-ORDEM |
| GRP-REC-03 (L302) | OBS-M | **Cookie de redirecionamento** (toggle). | P3 17:07/17:36 | Toggle persiste. | "Mantém lead no mesmo grupo" = FALA; Safari/Apple não afirmar | PEND-ORDEM |
| GRP-REC-04 (L303) | OBS-M | **Anti-hacker** (item de menu). | P2 14:46; CAP 52:45 | — | Conteúdo não amostrado; eficácia FALA | PEND-ORDEM |
| GRP-REC-05 (L304) | OBS-M | **Verificação de colaboradores** (item). | P2 14:46 | — | Conteúdo não amostrado; semântica DEC | PEND-ORDEM |
| GRP-REC-06 (L305) | OBS-M | Item de integração "grupo VIP" ligado a plataforma de terceiros (rótulo cita Hotmart). | P2 14:46 | — | Não amostrado; integração NT | BLOQ-EXT |
| GRP-REC-07 (L306) | OBS-M | **Gestão de comunidades** (item). | P2 14:46 | — | Não amostrado | PEND-ORDEM |
| GRP-REC-08 (L307) | OBS-M | **Atualização de links**, **Atualização periódica de links**, **Redefinir link de convite**. | P2 14:46; P3 20:34 | — | Efeito NT; FALA "link atualizado quando número é banido" (CAP 22:35) | BLOQ-EXT |
| GRP-REC-09 (L308) | OBS-M | **Remover lead de campanhas anteriores**: toggle, select "campanhas anteriores", Salvar. | P3 19:36/20:34 | Seleção persiste. | Multisseleção não vista; efeito NT | BLOQ-EXT |
| GRP-REC-10 (L309) | OBS-M | **Deep linking** (toggle); texto indica que libera pixel (Meta), desafio para bots e tradução automática. | P3 18:10 | Toggle persiste. | Telas de pixel/desafio/tradução **não amostradas** (LAC-05); pixel TikTok só em CAP 20:32 | PEND-ORDEM |
| GRP-REC-11 (L310) | OBS-M | **Checar participantes duplicados** (item). | P2 15:50 | — | Resultado não amostrado | PEND-ORDEM |
| GRP-REC-12 (L311) | OBS-M | **Métricas** (item ativo inicial). | P2 14:46 | — | = VGC | PEND-ORDEM |

## MSG — Editor de mensagem em blocos e opções de envio (PM L313)

**Rota/tela atual candidata:** nenhuma (PR #6 declara editor de mensagem fora). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-MSG-01 (L316) | OBS-M | Layout em 3 colunas: preview (fundo de conversa) com blocos; editor; opções de envio. | P4 27:33; P5 32:20 | — | Visual final = DIR-02 | FIN |
| GRP-MSG-02 (L317) | OBS-M | Paleta de ~9 tipos de bloco: enquete, contato, evento, link, áudio, imagem, vídeo, arquivo, figurinha. | P4 27:33; CAP 32:12 | Cada tipo suportado tem validação própria. | Ícones inferidos pela forma; envio real NT | BLOQ-EXT |
| GRP-MSG-03 (L318) | OBS-M | Barra de formatação (negrito, itálico, tachado, código, citação), botão IA, campo de texto, Emoji, Modelos, Variáveis, "+ adicionar preview", Salvar (desabilitado sem conteúdo). | P4 27:33 | Salvar só com conteúdo válido. | Botão IA depende de provedor (NT) | BLOQ-EXT |
| GRP-MSG-04 (L319) | OBS-M | Blocos como cards com alça de arrastar, subir/descer, editar e excluir; múltiplos blocos (ex.: imagem com legenda + texto). | P4 30:38/31:57; P5 33:13 | Ordem e conteúdo preservados após editar/reordenar/excluir. | Reordenação inferida pelos controles | aceite do PM; cadeia na API |
| GRP-MSG-05 (L320) | OBS-C | Spintax no texto (ex.: `{a\ | b\ | c}`). | P4 31:57; P5 32:20 \\| Variação gerada só a partir das opções; spintax inválido não quebra a etapa. \\| Sem garantia anti-spam (FALA) | PEND-ORDEM |
| GRP-MSG-06 (L321) | OBS-M | Opções: Marcar todos (NÃO/SIM); Mensagens temporárias (NÃO/24H/7D/90D); Fixar mensagem (NÃO/24H/7D/30D); Velocidade (NÃO/RÁPIDA/NORMAL/LENTA/CUSTOM). | P4 27:33 | Persistem por ação. | Efeitos NT | BLOQ-EXT |
| GRP-MSG-07 (L322) | OBS-C | Envio em pacotes (itens por pacote, intervalo entre pacotes); período de envio (faixa 0H–24H); dias e horários (TODOS/SEG–DOM); **fuso horário explícito**. | P4 31:57; P5 32:20 | Configuração salva com fuso; envio fora da janela aguarda (FALA) só como regra local definida. | Valores do exemplo; continuação no dia seguinte = FALA (CAP 34:34) | INF-ATUAL parcial |
| GRP-MSG-08 (L323) | OBS-M | Itens de sidebar "Modelos de mensagem" e botão "Modelos" no editor. | P6 41:03; P4 27:33 | — | Tela de modelos não amostrada. INF: "modelos versionados" existem | INF |
| GRP-MSG-09 (L324) | INF+PROP | Persistência de rascunhos/versões/blocos preserva vínculos campanha/tenant/versão. | CHECKLIST-MIGRACAO-VINCULOS-MENSAGENS-QUATRO-TABELAS | Integridade provada por testes negativos. | Ver ENG-04 | INF-ATUAL |

## ACM — Ação manual, ações administrativas e agendamento (PM L326)

**Rota/tela atual candidata:** `/whats/actions` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-ACM-01 (L329) | OBS-M | Assistente **Categoria → Campanha → Ação → Contas → Grupos → Conteúdo → Confirmar**. | P4 30:03; CF 16 | Avanço bloqueado sem escolha; estado preservado. | — | PEND-ORDEM |
| GRP-ACM-02 (L330) | OBS-M | Etapa Campanha com **seleção múltipla** de campanhas, busca e contador "n/N filtrado". | P5 34:10 | Contador correto; não altera campanhas não selecionadas. | — | PEND-ORDEM |
| GRP-ACM-03 (L331) | OBS-M | Etapa Contas: "todas as contas da campanha" / "contas específicas"; não associadas bloqueadas. | P4 30:03 | Backend recusa conta não associada. | — | PEND-ORDEM |
| GRP-ACM-04 (L332) | OBS-M | Ação "Trocar configuração": apenas admins / todos enviam; apenas admins / todos mudam configurações; exigir / permitir entrada sem aprovação. | P5 34:45; CF 18 | Escolha obrigatória. | Efeito NT | BLOQ-EXT |
| GRP-ACM-05 (L333) | OBS-M | Ação "Privacidade avançada na conversa": Sim (ativar) / Não. | P5 35:45 | — | Efeito NT | BLOQ-EXT |
| GRP-ACM-06 (L334) | FALA (cap.) | Ações em massa de nome, descrição e admins. | CAP 38:46 | — | Telas não amostradas | PEND-ORDEM |
| GRP-ACM-07 (L335) | OBS-M | Confirmar: resumo (categoria, campanhas, contas, grupos, preview com contador de mensagens); campo **Agendar** com seletor data/hora e OK. | P5 33:40; CF 17 | Resumo = escolhas feitas. | Data do exemplo não é default | INF-ATUAL parcial |
| GRP-ACM-08 (L336) | OBS-M | Dois botões: "Agendar envio para <data/hora>" e "Agendar e programar outra ação". [PROP] o segundo mantém o contexto (campanha, contas, grupos). | P5 33:40 | [PROP] Cada confirmação cria **uma** ação; sem duplicatas por duplo clique/reenvio. | Manutenção de contexto inferida do rótulo; segunda ação na lista não amostrada | PEND-ORDEM |
| GRP-ACM-09 (L337) | DIR | Envio real bloqueado até integração autorizada. | DIR-04/06 | Ação agendada fica "agendada/bloqueada", nunca "enviada". | — | BLOQ-EXT |

## AUT — Automações e cronograma (PM L339)

**Rota/tela atual candidata:** `/whats/automations` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-AUT-01 (L342) | OBS-M | Assistente **Campanha → Grupo → Gatilho → Conta → Ação → [Agendar] → Conteúdo → Confirmar**. | P4 27:08/27:33; P5 36:40; CF 14 | Etapas validadas; "Agendar" presente para recorrência. | Etapa Gatilho **não amostrada** | PEND-ORDEM |
| GRP-AUT-02 (L343) | OBS-M | Etapa Grupo: "todos os grupos da campanha" / "grupos específicos". | P4 27:08 | — | — | PEND-ORDEM |
| GRP-AUT-03 (L344) | OBS-M | Gatilho visto na lista: "ao encher grupo da campanha" (capítulo: boas-vindas quando o grupo enche). | P4 29:27; CAP 30:26 | [PROP] Gatilho dispara com base em estado local definido de "cheio", uma vez por ocorrência conforme contrato. | Disparo único e relação com Cheio manual não demonstrados = DEC-06 | DEC-06 |
| GRP-AUT-04 (L345) | OBS-M | Lista: toggle Ativado, contadores (incl. "Fila"), status, editar, ⋮; filtros Ativado/Desativado/Todos; "+ Adicionar", "Importar JSON"; massa Desativar/Ativar/Duplicar/Excluir. | P4 29:27 | Duplicar cria cópia independente; desativar não perde config. | Formato do JSON = DEC (não inventar) | escopo aprovado; duplicar uma, filtro de lista e massa de estado |
| GRP-AUT-05 (L346) | OBS-C | Cronograma: periodicidade 7 DIAS / 14 DIAS / 28 DIAS / MENSAL; dia da semana (TODOS, SEG–DOM); hora e minuto; iniciar/parar em (datas); fuso; **próxima execução estimada** exibida com fuso. | P5 36:40/37:50; CF 19 | Próxima execução coerente com fuso/regra. | "Dias do mês"/iniciar-pausar não vistos; fim de mês 29–31 e horário inexistente/ambíguo = DEC-15 | INF-ATUAL parcial + DEC-15 |
| GRP-AUT-06 (L347) | OBS-M | Automações sob webhook (evento → ação) — ver MOD WHE. | P8 56:02 | — | — | BLOQ-EXT |
| GRP-AUT-07 (L348) | INF+PROP | **Estado histórico informado à época** do checklist de recorrência: mensal com políticas explícitas de horário inexistente/ambíguo; diária/semanal convertendo horário local diretamente, sem política selecionada. Estado vigente deve ser **reconfirmado por revisão** do responsável; este prompt não manda reverter nada hoje. | CHECKLIST-RECORRENCIA-DIARIA-SEMANAL-HORARIO-LOCAL | [PROP] Não mudar semântica de registros legados sem decisão. | Snapshot, não estado atual; ENG-05 | INF-ATUAL |

## PRJ — Projetos (PM L350)

**Rota/tela atual candidata:** `/whats/projects` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-PRJ-01 (L353) | OBS-M | Projeto (pasta) com Editar e Excluir (destrutivo destacado). | P6 40:16; CF 21 | Exclusão confirma e define destino dos itens (DEC-16). | Efeito de excluir não visto | recorte provado; exclusão do vazio e edição limitada |
| GRP-PRJ-02 (L354) | OBS-M | Período e 8 KPIs do projeto (mesmos rótulos dos da campanha). | P6 40:16 | [PROP] Totais somam só campanhas do projeto. | Agregação não demonstrada; DEC-14 | DEC-14 |
| GRP-PRJ-03 (L355) | OBS-M | Colunas Contas / Campanhas / Webhooks do projeto, com contador, vazio legível. | P6 40:16 | — | — | contas e webhooks de configuração derivados |
| GRP-PRJ-04 (L356) | FALA+PROP | Projetos separam campanhas por cliente. | P6 §C; CAP 43:05 | Testes negativos: dados de um projeto não aparecem em outro filtro. | Isolamento/permissão **não provado** | INF-ATUAL |

## MET — Métricas globais e alertas (PM L358)

**Rota/tela atual candidata:** nenhuma (métricas 42:08 ausentes, segundo Referência e PR #6). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-MET-01 (L361) | OBS-M | Atalhos em chips (Campanhas, Contas, Automações, Webhooks, Contas × Campanhas). | P6 42:08 | — | São atalhos, não abas | PEND-ORDEM |
| GRP-MET-02 (L362) | OBS-M | Card "Alertas" recolhível com vazio legível. | P6 42:08 | — | Regras de alerta = DEC | PEND-ORDEM |
| GRP-MET-03 (L363) | OBS-M | "O que precisa de atenção": N campanhas expostas; N contas ociosas. | P6 42:08 | Contagens coerentes. | Fórmula FALA/DEC-14 | escopo aprovado; parcial |
| GRP-MET-04 (L364) | OBS-M | "Operação do dia": Cliques hoje, Entradas hoje, média 7d, variação % vs média. | P6 42:08/42:24 | Variação calculada sobre dados reais; sem dados = vazio. | Fórmula exata DEC-14 | DEC-14 |
| GRP-MET-05 (L365) | OBS-M | Listas "campanhas ativas sem cliques hoje" e "desconectadas nas últimas 24h". | P6 42:08 | — | — | PEND-ORDEM |
| GRP-MET-06 (L366) | FALA (cap.) | Funil e análises gráficas globais. | CAP 44:51 | — | **Não amostrados** (LAC-06) | LAC-06 |

## LSC — Leadscoring (PM L368)

**Rota/tela atual candidata:** PR #6 aba Leadscoring (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-LSC-01 (L371) | OBS-C | Chips de status por tipo de evento com pontos **mostrados** (vistos: Recebeu 10, Visualizou 20, Reproduziu 40, Reagiu 50, Mensagem 60). | P6 43:55; CF 24 | [PROP] Tipos/pontos seguem a decisão DEC-17. | Se tipos/pontos são configuráveis ou fixos **não foi demonstrado** = DEC-17; valores = exemplo; cálculo NT | DEC-17 |
| GRP-LSC-02 (L372) | OBS-M | Gráfico "volume por hora — últimos 7 dias" com POR HORA/POR DIA, barras empilhadas por tipo. | P6 43:55 | — | Eventos dependem de provedor | BLOQ-EXT |
| GRP-LSC-03 (L373) | OBS-M | Tabela #, Número (mascarado), Pontos, ⋮; paginação; busca; Exportar. | P6 43:55 | Número mascarado; exportação com permissão (PROP). | — | PEND-ORDEM |

## ATV — Atividades (PM L375)

**Rota/tela atual candidata:** PR #6 aba Atividades — só nome. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-ATV-01 (L378) | OBS-M | Aba "Atividades" existe na campanha. | P1 07:05; P6 43:55 | — | Conteúdo **não amostrado**; tabela número/grupo/evento/data e exportar = RV (LAC-07) | PEND-ORDEM |

## SOL — Solicitações de entrada (PM L380)

**Rota/tela atual candidata:** PR #6 aba Solicitações (demo). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-SOL-01 (L383) | OBS-M | Sub-abas Pendentes / Processadas / Configurações; selo "N pendente(s)". | P6 44:06/45:01; CF 25 | Contagem coerente. | — | PEND-ORDEM |
| GRP-SOL-02 (L384) | OBS-M | Busca por número completo; aprovar/recusar selecionadas (desabilitados sem seleção). | P6 44:06 | Ação só sobre selecionadas; registro em Processadas. | Efeito NT | BLOQ-EXT |
| GRP-SOL-03 (L385) | OBS-M | Estados carregando e vazio ("nenhuma solicitação pendente"). | P6 44:06/45:01 | — | — | PEND-ORDEM |
| GRP-SOL-04 (L386) | FALA+PROP | Sem tag, solicitação fica pendente; sem auto-aprovação implícita. | P6 §C, §D4 | — | Configurações por tag **não amostradas** (LAC-08) | LAC-08 |
| GRP-SOL-05 (L387) | OBS-M | Recusa automática de bloqueados configurada no template (CRG-07). | P1 09:10 | — | Funcionamento não demonstrado | BLOQ-EXT |

## ASP — Anti-spam (PM L389)

**Rota/tela atual candidata:** `/whats/seguranca` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-ASP-01 (L392) | OBS-M | Abas Números bloqueados / Números administrativos / Contas associadas. | P6 46:10/47:45; CF 26 | — | Aba Contas associadas não amostrada | PEND-ORDEM |
| GRP-ASP-02 (L393) | OBS-M | Bloqueados: Analisar grupos, Exportar, Adicionar, Adicionar CSV, Adicionar CSV (admin), Excluir; busca com aviso de filtro por data/página; intervalo de datas; ordenação; tabela Nome/Número/Criação/Atualização/⋮. | P6 46:10 | Import CSV valida linhas; números mascarados. | "Analisar grupos" efeito NT | escopo aprovado; CSV da organização |
| GRP-ASP-03 (L394) | OBS-M | Administrativos: lista separada com Adicionar, Adicionar CSV, busca, ordenação alfabética, Nome/Número. | P6 47:45 | Número não pode estar nas duas listas sem conflito resolvido (PROP). | Precedência = DEC-18 | DEC-18 |
| GRP-ASP-04 (L395) | FALA (cap.) | Anti-spam global (compartilhado) e anti-hacker. | CAP 49:21, 52:45 | — | Compartilhamento global **não provado**; não definir | PEND-ORDEM |

## BLK — Blacklists (PM L397)

**Rota/tela atual candidata:** `/whats/seguranca` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-BLK-01 (L400) | OBS-M | Lista de blacklists; detalhe com nome, editar, ⋮ e abas Campanhas / Números. | P7 48:40/49:30; CF 27 | — | Aba Números não amostrada | PEND-ORDEM |
| GRP-BLK-02 (L401) | OBS-M | Aba Campanhas com lista de campanhas com checkbox (uma selecionada). [PROP] aplicação da lista por campanha selecionada. | P7 48:40 | [PROP] Não vaza para campanhas não marcadas. | Efeito da seleção não demonstrado | PEND-ORDEM |

## IAG — Agente de IA (rótulo da referência: "SendIA") (PM L403)

**Rota/tela atual candidata:** nenhuma (SendIA fora, segundo PR #6). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-IAG-01 (L406) | OBS-M | Lista de agentes e "+ Adicionar". | P7 50:31 | — | — | BLOQ-EXT |
| GRP-IAG-02 (L407) | OBS-M | Assistente **Escolher IA → Treinamento → Configurar**. | P7 51:21; CF 28 | Estado preservado entre etapas. | — | BLOQ-EXT |
| GRP-IAG-03 (L408) | OBS-C | Escolher IA: plataforma (2 opções vistas), tipo (texto simples / texto com tópico / assistente), modelo, **campo de credencial**, intervalo entre respostas (faixa em segundos). | P7 51:21 | Credencial mascarada, nunca reexibida/logada/exportada (PROP). | Na referência o campo aparece **sem máscara** — não reproduzir; provedor NT | BLOQ-EXT |
| GRP-IAG-04 (L409) | OBS-M | Treinamento: contadores texto/total/limite; "instruções de comportamento" com contador e resetar; "texto do treinamento". | P7 51:46 | Limites respeitados. | Valores exemplo; conteúdo não transcrito | BLOQ-EXT |
| GRP-IAG-05 (L410) | OBS-M | Regras "se o texto de resposta da IA contiver [texto] → então [multiselect]": remover pessoa do grupo, apagar mensagem da pessoa, marcar administradores, não responder mais. | P7 51:46/52:34 | [PROP] Validação de vazio/duplicata; prévia da ação. | [PROP] política própria e revisão humana para ações consequenciais = proposta pendente DEC-19 (não observada); NT | DEC-19 |
| GRP-IAG-06 (L411) | OBS-M | Configurar: nome; campanhas com checkbox e status; Sim/Não "responder sem '?'", "primeira resposta do bot sem IA", "responder administradores"; tipo Privado / Campanhas. | P7 53:42 | Escopo respeitado. | Campanhas sem checkbox = inferência | BLOQ-EXT |
| GRP-IAG-07 (L412) | OBS-M | Detalhe do agente: abas Visão geral / Threads / Ações; card com tipo, editar, ⋮; toggle de ativação. | P8 54:41 | Estado ativo inequívoco. | Rótulo ambíguo na referência — não inferir | BLOQ-EXT |

## WHE — Webhooks de entrada (integrações) (PM L414)

**Rota/tela atual candidata:** `/whats/webhooks` — T (ambíguo entrada/saída); `/whats/integracoes` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-WHE-01 (L417) | OBS-M | Lista com abas Integrações / Arquivadas, ordenação, "+ Webhook", cards. | P8 55:08; CF 29 | — | — | configuração local |
| GRP-WHE-02 (L418) | OBS-M | Criação com escolha de plataforma (~20 vistas, ex.: plataformas de cursos/pagamento, API genérica, CRM/e-mail, e-commerce; algumas BETA). | P8 55:08 | — | Campos Nome/Projeto **não legíveis**; cada plataforma exige contrato próprio (bloqueado) | BLOQ-EXT |
| GRP-WHE-03 (L419) | OBS-M | Detalhe: Visão geral / Contas associadas / Automações / Eventos; automação "quando <evento>" com Ativado e contadores. | P8 56:02 | — | Endpoint/URL **não** visto nem a definir aqui | vínculo explícito |
| GRP-WHE-04 (L420) | OBS-M | Assistente **Categoria → webhook → Configurações → Gatilho → Conta → Ação → Confirmar**. | P8 56:09 | — | Campo de produto não amostrado | BLOQ-EXT |
| GRP-WHE-05 (L421) | OBS-M | Eventos vistos (checkbox): compra aprovada, abandono de carrinho, impressão de boleto, pedido de reembolso, compra cancelada, compra estornada, compra completada, pagamento atrasado, compra expirada (lista continua). | P8 56:09 | — | Mapeamento por plataforma = contrato externo | BLOQ-EXT |
| GRP-WHE-06 (L422) | OBS-M | Ações vistas: enviar mensagem, enviar SMS, fazer ligação, requisição HTTP, tag condicional, remover/adicionar à campanha, remover lead, adicionar tag (lista continua). | P8 56:14 | — | SMS/ligação/HTTP = NT; bloqueados | BLOQ-EXT |

## WHS — Webhooks de saída (rótulo da referência: "Sendhooks") (PM L424)

**Rota/tela atual candidata:** `/whats/webhooks` — T (ambíguo); `/whats/integracoes` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-WHS-01 (L427) | OBS-M | Abas lista / Histórico; "+ Adicionar"; cards "envia eventos de <evento>" com info e excluir. | P8 57:32; CF 30 | — | Horários de envio de métricas = texto de UI, não regra | BLOQ-EXT |
| GRP-WHS-02 (L428) | OBS-M | Estado de erro visível (limite de erros, código HTTP) com "Marcar como resolvido". | P8 57:32 | [PROP] Erro permanece visível até marcado como resolvido; contador coerente. | Persistência do erro não demonstrada | BLOQ-EXT |
| GRP-WHS-03 (L429) | OBS-M | Criar: Nome, Link de destino, credencial gerada (mascarada), busca de eventos com contador; grupos de eventos CAMPANHA (métricas da campanha, métricas de mensagens, solicitações de entrada), GRUPOS (membro adicionado, membro removido, grupo suspenso, bloqueio de crescimento), CONTAS (conta banida, restrição temporária). | P8 59:01 | Lista de eventos declarada; sem eventos ocultos. | Credencial vista em claro — **não reproduzir** | BLOQ-EXT |
| GRP-WHS-04 (L430) | OBS-C | "Limite de erros até desativar" (stepper). | P8 59:01 | Desativação explícita e visível. | Valor exemplo | BLOQ-EXT |
| GRP-WHS-05 (L431) | DIR | Nenhum envio a destino externo sem autorização. | DIR-04 | — | NT | BLOQ-EXT |

## BRD — Broadcast(s) e Leads (PM L433)

**Rota/tela atual candidata:** `/whats/broadcasts` — P; `/whats/leads-groups` — P; `/whats/leads` — T. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-BRD-01 (L436) | OBS-M | Broadcasts: vazio + "Cadastrar"; grade de cards com nome, status e alerta "nenhuma conta associada". | P8 1:01:01; P9 1:02:07; CF 31 | Alerta de dependência visível. | Detalhe/busca não amostrados | BLOQ-EXT |
| GRP-BRD-02 (L437) | OBS-M | Itens distintos "Broadcast", "Leads" e "Broadcasts" na sidebar. | P6 41:03; P8 1:01:01 | — | Diferença semântica = DEC-20 | DEC-20 |
| GRP-BRD-03 (L438) | FALA (cap.) | Mensagens um a um, SMS e ligação. | CAP 64:52 | — | NT; bloqueado | BLOQ-EXT |

## TRN — Treinamentos e suporte (PM L440)

**Rota/tela atual candidata:** `/whats/contents` — P (bloqueado). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-TRN-01 (L443) | OBS-M | Grade de cursos com selo de conclusão. | P9 1:02:50; CF 32 | — | **Escopo = DEC-09**; não inventar player/checkout | DEC-09 |
| GRP-TRN-02 (L444) | OBS-M | Curso: voltar, barra de progresso, busca de aula, "continuar de onde parei", módulos recolhíveis com aulas numeradas e concluídas. | P9 1:02:55/1:03:17 | Progresso coerente com aulas concluídas. | Player **não confirmado** (RV) | DEC-09 |
| GRP-TRN-03 (L445) | OBS-M | Widget de ajuda: saudação, status de atendimento, iniciar conversa, artigos populares, artigo passo a passo. | P9 1:03:29/1:03:40/1:03:52 | Não bloqueia a página; indisponibilidade visível. | Suporte externo = DEC-09 | DEC-09 |

## ZZZ — Áreas vistas apenas como rótulo (sem conteúdo amostrado) (PM L447)

**Rota/tela atual candidata:** ver linha; parte das abas está no PR #6 só com o nome. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-ZZZ-01 (L451) | (rótulo; sem coluna Classe no PM) | Aba Diagnósticos (campanha) | P1 07:05 | — | conteúdo desconhecido | DEC |
| GRP-ZZZ-02 (L452) | (rótulo; sem coluna Classe no PM) | Aba Mensagens (campanha) | P1 07:05 | — | provável lista de mensagens/ações — não presumir | DEC |
| GRP-ZZZ-03 (L453) | (rótulo; sem coluna Classe no PM) | Aba Mensagens recebidas | P1 07:05 | — | depende de provedor (NT) | DEC |
| GRP-ZZZ-04 (L454) | (rótulo; sem coluna Classe no PM) | Aba Calendário | P1 07:05 | — | provável visão de agendamentos — não presumir | DEC |
| GRP-ZZZ-05 (L455) | (rótulo; sem coluna Classe no PM) | Variáveis da campanha (global) | P6 41:03; P2 16:45 ("abrir painel") | — | parcial | DEC |
| GRP-ZZZ-06 (L456) | (rótulo; sem coluna Classe no PM) | Deep link (global) | P6 41:03 | — | só toggle por campanha visto | DEC |
| GRP-ZZZ-07 (L457) | (rótulo; sem coluna Classe no PM) | Alertas (global) | P6 41:03 | — | só card no painel | DEC |
| GRP-ZZZ-08 (L458) | (rótulo; sem coluna Classe no PM) | Modelos de mensagem | P6 41:03 | — | INF: modelos versionados | DEC |
| GRP-ZZZ-09 (L459) | (rótulo; sem coluna Classe no PM) | Leads (global) | P6 41:03 | — | — | DEC |
| GRP-ZZZ-10 (L460) | (rótulo; sem coluna Classe no PM) | "SendSpace" | P6 41:03 | — | nome proprietário; semântica desconhecida | DEC |
| GRP-ZZZ-11 (L461) | (rótulo; sem coluna Classe no PM) | "SendAPI" | P6 41:03 | — | API pública do produto **não** definida aqui | DEC |
| GRP-ZZZ-12 (L462) | (rótulo; sem coluna Classe no PM) | "MCP" (BETA) | P6 41:03 | — | não definir | DEC |
| GRP-ZZZ-13 (L463) | (rótulo; sem coluna Classe no PM) | Histórico | P6 41:03 | — | — | DEC |
| GRP-ZZZ-14 (L464) | (rótulo; sem coluna Classe no PM) | Equipe | P7 48:21 | — | permissões/papéis **não demonstrados**; não inventar admin | DEC-21 |
| GRP-ZZZ-15 (L465) | (rótulo; sem coluna Classe no PM) | Mapa Contas × Campanhas / "Ver dashboard" | P1 01:14 | — | só cartão visto | DEC |

## VIS — Linguagem visual (para a etapa final de design, outro responsável — DIR-02/03) (PM L467)

**Rota/tela atual candidata:** todas (estilo global `app/src/styles/global.css`). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-VIS-01 (L470) | (rótulo; sem coluna Classe no PM) | OBS-M | Tema escuro; cards cinza-escuros com bordas sutis e cantos levemente arredondados; linha de destaque fina no topo. | — | CF §1; P1 01:14 | FIN |
| GRP-VIS-02 (L471) | (rótulo; sem coluna Classe no PM) | OBS-M | Uma cor de destaque para ação primária, foco, toggle ligado, aba ativa e etapa concluída (referência usa amarelo; **cor própria = DEC-01**); verde = online/sucesso; vermelho = excluir/erro/dependência; laranja = conclusão de curso/série. | — | CF §1 | FIN |
| GRP-VIS-03 (L472) | (rótulo; sem coluna Classe no PM) | OBS-M | Tipografia sans-serif; botões em caixa alta pequena; rótulos flutuantes. | — | CF §1 | FIN |
| GRP-VIS-04 (L473) | (rótulo; sem coluna Classe no PM) | OBS-M | Componentes: sidebar de ícones expansível, breadcrumb, abas sublinhadas, sub-abas, grupos segmentados, rádios em cards com ícone, checkbox em listas, toggles, select/multiselect, sliders simples e de faixa, seletor data/hora com OK, stepper 3–8 etapas, cards KPI, gráficos barras/linhas, tabelas paginadas, menus ⋮, modais com fundo escurecido e botão primário largo, selos (BETA, contadores, variação %), avisos inline, widget flutuante. | — | CF §1; GA | FIN |
| GRP-VIS-05 (L474) | (rótulo; sem coluna Classe no PM) | OBS-M | Estados: foco, desabilitado, validação obrigatória, vazio, carregando, erro de conector com "resolvido", alerta de dependência, selo "agendado para". | — | CF §1 | FIN |
| GRP-VIS-06 (L475) | (rótulo; sem coluna Classe no PM) | DIR | Alvo 88–96% de fidelidade qualitativa informado; não medido; sem medidas inventadas; sem copiar marca/textos. | — | DIR-03/08 | FIN |

## EXC — Conteúdo observado e excluído (PM L477)

**Rota/tela atual candidata:** não aplicável (conteúdo excluído). **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-EXC-01 (L480) | (rótulo; sem coluna Classe no PM) | Página de planos/preços (3 colunas, assinatura via conversa externa, sem checkout) | P9 1:04:00–1:07:30; CF 33 | — | **Não é requisito**; preços/planos/limites não transcritos; sem checkout | EXC |
| GRP-EXC-02 (L481) | (rótulo; sem coluna Classe no PM) | Logotipos/capas de terceiros, nomes de clientes, saudações personalizadas | P4 30:38; P9 1:02:07/1:02:50; P6 42:08 | — | Não reproduzir | EXC |
| GRP-EXC-03 (L482) | (rótulo; sem coluna Classe no PM) | Alegações de eficácia anti-ban, "escudo", ROI, taxas | P2 §C/D; P7 §C; P8 §C | — | Não registrar como requisito | EXC |

## INT — Integração com provedor de mensageria (Meta / WhatsApp) (PM L484)

**Rota/tela atual candidata:** nenhuma; `/whats/integracoes` — P. **Estado no sendflow-rebuild:** NÃO VERIFICADO / sem backend.

| ID | Classe | Requisito (PM, literal) | Fonte (PM) | Aceitação PROPOSTA (PM) | Limite (PM) | Estado no backend LEGADO (matriz R88, coluna de escopo) |
|---|---|---|---|---|---|---|
| GRP-INT-01 (L487) | DIR | Caminho de integração escolhido: Embedded Signup v5 em modalidade REGULAR (escolha informada de Loigo). | DIR-06; CK16 §estado | Preparação só com cliente desativado e sem Internet, quando ordenada. | **Não** prova Groups/Graph/OBA/capacidade; não vem do vídeo | INF-ATUAL + BLOQ-EXT |
| GRP-INT-02 (L488) | DIR+PROP | Sessão/vinculação separada da conta, com IDs externos distintos, origem, tenant, replay e readiness explícitos; nunca "conectado" falso. | CK16 F01; CHECKLIST-RETENCAO-REPLAY-ES5; CHECKLIST-TROCA-CODIGO-TOKEN-ES5 | Testes negativos sem rede. | Contrato oficial atual pendente | INF-ATUAL |
| GRP-INT-03 (L489) | DIR | Ativação real exige documentação oficial atual, conta, contrato, permissões/elegibilidade e autorização específica futura. | DIR-06; CK16 L71 | Sem isso: estado "bloqueado/não integrado". | Sem conexão/envio/deploy | BLOQ-EXT |
| GRP-INT-04 (L490) | PROP | Toda função que depende do provedor (criar/editar grupo real, enviar, aprovar entrada, ler participantes, detectar ban/desconexão) mantém estado local honesto até integração. | CF §6.3; DL | Matriz marca NT/bloqueado. | — | INF-ATUAL |
| GRP-INT-05 (L491) | INF | **Estado histórico informado à época** do checklist: um gate recusava troca de código de autorização por credencial; mudar isso seria **nova função**, não endurecimento. Estado vigente do gate deve ser **reconfirmado por revisão**; este prompt não manda reverter nada hoje. | CHECKLIST-TROCA-CODIGO-TOKEN-ES5 §1–2 | [PROP] Enquanto o gate antigo vigorar, seus testes negativos permanecem. | Snapshot, não estado atual; decisão contratual pendente | BLOQ-EXT |

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
