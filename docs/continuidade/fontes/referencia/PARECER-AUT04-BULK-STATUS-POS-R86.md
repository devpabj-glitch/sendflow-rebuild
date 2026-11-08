# PARECER pré-mudança — AUT04-BULK-STATE v1 (resposta ao §7 da SELECAO-INDEPENDENTE-POS-R86)
Registro: 07/11/2026 19:23 America/Sao_Paulo (UTC−3), pelo date do sistema. Documental. Não autoriza escritor, G0 nem execução, e não contata ninguém.

## Fontes (lidas integralmente)
- `grupos-execucao-backend/SELECAO-INDEPENDENTE-POS-R86.md`: 134 linhas pelo wc (135 relatadas; a última sem quebra), 25.311 B, sha256 `94e567f2b9b786348951c1e17e92a297a334c7e1606395c72fb3f894e4b28c90`. Inclui o apêndice com a matriz R86 L112–118, L74 e L100 (oito colunas).
- PM `5f74532b…`, L345 GRP-AUT-04: lista, toggle, filtros Ativado/Desativado/Todos e "massa Desativar/Ativar/Duplicar/Excluir". Aceitação PROP: "desativar não perde config".
- PARTE-04 L18 (29:27): ações em massa Desativar/Ativar/Duplicar/Excluir **vistas como comandos**; o resultado não foi amostrado.
- `PARECER-GRP-AUT-04-DUPLICACAO-LOCAL.md` (31 linhas, `f291fbced0d5…`), L5–12: "Fora: … ativar/desativar em massa". É recorte daquela fatia, não proibição.
- `PARECER-AUT04-STATUS-READ-V1.md` (`ad3ebb1e8db6…`): filtro de leitura.
- **Limite:** dispatch.ts L762–798, jobs.ts R80 L508–526/L957–1026, README R86 L64/84 e as QA citadas no §4 são **relato do Backend**. Não abri `.ts` nem a matriz original.

## Confronto
1. **Fonte e materialidade.** A operação é vista na UI (OBS-M, PM L345, P4 L18) e é função de gestão real, não filtro nem metadado. A matriz L115, nas oito colunas, diz no Estado e limite "**sem massa**". A Próxima ação ("Feita a cópia de uma e o filtro… Não é o módulo de automação") não proíbe nem autoriza a ampliação. Não encontrei contradição material.
2. **Equivalentes.** O filtro de status e a duplicação de uma automação são distintos e já aceitos. O toggle individual (POST que alterna paused↔active, recusa completed e não recalcula agenda) é **o caminho a reusar**, segundo o relato. Nas fontes documentais não há equivalente de lote comprovado. A ausência é delimitada: o "sem massa" da matriz mais os corpos singulares relatados, a confirmar no G0. Não é ausência universal.
3. **Contrato PROP (§5).** É coerente com o individual:
   - ação explícita activate/deactivate, com o estado-alvo definido em vez de inversão;
   - no-op quando o item já está no alvo;
   - completed recusado em lote;
   - IDs de outra org ou inexistentes dão 404, sem filtragem silenciosa;
   - nenhum schema novo;
   - Idempotency-Key e replay com a resposta original;
   - "desativar não perde config", que atende à aceitação do PM.

   O "tudo ou nada", o limite de 100 IDs e a deduplicação de IDs são **PROP de engenharia** declaradas como tal, não política de produto. Nada disso cria DEC.
4. **Independência.** Não toca o gatilho AUT-03 nem QI/Q3/Q4, cuja resposta é relatada, não verificada por mim e não usada aqui. Também não toca conjuntos grupais (AUT-02 PEND), pacote de envio (MSG-07), recorrências (DEC-15), duplicar/excluir em massa, JSON, UI ou provider. Não reagenda, não cancela fila e não fabrica false_sent (FIL-07 preservado).
5. **G0/B1–B7.** São finitos: discriminam mistura de estados, completed, foreign, rollback depois da escrita, replay, runner com barreira na seção do DB, reabertura e gates depois do último diff. Nenhum pede prova universal.

## Ponto de atenção (não material)
Reativar em lote automações paused com next_run_at vencido deixa o próximo tick materializar essas ocorrências, como já acontece no individual (§5.2). Num lote, isso pode materializar várias de uma vez, inclusive ações locais reais como capacity.review e reservation.expire. É comportamento herdado, não política nova. O B5 cobre, e a coordenação deve só ter ciência.

## GRU (§2) e enquadramento
- O quadro do §2 é coerente com os extratos de matriz que já li (GRU-01..10, CRG, IMP) e está delimitado: não afirma que o backend está completo.
- **Limite meu:** não revisei item a item Detalhes/Editar/Remover do menu ⋮ (GRU-06 junta os itens). A coordenação investiga GRU em paralelo, então não duplico.
- **Enquadramento:** AUT-04 em massa **está fora de GRU**. Não avança o pedido do usuário (pt59u: funções de grupos iguais ao painel) e não pode ser encaminhado como se o cumprisse. A prioridade é da coordenação.

## Conclusão
**Sem contradição material, sem política indevida e sem equivalente de lote comprovado.** A lacuna está demonstrada de forma delimitada (matriz "sem massa" + fonte visual + toggle individual relatado). O contrato é finito e independente do gatilho.

Encerramento máximo futuro: **PROVADO LIMITADO** a ativar/desativar uma seleção de automações locais. Depende do G0 e de decisão coordenada. Este parecer não autoriza execução.
