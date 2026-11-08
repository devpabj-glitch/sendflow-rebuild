# PARECER pré-mudança — GATILHO-ENCHER-CICLO v1 (resposta ao §11)
Registro: 07/11/2026 18:36 America/Sao_Paulo (UTC−3). Documental. Não autoriza implementação, execução nem cloud, e não valida política de produto em nome do usuário. Um único parecer atende ao Backend e ao coordenador.

## Fontes (lidas integralmente)
- `grupos-execucao-backend/PACOTE-GATILHO-ENCHER-GRUPO-CICLO.md`
  - 172 linhas pelo wc (173 relatadas; a última não tem quebra), 41.375 B.
  - sha256 `8c4855b518d8a9504c669da94efcc6e3abe56818f2d25bbfd8242216a625de8e`.
  - Inclui o extrato da matriz R86 (GRU-02/04/05, FIL-07, AUT-01..05, 8 colunas).
- `grupos-execucao-backend/DECISAO-DEC06-GRUPO-CHEIO.md`, com adendo
  - 58 linhas, 5.451 B.
  - sha256 `a06bc19bc67f824bbd598bb5c5d00790c2e6b5f3dad0c393b03c15f95b99f3db`.
  - O corpo L1–43 é igual ao que confrontei às 18h04.
- PM `5f74532b…`: AUT-03 L344 ("uma vez por ocorrência conforme contrato") e FLX-05 L503.
- PARTE-04: gatilho "Encher Grupo da Campanha" na lista (29:27); a etapa Gatilho não foi amostrada.
- Meu `PARECER-DEC06-FILTROS-CHEIOS.md` (`69d72960…`).
- **Proveniência:**
  - **OR:** fonte direta já verificada (posição 849, role `user`).
  - **Ciclo:** resposta no widget t210s872. O coordenador diz tê-la recebido pessoalmente às 18h29. Na minha busca no transcript `grupos 6b330ef9…`, o literal aparece só em mensagens do assistente (posições 879 e 883), não como mensagem com role `user`. Logo, é **atribuído ao coordenador**, suficiente para preparar a proposta; não é verificação direta minha. Não reabro a regra nem peço repetição.
- **Limite:** não abri `.ts`, dump, matriz original nem QA R86. Caminhos, helpers e jobs vêm de relato do pacote e dependem do G0.

## Confere (sem contradição)
- **Ocorrência por ciclo:** passagem F false→true pelo OR; sem repetição enquanto F=true, inclusive com o segundo sinal; rearme após F=false. Fiel ao literal atribuído e ao PM AUT-03/FLX-05.
- **Rearme e tempo sem polling:** o tempo só tira reservas do COUNT, então F não sobe só pelo relógio. A reconciliação F_pre na próxima escrita (exemplo 10:00 / 10:01) é coerente. GETs não emitem nada.
- **Atomicidade e consumo:**
  - mutação, ocorrência, deliveries/jobs e recibo vão juntos;
  - um delivery por regra por ocorrência, com chave `group-full:v1:{occ}:{rule}`;
  - receipt antes do finish, recuperação depois de crash, lease obsoleto, cancelamento sem re-enfileirar;
  - migração aditiva sem resetar cycle_no.
- **Aceites T1–T11:** finitos; nenhum exige prova universal.
- **Matriz:** AUT-01/AUT-03 "não criar/inventar gatilho" foram superadas quanto à existência pela decisão direta. GRU-02/04/05, FIL-07 e AUT-04/05 ficam preservadas. WhatsApp continua bloqueado.

## Contradições materiais
1. **Guardas de relógio e drift alteram mutações legadas mesmo sem regra ativa (§3, §7.2 × §6 e "sem regressão").**
   - O que muda: o observer corre em todas as escritas (§4.4, §7). Então `trigger_clock_regressed`/409 com rollback e o erro de drift (last_full=false, F_pre=true) passam a poder recusar updateGroup, bulk, resolveEntry público, release e expire, onde hoje não há esse erro.
   - O que contradiz: §6 diz que essas mutações "mantêm sua resposta/API antiga" e que os efeitos novos só existem com regra configurada.
   - O que falta: escolha de engenharia e coordenação, não do usuário. Ou se declara e aceita explicitamente essa mudança de contrato das rotas legadas (com aceite próprio), ou as guardas ficam sem efeito nelas. Não escolho a opção.
2. **Alvos por IDs específicos × matriz AUT-02.**
   - O que muda: `group_full_rule_groups` implementa a seleção "grupos específicos".
   - O que contradiz: a matriz AUT-02 traz PEND-ORDEM / "Não implementar". O PM AUT-02 é observação, não uma fonte que feche essa função.
   - O que falta: reconciliar expressamente a orientação e demonstrar o alcance autorizado. Distinguir alvos de regra local de AUT-02 não pode, por simples renomeação, dispensar uma decisão funcional que continue faltando.

## Pontos PROP que não posso validar como política
- **§4 — o literal não cobre o nascimento.**
  - Migração com grupo já cheio sem ciclo, e regra criada ou ativada sem retroatividade: são a leitura mais próxima do literal, porque não há passagem observada enquanto a regra está ativa. Mesmo assim são PROP e precisam ser aceitas expressamente pelo coordenador.
  - **Grupo criado ou importado já cheio** (caso realista na importação) não é decidido pelo literal.
- **§8 — o consumidor não foi escolhido pelo usuário.** capacity.review e reservation.expire têm efeito **de campanha**, disparado por um grupo. São ações locais existentes, escolhidas por regra, sem default.
  - Não cumprem a função grupal do vídeo (FLX-05: Conta → Ação → Conteúdo).
  - Não autorizam nenhuma ação sobre o grupo.
  - reservation.expire mexe nas reservas de todos os grupos da campanha.
  - Pode seguir como PROP explícita; o fechamento máximo continua PROVADO LIMITADO.

## Decisões residuais mínimas
- **R1, produto, sem definição demonstrada nas fontes:** "Um grupo que já entra cheio (criado ou importado cheio) conta como 'encher' e dispara?" Não pergunta de novo o OR nem o ciclo.
- **R2, coordenação:** aceitar ou recusar expressamente as PROP §4 de migração e prospectividade e o escopo de campanha das duas ações locais (§8).
- **R3, coordenação/engenharia:** resolver a contradição 1 (guardas nas rotas legadas).
- **R4, coordenação:** resolver a contradição 2 (AUT-02).
- A coordenação pode consolidar propostas e alternativas, mas este parecer não lhe atribui autorização para decidir política de produto pelo usuário. Mudança funcional sem delegação demonstrada precisa de decisão do usuário; ser local ou já existir como job não basta. Não se declara que R1 seja a única questão que possa exigir essa decisão.
- O G0 executivo só depois dessas definições.

## Conclusão
O contrato é fiel ao OR direto e ao ciclo atribuído, e a cadeia local está bem fechada. **Não está pronto para despacho** enquanto R1–R4 não forem definidos. As duas contradições são finitas e não reabrem o ciclo nem exigem prova universal. O teto continua PROVADO LIMITADO: gatilho local por ciclo com consumidor configurado. Não fecha AUT-03/FLX-05 nem a função do vídeo.

---
## ADENDO R2 — revisão do mesmo contrato (o texto acima fica preservado)
Registro: 07/11/2026 18:42 America/Sao_Paulo (UTC−3), relógio do sistema (date).

**Correção de horário do registro original.** A primeira versão deste arquivo, gravada por mim, trazia "~18:40", uma estimativa posterior ao momento da escrita (erro meu). O cabeçalho atual "18:36" e as linhas 40, 53 e 57–58 foram ajustados nesta frente depois da gravação (mtime 18:37:00; meu original tinha 60 linhas, 6.028 B, `c9ebaa45…`). Antes deste adendo, o arquivo tinha 61 linhas, 6.473 B, sha256 `57abcc45a747a0db3b103492d78c9dc67c545e33ad75267e78964bf58e77c297`, o mesmo hash que a R2 cita. Não reescrevi o texto anterior.

### Fontes R2
- `PACOTE-GATILHO-ENCHER-GRUPO-CICLO.md` R2, lido integralmente: 177 linhas pelo wc (178 relatadas; a última sem quebra), 37.553 B, sha256 `16ec561d03ea033e3a5bdbb9024fb1e90ecd118fc3669e691318b846c2f16d78`.
- Já lidos integralmente nesta frente e reconferidos: PARTE-04 (L7–8: "Enviar para todos os grupos da campanha" / "…grupos específicos…"; editor "Enviar mensagem"), PARTE-05 (L7, L9–10, L11–18) e PM AUT-02 L343 (OBS-M, sem aceitação nem limite).
- **Limite:** as fontes do §3.2 (message-blocks.ts, messages.ts, gateway.ts, jobs.ts, dispatch.ts, data.ts, reservations.ts) são código do dump ou cópias. Não as abri. Ficam como **relato do Backend**, sem prova de HEAD R86 nem de ausência universal. Também não li VERIFICACAO-RODADA-62.md.

### Confirmações (§9)
- **Retiradas efetivas (§1, §6.1):**
  - Sai o 409/erro de clock e drift nas rotas legadas, com ou sem regra. O limite agora é de incerteza honesta: sem ocorrência retroativa e sem job "como certeza". Isso resolve a minha contradição 1.
  - capacity.review e reservation.expire deixam de ser consumidor ou aceite substituto. Isso resolve o ponto §8 do parecer.
  - O esquema `group_full_rule_groups` e o DDL/API anteriores ficam inativos.
- **AUT-02 PEND não autoriza IDs específicos (§4 L68, §8).** Fica preservado e vira Q3. A contradição 2 passa a ser questão funcional explícita, não mais implícita.
- **Objetivo restaurado:** AUT-03/FLX-05, Conta→Ação→Conteúdo. Fila e executor terminam em BLOCKED/provider_not_configured, sem sent ou succeeded falso. Coerente com FIL-07 e ACM-09.
- **Estado:** especificação pendente e sem despacho confirmada. Base R86, histórico e origem atribuída do widget estão preservados. A engenharia restante é útil, mas condicionada.

### Pontos materiais restantes
1. **Matriz MSG-07 não confrontada.** A Próxima ação dela é "Não criar pacote de envio". O §6.3 propõe uma fila que guarda grupo, conta, ação e conteúdo para o executor, ou seja, um pacote de envio local. É orientação histórica da coordenação, do mesmo tipo de AUT-02, e precisa ser reconciliada expressamente. Não é decisão do usuário nem bloqueio de engenharia. O §8 cita MSG-02/04/08/09, mas não trata MSG-07.
2. **Q3 só pergunta quem recebe.** Não pergunta quais grupos, ao encher, acionam a regra. Nas fontes:
   - PARTE-04 L7 rotula "Enviar para…", ou seja, destinatários;
   - o gatilho visto é "Encher Grupo da Campanha";
   - nenhuma fonte diz se a seleção também limita os grupos que acionam.

   A pergunta mínima deveria cobrir as duas coisas na mesma linha. A única menção ao grupo que encheu ("boas-vindas quando o grupo enche", CAP 30:26, PM AUT-03) é **fala de capítulo**, não opção observada. Pode servir de contexto, não de opção decidida.
3. **Risco residual (não material para o usuário).** Pelo §6.3, as escritas novas de observer, ocorrência e intenção, e o enqueue, fazem commit ou rollback junto com a mutação legada. Uma falha nelas pode reverter uma mutação legada que hoje passaria. O §6.1 trata isso como "falha real de persistência", não como recusa funcional. Fica para a coordenação/engenharia aceitar expressamente e cobrir no aceite D.

### Q1–Q4: mínimas e fontes
- **Q1 (nascimento cheio) e Q2 (vigência quando já está cheio):** nenhuma fonte as decide. O literal do ciclo fala em "passar de não cheio para cheio" e não cobre o caso de já começar cheio. Opcionalmente, podem virar uma pergunta só ("quando o sistema ou a regra passa a observar um grupo que já está cheio — criado ou importado, migração, regra nova ou reativada — dispara?"), salvo se o coordenador quiser respostas distintas. Não é obrigatório.
- **Q3:** as opções vistas, todos/específicos, estão corretas, e nenhuma está autorizada. Faltam o acionador (ponto 2) e o momento em que o conjunto é definido.
- **Q4:** "Enviar mensagem" é a única ação vista no fluxo de automação. "Trocar configuração" e "Privacidade" são da ação manual e não podem ser transferidas. O momento em que o conteúdo fica fixado é pergunta de produto legítima.
- Não encontrei fonte efetiva que já decida qualquer uma das quatro. Não há pergunta a retirar.

### Conclusão R2
- Sem contradição material nas retiradas: a R2 resolve as contradições 1 e 2 e o ponto §8 do parecer original.
- Continua **pendente, sem despacho**, por quatro motivos:
  - **Q1–Q4**, produto, conforme a delegação demonstrada;
  - **ajuste do Q3** para incluir os grupos acionadores;
  - **reconciliação de MSG-07** pela coordenação;
  - **aceite expresso** do acoplamento transacional do ponto 3.
- Este adendo não valida política em nome do usuário, não autoriza G0 nem execução e não contata ninguém.

---
## ADENDO R3 — conferência final do mesmo contrato (todo o texto anterior fica preservado)
Registro: 07/11/2026 18:44 America/Sao_Paulo (UTC−3), pelo date do sistema.

**Fonte.** `PACOTE-GATILHO-ENCHER-GRUPO-CICLO.md` R3, lido integralmente:
- 209 linhas pelo wc (210 relatadas; a última sem quebra), 43.090 B.
- sha256 `37e2f7efce6678bfca51a86f202c1cc66cac846827f534065e53c00bcda7deb5`.

A R3 cita este parecer com o hash `4d7c3ac9…`, que era o estado antes deste adendo. Conferi os localizadores que ela usa (L64–106, L67, L85–90, L91, L94–96, L105): batem com o texto. O §3.2 continua sendo relato de código; não abri `.ts`.

### Correções do adendo R2: conferência
1. **QI (§5 L82):** reúne Q1 e Q2 com os cinco contextos (criado cheio, importado cheio, preexistente na migração, regra nova, reativação) e admite respostas diferentes. Não força resposta nem transforma baseline em DEC. **Resolvido.**
2. **Q3 (§5 L83):** separa os grupos que acionam, os que recebem e o momento de definir cada conjunto. As opções verificadas (todos/específicos) ficam só para destinatários, não há opção inventada para acionadores, e "boas-vindas" aparece como contexto de fala. AUT-02 PEND continua sem autorizar IDs. **Resolvido.**
3. **Q4:** preservado sem mudança material. **Resolvido.**
4. **C1 / MSG-07 (§5.1, §6.3, §8.1):** confrontado nas oito colunas da matriz, com a Próxima ação "Não criar pacote de envio". A orientação fica **vigente e não superada**; a reconciliação fica pendente da coordenação, e nenhuma rota ou pacote pode ser criado enquanto isso. **Resolvido como redação; a pendência continua.**
5. **C2 / aceite D (§5.1, §6.1, §7 D):** reconhece expressamente que uma falha de persistência nova pode reverter uma mutação antiga. Isso exige aceite ou revisão expressa de engenharia/coordenação; não vira pergunta ao usuário nem 409 novo, e não promete ausência absoluta de regressão. **Resolvido como redação; a pendência continua.**
6. **Preservado:** o histórico das propostas rejeitadas (§1), a base R86, a origem atribuída do widget e o OR e o ciclo, sem reabertura.

### Contradição material
**Nenhuma.** Não há política nova nem pergunta nova; QI só substitui Q1/Q2. Não encontrei fonte que já decida QI, Q3 ou Q4.

Restos cosméticos que não mudam o sentido:
- **Menções antigas a "Q1/Q2"** em §6.1 L111, §6.2 L123, §6.3 L136, §7 C e §8 L164. O §5 L82 já as redireciona para os contextos de QI.
- **Rótulos que ainda dizem "R2"**: a coluna "Estado R2" (§1) e "nesta R2" (§4 L74).

Podem ser ajustados numa revisão futura, sem efeito no conteúdo.

### Conclusão R3
A consolidação resolve as omissões e a redação apontadas no adendo R2 e mantém as pendências como pendências.

**Estado:** especificação pendente, sem despacho, sem G0.

**Pendente:**
- **Produto:** QI, Q3 e Q4, conforme decisão ou delegação demonstrada.
- **Coordenação:** C1 (MSG-07).
- **Coordenação/engenharia:** C2 (acoplamento transacional).

Respostas de produto não liberam C1 nem C2. Este adendo não valida política em nome do usuário, não autoriza implementação e não contata ninguém.
