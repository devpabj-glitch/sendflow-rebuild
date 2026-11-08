# Auditoria documental independente — CMP05-STATUS-READ v1 (C0–C6), entrega R82

**Registro:** 07/11/2026 16:32:12 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL. Não executei fonte, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`, `wc`, `unzip -lv`/`unzip -p` (leitura de bytes, sem extrair nem executar), `diff`/`grep` textual e parse Python do dump só de campos visíveis (thinking/reasoning/analysis descartados).

Siglas: "T Lnn" = `campaign-status-filter.test.ts`; "D Lnn" = `data.ts`; "X Lnn" = `dispatch.ts`; "C Lnn" = contrato; "PA Lnn" = parecer.

## 0. Revisão, integridade e autoridades

- **Revisão RELATADA:** `c20cb6400b266606857cd89aa52147cbb67dcbd7`, pai `8525e71bde628f97685a9428c477eaa2a4686dda` (MANIFEST L1–2; dump L8717). Commit e push são relato do escritor. **Git não certificado de forma independente.** Os 5 CMP (MANIFEST L3–7; dump L8725) também são relato.
- **ZIP `PACOTE-ORIGINAL-R82.zip`:** 58730 B, SHA256 `152fa758d424a660e540a88c5e03992b75fd4411961db27a8ff02c48b5330644`, **aferido e igual ao esperado**.
  - 10 entradas, 266724 B descomprimidos.
  - O SHA256 do conteúdo de cada entrada (`unzip -p`) é **igual** ao da cópia solta correspondente.
  - Os **9 hashes internos** do MANIFEST (L9–17) dão `OK` em `sha256sum -c`.
- **Preparação, fora do ZIP:** ENCAMINHAMENTO (43 linhas, `e0ee0850…`), CRONOLOGIA (31, `aef7adf6…`), INVENTARIO (56, `d062873f…`) e PUBLICO-R82-FILTRADO.jsonl (`a087744f…`). Os hashes conferem com o ENCAMINHAMENTO L30–43. Não usei o JSONL filtrado; fiz parse próprio.
- **Autoridades, lidas integralmente, SHA256 igual ao do ENCAMINHAMENTO L11–12:**
  - Contrato `/workspace/grupos-execucao-backend/PACOTE-PROXIMA-FATIA-POS-R81.md`, 137 linhas, `d6dc63261907af2cd3123797b79c570e1c261920d50513b3c56229c3cc537667`. Trechos usados: §4.1 L83–91, §4.2 L95–99, §5 L103 e C0–C6 L107–113, L115, §6 L119–125.
  - Parecer `/workspace/grupos-referencia-visual/PARECER-CMP05-STATUS-READ-V1.md`, 34 linhas, `70b84deafaf6765a48691ff2f839ef8537dc931d8fb0ab502d47e289fc9e09b4`. Trechos usados: PA L17–20, L23–31, L34.

| Arquivo | Bytes | Linhas | SHA256 (início) |
|---|---|---|---|
| data.ts | 53332 | 1646 | f9655a5b… |
| dispatch.ts | 39883 | 984 | 9266be69… |
| campaign-status-filter.test.ts | 11760 | 230 | 4513500d… |
| README.md | 33206 | 226 | 23bbb4a6… |
| aderencia-prompt-mestre-v1.md | 41350 | 215 | 556b624b… |
| gates.txt | 82353 | 963 | 017fb560… |
| c0-antes-diff.txt | 1133 | 10 | d99f45e1… |
| foco.txt | 551 | 12 | adbb9609… |
| MAPA.txt | 2188 | 19 | bae780ea… |
| MANIFEST-SHA256.txt | 968 | 17 | a726b5c9… |

**Diff textual:**
- `dispatch.ts` contra a cópia R81 (`grupos-evidencias-gru01-r81`): só o import (X L42) e o handler (X L527–528).
- `data.ts` contra a cópia **R77** (`4abcdc27…`): só D L474–491, ou seja, o parser novo `campaignListStatus` e o argumento/predicado de `listCampaigns`. **Limite:** não há cópia de `data.ts` da base R81; a igualdade do resto com a R81 não está certificada (C L64, L133).
- README contra R81: só o acréscimo em L114.
- Matriz contra R81: só a L32.

## 1. Fonte (C §4.1–4.2)

- **D L474–483, `campaignListStatus`:**
  - Sem valores devolve `undefined`.
  - Mais de um valor, ou valor fora de `CAMPAIGN_STATUSES`, lança `DomainError` com `fields.status`.
  - É parser próprio de campanha, sem `completed` e sem policy (C L97).
- **D L485–492, `listCampaigns`:** recebe `status?` opcional.
  - Com status: `CAMPAIGN_SELECT … WHERE c.organization_id = ? AND c.status = ? ORDER BY c.updated_at DESC`, parametrizado.
  - Sem status: o SQL anterior, idêntico.
  - Mesmo `mapCampaign` nos dois caminhos (D L455–472, DTO de 15 campos).
  - Só SELECT. Sem DDL (C L95, L99).
- **X L526–528:** o GET `campaigns` lê `searchParams.getAll("status")`, coletando todas as ocorrências (C L88). A rota está depois de `authorize`, como na base (C L89).
- **Callsites:** o único novo uso com argumento está em X L528. Os demais `listCampaigns(db, org)` estão fora do pacote; o MAPA L12 relata que estão inalterados, compatíveis com o parâmetro opcional e com TSC:0.
- **Bug demonstrável em fonte:** nenhum.

## 2. C0–C6

| Item | Exigido | Evidência | Classe |
|---|---|---|---|
| **C0** (C L107) | HEAD R81, fonte atual, GET omitido vs `status=active` em fixture mista antes do diff | Dump L8645 (16:25:07): base `8525e71b` com status vazio (CRONOLOGIA L7). `c0-antes-diff.txt` L7–10 (captura **bruta**): `LISTER_SOURCE NO_STATUS_PREDICATE`, 3 campanhas active/paused/draft, as duas consultas 200 com os mesmos 3 IDs. Corroborado pelo dump L8663 (16:25:37), antes do 1º diff aplicado (L8682) | **SUFICIENTE** |
| **C1, ordem, subconjuntos, `active` exatas** (C L108) | Coleção completa Norte com IDs e ordem `updated_at DESC` explícitos; cada filtro devolve o subconjunto exato; `active` = as duas esperadas | Timestamps distintos fixados (T L99–108). Oráculo independente `expected` (T L156–162) com 7 campos comparados em ordem (T L166). 4 filtros: IDs exatos e ordem (T L172), status homogêneo (T L173). `active` = [ativa-nova, ativa-antiga] (T L177) | **SUFICIENTE** |
| **C1, "objetos integrais do contrato anterior" e "DTOs integrais"** (C L108) | Objetos integrais na omissão e em cada filtro | T L166 compara uma **projeção de 7 campos** dos 15 do DTO (D L455–472). Ficam fora: `projectId`, `projectName`, `description`, `redirectToken`, `creatorAccountId`, `senderAccountId`, `createdAt`. Nos filtros (T L172–174) só IDs e status. T L203 compara objetos inteiros, mas omissão contra omissão, o mesmo caminho. A fonte mostra o mesmo `mapCampaign` e `CAMPAIGN_SELECT` (D L487–492): é prova estática, distinta de prova suportada por assert (C L122) | **FALTA DE PROVA** (não é bug) → **delta Δ1** |
| **C2** (C L109) | Org autorizada sem campanhas: omitido e válido → 200 `[]` | Org "Vazia" com operador próprio (T L74, L78, L143); 200 e `[]` nos dois casos (T L178–183) | **SUFICIENTE** |
| **C3** (C L110) | Vazio, desconhecido, caixa, espaço, alias/lista, repetição igual/diferente → 400 `validation` com `fields.status`, sem escrita; omissão continua válida; `completed` e policy recusados | 10 casos (T L184–195): `?status`, vazio, `completed`, `sequential`, `Active`, `%20active`, `all`, lista por vírgula, repetição igual, repetição diferente. Cada um: 400 explícito (T L199), `validation` com `fields.status` (T L200), snapshot das 7 tabelas igual (T L197, L201). Omissão depois dá a lista inteira (T L203) | **SUFICIENTE** |
| **C4** (C L111) | 401 sem sessão; 403 com header Sul; IDs da Sul ausentes sem filtro e em cada estado, com a Sul tendo os 4; valores válidos nos testes de auth | Sul com os 4 estados (T L93–98). Ausência da Sul sem filtro (T L167) e em cada filtro (T L174). 401 com `?status=active` (T L204–206). 403 `forbidden_organization` com valor válido (T L207–209) | **SUFICIENTE** |
| **C5** (C L112, L115) | `SELECT *` das 7 tabelas antes/depois; archived com job enfileirado e automação `active`; registro por tabela; reabertura sem reseed | `seven()` com as 7 tabelas e chaves reais (T L29–39). Igualdade depois dos GETs (T L210), depois da reabertura (T L212–214) e depois do GET repetido (T L220). Mesmo corpo depois de reabrir (T L215–217). Job `queued`, automação `active` e campanha `archived` antes (T L152–154) e depois (T L218–219). Runner não é chamado (T L1–230). **Registro por tabela: §2.1** | **SUFICIENTE** |
| **C6** (C L113, L121) | Foco, suíte completa, inventário, TSC/lint/Vitest/build depois do último diff, revisão/stat/status | Foco: `foco.txt` L16–19 (bruto: 1/1, 215 ms), dump L8708 (16:27:02). `gates.txt`: TSC:0 L1; LINT:0 L6; rota `/api/v1/campaigns` L186 e L916; api.integration (5) L474; campaign-archive (3) L719; novo L810; 50 arquivos L873; 196 testes L874; VITEST:0 L878; mtime L879; BUILD:0 L963. **Inventário próprio:** comparando as entradas `✓ …test.ts (N)` do log R81 com o R82, as 49 anteriores são idênticas em nome e contagem, e só `campaign-status-filter.test.ts (1 test)` foi acrescentado, conforme INVENTARIO L3–56. As 3 linhas `errstr: 'constraint failed'` (L243, L256, L740) são log de testes aprovados, não falha. Stat relatado: 5 arquivos, 253+/6−, árvore limpa (MAPA L1–5; dump L8717) | **SUFICIENTE** |

### 2.1 Registro C5 (C L112): conteúdo por tabela no baseline (T L144)

| Tabela | Conteúdo semeado | Fonte | Afirmado por assert |
|---|---|---|---|
| campaigns | 5 Norte (archived, paused, 2 active, draft, com `updated_at` fixado) e 4 Sul | T L88–108 | Não vazia (T L145); status `archived` (T L154); 5 Norte por valores de 7 campos (T L166) |
| groups | "Sala" na campanha archived, com convite | T L109–119 | Não vazia (T L146) |
| reservations | `rsv_cmp_status` `active` | T L133–137 | Não vazia (T L147) |
| scheduled_jobs | `capacity.review` da archived | T L120–125 | Não vazia (T L148); `queued` (T L152, L218) |
| automations | `aut_cmp_status` `active` da archived | T L126–132 | Não vazia (T L149); `active` (T L153, L219) |
| domain_events | Eventos dos helpers | T L72–98, L109–125 | Não vazia (T L150). O tipo e a quantidade dos eventos não são afirmados nem foram auditados |
| idempotency_keys | `api.fixture` / `idem-cmp-status-controle` | T L138–141 | Não vazia (T L151) |

- **Tabelas vazias:** nenhuma.
- **O que o assert prova:** que cada tabela tem pelo menos uma linha; as colunas específicas, só onde indicado.
- **O que o snapshot prova:** igualdade integral das 7 tabelas, não o conteúdo.
- **O que vem só da fonte:** o conteúdo semeado. Não promovo inferência de helper a assert.
- **Conclusão:** o registro exigido por C L112/L115 está **cumprido**.

### 2.2 Matriz e histórico (C L123; PA L20)

- **Matriz L32:**
  - Preserva "Feito o arquivamento por ids. Não é a lista de campanhas".
  - Acrescenta "filtro posterior", "O filtro não é a aprovação histórica do arquivamento" e "acréscimo posterior e não fecha a lista".
  - Os limites de runner/fila/automação continuam.
- **README L114:** descreve o recorte e diz "Não é a aba da tela".
- **Conforme.**

## 3. Rastreabilidade (dump `bc-68876892-…jsonl`, 8727 linhas, campos visíveis)

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8645 | 16:25:07 | Base `8525e71b`, árvore limpa |
| 8663 | 16:25:37 | C0 bruto |
| 8676→8677 | 16:25:51 | `search_replace` com resultado vazio (2 B) |
| 8682–8699 | 16:25:55–16:26:17 | `data.ts`, `dispatch.ts` ×2, matriz, README |
| **8702** | **16:26:49** | **Último diff** (teste) |
| 8708 | 16:27:02 | Foco 1/1 |
| 8711 / 8714 | 16:27:10 / 16:28:07 | Gates (stdout vazio, exit 0) e grep do log: 196, VITEST 0, BUILD 0 |
| 8717 | 16:28:10 | Commit `c20cb64`, `## main...origin/main` |
| 8725 | 16:28:25 | 5 `CMP_OK` e ZIP `152fa758…` |

- **Leitura:** último diff → foco → gates → commit → CMP é **suficiente como relato observável**, sem diff visível depois de L8702.
- **8676/8677:** o efeito é **indeterminado**. É anterior aos diffs finais, ao foco e aos gates, e não infiro sucesso nem falha. Os blobs finais e os CMP cobrem o estado commitado.
- **Limites:**
  - Sem hash de árvore por gate nem rerun pós-commit.
  - O exit global vazio é suprido pelo grep e pelo log integral.
  - Dispatcher não é TCP.
  - O mtime não prova a integridade do banco.
  - A identidade de `data.ts` R81 fora de D L474–491 não está certificada.

## 4. Delta material finito

**Δ1 — C1 (C L108), "objetos integrais do contrato anterior" e "DTOs integrais".**
- **Falta:** o assert compara 7 dos 15 campos de `mapCampaign` (T L166) e só IDs/status nos filtros (T L172–173).
- **Menor prova:** no mesmo teste, sem código de produto e sem rota ou fixture nova, trocar o oráculo de T L156–162/L166 pelos objetos devolvidos por `createCampaign` (T L88–92), só com `updatedAt` sobrescrito pelos carimbos de T L99–105.
  - Assert na omissão: `expect(openItems).toEqual([...])` integral, com os 15 campos.
  - No laço (T L171–174): `expect(items).toEqual(<oráculo integral>.filter((i) => i.status === status))`.
  - Depois: foco, suíte, TSC, lint e build.
- **Não exigir:** a revisão da semântica do DTO, outras rotas, ou que os callsites façam algo novo.
- A prova estática favorável (mesmo `mapCampaign` e mesmo SELECT, D L485–492) não substitui o assert de DTO integral contratado. O delta permanece aberto até a prova mínima, sem propor dispensa da cláusula.

**Bugs demonstráveis:** nenhum. **Demais itens:** sem prova faltante.

## 5. Conclusão

**Sem suficiência documental plena do recorte, apenas por Δ1** (C1, integralidade do DTO por assert): delta material finito e com uma única prova mínima.
- C0, C2, C3, C4, C5 (inclusive o registro por tabela do §2.1) e C6 estão **suficientes**.
- A parte de ordem, subconjuntos e `active` exatas de C1 também está suficiente.
- Nenhum bug demonstrável; integridade de ZIP, conteúdos e hashes aferida.
- Git/CMP relatados; nenhuma execução independente.
- Fechado Δ1, o máximo é **PROVADO LIMITADO — listagem de campanhas filtrada pelo status persistido** (C L124).

Este parecer não homologa CMP-05 inteiro, abas, UI, arquivamento global nem produção, e **não libera a próxima fatia**: a decisão é do coordenador.
