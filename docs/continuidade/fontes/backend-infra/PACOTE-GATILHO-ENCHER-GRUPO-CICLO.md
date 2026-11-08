# GATILHO-ENCHER-CICLO — revisão documental R3, ESPECIFICAÇÃO PENDENTE

**Revisão:** 07/11/2026 18:40:59 America/Sao_Paulo (UTC−3). Mesmo contrato/fatia **AUT03/FLX05**, não novo pacote. **NÃO PRONTO PARA DESPACHO OU EXECUÇÃO.** O coordenador não autorizou despacho. Esta revisão retira propostas inadequadas e consolida as decisões funcionais mínimas em §5, sem reabrir OR/ciclo.

Somente leitura documental e edição deste Markdown. Sem repo/Git/DB/projeto/testes/cloud/código operacional/mensagens/externo. PM, matriz, ADERENCIA e decisão histórica **não alterados**. Nada enviado ao escritor/peers/Referência. Engenharia abaixo é proposta condicionada, **não contrato executável fechado**.

### Registro de revisão R3 — 07/11/2026 18:44:05 America/Sao_Paulo (UTC−3)

R2 anterior preservada na rastreabilidade: **177linhas, SHA256 `16ec561d03ea033e3a5bdbb9024fb1e90ecd118fc3669e691318b846c2f16d78`**. Esta R3 consolida o **ADENDO R2 da Referência**, lido integralmente junto ao parecer original: `/workspace/grupos-referencia-visual/PARECER-GATILHO-ENCHER-GRUPO-CICLO.md`, **L64–106**, hash atual`4d7c3ac95c0001f4f30242665e7f7936a3cb60adca0c5fc48425295575304008`. O parecer não foi alterado; seu histórico próprio de correção de horário está em **L67** e não é reescrito por esta frente.

**Delta R3:** Q3 separa acionadores e destinatários, sem inventar opções para acionadores; Q1/Q2 ficam agrupadas em QI com contextos e respostas eventualmente diferentes; Q4 permanece. MSG07 L100 é confrontada nas oito colunas e a reconciliação da orientação **“Não criar pacote de envio”** fica **PENDENTE da coordenação**. AceiteD explicita acoplamento transacional: falha de persistência nova pode reverter mutação antiga. As duas pendências de coordenação/engenharia são separadas das perguntas de produto. **ESPECIFICAÇÃO PENDENTE/SEM DESPACHO**, sem autorização de G0/implementação.

## 1. Histórico explícito — propostas anteriores REJEITADAS, NÃO ATIVAS

Versão anterior deste mesmo arquivo: **172 linhas, SHA256 `8c4855b518d8a9504c669da94efcc6e3abe56818f2d25bbfd8242216a625de8e`**, confrontada pelo parecer da Referência de07/11/2026 **18:36 America/Sao_Paulo (UTC−3)**. Parecer localizado por listagem e **lido integralmente61linhas**: `/workspace/grupos-referencia-visual/PARECER-GATILHO-ENCHER-GRUPO-CICLO.md`, SHA256`57abcc45a747a0db3b103492d78c9dc67c545e33ad75267e78964bf58e77c297`. Localizadores abaixo são da versão anterior, conservados para rastrear a correção, **não instruções vigentes**.

| Proposta anterior | Registro da rejeição/correção | Estado R2 |
|---|---|---|
| §§3/7: `trigger_clock_regressed`/409 e erro de drift com rollback das mutações legadas | Parecer **L32–36** demonstra contradição com promessa de preservar API/efeitos de update/bulk/resolveEntry/release/expire | **RETIRADA.** Não há nova recusa por relógio/drift nas rotas legadas, com ou sem regra. §6 distingue limite/incerteza sem fabricar ocorrência. |
| §§5/6/8: capacity.review ou reservation.expire de campanha como ações obrigatórias da regra e critério de sucesso do gatilho grupal | Parecer **L46–50** reconhece alcance de campanha e falta da função Conta→Ação→Conteúdo; ordem atual rejeita substituto | **REJEITADA como recorte/aceite desta fatia.** Jobs locais antigos continuam intactos, mas não são default, consumidor substituto nem teste de homologação do objetivo AUT03/FLX05. |
| §5/6: tabela de targets/IDs específicos tratada como autorizada pelo PM AUT02 | Parecer **L37–40**: AUT02 PEND-ORDEM/“Não implementar” não autoriza seleção | **RETIRADA como autorização.** Não implementar IDs específicos nem “todos dinâmicos” até definir alcance funcional. Apenas fontes observadas são registradas; §5 Q3. |
| §4: nascimento/importação já cheio não dispara; migração/regra nova/reativada sempre prospectivas | Parecer **L42–45/52–57**: política não decidida, R1 nascimento é material | **NÃO ATIVAS.** Não são DEC ou defaults de engenharia. Q1/Q2 consolidam início de vigência e retroatividade; arquitetura não pressupõe resposta. |
| §8: consumidor/receipt local com execução de revisão/limpeza e ciclo tratado como entrega completa da função principal | Objetivo correto é automação grupal configurada com conta/ação/conteúdo; bloqueio real de provedor não pode ser escondido | **Aceite substituto retirado.** Futuro encadeamento local precisa preservar intenção grupal e chegar ao consumidor real **bloqueado**, sem falso envio; §4. |

Partes úteis mantidas **como engenharia condicionada**, não aprovação: identidade de ciclo, observação antes/depois, reconciliação da expiração sem intervalo novo, atomicidade ocorrência/enqueue/recibo, idempotência por regra/ocorrência, histórico honesto de tentativa/finish, migração sem reset, regressão e gates pósúltimo diff. DDL/API detalhados da versão anterior **não estão ativos**: dependiam das políticas retiradas e não devem ser copiados para o escritor.

## 2. Autoridade preservada, base e alcance

- **OR:** `DECISAO-DEC06-GRUPO-CHEIO.md` corpo original L1–43; mensagem direta verificada anteriormente por Backend, posição849, speakerIdcu:[ID-REDIGIDO]. Cada sinal basta, sem precedência nova. Não pedir de novo.
- **Ciclo:** adendo da mesma decisão, resposta direta **recebida pelo coordenador** às18h29 no widget **t210s872**, literal fornecido por ele às18h30: uma passagem não cheio→cheio, sem repetir enquantotrue, rearmando apósfalse. **Consulta Backend em torno da posição873 não exibiu a resposta do widget**; não há endereço próprio/posição exportável. Origem atribuída, suficiente à proposta, não leitura direta Backend nem autorização universal. Não pedir repetição.
- **Base R86 relatada aceita APENAS OR/filtros:** `f096ddc0b6c96137aca2a65ecca106a8fe063d7b`, pai a66de577…, **198 testes/52 arquivos + gates0 relatados**. QA145linhas integral já lida `/workspace/grupos-qualidade/AUDITORIA-INDEPENDENTE-DEC06-R86.md`, hash`6ed4f3d12206d4e120639dbe5850c799c208de88312b9ef8246c7f9c4ba1355a`, **L11–14/70–80/137–145**; gatilho não implementado. Sem nova certificação de Git/testes nesta revisão.
- Escritor único preservado `bc-68876892-0c2c-553d-9afb-372723d790a3`; **G0 somente após decisões/alinhamento e encaminhamento coordenado autorizado**, não agora.
- **Objetivo correto:** **GRP-AUT-03/FLX05** — automação por encher grupo: **campanha→grupo→gatilho→conta→ação→conteúdo→confirmar→fila**. Configuração não é envio; fila bloqueada não é função externa executada. Esta preparação não fecha AUT03, UI ou produção.

## 3. Investigação adicional — fila, ações e conteúdos, não só enum/relato

Antes de concluir as pendências, lidos/reutilizados integralmente nesta frente:

### 3.1 Fontes funcionais

- **PM final completo já lido**, hash`5f74532b2c2889d3a0c14c5deb3f906dbd846ffcf52c14fab70768b6fc52017c`; relidos nesta revisão **MSG01–09/ACM01–09/AUT01–07 L313–348**, inclusive limites/aceitação; **FLX05 L503**, legendaPROP L38–55, ENG03/04/08/09/11/12 L520–529. “Uma vez por ocorrência” é atendido pela regra de ciclo encaminhada, **não escolhe nascimento, vigência ou alvos**.
- **PARTE04 integral37linhas** (lida nesta frente): **L7–18** mostra etapa Grupo com opções **todos os grupos da campanha / grupos específicos**, depois Conta→Ação→Conteúdo; conteúdo “Enviar mensagem”; lista EncherGrupo+Fila. **L18/24:** etapa Gatilho não amostrada. Essas opções existem como observação, **não contrato de conjunto estático/dinâmico nem autorização da matriz**.
- **PARTE05 integral40linhas**, lida nesta revisão: **L7** resumo com Campanhas/Contas/Grupos/preview “Enviar mensagem”; **L9–10** ações manuais “Trocar configuração” e “Privacidade avançada”; **L11–18** automação recorrente tem Conta/Ação/Conteúdo e cronograma. **Não transferir automaticamente ações manuais, todo o menu ou semântica de recorrência para este gatilho.**
- **Parecer atual integral**, e **parecer DEC06 anterior integral41linhas** já lido: nenhuma dessas fontes valida políticas novas em nome do usuário ou comprova runtime. **Seleção POSR86 integral115linhas** já relida nesta mesma frente: mantém distinção tarefa/tentativa/efeito e investigação local, mas sua ambiguidade de ciclo foi superada **como encaminhada**, não nascimento/alvos.

### 3.2 Fontes efetivas de conteúdo e consumidor, integralidade delimitada

Resultados de ferramentas do dump `/workspace/cloud-agent-transcripts/bc-68876892-0c2c-553d-9afb-372723d790a3.jsonl`, somente campos públicos/resultado, nenhum repo:

1. **L7227 `turn-78:step:3:tool`**, **message-blocks.ts integral78linhas de conteúdo** (totalLines79): `MessageBlock={kind,body}`, kinds **text/link/variable**; variáveis **nome/campanha/grupo**, validador existente/normalização, limites30blocos/2000texto e preview. `previewBlocks` monta texto e placeholders, **não resolve/envia ao WhatsApp**. Não implementar spintax/mídia/outros~9tipos por analogia.
2. **L7229 `turn-78:step:4:tool`**, **messages.ts integral167linhas de conteúdo** (totalLines168): getMessage/saveMessage/readVersion/listagens; versão imutável e blocos por campanha, concorrência baseVersion, SELECT dos blocos porposition. **Não lê job/grupo/conta nem entrega conteúdo ao executor de envio.** Persistir mensagem não prova vínculo com automação. Fonte histórica R62, não blob atual certificado R86.
3. **L3485 `turn-25:step:3:tool`**, **gateway.ts integral115linhas de conteúdo** (totalLines116): `sendMessage(to,body)`/createGroup/listParticipants/readReceipts rejeitam com ProviderNotConfiguredError; statusnot_configured. **Contrato externo faltante preciso:** referência resolvível do grupo externo, credencial/sessão/permissões da conta, protocolo/capacidade de envio de conteúdo/recibos. Isso impede **envio real**, não cadastro/vínculo/fila/grupo de intenção local honesta.
4. **jobs.ts R80 integral1074linhas** já lido nesta frente (`grupos-evidencias-aut04-r80/jobs.ts`): enqueue L254–308 grava payload **só campaignId**; createAutomation L421–505 exige calendário/actionKind, não grupo/conta/versão de mensagem; materialize L957–1026 usa next_run_at; **executeJob L660–685** bloqueia whatsapp.send/create_group antes de rede, com **external:false/sent:false/groupCreated:false**. Não supor que o kindsend já receba alvos ou conteúdo; a ponte está ausente nesse corpo. Review/expire existem, mas não substituem a função.
5. **dispatch.ts R86 L762–867**, ramo completo das rotas pertinentes lido nesta revisão: POST automations envia calendário/actionKind; POST jobs envia campanha/kind/runAt/timezone; **não envia grupo/conta/conteúdo**; GET/PUT messages usa save/get separado. É **lacuna positiva da ponte configurada**, além da matriz, não ausência inferida por nome de teste.
6. **VERIFICACAO-RODADA-62.md integral75linhas**, lida nesta revisão: prova real de versões1→4/ordem/conteúdo kind/body/409 sem versão extra, test-only; não prova envio ou encadeamento gatilho→mensagem. Não reabrir esse aceite nem testá-lo de novo como função nova.
7. **data.ts R86 L75–85/1150–1206/1246–1321**, corpos completos já lidos: evento genérico e update/bulk, não ponte de gatilho→mensagem. **reservations.ts completo no dump L8936 `turn-103:step:12:tool`** já lido: COUNT(active,expires_at>t), release/expire; trechos entry L6337/L6347/L7037 são **parciais**, não função247linhas integral. G0 futuro lê integralmente os atuais antes de diff.

**Fontes atuais e limites:** README R86 seção Fila/automações **L47–84**, integral já lida, confirma ações locais reais e bloqueio externo; G0/teste R86/QA vinculam enum limitado e ausência de gatilho. Corpos históricos completos messages/gateway/jobs são arquitetura recebida, **não prova universal do HEAD R86**. G0 confirma equivalentes, fontes atuais, contratos de mensagem/atribuições e qualquer ponte nova; se existir equivalente, reaproveitar. Não concluir inexistência universal pelo read/rg parcial.

**Resultado da investigação:** conteúdo versionado, contas associadas, fila e recusa honesta existem; **o vínculo configurado grupal Conta/Ação/Conteúdo e o consumer que o recebe precisam de contrato novo**. Não é “tudo externo”; tampouco um job de limpeza/revisão atende ao produto.

## 4. Objetivo restaurado e menor proposta fiel — ainda NÃO autorizada

**Candidato de escopo para alinhar:** automação por ciclo de um grupo, com campanha/alcance de grupos e conta associada explicitamente configurados, ação e conteúdo grupal confirmados, gerando **intenção local de ação para os alvos corretos** e fila rastreável. **“Enviar mensagem”** é ação efetivamente vista neste fluxo (PARTE04 L8–18); os tipos de bloco já suportados são dados reutilizáveis, não integração real.

Possível encadeamento fiel, **condicionado às decisões §5 e ao parecer/coordenador**:
1. Regra declara campanha, **alcance ainda não decidido**, conta associada, ação grupal explicitamente escolhida e conteúdo/versão da configuração. **Nenhum default de ação/conta/targets**, nenhuma adoção das automações de calendário existentes.
2. Ciclo real confirmado pelos sinais decididos produz ocorrência por tenant/grupo/cycle. Cada regra aplicável gera uma intenção/entrega com conta/alvos/ação/conteúdo, sem trocar o grupo pelo campaignId genérico.
3. Consumidor local confirma/valida vínculo+versão+escopo e enfileira o tipo de ação grupal configurado. **No recorte sem provedor, executor chega a BLOCKED/provider_not_configured**, com sent:false e sem chamada de rede. Registro da intenção/delivery pode ser concluído localmente, mas **job de ação externa não vira succeeded/sent** e não marca mensagem entregue.
4. API/releitura distingue configurado, ocorrência detectada, intenção enfileirada, tentativa bloqueada e envio **não realizado**. Não usar texto/campo received/processed para sugerir envio/recepção externa.

**Não selecionados como substitutos:** capacity.review, reservation.expire, criação de grupo, ações administrativas não contratadas, renderização/spintax, novos tipos de bloco, resolver identidade externa, ativar sessão/credencial/provider. Jobwhatsapp.send legado e mensagem versionada por campanha são **partes a conectar**, não prova da ponte pronta.

O alcance mínimo tecnicamente representável seria um evento de um grupo com destino explícito; **isso NÃO autoriza “IDs específicos”**, nem resolve se ação vai ao grupo causador ou ao conjunto configurado. AUT02 PEND é orientação a resolver por decisão de produto, **não contornar por outro nome de tabela/rota**. Por isso não há esquema de targets/API nova executável nesta R2.

## 5. TODAS as decisões funcionais materiais mínimas — consolidadas agora

As **três perguntas consolidadas** abaixo cobrem o primeiro recorte **de uma vez**; QI reúne as antigas Q1/Q2 sem obrigar respostas iguais entre contextos. Coordenador confronta decisões/delegação já recebidas antes de consultar; não perguntar de novo o que estiver documentalmente decidido. **OR e ciclo NÃO entram**. Não se pedem DDL, IDs técnicos, locks, erros HTTP, hash, retry ou stack ao usuário.

| ID | Falta material e fonte | Pergunta mínima de produto para o coordenador consolidar | Opções/fontes e limite |
|---|---|---|---|
| **QI Início já cheio — consolida Q1/Q2** | Parecer original **L43–45/53–57** e adendo **L94**: o literal de ciclo não decide começar já cheio. Casos: **criado cheio; importado cheio; preexistente na migração; regra nova com grupo já cheio; reativação com grupo já cheio** | **Quando o sistema ou a regra passa a observar um grupo que já está cheio, deve disparar nesse início ou esperar voltar a não cheio e encher novamente? Indicar se o comportamento é diferente entre os cinco contextos.** | São casos concretos não decididos, não opções observadas no vídeo. Agrupamento não força resposta única: podem existir respostas distintas por contexto. Não transformar baseline/prospectividade em DEC nem reabrir OR/ciclo. As referências históricas a Q1/Q2 neste contrato passam a apontar aos respectivos contextos de QI. |
| **Q3 Grupos acionadores × destinatários e momento dos alcances** | **PM AUT02 L343/PARTE04 L7** dizem **“Enviar para...”** todos/específicos: destinatários. Parecer adendo **L85–90/95**: nenhuma fonte diz que essa seleção também limita quem aciona. Matriz R86 **L113** PEND/“Não implementar” | **Quais grupos, ao encher, acionam a regra; quais grupos recebem a ação; e em que momento cada um desses alcances é definido?** | Opções **verificadas só para destinatários:** “Enviar para todos os grupos da campanha” / “Enviar para grupos específicos da campanha”. **Não há opções de acionadores ou regra temporal verificadas**: pergunta aberta mínima para esses pontos. Não assumir os dois conjuntos iguais, IDs específicos autorizados ou grupo causador como destino único. Fala de capítulo “boas-vindas” é contexto, não opção observada/decisão. |
| **Q4 Ação/conteúdo do primeiro recorte** | **AUT01/FLX05** exige Conta→Ação→Conteúdo; **PARTE04 L8–18** mostra Enviar mensagem, mas jobs atuais não ligam mensagem/alvo/conta. Parecer original **L46–50** e adendo **L96** | **Qual ação grupal e conteúdo devem poder ser configurados nesta primeira entrega, e quando esse conteúdo deve ficar definido para a ocorrência?** | “Enviar mensagem” é visto no fluxo; backend suporta blocos text/link/variable. Trocar configuração/privacidade são da ação manual, não opções autorizadas automaticamente para este gatilho. Momento do vínculo do conteúdo/versão não demonstrado: pergunta aberta, sem impor latest/snapshot. |

**Por que Q4 não é pergunta técnica:** salvar a versão escolhida é engenharia; decidir que edições posteriores mudam ou não o conteúdo de uma ocorrência/ação altera **qual mensagem** se pretende enviar. Não embutir essa política em resolver “última versão” ou congelar conteúdo sem fonte. Conta associada validada/tenant/erros são invariantes existentes; não pedir papéis novos nem reabrir DEC04. Se a decisão já disser configuração confirmada imutável, a forma técnica de pinagem é nossa, não pergunta adicional.

**Bloco único preparado para eventual consulta do coordenador (não enviado):**
> Mantendo OR e ciclo já decididos: **(I)** ao começar a observar grupo já cheio, dispara no início ou espera voltar a não cheio e encher? Indique eventuais diferenças entre criado cheio, importado cheio, preexistente na migração, regra nova e reativação. **(II)** quais grupos, ao encher, acionam a regra, quais recebem a ação e quando cada alcance é definido? As opções vistas “Enviar para todos/específicos” são de destinatários; não há opções verificadas para acionadores. **(III)** qual ação grupal/conteúdo deve poder ser configurado nesta primeira entrega e quando esse conteúdo fica definido para a ocorrência? Nenhum envio externo será executado nesta etapa; registro/fila devem manter bloqueio real, sem falso envio.

É consolidação de **casos já faltantes no produto**, não perguntas geradas por novo schema. Se alguma resposta precisar ser determinada pelo coordenador sob delegação verificável já existente, registrar fonte exata; não tratar mera aprovação de proposta anterior ou silêncio como decisão. **Não mandar ao escritor até fechar o conjunto material.**

### 5.1 Pendências EXCLUSIVAS da coordenação/engenharia — não perguntar ao usuário

**C1 — MSG07 / orientação de escopo.** Matriz R86 **L100**, confrontada integralmente em §8.1: **“Não criar pacote de envio”** versus ponte de intenção local com grupo/conta/ação/conteúdo em §6.3. **Reconciliação PENDENTE do coordenador**, com fonte/limite/delegação exatos. A proposta não supera essa orientação por renomear “pacote” para “intenção”, nem porque provedor fica bloqueado. Não declarar autorização pelo PM, adendo do widget ou parecer. Referência não decide escopo pelo usuário. Essa orientação não vira pergunta adicional de produto/DDL.

**C2 — acoplamento transacional.** Parecer adendo **L91/105**: ocorrência/observer/intenção/enqueue compartilham commit/rollback com mutação legada. **Se a persistência nova falhar, pode reverter update/reserva/bulk que antes passaria.** É risco de compatibilidade real e distinto do 409/drift retirado. A coordenação/engenharia precisa **aceitar ou revisar expressamente esse acoplamento e seus casos de falha**, antes de fechar implementação/aceite D. Não prometer preservação absoluta em falhas novas. Se não aceitar, propor solução técnica/durabilidade coerente sem esconder perda/evento; **não acrescentar pergunta ao usuário nem nova recusa409**.

QI/Q3/Q4 são produto; C1/C2 são coordenação/engenharia. Nenhum destes pontos está aprovado por esta revisão; respostas de produto não liberam automaticamente C1/C2. G0 continua não autorizado.

## 6. Engenharia útil mantida SEM nova recusa clock/drift — PROP condicionada

### 6.1 Preservar contratos legados

**Retirados:** 409clock, erro de drift que aborta request, bloqueio de update/bulk/resolveEntry/release/expire por guard do observador. Nenhum novo predicado de aceitação ou mudança do resultado/status/validação das APIs antigas. Efeitos de individual (inclusive release de reservas) e bulk (preserva reservas) continuam distintos; ação externa segue bloqueada. A preservação aqui é da semântica/validação funcional: **não elimina o risco de rollback por persistência nova**, explicitado em C2/aceite D; esse acoplamento ainda não foi aceito.

Clock/drift **não têm pergunta ao usuário**. Engenharia deve captar um t coerente por unidade após obter a trava, classificar pré e pós nos dados daquele t, e distinguir sequência confiável de **estado indeterminado**. Se clock retrocede ou dados não conciliam com checkpoint:
- não criar ocorrência retroativa, não inferir “já executado”, não alterar status/reservas para combinar com observador e **não recusar a mutação legada por essa razão**;
- registrar diagnóstico local saneado/estado de continuidade incerta do observador na mesma transação, sem segredo; a mutação e sua resposta contratadas continuam;
- se uma transição false→true **é comprovável pelos estados pré/pós da própria mutação no mesmo t**, pode ser registrada como tal, sem inventar história anterior; se não é comprovável, não gerar job como se fosse certeza;
- retomar continuidade ao estabelecer estado não cheio observado coerentemente e nova subida; não redefinir ciclo/apagar ocorrências/delivery antigos. Política de início/reconciliação para grupos játrue depende de Q1/Q2, não assume prospectividade escondida.

**Limite honesto:** em retrocesso de relógio, escrita externa/manual não instrumentada ou acervo sem histórico suficiente, não se promete recuperar todas as passagens reais. A ocorrência permanece não comprovada/indeterminada; não se chama “sem transição” nem se publica falso sucesso. A proposta protege API antiga, mas **não homologa detecção universal nesses casos**. Falhas reais de persistência seguem contrato de erro/rollback já existente; isso não é nova recusa funcional clock/drift. G0 deve verificar compatibilidade transacional real, não inserir hook que altera resposta.

### 6.2 Observação/ciclo/tempo nos caminhos reais

Preservar unidade `(tenant,group,cycle_no)`, incremento persistido só para false→true comprovado, sem dedupe por grupo para sempre. `F` continua fórmulaR86, não motivo de inelegibilidade. Um ciclo não duplica com segundo sinal, no-op, replay ou retry.

No relógio avançando normalmente, R(active,expires_at>t) só diminui pelo tempo. Assim o tempo sozinho pode rearmar, não criar subida. **Pré-observar antes da escrita nova** permite enxergar expiry jáfalse antes de INSERT reserva/marcação: lastfulltrue não impede novociclo se F_pre=false/F_post=true. Sem polling/intervalo funcional inventado. Limpeza activevencida→expired não muda R(t) nem emite subida.

G0 deve ler integralmente implementação/chamadores atuais de updateGroup; bulk; create/import; alteração de occupancy/capacity/margin; resolveEntry (nova reserva/sticky/release/replay); release grupo/campanha ao pausar/arquivar; expire global/job; todos SQLruntime pertinentes. Fonte recebida de entry é parcial, portanto **inventário ainda a confirmar pelo escritor**, não assegurado por esse texto. Não tocar GETs consultivos/HEAD/prefetch; resolveEntry público que já grava reserva continua mutação legada, não novo gatilho por leitura da lista.

Nenhuma promessa de transição não commitada como episódio real. Before/after de uma unidade lógica mantém efeito final antigo, sem inventar statusfull ou reordenar release para disparar. Nascimento/bootstrap seguem Q1/Q2, alvos Q3, ação/conteúdo Q4.

### 6.3 Emissão/consumo/durabilidade após fechamento do produto

**Também condicionada a C1/C2 (§5.1), não apenas às respostas de produto.** A ponte local aqui proposta pode constituir pacote de envio no sentido da orientação MSG07; esse conflito de escopo **não está reconciliado**. O acoplamento transacional tem impacto de falha sobre as rotas antigas; não está implicitamente aceito.

Manter desenho transacional **condicionado**, sem ativar DDL/API anteriores:
- mutação válida+observador+ocorrência+intenção por regra/ocorrência+enqueue+recibo HTTP, quando houver, confirmam/revertem coerentemente; roottransaction/SAVEPOINT respeitam commit externo;
- chave namespaced por ocorrência/regra e uniqueness efetiva evitam duplicar job, **não escolhendo frequência além do ciclo decidido**; duas regras aplicáveis são consumidores distintos explicitamente configurados, não dois sinais;
- fila conserva grupo/tenant/campanha/conta/ação/conteúdo decidido e seu vínculo de versão, não apenas campaignId. Sem substituição do alvo por toda a campanha;
- consumidor de intenção LOCAL registra correlação/delivery/job real; executor externo termina **blocked**, sem inventar sent/succeeded externo. Recibo da intenção não é receipt de envio. Não executar expire/review para criar “efeito verificável” artificial;
- retries/claim/lease/finish preservam histórico/IDs: um novo dono não enfileira de novo a mesma intenção já confirmada, mas tentativa bloqueada/recuperada fica rastreável. Nenhuma alteração de políticas de jobs legados por analogia;
- cancelamento/pausa/delete/legado devem respeitar políticas existentes; onde a nova regra exigir comportamento não decidido, registrar o efeito exato no contrato fechado, sem cancelamento automático oculto. Não acrescentar pergunta de produto por escolha dispensável de endpoint;
- migração aditiva/constraints reais, homônimos incompatíveis recusados pelo contrato de abertura, rollback/reabertura sem reset de cycles/recibos, pais legados intocados. Inicialização de acervo respeita Q1/Q2, não inventa evento passado.

**Modelo/API definitivos pendentes.** Campos mínimos lógicos são campanha/alcance/conta associada/ação/conteúdo/ativação, ocorrência+origem e intenção/job/histórico. IDs/DDL/rotas/locks são engenharia depois das respostas, sem pedir usuário para escolher. Não reaproveitar `group_full_rule_groups`/body/status/deliveryreceipt anteriores como se estivessem autorizados. Um consumidor que só grava flag/evento sem chegar à fila grupal configurada **não satisfaz** o objetivo.

## 7. Aceites úteis revisados — CONDICIONAIS, não plano autorizado de teste

Nenhum teste/gate executado nesta revisão. **O antigo T1 de review/expire NÃO vale como aceite do gatilho.** Depois das decisões, fechar mapa finito cenário/esperado real por item:

| Item | Aceite futuro fiel, sem preencher produto agora |
|---|---|
| G0 | BaseR86/árvore/contratos/equivalentes confirmados; consulta integral das fontes/decisões/parecer antesdiff, inventário das escritas reais e da ponte de conteúdos/contas atuais. Se equivalente existe, reaproveitar. Não executar G0 enquanto sem despacho. |
| A Cadeia grupal | Configuração explicitamente aceita em Q3/Q4 → ciclo manual/calculado → ocorrência → intenção com alvos/conta/conteúdo exatos → job → consumer/attempt blocked provider_not_configured. Assert payload/releitura/histórico completo e nenhuma rede/false_sent; **não** limpezacampanha como sucesso substituto. |
| B Ciclo/tempo | Ambas origens, sobreposição semrepetição; queda+nova subida; expiração semtickantesnovareserva; no-op/replay/reserva reutilizada; oráculo independente pré/pós. Estadosjáaceitos não viram funcionalidade nova. |
| C Vigência/alvos/conteúdo | CasosQ1–Q4 com esperado **da decisão recebida**, incluindo nascimento/importfull, preexistentes, regra nova/reativada, conjunto de grupos e mudanças/versão do conteúdo. Não marcar “pass” com a proposta anterior rejeitada. |
| D Compatibilidade / risco de atomicidade | Comparar respostas/efeitoslegados com/sem regra e clocksnormais/regredidos/drift: **sem nova recusa409/errofuncional**; diagnóstico/incerteza honestos, sem evento inventado. **Reconhecer expressamente que falha de persistência nova do observer/ocorrência/intenção/enqueue pode reverter mutação antiga que hoje passaria.** Aceitação ou revisão técnica desse acoplamento é **C2 PENDENTE da coordenação/engenharia**, não pergunta ao usuário e não resolvida pelo rótulo “erro de persistência”. Ensaiar falha após escrita e demonstrar o comportamento expressamente aceito; não declarar ausência de regressão absoluta. Preservar efeitos/status/available/métricas/liberação/bulk/GET/CSV/import/calendário nos caminhos contratados. |
| E Tenant/negativos | Grupos/contas/mensagens/regra/job reais cruzados entreorg/campanha; associação servidor; input/origin/auth/version/keys existentes. Configuração não admite conta de outra campanha por preencher payload. Conteúdo segue kinds/validações suportadas, sem HTML/script/tipo novo. |
| F Atomicidade/replay | Fault apósescrita e antesrecibo, ocorrência/enqueue e2ºconsumidor: rollback integral nos conjuntosafetados; retrymesmakey semdup; crashantes/depoiscommit distingue intenção confirmada de finish/job bloqueado. Nenhum sucesso externo ou exactlyonce rede. |
| G Concorrência/reabertura | Duas conexões combarreira na seçãoDBreal, não só antesabertura; uma ocorrência/deliveryporregra. Reabrirarquivo conserva cycles/intenção/job/conta/conteúdo; migração populada e homônimo/rollback/reopen demonstrados. Semreset/bootstrap silencioso. |
| H Preservação/gates | SELECT* ordenados dos conjuntos antigosafetados e controlespopulados, não count/mtime; snapshot da nova ponte completo. Baseline198/52 porinventárionominal efetivo, foco/suíte/TSC/lint/build **apósúltimodiff**, stdout/toolIDs/revisão; falhasintermediárias retidas, semrerun inventado. Não pedido universal nem nova execução agora. |

Só a futura cadeia real configurada+fila bloqueada poderia sustentar **PROVADO LIMITADO à preparação/execução LOCAL do gatilho**, nunca envio real/AUT03/FLX05inteiros ou módulo/produção. Hoje: **ESPECIFICAÇÃO PENDENTE, sem despacho**.

## 8. Confronto de matriz — todas as colunas, sem autorização por OBS/PEND

Fonte R86 `/workspace/grupos-evidencias-dec06-r86/aderencia-prompt-mestre-v1.md`, hash`aea5262331b3c4a9aedb1ca9c47ca7aad4409b35b737e3e2c5d25c6689ff6e21`. Extrato literal de GRU02/04/05, FIL07, MSG02/04/07/08/09, ACM01/03/04/05/09, AUT01–05 abaixo, com as oito colunas inclusive Próximaação. Não atualizar a matriz.

- AUT02 **PEND/Nãoimplementar**: fonte de necessidade de decidiralvos, não permissão deIDs específicos. AUT01/AUT03 antigas orientações “nãoinventar” superadas **sóquantoexistência/ciclo decidido**, não para qualquer função do assistente.
- MSG04provado: versão/conteúdo não são envio; MSG02limita tipos. ACMmanualtemações/contas observadas masnão licencia portá-las paraAUT03. FIL07não permite falsoenvio. Preservar calendáriosAUT04/05e decisõesalheias.
- Q1/Q2não sãoDECs anteriores; é materialnovoquenãofoidecididonowidget. Os campos/modelosde engenharia sãoPROP, não falausuário/vídeo. Nenhuma política nova passa aativa pela revisão.

### 8.1 MSG07 — confronto integral de L100, não só menção no extrato

| Coluna da matriz | Texto efetivo MSG07 |
|---|---|
| ID | GRP-MSG-07 |
| Classe | OBS-C |
| Origem | INF-ATUAL parcial |
| Contrato no código | Fuso está em automação e job, não no pacote de envio da referência |
| Arquivos | `automations.timezone`, `scheduled_jobs.timezone` |
| Evidência retida | `daily-weekly-*.test.ts`, `monthly.test.ts` não reexecutados |
| Estado e limite | Valores de exemplo não são regra de envio |
| **Próxima ação** | **Não criar pacote de envio** |

Fonte exata: `/workspace/grupos-evidencias-dec06-r86/aderencia-prompt-mestre-v1.md` **L100**; relida nesta revisão nas oito colunas, sem modificar. A evidência nomeada não demonstra transporte/configuração nova nem gate atual específico.

**Conflito com §6.3:** intenção/fila que passe a guardar grupo, conta, ação e conteúdo para executor pode constituir **pacote de envio LOCAL**, mesmo sem rede. Logo a orientação histórica **continua vigente como limite não reconciliado**, não superada pelo nome de “intenção”, pela demanda do gatilho, pela decisão de ciclo, por fila bloqueada ou pelo parecer. **PENDENTE C1:** coordenador precisa reconciliar o escopo explicitamente com fonte/delegação e registrar o que é ou não autorizado antes de despacho. Não é decisão de produto tomada aqui nem requisito técnico que se possa contornar; não criar pacotes/rotas enquanto pendente.

## 9. Pergunta à Referência para REVISÃO — não enviada

> Leia integralmente esta **R3 do mesmo contrato** e confronte o adendo R2 do parecer **L83–106**: confirma QI consolidando início já cheio com contextos/respostas eventualmente distintas; Q3 separando **grupos acionadores**, **destinatários “Enviar para...”** e momento de ambos alcances, sem inventar opções de acionadores/equivalência; e Q4 preservada? Confirma confronto MSG07 L100 nas oito colunas/Próxima ação “Não criar pacote de envio”, com **reconciliação C1 PENDENTE da coordenação** versus §6.3, sem declaração de superação/autorização? Confirma que aceite D/C2 reconhece rollback da mutação antiga por falha da persistência nova e exige aceite/revisão expresso de engenharia/coordenação, sem pergunta adicional de usuário ou 409? Mantidos histórico/propostas rejeitadas, baseR86, origem atribuída do widget e OR/ciclo sem reabertura. Estado **ESPECIFICAÇÃO PENDENTE/SEM DESPACHO**, nenhuma autorização de G0/execução. Aponte apenas contradição material/fonte já decisiva, não política nova ou pacote universal.

### Extrato literal — não é matriz nova

| ID | Classe | Origem | Contrato no código | Arquivos | Evidência retida | Estado e limite | Próxima ação |
|---|---|---|---|---|---|---|---|
| GRP-GRU-02 | OBS-M | escopo aprovado; filtro técnico; busca posterior | `GET` dos grupos aceita um `status` opcional, igualdade com `available`, `full`, `suspended`, `blocked` ou `archived`. Sem ele, a lista e a ordem por `position` permanecem. Depois, `nameContains` filtra por substring literal de `name`, sensível a caixa e acento. O CSV não usa esse parâmetro. Depois, `fullness=full|not_full` classifica cheio como o status gravado `full` ou o teto local atingido por ocupação informada e reservas ativas não vencidas. Sem o parâmetro, a lista permanece. O CSV não lê `fullness` | `src/lib/data.ts` `listGroups` | `src/lib/group-status-filter.test.ts`, `src/lib/group-name-search.test.ts`, `src/lib/group-fullness.test.ts` | Não é o botão da tela. `available` não promete vaga. `full` não foi redefinido. O recorte de status dizia sem busca, contagem, paginação nem suspensão nova. A busca e o filtro `fullness` são acréscimos posteriores, não releitura daquela frase. O filtro não emite o gatilho ao encher | Feito o filtro de leitura. Não é a toolbar. A busca literal por nome e o filtro `fullness` são acréscimos posteriores e não fecham a toolbar nem o gatilho |
| GRP-GRU-04 | OBS-M+PROP | DEC-06 | `status=full` tira o grupo da rota; o teto `capacity-margin` contra ocupação+reserva também. A decisão direta de 07/11/2026 usa o OR só para classificar e filtrar a lista | `routing.ts` `groupIneligibility`; `listGroups` não usa esse motivo | `routing.test.ts` não reexecutado; `src/lib/group-fullness.test.ts` | As duas vias existem no roteamento. «Não unificar sem decisão» permanece o limite histórico. A decisão nova não reescreve esta linha como se já existisse e não unifica status, contadores nem roteamento | Não unificar status e roteamento. O filtro de leitura usa o OR; o gatilho ao encher segue sem emissão |
| GRP-GRU-05 | OBS-M | escopo aprovado; fatia implementada na API | `POST /api/v1/campaigns/{id}/groups/bulk`: `mark_full`, `mark_available` ou `delete` com `confirm: "sim"`. Até 100 ids explícitos, tudo ou nada, idempotente. Não altera `updateGroup` | `src/lib/data.ts` `applyGroupBulk`; `src/app/api/v1/campaigns/[id]/groups/bulk/route.ts` | `src/lib/group-bulk.test.ts`: snapshot da reserva e do clique; id de outra organização; a marcação espera `BEGIN IMMEDIATE` de outra conexão e só então passa de available para full. A barreira de relógio anterior não é contenção de banco | Marcar não mexe em ocupação, clique, reserva nem teto. `available` não promete vaga. DEC-06 não foi redefinida. A tela não chama a rota | Feita na API. Não é o módulo de grupos inteiro |
| GRP-FIL-07 | DIR+PROP | INF-ATUAL | `whatsapp.send` e `whatsapp.create_group` bloqueiam antes de rede. Sucesso local não é efeito Meta | `gateway.ts`, `jobs.ts` | `product.test.ts`, `local-effect-replay.test.ts` não reexecutados | Conclusão recusada não vira sucesso de negócio no contrato do finish | Não simular enviado/criado |
| GRP-MSG-02 | OBS-M | BLOQ-EXT | Blocos só `text`, `link`, `variable`. Sem enquete, mídia, contato, evento, figurinha | CHECK em `message_blocks` | `messages.test.ts` não reexecutado | Envio real NT | Não acrescentar tipo |
| GRP-MSG-04 | OBS-M | aceite do PM; cadeia na API | `PUT` grava a lista inteira. A ordem observada é a da releitura. `baseVersion` antiga responde 409 e não cria versão | `src/lib/messages.ts` `saveMessage` | `src/lib/message-order.test.ts` | A resposta não traz id de bloco. Não é o editor. Sem spintax e sem tipo novo | Provada a cadeia A/B/C. Não é o módulo de mensagem |
| GRP-MSG-07 | OBS-C | INF-ATUAL parcial | Fuso está em automação e job, não no pacote de envio da referência | `automations.timezone`, `scheduled_jobs.timezone` | `daily-weekly-*.test.ts`, `monthly.test.ts` não reexecutados | Valores de exemplo não são regra de envio | Não criar pacote de envio |
| GRP-MSG-08 | OBS-M | INF | Versões de mensagem existem. Tela de modelos não | API `messages/versions` | `page.test.ts` não reexecutado | ZZZ-08. Aba da campanha continua desabilitada | Não tratar versão como a tela de modelos |
| GRP-MSG-09 | INF+PROP | INF-ATUAL | Migração das quatro tabelas recusa extensão fora do contrato | `message-link-migration.ts` | `message-link-*.test.ts`, `check-literal-classification.test.ts` até `0892485` | Não é parser SQL universal | Não reabrir |
| GRP-ACM-01 | OBS-M | PEND-ORDEM | Sem assistente de sete etapas. A etapa de grupos desse assistente não é seleção nova de alvos | ausência | — | — | Não implementar |
| GRP-ACM-03 | OBS-M | PEND-ORDEM | Sem etapa de contas do assistente. Não é seleção de grupos | ausência | — | FK de conta é outro contrato (ASC-03) | Não fundir |
| GRP-ACM-04 | OBS-M | BLOQ-EXT | Sem ação “trocar configuração” no provedor | ausência | — | NT | Não implementar |
| GRP-ACM-05 | OBS-M | BLOQ-EXT | Sem privacidade avançada | ausência | — | NT | Não implementar |
| GRP-ACM-09 | DIR | BLOQ-EXT | Envio agendado não fica “enviado” | kinds WhatsApp bloqueados | `product.test.ts` | — | Não simular envio |
| GRP-AUT-01 | OBS-M | PEND-ORDEM | API de automação, sem assistente. Gatilho do vídeo não existe | `automations` | `monthly-http.test.ts` não reexecutado | Etapa Gatilho não amostrada | Não inventar gatilho |
| GRP-AUT-02 | OBS-M | PEND-ORDEM | Automação é da campanha, sem “todos os grupos / específicos” | `automations.campaign_id` | inspeção | — | Não implementar |
| GRP-AUT-03 | OBS-M | DEC-06 | A orientação histórica era não criar o gatilho «ao encher grupo». A decisão direta de 07/11/2026 exige esse gatilho nos dois sinais: status gravado `full` ou teto local atingido. Esta fatia não o emite. `action_kind` continua revisão, expiração ou WhatsApp bloqueado | `action_kind` é revisão, expiração ou WhatsApp bloqueado | inspeção; `src/lib/group-fullness.test.ts` não emite evento | A demanda está registrada e não implementada. Sobreposição, rearme e consumidor continuam em aberto. O filtro `fullness` não prova o gatilho | Não tratar o filtro como gatilho. A emissão continua pendente |
| GRP-AUT-04 | OBS-M | escopo aprovado; duplicar uma e filtro de lista | `POST /api/v1/automations/{id}/duplicate` copia uma automação pausada. `GET /api/v1/automations?status=` filtra por igualdade de `active`, `paused` ou `completed`. Sem o parâmetro, a lista inteira permanece | `src/lib/jobs.ts` `duplicateAutomation`, `listAutomations` | `src/lib/automation-duplicate.test.ts`, `src/lib/automation-status-filter.test.ts` | Sem JSON, sem massa, sem 7/14/28 e sem webhook. `completed` não é o rótulo Desativado. O toggle não recalcula `next_run_at` | Feita a cópia de uma e o filtro pelo status gravado. Não é o módulo de automação |
| GRP-AUT-05 | OBS-C | INF-ATUAL parcial + DEC-15 | Recorrência `once`, `daily`, `weekly`, `monthly`. Não há 7/14/28. Mensal tem dia 1–31, `skip`/`last_day` e políticas de lacuna/ambiguidade. Diária/semanal só mudam se as duas políticas vierem juntas | `db.ts`, `schedule` | `monthly.test.ts`, `daily-weekly-policy.test.ts`, `daily-weekly-proof.test.ts` | O anexo manda reconfirmar e não reverter legado. 7/14/28 do vídeo não substituem esse contrato | Não introduzir 7/14/28 nem reescrever linha antiga |


---
## ADENDO R3.1 — proveniência MSG07 e posições técnicas do coordenador

Registro: **07/11/2026 18:46:09 America/Sao_Paulo (UTC−3)**. Adendo ao MESMO contrato; o prefixo R3 acima é preservado integralmente (**43090bytes, SHA256`37e2f7efce6678bfca51a86f202c1cc66cac846827f534065e53c00bcda7deb5`**). As referências a C1/C2 “pendentes” acima conservam o estado anterior; **o estado atualizado restrito é este adendo**, sem reescrita silenciosa. Parecer da Referência não foi editado nem recebeu mensagem desta frente.

### A. C2 — aceite técnico CONDICIONADO relatado, não autorização do usuário

**Posição DO COORDENADOR encaminhada às18h44 de07/11/2026 America/Sao_Paulo (UTC−3):** aceita a atomicidade com rollback se houver **falha real de persistência nova**, para não confirmar mutação sem ocorrência/entrega, **somente com regra explicitamente configurada e dentro do escopo contratado**. Exige erro operacional honesto, retry idempotente e testes de fault. Não é literal novo atribuído ao usuário, não autorização de implementação/cloud/G0 nem garantia de ausência de regressão.

**Atualização exata de C2/aceite D:** a necessidade de aceite técnico foi respondida **por relato condicionado do coordenador**, com o limite acima; a engenharia/prova desse desenho continua a fechar após produto e escopo. O aceite não alcança instrumentação que passe a ampliar recusas funcionais **sem regra**, ou fora do escopo do gatilho. **Sem 409clock/drift**, sem recusa funcional nova, sem usar diagnóstico incerto como motivo para reverter chamada legada. Erro de persistência novo é impacto declarado, não “compatibilidade absoluta preservada”.

Futura especificação deve separar explicitamente:
- caminho **sem regra aplicável configurada**: não adquirir nova superfície de recusa funcional/erro de clock/drift por observador, preservar respostas/efeitos legados; diagnóstico de continuidade não fabrica ocorrência;
- caminho **com regra configurada no escopo contratado**: mutação/ocorrência/entrega atomicamente confirmadas; fault real de escrita nova pode reverter tudo, com o erro operacional real e idempotência de retry demonstrados;
- transação externa/SAVEPOINT não é commit durável por RELEASE; histórico/receipt/reabertura permanecem honestos.

Não generalizar esse aceite para qualquer regra/serviço/rota ou redefinir a política de grupo. O desenho técnico de como manter observação/continuidade sem ampliar falhas fora das regras contratadas é trabalho de engenharia a alinhar, **não pergunta adicional ao usuário**. Os testes fault/rollback dirigidos do aceite D/F terão de demonstrar a condição com/sem regra, não só um rollback genérico.

### B. Origem LITERAL de “Não criar pacote de envio” — evidência concreta localizada

**Fonte principal:** dump documental `/workspace/cloud-agent-transcripts/bc-68876892-0c2c-553d-9afb-372723d790a3.jsonl`, linha física **6031**, resultado **`turn-57:step:31:tool`**, `search_replace`, **isApplied:true**. O diff efetivo cria **`docs/aderencia-prompt-mestre-v1.md`** de `/dev/null`,213linhas, confronto estático da árvore **d31b536**. A linha MSG07 criada é a **linha100 do documento original**, literal:

> GRP-MSG-07 · OBS-C · INF-ATUAL parcial · Fuso está em automação e job, não no pacote de envio da referência · automations.timezone / scheduled_jobs.timezone · daily-weekly-*.test.ts / monthly.test.ts não reexecutados · Valores de exemplo não são regra de envio · **Não criar pacote de envio**.

O cabeçalho do mesmo diff declara **confronto estático**, sem runtime/testes/código de produção, e que o PM é consolidação derivada para alinhamento, não autorização irrestrita. **Isso demonstra a inserção da frase como próxima ação documental na matriz pelo escritor**, não um literal de proibição específica de Loigo. Não inferir que é fala do vídeo ou DEC de produto.

**Contexto de coordenação localizado:**
- Dump **L5980**, mensagem de instrução R41 ao escritor; no transcript do agente **grupos `6b330ef9-b86a-4d48-a676-a8e1d296fe5f`**, posição **434**, mensagem do **assistant/coordenador**, conferida com ReadTranscript around434. Pede matriz por requisito com estado/limite/próximaação, **“somente RECOMENDAR,nãoimplementaragora”**, sem função nova por texto/PROP. **Não contém a proibição literal específica “Não criar pacote de envio”.** O papel user dessa instrução dentro do dump cloud é remetente da tarefa ao escritor, **não confundir com fala direta de Loigo**; a origem no transcript distingue os papéis.
- No mesmo trecho do transcript aparece fala **roleuser/speakerIdcu:[ID-REDIGIDO]**: **“Aprovado, pode iniciar.”** Contexto é PM/continuação do trabalho; não especifica liberação ou proibição de pacote MSG07, nem é autorização irrestrita de efeito externo. Dump **L6040** encaminha atualização da aprovação e preserva limites/consulta. Não usar aprovação geral para apagar a próximaação.
- Cópias posteriores **R79/R80/R81/R82/R84/R86**, `aderencia-prompt-mestre-v1.md` **L100**, retêm literalmente a mesma próximaação. Isso confirma continuidade da orientação, **não seis decisões independentes do usuário**.
- Leituras posteriores no dump **L6806 `turn-72:step:5:tool`**, **L6878 `turn-73:step:14:tool`**, **L7239 `turn-78:step:10:tool`** mantêm o literal; não são fonte originária de autorização.

**Confronto PM:** `PROMPT-MESTRE-GRUPOS.md` **L322 MSG07** especifica campos de **envio em pacotes**, intervalo/janelas/dias/fuso, com valores de exemplo/continuação falada; **não contém o literal proibitivo**. AUT03/FLX05 **L344/503** especificam gatilho e Conta→Ação→Conteúdo; não dão contrato para executar rede ou completar toda a semântica de pacote de envio. A matriz inferiu uma próximaação interna de escopo a partir do confronto, sem que isso prove que todo vínculo local seja permitido.

**Busca realizada e limite:** busca literal nos arquivos Markdown de referência/acervo/pacotes, varredura dos campos públicos de mensagens/resultados do dump (sem thinking), buscas no transcript grupos antes18h30 e janela09h–10h; ReadTranscript no contexto da instrução R41. A primeira ocorrência literal localizada no dump foi a criação de matriz emL6031. Busca `MSG-07` no transcript não retornou mensagens; busca mais ampla pelo literal trouxe correspondências por palavras, não prova exata. **Não localizada nesta busca proibição direta específica do usuário com esse literal.** Isso **não prova inexistência universal** de outra proibição/ordem fora das fontes/contextos examinados. Nenhum outro transcript/conta/repo foi explorado.

**Classificação de proveniência sustentada:** orientação interna histórica **concretamente demonstrada na criação da matriz documental**, sob instrução do coordenador para produzir próximas ações; **não literal direto de usuário localizado**. Sua força/alcance precisam ser reconciliados pela coordenação; não simplesmente descartados ou renomeados.

### C. C1 — reconciliação RESTRITA PROPOSTA, atribuída ao coordenador

**Posição DO COORDENADOR encaminhada às18h44:** **NÃO autoriza envio externo, integração, novos tipos de conteúdo ou serviço**. A ligação **LOCAL configuração→ocorrência→fila bloqueada** é **candidato**, condicionado a **QI/Q3/Q4**. Não reescreve MSG07 geral.

Portanto, **C1 não é superação geral da matriz nem autorização de criar pacote de envio**. Após a investigação acima, registra-se **reconciliação restrita em proposta**, atribuída ao coordenador, para eventual cadeia local fiel AUT03/FLX05. Falta fechar produto/alcance e registrar contrato final sob a coordenação; o candidato não será despachado por esta frente. Não chamar intenção/pacote por outro nome para contornar a orientação. A seleção de destinatários/acionadores e conteúdo continua a depender das respostas QI/Q3/Q4; nenhum escopo é liberado automaticamente por ser “local”.

Limites da proposta de reconciliação:
1. preservar bloqueio de provedor/sem sent/succeeded externo e sem sessão/credencial/conta real;
2. **não criar batching, janelas, velocidade, pin/temporárias, renderização nova, tipo de bloco novo ou serviço** por analogia com MSG07;
3. não trocar função grupal por review/limpeza de campanha;
4. manter mensagem versionada/contas/grupo como dados a ligar **sob contrato fechado**, não evidência de que a ponte existe ou está aprovada;
5. deixar MSG07/PM/matriz/parecer originais intocados; futura reconciliação deve citar este histórico e registrar apenas o alcance aprovado, se vier a existir.

### D. Estado e encaminhamento documental

- **Produto:** QI (início jácheio/contextos distintos), Q3 (acionadores≠destinatários/momento), Q4 (ação/conteúdo/momento) continuam pendentes; **OR/ciclo não são reabertos**.
- **C2:** aceite técnico condicionado **relatado do coordenador**, não decisão do usuário/implementação; engenharia/provas e aderência à condição com/sem regra ainda a fechar.
- **C1:** proveniência interna histórica localizada; **reconciliação restrita candidata atribuída ao coordenador**, condicionada ao produto, sem liberação geral de MSG07 ou envio.
- **ESPECIFICAÇÃO PENDENTE / SEM DESPACHO.** Nenhuma autorização operacional inferida, nenhum G0/teste/cloud/mensagem executado ou pacote paralelo iniciado. Este adendo não solicita repetir regras nem cria perguntas técnicas ao usuário.


---
## ADENDO — QI/Q3/Q4 mantidas pendentes por encaminhamento, 07/11/2026 19:21:53 America/Sao_Paulo (UTC−3)

**Proveniência atribuída:** coordenador **relata resposta recebida do usuário** no card **t217s891**, encaminhada em07/11/2026 **19h16 America/Sao_Paulo (UTC−3)**, preferindo deixar **QI/Q3/Q4 pendentes por enquanto**. Esta frente não leu diretamente o card, não tem literal exportável fornecido e não inventa transcrição, timestamp nativo ou autoridade própria.

**Estado vigente:** QI/Q3/Q4 **PENDENTES**; nenhum default, nova consulta repetida, G0 ou implementação do gatilho. OR/ciclo anteriormente registrados permanecem preservados, com a proveniência direta/atribuída já discriminada. R86 continua aceita por relato **apenas limitadamente para classificação OR/filtros**, não gatilho/AUT03/FLX05/módulo. C1/C2 mantêm seus limites históricos, não substituem as decisões de produto adiadas. **ESPECIFICAÇÃO PENDENTE/SEM DESPACHO** deste contrato.

A seleção documental independente em `SELECAO-INDEPENDENTE-POS-R86.md` não retoma ou implementa este gatilho e não depende das respostas adiadas. Nenhuma mensagem foi enviada a usuário/Referência/escritor. Prefixo anterior preservado integralmente: 52705bytes, SHA256`155ea46cc08790643a036e3bc1e4dce45dcf72badafd25280c65c0083c7cb310`.
