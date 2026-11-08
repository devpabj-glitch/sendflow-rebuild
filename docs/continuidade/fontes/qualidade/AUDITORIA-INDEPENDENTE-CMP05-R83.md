# Reauditoria documental independente — CMP05-STATUS-READ v1, R83: somente Δ1 (C1, DTO integral)

**Registro:** 07/11/2026 16:39:34 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL restrito ao Δ1 da auditoria R82. Não executei projeto, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`/`wc`, `unzip -lv`/`unzip -p` (leitura de bytes, sem extrair), `diff`/`grep` textual e parse do dump só de campos visíveis (thinking/reasoning/analysis descartados).

**Não reaberto:** C0, C2–C6 e a parte de ordem, subconjuntos e `active` de C1, já suficientes na R82.

Siglas: "T Lnn" = teste R83; "D Lnn" = `data.ts` R82; "C Lnn" = contrato; "PD Lnn" = parecer pré-correção.

## 0. Revisão, integridade, dependências e autoridades

- **Revisão RELATADA:** `3ae39917f24f0dd4e971eaf5b743d09efef3cfc3`, pai `c20cb6400b266606857cd89aa52147cbb67dcbd7` (MANIFEST L1–2; dump L8767 `[main 3ae3991]`, "1 file changed, 11 insertions(+), 11 deletions(-)"). Commit, push e CMP (MANIFEST L3; dump L8770) são relato. **Git não certificado.**
- **ZIP `PACOTE-ORIGINAL-R83.zip`:** 12540 B, SHA256 `d62eeab687b2795467f7bb7155141c9d6e9c6f892ec4bc4e1800f2f27f4dbadc`, **aferido e igual ao esperado**.
  - 5 entradas (teste, foco, gates, MANIFEST, MAPA), todas byte a byte iguais às cópias soltas.
  - Os **4 hashes internos** do MANIFEST (L5–8) dão `OK`:
    - teste `cf6a80b7…` (230 linhas, 10983 B)
    - foco `0c9ae345…` (12 linhas)
    - gates `29313fb9…` (961 linhas)
    - MAPA `cd61e6cd…` (15 linhas)
- **Preparação, conferida pelo ENCAMINHAMENTO L32–41:** ENCAMINHAMENTO `3cfb068a…` (50 linhas), CRONOLOGIA `dfa4080d…` (29), INVENTARIO `e34c79f2…` (56), PATCH `7bae748d…` (45) e JSONL `356ee8b0…` (não usado).
- **Dependências R82, todas iguais ao ENCAMINHAMENTO L44–50** (`/workspace/grupos-evidencias-cmp05-r82`):

| Arquivo | SHA256 |
|---|---|
| data.ts | `f9655a5be5504e0505a942dba02632a7a13d0066d204828b3fed8ddcf036c180` |
| dispatch.ts | `9266be6923fa056e2a1e54cb950cd9adb0299970106925caf12beadbf27781db` |
| README.md | `23bbb4a690ec360fa36ad6453af704a78bfa8d4daf1bd960561bda63ce89f313` |
| aderencia-prompt-mestre-v1.md | `556b624bbc690b0fbd0c3474ee300ce287c51b29b33f2a9f24cf4158701e5e35` |
| c0-antes-diff.txt | `d99f45e1d3c14cf947a8074205bc8d9eaadc1faf15238f0f43a3a673ac2771be` |
| MANIFEST-SHA256.txt | `a726b5c9580fa0447ab88b4e1faf430daa87c4237989137b1616345eb5b38584` |
| PACOTE-ORIGINAL-R82.zip | `152fa758d424a660e540a88c5e03992b75fd4411961db27a8ff02c48b5330644` |

- **Autoridades:**
  - Contrato `PACOTE-PROXIMA-FATIA-POS-R81.md`, `d6dc6326…`, C1 em L108.
  - Parecer `PARECER-CMP05-STATUS-READ-V1.md`, `70b84dea…`.
  - Parecer pré-correção `/workspace/grupos-referencia-visual/PARECER-CMP05-R82-DTO-INTEGRAL.md`, 26 linhas, `9f4c438262b0b2efe98741487090e352f178bb60d8a3eddd5d345108b140684c`, lido integralmente.
- **Auditoria R82 desta frente:** o arquivo atual tem 140 linhas e `8482b73b24b4922188d28a361c1c46af6870181c12c136c049b97e7db2647185`, o valor que o ENCAMINHAMENTO L13 e o PD L5 citam. **Rastreabilidade:** o rascunho inicial tinha hash `bcfae7cf…`; antes da entrega ao coordenador, a própria frente QA substituiu a sugestão de aceitar prova estática por declaração de que ela não dispensa o assert contratado. Essa correção documental gerou o hash final `8482b73b…`, comunicado ao coordenador e citado no encaminhamento. Não há divergência de proveniência pendente.

## 1. O diff (test-only)

- **Patch documental:** `DIFF-DOCUMENTAL-TESTE-R82-R83.patch` L1–45. Refazendo o `diff -u` das cópias R82 → R83, as linhas +/− são **idênticas** ao patch, com 11 inserções e 11 remoções.
- **Conteúdo do diff:**
  - T L11: `import type { Campaign }`.
  - T L157–163: oráculo `oracle: Campaign[]`, igual ao retorno de `createCampaign` com `updatedAt` substituído.
  - T L166–167: `expect(openItems).toEqual(oracle)`.
  - T L172–173: em cada filtro, `expect(items).toEqual(oracle.filter((item) => item.status === status))`.
  - Removida a projeção de 7 campos de R82 (T L156–166, L172–173 antigos).
- **Fora do diff:** runtime, docs e fixture. O blob do teste é relatado (MAPA L15, `9c22d55a…`).

## 2. Δ1: o oráculo é independente e exato?

| Ponto (C L108; PD L14–20) | Evidência | Classe |
|---|---|---|
| **Fonte do oráculo** | `createCampaign` (D L535–608) monta o DTO como **literal próprio** (D L559–573): 15 campos, incluindo `projectName` calculado, `redirectToken` gerado, `creatorAccountId`/`senderAccountId` null, `createdAt`/`updatedAt` = timestamp. Depois faz INSERT e devolve esse literal (D L607). Não lê pela listagem e não passa pelo `mapCampaign` nem pelo `CAMPAIGN_SELECT` (D L449–472, L485–492). É saída de um contrato **existente**, independente do caminho novo do filtro; não reutiliza resposta testada nem duplica o parser | **SUFICIENTE** |
| **Alterações depois da criação** (PD L20) | A fixture só altera `updated_at` das 5 Norte, com carimbos explícitos (T L100–109; SQL em T L108). Os demais efeitos pós-criação não tocam campanhas: `createGroup` (T L110), `enqueueJob` (T L121), INSERT em automations, reservations e idempotency_keys (T L127–142), e login. Em `data.ts` R82, os únicos `UPDATE campaigns` são de `updateCampaign` (D L645) e da rotação do link (D L733), e o teste não chama nenhum dos dois. A cópia de `jobs.ts` R80 não tem `UPDATE campaigns`. O status vem da criação (T L89–93), sem mudança posterior | **SUFICIENTE** (o limite está no §4) |
| **Omissão** | `toEqual` integral, na ordem `updated_at DESC` declarada (T L166–167) | **SUFICIENTE** |
| **Quatro filtros** | `toEqual` integral do subconjunto do oráculo, na ordem relativa (T L169–175). Ausência da Sul mantida (T L174) | **SUFICIENTE** |
| **Resultado** | Foco bruto `foco.txt` L6–9: 1/1, 230 ms. Dump L8758 (16:35:11): exit 0 | **SUFICIENTE**, como relato bruto |

**Observação sem efeito:** T L176 ainda faz cast de `active` para `Item`. É redundante, porque T L173 já compara objetos inteiros.

## 3. Gates, inventário e rastreabilidade

- **`gates.txt` R83:** TSC:0 L1; LINT:0 L6; teste L808 (1 test, 228 ms); 50 arquivos L871; 196 testes L872; VITEST:0 L876; mtime L877; BUILD:0 L961.
- **Inventário próprio:** as entradas `✓ …test.ts (N)` do log R82 e do R83 são **idênticas**: 50 nomes, mesmas contagens, nada novo nem removido. Confere com o INVENTARIO L3.
- **Dump** (`bc-68876892-…jsonl`, 8772 linhas):

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8732 | 16:34:38 | Base `c20cb640`, árvore limpa (CRONOLOGIA L7) |
| 8735–8746 | — | Só leituras |
| 8750 | 16:34:59 | Diff: import |
| **8752** | **16:35:04** | **Último diff**: oráculo e asserts |
| 8755 | 16:35:08 | Grep |
| 8758 | 16:35:11 | Foco |
| 8761 / 8764 | 16:35:16 / 16:36:12 | Gates (stdout vazio) e grep do log: 196, VITEST 0, BUILD 0 |
| 8767 | 16:36:16 | Commit |
| 8770 | 16:36:24 | `CMP_OK test` e ZIP `d62eeab6…` |

Sem diff visível depois de L8752 até L8772. A ordem último diff → foco → gates → commit → CMP vale como relato observável.

## 4. Limites (fatos × relatos)

- **Fatos aferidos:** ZIP, conteúdos, hashes, patch, fonte do oráculo e da fixture, e inventário textual.
- **Relatos:** commit, push, blob, CMP, foco e gates. Sem hash de árvore por gate nem rerun pós-commit.
- **Runtime:** não reenviado. A preservação depende do diffstat relatado (1 arquivo) e das dependências R82 aferidas.
- **Banco:** a ausência de trigger que altere `campaigns` não foi lida, porque o `db.ts` não está no pacote. Ainda assim, o `toEqual` integral relatado verde também cobriria esse caso.
- **Outros:** dispatcher não é TCP; o mtime não prova o banco.
- **Proveniência:** a correção documental do rascunho R82 para sua versão final comunicada está registrada no §0; não constitui pendência.

## 5. Conclusão

**Δ1 FECHADO.** C1 agora prova "objetos integrais" na omissão e "DTOs integrais" em cada um dos quatro filtros, por `toEqual` contra um oráculo independente:
- oráculo = literal de `createCampaign` mais o único `updated_at` persistido e declarado pela fixture;
- não reutiliza a resposta, não duplica o parser e não é igualdade entre dois caminhos novos.

Com C0, C2–C6 e o restante de C1 já suficientes na R82, há **SUFICIÊNCIA DOCUMENTAL do recorte CMP05-STATUS-READ v1** na revisão relatada `3ae39917…`:
- delta material vazio e nenhum bug demonstrável;
- máximo registrável pelo coordenador: **PROVADO LIMITADO — listagem de campanhas filtrada pelo status persistido** (C L124).

Este parecer não homologa GRP-CMP-05 inteiro, abas, UI, arquivamento global nem produção, e **não libera a próxima fatia**: a decisão é do coordenador.
