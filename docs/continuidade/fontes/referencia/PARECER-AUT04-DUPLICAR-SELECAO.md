# PARECER pré-mudança — AUT04-DUPLICAR-SELECAO v1 (resposta ao §7)
Registro: 07/11/2026 22:10 America/Sao_Paulo (UTC−3), pelo date do sistema. Documental e interno. Não autoriza escritor, G0 nem execução, e não contata ninguém. O arquivo não existia antes; não há histórico a preservar.

## Fontes e limites
- `grupos-execucao-backend/PACOTE-AUT04-DUPLICAR-SELECAO.md`, lido integralmente: 91 linhas pelo wc (92 relatadas; a última sem quebra), 19.090 B, sha256 `9c0eb53a85f4dfea0adee6695646c600b32204a1218b270da8dabe6723f17d95`.
- PM `5f74532b…`, L345 GRP-AUT-04: comando de massa "Duplicar" e critério PROP "Duplicar cria cópia independente; desativar não perde config".
- PARTE-04 L18 (29:27): o comando de massa Duplicar é visto; o resultado não foi amostrado.
- `PARECER-GRP-AUT-04-DUPLICACAO-LOCAL.md` (31 linhas, `f291fbced0d5…`): status inicial, agenda e vínculos eram materiais no recorte individual. `PARECER-AUT04-BULK-STATUS-POS-R86.md` (`3b22d9a10d4d…`): lote de estado.
- **Relato, não verificado por mim:**
  - base R89 `c244ad1…` com 201/53, e aceite PROVADO LIMITADO do lote de estado (relato do coordenador às 22h07);
  - M88 L115, nas oito colunas transcritas no §2 do pacote (não abri a cópia da matriz);
  - corpo J89 L628–693 e D88 / README88 / gates.txt / dump (é código e log; não abri `.ts`, repo nem cloud).

## Confronto
1. **PM e PARTE-04:** o comando de massa existe como observação. O resultado interno da cópia não foi mostrado no vídeo, por isso transporte e atomicidade são PROP, declaradas como tal (§2, §4). Não há atribuição indevida ao vídeo.
2. **M88 L115 (relato):** o Estado e limite diz "sem duplicar ou excluir em massa", o que delimita a lacuna. A Próxima ação ("Feitas a cópia de uma, o filtro… e a ativação ou pausa da seleção. Não é o módulo de automação") não proíbe nem autoriza a ampliação. Não ampliei a afirmação de ausência: o G0 reaproveita um equivalente se ele existir.
3. **Parecer individual anterior:** as três questões materiais dele (status inicial, agenda e vínculos) aparecem, pelo relato, resolvidas no duplicador individual já aceito: cópia sempre paused, next_run_at recalculado só para a cópia com futuro de até 366 dias, mesma campanha e sem trocar alvo. O lote só reusa isso e **não reabre nem decide de novo**. Isso depende de a fonte efetiva confirmar, no G0, esse comportamento do helper.
4. **Completed:** pela leitura relatada, o duplicador não recusa por status completed. O pacote **não importa** a recusa do toggle/bulk de estado (§3.3, §6). Isso é coerente: copiar não reativa, a cópia nasce paused e a origem fica intacta. O "once" passado continua recusado por falta de futuro. Nada disso é política nova; é reuso. Hoje não há teste de completed; o D2 cobre, como o pacote reconhece.
5. **PROP de engenharia:** endpoint dedicado com 201 e namespace de recibo separado; limite de 1–100 IDs **antes** da deduplicação (igual ao R89 relatado); deduplicação exata na primeira ordem; tudo ou nada; um único `now` capturado **depois** da trava; replay com a resposta original, sem recalcular; hash pelo mecanismo existente, sem canonicalização inventada. Tudo explícito e sem mudança no bulk de estado nem no adaptador global. Coerente.
6. **G0/D1–D7:** finitos e discriminantes (completed com futuro, once passado, mistura que prova tudo ou nada, falha depois da 1ª inserção ou antes do recibo, replay depois de mudanças, concorrência com barreira na seção do DB, reabertura e gates depois do último diff). Nenhum pede prova universal nem combinação total de calendários.
7. **Independência:** sem gatilho AUT-03/QI/Q3/Q4, UI, JSON, exclusão em massa, provider ou pacote de envio. Copiar ação WhatsApp gravada não conecta o provider.

## Pontos de atenção (não materiais)
- **Uma origem sem futuro trava o lote inteiro.** Com tudo ou nada, um único "once" passado ou uma agenda inválida na seleção recusa tudo. É consequência declarada da PROP, não contradição.
- **Nomes iguais.** Pedidos distintos ou origens homônimas podem gerar cópias com o mesmo nome, como já acontece no individual. É herança, não requisito novo.

## Conclusão
**Nenhuma contradição material com as fontes e nenhuma decisão de produto adicional necessária para este reuso.**

O contrato amplia só o transporte do duplicador individual e reusa a semântica dele (paused, próximo futuro, recusas reais, sem a proibição de completed do bulk de estado). Isso está condicionado à confirmação no G0 do corpo efetivo do helper, do mapeamento de erros e do recibo, que hoje são relato.

**Pendência:** apenas a decisão coordenada de encaminhar. Encerramento máximo futuro: PROVADO LIMITADO, duplicação local de uma seleção com cópias paused. Não é o módulo AUT nem GRU, e este parecer não autoriza execução.
