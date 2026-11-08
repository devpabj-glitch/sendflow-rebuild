# PROMPT MESTRE — Grupos (produto próprio)

> **Versão:** PM-GRUPOS v1.0 — **revisão final** (gerada 07/11/2026 ~09:12; revisada 07/11/2026 ~09:20, America/Sao_Paulo, UTC−3). Nova consolidação/especificação gerada a partir do estudo tela a tela.
> **Natureza:** nova consolidação/especificação **derivada** do estudo tela a tela; **não é** recuperação nem reconstituição fiel do prompt mestre original histórico (a fonte mestre original continua **ausente**; ver CRITERIOS-RECONCILIACAO-BACKEND-R39.md). Versão anterior desta mesma geração preservada em `PROMPT-MESTRE-GRUPOS.v1.0-rascunho-0912.md`.
> **Status:** especificação **PROPOSTA para alinhamento**. Não está aprovada, não autoriza implementação irrestrita e não certifica nenhum backend existente.
> **Proveniência:** gerado exclusivamente a partir das notas sanitizadas do estudo tela a tela em `/workspace/grupos-referencia-visual/` (PARTE-01…09, CONSOLIDADO-FINAL, GUIA-ACUMULADO, INVENTARIO-EVIDENCIAS, INVENTARIO-ESCOPO, DIFERENCAS-E-LACUNAS, PROCEDENCIA, capitulos.txt e, só para limites técnicos, os CHECKLIST-*/PARECER-*/CRITERIOS-R39). Nenhum vídeo, quadro, código, repositório, banco, servidor, conta ou rede foi aberto para gerar este documento.
> **Pedido:** encaminhado pelo coordenador (agente "grupos"), atribuído a Loigo, 07/11/2026 09:12 (America/Sao_Paulo). As diretrizes marcadas **DIR** são **atribuídas a Loigo conforme encaminhadas pelo coordenador**; não foram lidas diretamente do original do usuário.
> **Referência estudada:** vídeo público de demonstração de uma ferramenta de mercado para grupos e comunidades de WhatsApp (YouTube ID xbsH9OoQlt4; 4059 s; 37 capítulos). É referência **funcional e visual qualitativa**; o produto Grupos tem identidade própria.

---

## Sumário
0. Limites, legenda e como ler
1. Instrução-mestre reutilizável (colar no executor)
2. Diretrizes (DIR) e ordem de trabalho
3. Modelo de domínio observável (entidades e relações)
4. Catálogo de requisitos por módulo (IDs estáveis)
5. Fluxos transversais
6. Invariantes de engenharia propostas (não extraídas do vídeo)
7. Regras de entrega, regressão e matriz de evidência
8. Matriz: funções observadas × escopo delegado/informado × pendências
9. Decisões pendentes, lacunas e exclusões
10. Mapa de cobertura inversa das fontes (controle de completude)
11. Resumo de lacunas
12. Histórico de revisão

---

## 0. Limites, legenda e como ler

### 0.1 O que o vídeo prova e o que não prova
- **Prova (no máximo):** que certas telas, rótulos, campos, opções, estados visuais, sequências de etapas e relações de navegação **apareceram** na UI da referência, nos tempos registrados nas notas.
- **Não prova:** APIs, DDL/esquema, multi-tenant/isolamento, permissões, segurança, criptografia, provedor (WhatsApp/Meta/IA/pagamento), efeito externo real, algoritmos (distribuição, lotação, score, risco), cron/periodicidade, limites/rate limits, defaults, eficácia anti-ban/anti-spam/anti-hacker.
- **Valores numéricos vistos são exemplos**, nunca defaults ou regras (ex.: 350, 3, 18/95 como contador visto, 0/2048, 7H–24H, 40–60, 100 itens/pacote, 10–20 min, 2–10 s, 5 erros, 10/20/40/50/60 pts, datas de 2026, modelo de IA). Isso inclui os contadores de limite: o *limite* exibido (95, 2048, 1.000, 50.000) é observado como existente na referência, mas o valor para o Grupos é **decisão** (DEC-12).
- **Ausência na amostragem ≠ função inexistente.** "Não confirmado na amostragem" significa só que nenhum quadro inspecionado mostrou o item.
- **Tempos:** são tempos do vídeo original registrados nas notas (margem de keyframe de até ~3 s, não deslocamento). Os **capítulos** do YouTube ficam atrás do conteúdo real (~2 min nas partes 2–3) e só servem como localizador temático (marcados "cap.").

### 0.2 Legenda de classes (coluna "Classe")
| Classe | Significado | Força para requisito |
|---|---|---|
| **OBS-M** | Mostrado em quadro (tela, rótulo, campo, opção, estado visual) | Requisito de presença de UI/opção equivalente, com identidade própria; **não** prova comportamento, persistência ou regra de backend |
| **OBS-C** | Valor configurado visível em quadro (exemplo) | Requisito do **campo/opção**; o valor é só exemplo |
| **OBS-E** | Execução/estado **visível na UI** em quadro/relato (ex.: item listado na fila com selo/tempos) | Requisito de que o estado/registro seja **exibível**; persistência, registro local e efeito backend/externo **desconhecidos** (não provados pela UI) |
| **FALA** | Fala da apresentadora relatada (watchVideo) | Intenção funcional; **não** é regra nem contrato; vira requisito só via DEC/DIR |
| **RV** | Relato visual/temporal do watchVideo não confirmado em quadro | Pendente de confirmação; não implementar como fato |
| **DIR** | Diretriz atribuída a Loigo, encaminhada pelo coordenador | Ordem de trabalho/limite (não funcionalidade inventada) |
| **INF** | Estado informado pelo coordenador/brief (não código auditado) | Contexto; não certifica nada |
| **PROP** | Proposta/hipótese/controle de engenharia do analista | Requer alinhamento; não é extraído do vídeo |
| **NT** | Efeito externo (WhatsApp, pagamento, IA, SMS, ligação, HTTP) não testado | Sempre bloqueado/não integrado até contrato |

### 0.2.1 Como ler as colunas (vale para TODAS as tabelas)
- **Classe** e **Fonte** classificam **apenas a observação descrita** (o que foi visto/dito e onde). Não atestam comportamento, persistência ou backend.
- **Requisito:** a parte observada é descrita como vista; **inferências específicas** (universalidade "em todas as telas", navegabilidade, somatórios, preservação ao arquivar, não alteração de contagens, disparo único, persistência de erro, papéis múltiplos, cardinalidades, propriedade/tenant) aparecem marcadas **[PROP]** e dependem de contrato/decisão.
- **Aceitação:** é **critério PROPOSTO derivado** (PROP) para verificar uma futura implementação; **não** é comportamento comprovado da referência nem do backend atual. Onde a aceitação contém inferência sensível, ela também está marcada [PROP].
- **Limite:** fronteira da evidência e pendências.

### 0.3 Formato dos IDs
`GRP-<MÓDULO>-<NN>` (requisitos), `DIR-NN`, `ENT-NN`, `FLX-NN`, `ENG-NN`, `DEC-NN`, `LAC-NN`, `EXC-NN`. IDs são estáveis: em versões futuras, **não renumerar**; itens removidos ficam marcados "RETIRADO" com motivo.

### 0.4 Fontes (abreviações dos localizadores)
P1…P9 = PARTE-01…09.md (§A confirmado em quadros, §B divergências/relato, §C falas, §D/§E critérios propostos); CF = CONSOLIDADO-FINAL.md (§2 item N); GA = GUIA-ACUMULADO.md; DL = DIFERENCAS-E-LACUNAS.md; IE = INVENTARIO-ESCOPO.md; IEV = INVENTARIO-EVIDENCIAS.md; CAP = capitulos.txt; CK16 = CHECKLIST-PRE-MUDANCA-PACOTE-16.md; demais CHECKLIST/PARECER pelo nome.

### 0.5 Marca e textos
Não copiar marca, logotipo, nomes de módulos proprietários, textos explicativos, cases, capas de curso ou preços da referência. Rótulos da referência aparecem neste documento **apenas como localizador** (entre aspas). Nomes de módulos do Grupos são próprios (ver DEC-01). Nomes de plataformas de terceiros (ex.: Hotmart, Stripe) aparecem só como fato observado de lista de integrações, não como compromisso de integração.

---

## 1. Instrução-mestre reutilizável (colar no executor)

```text
Você vai desenvolver o produto próprio "Grupos": uma plataforma para operar
campanhas de grupos e comunidades de mensageria (contas, campanhas, grupos,
link único de entrada, fila de ações, mensagens, automações, métricas e
módulos de proteção/integração), tomando como referência FUNCIONAL e VISUAL
QUALITATIVA o estudo tela a tela documentado em PROMPT-MESTRE-GRUPOS.md
(PM-GRUPOS v1.0, 07/11/2026). Este prompt é especificação PROPOSTA para
alinhamento; ele não autoriza sozinho implementar módulos pendentes.

REGRAS OBRIGATÓRIAS
1. Ordem: banco de dados, APIs e lógica de backend PRIMEIRO. Design/admin
   ficam com outro responsável, na etapa final. Não exija UI e backend
   simultâneos; não construa telas finais antes da ordem correspondente.
2. Só trabalhe na fatia coordenada pelo coordenador DENTRO de delegação/
   autorização verificável de Loigo. Ordem ou relato de agente não amplia
   essa autorização; na dúvida, pare e peça confirmação.
   O catálogo (seção 4) descreve o produto inteiro observado; a matriz da
   seção 8 diz o que já está em escopo informado e o que está pendente.
3. Funções reais de produção. Nada fake, mock ou dado de demonstração
   apresentado como real. Quando uma dependência externa (WhatsApp/Meta,
   IA, pagamento, SMS, ligação, HTTP de terceiros) não estiver disponível,
   o estado é "bloqueado / não integrado", visível e honesto; nunca invente
   resultado, "conectado", "enviado" ou "criado no WhatsApp".
4. O vídeo de referência NÃO é contrato de API, DDL, segurança, tenant,
   provedor ou efeito externo. Não converta relato, fala, exemplo ou valor
   visto em regra, default ou limite. Valores do catálogo são exemplos.
5. Contrato desconhecido (campo, política, limite, semântica de provedor,
   comportamento legado, rota já existente) => pare e consulte o
   coordenador. Não
   escolha padrão silencioso, não reinterprete campo legado, não migre
   registros existentes para semântica nova sem decisão registrada.
6. DB e APIs são o trabalho de backend: dentro de uma fatia autorizada,
   crie o modelo de dados e as APIs NECESSÁRIOS às funções especificadas,
   registrando cada contrato técnico novo de forma explícita e alinhando-o
   com o coordenador; nunca atribua esse contrato ao vídeo. "Contrato
   existente" significa preservar e testar o que já existe (regressão),
   não impedir produto novo especificado. Extra = função, módulo, política,
   infraestrutura ou recurso fora da especificação/fatia autorizada: não
   adicione. Admin global NÃO foi demonstrado: não invente.
7. Preserve as distinções: conta ≠ sessão/credencial ≠ IDs externos;
   campanha ≠ grupo ≠ lead; clique ≠ entrada ≠ participante ≠ reserva;
   tarefa ≠ tentativa ≠ efeito ≠ conclusão (finish); configuração salva ≠
   execução ≠ resultado. Configuração "só para novos grupos" não altera
   grupos existentes.
8. Integração Meta: a opção Embedded Signup v5 em modalidade REGULAR é
   escolha informada de Loigo; não é prova de capacidade de Groups/Graph/
   OBA. Qualquer integração real exige documentação oficial atual, conta,
   contrato e autorização específica futura. Não conecte contas, não envie
   mensagens, não faça deploy.
9. Identidade própria: não copie marca, logotipo, nomes proprietários,
   textos, capas ou preços da referência; não se apresente como ela.
10. Segredos e PII: nunca registrar, logar, exportar ou reexibir tokens e
   números completos; mascarar por padrão. Use somente dados sintéticos
   em testes; não abra bancos reais/demo.
11. Entrega por função: cada requisito tocado tem cenário, esperado/real,
   revisão e evidência; regressão por função e confronto integral dos
   requisitos (seção 7) antes de declarar fechamento. Nunca declare
   "100%", "aprovado" ou percentual de fidelidade medido.
12. Alvo visual (etapa final, outro responsável): 88–96% de fidelidade
   visual qualitativa à referência, conforme informado por Loigo; NÃO é
   percentual medido nem certificação e não há metodologia definida aqui.
```

---

## 2. Diretrizes (DIR) e ordem de trabalho

| ID | Diretriz (atribuída a Loigo, encaminhada pelo coordenador) | Consequência operacional |
|---|---|---|
| DIR-01 | DB, APIs e lógica de backend **primeiro**. | Fatias de backend antes de UI; UI provisória só se ordenada, sem se passar por design final. |
| DIR-02 | Design/admin com **outro responsável**, na etapa final. | Este prompt descreve o visual como referência para essa etapa (GRP-VIS); o executor de backend não o implementa. |
| DIR-03 | Alvo de fidelidade visual **88–96%** ao vídeo, informado. | Não é medição nem certificação; sem metodologia inventada; sem medidas de pixel inventadas. |
| DIR-04 | **Funções reais de produção**; nada fake/demo apresentado como real. | Dependência ausente = "bloqueado/não integrado". Simulação, se algum dia ordenada, rotulada como simulação. |
| DIR-05 | **Regressão por função** e **confronto integral de requisitos** antes de fechar; **sem extras**. | Seção 7. |
| DIR-06 | **Meta ES v5 REGULAR** é escolha informada de Loigo. | Não prova Groups/Graph/OBA/capability; integração exige docs atuais/conta/contrato/autorização específica; não autoriza conexão/envio/deploy. |
| DIR-07 | Ordens futuras coordenadas. | Este prompt não é autorização irrestrita; cada fatia é coordenada pelo coordenador **dentro de delegação/autorização verificável de Loigo**; relato de agente não amplia autorização. |
| DIR-08 | Produto próprio; referência de marca não significa copiar. | Seção 0.5; DEC-01. |
| DIR-09 | Prioridades existentes: DB/APIs/lógica; restauração isolada e ES sem contas somente se contrato confirmado. | INF via CRITERIOS-R39; não acrescentar recurso/infra/política. |

**Não são DIR:** as prioridades P1/P2/P3 do CONSOLIDADO §5 (sugestão do analista, **não aprovada**); os critérios de regressão "propostos" das partes (PROP); percentuais, prazos ou "100%".

**Ordem sugerida dentro de uma fatia autorizada (PROP):** (1) confirmar contrato existente e fonte; (2) modelo de dados e invariantes (seção 6) com preservação de legado; (3) lógica/serviços; (4) API conforme contrato existente; (5) testes por função com dados sintéticos; (6) regressão integral; (7) matriz de evidência; (8) reporte ao coordenador. UI final: etapa separada (DIR-02).

---

## 3. Modelo de domínio observável (entidades e relações)

> **Mapa lógico PROP** construído a partir de telas e associações **vistas na UI**. A coluna "Observado" é evidência; a coluna de associações descreve o que a UI mostrou junto, e qualquer **cardinalidade (1:1, 1:N, N:N), propriedade por usuário/espaço ou tenant é PROP a confirmar por contrato**. Nomes técnicos, chaves e tabelas são decisão do responsável; o vídeo não mostra DDL.

| ID | Entidade | Observado (fonte) | Associações vistas na UI (relação lógica = PROP) | Limite |
|---|---|---|---|---|
| ENT-01 | **Conta** (número/conta de mensageria) | Criar conta: Nome, "Conta espião", Tipo (P1 01:36); lista com status online (P1 01:14) | listada no painel inicial; selecionável em Contas associadas de campanha; aparece em coluna Contas do projeto (P6 40:16). [PROP] propriedade por usuário/espaço/tenant e cardinalidade com campanhas | Sessão/credencial/IDs externos **não vistos**; separação = ENG-01 (PROP) |
| ENT-02 | **Campanha** | Nome + Tipo (P1 03:32/04:05); 12 abas (P1 07:05) | tem contas associadas, grupos, link único, ações, automações, métricas; pode estar em projeto | — |
| ENT-03 | **Associação campanha–conta** | Contas associadas com checkbox, contador N/M (P1 07:05) | "contas criadoras de grupos" e "range de operação" como opções (P1 07:05) | Papéis por conta **não confirmados** |
| ENT-04 | **Grupo** (da campanha) | Linha com número sequencial, nome, Redirect x/limite, Cliques reais, Participantes, "Grupo normal", Cheio Sim/Não (P3 21:08) | listado na aba Grupos da campanha; criado ou importado; menu ⋮ com ações de link de convite. [PROP] pertença exclusiva a uma campanha e link próprio 1:1 | Relação com comunidade só como opção |
| ENT-05 | **Configuração de criação de grupos** (template) | Modal completo (P1 08:26–10:25; P2 10:34–13:44) | aberta a partir da campanha; aviso "só novos grupos". [PROP] uma por campanha | efeitos NT |
| ENT-06 | **Administrador de grupo** | Aba Administradores, 2 seções + Novo administrador (P2 14:06) | ligado à configuração de criação | campos DDI/número não confirmados |
| ENT-07 | **Link único de convite/redirecionamento** | Card com Editar/Copiar (P2 14:46) | um card de link visto na visão geral da campanha amostrada; distribuição para grupos = FALA. [PROP] cardinalidade por campanha | algoritmo NT |
| ENT-08 | **Clique / Entrada / Saída / Participante** | KPIs separados Clicks, Entraram, Percentual, Saíram, Participantes (P2 14:46); por grupo Redirect, Cliques reais, Participantes (P3 21:08) | métricas por campanha/projeto/global | fórmulas NT |
| ENT-09 | **Ação** (item da fila) | Tipos vistos: "Campanha: Criar Grupo", "Importar grupos", "Alterar nome do grupo"; sub-abas na fila/agendado/processando/sucesso/falha (P2 14:22; P3 23:40/24:28) | aba Ações da campanha e item "Ações" global. [PROP] origem por operação, ação manual ou automação | transições não legíveis (P3 23:40) |
| ENT-10 | **Mensagem (conteúdo em blocos)** | Editor com blocos, preview, spintax, opções de envio (P4 27:33–31:57; P5 32:20/33:13) | conteúdo de ação manual/automação; usa variáveis/modelos | "Modelos de mensagem" só na sidebar |
| ENT-11 | **Automação** | Assistente e lista com gatilho "Encher grupo", Ativado, contadores Fila (P4 27:08/29:27; P5 36:40) | campanha, grupo, gatilho, conta, ação, [cronograma], conteúdo; também sob webhook (P8 56:02) | — |
| ENT-12 | **Cronograma** (recorrência) | 7/14/28 dias/Mensal, dia da semana, hora, início/fim, próxima execução estimada, fuso (P5 36:40/37:50) | de automação | dias do mês / iniciar-pausar não vistos |
| ENT-13 | **Projeto** (pasta) | Editar/Excluir, 8 KPIs, colunas Contas/Campanhas/Webhooks (P6 40:16) | agrupa contas, campanhas, webhooks | isolamento **não provado** |
| ENT-14 | **Tag** e **Variável de campanha** | Gerenciamento de Tags (menu); Valores das variáveis Nome/Tipo/Valor na campanha (P3 16:52) | variáveis usadas no editor | tela de tags não amostrada |
| ENT-15 | **Lead** e **pontuação** | Leadscoring: número, pontos, status por tipo de evento (P6 43:55) | por campanha; "Leads" global na sidebar | cálculo NT |
| ENT-16 | **Solicitação de entrada** | Pendentes/Processadas/Configurações (P6 44:06/45:01) | por campanha | config por tag não vista |
| ENT-17 | **Lista anti-spam**: números bloqueados, números administrativos | 3 abas (P6 46:10/47:45) | tela fora da campanha, com aba "Contas associadas". [PROP] abrangência (por usuário/global) e relação com campanhas | eficácia FALA; "proteção" de administrativos não provada |
| ENT-18 | **Blacklist** | detalhe com abas Campanhas/Números (P7 48:40/49:30) | aba Campanhas com checkbox de campanhas. [PROP] aplicação por campanha | aba Números não vista |
| ENT-19 | **Agente de IA** | lista; assistente 3 etapas; regras; escopo campanhas; Threads/Ações (P7 50:31–53:42; P8 54:41) | campanhas ou privado | IA/moderação NT; token sensível |
| ENT-20 | **Webhook de entrada** (integração) | plataformas, detalhe com Contas/Automações/Eventos (P8 55:08/56:02) | contas associadas, automações por evento; aparece em projeto | NT |
| ENT-21 | **Webhook de saída** (evento → destino) | cards por evento, erro + resolvido, limite de erros (P8 57:32/59:01) | eventos de campanha/grupos/contas | NT |
| ENT-22 | **Broadcast** | grade com status e alerta "Nenhuma conta associada" (P8 1:01:01; P9 1:02:07) | alerta sugere dependência de conta associada. [PROP] relação | detalhe não visto |
| ENT-23 | **Curso/Aula/Progresso** e **Ajuda** | Treinamentos e widget (P9 1:02:50–1:03:52) | progresso exibido por curso. [PROP] progresso por usuário | escopo do Grupos = DEC-09 |
| ENT-24 | **Alerta/Notificação** | card Alertas; "Desconectadas 24h"; item Alertas na sidebar (P6 42:08; 41:03) | painel de métricas e item próprio na sidebar. [PROP] abrangência | regras de alerta NT |

**Associações vistas na UI (resumo; cardinalidades a confirmar — PROP):** Conta ↔ Campanha (lista de contas associadas com checkbox e opções); Campanha → Grupos (aba Grupos); Campanha → card de link único; Grupo → ações de link de convite no menu ⋮; Campanha → Ações e Automações (abas); Projeto → colunas Contas/Campanhas/Webhooks; Blacklist e Agente de IA → listas de campanhas com checkbox; Webhook → abas Contas associadas/Automações/Eventos. Se são 1:1, 1:N ou N:N, e a quem pertencem (usuário/espaço/tenant), é **contrato a definir**, não observação.

## 4. Catálogo de requisitos por módulo

> Cada linha: **ID · Classe (da observação) · Requisito (observado + inferências marcadas [PROP]) · Fonte/localizador/tempo (da observação) · Aceitação (critério PROPOSTO derivado, não comportamento comprovado) · Limite/pendência.** Ver §0.2.1.
> "Escopo" de cada módulo (seção 8) diz se está informado como em trabalho, pendente de ordem, bloqueado por dependência externa ou excluído. Requisitos derivados de UI descrevem **o dado/estado que a UI precisa**; o desenho de DB/APIs que os sustenta é tarefa de backend dentro da fatia autorizada (§1 regra 6; §6), registrado como contrato técnico novo e explícito, sem atribuí-lo ao vídeo.

### 4.1 MOD NAV — Shell, navegação global e visão geral inicial
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-NAV-01 | OBS-M | Navegação global por barra lateral recolhível (ícones) e expansível (rótulos), com item ativo destacado. | P1 01:14; P6 41:03; CF 22 | Expandir/recolher sem perder rota; item ativo indicado. | Ordem/nomes finais = DEC-01 |
| GRP-NAV-02 | OBS-M | Mapa de navegação contém, como áreas: Visão geral, Métricas, Projetos, Contas, Campanhas, Variáveis da campanha, Webhooks (entrada), Deep link, Automações, Webhooks de saída, Blacklists, Ações, Anti-spam, Alertas, Agente de IA, Modelos de mensagem, Broadcast, Leads, Broadcasts, Treinamentos, Equipe e itens "SendSpace", "SendAPI", "MCP (BETA)", "Histórico". | P6 41:03; P7 48:21 (Equipe) | Cada área prevista tem rota ou está marcada "pendente/fora de escopo" na matriz. | Vários itens **sem conteúdo amostrado** (GRP-ZZZ); não inventar funções |
| GRP-NAV-03 | OBS-M | Breadcrumb visto nas telas de detalhe amostradas (ex.: Campanhas › campanha › aba). [PROP] presença em todas as telas e navegabilidade de cada nível. | P1 07:05; CF §3 | [PROP] Breadcrumb reflete hierarquia e é navegável. | Universalidade e clique nos níveis não comprovados |
| GRP-NAV-04 | OBS-M | Busca global com atalho de teclado e acesso a configurações no topo. | P1 01:14 | Atalho abre busca; escopo da busca = DEC-13. | Resultado de busca não amostrado |
| GRP-NAV-05 | OBS-M | Visão geral inicial com cartão de perfil (acesso a configurações), cartão "Mapa Contas × Campanhas" com estado de saúde das associações e acesso a painel, e três colunas: Contas (contador N/limite, "+", busca, status), Campanhas (contador, "+", busca, cards com 4 métricas e status), Webhooks (contador, nome, tipo). | P1 01:14; CF 1 | Colunas listam dados reais do usuário; contadores batem com contagem persistida; vazio legível. | "∞" visto = sem limite exibido; limite por plano **fora** (EXC-01) |
| GRP-NAV-06 | OBS-M | Botão flutuante de ajuda/chat no canto (ver GRP-TRN). | P1 01:14; P9 1:03:29 | — | Suporte externo = DEC-09 |
| GRP-NAV-07 | PROP | Estados de tela distinguíveis: carregando, vazio, erro, desabilitado, sem permissão. | CF §1 estados; P6 §D2 | Zero ≠ vazio ≠ erro ≠ carregando em todas as listas. | — |

### 4.2 MOD CTA — Contas
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-CTA-01 | OBS-M | Criar conta via modal: Nome (obrigatório), opção "conta espião" (toggle), Tipo (select; valor visto: WhatsApp). | P1 01:36; CF 2 | Nome vazio bloqueia; conta criada aparece na lista e no contador (visto 5→6, P1 03:32). | Semântica de "conta espião" **não explicada** → DEC-02 |
| GRP-CTA-02 | OBS-M | Lista de contas com avatar, indicador de status (online), acesso a configurações e detalhe. | P1 01:14 | Status exibido vem de estado real; sem integração = "não conectada/bloqueada", nunca "online" falso. | Status real depende de provedor (NT) |
| GRP-CTA-03 | DIR+PROP | Criar/editar conta **não** cria sessão, credencial nem conexão implicitamente; conexão é etapa separada e bloqueada até contrato (DIR-06). | CK16 F01; DIR-06 | Teste: criar conta não gera sessão/ID externo. | Fluxo QR/ES real: NT/bloqueado |
| GRP-CTA-04 | OBS-M | Conta pode estar associada a campanhas e agrupada em projeto; "contas ociosas" = sem campanha ativa (texto da UI). | P6 40:16, 42:08 | Contagem de ociosas coerente com associações. | Fórmula = FALA/DEC-14 |
| GRP-CTA-05 | OBS-M | Alerta "Desconectadas nas últimas 24h" no painel de métricas. | P6 42:08 | Lista vazia legível; só eventos reais de desconexão. | Depende de provedor (NT) |
| GRP-CTA-06 | FALA (cap.) | Conectar número via fluxo do provedor (capítulo "como conectar seu número"). | CAP 01:20 | — | **Bloqueado** (DIR-06); vídeo não é contrato |

### 4.3 MOD CMP — Campanhas (criação, tipos, lista global)
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-CMP-01 | OBS-M | Criar campanha via modal: Nome (obrigatório, validação bloqueia vazio) + Tipo (select). | P1 03:32; CF 3 | Envio vazio bloqueado com mensagem; campanha aparece na lista. | — |
| GRP-CMP-02 | OBS-M | Tipo com **4 opções** vistas: "Campanha", "Lista", "Campanha viral", "Aleatório". | P1 04:05; CF 3 | As opções implementadas mapeiam para estratégias definidas. | "Campanha viral" **sem semântica** → DEC-03; não definir regra |
| GRP-CMP-03 | FALA | Semânticas faladas: "Campanha" enche grupos em sequência sem repor anteriores; "Lista" repõe o grupo de menor ocupação; "Aleatório" distribui tráfego entre grupos. | P1 §C | Cada estratégia documentada e testada com dados sintéticos (INF: 3 distribuições já existentes). | Algoritmo real não provado; fala não é contrato |
| GRP-CMP-04 | OBS-M | Lista global de campanhas: período "últimos N dias" (7/14/21/28/90), totais Clicks, Entraram, Percentual de entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | P5 38:45/39:45; CF 20 | [PROP] Totais = soma das campanhas no filtro/período; zero legível. | Regra de agregação e fórmulas = DEC-14 |
| GRP-CMP-05 | OBS-M | Abas Campanhas / Ativas / Arquivadas; ordenação (ex.: data de atualização); busca; grade de cards com 4 métricas; seleção múltipla e "Arquivar"; paginação; acesso "Contas e Campanhas" e "+ Campanha". | P5 38:45 | [PROP] Arquivar move para Arquivadas sem apagar dados; paginação correta. | Efeito de arquivar não demonstrado; desarquivar/excluir não amostrado (LAC) |
| GRP-CMP-06 | OBS-M | Card de campanha mostra métricas resumidas, nome truncável e status. | P1 01:14; P5 38:45 | — | Quais 4 métricas exatas = DEC-14 |
| GRP-CMP-07 | OBS-M | Detalhe da campanha com **12 abas**: Visão geral, Contas associadas, Diagnósticos, Grupos, Solicitações de entrada, Atividades, Leadscoring, Mensagens, Mensagens recebidas, Calendário, Automações, Ações. | P1 07:05; CF 4 | Cada aba existente ou marcada pendente na matriz. | Diagnósticos, Mensagens, Mensagens recebidas, Calendário **sem conteúdo amostrado** (GRP-ZZZ) |
| GRP-CMP-08 | RV | Vínculo da campanha a projeto (dropdown) e edição de campanha. | DL (Projetos); P5 §B | — | Não confirmado na amostragem |

### 4.4 MOD ASC — Contas associadas da campanha
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-ASC-01 | OBS-M | Associar/desassociar contas à campanha por lista com checkbox e contador "N/M contas". | P1 07:05; CF 5 | Contador = associações persistidas. | — |
| GRP-ASC-02 | OBS-M | Configurações da associação com opções "especificar contas criadoras de grupos" e "especificar range de operação das contas" (Fechar/Salvar). | P1 07:05 | Opções persistem. | Papéis por conta e conteúdo do "range" **não confirmados** → DEC-04 |
| GRP-ASC-03 | OBS-M | Contas não associadas aparecem com alerta "conta não associada à campanha" e sem checkbox nos assistentes de ação. | P4 30:03; CF 16 | [PROP] Backend recusa operação por conta não associada (não só UI). | Validação servidor = PROP (CK16 F02) |
| GRP-ASC-04 | OBS-M | "Campanhas expostas" = campanhas ativas sem cobertura adequada de contas (texto da UI). | P6 42:08 | Indicador coerente com associações. | "Adequada" = DEC-14 |

### 4.5 MOD GRU — Grupos da campanha (lista, toolbar, filtros, linha)
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-GRU-01 | OBS-M | Toolbar: Criar grupos, Alterar grupos, Importar grupos, Atualizar links, Exportar grupos, Exportar leads, Atualizar leads, Participantes duplicados, Grupos duplicados. Vistos cinza sem grupos e amarelos com grupos. | P1 07:55; P3 21:08; CF 6 | [PROP] Ações que dependem de grupos ficam desabilitadas sem grupos e habilitadas com ≥1. | Desabilitação real inferida pela aparência (P1 §D); efeitos de atualizar links/leads = NT |
| GRP-GRU-02 | OBS-M | Filtros segmentados: Todos, Cheios, Não cheios, Suspenso; busca; vazio "nenhum registro". | P1 07:55; P4 26:40 | Filtros coerentes com contagens e busca. | Origem do estado "suspenso" = provedor (NT) |
| GRP-GRU-03 | OBS-M | Linha do grupo: número sequencial + nome, **Redirect x/limite**, **Cliques reais**, **Participantes**, copiar link, data, tipo ("Grupo normal"), select **Cheio Sim/Não** manual, ícone de dados, menu ⋮. | P3 21:08; P4 26:40; CF 12 | Três métricas separadas; nenhuma deriva da outra sem regra. | Significado exato de "Redirect" vs "Cliques reais" = DEC-05 |
| GRP-GRU-04 | OBS-M+PROP | Select "Cheio" Sim/Não manual visto na linha, ao lado das métricas Redirect/Cliques reais/Participantes. [PROP] "Cheio" manual separado da lotação calculada; marcar manualmente não altera contagens (critério proposto P4 §D1). | P4 26:40, §D1 | [PROP] Teste: marcar cheio não muda participantes/cliques. | Separação e precedência manual × automática não demonstradas = DEC-06 |
| GRP-GRU-05 | OBS-M | Seleção "Selecionar tudo (n/N)" e ações em massa: Marcar como cheio, Marcar como não cheio, Excluir. | P3 21:08; P4 26:40 | Massa afeta só selecionados; exclusão pede confirmação (PROP). | — |
| GRP-GRU-06 | OBS-M | Menu ⋮: Detalhes, Marcar como cheio, Reprocessar cliques, Atualizar link de convite, Redefinir link de convite, Editar, Remover. | P3 24:05 | Cada item gera estado/ação rastreável; destrutivos confirmam. | Efeito em provedor NT |
| GRP-GRU-07 | OBS-E | Item "Alterar nome do grupo" visível na fila (P3 24:28), após edição de nome. [PROP] edição de nome gera ação própria na fila. | P3 24:28 | [PROP] Edição cria ação com estado próprio; não marca sucesso externo sem provedor. | Causalidade e persistência não provadas pela UI |
| GRP-GRU-08 | RV/FALA (cap.) | Edição em massa de grupos (nome, descrição, admins) e exportação de dados (CSV citado). | CAP 27:05, 38:46; P4 §C | — | Modal de lote **não amostrado** (LAC-03) |
| GRP-GRU-09 | FALA (cap.) | Análise de grupos duplicados e participantes duplicados. | CAP 28:59; P3 §C | Botões existem (GRU-01). | Resultado/estado vazio não amostrado |
| GRP-GRU-10 | INF | Reservas internas idempotentes ("sempre disponíveis") e distribuição local existentes (relato). | IE; CK16 | Regressão: reservas continuam idempotentes. | Código não auditado |

### 4.6 MOD CRG — Configuração de criação de grupos (template) e administradores
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-CRG-01 | OBS-M | Modal com abas **Informações** / **Administradores**; trocar de aba não perde valores. | P1 09:10; P2 14:06, §E1 | Teste de preservação entre abas. | — |
| GRP-CRG-02 | OBS-M | Foto do grupo com editar/excluir. | P1 09:10 | Foto persiste; troca afeta só novos grupos. | Upload a provedor NT |
| GRP-CRG-03 | OBS-C | Nome dos grupos (obrigatório) com contador de caracteres (visto 18/95). | P1 09:10; P2 10:34 | Contador e bloqueio acima do limite. | Limite do Grupos = DEC-12 |
| GRP-CRG-04 | OBS-C | Descrição fixa (obrigatória) com contador (visto 0/2048 e 23/2048). | P1 08:26; P2 10:34 | Idem. | DEC-12 |
| GRP-CRG-05 | OBS-C | Início da contagem (obrigatório; visto 1, 30, 25 — editável) e toggle "número de contagem no início" (antes/depois do nome). | P1 08:26–10:25; P2 10:34 | Numeração de novos grupos segue início e posição configurados. | Renumeração de existentes ≠ (CRG-12) |
| GRP-CRG-06 | OBS-C | "Quantidade de grupos sempre disponíveis" (reserva; visto 3) e "Limite de pessoas" (visto 350). | P1 08:26 | Campos obrigatórios persistem. | Valores não são defaults; manutenção de reserva = FALA (P2 §C) |
| GRP-CRG-07 | OBS-M | Toggles: Apenas admins podem enviar; Exigir aprovação de admin; Recusar automaticamente números bloqueados (antispam, antispam global e blacklist); Desativar criação de grupos; Criar comunidades em vez de grupos; Mensagens temporárias (select). | P1 08:26–09:55; P2 10:34–13:44 | Cada toggle persiste e tem estado visual claro. | Efeitos NT |
| GRP-CRG-08 | OBS-M | Modo de criação segmentado **NORMAL / SEGURO**. | P1 08:26; P2 12:14 | Persistência. | "Seguro adia nome e foto" = FALA (P2 §C) → DEC-07 |
| GRP-CRG-09 | OBS-M | Toggle "criar grupo aberto e fechar depois de 24h". | P1 08:26 | Persistência; agendamento de fechamento só como ação local. | Efeito NT; FALA |
| GRP-CRG-10 | OBS-M | Aviso: alterações **não** se aplicam a grupos existentes, só a novos. | P1 08:26; P2 12:14/13:44 | Teste: salvar config não altera grupos existentes. | — |
| GRP-CRG-11 | OBS-M | Aba Administradores: "+ Novo administrador"; seções "administradores de contas associadas" e "administradores de contas de criação associadas". | P2 14:06; CF 8 | Admins persistem ligados à config. | Campos DDI/número **não confirmados** |
| GRP-CRG-12 | OBS-M+PROP | Visto: botão Salvar do modal e, na aba Ações, itens "Campanha: Criar Grupo". [PROP] Salvar dá feedback real só após persistência, sem toast falso; salvar configuração **não** é criação concluída; criação gera ação na fila. | P2 14:06/14:22, §E2–3 | [PROP] Falha de persistência mostra erro; ação de criar aparece na fila. | Toast de sucesso **não confirmado**; vínculo salvar→ação não demonstrado |

### 4.7 MOD IMP — Importação de grupos existentes
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-IMP-01 | OBS-M | Assistente com etapas **Onde → Conta → Grupos → Confirmar**; avançar bloqueado sem seleção. | P3 22:32; CF 13 | Stepper preserva escolhas ao voltar. | Etapa Confirmar não amostrada |
| GRP-IMP-02 | OBS-M | Etapa Grupos: aviso de que a conta precisa ser administradora; Atualizar; contador "N selecionado(s)"; busca; ordenação; tabela Foto/Nome. | P3 22:32 | Contador exato. | Verificação real de admin = NT |
| GRP-IMP-03 | OBS-M | Grupos já associados à campanha aparecem marcados e desabilitados na seleção. [PROP] impedir dupla importação. | P3 22:32 | [PROP] Idempotência: reimportar não duplica. | Idempotência backend não provada |
| GRP-IMP-04 | OBS-E | Item "Importar grupos" (com duração) visível na fila após a importação. [PROP] importação gera ação própria. | P3 23:40 | [PROP] Ação com estado próprio. | Persistência/estado final não legíveis |
| GRP-IMP-05 | OBS-M+FALA | Grupo importado preserva o nome original (visto) e recebe número/participantes exibidos. | P3 24:05; P4 24:33 | Sem "padronizar", não renomeia nem renumera. | Opções "registro de atividades"/"padronizar" **não confirmadas** → DEC-08 |
| GRP-IMP-06 | INF | Importação LOCAL existente (relato). | CK16 F06 | Não afirmar sincronização com provedor. | Não auditado |

### 4.8 MOD FIL — Fila de ações (por campanha e global)
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-FIL-01 | OBS-M | Sub-abas **Visão geral, Na fila, Agendado, Processando, Sucesso, Falhas**. | P2 14:22; CF 9 | [PROP] Cada ação aparece em exatamente um estado corrente. | Transições e máquina de estados não demonstradas (P3 23:40) |
| GRP-FIL-02 | OBS-M | Filtro por intervalo de datas, "Agrupar: Sim/Não", paginação. | P2 14:22 | Filtro e paginação corretos. | — |
| GRP-FIL-03 | OBS-M | Ações em massa: Enviar agora, Reenviar ações travadas, Reprocessar, Cancelar, Excluir (desabilitadas sem seleção). | P2 14:22 | Cada ação de massa respeita estado (ex.: cancelar só não concluídas — PROP). | Semântica de "travada" = DEC-10 |
| GRP-FIL-04 | OBS-E | Item com selo "Agendado para <data hora>" e item com tempos de criação/início/fim e duração, visíveis na UI. | P2 14:22; P3 23:40 | [PROP] Registro de tempos reais da execução local. | Origem/persistência dos tempos desconhecidas; intervalo de ~10 min visto é exemplo |
| GRP-FIL-05 | OBS-M | Botão "+ Adicionar" leva ao assistente de ação manual (MOD ACM). | P3 23:40; P4 30:03 | — | — |
| GRP-FIL-06 | OBS-M | Itens com ícones de contadores e status (verde/vermelho/amarelo). | P3 24:28 | — | Significado exato = DEC-10 |
| GRP-FIL-07 | DIR+PROP | Nenhum estado afirma envio/criação real sem integração; conclusão local ≠ efeito externo; erro identificável e recuperável. | CF §6.3; CK16 F07; DIR-04 | "Sucesso" só quando o efeito do tipo da ação está confirmado; externos = bloqueado. | — |
| GRP-FIL-08 | PROP | Distinguir avaliação/tentativa/conclusão persistida em observabilidade, sem renomear campos legados. | CHECKLIST-OBSERVABILIDADE-JOB-TICK-CONCLUSAO | Contadores batem com o banco. | Ver ENG-06 |

### 4.9 MOD VGC — Visão geral da campanha, link único e gráficos
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-VGC-01 | OBS-M | Período "últimos N dias" (7/14/21/28/90) e 8 KPIs: Clicks, Entraram, Percentual de entrada, Saíram, Participantes, Grupos, Grupos cheios, Grupos disponíveis. | P2 14:46; CF 10 | KPIs = dados persistidos no período; zero exibido como zero. | Fórmulas = DEC-14 |
| GRP-VGC-02 | OBS-M | Card da campanha com acesso a Configurações. | P2 14:46 | — | — |
| GRP-VGC-03 | OBS-M | Card **Link de convite** (link único) com Editar e Copiar. | P2 14:46 | Copiar copia o link; editar não quebra redirecionamento existente (PROP). | Formato/domínio do link = DEC-11 |
| GRP-VGC-04 | OBS-M | Gráficos diários "Clicks" e "Entraram" com atualizar, períodos 7/14/21/28, seletor de datas e tela cheia. | P2 14:46/15:50 | Séries por dia batem com eventos registrados. | — |
| GRP-VGC-05 | FALA+PROP | Lotação/distribuição usa entradas/participantes, não cliques. | P2 §C, §E5 | Teste: cliques sem entrada não ocupam vaga. | FALA; política local documentada (CK16 F04) |
| GRP-VGC-06 | OBS-M | Menu lateral de recursos da campanha (ver MOD REC), com "Métricas" como item inicial. | P2 14:46; P3 §A | — | — |

### 4.10 MOD REC — Recursos da campanha (menu lateral da visão geral)
Padrão comum observado: painel com título, subtítulo, toggle, explicação em lista e bloco "caso de uso" (P3 17:07/17:36). **Textos explicativos da referência não devem ser copiados.**
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-REC-01 | OBS-M | **Gerenciamento de tags** (item de menu). | P2 14:46 | Tela existe ou pendente. | Conteúdo **não amostrado** (LAC-04) |
| GRP-REC-02 | OBS-M | **Valores das variáveis**: tabela Nome / Tipo / Valor na campanha, copiar por linha, busca, paginação, "abrir painel de variáveis", Salvar. Tipos vistos: Data, Texto, Número; escopo GLOBAL visto. | P2 16:45; P3 16:52 | Valor por campanha persiste; variável usável no editor (ENT-14). | Painel global "Variáveis da campanha" não amostrado |
| GRP-REC-03 | OBS-M | **Cookie de redirecionamento** (toggle). | P3 17:07/17:36 | Toggle persiste. | "Mantém lead no mesmo grupo" = FALA; Safari/Apple não afirmar |
| GRP-REC-04 | OBS-M | **Anti-hacker** (item de menu). | P2 14:46; CAP 52:45 | — | Conteúdo não amostrado; eficácia FALA |
| GRP-REC-05 | OBS-M | **Verificação de colaboradores** (item). | P2 14:46 | — | Conteúdo não amostrado; semântica DEC |
| GRP-REC-06 | OBS-M | Item de integração "grupo VIP" ligado a plataforma de terceiros (rótulo cita Hotmart). | P2 14:46 | — | Não amostrado; integração NT |
| GRP-REC-07 | OBS-M | **Gestão de comunidades** (item). | P2 14:46 | — | Não amostrado |
| GRP-REC-08 | OBS-M | **Atualização de links**, **Atualização periódica de links**, **Redefinir link de convite**. | P2 14:46; P3 20:34 | — | Efeito NT; FALA "link atualizado quando número é banido" (CAP 22:35) |
| GRP-REC-09 | OBS-M | **Remover lead de campanhas anteriores**: toggle, select "campanhas anteriores", Salvar. | P3 19:36/20:34 | Seleção persiste. | Multisseleção não vista; efeito NT |
| GRP-REC-10 | OBS-M | **Deep linking** (toggle); texto indica que libera pixel (Meta), desafio para bots e tradução automática. | P3 18:10 | Toggle persiste. | Telas de pixel/desafio/tradução **não amostradas** (LAC-05); pixel TikTok só em CAP 20:32 |
| GRP-REC-11 | OBS-M | **Checar participantes duplicados** (item). | P2 15:50 | — | Resultado não amostrado |
| GRP-REC-12 | OBS-M | **Métricas** (item ativo inicial). | P2 14:46 | — | = VGC |

### 4.11 MOD MSG — Editor de mensagem em blocos e opções de envio
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-MSG-01 | OBS-M | Layout em 3 colunas: preview (fundo de conversa) com blocos; editor; opções de envio. | P4 27:33; P5 32:20 | — | Visual final = DIR-02 |
| GRP-MSG-02 | OBS-M | Paleta de ~9 tipos de bloco: enquete, contato, evento, link, áudio, imagem, vídeo, arquivo, figurinha. | P4 27:33; CAP 32:12 | Cada tipo suportado tem validação própria. | Ícones inferidos pela forma; envio real NT |
| GRP-MSG-03 | OBS-M | Barra de formatação (negrito, itálico, tachado, código, citação), botão IA, campo de texto, Emoji, Modelos, Variáveis, "+ adicionar preview", Salvar (desabilitado sem conteúdo). | P4 27:33 | Salvar só com conteúdo válido. | Botão IA depende de provedor (NT) |
| GRP-MSG-04 | OBS-M | Blocos como cards com alça de arrastar, subir/descer, editar e excluir; múltiplos blocos (ex.: imagem com legenda + texto). | P4 30:38/31:57; P5 33:13 | Ordem e conteúdo preservados após editar/reordenar/excluir. | Reordenação inferida pelos controles |
| GRP-MSG-05 | OBS-C | Spintax no texto (ex.: `{a\|b\|c}`). | P4 31:57; P5 32:20 | Variação gerada só a partir das opções; spintax inválido não quebra a etapa. | Sem garantia anti-spam (FALA) |
| GRP-MSG-06 | OBS-M | Opções: Marcar todos (NÃO/SIM); Mensagens temporárias (NÃO/24H/7D/90D); Fixar mensagem (NÃO/24H/7D/30D); Velocidade (NÃO/RÁPIDA/NORMAL/LENTA/CUSTOM). | P4 27:33 | Persistem por ação. | Efeitos NT |
| GRP-MSG-07 | OBS-C | Envio em pacotes (itens por pacote, intervalo entre pacotes); período de envio (faixa 0H–24H); dias e horários (TODOS/SEG–DOM); **fuso horário explícito**. | P4 31:57; P5 32:20 | Configuração salva com fuso; envio fora da janela aguarda (FALA) só como regra local definida. | Valores do exemplo; continuação no dia seguinte = FALA (CAP 34:34) |
| GRP-MSG-08 | OBS-M | Itens de sidebar "Modelos de mensagem" e botão "Modelos" no editor. | P6 41:03; P4 27:33 | — | Tela de modelos não amostrada. INF: "modelos versionados" existem |
| GRP-MSG-09 | INF+PROP | Persistência de rascunhos/versões/blocos preserva vínculos campanha/tenant/versão. | CHECKLIST-MIGRACAO-VINCULOS-MENSAGENS-QUATRO-TABELAS | Integridade provada por testes negativos. | Ver ENG-04 |

### 4.12 MOD ACM — Ação manual, ações administrativas e agendamento
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-ACM-01 | OBS-M | Assistente **Categoria → Campanha → Ação → Contas → Grupos → Conteúdo → Confirmar**. | P4 30:03; CF 16 | Avanço bloqueado sem escolha; estado preservado. | — |
| GRP-ACM-02 | OBS-M | Etapa Campanha com **seleção múltipla** de campanhas, busca e contador "n/N filtrado". | P5 34:10 | Contador correto; não altera campanhas não selecionadas. | — |
| GRP-ACM-03 | OBS-M | Etapa Contas: "todas as contas da campanha" / "contas específicas"; não associadas bloqueadas. | P4 30:03 | Backend recusa conta não associada. | — |
| GRP-ACM-04 | OBS-M | Ação "Trocar configuração": apenas admins / todos enviam; apenas admins / todos mudam configurações; exigir / permitir entrada sem aprovação. | P5 34:45; CF 18 | Escolha obrigatória. | Efeito NT |
| GRP-ACM-05 | OBS-M | Ação "Privacidade avançada na conversa": Sim (ativar) / Não. | P5 35:45 | — | Efeito NT |
| GRP-ACM-06 | FALA (cap.) | Ações em massa de nome, descrição e admins. | CAP 38:46 | — | Telas não amostradas |
| GRP-ACM-07 | OBS-M | Confirmar: resumo (categoria, campanhas, contas, grupos, preview com contador de mensagens); campo **Agendar** com seletor data/hora e OK. | P5 33:40; CF 17 | Resumo = escolhas feitas. | Data do exemplo não é default |
| GRP-ACM-08 | OBS-M | Dois botões: "Agendar envio para <data/hora>" e "Agendar e programar outra ação". [PROP] o segundo mantém o contexto (campanha, contas, grupos). | P5 33:40 | [PROP] Cada confirmação cria **uma** ação; sem duplicatas por duplo clique/reenvio. | Manutenção de contexto inferida do rótulo; segunda ação na lista não amostrada |
| GRP-ACM-09 | DIR | Envio real bloqueado até integração autorizada. | DIR-04/06 | Ação agendada fica "agendada/bloqueada", nunca "enviada". | — |

### 4.13 MOD AUT — Automações e cronograma
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-AUT-01 | OBS-M | Assistente **Campanha → Grupo → Gatilho → Conta → Ação → [Agendar] → Conteúdo → Confirmar**. | P4 27:08/27:33; P5 36:40; CF 14 | Etapas validadas; "Agendar" presente para recorrência. | Etapa Gatilho **não amostrada** |
| GRP-AUT-02 | OBS-M | Etapa Grupo: "todos os grupos da campanha" / "grupos específicos". | P4 27:08 | — | — |
| GRP-AUT-03 | OBS-M | Gatilho visto na lista: "ao encher grupo da campanha" (capítulo: boas-vindas quando o grupo enche). | P4 29:27; CAP 30:26 | [PROP] Gatilho dispara com base em estado local definido de "cheio", uma vez por ocorrência conforme contrato. | Disparo único e relação com Cheio manual não demonstrados = DEC-06 |
| GRP-AUT-04 | OBS-M | Lista: toggle Ativado, contadores (incl. "Fila"), status, editar, ⋮; filtros Ativado/Desativado/Todos; "+ Adicionar", "Importar JSON"; massa Desativar/Ativar/Duplicar/Excluir. | P4 29:27 | Duplicar cria cópia independente; desativar não perde config. | Formato do JSON = DEC (não inventar) |
| GRP-AUT-05 | OBS-C | Cronograma: periodicidade 7 DIAS / 14 DIAS / 28 DIAS / MENSAL; dia da semana (TODOS, SEG–DOM); hora e minuto; iniciar/parar em (datas); fuso; **próxima execução estimada** exibida com fuso. | P5 36:40/37:50; CF 19 | Próxima execução coerente com fuso/regra. | "Dias do mês"/iniciar-pausar não vistos; fim de mês 29–31 e horário inexistente/ambíguo = DEC-15 |
| GRP-AUT-06 | OBS-M | Automações sob webhook (evento → ação) — ver MOD WHE. | P8 56:02 | — | — |
| GRP-AUT-07 | INF+PROP | **Estado histórico informado à época** do checklist de recorrência: mensal com políticas explícitas de horário inexistente/ambíguo; diária/semanal convertendo horário local diretamente, sem política selecionada. Estado vigente deve ser **reconfirmado por revisão** do responsável; este prompt não manda reverter nada hoje. | CHECKLIST-RECORRENCIA-DIARIA-SEMANAL-HORARIO-LOCAL | [PROP] Não mudar semântica de registros legados sem decisão. | Snapshot, não estado atual; ENG-05 |

### 4.14 MOD PRJ — Projetos
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-PRJ-01 | OBS-M | Projeto (pasta) com Editar e Excluir (destrutivo destacado). | P6 40:16; CF 21 | Exclusão confirma e define destino dos itens (DEC-16). | Efeito de excluir não visto |
| GRP-PRJ-02 | OBS-M | Período e 8 KPIs do projeto (mesmos rótulos dos da campanha). | P6 40:16 | [PROP] Totais somam só campanhas do projeto. | Agregação não demonstrada; DEC-14 |
| GRP-PRJ-03 | OBS-M | Colunas Contas / Campanhas / Webhooks do projeto, com contador, vazio legível. | P6 40:16 | — | — |
| GRP-PRJ-04 | FALA+PROP | Projetos separam campanhas por cliente. | P6 §C; CAP 43:05 | Testes negativos: dados de um projeto não aparecem em outro filtro. | Isolamento/permissão **não provado** |

### 4.15 MOD MET — Métricas globais e alertas
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-MET-01 | OBS-M | Atalhos em chips (Campanhas, Contas, Automações, Webhooks, Contas × Campanhas). | P6 42:08 | — | São atalhos, não abas |
| GRP-MET-02 | OBS-M | Card "Alertas" recolhível com vazio legível. | P6 42:08 | — | Regras de alerta = DEC |
| GRP-MET-03 | OBS-M | "O que precisa de atenção": N campanhas expostas; N contas ociosas. | P6 42:08 | Contagens coerentes. | Fórmula FALA/DEC-14 |
| GRP-MET-04 | OBS-M | "Operação do dia": Cliques hoje, Entradas hoje, média 7d, variação % vs média. | P6 42:08/42:24 | Variação calculada sobre dados reais; sem dados = vazio. | Fórmula exata DEC-14 |
| GRP-MET-05 | OBS-M | Listas "campanhas ativas sem cliques hoje" e "desconectadas nas últimas 24h". | P6 42:08 | — | — |
| GRP-MET-06 | FALA (cap.) | Funil e análises gráficas globais. | CAP 44:51 | — | **Não amostrados** (LAC-06) |

### 4.16 MOD LSC — Leadscoring
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-LSC-01 | OBS-C | Chips de status por tipo de evento com pontos **mostrados** (vistos: Recebeu 10, Visualizou 20, Reproduziu 40, Reagiu 50, Mensagem 60). | P6 43:55; CF 24 | [PROP] Tipos/pontos seguem a decisão DEC-17. | Se tipos/pontos são configuráveis ou fixos **não foi demonstrado** = DEC-17; valores = exemplo; cálculo NT |
| GRP-LSC-02 | OBS-M | Gráfico "volume por hora — últimos 7 dias" com POR HORA/POR DIA, barras empilhadas por tipo. | P6 43:55 | — | Eventos dependem de provedor |
| GRP-LSC-03 | OBS-M | Tabela #, Número (mascarado), Pontos, ⋮; paginação; busca; Exportar. | P6 43:55 | Número mascarado; exportação com permissão (PROP). | — |

### 4.17 MOD ATV — Atividades
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-ATV-01 | OBS-M | Aba "Atividades" existe na campanha. | P1 07:05; P6 43:55 | — | Conteúdo **não amostrado**; tabela número/grupo/evento/data e exportar = RV (LAC-07) |

### 4.18 MOD SOL — Solicitações de entrada
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-SOL-01 | OBS-M | Sub-abas Pendentes / Processadas / Configurações; selo "N pendente(s)". | P6 44:06/45:01; CF 25 | Contagem coerente. | — |
| GRP-SOL-02 | OBS-M | Busca por número completo; aprovar/recusar selecionadas (desabilitados sem seleção). | P6 44:06 | Ação só sobre selecionadas; registro em Processadas. | Efeito NT |
| GRP-SOL-03 | OBS-M | Estados carregando e vazio ("nenhuma solicitação pendente"). | P6 44:06/45:01 | — | — |
| GRP-SOL-04 | FALA+PROP | Sem tag, solicitação fica pendente; sem auto-aprovação implícita. | P6 §C, §D4 | — | Configurações por tag **não amostradas** (LAC-08) |
| GRP-SOL-05 | OBS-M | Recusa automática de bloqueados configurada no template (CRG-07). | P1 09:10 | — | Funcionamento não demonstrado |

### 4.19 MOD ASP — Anti-spam
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-ASP-01 | OBS-M | Abas Números bloqueados / Números administrativos / Contas associadas. | P6 46:10/47:45; CF 26 | — | Aba Contas associadas não amostrada |
| GRP-ASP-02 | OBS-M | Bloqueados: Analisar grupos, Exportar, Adicionar, Adicionar CSV, Adicionar CSV (admin), Excluir; busca com aviso de filtro por data/página; intervalo de datas; ordenação; tabela Nome/Número/Criação/Atualização/⋮. | P6 46:10 | Import CSV valida linhas; números mascarados. | "Analisar grupos" efeito NT |
| GRP-ASP-03 | OBS-M | Administrativos: lista separada com Adicionar, Adicionar CSV, busca, ordenação alfabética, Nome/Número. | P6 47:45 | Número não pode estar nas duas listas sem conflito resolvido (PROP). | Precedência = DEC-18 |
| GRP-ASP-04 | FALA (cap.) | Anti-spam global (compartilhado) e anti-hacker. | CAP 49:21, 52:45 | — | Compartilhamento global **não provado**; não definir |

### 4.20 MOD BLK — Blacklists
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-BLK-01 | OBS-M | Lista de blacklists; detalhe com nome, editar, ⋮ e abas Campanhas / Números. | P7 48:40/49:30; CF 27 | — | Aba Números não amostrada |
| GRP-BLK-02 | OBS-M | Aba Campanhas com lista de campanhas com checkbox (uma selecionada). [PROP] aplicação da lista por campanha selecionada. | P7 48:40 | [PROP] Não vaza para campanhas não marcadas. | Efeito da seleção não demonstrado |

### 4.21 MOD IAG — Agente de IA (rótulo da referência: "SendIA")
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-IAG-01 | OBS-M | Lista de agentes e "+ Adicionar". | P7 50:31 | — | — |
| GRP-IAG-02 | OBS-M | Assistente **Escolher IA → Treinamento → Configurar**. | P7 51:21; CF 28 | Estado preservado entre etapas. | — |
| GRP-IAG-03 | OBS-C | Escolher IA: plataforma (2 opções vistas), tipo (texto simples / texto com tópico / assistente), modelo, **campo de credencial**, intervalo entre respostas (faixa em segundos). | P7 51:21 | Credencial mascarada, nunca reexibida/logada/exportada (PROP). | Na referência o campo aparece **sem máscara** — não reproduzir; provedor NT |
| GRP-IAG-04 | OBS-M | Treinamento: contadores texto/total/limite; "instruções de comportamento" com contador e resetar; "texto do treinamento". | P7 51:46 | Limites respeitados. | Valores exemplo; conteúdo não transcrito |
| GRP-IAG-05 | OBS-M | Regras "se o texto de resposta da IA contiver [texto] → então [multiselect]": remover pessoa do grupo, apagar mensagem da pessoa, marcar administradores, não responder mais. | P7 51:46/52:34 | [PROP] Validação de vazio/duplicata; prévia da ação. | [PROP] política própria e revisão humana para ações consequenciais = proposta pendente DEC-19 (não observada); NT |
| GRP-IAG-06 | OBS-M | Configurar: nome; campanhas com checkbox e status; Sim/Não "responder sem '?'", "primeira resposta do bot sem IA", "responder administradores"; tipo Privado / Campanhas. | P7 53:42 | Escopo respeitado. | Campanhas sem checkbox = inferência |
| GRP-IAG-07 | OBS-M | Detalhe do agente: abas Visão geral / Threads / Ações; card com tipo, editar, ⋮; toggle de ativação. | P8 54:41 | Estado ativo inequívoco. | Rótulo ambíguo na referência — não inferir |

### 4.22 MOD WHE — Webhooks de entrada (integrações)
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-WHE-01 | OBS-M | Lista com abas Integrações / Arquivadas, ordenação, "+ Webhook", cards. | P8 55:08; CF 29 | — | — |
| GRP-WHE-02 | OBS-M | Criação com escolha de plataforma (~20 vistas, ex.: plataformas de cursos/pagamento, API genérica, CRM/e-mail, e-commerce; algumas BETA). | P8 55:08 | — | Campos Nome/Projeto **não legíveis**; cada plataforma exige contrato próprio (bloqueado) |
| GRP-WHE-03 | OBS-M | Detalhe: Visão geral / Contas associadas / Automações / Eventos; automação "quando <evento>" com Ativado e contadores. | P8 56:02 | — | Endpoint/URL **não** visto nem a definir aqui |
| GRP-WHE-04 | OBS-M | Assistente **Categoria → webhook → Configurações → Gatilho → Conta → Ação → Confirmar**. | P8 56:09 | — | Campo de produto não amostrado |
| GRP-WHE-05 | OBS-M | Eventos vistos (checkbox): compra aprovada, abandono de carrinho, impressão de boleto, pedido de reembolso, compra cancelada, compra estornada, compra completada, pagamento atrasado, compra expirada (lista continua). | P8 56:09 | — | Mapeamento por plataforma = contrato externo |
| GRP-WHE-06 | OBS-M | Ações vistas: enviar mensagem, enviar SMS, fazer ligação, requisição HTTP, tag condicional, remover/adicionar à campanha, remover lead, adicionar tag (lista continua). | P8 56:14 | — | SMS/ligação/HTTP = NT; bloqueados |

### 4.23 MOD WHS — Webhooks de saída (rótulo da referência: "Sendhooks")
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-WHS-01 | OBS-M | Abas lista / Histórico; "+ Adicionar"; cards "envia eventos de <evento>" com info e excluir. | P8 57:32; CF 30 | — | Horários de envio de métricas = texto de UI, não regra |
| GRP-WHS-02 | OBS-M | Estado de erro visível (limite de erros, código HTTP) com "Marcar como resolvido". | P8 57:32 | [PROP] Erro permanece visível até marcado como resolvido; contador coerente. | Persistência do erro não demonstrada |
| GRP-WHS-03 | OBS-M | Criar: Nome, Link de destino, credencial gerada (mascarada), busca de eventos com contador; grupos de eventos CAMPANHA (métricas da campanha, métricas de mensagens, solicitações de entrada), GRUPOS (membro adicionado, membro removido, grupo suspenso, bloqueio de crescimento), CONTAS (conta banida, restrição temporária). | P8 59:01 | Lista de eventos declarada; sem eventos ocultos. | Credencial vista em claro — **não reproduzir** |
| GRP-WHS-04 | OBS-C | "Limite de erros até desativar" (stepper). | P8 59:01 | Desativação explícita e visível. | Valor exemplo |
| GRP-WHS-05 | DIR | Nenhum envio a destino externo sem autorização. | DIR-04 | — | NT |

### 4.24 MOD BRD — Broadcast(s) e Leads
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-BRD-01 | OBS-M | Broadcasts: vazio + "Cadastrar"; grade de cards com nome, status e alerta "nenhuma conta associada". | P8 1:01:01; P9 1:02:07; CF 31 | Alerta de dependência visível. | Detalhe/busca não amostrados |
| GRP-BRD-02 | OBS-M | Itens distintos "Broadcast", "Leads" e "Broadcasts" na sidebar. | P6 41:03; P8 1:01:01 | — | Diferença semântica = DEC-20 |
| GRP-BRD-03 | FALA (cap.) | Mensagens um a um, SMS e ligação. | CAP 64:52 | — | NT; bloqueado |

### 4.25 MOD TRN — Treinamentos e suporte
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-TRN-01 | OBS-M | Grade de cursos com selo de conclusão. | P9 1:02:50; CF 32 | — | **Escopo = DEC-09**; não inventar player/checkout |
| GRP-TRN-02 | OBS-M | Curso: voltar, barra de progresso, busca de aula, "continuar de onde parei", módulos recolhíveis com aulas numeradas e concluídas. | P9 1:02:55/1:03:17 | Progresso coerente com aulas concluídas. | Player **não confirmado** (RV) |
| GRP-TRN-03 | OBS-M | Widget de ajuda: saudação, status de atendimento, iniciar conversa, artigos populares, artigo passo a passo. | P9 1:03:29/1:03:40/1:03:52 | Não bloqueia a página; indisponibilidade visível. | Suporte externo = DEC-09 |

### 4.26 MOD ZZZ — Áreas vistas apenas como rótulo (sem conteúdo amostrado)
Ausência de amostragem ≠ inexistência. **Não inventar funções**; cada item exige definição do coordenador antes de qualquer trabalho.
| ID | Rótulo observado | Fonte | Situação |
|---|---|---|---|
| GRP-ZZZ-01 | Aba Diagnósticos (campanha) | P1 07:05 | conteúdo desconhecido |
| GRP-ZZZ-02 | Aba Mensagens (campanha) | P1 07:05 | provável lista de mensagens/ações — não presumir |
| GRP-ZZZ-03 | Aba Mensagens recebidas | P1 07:05 | depende de provedor (NT) |
| GRP-ZZZ-04 | Aba Calendário | P1 07:05 | provável visão de agendamentos — não presumir |
| GRP-ZZZ-05 | Variáveis da campanha (global) | P6 41:03; P2 16:45 ("abrir painel") | parcial |
| GRP-ZZZ-06 | Deep link (global) | P6 41:03 | só toggle por campanha visto |
| GRP-ZZZ-07 | Alertas (global) | P6 41:03 | só card no painel |
| GRP-ZZZ-08 | Modelos de mensagem | P6 41:03 | INF: modelos versionados |
| GRP-ZZZ-09 | Leads (global) | P6 41:03 | — |
| GRP-ZZZ-10 | "SendSpace" | P6 41:03 | nome proprietário; semântica desconhecida |
| GRP-ZZZ-11 | "SendAPI" | P6 41:03 | API pública do produto **não** definida aqui |
| GRP-ZZZ-12 | "MCP" (BETA) | P6 41:03 | não definir |
| GRP-ZZZ-13 | Histórico | P6 41:03 | — |
| GRP-ZZZ-14 | Equipe | P7 48:21 | permissões/papéis **não demonstrados**; não inventar admin |
| GRP-ZZZ-15 | Mapa Contas × Campanhas / "Ver dashboard" | P1 01:14 | só cartão visto |

### 4.27 MOD VIS — Linguagem visual (para a etapa final de design, outro responsável — DIR-02/03)
| ID | Classe | Requisito qualitativo | Fonte |
|---|---|---|---|
| GRP-VIS-01 | OBS-M | Tema escuro; cards cinza-escuros com bordas sutis e cantos levemente arredondados; linha de destaque fina no topo. | CF §1; P1 01:14 |
| GRP-VIS-02 | OBS-M | Uma cor de destaque para ação primária, foco, toggle ligado, aba ativa e etapa concluída (referência usa amarelo; **cor própria = DEC-01**); verde = online/sucesso; vermelho = excluir/erro/dependência; laranja = conclusão de curso/série. | CF §1 |
| GRP-VIS-03 | OBS-M | Tipografia sans-serif; botões em caixa alta pequena; rótulos flutuantes. | CF §1 |
| GRP-VIS-04 | OBS-M | Componentes: sidebar de ícones expansível, breadcrumb, abas sublinhadas, sub-abas, grupos segmentados, rádios em cards com ícone, checkbox em listas, toggles, select/multiselect, sliders simples e de faixa, seletor data/hora com OK, stepper 3–8 etapas, cards KPI, gráficos barras/linhas, tabelas paginadas, menus ⋮, modais com fundo escurecido e botão primário largo, selos (BETA, contadores, variação %), avisos inline, widget flutuante. | CF §1; GA |
| GRP-VIS-05 | OBS-M | Estados: foco, desabilitado, validação obrigatória, vazio, carregando, erro de conector com "resolvido", alerta de dependência, selo "agendado para". | CF §1 |
| GRP-VIS-06 | DIR | Alvo 88–96% de fidelidade qualitativa informado; não medido; sem medidas inventadas; sem copiar marca/textos. | DIR-03/08 |

### 4.28 MOD EXC — Conteúdo observado e excluído
| ID | Conteúdo | Fonte | Decisão |
|---|---|---|---|
| GRP-EXC-01 | Página de planos/preços (3 colunas, assinatura via conversa externa, sem checkout) | P9 1:04:00–1:07:30; CF 33 | **Não é requisito**; preços/planos/limites não transcritos; sem checkout |
| GRP-EXC-02 | Logotipos/capas de terceiros, nomes de clientes, saudações personalizadas | P4 30:38; P9 1:02:07/1:02:50; P6 42:08 | Não reproduzir |
| GRP-EXC-03 | Alegações de eficácia anti-ban, "escudo", ROI, taxas | P2 §C/D; P7 §C; P8 §C | Não registrar como requisito |

### 4.29 MOD INT — Integração com provedor de mensageria (Meta / WhatsApp)
| ID | Classe | Requisito | Fonte | Aceitação | Limite |
|---|---|---|---|---|---|
| GRP-INT-01 | DIR | Caminho de integração escolhido: Embedded Signup v5 em modalidade REGULAR (escolha informada de Loigo). | DIR-06; CK16 §estado | Preparação só com cliente desativado e sem Internet, quando ordenada. | **Não** prova Groups/Graph/OBA/capacidade; não vem do vídeo |
| GRP-INT-02 | DIR+PROP | Sessão/vinculação separada da conta, com IDs externos distintos, origem, tenant, replay e readiness explícitos; nunca "conectado" falso. | CK16 F01; CHECKLIST-RETENCAO-REPLAY-ES5; CHECKLIST-TROCA-CODIGO-TOKEN-ES5 | Testes negativos sem rede. | Contrato oficial atual pendente |
| GRP-INT-03 | DIR | Ativação real exige documentação oficial atual, conta, contrato, permissões/elegibilidade e autorização específica futura. | DIR-06; CK16 L71 | Sem isso: estado "bloqueado/não integrado". | Sem conexão/envio/deploy |
| GRP-INT-04 | PROP | Toda função que depende do provedor (criar/editar grupo real, enviar, aprovar entrada, ler participantes, detectar ban/desconexão) mantém estado local honesto até integração. | CF §6.3; DL | Matriz marca NT/bloqueado. | — |
| GRP-INT-05 | INF | **Estado histórico informado à época** do checklist: um gate recusava troca de código de autorização por credencial; mudar isso seria **nova função**, não endurecimento. Estado vigente do gate deve ser **reconfirmado por revisão**; este prompt não manda reverter nada hoje. | CHECKLIST-TROCA-CODIGO-TOKEN-ES5 §1–2 | [PROP] Enquanto o gate antigo vigorar, seus testes negativos permanecem. | Snapshot, não estado atual; decisão contratual pendente |

---

## 5. Fluxos transversais (observáveis; efeitos externos NT)

| ID | Fluxo | Passos observados | IDs envolvidos | Aceitação | Limite |
|---|---|---|---|---|---|
| FLX-01 | Montar campanha | criar conta → criar campanha (nome+tipo) → associar contas → configurar criação de grupos (+admins) → salvar → ação "Criar grupo" na fila | CTA-01, CMP-01/02, ASC-01/02, CRG-*, FIL-01 | Cada etapa persiste; criação aparece na fila como ação distinta da configuração | Criação real NT |
| FLX-02 | Entrada via link único | lead acessa link → registro de clique → distribuição por tipo → entrada (participante) → lotação/cheio → reserva repõe | VGC-03/05, CMP-03, GRU-03/04, CRG-06 | Clique ≠ entrada ≠ participante em todos os contadores | Algoritmo e redirect reais NT; FALA |
| FLX-03 | Importar grupos | Onde → Conta → Grupos (já associados desabilitados) → Confirmar → ação "Importar grupos" → grupos na lista | IMP-*, FIL-04 | Sem duplicação; sem renomear sem opt-in | Leitura real do provedor NT |
| FLX-04 | Ação manual agendada | + Adicionar → Categoria → Campanha(s) → Ação → Contas → Grupos → Conteúdo (blocos) → Confirmar → Agendar / Agendar e programar outra | ACM-*, MSG-*, FIL-* | Uma ação por confirmação; fuso explícito | Envio real bloqueado |
| FLX-05 | Automação por evento interno | Campanha → Grupo → Gatilho (encher grupo) → Conta → Ação → Conteúdo → Confirmar → lista com fila | AUT-01..04, GRU-04 | [PROP] Gatilho dispara uma vez por ocorrência conforme contrato definido | Etapa Gatilho não vista; disparo único não demonstrado |
| FLX-06 | Automação recorrente | … → Agendar (cronograma) → próxima execução estimada | AUT-05/07 | Próxima execução coerente; legado preservado | DEC-15 |
| FLX-07 | Webhook de entrada → ação | integração (plataforma) → contas associadas → automação "quando evento" → ação | WHE-* | Evento declarado → ação local registrada | Plataformas/eventos reais NT |
| FLX-08 | Evento interno → webhook de saída | evento (campanha/grupos/contas) → envio ao destino → erro → limite → desativação → marcar resolvido | WHS-* | Erro visível; desativação explícita | Envio externo bloqueado |
| FLX-09 | Moderação/proteção | solicitações (aprovar/recusar) ← template (exigir aprovação, recusar bloqueados) ← anti-spam (bloqueados/administrativos) e blacklist com campanhas marcadas ← agente IA (regras) | SOL-*, ASP-*, BLK-*, IAG-05 | [PROP] Escopo por campanha conforme contrato. | Precedência entre administrativos, bloqueados e regras = pendente DEC-18; ações consequenciais = DEC-19 |
| FLX-10 | Organização multi-cliente | projeto → contas/campanhas/webhooks → KPIs do projeto | PRJ-* | Totais só do projeto | Isolamento não provado |
| FLX-11 | Monitoramento | métricas globais → atenção (expostas/ociosas) → operação do dia → alertas → desconectadas | MET-*, CTA-05 | Indicadores coerentes com dados | Fórmulas DEC-14 |

---

## 6. Invariantes de engenharia propostas (PROP — não extraídas do vídeo)
> Este documento não escolhe stack, SQL, bibliotecas ou criptografia nem desenha endpoints; o desenho de DB/APIs necessário às funções autorizadas cabe ao backend como contrato técnico novo, explícito e alinhado (não extraído do vídeo). Invariantes derivadas das distinções observáveis e dos limites dos checklists/pareceres (documentais e condicionais, não aprovações).

| ID | Invariante | Origem |
|---|---|---|
| ENG-01 | **Conta ≠ sessão/credencial ≠ IDs externos**: entidades separadas; criar/editar conta não cria sessão; trocar sessão não troca ID da conta nem associações. | CK16 F01; GRP-CTA-03 |
| ENG-02 | **Escopo**: toda leitura/escrita é restrita ao espaço do usuário (tenant) e, quando aplicável, ao projeto/campanha; vínculo campanha–conta validado no servidor. Testes negativos cruzados obrigatórios. | CK16 F02/F08; CF §6.7 |
| ENG-03 | **Tarefa ≠ tentativa ≠ efeito ≠ conclusão**: a fila registra tentativas honestamente; efeito local já confirmado não é duplicado em replay/crash; conclusão recusada de dono obsoleto não vira sucesso nem falha de negócio; sem promessa de exactly-once externo ou atomicidade com rede. | CHECKLIST-EFEITOS-LOCAIS-CONCLUSAO-REPLAY-FILA; CHECKLIST-OBSERVABILIDADE-JOB-TICK-CONCLUSAO |
| ENG-04 | **Preservação de dados e legado**: migrações preservam IDs, tenant, campanha, versões, blocos, atribuições, fila; recusam acervo incompatível/extensão desconhecida explicitamente, sem descarte silencioso nem reset; rollback integral; reabertura idempotente; não impõem NOT NULL/unicidade/cascata novas sem decisão. | CHECKLIST-MIGRACAO-*; CHECKLIST-R28-*; PARECER-R31/R35; CHECKLIST-CHECK-LITERAIS |
| ENG-05 | **Tempo e fuso**: agendamentos e recorrências armazenam fuso explícito; política de horário inexistente/ambíguo e fim de mês é contratual e por versão; registros legados não são reinterpretados. | CHECKLIST-RECORRENCIA-*; CF §6.6 |
| ENG-06 | **Observabilidade inequívoca**: avaliação ≠ tentativa ≠ conclusão persistida; campos legados não são renomeados/reinterpretados silenciosamente; contadores conferem com o banco. | CHECKLIST-OBSERVABILIDADE-* |
| ENG-07 | **Backup honesto**: não migra a fonte, não publica sucesso de cópia incompleta, recusa destino que represente a fonte/artefatos ativos; sem RPO/RTO, motor ou restore novos não ordenados. | CHECKLIST-CORRECAO-BACKUP-*; CHECKLIST-BACKUP-*; PARECER-R33 |
| ENG-08 | **Autenticação**: apenas o contrato existente (ex.: bloqueio por tentativas na janela relatada); nenhuma política nova de auth. | CHECKLIST-LOGIN-BORDA-*; INF |
| ENG-09 | **Segredos e PII**: credenciais mascaradas na entrada e exibição, nunca reexibidas, sem logs/exportação; troca exige redigitar; números mascarados em listas/exportações; exportação sob permissão. | P7 §D2; P8 §D1; CF §6.8 |
| ENG-10 | **Configuração para o futuro**: alterações do template valem só para novos grupos; existentes inalterados. | GRP-CRG-10 |
| ENG-11 | **Idempotência de operações de usuário**: confirmar assistente, importar, agendar e "programar outra" não duplicam ações. | P3 §D2; P5 §E1 |
| ENG-12 | **Transporte/API**: APIs já existentes preservam seu contrato (auth, tenant, conflito de versão, lock) e têm regressão; APIs novas necessárias a uma fatia autorizada são especificadas explicitamente (contrato técnico novo, alinhado com o coordenador) antes de implementar; provas locais isoladas. | CHECKLIST-PROVA-HTTP-TCP-LOCAL |
| ENG-13 | **Retenção/replay** de fluxos de vinculação: minimizar dados sensíveis sem perder a função de reabertura; sem novos IDs/efeitos involuntários. | CHECKLIST-RETENCAO-REPLAY-ES5 |

---

## 7. Regras de entrega, regressão e matriz de evidência

### 7.1 Regras para quem executa
1. Trabalhe **somente** na fatia coordenada pelo coordenador **dentro de delegação/autorização verificável de Loigo**; relato de agente não amplia autorização. Cite os IDs deste documento que a fatia cobre.
2. Antes de mudar algo existente: identifique o contrato existente (fonte, revisão) de cada ID tocado e preserve-o com regressão. Para função nova especificada, redija o contrato técnico novo (dados/API/estados) e alinhe-o antes de implementar. Contrato desconhecido → **consulte o coordenador** (não decida sozinho).
3. Não crie extras: função, módulo, política, infraestrutura ou admin fora da especificação/fatia autorizada. DB/APIs necessários à função autorizada **não** são extras. Se algo parece necessário e não está aqui, registre como **proposta** e pare.
4. Dependência externa ausente → estado "bloqueado/não integrado" e teste disso; nunca simular sucesso.
5. Dados exclusivamente sintéticos e temporários; nunca abrir banco real/demo, contas ou credenciais.
6. Mudança de admissão/compatibilidade (ex.: passar a recusar acervo antes aceito) deve ser **declarada explicitamente** no relatório.
7. Hipótese → reprodução → correção são etapas distintas; corrija só divergência confirmada contra contrato.
8. Reporte ao coordenador (não ao usuário final) com a matriz 7.3; não declare "aprovado", "100%" ou percentuais.

### 7.2 Regressão por função (mínimo por entrega)
- Testes existentes continuam passando (INF: contagens relatadas pelo coordenador não são verificadas aqui; registrar a contagem real da execução).
- Para cada ID tocado: cenário positivo, negativo (escopo cruzado, conta não associada, entrada inválida), estado vazio/erro, persistência após reabrir/reiniciar, e não duplicação.
- Confirmar as distinções do item 7 da instrução-mestre em todo contador e estado afetado.
- Confronto integral: percorrer **todos** os IDs da seção 4 e marcar cada um (mesmo não tocado) antes de fechamento de etapa.

### 7.3 Matriz de evidência (uma linha por ID)
| ID | Contrato (fonte/revisão) | Cenário | Esperado | Real | Evidência sanitizada | Estado |
|---|---|---|---|---|---|---|

Estados permitidos (não compactar em "concluído"): **NÃO AVALIADO** (padrão) · **IMPLEMENTADO POR RELATO** · **INSPECIONADO DOCUMENTALMENTE** · **PROVADO LIMITADO** (só o cenário exato) · **DEFEITO REPRODUZIDO** · **RISCO ESTÁTICO** · **BLOQUEADO** (dependência/contrato/decisão) · **AUSENTE DEMONSTRADO NO ESCOPO** · **FORA DE ESCOPO**. Fonte: CRITERIOS-RECONCILIACAO-BACKEND-R39; CK16 (APROVÁVEL/FALHA/NÃO AVALIADO como resultado de critério de prova).

---

## 8. Matriz: funções observadas × escopo delegado/informado × pendências
Legenda de escopo: **INF-ATUAL** = informado pelo coordenador como já em trabalho/implementado (não auditado); **PEND-ORDEM** = observado, aguarda ordem; **BLOQ-EXT** = depende de provedor/contrato externo; **DEC** = decisão pendente antes de qualquer trabalho; **FIN** = etapa final de design (outro responsável); **EXC** = excluído.

| Módulo | IDs | Escopo | Observação |
|---|---|---|---|
| NAV | NAV-01..07 | FIN (UI) + PEND-ORDEM (dados de suporte) | listas iniciais dependem de backend de contas/campanhas/webhooks |
| CTA | CTA-01..05 | INF-ATUAL parcial (entidade) + BLOQ-EXT (status/conexão) | CTA-06 BLOQ-EXT |
| CMP | CMP-01..07 | INF-ATUAL (CRUD, 3 distribuições) + DEC-03 (viral) | CMP-08 RV |
| ASC | ASC-01..04 | INF-ATUAL parcial (bloqueios tenant/campanha) + DEC-04 | — |
| GRU | GRU-01..10 | INF-ATUAL (grupos, reservas) + BLOQ-EXT (links/leads/suspenso) | GRU-08/09 RV |
| CRG | CRG-01..12 | INF-ATUAL parcial (campos não confirmados) + BLOQ-EXT (efeitos) | DEC-07/12 |
| IMP | IMP-01..06 | INF-ATUAL (importação LOCAL) + BLOQ-EXT (leitura real) | DEC-08 |
| FIL | FIL-01..08 | INF-ATUAL (fila/runner) | DEC-10 |
| VGC | VGC-01..06 | PEND-ORDEM (métricas/link) | DEC-05/11/14 |
| REC | REC-01..12 | PEND-ORDEM; efeitos BLOQ-EXT | vários não amostrados |
| MSG | MSG-01..09 | INF-ATUAL parcial (modelos versionados, rascunhos/versões/blocos) + BLOQ-EXT (envio) | — |
| ACM | ACM-01..09 | PEND-ORDEM; envio BLOQ-EXT | — |
| AUT | AUT-01..07 | INF-ATUAL parcial (recorrência mensal) + PEND-ORDEM | DEC-15 |
| PRJ | PRJ-01..04 | INF-ATUAL (CRUD projetos) | isolamento a provar; DEC-16 |
| MET | MET-01..06 | PEND-ORDEM | DEC-14 |
| LSC | LSC-01..03 | PEND-ORDEM; eventos BLOQ-EXT | DEC-17 |
| ATV | ATV-01 | PEND-ORDEM | LAC-07 |
| SOL | SOL-01..05 | PEND-ORDEM; efeitos BLOQ-EXT | LAC-08 |
| ASP | ASP-01..04 | PEND-ORDEM | DEC-18 |
| BLK | BLK-01..02 | PEND-ORDEM | — |
| IAG | IAG-01..07 | BLOQ-EXT (provedor IA) + DEC-19 | credencial sensível |
| WHE | WHE-01..06 | BLOQ-EXT (cada plataforma) | — |
| WHS | WHS-01..05 | BLOQ-EXT (destino externo) | — |
| BRD | BRD-01..03 | BLOQ-EXT + DEC-20 | — |
| TRN | TRN-01..03 | DEC-09 | não inventar player/checkout |
| ZZZ | ZZZ-01..15 | DEC (definição pendente) | não inventar |
| VIS | VIS-01..06 | FIN | DIR-02/03 |
| INT | INT-01..05 | INF-ATUAL (preparo sem conta) + BLOQ-EXT (ativação) | DIR-06 |
| EXC | GRP-EXC-01..03 | EXC | ver também EXC-01..07 (§9.3) |
| Backend transversal | ENG-01..13 | INF-ATUAL (login, backup, migração, TCP local, fila, recorrência relatados) | rodadas 28–38 relatadas em auditoria, não certificadas |

---

## 9. Decisões pendentes, lacunas e exclusões

### 9.1 Decisões pendentes (DEC) — não decidir no executor
| ID | Decisão | Origem |
|---|---|---|
| DEC-01 | Nomes próprios dos módulos/itens, cor de destaque e identidade visual (sem copiar a referência). | DIR-08; CF §1 |
| DEC-02 | Semântica de "conta espião". | P1 01:36 |
| DEC-03 | "Campanha viral": incluir ou não; semântica. **Não definir regras.** | P1 04:05; DL |
| DEC-04 | Papéis por conta associada; conteúdo de "range de operação". | P1 07:05 |
| DEC-05 | Definição de "Redirect" vs "Cliques reais" vs participantes por grupo. | P3 21:08 |
| DEC-06 | Precedência de "Cheio" manual × lotação calculada e relação com gatilho "encher grupo". | P4 26:40, 29:27; CK16 F05 |
| DEC-07 | Semântica de modo NORMAL × SEGURO e de "aberto 24h". | P2 §C |
| DEC-08 | Opções de importação "registro de atividades"/"padronizar". | P3 22:32 |
| DEC-09 | Escopo de treinamentos/suporte/widget no Grupos. | P9 |
| DEC-10 | Semântica de "ação travada", agrupamento e ícones de status da fila. | P2 14:22; P3 24:28 |
| DEC-11 | Formato/domínio do link único e efeito de editá-lo. | P2 14:46 |
| DEC-12 | Limites de campos (nome, descrição, instruções, treinamento) e obrigatoriedades no Grupos. | P1/P2/P7 |
| DEC-13 | Escopo da busca global. | P1 01:14 |
| DEC-14 | Fórmulas de KPIs: percentual de entrada, grupos disponíveis, expostas, ociosas, variação vs média 7d, 4 métricas do card. | P2/P5/P6 |
| DEC-15 | Recorrência: fim de mês 29–31, "dias do mês", iniciar/pausar, horário inexistente/ambíguo por modo, tratamento de legado. | P5; CHECKLIST-RECORRENCIA |
| DEC-16 | Efeito de excluir projeto sobre contas/campanhas/webhooks. | P6 40:16 |
| DEC-17 | Tipos de evento e pontuação do leadscoring. | P6 43:55 |
| DEC-18 | Precedência entre números administrativos e bloqueados/regras de moderação; se a lista administrativa confere "proteção" é **proposta não provada** (critério proposto em P6 §D6/P7 §D6). | P6 §D6; P7 §D6; CF §4 |
| DEC-19 | Política e revisão humana para ações consequenciais (remover pessoa, apagar mensagem). | P7 §D5; CF §6.9 |
| DEC-20 | Diferença entre "Broadcast", "Broadcasts" e "Leads". | P6 41:03 |
| DEC-21 | Admin global (não demonstrado) e Equipe/permissões. | DL; GRP-ZZZ-14 |
| DEC-22 | Prioridade entre módulos pendentes (P1/P2/P3 do consolidado são só sugestão). | CF §5 |

### 9.2 Lacunas de evidência (LAC) — não confirmadas na amostragem
| ID | Lacuna | Fonte |
|---|---|---|
| LAC-01 | Toast de sucesso após salvar; campos DDI/número em administradores; contador "18/50" alegado (visto 18/95). | P2 §B; CF §4 |
| LAC-02 | Papéis em contas associadas. | P1 07:05 |
| LAC-03 | Modal de alteração em lote; estado vazio de duplicados. | P4 §B |
| LAC-04 | Telas de tags, anti-hacker, colaboradores, grupo VIP, comunidades, atualização periódica. | P2 14:46 |
| LAC-05 | Telas de pixel (Meta/TikTok), desafio para bots, tradução automática. | P3 18:10; CAP 20:32/21:51 |
| LAC-06 | Funil e gráficos globais de métricas. | P6 §B |
| LAC-07 | Conteúdo da aba Atividades. | P6 §A |
| LAC-08 | Configurações de solicitações por tag. | P6 §A |
| LAC-09 | Etapa Gatilho; dias do mês; iniciar/pausar; segunda ação agendada. | P4/P5 §B |
| LAC-10 | Etapa Confirmar da importação; transições processando→sucesso legíveis; renumeração 0→28; reordenação. | P3 §B |
| LAC-11 | Aba Números da blacklist; aba Contas associadas do anti-spam; salvar/finalizar agente; resposta da IA em grupo. | P6/P7 §B |
| LAC-12 | Modal Nome/Projeto do webhook; campo de produto; detalhe de broadcast; player de aula. | P8 §B; P9 |
| LAC-13 | Conteúdo dos itens só-rótulo (GRP-ZZZ). | P6 41:03 |
| LAC-14 | Fonte mestre original ausente; INVENTARIO-ESCOPO baseado em brief não verificado; código não auditado. | IE; CRITERIOS-R39 |

### 9.3 Exclusões (EXC)
| ID | Excluído | Motivo |
|---|---|---|
| EXC-01 | Planos, preços, limites comerciais, checkout, gating por plano | Oferta comercial da referência (GRP-EXC-01) |
| EXC-02 | Marca, logotipo, nomes proprietários, textos explicativos, capas | Produto próprio (DIR-08) |
| EXC-03 | Regras do WhatsApp como obrigatórias; eficácia anti-ban | Não provado |
| EXC-04 | Escolha de stack, motor, SQL e criptografia **por este documento** | Fora do estudo; o desenho de DB/APIs das funções autorizadas cabe ao backend (§1 regra 6) |
| EXC-05 | Funções admin não demonstradas | DEC-21 |
| EXC-06 | Conexão de contas, envio, deploy, cloud, rede externa | DIR-06; sem autorização |
| EXC-07 | Valores do exemplo como defaults | §0.1 |

---

## 10. Mapa de cobertura inversa das fontes (controle de completude)

### 10.1 CONSOLIDADO-FINAL §2 (itens 1–33) → IDs
| CF | Tema | IDs |
|---|---|---|
| 1 | Visão geral | NAV-05 |
| 2 | Criar conta | CTA-01 |
| 3 | Criar campanha + 4 tipos | CMP-01/02/03, DEC-03 |
| 4 | 12 abas | CMP-07, ZZZ-01..04 |
| 5 | Contas associadas | ASC-01/02, DEC-04 |
| 6 | Grupos toolbar/filtros/vazio | GRU-01/02 |
| 7 | Formulário criação | CRG-02..10 |
| 8 | Administradores | CRG-11, LAC-01 |
| 9 | Fila | FIL-01..07 |
| 10 | Visão geral campanha | VGC-01..04 |
| 11 | Menu de recursos | REC-01..12 |
| 12 | Linha do grupo | GRU-03..06 |
| 13 | Importação | IMP-01..05 |
| 14 | Automação | AUT-01..04 |
| 15 | Editor em blocos | MSG-01..07 |
| 16 | Ação manual | ACM-01..03 |
| 17 | Agendar | ACM-07/08 |
| 18 | Ações administrativas | ACM-04/05 |
| 19 | Cronograma | AUT-05 |
| 20 | Lista global campanhas | CMP-04/05 |
| 21 | Projeto | PRJ-01..04 |
| 22 | Sidebar | NAV-01/02, ZZZ |
| 23 | Métricas | MET-01..05 |
| 24 | Leadscoring | LSC-01..03 |
| 25 | Solicitações | SOL-01..04 |
| 26 | Anti-spam | ASP-01..03 |
| 27 | Blacklist | BLK-01/02 |
| 28 | Agente IA | IAG-01..07 |
| 29 | Webhooks entrada | WHE-01..06 |
| 30 | Webhooks saída | WHS-01..04 |
| 31 | Broadcasts | BRD-01/02 |
| 32 | Treinamentos/ajuda | TRN-01..03 |
| 33 | Planos | GRP-EXC-01, EXC-01 |
| §1 | Linguagem visual/estados | VIS-01..05, NAV-07 |
| §3 | Navegação | NAV-01..03 |
| §4 | Correções | §0.1, LAC-01, LSC-01, FIL/GRU-07 |
| §5 | Prioridades propostas | DEC-22 (não são DIR) |
| §6 | Critérios propostos 1–10 | ENG-01..11, §7.2, FIL-07, VGC-05, CRG-10/12 |

### 10.2 PARTE-01…09 → IDs
| Parte | Conteúdo (§A) | IDs |
|---|---|---|
| P1 | 01:14 visão geral; 01:36 criar conta; 03:32/04:05 campanha/tipos; 07:05 contas associadas/abas; 07:55 grupos vazio; 08:26–10:25 modal criação; §C falas tipos | NAV-01..06, CTA-01/02, CMP-01..03/07, ASC-01/02, GRU-01/02, CRG-01..10 |
| P2 | 10:34–13:44 modal; 14:06 administradores; 14:22 fila; 14:46/15:50 visão geral/link/gráficos/menu; 16:45 variáveis; §C falas | CRG-03..12, FIL-01..04, VGC-01..06, REC-01..12, GRU-10 |
| P3 | 16:52 variáveis; 17:07/17:36 cookie; 18:10 deep linking; 19:36/20:34 remover lead; 21:08 linha; 22:32 importação; 23:40/24:28 fila; 24:05 menu ⋮ | REC-02/03/09/10, GRU-03/05/06/07, IMP-01..05, FIL-04..06 |
| P4 | 24:33–25:58 grupos; 26:40 cheio manual; 27:08/27:33 automação/editor; 29:27 lista automações; 30:03 ação manual; 30:38/31:57 blocos/spintax/opções | GRU-04/05, AUT-01..04, MSG-01..07, ACM-01/03 |
| P5 | 32:20/33:13 spintax/blocos; 33:40 confirmar/agendar; 34:10 multi-campanhas; 34:45/35:45 ações administrativas; 36:40/37:50 cronograma; 38:45/39:45 lista global | MSG-04/05, ACM-02/04/05/07/08, AUT-05, CMP-04/05 |
| P6 | 40:16 projeto; 41:03 sidebar; 42:08/42:24 métricas; 43:10/43:55 leadscoring; 44:06/45:01 solicitações; 46:10/47:45 anti-spam | PRJ-01..04, NAV-02, ZZZ-*, MET-01..05, LSC-01..03, ATV-01, SOL-01..03, ASP-01..03 |
| P7 | 48:08/48:21 adm./Equipe; 48:40/49:30 blacklist; 50:31–53:42 agente IA | ASP-03, ZZZ-14, BLK-01/02, IAG-01..06 |
| P8 | 54:41 agente; 55:08–56:14 webhooks; 57:32/59:01 saída; 1:01:01 broadcasts | IAG-07, WHE-01..06, WHS-01..04, BRD-01/02 |
| P9 | 1:02:07 broadcasts; 1:02:50–1:03:52 treinamentos/widget; 1:04:00–fim planos | BRD-01, TRN-01..03, GRP-EXC-01 |

### 10.3 Capítulos (CAP, localizador temático) → IDs
| Cap. | Tema | IDs |
|---|---|---|
| 00:00 | Apresentação | — (sem requisito) |
| 01:20 | Painel / conectar número | NAV-05, CTA-06, INT-* |
| 03:48 | Modos campanha/lista/aleatório | CMP-02/03 |
| 07:43 | Contas associadas / criadora | ASC-01/02 |
| 08:54 | Foto, nome, numeração | CRG-02..05 |
| 10:34 | Solicitação de entrada / recusa antispam | CRG-07, SOL-05 |
| 11:49 | Reserva / pessoas por grupo | CRG-06, GRU-10 |
| 13:43 | Normal × seguro / 24h | CRG-08/09 |
| 15:31 | Administradores / salvar | CRG-11/12 |
| 16:52 | Visão geral / link único | VGC-01..03 |
| 18:00 | Gráficos, tags, variáveis | VGC-04, REC-01/02 |
| 19:16 | Cookie / duplicados | REC-03/11 |
| 20:32 | DeepLink, pixels, desafio | REC-10, LAC-05 |
| 21:51 | Tradução / remoção de leads | REC-09/10 |
| 22:35 | Atualização de link por banimento | REC-08 |
| 24:33 | Importar grupos | IMP-* |
| 27:05 | Edição em massa / exportar | GRU-08 |
| 28:59 | Duplicados / filtros cheio-suspenso | GRU-02/09 |
| 30:26 | Boas-vindas ao encher | AUT-03 |
| 32:12 | Tipos de conteúdo | MSG-02 |
| 33:20 | Enviando mensagem | ACM-01..03, MSG-* |
| 34:34 | Velocidade / continuação | MSG-06/07 |
| 35:18 | Spintax | MSG-05 |
| 37:17 | Várias ações e campanhas | ACM-02/08 |
| 38:46 | Ações em massa / privacidade | ACM-04..06 |
| 40:16 | Cronograma | AUT-05 |
| 43:05 | Projetos | PRJ-* |
| 44:51 | Métricas, funil, expostas/ociosas | MET-*, LAC-06 |
| 46:19 | LeadScoring | LSC-* |
| 48:08 | Atividades / solicitações | ATV-01, SOL-* |
| 49:21 | AntiSpam / global / blacklist | ASP-*, BLK-* |
| 52:45 | Anti-Hacker | REC-04, ASP-04 |
| 54:41 | Agente de IA | IAG-* |
| 58:56 | Webhooks / recuperação de vendas | WHE-* |
| 62:07 | Webhooks de saída | WHS-* |
| 64:52 | Broadcast / SMS / ligação | BRD-* |
| 66:42 | Suporte / treinamentos | TRN-* |

### 10.4 Outras fontes → IDs
| Fonte | Coberto em |
|---|---|
| Sidebar 24+ rótulos (P6 41:03 + Equipe P7) | NAV-02 e módulos; itens sem conteúdo em ZZZ-01..15 |
| 12 abas da campanha (P1 07:05) | VGC, ASC, ZZZ-01, GRU, SOL, ATV, LSC, ZZZ-02/03/04, AUT, FIL |
| DIFERENCAS-E-LACUNAS (linhas) | CMP-02/DEC-03, CRG, GRU-10, FIL, IMP/AUT/ACM/IAG/WHE, MSG/AUT-05, VGC/MET, VGC-03, PRJ, LSC/SOL/ASP/BLK, WHE/WHS, IAG, DEC-21, EXC-01 |
| INVENTARIO-ESCOPO (linhas) | §8 (INF-ATUAL/PEND), LAC-14 |
| INVENTARIO-EVIDENCIAS / PROCEDENCIA | cabeçalho, §0, ENG-09 (mídia não compartilhável) |
| GUIA-ACUMULADO (pendências/visual) | VIS-*, LAC-01..13 |
| CHECKLISTs/PARECERes/R39 (limites) | ENG-03..13, INT-02/05, §7.3 |

**Controle de completude (cobertura de tópicos, não exaustividade):** todos os itens do CF §2, as 9 partes, os 37 capítulos (1 sem requisito por ser apresentação), os 24 rótulos da sidebar + "Equipe" e as 12 abas da campanha **têm ao menos um ID de destino**. Isso mede só a cobertura dos tópicos dos inventários/notas; **não** demonstra exaustividade de todas as funções do vídeo (a amostragem foi de 95 quadros), nem validação funcional, nem implementação. Itens sem conteúdo amostrado estão em ZZZ/LAC, não omitidos nem inventados.

---

## 11. Resumo de lacunas
- **Fonte mestre original ausente**; este documento é nova consolidação/especificação derivada do estudo, não recuperação/reconstituição fiel do original histórico (LAC-14).
- **Semântica não esclarecida:** campanha viral, conta espião, papéis/range de contas, modo seguro, redirect × cliques reais, cheio manual × automático, broadcast × broadcasts × leads (DEC-02..07, DEC-20).
- **Não amostrado:** 15 áreas só-rótulo (Diagnósticos, Mensagens, Mensagens recebidas, Calendário, Equipe, Histórico, itens proprietários etc.), atividades, configurações por tag, gatilho, pixel/desafio/tradução, funil, lote, várias abas de detalhe (LAC-03..13).
- **Nunca provado pelo vídeo:** APIs, DDL, tenant/isolamento, permissões, segurança, provedores (WhatsApp/Meta/IA/pagamento/SMS/ligação/HTTP), algoritmos, fórmulas, defaults.
- **Admin global não demonstrado**; Equipe/permissões = DEC-21.
- **Backend atual não certificado**; estado informado pelo coordenador (rodadas 28–38 em auditoria) não é código auditado.
- **Integração Meta**: escolha ES v5 REGULAR informada; contrato/docs/conta/autorização pendentes.

---

## 12. Histórico de revisão (v1.0)
| Momento (America/Sao_Paulo) | Alteração conceitual |
|---|---|
| 07/11/2026 ~09:12 | Geração inicial (preservada em `PROMPT-MESTRE-GRUPOS.v1.0-rascunho-0912.md`). |
| 07/11/2026 ~09:20 | Revisão final pedida pelo coordenador: OBS-E = estado visível na UI (persistência/efeito desconhecidos); Classe/Fonte classificam só a observação e Aceitação é critério PROPOSTO (§0.2.1); inferências na coluna Requisito marcadas [PROP]; ENT como mapa lógico PROP sem cardinalidade/propriedade/tenant observados; GRP-INT-05 e GRP-AUT-07 como estados históricos a reconfirmar; GRP-LSC-01 configurabilidade = DEC-17; FLX-09/DEC-18 sem proteção presumida de administrativos; GRP-IAG-05 revisão humana = proposta DEC-19; DB/APIs necessários às funções autorizadas são trabalho de backend (contrato novo explícito), extra = recurso fora da especificação; autorização = fatia coordenada dentro de delegação verificável de Loigo; natureza "nova consolidação, não recuperação/reconstituição fiel"; controle de completude = cobertura de tópicos, não exaustividade. IDs e escopo preservados; nenhum requisito removido. |

*Fim do PM-GRUPOS v1.0 — revisão final (07/11/2026, America/Sao_Paulo). Documento sanitizado: sem tokens, PII, URLs privadas ou mídia; a única referência externa é o ID público do vídeo.*
