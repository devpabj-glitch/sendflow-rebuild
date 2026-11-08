# Auditoria documental independente — AUT04-STATUS-READ v1 (F0–F6), entrega R80

**Registro:** 07/11/2026 15:59:58 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL. Não foi executado código do projeto, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`/`wc`, `diff`/`grep` de texto entre cópias e logs, `date` e um parser Python do dump que descarta thinking/reasoning/analysis.

## 0. Revisão, autoridades e integridade

- **Revisão RELATADA:** `82d130e903548a311964b5312860c5e6d51f3e1a`, pai `ad558635f637a7a9bb6f9b516599e44857c4e295`. Fontes: MANIFEST L1–2; dump L8511 `[main 82d130e]`. **Git não certificado de forma independente.** Os CMP são relato (MANIFEST L3–7; dump L8519 com 5 `CMP_OK`).
- **ZIP:** o hash informado é `ca528f36…a1ca0b` (ENCAMINHAMENTO L8; dump L8519). **O ZIP não está presente no box** (busca em `/workspace` e `/cursor/stores`), por isso **não foi aferido por mim**. A extração e os 9 hashes internos são relato da preparadora.
- **Autoridades, lidas integralmente, SHA256 local igual ao do ENCAMINHAMENTO L12–13:**
  - Contrato `/workspace/grupos-execucao-backend/PACOTE-PROXIMA-FATIA-POS-R79.md`: 105 linhas, `c4467972738a6e1cf7b0f7e4da541a1ab024bf81cd299aa20c40991cc6d19fb0` ("C Lnn").
  - Parecer `/workspace/grupos-referencia-visual/PARECER-AUT04-STATUS-READ-V1.md`: 23 linhas, `ad3ebb1e8db68b4127cbd91c72cc9d66a448881c27162622457f8738f8e1ca25` ("PA Lnn").
- **Diretório `/workspace/grupos-evidencias-aut04-r80/`:** 14 arquivos. Os 10 do pacote e os 4 da preparação (ENCAMINHAMENTO, CRONOLOGIA, INVENTARIO, PUBLICO-R80-FILTRADO.jsonl) conferem com o MANIFEST (L9–17) e com o ENCAMINHAMENTO (L31–42).

| Arquivo | Bytes | Linhas | SHA256 (início) | Papel |
|---|---|---|---|---|
| jobs.ts | 38205 | 1074 | 1f04a097… | fonte runtime alterada |
| dispatch.ts | 38914 | 968 | 91cbd8d0… | fonte runtime alterada |
| automation-status-filter.test.ts | 9246 | 184 | e0e4b0aa… | teste F1–F5 |
| README.md | 32201 | 224 | 7543aaa8… | doc (L64) |
| aderencia-prompt-mestre-v1.md | 40653 | 215 | 1b4775e0… | doc (L115) |
| gates.txt | 81279 | 952 | 60e58b40… | log de gates |
| f0-antes-diff.txt | 679 | 7 | 7e94cdc3… | transcrição manual F0 |
| foco.txt | 390 | 10 | f991a290… | transcrição manual do foco |
| MAPA.txt | 2126 | 19 | 9a787354… | síntese do escritor |
| MANIFEST-SHA256.txt | 972 | 17 | 3d735e7f… | manifesto |
| CRONOLOGIA-PUBLICA-R80.md | 4957 | 40 | 3f6e8c23… | preparação |
| INVENTARIO-R79-R80.md | 2379 | 57 | f8b1f731… | preparação |
| ENCAMINHAMENTO-QA.md | 4174 | 42 | e85e77a1… | preparação |
| PUBLICO-R80-FILTRADO.jsonl | 114891 | 93 | 55ad8742… | cópia sanitizada; não usada (fiz parse próprio do dump) |

- **Leitura:** integral do teste, dos dois .txt de F0/foco, do MAPA, do manifesto, da preparação e das autoridades. Nas fontes runtime e nos docs, os trechos pertinentes.
- **Diff `dispatch.ts` contra a cópia R77**, feito por mim: só L72 (import `automationListStatus`) e L733–734. **Nenhuma outra linha mudou.**
- **`jobs.ts` anterior:** não foi recebido. A base pré-diff vem do F0 (`f0-antes-diff.txt` L3 cita `jobs.ts:392-397` sem predicado) e do extrato histórico citado no contrato (C L33).

## 1. Fonte do recorte (C L53–66)

- **`jobs.ts`:**
  - L392: enum `["active","paused","completed"]`.
  - L395–404, `automationListStatus`: lista vazia (sem chave) → `undefined`; tamanho ≠ 1 ou valor fora do enum → `DomainError` com `fields.status`. Não há trim nem normalização de caixa, e a comparação é exata (`includes`).
  - L406–419, `listAutomations(db, org, status?)`: argumento opcional e callsites `(db, org)` intactos. Com status, o SQL é parametrizado `organization_id = ? AND status = ?` (L414–415); sem status, o SQL é idêntico ao anterior (L416). Ordem `next_run_at ASC` e o mesmo `mapAutomation` (L418).
- **`dispatch.ts`:**
  - L487: `authorize` vem antes do handler.
  - L732–734: `searchParams.getAll("status")`. Assim, `?status` resulta em `[""]`, que é inválido.
  - A mensagem do `DomainError` não contém "não encontrad" e não traz `baseVersion`, então o adaptador existente (`fail`, mapeamento já auditado na R77) responde **400 `validation`**, sem mudança global (C L66).
- **Sem escrita no caminho:** não há recibo, evento nem idempotência (C L60).
- **Bug demonstrável em fonte:** nenhum.

## 2. F0–F6

Referências: teste "T Lnn"; contrato C; parecer PA.

| Item | Exigido | Evidência | Classe |
|---|---|---|---|
| **F0** (C L74; PA L13) | Antes do diff: fonte do handler/listador e fixture mista, GET sem filtro vs `status=paused` por IDs/status | `f0-antes-diff.txt` L2–7: handler `dispatch.ts:731-733` sem searchParams, listador sem predicado; as duas queries dão os mesmos 3 IDs/status, 200. Corroborado pelo resultado no dump L8464 (15:53:43; `LISTER 2 NO_STATUS_PREDICATE`, `aut_f0_*`), anterior ao primeiro diff L8477 (15:54:06). O arquivo é transcrição manual (dump L8474), não stdout bruto | **SUFICIENTE** (limite: transcrição) |
| **F1** (C L75) | Sem filtro: lista completa com DTO/ordem; cada estado: subconjunto exato, objetos integrais, ordem preservada; active sem paused/completed | Fixture Norte com 2 active, 1 paused, 1 completed e datas distintas (T L97–100). Sem filtro `toEqual` `listAutomations(db,north)` (T L110, L114) e ordem explícita (T L116–121). Os 3 estados `toEqual` o filtro do direto (T L122–126). paused só `aut_n_paused` (T L127–128). active nas 2 datas em ordem (T L129–130). A equivalência com o listador **anterior** fica por fonte: SQL sem filtro idêntico (jobs L416; F0 L3) | **SUFICIENTE** |
| **F2** (C L76) | Org sem automações → 200 `[]` | Org "Vazia" com operador próprio (T L74, L77–78, L136); `?status=paused` → 200 `[]` (T L137–139) | **SUFICIENTE** |
| **F3** (C L77; PA L16, L23) | Vazio, desconhecido, case/espaço/alias/lista, repetido igual e diferente → **400** `validation` com campo status; snapshot igual; omissão válida | 10 casos (T L140–151), cada um com snapshot anterior, **status 400 explícito**, `code:"validation"` e `fields.status` (T L152–158). Omissão volta à lista inteira (T L159) | **SUFICIENTE** |
| **F4** (C L78) | 401; 403 com header Sul; nenhum ID real da Sul com ou sem filtro; sem 404 falso | Sul com os 3 estados (T L101–103). Sem filtro e com os 3 filtros, nenhum ID `aut_s_*` (T L131–135). 401 `unauthenticated` (T L160–162); 403 `forbidden_organization` (T L163–165) | **SUFICIENTE** |
| **F5** (C L79) | `SELECT *` das 5 tabelas antes/depois dos GETs; controle de fila/evento preexistente; reabrir o mesmo arquivo sem reseed e repetir GET | `five()` com as 5 tabelas exatas (T L21–29). Controles: job (T L104), idempotency_key (T L105–108), eventos dos helpers. Baseline depois do seed/login (T L109–111) e igual depois de todos os GETs (T L166). `close` + `createDatabase(file)` (T L168–169), snapshot igual (T L170), GET paused igual ao de antes (T L171–173), snapshot igual (T L174). Arquivo temporário e guarda de mtime da demo (T L14–17, L68–70) | **SUFICIENTE** |
| **F6** (C L80; PA L19) | Foco nominal; regressão sem argumento e create/pause/duplicate via suíte; suíte+TSC+lint+build depois do último diff; logs/revisão; 193/47 é baseline | Foco: `foco.txt` L4 1/1 (transcrição manual, dump L8501) corroborado pelo dump L8499 (1 passou, exit 0). `gates.txt` (linhas próprias do arquivo): TSC:0 L1; LINT:0 L6; job-runner L31; queue L721; automation-duplicate (3) L783; teste novo L806; 48 arquivos L863; 194 testes L864; VITEST:0 L868; mtime L869; BUILD:0 L952. **Inventário nominal:** comparei por texto as entradas `✓ …test.ts (N)` do `gates.txt` R79 e do R80; as 47 anteriores são idênticas e só entra `automation-status-filter.test.ts (1 test)`, o que bate com INVENTARIO L4–5 | **SUFICIENTE** (limites §3) |

- **Semântica preservada (C L47, L82; PA L10):** `completed` não é equiparado a "Desativado" (README L64; MAPA L13), sem elegibilidade ou envio. Fora: runner, toggle, duplicate e schema, conforme stat de 5 arquivos (dump L8511).
- **Nada reaberto:** WHE, PRJ01 e UI.

## 3. Rastreabilidade

Dump: `bc-68876892-0c2c-553d-9afb-372723d790a3.jsonl`, 8521 linhas, recorte L8429–8521. O meu parse coincide com a CRONOLOGIA L5–22.

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8433 | 15:52:49 | HEAD `ad558635`, status vazio (relato da cronologia L7; exit 0) |
| 8464 | 15:53:43 | F0 antes do diff |
| 8477–8485 | 15:54:06–15:54:10 | Diffs em jobs.ts, dispatch.ts (×2), README, aderência |
| 8491/8494/**8496** | 15:54:33–**15:54:41** | Teste criado e ajustado; **último diff** |
| 8499 | 15:54:51 | Foco 1/1, exit 0 |
| 8502 | 15:55:02 | Gates; stdout direto vazio |
| 8505 | 15:55:59 | grep do log salvo: TSC 0, 194, VITEST 0, mtime, BUILD 0 |
| 8511 | 15:56:11 | Commit `82d130e`; 5 arquivos 215+/7−; árvore limpa |
| 8519 | 15:56:28 | 5 `CMP_OK` e hash do ZIP `ca528f36…` |

- **Conclusão:** a sequência último diff → foco → gates verdes → commit → CMP é suficiente como relato observável, sem diff visível depois de L8496.
- **Limites, não exigidos pelo contrato (C L89):**
  - Sem hash de árvore por gate e sem rerun pós-commit.
  - A ligação do log à chamada passa por grep/cópia.
  - F0 e foco são transcrições manuais corroboradas.
  - Git e CMP são relatados; o ZIP não foi aferido aqui.
  - O mtime não prova a invariância do banco inteiro.

## 4. Classificação, delta e observações

- **Bug demonstrável:** nenhum. **Prova contratual faltante:** nenhuma. **Delta material: vazio.**
- **Observações não bloqueantes, sem critério novo:**
  - **O1:** a seção "Horários das chamadas públicas" da CRONOLOGIA (L33–40) está sem os horários (só "."). Os horários do §3 vêm do meu parse do dump. Defeito documental da preparação; não afeta F0–F6.
  - **O2:** o ENCAMINHAMENTO L24 cita "VITEST0 L868", o que confere. A CRONOLOGIA L17 também está correta. Nada a corrigir nos gates.
  - **O3:** o ZIP ausente impede a aferição do hash `ca528f36…` por QA. Se o coordenador quiser fechar esse limite, basta disponibilizar o ZIP para `sha256sum`. Isso não é prova contratual de F0–F6.
- **Recomendação:** o coordenador pode registrar "PROVADO LIMITADO — filtro de listagem por status persistido" (C L92) na revisão relatada `82d130e9…`.

## 5. Conclusão

**SUFICIÊNCIA DOCUMENTAL de F0–F6 do recorte AUT04-STATUS-READ v1**, revisão relatada `82d130e903548a311964b5312860c5e6d51f3e1a`:
- sem bug, sem prova faltante, sem delta material;
- com os limites do §3 e as observações O1–O3;
- sem execução independente; Git/CMP relatados; ZIP não aferido.

Este parecer **não homologa GRP-AUT-04 inteiro, a UI (rótulos Ativado/Desativado/Todos), o engine nem produção**, e **não libera a próxima fatia**: a decisão é do coordenador.
