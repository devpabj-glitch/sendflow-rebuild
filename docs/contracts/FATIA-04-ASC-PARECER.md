# PARECER DE ADERÊNCIA — FATIA 4: ASC (Contas×Campanhas)

> **Veredito: ADERENTE** ✅ — com 2 ressalvas menores, não bloqueantes.
> **Parecerista:** A4 Referência · **Data:** 08/11/2026 · **Branch:** `a1/asc`
> **Objeto:** `docs/contracts/FATIA-04-ASC-CONTRATO.md` (contrato documental, sem código de servidor)
> **Fontes conferidas:** mapa 05 §ASC (GRP-ASC-01..04), PM §9.1 (DEC-04, DEC-14), F3-CONTRATO §0.2 (D13) e §2.1.5/§2.2 (replace/lexicográfica), `api/test/releases.test.ts`, suíte executada nesta branch (**70/70, 7 arquivos — verificado ao vivo**).

## Checklist a–f

| # | Questão | Veredito | Evidência |
|---|---|---|---|
| a | Escopo: ASC-01 front-only; pulados corretos | **OK** | Mapa ASC-01 é requisito de tela (OBS-M, "contador = associações persistidas") e o backend D13 já existe testado (PATCH accountIds). ASC-02 pulado por **DEC-04** literal (PM §9.1 L606: "papéis por conta; conteúdo do range"). ASC-03 pulado por pré-requisito **ACM** (mapa: "validação servidor = PROP CK16 F02"; a nota do contrato de que ENG-02 já é satisfeito no vínculo pela validação existente é correta). ASC-04 pulado por **DEC-14** (L616); o critério determinístico `archived=false ∧ accountIds=0` é leitura mínima de dado real que **não** decide "cobertura adequada" — aceitável e condicionado ("se a A2 mantiver o rótulo"). |
| b | Cruzamento client-side + PATCH replace aderente ao PM, sem invenção | **OK** | O PM não pede endpoint dedicado (ASC-01 é tela). A recomendação §2 é fundamentada: as duas listas completas já são necessárias à matriz e `accountIds` viaja em cada item (agregação `IN`, sem N+1 — F3 §2.2 confirmado). Toggle = 1 PATCH com conjunto completo (semântica replace da D13/F3 §2.1.5, testada em T1 L209). Contador N/M derivado do servidor atende a aceitação do PM. |
| c | Concorrência "último PATCH vence" declarada | **OK** | §3.7 declara o lost-update com exemplo concreto, sem lock/ETag inventado, aceita no volume e aponta mitigação parcial (releitura pré-PATCH). Risco 2 o registra. Contrato técnico honesto. |
| d | Sem endpoint/teste novo; 70/70 sustenta | **OK** | Suíte re-executada nesta branch: **7 arquivos, 70/70 verdes**. `releases.test.ts` cobre exatamente o que a ASC exercita: replace do conjunto (T1 L209), PATCH sem `accountIds` preserva (L248), dedupe incl. caixa alta/baixa pós-auditoria (L129/L402), validação não-array/não-UUID/inexistente/**outra org** → 400 genérico (T2 L367). Como a fatia não produz código de servidor, a cobertura existente basta. |
| e | KPIs/métricas sem invenção | **OK** | §3.5 proíbe Online/Offline inexistente (`connectionStatus` só `'nao_conectada'`, F2); "exposta/ociosa" apenas como derivadas com critério declarado; DEC-14 segue ABERTA (§7). Confirmado. |
| f | Pendências de dono listadas | **OK** | §7 lista DEC-04, DEC-14, ASC-03/ACM (pré-requisito), endpoint agregado (condicional, com gatilho medido) e DELETE (D5). Completo; nenhuma pendência bloqueia a fatia. |

## Ressalvas (menores, não bloqueantes)

1. **"Conta ociosa" × texto da UI:** o contrato (§3.4) define ociosa = 0 associações (todas as releases), mas o mapa GRP-CTA-04 registra o texto da UI como "sem campanha **ativa**" (fórmula = DEC-14). Conta associada só a release arquivada diverge entre as duas leituras. O risco de derivação sem semântica PM está declarado (Risco 3), mas essa diferença específica não está explícita — sugerir que a A2 não exiba o rótulo "ociosa" como dado oficial até DEC-14, ou o alinhe ao critério "sem associação a release não-arquivada".
2. **Rótulo "Campanhas expostas" futuro:** o critério determinístico contratável é razoável, porém quando DEC-14 definir "cobertura adequada" o rótulo pode mudar de significado para o usuário. O contrato já condiciona o uso ("se a A2 mantiver"); registrar apenas para que a A2 trate o rótulo como provisório na UI.

## Pontos de qualidade que reforçam o parecer

- A não-criação de "D14" para não colidir com a DEC-14 do PM é prudência correta de numeração.
- Escala do cruzamento cliente declarada com limite e gatilho de revisão (§2) — sem otimismo escondido.
- Smoke S1–S8 cobre persistência, contador nos dois eixos e isolamento tenant (S7 com assert de impossibilidade, que é o único tipo de assert possível dado que não há chamada cross-org).
