# Aderência ao PM-GRUPOS v1.0

Confronto estático do backend nesta árvore (`d31b536`, antes da matriz) com o anexo PM-GRUPOS v1.0 (revisão final ~09:20, America/Sao_Paulo). O anexo foi lido por inteiro, seções 0 a 12, 787 linhas. Não é o prompt mestre histórico. Em 07/11/2026 09:28 (America/Sao_Paulo) Loigo aprovou esse arquivo como referência de escopo. A aprovação libera a continuação de banco, API e lógica de backend. Não inventa semântica das DEC abertas, não liga conta, envio ou deploy, e não entrega o front: design e admin seguem com outro responsável, no fim. Esta rodada continua só a matriz. A implementação da fatia abaixo espera a consulta de referência do pré-pacote.

Não houve banco, runtime, teste, código de produção, frontend, conta, provedor, rede ou deploy. Gates não rodaram. A contagem histórica 148/32 da R38 não é reexecução desta árvore. “Prova limitada retida” cita arquivo de teste que existe; esta rodada não o executou.

Contagem: 182 IDs nas seções 4.1–4.29 (NAV 7, CTA 6, CMP 8, ASC 4, GRU 10, CRG 12, IMP 6, FIL 8, VGC 6, REC 12, MSG 9, ACM 9, AUT 7, PRJ 4, MET 6, LSC 3, ATV 1, SOL 5, ASP 4, BLK 2, IAG 7, WHE 6, WHS 5, BRD 3, TRN 3, ZZZ 15, VIS 6, EXC 3, INT 5). ZZZ não tem coluna Classe no anexo; a classe abaixo é rótulo observado. EXC também não tem Classe; a origem é a exclusão da seção 8. Nenhuma linha foi omitida. A inspeção não abriu cada corpo de teste: onde o teste não foi lido nesta rodada, a evidência fica no nome do arquivo, não num resultado novo.

DIR do anexo (regressão por função, sem extras, sem declarar 100%, alvo visual 88–96% não medido, backend antes do design) coincidem com as ordens deste pedido. O próprio anexo diz que essas DIR foram encaminhadas pelo coordenador, não lidas do original. Isso não mede fidelidade e não fecha função.

A frase da R39 de que não havia fatia desbloqueada é anterior a este estudo. Ela não impede procurar lacuna já delegada. Também não cria backend para cada texto ou PROP. Restauração nova e troca ES continuam sem contrato confirmado (DIR-09, ENG-07, INT-05).

| ID | Classe | Origem | Contrato no código | Arquivos | Evidência retida | Estado e limite | Próxima ação |
|---|---|---|---|---|---|---|---|
| GRP-NAV-01 | OBS-M | FIN | Sidebar fixa com sete destinos; não é o mapa da referência | `components/shell.tsx` | inspeção; sem teste de navegação lido | Tela provisória. Presença não prova shell da referência | Outro responsável, no fim |
| GRP-NAV-02 | OBS-M | FIN | Sete rotas de painel. Métricas, webhooks, IA, broadcasts, leads, equipe e rótulos proprietários não têm rota | `shell.tsx`, `app/(painel)` | inspeção das páginas | Vários itens sem página. Não inventar função | Não implementar; ZZZ/DEC |
| GRP-NAV-03 | OBS-M | FIN | Sem breadcrumb de campanha como hierarquia navegável comprovada | páginas do painel | inspeção | [PROP] de universalidade não é contrato | Não implementar |
| GRP-NAV-04 | OBS-M | FIN | Sem busca global nem atalho | páginas | inspeção | DEC-13. Resultado não existe aqui | Não implementar |
| GRP-NAV-05 | OBS-M | FIN + dados | Painel lista organizações da sessão, não as três colunas Contas/Campanhas/Webhooks da referência | `app/(painel)/page.tsx` | `client-area.test.ts` não reexecutado | Contadores da referência não são o contrato local | UI final é outro responsável |
| GRP-NAV-06 | OBS-M | FIN | Sem widget de ajuda | páginas | inspeção | DEC-09 | Não implementar |
| GRP-NAV-07 | PROP | FIN | Listas locais têm vazio em algumas telas; não há o conjunto carregando/erro/sem permissão em toda lista | páginas | inspeção parcial | Proposta, não vídeo | Não ampliar |
| GRP-CTA-01 | OBS-M | INF-ATUAL parcial | Conta com nome e papel `creator` ou `sender`. Sem “conta espião”. Tipo não é um select WhatsApp | `accounts` em `db.ts`; API `accounts` | `api.integration.test.ts`, `product.test.ts` não reexecutados | DEC-02 impede a semântica espião | Não inventar espião |
| GRP-CTA-02 | OBS-M | BLOQ-EXT | `provider_status` só `not_configured`. Não há online | `db.ts` CHECK | `product.test.ts` espia recusa de rede, não reexecutado | Status real depende de provedor | Manter bloqueado |
| GRP-CTA-03 | DIR+PROP | INF-ATUAL | Criar conta não grava sessão nem ID externo | `accounts` sem credencial; sessão em `api_sessions` | inspeção do schema | Separação existe. Fluxo QR/ES real bloqueado | Não conectar |
| GRP-CTA-04 | OBS-M | escopo aprovado; contagem derivada | Campanha continua com `creator_account_id` e `sender_account_id`, não uma lista N. `GET /api/v1/accounts` soma contas da org sem campanha `active` nessas colunas | `src/lib/data.ts` `countIdleAccounts` | `src/lib/idle-accounts.test.ts` | Não é a aba N:N. Sem estado ocioso e sem `provider_status` no cálculo | Feita a contagem. Não é a associação N |
| GRP-CTA-05 | OBS-M | BLOQ-EXT | Sem evento de desconexão 24h | sem tabela | ausência de tabela/rota | NT | Não simular |
| GRP-CTA-06 | FALA | BLOQ-EXT | Conexão de número não existe | `gateway.ts` `not_configured` | recusa antes de rede, teste não reexecutado | DIR-06 | Não conectar |
| GRP-CMP-01 | OBS-M | INF-ATUAL | Criar campanha exige nome. API e painel | `campaigns`, `data.ts` | `api.integration.test.ts` não reexecutado | CRUD local, não o modal da referência | Manter regressão se a função for tocada |
| GRP-CMP-02 | OBS-M | DEC-03 | Políticas `sequential`, `least_occupancy`, `random`. `viral` é recusado | CHECK em `db.ts`; opção desabilitada na tela | `api.integration.test.ts` espera 400; `client-area.test.ts` | Quatro rótulos da referência não são o contrato. Viral sem semântica | Não definir viral |
| GRP-CMP-03 | FALA | INF-ATUAL | Sequencial, menor ocupação e aleatório estão em `selectGroup` | `routing.ts` | `routing.test.ts` não reexecutado | Fala não é contrato; o código local é o contrato testado antes | Não reabrir sem ordem |
| GRP-CMP-04 | OBS-M | PEND-ORDEM | Sem lista global com período 7/14/21/28/90 e oito totais | sem agregação lida | inspeção | DEC-14 | Não inventar fórmula |
| GRP-CMP-05 | OBS-M | escopo aprovado; arquivar por ids; filtro posterior | `POST /api/v1/campaigns/archive` repete `updateCampaign` com `archived`. Não apaga linha, grupo, mensagem nem link. Reserva `active` vira `released`. Depois, `GET /api/v1/campaigns?status=` filtra por igualdade de `draft`, `active`, `paused` ou `archived`. Sem o parâmetro, a lista inteira permanece | `src/lib/data.ts` `archiveCampaigns`, `listCampaigns` | `src/lib/campaign-archive.test.ts`, `src/lib/campaign-status-filter.test.ts` | Sem desarquivar, sem totais e sem tela. Fila e automação não são pausadas: o runner ainda executa item já gerado e automação `active` vencida. Seleção múltipla da nota não foi confirmada no vídeo. O filtro não é a aprovação histórica do arquivamento | Feito o arquivamento por ids. Não é a lista de campanhas. O filtro por status gravado é acréscimo posterior e não fecha a lista |
| GRP-CMP-06 | OBS-M | FIN | Card local não é o card de quatro métricas | página de campanhas | inspeção | DEC-14 | UI no fim |
| GRP-CMP-07 | OBS-M | FIN | Quatro abas ativas: visão, contas, grupos, modelo. Diagnósticos, Mensagens, Automações e Lead scoring aparecem desabilitadas | `campanhas/[id]/page.tsx` | inspeção | Aba desabilitada não é função. API de mensagem e automação existe à parte | Não tratar aba morta como prova |
| GRP-CMP-08 | RV | RV | `project_id` opcional existe. Edição de campanha existe na API | `campaigns`, API `campaigns/[id]` | inspeção | RV: vínculo visto no código, não confirmado no vídeo | Não promover RV a regra nova |
| GRP-ASC-01 | OBS-M | INF-ATUAL parcial | Dois papéis fixos, criadora e envio, não checkbox N/M | FKs em `campaigns` | inspeção | DEC-04 | Não criar associação N sem decisão |
| GRP-ASC-02 | OBS-M | DEC-04 | Sem “range de operação” | sem coluna | ausência | Papel e range não confirmados | Não implementar |
| GRP-ASC-03 | OBS-M | INF-ATUAL parcial | Conta de outra organização não associa, pelo FK composto | `db.ts` FKs | `api.integration.test.ts` não reexecutado | Isso é tenant, não o alerta do assistente de ação | Manter o FK; não inventar assistente |
| GRP-ASC-04 | OBS-M | DEC-14 | Sem “campanhas expostas” | sem indicador | ausência | Fórmula aberta | Não implementar |
| GRP-GRU-01 | OBS-M | recorte implementado; CSV de metadados | A orientação interna anterior era «Não criar exportação/provedor». Não era fala nem DEC de Loigo. O coordenador a substituiu só pelo CSV autenticado dos seis campos locais já gravados. `GET /api/v1/campaigns/{id}/groups/export` devolve `id,position,name,status,created_at,updated_at`. Links, leads, convites, provedor e métricas continuam fora | `src/lib/group-export.ts`, `dispatch.ts` | `src/lib/group-export.test.ts` | O texto antigo não passa a significar este CSV. Não é o GRU-01 inteiro | Provado o CSV de metadados. Não é exportação de leads nem provedor |
| GRP-GRU-02 | OBS-M | escopo aprovado; filtro técnico; busca posterior | `GET` dos grupos aceita um `status` opcional, igualdade com `available`, `full`, `suspended`, `blocked` ou `archived`. Sem ele, a lista e a ordem por `position` permanecem. Depois, `nameContains` filtra por substring literal de `name`, sensível a caixa e acento. O CSV não usa esse parâmetro. Depois, `fullness=full|not_full` classifica cheio como o status gravado `full` ou o teto local atingido por ocupação informada e reservas ativas não vencidas. Sem o parâmetro, a lista permanece. O CSV não lê `fullness` | `src/lib/data.ts` `listGroups` | `src/lib/group-status-filter.test.ts`, `src/lib/group-name-search.test.ts`, `src/lib/group-fullness.test.ts` | Não é o botão da tela. `available` não promete vaga. `full` não foi redefinido. O recorte de status dizia sem busca, contagem, paginação nem suspensão nova. A busca e o filtro `fullness` são acréscimos posteriores, não releitura daquela frase. O filtro não emite o gatilho ao encher | Feito o filtro de leitura. Não é a toolbar. A busca literal por nome e o filtro `fullness` são acréscimos posteriores e não fecham a toolbar nem o gatilho |
| GRP-GRU-03 | OBS-M | DEC-05 | Há posição, nome, ocupação informada, cliques em `routing_log` e reserva. `confirmedEntries` permanece nulo | `groups`, `routing_log`, `reservations` | `reservation.test.ts` não reexecutado | Redirect × cliques reais × participantes não foi decidido como na referência | Não fundir os contadores |
| GRP-GRU-04 | OBS-M+PROP | DEC-06 | `status=full` tira o grupo da rota; o teto `capacity-margin` contra ocupação+reserva também. A decisão direta de 07/11/2026 usa o OR só para classificar e filtrar a lista | `routing.ts` `groupIneligibility`; `listGroups` não usa esse motivo | `routing.test.ts` não reexecutado; `src/lib/group-fullness.test.ts` | As duas vias existem no roteamento. «Não unificar sem decisão» permanece o limite histórico. A decisão nova não reescreve esta linha como se já existisse e não unifica status, contadores nem roteamento | Não unificar status e roteamento. O filtro de leitura usa o OR; o gatilho ao encher segue sem emissão |
| GRP-GRU-05 | OBS-M | escopo aprovado; fatia implementada na API | `POST /api/v1/campaigns/{id}/groups/bulk`: `mark_full`, `mark_available` ou `delete` com `confirm: "sim"`. Até 100 ids explícitos, tudo ou nada, idempotente. Não altera `updateGroup` | `src/lib/data.ts` `applyGroupBulk`; `src/app/api/v1/campaigns/[id]/groups/bulk/route.ts` | `src/lib/group-bulk.test.ts`: snapshot da reserva e do clique; id de outra organização; a marcação espera `BEGIN IMMEDIATE` de outra conexão e só então passa de available para full. A barreira de relógio anterior não é contenção de banco | Marcar não mexe em ocupação, clique, reserva nem teto. `available` não promete vaga. DEC-06 não foi redefinida. A tela não chama a rota | Feita na API. Não é o módulo de grupos inteiro |
| GRP-GRU-06 | OBS-M | BLOQ-EXT | Sem menu de reprocessar clique, atualizar ou redefinir link no provedor | sem essas rotas | ausência | Efeito externo NT | Não implementar |
| GRP-GRU-07 | OBS-E | BLOQ-EXT | Renomear grupo não cria job `whatsapp.*` de sucesso | `groups` update local | inspeção | UI da fila de referência não prova persistência | Não marcar sucesso externo |
| GRP-GRU-08 | RV/FALA | RV | Sem edição em massa nem CSV | ausência | — | LAC-03 | Não implementar |
| GRP-GRU-09 | FALA | PEND-ORDEM | Sem análise de duplicados | ausência | — | Resultado não existe | Não implementar |
| GRP-GRU-10 | INF | INF-ATUAL | Reserva interna por chave de idempotência; teto local | `reservations` | `reservation.test.ts` não reexecutado | Relato do anexo não substitui o teste antigo, e este confronto não o rodou | Manter; não reabrir sem ordem |
| GRP-CRG-01 | OBS-M | FIN | API de template única por campanha. Sem abas Informações/Administradores | `group_templates`; API `template` | `client-area.test.ts` não reexecutado | Uma linha por campanha é o schema, não o modal | UI no fim |
| GRP-CRG-02 | OBS-M | BLOQ-EXT | Sem foto | sem coluna | ausência | Upload NT | Não implementar |
| GRP-CRG-03 | OBS-C | DEC-12 | `name_pattern` existe. Sem contador 95 | `group_templates` | inspeção | 18/95 é exemplo | Não adotar 95 |
| GRP-CRG-04 | OBS-C | DEC-12 | `description` existe. Sem teto 2048 lido como regra | coluna texto | inspeção | Exemplo | Não adotar 2048 |
| GRP-CRG-05 | OBS-C | INF-ATUAL parcial | `count_start` e `number_placement` start/end/none | `group_templates` | inspeção do CHECK | Não renumera grupos já gravados por este campo | Não renumerar existentes |
| GRP-CRG-06 | OBS-C | INF-ATUAL parcial | `reserve_target`, `capacity` 1–1024, `margin` | `group_templates` | `client-area.test.ts` não reexecutado | 3 e 350 são exemplos. Teto 8 da oferta Meta não entrou | Não reduzir o teto |
| GRP-CRG-07 | OBS-M | BLOQ-EXT | Só `admins_only` persiste. Sem aprovação, recusa automática, comunidades, mensagens temporárias | coluna `admins_only` | inspeção | Efeitos NT. README já marca vários controles desligados | Não ligar efeito externo |
| GRP-CRG-08 | OBS-M | DEC-07 | Sem modo seguro | ausência | — | Fala não é regra | Não implementar |
| GRP-CRG-09 | OBS-M | BLOQ-EXT | Sem fechar em 24h | ausência | — | NT | Não implementar |
| GRP-CRG-10 | OBS-M | invariante do PM | Salvar o modelo regrava só `group_templates` nos campos já aceitos. Grupos preexistentes, de outra campanha e de outra organização, ficam iguais | `src/lib/data.ts` `saveTemplate` | `src/lib/template-save-invariant.test.ts` | Foto, modo seguro e demais campos não implementados continuam lacuna. Sem criação externa | Provado o invariante nos campos suportados. Não é o módulo do modelo |
| GRP-CRG-11 | OBS-M | LAC | Sem administradores de grupo | sem tabela | ausência | DDI/número não confirmados | Não implementar |
| GRP-CRG-12 | OBS-M+PROP | BLOQ-EXT | Salvar template não enfileira criação externa. `whatsapp.create_group` fica bloqueado | `jobs.ts` / gateway | testes de fila não reexecutados | Vínculo salvar→ação da referência não é o contrato local | Não declarar grupo criado |
| GRP-IMP-01 | OBS-M | FIN | Importação é POST local, não assistente Onde/Conta/Grupos/Confirmar | API `groups/import` | `campaign-scope.test.ts` não reexecutado | Etapa Confirmar do vídeo não amostrada | UI no fim |
| GRP-IMP-02 | OBS-M | BLOQ-EXT | Não lista grupos do provedor nem exige admin externo | import local | mesmo teste | NT | Não baixar convite |
| GRP-IMP-03 | OBS-M+PROP | INF-ATUAL | Reimportar o mesmo convite local não duplica, no contrato já testado antes | import | `campaign-scope.test.ts` | Não é idempotência contra a lista ao vivo do WhatsApp | Não afirmar sync |
| GRP-IMP-04 | OBS-E | INF-ATUAL parcial | A importação grava grupos; não vi fila “Importar grupos” como job de provedor | `groups` | inspeção | OBS-E não prova o job | Não criar job externo |
| GRP-IMP-05 | OBS-M+FALA | DEC-08 | Nome informado na linha local é gravado. Sem “padronizar” | import | inspeção | Opções não confirmadas | Não renomear por padrão |
| GRP-IMP-06 | INF | INF-ATUAL | Importação local, limite 100 linhas e 131072 bytes, sem rede | `import-bound.test.ts`, `http-scope.test.ts` | arquivos existem; não reexecutados | Não é leitura do provedor | Manter |
| GRP-FIL-01 | OBS-M | INF-ATUAL | Status `queued`, `scheduled`, `processing`, `succeeded`, `failed`, `blocked`, `cancelled` | `scheduled_jobs` | `queue.test.ts` não reexecutado | Não é a máquina visual da referência. Transições dela não foram demonstradas | Não renomear status legado |
| GRP-FIL-02 | OBS-M | escopo aprovado; intervalo técnico | `GET /api/v1/jobs` aceita `from`/`to` inclusivos sobre `run_at`, instante com `Z` ou `±HH:MM`. Sem eles, a lista anterior permanece | `src/lib/jobs.ts` `listJobsPage` | `src/lib/job-window.test.ts` | Não é fato do vídeo. Sem Agrupar, sem filtro em `created_at` e sem tela. `run_at` não é nulo | Feito o intervalo. Não é a fila inteira |
| GRP-FIL-03 | OBS-M | DEC-10 | Há cancelamento de job. Sem massa “enviar agora / reenviar travadas” | API `jobs/[id]/cancel` | inspeção | “Travada” é DEC-10 | Não inventar massa |
| GRP-FIL-04 | OBS-E | fatos por tentativa; docs precisos | Início, fim e `duration_ms` ficam na tentativa. Finish terminal sela sucesso, bloqueio e falha. Retry usa duas escritas separadas. Durabilidade própria só sem transação externa | `src/lib/jobs.ts` | `src/lib/execution-times.test.ts` | Sem selo visual, sem agregado no item e sem duração de envio. Idempotência da API não foi alterada | Registro por tentativa segue aberto. Não é a fila inteira |
| GRP-FIL-05 | OBS-M | FIN | Página `/fila` existe. Não é o assistente de sete etapas | `fila/page.tsx` | inspeção | Tela não prova o assistente | UI no fim |
| GRP-FIL-06 | OBS-M | DEC-10 | Sem os ícones verde/vermelho/amarelo como contrato | — | — | Significado aberto | Não implementar |
| GRP-FIL-07 | DIR+PROP | INF-ATUAL | `whatsapp.send` e `whatsapp.create_group` bloqueiam antes de rede. Sucesso local não é efeito Meta | `gateway.ts`, `jobs.ts` | `product.test.ts`, `local-effect-replay.test.ts` não reexecutados | Conclusão recusada não vira sucesso de negócio no contrato do finish | Não simular enviado/criado |
| GRP-FIL-08 | PROP | INF-ATUAL | `job.tick` conta avaliação; `tick.observation` só com `GRUPOS_TICK_OBSERVATION=v1` | `jobs.ts`, `job-runner.ts` | `tick-observation.test.ts` não reexecutado | Não renomeia campo legado | Não reabrir |
| GRP-VGC-01 | OBS-M | PEND-ORDEM | Sem os oito KPIs por período | página de campanha mostra cliques/reservas locais | inspeção | DEC-14. Ingresso confirmado continua nulo | Não inventar percentual |
| GRP-VGC-02 | OBS-M | FIN | Há página da campanha | `campanhas/[id]` | inspeção | Não é o card da referência | UI no fim |
| GRP-VGC-03 | OBS-M | PEND-ORDEM | `redirect_token` único por campanha e rota `/r/[token]` | `campaigns.redirect_token` | `routing` / reserva, testes não reexecutados | DEC-11 formato/domínio. Editar token não foi o contrato lido | Não trocar o formato |
| GRP-VGC-04 | OBS-M | PEND-ORDEM | Sem gráficos diários | ausência | — | — | Não implementar |
| GRP-VGC-05 | FALA+PROP | INF-ATUAL | Clique em `routing_log` não incrementa `occupancy`. Ocupação é a informada mais reserva ativa | `routing.ts`, `reservations` | `reservation.test.ts` não reexecutado | Política local, não a fala do vídeo | Não fazer clique ocupar vaga |
| GRP-VGC-06 | OBS-M | FIN | Sem menu lateral de recursos da campanha | página | inspeção | — | UI no fim |
| GRP-REC-01 | OBS-M | PEND-ORDEM | Sem tags | sem tabela | ausência | LAC-04 | Não implementar |
| GRP-REC-02 | OBS-M | PEND-ORDEM | Sem variáveis Nome/Tipo/Valor de campanha. Bloco `variable` de mensagem é outro contrato | `message_blocks.kind` | `messages.test.ts` | Não é a tabela de variáveis da referência | Não fundir os dois |
| GRP-REC-03 | OBS-M | PEND-ORDEM | Sem cookie de redirecionamento | ausência | — | Fala não é regra | Não implementar |
| GRP-REC-04 | OBS-M | PEND-ORDEM | Sem anti-hacker | ausência | — | Eficácia excluída (EXC-03) | Não implementar |
| GRP-REC-05 | OBS-M | PEND-ORDEM | Sem verificação de colaboradores | ausência | — | Semântica aberta | Não implementar |
| GRP-REC-06 | OBS-M | BLOQ-EXT | Sem Hotmart nem grupo VIP | ausência | — | NT. Nome de terceiro não é compromisso | Não implementar |
| GRP-REC-07 | OBS-M | PEND-ORDEM | Sem gestão de comunidades | ausência | — | — | Não implementar |
| GRP-REC-08 | OBS-M | BLOQ-EXT | Sem atualizar ou redefinir link no provedor | ausência | — | NT | Não implementar |
| GRP-REC-09 | OBS-M | BLOQ-EXT | Sem remover lead de campanhas anteriores | ausência | — | NT | Não implementar |
| GRP-REC-10 | OBS-M | PEND-ORDEM | Sem deep link, pixel, desafio ou tradução | ausência | — | LAC-05 | Não implementar |
| GRP-REC-11 | OBS-M | PEND-ORDEM | Sem checagem de participantes duplicados | ausência | — | — | Não implementar |
| GRP-REC-12 | OBS-M | PEND-ORDEM | Métricas da campanha são contagens locais, não o item “Métricas” da referência | página | inspeção | DEC-14 | Não inventar fórmula |
| GRP-MSG-01 | OBS-M | FIN | Sem editor de três colunas | aba Mensagens desabilitada | inspeção | DIR-02 | UI no fim |
| GRP-MSG-02 | OBS-M | BLOQ-EXT | Blocos só `text`, `link`, `variable`. Sem enquete, mídia, contato, evento, figurinha | CHECK em `message_blocks` | `messages.test.ts` não reexecutado | Envio real NT | Não acrescentar tipo |
| GRP-MSG-03 | OBS-M | BLOQ-EXT | Sem formatação, IA, emoji ou modelos no editor | ausência na UI | — | IA é NT | Não implementar |
| GRP-MSG-04 | OBS-M | aceite do PM; cadeia na API | `PUT` grava a lista inteira. A ordem observada é a da releitura. `baseVersion` antiga responde 409 e não cria versão | `src/lib/messages.ts` `saveMessage` | `src/lib/message-order.test.ts` | A resposta não traz id de bloco. Não é o editor. Sem spintax e sem tipo novo | Provada a cadeia A/B/C. Não é o módulo de mensagem |
| GRP-MSG-05 | OBS-C | PEND-ORDEM | Sem spintax | ausência | — | Sem garantia anti-spam | Não implementar |
| GRP-MSG-06 | OBS-M | BLOQ-EXT | Sem marcar todos, mensagem temporária, fixar ou velocidade | ausência | — | NT | Não implementar |
| GRP-MSG-07 | OBS-C | INF-ATUAL parcial | Fuso está em automação e job, não no pacote de envio da referência | `automations.timezone`, `scheduled_jobs.timezone` | `daily-weekly-*.test.ts`, `monthly.test.ts` não reexecutados | Valores de exemplo não são regra de envio | Não criar pacote de envio |
| GRP-MSG-08 | OBS-M | INF | Versões de mensagem existem. Tela de modelos não | API `messages/versions` | `page.test.ts` não reexecutado | ZZZ-08. Aba da campanha continua desabilitada | Não tratar versão como a tela de modelos |
| GRP-MSG-09 | INF+PROP | INF-ATUAL | Migração das quatro tabelas recusa extensão fora do contrato | `message-link-migration.ts` | `message-link-*.test.ts`, `check-literal-classification.test.ts` até `0892485` | Não é parser SQL universal | Não reabrir |
| GRP-ACM-01 | OBS-M | PEND-ORDEM | Sem assistente de sete etapas. A etapa de grupos desse assistente não é seleção nova de alvos | ausência | — | — | Não implementar |
| GRP-ACM-02 | OBS-M | PEND-ORDEM | Job aponta uma campanha, não seleção múltipla | `scheduled_jobs.campaign_id` | inspeção | — | Não implementar |
| GRP-ACM-03 | OBS-M | PEND-ORDEM | Sem etapa de contas do assistente. Não é seleção de grupos | ausência | — | FK de conta é outro contrato (ASC-03) | Não fundir |
| GRP-ACM-04 | OBS-M | BLOQ-EXT | Sem ação “trocar configuração” no provedor | ausência | — | NT | Não implementar |
| GRP-ACM-05 | OBS-M | BLOQ-EXT | Sem privacidade avançada | ausência | — | NT | Não implementar |
| GRP-ACM-06 | FALA | PEND-ORDEM | Sem ações em massa de nome, descrição e admins | ausência | — | Telas não amostradas | Não implementar |
| GRP-ACM-07 | OBS-M | INF-ATUAL parcial | Job tem `run_at` e fuso. Não é o resumo do assistente | `scheduled_jobs` | `queue.test.ts` | Data de exemplo não é default | Não copiar o resumo |
| GRP-ACM-08 | OBS-M+PROP | PEND-ORDEM | Idempotência de job por chave. Sem “agendar e programar outra” | `idempotency_key` | `queue.test.ts` | Segunda ação não amostrada | Não inventar o segundo botão |
| GRP-ACM-09 | DIR | BLOQ-EXT | Envio agendado não fica “enviado” | kinds WhatsApp bloqueados | `product.test.ts` | — | Não simular envio |
| GRP-AUT-01 | OBS-M | PEND-ORDEM | API de automação, sem assistente. Gatilho do vídeo não existe | `automations` | `monthly-http.test.ts` não reexecutado | Etapa Gatilho não amostrada | Não inventar gatilho |
| GRP-AUT-02 | OBS-M | PEND-ORDEM | Automação é da campanha, sem “todos os grupos / específicos” | `automations.campaign_id` | inspeção | — | Não implementar |
| GRP-AUT-03 | OBS-M | DEC-06 | A orientação histórica era não criar o gatilho «ao encher grupo». A decisão direta de 07/11/2026 exige esse gatilho nos dois sinais: status gravado `full` ou teto local atingido. Esta fatia não o emite. `action_kind` continua revisão, expiração ou WhatsApp bloqueado | `action_kind` é revisão, expiração ou WhatsApp bloqueado | inspeção; `src/lib/group-fullness.test.ts` não emite evento | A demanda está registrada e não implementada. Sobreposição, rearme e consumidor continuam em aberto. O filtro `fullness` não prova o gatilho | Não tratar o filtro como gatilho. A emissão continua pendente |
| GRP-AUT-04 | OBS-M | escopo aprovado; duplicar uma, filtro de lista e massa de estado | `POST /api/v1/automations/{id}/duplicate` copia uma automação pausada. `GET /api/v1/automations?status=` filtra por igualdade de `active`, `paused` ou `completed`. Sem o parâmetro, a lista inteira permanece. Depois, `POST /api/v1/automations/bulk` grava `active` ou `paused` na seleção explícita, sem inverter, sem reviver `completed` e sem recalcular `next_run_at` | `src/lib/jobs.ts` `duplicateAutomation`, `listAutomations`, `applyAutomationBulk` | `src/lib/automation-duplicate.test.ts`, `src/lib/automation-status-filter.test.ts`, `src/lib/automation-bulk-state.test.ts` | Sem JSON, sem duplicar ou excluir em massa, sem 7/14/28 e sem webhook. `completed` não é o rótulo Desativado. O toggle individual e o lote não recalculam `next_run_at` nem cancelam a fila. Não é o gatilho ao encher | Feitas a cópia de uma, o filtro pelo status gravado e a ativação ou pausa da seleção. Não é o módulo de automação |
| GRP-AUT-05 | OBS-C | INF-ATUAL parcial + DEC-15 | Recorrência `once`, `daily`, `weekly`, `monthly`. Não há 7/14/28. Mensal tem dia 1–31, `skip`/`last_day` e políticas de lacuna/ambiguidade. Diária/semanal só mudam se as duas políticas vierem juntas | `db.ts`, `schedule` | `monthly.test.ts`, `daily-weekly-policy.test.ts`, `daily-weekly-proof.test.ts` | O anexo manda reconfirmar e não reverter legado. 7/14/28 do vídeo não substituem esse contrato | Não introduzir 7/14/28 nem reescrever linha antiga |
| GRP-AUT-06 | OBS-M | BLOQ-EXT | Sem automação sob webhook | ausência | — | NT | Não implementar |
| GRP-AUT-07 | INF+PROP | INF-ATUAL | O estado vigente lido no schema é o da linha AUT-05, não um snapshot antigo de “só mensal” | `db.ts` CHECK | mesmos testes, não reexecutados | Este confronto não manda reverter | Não reverter |
| GRP-PRJ-01 | OBS-M | recorte provado; exclusão do vazio e edição limitada | `DELETE` apaga o projeto sem campanha. Com campanha, recusa e o vínculo fica. `PATCH` de nome e descrição, com `archived` igual, preserva derivados e sobrevive a fechar/reabrir | `src/lib/data.ts` `deleteProject`, `updateProject` | `src/lib/project-delete.test.ts`, `src/lib/project-edit-persist.test.ts` | DEC-16 segue aberto. A edição não é o requisito inteiro | Provada a exclusão do vazio e, à parte, a edição de metadados. Não é o destino dos itens |
| GRP-PRJ-02 | OBS-M | DEC-14 | Sem os oito KPIs do projeto | página de projetos | inspeção | Agregação não demonstrada | Não inventar soma |
| GRP-PRJ-03 | OBS-M | contas e webhooks de configuração derivados | `counts.accounts` segue as duas colunas das campanhas. `counts.webhooks` conta configurações distintas ligadas explicitamente a essas campanhas. PM base `5f74532b2c28` preservado | `src/lib/data.ts` | `src/lib/project-accounts.test.ts`, `src/lib/incoming-webhooks.test.ts` | Sem receptor, URL, segredo ou evento. Sem KPI de período nem DEC-16 | Derivação local feita. Não é o projeto inteiro |
| GRP-PRJ-04 | FALA+PROP | INF-ATUAL | Isolamento é por organização, não por projeto como cliente | `organization_id` | `api.integration.test.ts` não reexecutado | Projeto não é tenant | Não tratar projeto como organização |
| GRP-MET-01 | OBS-M | PEND-ORDEM | Sem chips de atalho globais | ausência | — | — | UI / não implementar |
| GRP-MET-02 | OBS-M | PEND-ORDEM | Sem card Alertas | ausência | — | — | Não implementar |
| GRP-MET-03 | OBS-M | escopo aprovado; parcial | `counts.idleAccounts` no `GET` das contas: distintas, sem campanha `active` em `creator_account_id` ou `sender_account_id`. `paused` não conta como ativa | `src/lib/data.ts` `countIdleAccounts` | `src/lib/idle-accounts.test.ts` | Expostas e cobertura continuam DEC-14. Sem lista, sem tela | Feita só a contagem de ociosas. Não é o card de métricas |
| GRP-MET-04 | OBS-M | DEC-14 | Sem operação do dia | ausência | — | — | Não implementar |
| GRP-MET-05 | OBS-M | PEND-ORDEM | Sem as duas listas | ausência | — | Desconexão é NT | Não implementar |
| GRP-MET-06 | FALA | LAC-06 | Sem funil | ausência | — | Não amostrado | Não implementar |
| GRP-LSC-01 | OBS-C | DEC-17 | Sem pontos nem tipos de evento | sem tabela | ausência | Valores 10–60 são exemplo. Cálculo NT | Não implementar |
| GRP-LSC-02 | OBS-M | BLOQ-EXT | Sem gráfico por hora | ausência | — | Eventos de provedor | Não implementar |
| GRP-LSC-03 | OBS-M | PEND-ORDEM | Sem tabela de leads | ausência | — | — | Não implementar |
| GRP-ATV-01 | OBS-M | PEND-ORDEM | Há `domain_events` interno. Não é a aba Atividades da campanha | `domain_events` | inspeção | LAC-07. Conteúdo do vídeo desconhecido | Não inventar a aba |
| GRP-SOL-01 | OBS-M | PEND-ORDEM | Sem solicitações de entrada | sem tabela | ausência | — | Não implementar |
| GRP-SOL-02 | OBS-M | BLOQ-EXT | Sem aprovar/recusar | ausência | — | NT | Não implementar |
| GRP-SOL-03 | OBS-M | PEND-ORDEM | Sem estados dessa lista | ausência | — | — | Não implementar |
| GRP-SOL-04 | FALA+PROP | LAC-08 | Sem auto-aprovação e sem tag | ausência | — | Configuração não amostrada | Não criar aprovação implícita |
| GRP-SOL-05 | OBS-M | BLOQ-EXT | Recusa automática no template não existe. Bloqueio local é outra tabela e entra na rota do link | `blocklist`, `campaign_blocks`, `resolveEntry` | `campaign-scope.test.ts`, `product.test.ts` não reexecutados | Não é o toggle do template | Não fundir com CRG-07 |
| GRP-ASP-01 | OBS-M | PEND-ORDEM | Sem as três abas anti-spam | página `/bloqueios` é lista da organização | inspeção | Aba de contas não amostrada no vídeo | Não copiar as abas |
| GRP-ASP-02 | OBS-M | escopo aprovado; CSV da organização | `POST /api/v1/blocklist/import`: colunas `phone_e164` e `reason` opcional; `addBlock` segue recusando duplicata sem trocar motivo | `src/lib/blocklist-import.ts`; `src/app/api/v1/blocklist/import/route.ts` | `src/lib/blocklist-import.test.ts`, inclusive rollback depois do primeiro INSERT por trigger só da fixture | Sem lista administrativa no schema. Sem CSV admin, exportação, análise de grupos ou máscara nova. A listagem individual continua devolvendo o telefone já gravado | Feito o CSV. Não é o módulo anti-spam |
| GRP-ASP-03 | OBS-M | DEC-18 | Sem lista de números administrativos | ausência | — | Precedência aberta | Não implementar |
| GRP-ASP-04 | FALA | PEND-ORDEM | Sem anti-spam global entre organizações. A lista não atravessa organização | FK `organization_id` | `product.test.ts` | Compartilhamento global não provado | Não criar lista global |
| GRP-BLK-01 | OBS-M | PEND-ORDEM | Sem entidade blacklist nomeada. Há bloqueio da organização e bloqueio da campanha | `blocklist`, `campaign_blocks` | `campaign-scope.test.ts` | Não é a tela de duas abas | Não criar terceira lista sem ordem |
| GRP-BLK-02 | OBS-M+PROP | PEND-ORDEM | `campaign_blocks` vale só para a campanha. Não é checkbox de blacklist | `campaign_blocks` | `campaign-scope.test.ts` | Efeito da seleção do vídeo não demonstrado | Manter o isolamento já testado antes; não reexecutado aqui |
| GRP-IAG-01 | OBS-M | BLOQ-EXT | Sem agente de IA | ausência | — | — | Não implementar |
| GRP-IAG-02 | OBS-M | BLOQ-EXT | Sem assistente | ausência | — | — | Não implementar |
| GRP-IAG-03 | OBS-C | BLOQ-EXT | Sem campo de credencial de IA | ausência | — | Não reproduzir credencial em claro | Não implementar |
| GRP-IAG-04 | OBS-M | BLOQ-EXT | Sem treinamento | ausência | — | — | Não implementar |
| GRP-IAG-05 | OBS-M | DEC-19 | Sem regras de remover pessoa ou apagar mensagem | ausência | — | NT e revisão humana são proposta | Não implementar |
| GRP-IAG-06 | OBS-M | BLOQ-EXT | Sem escopo privado/campanhas de agente | ausência | — | — | Não implementar |
| GRP-IAG-07 | OBS-M | BLOQ-EXT | Sem threads | ausência | — | — | Não implementar |
| GRP-WHE-01 | OBS-M | configuração local | `GET/POST/PATCH/DELETE /api/v1/incoming-webhooks` cadastra, lista, edita e arquiva. `integrationStatus` é `not_integrated`. Versão inválida é 400; versão antiga válida é 409 | `src/lib/incoming-webhooks.ts` | `src/lib/incoming-webhooks.test.ts`, `src/lib/incoming-webhooks-gaps.test.ts` | Sem UI e sem recepção | Feito o cadastro. Não é a integração |
| GRP-WHE-02 | OBS-M | BLOQ-EXT | Sem plataformas | ausência | — | Cada uma exigiria contrato | Não implementar |
| GRP-WHE-03 | OBS-M | vínculo explícito | Detalhe traz `campaignIds` do N:N `incoming_webhook_campaigns`. Não infere conta nem automação. Arquivar conserva os pares | `src/lib/incoming-webhooks.ts` | `src/lib/incoming-webhooks.test.ts`, `src/lib/incoming-webhooks-gaps.test.ts` | Sem URL, segredo ou eventos | Feito o vínculo. Não é o detalhe da referência |
| GRP-WHE-04 | OBS-M | BLOQ-EXT | Sem assistente | ausência | — | — | Não implementar |
| GRP-WHE-05 | OBS-M | BLOQ-EXT | Sem eventos de compra | ausência | — | Contrato externo | Não implementar |
| GRP-WHE-06 | OBS-M | BLOQ-EXT | Sem SMS, ligação ou HTTP de saída | ausência | — | NT | Não implementar |
| GRP-WHS-01 | OBS-M | BLOQ-EXT | Sem webhook de saída | ausência | — | — | Não implementar |
| GRP-WHS-02 | OBS-M | BLOQ-EXT | Sem erro de conector | ausência | — | Persistência não demonstrada no vídeo | Não implementar |
| GRP-WHS-03 | OBS-M | BLOQ-EXT | Sem destino nem credencial de hook | ausência | — | Não reproduzir segredo em claro | Não implementar |
| GRP-WHS-04 | OBS-C | BLOQ-EXT | Sem limite de erros | ausência | — | Valor é exemplo | Não implementar |
| GRP-WHS-05 | DIR | BLOQ-EXT | Nenhum envio externo | gateway recusa | `product.test.ts` | — | Não enviar |
| GRP-BRD-01 | OBS-M | BLOQ-EXT | Sem broadcast | ausência | — | DEC-20 | Não implementar |
| GRP-BRD-02 | OBS-M | DEC-20 | Três rótulos da sidebar não existem | `shell.tsx` | inspeção | Diferença semântica aberta | Não implementar |
| GRP-BRD-03 | FALA | BLOQ-EXT | Sem um a um, SMS ou ligação | ausência | — | NT | Não implementar |
| GRP-TRN-01 | OBS-M | DEC-09 | Sem cursos | ausência | — | Não inventar player | Não implementar |
| GRP-TRN-02 | OBS-M | DEC-09 | Sem progresso de aula | ausência | — | Player não confirmado | Não implementar |
| GRP-TRN-03 | OBS-M | DEC-09 | Sem widget | ausência | — | Suporte externo | Não implementar |
| GRP-ZZZ-01 | rótulo | DEC | Aba Diagnósticos desabilitada, sem conteúdo | página da campanha | inspeção | Conteúdo desconhecido | Não inventar |
| GRP-ZZZ-02 | rótulo | DEC | Aba Mensagens desabilitada. API de blocos existe e não é essa aba | página; API messages | inspeção | Não presumir que a aba seja a API | Não ligar a aba neste confronto |
| GRP-ZZZ-03 | rótulo | DEC | Sem mensagens recebidas | ausência | — | NT | Não inventar |
| GRP-ZZZ-04 | rótulo | DEC | Sem calendário | ausência | — | Não presumir | Não inventar |
| GRP-ZZZ-05 | rótulo | DEC | Sem painel global de variáveis | ausência | — | Parcial no anexo | Não inventar |
| GRP-ZZZ-06 | rótulo | DEC | Sem deep link global | ausência | — | — | Não inventar |
| GRP-ZZZ-07 | rótulo | DEC | Sem alertas globais | ausência | — | — | Não inventar |
| GRP-ZZZ-08 | rótulo | DEC | Versões por campanha, sem tela de modelos | API versions | `page.test.ts` não reexecutado | INF do anexo não certifica a tela | Não inventar a tela |
| GRP-ZZZ-09 | rótulo | DEC | Sem leads globais | ausência | — | — | Não inventar |
| GRP-ZZZ-10 | rótulo | DEC | Sem SendSpace | ausência | — | Nome de terceiro | Não inventar |
| GRP-ZZZ-11 | rótulo | DEC | Sem API pública “SendAPI” | rotas `/api/v1` são as do produto | inspeção | Não definir API pública nova | Não inventar |
| GRP-ZZZ-12 | rótulo | DEC | Sem MCP | ausência | — | — | Não inventar |
| GRP-ZZZ-13 | rótulo | DEC | Histórico de tentativas de job existe na API; não é o item Histórico da sidebar | API `jobs/history` | `page.test.ts` não reexecutado | Não igualar os dois | Não inventar o item |
| GRP-ZZZ-14 | rótulo | DEC-21 | Sem equipe nem papéis além de operador e associação | `operators`, `memberships` | `panel-auth.test.ts` não reexecutado | Admin global não demonstrado | Não inventar admin |
| GRP-ZZZ-15 | rótulo | DEC | Sem mapa contas × campanhas | ausência | — | Só cartão no vídeo | Não inventar |
| GRP-VIS-01 | OBS-M | FIN | Tema escuro provisório existe | páginas | inspeção | Não é certificação visual | Outro responsável |
| GRP-VIS-02 | OBS-M | FIN | Cor de destaque local não é decisão DEC-01 fechada | páginas | inspeção | 88–96% não foi medido | Outro responsável |
| GRP-VIS-03 | OBS-M | FIN | Tipografia do app, sem métrica | inspeção | — | — | Outro responsável |
| GRP-VIS-04 | OBS-M | FIN | Há componentes de painel, não o catálogo inteiro | `components/` | inspeção | — | Outro responsável |
| GRP-VIS-05 | OBS-M | FIN | Alguns estados locais; não o conjunto da referência | inspeção | — | — | Outro responsável |
| GRP-VIS-06 | DIR | FIN | Alvo informado, não medido | — | — | Sem metodologia | Não declarar percentual |
| GRP-EXC-01 | EXC | EXC | Sem planos, preços ou checkout | ausência | ausência demonstrada | Excluído | Não implementar |
| GRP-EXC-02 | EXC | EXC | Sem marca, capas ou nomes de clientes da referência | inspeção | — | Excluído | Não copiar |
| GRP-EXC-03 | EXC | EXC | Sem eficácia anti-ban como requisito | docs de provedor | inspeção | Excluído | Não registrar como função |
| GRP-INT-01 | DIR | INF-ATUAL + BLOQ-EXT | Preparo ES v5 regular, sem conta e sem rede | `embedded-signup.ts` | `embedded-signup.test.ts` não reexecutado | Não prova Groups, Graph nem OBA | Não conectar |
| GRP-INT-02 | DIR+PROP | INF-ATUAL | Abertura guarda selo, não o estado bruto. `connected` é falso. Observação recusa `code` | `embedded-signup.ts`, `signup_intents` | `signup-replay.test.ts` não reexecutado | Contrato oficial da troca pendente | Não chamar a Meta |
| GRP-INT-03 | DIR | BLOQ-EXT | Sem app, conta ou autorização de ativação | readiness `not_configured` / `configured_unverified` | inspeção | — | Não ativar |
| GRP-INT-04 | PROP | INF-ATUAL | Criar grupo, enviar, participantes e recibos recusam antes de rede | `gateway.ts` | `product.test.ts` não reexecutado | — | Manter o bloqueio |
| GRP-INT-05 | INF | BLOQ-EXT | `exchange` é `not_implemented`. Mudar isso seria função nova | `embedded-signup.ts` | `docs/provedores.md` | O anexo pede reconfirmar e não reverter. O código vigente ainda recusa a troca | Não implementar a troca |

## Reconciliação com a R39

A R39, em `docs/reconciliacao-r39.md`, foi documental e anterior a este anexo. A aprovação de 09:28 substitui só o bloqueio de escopo global daquele registro. Não apaga regressão nem autoriza DEC, conta, envio ou deploy. Backup (`VACUUM INTO`, leitura, `quick_check`, publicação, sem corrida até o rename) e login (janela móvel, 8ª resposta 401, seguinte 429) continuam os contratos lidos em `scripts/backup-db.ts`, `identity.ts` e nos testes `backup-restore.test.ts`, `backup-identity.test.ts`, `login-window-edge.test.ts`. ENG-07 e ENG-08 pedem esse contrato existente. Restauração nova e troca `exchange` continuam sem ordem específica.

## Primeira fatia de backend

As 182 linhas acima permanecem. A fatia GRP-GRU-05 foi implementada na API depois do parecer, sem tela e sem alterar DEC-06. O quadro abaixo é o recorte que a implementação seguiu.

| | |
|---|---|
| ID | GRP-GRU-05. Não inclui GRU-04, GRU-06 nem GRU-08 |
| Ausência | Não há rota nem função de massa. `updateGroup` e `deleteGroup` alteram um id |
| Contrato a preservar | Mesma organização e mesma campanha. `status=full` ou volta a `available` só quando a regra já usada em `shapeGroup` permitir. Exclusão só com confirmação explícita, no mesmo espírito do projeto. Chave de idempotência, como os outros POST. Nenhuma chamada a provedor. Ocupação, `routing_log` e reservas não mudam. DEC-06 não é resolvida: o teto calculado e o `status` continuam os dois no `groupIneligibility` |
| Fora | Tela, seleção visual, atualizar link, exportar, duplicados, WhatsApp |
| Aceite proposto | Ids da campanha mudam juntos. Id de outra campanha ou organização não altera nada e não revela o registro. Marcar cheio não muda ocupação nem contagem de cliques. Exclusão sem confirmação não apaga. Repetir a mesma chave não aplica de novo. Grupo cheio sai da rota; a lotação calculada dos outros grupos permanece |
| Evidência desta rodada | Inspeção estática de `src/lib/data.ts` e de `src/app/api`. Sem teste novo e sem suíte |

As outras lacunas ficam de fora deste pacote: tela (DIR-02), provedor (INT, envio, webhook, IA, broadcast), e DEC ainda abertas (viral, papéis de conta, fórmulas, 7/14/28, efeito de excluir projeto, leadscoring, admin).
