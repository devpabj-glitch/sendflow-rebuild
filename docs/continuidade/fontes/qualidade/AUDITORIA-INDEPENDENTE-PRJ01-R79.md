# Auditoria documental independente — PRJ01-EDIT-PERSIST v1 (E1–E5), entrega R79

**Registro:** 07/11/2026 15:46:04 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL.
- Não foi executado código do projeto, teste, banco, build, repo, Git nem rede.
- Usei somente leitura, utilitários de metadados (`sha256sum`, `wc`, `unzip -lv` só para listar, `grep`/`diff` de texto entre logs, `date`) e um parser Python do dump que descarta thinking/reasoning/analysis.

## 0. Revisão, autoridades e integridade

- **Revisão RELATADA:** `ad558635f637a7a9bb6f9b516599e44857c4e295`, pai `71b45a49a985cf8773a251006d9a21c959187f09` (manifesto L1–2; dump L8423).
- **Sem certificação Git independente.** CMP e blobs são relato (manifesto L3–8; dump L8426).
- **Autoridades, lidas integralmente, com SHA256 conferido localmente e igual ao do encaminhamento (L16–17):**
  - Contrato `/workspace/grupos-execucao-backend/PACOTE-PROXIMA-FATIA-BACKEND.md`: 104 linhas, `023154fb59671fce19efec5ffa60ee6f5354a936b2e4889a0be2c76beed2110a` ("C Lnn").
  - Parecer `/workspace/grupos-referencia-visual/PARECER-PRJ01-EDIT-PERSIST.md`: 23 linhas, `ac13dc6f114df0a70a4ddfcc10aca6f4dbc312cc13cebc92e119f09980608b88` ("PA Lnn").
- **ZIP** `/cursor/stores/user/grok-bot/agents/6b330ef9-b86a-4d48-a676-a8e1d296fe5f/assets/01M6VN3AE7RK8VDA94TMH0KN7C.zip`:
  - 37083 B, SHA256 `3213097f2a7d79f39617a5b6c81e3beb7316c1df6272f55c01516d343a47ad98`, aferido localmente: igual ao encaminhamento L8 e ao dump L8426.
  - `unzip -lv` lista 5 entradas (165734 B), com tamanhos iguais aos arquivos extraídos.
- **Diretório `/workspace/grupos-evidencias-prj01-r79/`:** 8 arquivos.

| Arquivo | Bytes | Linhas | SHA256 | Conferência |
|---|---|---|---|---|
| project-edit-persist.test.ts | 10924 | 261 | 479a5fe152c604eb6082fd01ea2b5bc600cd51b23401ce35a15c1b959937555c | = manifesto L21 |
| gates.txt | 81050 | 949 | bc937ffecca485741094b8ee1be60b1e3fe7bce14880706d5b88a60f737d38a0 | = manifesto L20 |
| README.md | 31853 | 224 | c62f06ef8847ee94d8f85fdd969884bd37ee57c9b429742cfd760a523977f6dc | = manifesto L22 |
| aderencia-prompt-mestre-v1.md | 40431 | 215 | a169c1aa7f9d5c0ffb02fdfed3e61cd8302dba0d84549511eaa95d7d7a08ae03 | = manifesto L19 |
| MANIFEST-SHA256.txt | 1476 | 22 | 1bb18752f431eeeda8b99023dc7c69930ff9656f0bab8c03168b2302362e1e7d | = encaminhamento L9 |
| ENCAMINHAMENTO-QA.md | 2858 | 22 | 55e9b824ea0fd2cd4579a85768fda1e3bb6f980cd32be1336c7df5bdb64a34a2 | fora do ZIP |
| CRONOLOGIA-PUBLICA-R79.md | 6391 | 36 | 0f14373ca7276d009a78aeca511f9ac6524decdf2c9375554aac41452222ed95 | fora do ZIP; complemento do coordenador |

- **Lidos integralmente:** teste, manifesto, encaminhamento, cronologia, autoridades e os trechos pertinentes de README (L165–167), aderência (L119) e gates.
- **Não aberto:** `PUBLICO-R79-FILTRADO.jsonl`, citado na cronologia L6, não está no diretório. O parse do dump foi feito por mim.
- **Fontes de runtime** (`data.ts`, `dispatch.ts`): não vieram no ZIP. O contrato (C L43, L51) as descreve a partir das cópias R77, e o commit (dump L8423) mostra só três arquivos de teste/documentação. Logo, o runtime R77 auditado continua sendo a base, por relato do stat do commit.

## 1. E1–E5 contra o contrato

Referências: `project-edit-persist.test.ts` ("T Lnn").

- **Fixture (C L59–65), conforme:**
  - Arquivo temporário (T L112–114) e guarda de mtime da demo (T L14–17).
  - Duas organizações, operador só da Norte (T L116–119).
  - P (Alfa), Q (Meio) e S (Sul) (T L120–122). P e Q populados com campanha, conta referenciada como criadora e webhook ligado (T L85–108, L123–124). S é só controle.
  - Baseline depois do seed e do login (T L125–126).
  - `five()` usa `SELECT *` das 5 tabelas exatas (T L31–39; PA L17).
  - Cleanup em `finally` (T L252–259).

| Aceite | Exigido (C L71–75; PA L12–16) | Evidência | Classe |
|---|---|---|---|
| **E1** | PATCH com nome e descrição diferentes e `archived` igual → 200; DTO com id/org/createdAt/archived; GET igual ao PATCH; `SELECT *` difere só nos campos permitidos; sem exigir `updated_at` maior | PATCH Alfa→Zeta, "texto antigo"→"texto novo", `archived:false` (T L135–139); DTO (T L141–148); GET 200 `toEqual` PATCH (T L149–151); linha nova (T L153–155); `stable()` remove só name/description/updated_at e compara o resto com o baseline (T L41–47, L156) | **SUFICIENTE** |
| **E2** | 4 tabelas iguais; Q/S integrais; counts reais 1/1 em P e Q; S fora da lista Norte; ordem atual sem empate | campaigns/accounts/webhooks/links iguais (T L158–162); Q e S iguais (T L163–164); baseline 1/1 não zero (T L127–133); lista depois do PATCH com ordem Meio, Zeta (T L165–167), counts 1/1 (T L168–171), S ausente (T L172); detalhe P 1/1 (T L152) e Q 1/1 (T L173–174); `not_integrated` (T L175–176) | **SUFICIENTE** |
| **E3** | Fechar e reabrir o mesmo arquivo sem reseed; 5 tabelas iguais ao pós-E2; GET com nome/descrição novos e mesmos counts/IDs | `close` e `createDatabase(file)` (T L178–180); 5 tabelas iguais (T L181); detalhe 200 `toEqual` DTO e counts 1/1 (T L182–185); IDs da lista na mesma ordem (T L186–187); sessão existente reaproveitada (C L73) | **SUFICIENTE** (observação O1) |
| **E4** | 400/401/404 (S)/404 (inexistente)/403, cada um com snapshot imediatamente anterior; reabrir no fim | Cinco casos com JSON válido e `archived` explícito (T L189–236); para cada um: snapshot antes, status, `error.code` e 5 tabelas iguais (T L237–243); reabre e confere igual (T L244–247); nome persistido (T L248–251) | **SUFICIENTE** |
| **E5** | Confrontar R66 P6 e os testes atuais; só teste/docs; foco e suíte/gates depois do último diff; logs e revisão | Equivalente anterior parcial: `project-delete.test.ts` (manifesto L11; dump L8390, L8402). Delta de 3 arquivos, 264+/1− (dump L8423): teste novo, README +2 (L167), aderência ±1 (L119). Foco 1/1, exit 0 (dump L8414). Gates no §2 | **SUFICIENTE** (limites L1–L3) |

**Fronteira mantida (C L49–53):** sem Idempotency-Key, baseVersion, rollback ou concorrência; nenhum critério novo cobrado. Não reabri WHE, exclusão, DEC-14 nem DEC-16.

## 2. Rastreabilidade (dump do escritor, R79 L8368–8428; cronologia do coordenador)

Dump: `/workspace/cloud-agent-transcripts/bc-68876892-0c2c-553d-9afb-372723d790a3.jsonl`, 8428 linhas. Meu parse coincide com a `CRONOLOGIA-PUBLICA-R79.md` L10–24.

| Dump | Hora (−03) | Evento | Estado |
|---|---|---|---|
| 8372 | 15:39:25 | HEAD `71b45a49…`, status vazio; contrato 104 e parecer 23 | Relatado/observado |
| 8407 / 8409 | 15:40:32 / 15:40:34 | Diffs em README e aderência | Observado |
| **8411** | **15:40:49** | **Último diff:** cria o teste (261 linhas) | Observado |
| 8414 | 15:40:53 | Foco `project-edit-persist.test.ts`: 1/1, exit 0 | Observado |
| 8417 | 15:40:57 | TSC, lint, suíte, mtime e build; stdout vazio, exit 0 (só isso não prova os gates; cronologia L20) | Limite |
| 8420 | 15:41:51 | grep do log salvo: TSC 0, LINT 0, 47/193, VITEST 0, mtime, BUILD 0 | Observado |
| 8423 | 15:41:59 | Commit `ad558635…`, pai `71b45a49…`, 3 arquivos, árvore limpa, em dia com origin/main | Relatado |
| 8426 | 15:42:09 | CMP_OK de README/docs/test; SHA256 do ZIP `3213097f…` (aferido por mim) | Relatado, com ZIP conferido |

- **Gates em `gates.txt`, linhas reais:** `TSC:0` L1; `LINT:0` L6; teste novo L826; `Test Files 47` L860; `Tests 193` L861; `VITEST:0` L865; mtime `1794012148` L866; `BUILD:0` L949.
  - O encaminhamento L20 diz mtime L865 e VITEST L865; as linhas corretas são VITEST L865 e mtime L866. A cronologia L21 está correta.
- **Inventário nominal:** comparei por texto o log R79 com o log final R77 (`gates-d7481e4d.txt`), extraindo as linhas `✓ src/...test.ts (N tests)`.
  - As 46 entradas R77 aparecem iguais, com as mesmas contagens. A única entrada nova é `project-edit-persist.test.ts (1 test)`.
  - Isso sustenta documentalmente que a baseline continua incluída (C L84). Não é execução.
- **Conclusão:** a sequência último diff (8411) → foco (8414) → gates verdes (8417/8420) → commit (8423) → CMP/ZIP (8426) é suficiente como relato observável. Não há edição visível depois de 8411 até 8428.
- **Limites, não bloqueantes porque o contrato não os exige (C L85: "não inventar rerun pós-commit nem hash de árvore por gate se ausente"):**
  - **L1:** sem hash de árvore por gate; a ligação do log à chamada depende da sequência grep/cópia (cronologia L33).
  - **L2:** Git e CMP são relatados, não certificados.
  - **L3:** o mtime não prova invariância universal do banco.

## 3. Classificação, delta e recomendações

- **Bug demonstrável em fonte:** nenhum.
- **Prova contratual faltante:** nenhuma. **Delta material: vazio.**
- **Observações não bloqueantes, sem critério novo:**
  - **O1 (E3):** depois da reabertura, a lista só confere os IDs e a ordem (T L186–187); nome e counts da lista não são reafirmados. A cláusula (C L73 "GET detalhe/lista confirma…") fica atendida pelo detalhe (nome, descrição e counts, T L182–185), pelos IDs da lista e pela igualdade integral das 5 tabelas (T L181), de onde as contagens derivam. Em escrita futura, um assert de `counts` e nomes na `rereadList` deixaria a leitura literal explícita. Não exigir agora.
  - **O2:** o encaminhamento L20 troca a linha do mtime (L866, não L865). É só documental.
  - **O3:** o README L165 mantém a frase imprecisa sobre o leitor limitado, já registrada na QA R77 e fora deste recorte (C L93).
- **Recomendações exatas:**
  1. O coordenador pode registrar "PROVADO LIMITADO — edição de metadados do projeto com preservação/reabertura" (C L87; PA L23) para a revisão relatada `ad558635…`.
  2. Corrigir O2 no próprio encaminhamento, se desejar.
  3. O1 e O3 ficam como opcionais em escrita futura.

## 4. Conclusão

**SUFICIÊNCIA DOCUMENTAL de E1–E5 do recorte PRJ01-EDIT-PERSIST v1**, revisão relatada `ad558635f637a7a9bb6f9b516599e44857c4e295`.
- Não há bug, nem prova faltante, nem delta material.
- Os limites L1–L3 e as observações O1–O3 estão registrados.
- Não houve execução independente, e a proveniência Git é só relatada.

Este parecer **não homologa PRJ-01 global, PRJ-03, FLX-10 nem produção**, e **não autoriza a próxima fatia**: a decisão é do coordenador.
