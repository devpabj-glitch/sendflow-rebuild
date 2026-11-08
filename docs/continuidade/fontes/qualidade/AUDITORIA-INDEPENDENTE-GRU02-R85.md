# Reauditoria documental independente — GRU02-NAME-SEARCH v1, R85: somente Δ1 (C §6 L118, controles persistidos)

**Registro:** 07/11/2026 16:59:15 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL restrito ao Δ1 da QA R84. Não executei projeto, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`/`wc`, `unzip -Z1`/`unzip -p` (leitura de bytes), `diff`/`grep` textual e parse do dump só de campos visíveis (thinking/reasoning/analysis descartados).

**Não reaberto:** G0–G6, CSV e a falha de fixture registrada, já suficientes na R84.

Siglas: "T Lnn" = teste R85; "D Lnn" = `data.ts` R84.

## 0. Revisão, integridade, dependências e autoridades

- **Revisão RELATADA:** `a66de577a7bef048f2f56ca5ef55a192b400bd2f`, pai `af1688d3d13d2a4e14fb7523868ce87df249b4a5` (MANIFEST L1–2).
  - Dump L8903: `[main a66de57]`, "1 file changed, 6 insertions(+)".
  - Dump L8906: "working tree clean".
  - Commit, push e CMP são relato. **Git não certificado.**
- **ZIP `PACOTE-ORIGINAL-R85.zip`:** SHA256 `1e93c810b940a42049f74beb6e1612fbb8d460baf156d86f28c72313e7e31135`, **aferido e igual ao esperado**.
  - 6 entradas, todas byte a byte iguais às cópias soltas.
  - Os **5 hashes internos** do MANIFEST (L5–9) dão `OK`:
    - `diff.txt` `cd5b7a21…`
    - `foco.txt` `a21060cb…`
    - `gates.txt` `0d85cce7…` (962 linhas)
    - teste `bf0c27b8…` (246 linhas)
    - `MAPA.txt` `294cb781…`
- **Preparação, conferida pelo ENCAMINHAMENTO L32–42:** ENCAMINHAMENTO `374bcab4…` (52 linhas), CRONOLOGIA `f7b7bc34…` (30), INVENTARIO `8119d86b…` (57), PATCH `5c852fea…` (15) e JSONL `462edb63…` (não usado).
- **Dependências R84** (`/workspace/grupos-evidencias-gru02-r84`): todas iguais ao ENCAMINHAMENTO L45–52.

| Arquivo | SHA256 (início) |
|---|---|
| data.ts | `cdff014a…` |
| dispatch.ts | `5af40470…` |
| README.md | `8d962d68…` |
| aderencia-prompt-mestre-v1.md | `6208850c…` |
| g0-antes-diff.txt | `524b90bc…` |
| foco-falha-fixture.txt | `5ea87a3b…` |
| MANIFEST-SHA256.txt | `37f1e5c5…` |
| PACOTE-ORIGINAL-R84.zip | `f5b74bb9…` |

- **Autoridades, lidas integralmente:**
  - Contrato `PACOTE-GESTAO-GRUPOS-POS-R83.md`, `71ce9b69…`, §6 L118.
  - QA final R84 `/workspace/grupos-qualidade/AUDITORIA-INDEPENDENTE-GRU02-R84.md`, 138 linhas, `4d401bfba8463d803822a772723a476c456d7e094b4abad5b3b40b605cb72908` (aferido). Conforme o registro desta frente QA, o rascunho com hash `765e8b62…` teve a recomendação corrigida antes do envio ao coordenador: retirou-se a sugestão de substituir o assert contratado por aceite da fonte. O SHA final acima foi aferido e comunicado; esse histórico não é declaração de Loigo.
  - Parecer `/workspace/grupos-referencia-visual/PARECER-GRU02-R84-CONTROLES-PERSISTIDOS.md`, 26 linhas, `1e00d903536f1b6820d4fbb9c5738dbdde63c41db9a9b739bad0b19ed8de41a8`, datado de 16:53 (L2), antes do diff (dump L8877, 16:54:51).

## 1. Diff

- Meu `diff` das cópias R84 → R85 dá **só a inserção de 6 linhas** depois de T L154 (T L155–160). Nada removido ou alterado.
- O resultado é idêntico ao `diff.txt` L9–14 (git, blobs `87f0c0e` → `d5e2c72`) e ao PATCH L1–15.
- **Fora do diff:** fixture, runtime, CSV e asserts anteriores.

## 2. Δ1 está fechado?

| Ponto (C L118; PD L14–20) | Evidência | Classe |
|---|---|---|
| **Assert sobre a tabela persistida** | T L155–160 aplica `expect(baseline.groups).toEqual(expect.arrayContaining([...objectContaining...]))` a `baseline = six(db)` (T L154). `six` é `SELECT * FROM groups ORDER BY id` (T L22), linhas cruas da tabela e não resposta da API. Nenhuma busca roda antes do baseline: a primeira chamada é T L168 | **SUFICIENTE** |
| **`controlRio`** | T L157: `{ id: controlRio.id, name: "Rio", campaign_id: control.id }` | **SUFICIENTE** |
| ↳ `id` | Objeto devolvido por `createGroup` na fixture (T L135) | |
| ↳ `name` | "Rio" literal declarado em T L135 | |
| ↳ `campaign_id` | Campanha Controle, `createCampaign` (T L103) | |
| ↳ coluna gravada | O INSERT grava `campaign_id` e `name` nessas colunas (D L1086–1095) | |
| **`foreignRio`** | T L158: `{ id: foreignRio.id, name: "Rio", campaign_id: foreign.id }` | **SUFICIENTE** |
| ↳ `id` | Objeto devolvido por `createGroup` na fixture (T L136, org Sul) | |
| ↳ `name` | "Rio" literal declarado em T L136 | |
| ↳ `campaign_id` | Campanha Sul, `createCampaign` (T L119) | |
| **Independência** | Os valores esperados vêm da fixture ou de literais, não da resposta pesquisada. As ausências (T L184, L212, L220 em R85) e o INSERT continuam, mas não substituem o assert | **SUFICIENTE** |
| **Escopo (PD L20)** | `objectContaining` com id/nome/campanha basta para os controles. O DTO integral do alvo segue em T L168–170 | Conforme, sem critério novo |
| **Resultado** | Foco bruto `foco.txt` L6–9: 1/1, 144 ms. Dump L8880 (16:54:53): EXIT:0, depois do último diff | **SUFICIENTE**, como relato bruto |

## 3. Gates, inventário e rastreabilidade

- **`gates.txt`:** TSC:0 L1; LINT:0 L6; teste L833; 51 arquivos L872; 197 testes L873; VITEST:0 L877; mtime L878; BUILD:0 L962.
- **Inventário próprio:** as entradas `✓ …test.ts (N)` do log R84 e do R85 são **idênticas**: 51 nomes, mesmas contagens. Confere com o INVENTARIO L3.
- **Dump** (8914 linhas):

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8864 | 16:54:40 | Base `af1688d3` |
| 8867–8874 | — | Leituras |
| **8877** | **16:54:51** | **Único e último diff** |
| 8880 | 16:54:53 | Foco |
| 8883 / 8886 | 16:54:57 / 16:55:53 | Gates (stdout vazio) e grep do log: 197, VITEST 0, BUILD 0 |
| 8891 | 16:55:56 | Diffstat pré-commit: 1 arquivo, +6 |
| 8894–8900 | — | Leituras e listagens |
| 8903 | 16:56:11 | Commit |
| 8906 | 16:56:15 | Push e árvore limpa |
| 8909 | 16:56:33 | Cópias, manifesto e ZIP `1e93c810…` |
| 8912 | 16:56:42 | `CMP_ZIP_OK` |

Sem diff visível depois de L8877 até L8914. A ordem último diff → foco → gates → commit → CMP vale como relato observável.

## 4. Limites (fatos × relatos)

- **Fatos aferidos:** ZIP, hashes, dependências, o diff de 6 linhas, a fonte do assert e da fixture, e o inventário textual.
- **Relatos:** commit, push, blob, foco, gates e CMP. Sem hash de árvore por gate nem rerun pós-commit.
- **Pacote:** o runtime não foi reenviado; a dependência R84 foi aferida.
- **Outros:** dispatcher não é TCP; o mtime não prova o banco; as mensagens de erro SQL do log vêm de testes aprovados.

## 5. Conclusão

**Δ1 FECHADO.** C §6 L118 está cumprido: alvo e controles existem com IDs e nomes assertados.
- O alvo, pelo DTO integral (T L168–170).
- `controlRio` e `foreignRio`, por assert sobre o `SELECT *` persistido (T L155–160), com id, `name` "Rio" e `campaign_id` tirados da fixture, sem usar a resposta pesquisada.

Com G0–G6, o CSV e a falha de fixture já suficientes na R84, há **SUFICIÊNCIA DOCUMENTAL do recorte GRU02-NAME-SEARCH v1** na revisão relatada `a66de577…`:
- delta material vazio e nenhum bug demonstrável;
- máximo registrável pelo coordenador: **PROVADO LIMITADO — busca literal por nome na lista local de grupos** (C L127).

Este parecer não homologa GRP-GRU-02 inteiro, toolbar, UI nem produção, e **não libera a próxima fatia**: a decisão é do coordenador.
