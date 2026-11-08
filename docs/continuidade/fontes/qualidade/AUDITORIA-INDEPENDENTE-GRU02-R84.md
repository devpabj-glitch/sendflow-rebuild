# Auditoria documental independente — GRU02-NAME-SEARCH v1 (G0–G6), entrega R84

**Registro:** 07/11/2026 16:52:22 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL. Não executei projeto, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`/`wc`, `unzip -Z1`/`unzip -p` (leitura de bytes, sem extrair), `diff`/`grep` textual e parse do dump só de campos visíveis (thinking/reasoning/analysis descartados).

Siglas: "T Lnn" = `group-name-search.test.ts`; "D Lnn" = `data.ts` R84; "X Lnn" = `dispatch.ts` R84; "C Lnn" = contrato; "PA Lnn" = parecer.

## 0. Revisão, integridade e autoridades

- **Revisão RELATADA:** `af1688d3d13d2a4e14fb7523868ce87df249b4a5`, pai `3ae39917f24f0dd4e971eaf5b743d09efef3cfc3` (MANIFEST L1–2; dump L8851: `[main af1688d]`, "5 files changed, 267 insertions(+), 18 deletions(-)", `## main...origin/main`). Commit, push e os 5 CMP (MANIFEST L3–7; dump L8857) são relato. **Git não certificado.**
- **ZIP `PACOTE-ORIGINAL-R84.zip`:** 58983 B, SHA256 `f5b74bb9c3a016dc7e3ee904a18a543a5c9138b4baf6ea67e9d4307e4d3c57c0`, **aferido e igual ao esperado**.
  - 11 entradas, todas byte a byte iguais às cópias soltas.
  - Os **10 hashes internos** do MANIFEST (L9–18) dão `OK`.
- **Preparação, fora do ZIP:** ENCAMINHAMENTO `a3b6a207…` (46 linhas), CRONOLOGIA `af03050b…` (35), INVENTARIO `6c36405e…` (57) e JSONL `3e3f19d4…` (não usado; fiz parse próprio). Os hashes conferem com o ENCAMINHAMENTO L32–46.
- **Autoridades, lidas integralmente, SHA256 igual ao do ENCAMINHAMENTO L12–13:**
  - Contrato `/workspace/grupos-execucao-backend/PACOTE-GESTAO-GRUPOS-POS-R83.md`, 178 linhas, `71ce9b69ac998cbbcd2babfdf7250da4bfc95f2fcce3c1c557827102fe35e719`. Trechos usados: §5 L78–102, §6 L104–118 (G0–G6 L110–116; L118), §7 L120–128, Apêndice L140–173 e adendo L176–178.
  - Parecer `/workspace/grupos-referencia-visual/PARECER-GRU02-NAME-SEARCH-V1.md`, 34 linhas, `2a73078e8ec720f29b4419ba830d7925c13e548481dcf30ad5bbc334a64a3a36`.
  - O dump mostra o diff só depois da base (L8777) e do G0 (L8801), e as duas autoridades são anteriores a ele: o contrato está datado de 16:42 (C L3, L176) e o parecer de 16:43 (PA L2).

| Arquivo | Bytes | Linhas | SHA256 (início) |
|---|---|---|---|
| data.ts | 53632 | 1653 | cdff014a… |
| dispatch.ts | 40022 | 986 | 5af40470… |
| group-name-search.test.ts | 11572 | 240 | 3954a54f… |
| README.md | 33505 | 226 | 8d962d68… |
| aderencia-prompt-mestre-v1.md | 41689 | 215 | 6208850c… |
| gates.txt | 82079 | 963 | 96f32309… |
| g0-antes-diff.txt | 956 | 10 | 524b90bc… |
| foco.txt | 538 | 12 | c28b29d7… |
| foco-falha-fixture.txt | 402 | 5 | 5ea87a3b… |
| MAPA.txt | 2047 | 19 | d1c03c3a… |
| MANIFEST-SHA256.txt | 1047 | 18 | 37f1e5c5… |

**Diff textual contra as dependências R82** (a R83 foi test-only):
- `dispatch.ts`: só o import (X L36) e X L589–590.
- `data.ts`: só o parser D L950–958 e `listGroups` D L960–979.
- README: só L106.
- Matriz: só L41.

## 1. Fonte (C §5.2–5.3, L88–102)

- **D L950–958, `groupNameContains`:**
  - Sem chave devolve `undefined`.
  - Mais de um valor lança `DomainError` com `fields.nameContains`.
  - Valor `""` devolve `undefined`, ou seja, sem filtro.
  - O valor não vazio é devolvido **sem trim, folding nem padrão** (C L89–90).
- **D L960–979, `listGroups`:** recebe o 5º argumento opcional.
  - Os filtros são montados como lista fixa: `organization_id = ?`, `campaign_id = ?`, `status = ?` opcional e `instr(name, ?) > 0` opcional. Os valores vão só por parâmetro (D L967–976), sem LIKE nem interpolação do termo (C L98–100).
  - Mesmo `SELECT *`, mesmo `ORDER BY position` e `mapGroup`.
  - O ramo sem nome reproduz o SQL anterior: mesmos predicados, mesma ordem.
- **X L583–590:** `getCampaign` (X L584) → 404, depois o status existente (X L588), depois o nome (X L589), depois a consulta. É a ordem de C L93. O handler CSV não lê `nameContains` nem passa o 5º argumento (C L102).
- **Bug demonstrável em fonte:** nenhum.

## 2. G0–G6

| Item | Exigido | Evidência | Classe |
|---|---|---|---|
| **G0** (C L110) | Base R83 verificada; GET normal vs `nameContains` discriminante antes do diff | Dump L8777 (16:45:06): HEAD `3ae39917`. `g0-antes-diff.txt` L7–10 (captura **bruta**): `NO_NAME_PREDICATE`, Rio e rio, as duas consultas 200 com os mesmos 2 IDs/nomes. Dump L8801 (16:45:44): EXIT:0, antes do 1º diff (L8807) | **SUFICIENTE** |
| **G1** (C L111) | `Rio` → só Rio e Rio Sul na ordem position, sem `rio` nem `Río`; fragmento; `%`, `_`, barra e apóstrofo literais; payload SQL não amplia | Fixture T L127–134. `Rio` → `[rio, rioSul]` com DTO inteiro (T L171), sem lower/accent/controles (T L178). Fragmento `Sul` → `[rioSul]` (T L173). `%_/` → só `100%_/'` (T L174): como LIKE, casaria também `caminho/sul`, logo prova a literalidade. `/` → `[literal, slash]` (T L175). `'` → `[literal, quote, payload]` (T L176). `' OR 1=1` → `[]` (T L177) | **SUFICIENTE** |
| **Espaços / sem trim** (C L89) | Comportamento do §5.2, não assert de G1 | Fonte D L957 (sem trim); termo com espaços internos em T L177. Não há assert de termo com espaço nas pontas, e G1 (C L111) não o exige | Conforme por fonte; não é critério de G1 |
| **G2** (C L112) | Omitido e vazio: objeto inteiro contra oráculo da fixture, não contra a resposta | Oráculo = retornos de `createGroup` (T L137). `createGroup` monta literal próprio (D L1076) e o devolve (D L1114), sem passar por `mapGroup` nem pela listagem. Depois da criação a fixture só insere reserva, job e chave (T L138–152). Os únicos `UPDATE groups` estão em D L1142 e L1271 (update/bulk), não chamados. Omitido (T L164), `?nameContains=` (T L167) e `?nameContains` (T L168) dão `toEqual(oracle)` integral | **SUFICIENTE** |
| **G3** (C L113) | Interseção; nome vazio mantém status; sem correspondência e campanha vazia → `[]`; status inválido → 400 | `Rio&status=full` → `[rioSul]` (T L180–181): o termo casa Rio (available) e Rio Sul (full). `nameContains=&status=full` → `[rioSul]` (T L182–183). `zzzz` → `[]` (T L184). Campanha vazia → `[]` (T L185). `status=cheio` → 400 `fields.status` (T L186–188). Os 200 do vazio são implícitos no parse | **SUFICIENTE** |
| **G4** (C L114) | Termos iguais nos controles; 401, 403, 404 (estrangeira e inexistente); repetição igual e diferente → 400 `fields.nameContains`; recusas sem escrita | "Rio" no controle e na Sul (T L135–136), ausentes do alvo (T L178). Repetições → 400 `fields.nameContains` (T L190–195). 401 (T L196–198), 403 (T L199–201), 404 ×2 sem o ID da Sul (T L202–206). Sem escrita pelo snapshot final (T L216) | **SUFICIENTE** |
| **G5** (C L115) | `SELECT *` das 6 tabelas antes/depois; registro de controles e classe da evidência; reabertura com os mesmos DTOs | `six()` com as 6 tabelas (T L20–29). Igual em T L216, depois de reabrir (T L219–221) e no fim (T L225). Repetição e reabertura → `[rio, rioSul]` integral (T L217–218, L222–224). Registro no §2.1 | **SUFICIENTE** |
| **L118 (§6): "grupos alvo e controles devem existir efetivamente e ter IDs/nomes assertados"** | — | Alvo: IDs e nomes assertados pelo DTO integral (T L164). **Controles `controlRio` (T L135) e `foreignRio` (T L136): só a ausência é assertada** (T L178, L206, L214). A existência deles vem da fonte da fixture, porque `createGroup` com INSERT incondicional (D L1086) lançaria erro se falhasse. `length > 0` de groups (T L155) não distingue controle de alvo | **FALTA DE PROVA** (não é bug) → **Δ1** |
| **CSV preservado** (C L102) | Export não obedece `nameContains` | `groups-export?nameContains=Rio` → 200 `text/csv` com rio, lower e accent, sem o controle (T L208–214). Handler CSV inalterado (§1) | **SUFICIENTE** |
| **G6** (C L116) | Foco, suíte, TSC, lint e build depois do último diff; baseline nominal; falhas preservadas | **Falha intermediária:** dump L8836 (16:46:57): EXIT:1, "Tests 1 failed", `DomainError` "Informe o motivo desta situação." (`validateGroupShape`). `foco-falha-fixture.txt` L1–5 é **resumo manual** desse resultado, não stdout bruto. Causa: `unavailableReason` vazio em suspended/blocked/archived. Corrigida só na fixture (T L47; dump L8839, último diff), sem runtime. **Foco verde:** `foco.txt` L6–9 bruto, 1/1, 160 ms (dump L8842). **Gates** (`gates.txt`): TSC:0 L1, LINT:0 L6, rota L346 e L920, novo L826, group-export L829, group-status-filter L844, 51 arquivos L873, 197 testes L874, VITEST:0 L878, mtime L879, BUILD:0 L963. **Inventário próprio:** as entradas `✓ …test.ts (N)` do log R83 e do R84 dão os 50 nomes anteriores idênticos em nome e contagem, mais só `group-name-search.test.ts (1 test)`; confere com o INVENTARIO L3 | **SUFICIENTE** |

### 2.1 Registro G5 (C L115): conteúdo no baseline (T L154)

| Tabela | Conteúdo semeado | Fonte | Classe da evidência |
|---|---|---|---|
| groups | 8 do alvo, `controlRio` (Controle) e `foreignRio` (Sul) | T L127–136 | Não vazia por assert (T L155). Os 8 do alvo, com DTO integral, por assert (T L164). Controles **só pela fonte** (Δ1) |
| campaigns | Alvo/active, Controle/active, Vazia/draft (Norte) e Sul/active | T L95–126 | Não vazia por assert (T L156). Existência indireta: 200 no alvo e na vazia, 404 na Sul por escopo (T L163, L185, L204) |
| reservations | `rsv_nome` active, no grupo `rio` | T L138–142 | Não vazia por assert (T L157); conteúdo pela fonte |
| scheduled_jobs | `capacity.review` do alvo | T L143–148 | Não vazia por assert (T L158); conteúdo pela fonte |
| domain_events | Eventos dos helpers (ex.: `group.registered`, D L1109) | T L91–136 | Não vazia por assert (T L159); tipos **inferidos** do helper, não afirmados |
| idempotency_keys | `api.fixture` / `idem-nome-controle` | T L149–152 | Não vazia por assert (T L160); conteúdo pela fonte |

- **Tabelas vazias:** nenhuma.
- **O que o snapshot prova:** igualdade integral, não conteúdo.

### 2.2 Matriz e histórico (C L126; PA L17)

- **Matriz L41:**
  - Mantém "Feito o filtro de leitura. Não é a toolbar".
  - Registra que "o recorte de status dizia sem busca…" e que "a busca é acréscimo posterior, não releitura daquela frase".
  - Diz ainda: "O CSV não usa esse parâmetro".
  - Não atribui autorização a Loigo.
- **README L106:** descreve o recorte.
- **Conforme.**

## 3. Rastreabilidade (dump `bc-68876892-…jsonl`, 8859 linhas)

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8777 | 16:45:06 | Base `3ae39917` |
| 8801 | 16:45:44 | G0 |
| 8807–8815 | 16:46:04–16:46:08 | `data.ts`, `dispatch.ts` ×2, README, matriz |
| 8821 | 16:46:39 | Teste criado |
| 8830 | 16:46:53 | Resultado vazio (2 B), **efeito indeterminado**; não infiro nada |
| 8836 | 16:46:57 | Foco **falho**, EXIT:1 |
| **8839** | **16:47:03** | **Último diff** (fixture) |
| 8842 | 16:47:06 | Foco verde |
| 8845 / 8848 | 16:47:13 / 16:48:12 | Gates (stdout vazio) e grep do log: 197, VITEST 0, BUILD 0 |
| 8851 | 16:48:17 | Commit |
| 8857 | 16:48:35 | 5 `CMP_OK` e ZIP `f5b74bb9…` |

Sem diff visível depois de L8839 até L8859. A ordem último diff → foco → gates → commit → CMP vale como relato observável. A chamada 8829/8830 é anterior à correção e aos gates finais.

## 4. Limites (fatos × relatos)

- **Fatos aferidos:** ZIP, conteúdos, hashes, diffs de fonte, asserts e inventário textual.
- **Relatos:** commit, push, blobs (MAPA L14–19), foco, gates e CMP. Sem hash de árvore por gate nem rerun pós-commit.
- **Capturas:** G0 e foco verde são brutos. A falha tem resumo manual, mas o resultado completo está no dump.
- **Outros:** dispatcher não é TCP; o mtime não prova o banco.
- **Escopo:** busca só em `name`; não cobre UI nem toolbar.

## 5. Delta material finito

**Δ1 — C §6 L118, "grupos alvo e controles devem existir efetivamente e ter IDs/nomes assertados".**
- **Falta:** os controles `controlRio` e `foreignRio` (T L135–136) só têm a ausência assertada.
- **Menor prova:** no mesmo teste, sem runtime, logo depois de T L154, um assert de existência sobre o baseline. Por exemplo:
  `expect(baseline.groups).toEqual(expect.arrayContaining([expect.objectContaining({ id: controlRio.id, name: "Rio", campaign_id: control.id }), expect.objectContaining({ id: foreignRio.id, name: "Rio", campaign_id: foreign.id })]))`
  Depois: foco, suíte, TSC, lint e build.
- **Não exigir:** outra fixture, outro cenário ou snapshot novo.
- A fonte favorável (`createGroup` com INSERT incondicional) não substitui o registro assertado de IDs/nomes exigido pelo contrato. O delta permanece aberto até essa prova mínima; não proponho dispensa da cláusula.

**Bugs demonstráveis:** nenhum. **Demais itens:** sem prova faltante.

## 6. Conclusão

**Sem suficiência documental plena do recorte GRU02-NAME-SEARCH v1 (revisão relatada `af1688d3…`), apenas por Δ1.**
- G0, G1, G2 (oráculo independente `createGroup`), G3, G4, G5 (com o registro do §2.1), CSV preservado e G6 (com a falha de fixture registrada) estão **suficientes**.
- Fechado Δ1, o máximo é **PROVADO LIMITADO — busca literal por nome na lista local de grupos** (C L127).

Este parecer não homologa GRP-GRU-02 inteiro, toolbar, UI, criação WhatsApp nem produção, e **não libera a próxima fatia**: a decisão é do coordenador.
