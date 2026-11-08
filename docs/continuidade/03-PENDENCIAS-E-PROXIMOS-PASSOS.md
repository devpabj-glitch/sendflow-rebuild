# 03 — Pendências, divergências, dependências e roteiro do começo ao fim

## 1. Ações imediatas (já definidas pelos responsáveis)
1. **Coordenador:** entregar este pacote ao escritor único para um commit **só de documentação** em `docs/continuidade/` (caminhos em `04-INDICE-FONTES.md`). Sem tocar código, sem merge ou publicação do PR #6, sem alterar a branch dele.
2. **Escritor `bc-ab0ec626`:** concluir a 1ª fatia (persistência/API/auth + testes). Entregar SHA base e final, gates (typecheck/lint/test/build) depois do último diff, variáveis **por nome**, plano de migração reversível e rollback. Parar para revisão.
3. **Backend:** cruzar a topologia que o escritor propuser com o inventário Railway (não há API/banco/volume dedicados no projeto às 00:34).
4. **Qualidade:** aplicar `fontes/qualidade/MATRIZ-VALIDACAO-SENDFLOW-INTEGRACAO-V1.md` ao commit entregue.
5. **Usuário:** decidir DEC/LAC abertas antes de qualquer função que dependa delas (PM §9).

## 2. Divergências documentadas, sem resolução neste pacote
| Tema | Fonte A | Fonte B | Situação |
|---|---|---|---|
| Status do PM-GRUPOS | Cabeçalho do PM: consolidação **derivada / proposta** para alinhamento, não o original histórico | Coordenador (pos. 1001): "PM consolidado aprovado 07/11" (aprovação relatada às 09:28) | As duas procedências ficam preservadas. O PM não é o original histórico e não prova aprovação de cada [PROP] |
| Regra de "cheio" | `DECISAO-DEC06-GRUPO-CHEIO.md`: "considerar os dois sinais"; efeito contratual: manual **OU** teto calculado, cada sinal basta | Referência: "Cheio considera manual **E** calculado" | Em código, o PR #6 implementa `manual || calculated` e o legado R86 usa OR. Leitura compatível: os **dois sinais são considerados** e qualquer um basta. A Qualidade pediu confronto com a fonte antes de reinterpretar. Não reabrir a escolha exclusiva |
| AUT-04 duplicar | A matriz legada registra a cópia de uma automação | A Backend: só pacote + parecer, sem implementação final comprovada | Não resolvida; sem auditoria QA |
| Percentuais de fidelidade | `DEV/HANDOFF.md` no repo: ~90–93% | Referência e Qualidade: sem método nem medição; não declarar percentual | Tratar como autodeclaração, não como evidência |

## 3. Riscos encontrados na leitura do repositório (repo público)
- `app/src/auth.ts` (`main`) tem um usuário inicial com senha fixa no código, e o login é só no cliente. A integração de auth precisa remover isso. Ninguém deve usar essa credencial.
- `capturas/*.json`, `capture/`, `checks/` e `investigation.cany/` estão no repositório público, com conteúdo não revisado. Há risco de dados pessoais do material de referência. Antes de novas publicações, alguém autorizado precisa fazer a revisão de privacidade.

## 4. Ordem de execução — **PROPOSTA DO SUPERVISOR, NÃO É AUTORIDADE**
Esta sequência deriva das regras registradas (PM DIR: backend/função antes do acabamento visual, regressão por função, sem extras, sem declarar 100%) e das dependências entre módulos do PM. **O coordenador decide;** onde houver conflito, valem o coordenador e o usuário.
1. **Fundação:** auth de servidor, organização/tenant, persistência, migrações e API base. Pré-requisito de tudo; substitui o localStorage e o usuário fixo.
2. **Entidades núcleo, sobre as telas T existentes:** Contas (CTA, `/whats/accounts`) → Campanhas (CMP, `/whats/campaigns`) → Contas×Campanhas/associação (ASC, `/whats/accounts-campaigns`) → Grupos (GRU, `/whats/group-search` e detalhe) → Projetos (PRJ, hoje placeholder).
3. **Link único e distribuição:** VGC, REC, CRG, IMP. Dependem de GRU/CMP e, em parte, de provedor (BLOQ-EXT).
4. **Fila e ações:** FIL, ACM (`/whats/actions`), MSG (sem tela), AUT (`/whats/automations`; o gatilho "encher grupo" só depois de QI/Q3/Q4).
5. **Integrações e controles:** WHE/WHS (`/whats/webhooks` é ambígua; definir antes), ASP/BLK (`/whats/seguranca`), SOL, LSC, ATV.
6. **Métricas** (MET): exigem semântica definida (DEC). Não inventar fórmulas.
7. **Dependentes de provedor ou IA:** INT, IAG, BRD, TRN (BLOQ-EXT).
8. **Visual final:** VIS/FIN. As áreas ZZZ (conteúdo desconhecido) não devem ser presumidas.

Os recortes legados da seção B do 01 podem servir de **especificação de recorte**. Precisam ser reimplementados e testados no repositório novo; equivalência não é presumida.

## 5. Ciclo por fatia (começo, meio e fim), igual para qualquer IA
1. **Começo:** o coordenador escolhe 1 ID ou recorte do `05-MAPA-FUNCOES-182.md`. A Backend escreve o contrato técnico (entradas, saídas, erros, persistência, tenant). A Referência dá parecer de aderência ao PM e ao vídeo, sem inventar.
2. **Meio:** o escritor único implementa, com testes dirigidos ao contrato e regressão completa depois do último diff, e registra SHA e logs.
3. **Fim:** a Qualidade audita (suficiência ou delta mínimo); o coordenador registra o aceite **limitado ao recorte**; deploy só com autorização expressa do usuário, seguido de verificação SUCCESS e checagem pública/autenticada.

**Critério de aceite:** o contrato da fatia aprovado pelo coordenador. A coluna "Aceitação PROPOSTA" do PM é ponto de partida; [PROP] precisa de decisão. Sem decisão, a fatia não avança naquele ponto.

## 6. Bloqueios principais
- Decisões de produto (DEC-01…21, LAC, gatilho QI/Q3/Q4).
- Provedor WhatsApp/Meta para os IDs BLOQ-EXT.
- Inexistência de backend no repositório novo (em construção pela 1ª fatia).
