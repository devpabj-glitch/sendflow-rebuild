# DEC-06 — decisão explícita do usuário: coexistência dos dois sinais

Registro documental: 07/11/2026 18:02:02 America/Sao_Paulo (UTC−3). Nenhuma mudança em PM/matriz/ADERENCIA/histórico, código, banco ou operação.

## Origem e precisão temporal

**Origem: mensagem DIRETA do usuário, verificada por Grupos — Execução Backend via ReadTranscript**, conforme a fonte e o texto literal fornecidos nesta ordem documental. Não é opção escolhida por agente nem fala do vídeo.

Localizador da verificação direta: agente `grupos 6b330ef9-b86a-4d48-a676-a8e1d296fe5f`, posição **849**, `speakerId cu:[ID-REDIGIDO]`, busca após17h55 de07/11/2026. A consulta direta foi realizada por Grupos — Execução Backend antes da preparação deste arquivo; o texto foi fornecido integralmente para sua elaboração documental.

**Horário atribuído ao encaminhamento: 07/11/2026 17:58 America/Sao_Paulo (UTC−3)**, informado pelo coordenador. O transcript citado não trouxe timestamp próprio da mensagem. Não atribuir17h58 como timestamp nativo comprovado do transcript.

## Texto literal completo recebido

```text
Decisão do usuário sobre DEC-06 (grupo cheio):

Considerar os dois sinais (opção C).

Regras:
- Marcação manual como cheio → o grupo fica cheio, mesmo abaixo do limite.
- Atingir o limite calculado → o grupo fica cheio automaticamente.
- O gatilho “encher grupo” dispara nos dois casos.
- As duas formas coexistem. Não inventar precedência além disso.

Registre a decisão, atualize o contrato se necessário e continue a seleção/implementação da função principal de grupos sem travar nessa regra.

Uma fatia por vez. Sem regressão. Reporte o próximo passo encaminhado.
```

## Efeito contratual exato

1. Classificação lógica de cheio: **marcação manual full OU atingimento do teto calculado local**. Cada sinal basta independentemente. Ambos verdadeiros continuam verdadeiro, sem prioridade adicional.
2. Marcação manual abaixo do teto continua cheio. Desmarcar manualmente não elimina o outro sinal se o teto continua atingido. Isso é aplicação do OR, não nova precedência.
3. **Demanda expressa preservada: gatilho “encher grupo” nos dois casos.** Não omitir, revogar nem tratar como opcional. Esta mensagem não fixa frequência, dupla ocorrência quando ambos sinais se sobrepõem, rearme ou entrega de efeito externo.
4. A nova decisão supera **neste ponto** a falta de definição manual×calculado da seleção pós-R85 e do parecer17h02. Não reescrever os textos anteriores como se a decisão existisse antes. Não fecha DEC-06 integralmente quanto à implementação/temporalidade do gatilho.
5. Não altera DEC05/07/08/12/14/16, status persistidos, available, KPI, ocupação informada, regra de reservas, roteamento, provedor ou política de ação externa por analogia.

## Próximo passo documental preparado

Único contrato: `PACOTE-DEC06-FILTROS-CHEIOS.md` — classificação/filtros de leitura, com demanda do gatilho rastreada em seção própria e limites materiais isolados. A classificação autorizada não fica bloqueada pela definição temporal ainda ausente do gatilho.

**Nenhum encaminhamento foi realizado por esta frente.** Contrato pronto para leitura e parecer pré-mudança solicitado pelo coordenador. Implementação só pelo escritor único sob coordenação; este trabalho não enviou cloud/mensagem nem executou produto/testes/DB/Git.


## ADENDO ATRIBUÍDO — ciclo do gatilho, registro 07/11/2026 18:34:34 America/Sao_Paulo (UTC−3)

**Proveniência diferente da decisão OR acima; não substituir nem promover a verificação direta anterior.** Coordenador informa ter recebido resposta direta do usuário às **18h29 de07/11/2026 America/Sao_Paulo (UTC−3)** no widget **t210s872**, e forneceu o valor literal às18h30, horário do encaminhamento. **A consulta Backend SearchTranscripts/ReadTranscript em torno da posição873 NÃO exibiu a resposta do widget**, apenas prosa/pergunta/relato de agente. Não há endereço próprio da resposta ou posição exportável informada; não inventar localizador ou leitura direta Backend dessa resposta.

**Cabeçalho informado pelo coordenador (não extraído diretamente por esta frente):**
> [Answering your question t210s872: "O gatilho deve disparar uma vez ao passar de não cheio para cheio, sem repetir enquanto continuar cheio, e poder disparar novamente após esvaziar e voltar a cheio?"]

**Literal fornecido PELO COORDENADOR da resposta direta recebida por ele:**
> Sim. Disparar uma vez ao passar de não cheio para cheio, sem repetir enquanto continuar cheio. Permitir novo disparo depois de voltar a não cheio e encher novamente.

**Regra COMO ENCAMINHADA:** uma ocorrência na passagem F=false→F=true pelo OR; nenhum novo disparo enquanto F=true, inclusive quando surge o segundo sinal; rearmar só após F=false e nova passagem para true. Não reabrir a pergunta nem exigir repetição do usuário. Origem documental atribuída é suficiente para preparar proposta; **não é leitura direta Backend, certificação independente do widget ou autorização universal/operacional**.

Contrato único preparado: `PACOTE-GATILHO-ENCHER-GRUPO-CICLO.md`. Escolhas novas de engenharia e políticas de baseline/prospectividade são identificadas lá como PROP para parecer/alinhamento; não atribuí-las a esta resposta. Nenhum envio/implementação realizado nesta frente.
