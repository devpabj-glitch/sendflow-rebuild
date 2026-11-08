# Auditoria documental independente — WH-IN-CONFIG v1, entrega R77

**Registro:** gravado em 07/11/2026 15:32:49 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.
**Natureza:** parecer DOCUMENTAL. **Não foi executado código do projeto, teste, banco, build, repo nem rede.** Só usei leitura de arquivos e utilitários locais de metadados (`sha256sum`, `wc`, `diff` entre cópias, `grep`, `date`) e um parser Python do dump JSONL.

## 0. Fontes e integridade

- **Revisão RELATADA:** `71b45a49a985cf8773a251006d9a21c959187f09`, pai `21c904aaf4fd4066dc7441aa2a2d1ddd783ff993`.
  - A proveniência Git só existe como relato do escritor: `CMP_OK` contra `git show` e blobs, no dump L8349. **Não há certificação Git independente.**
- **ZIP:** o hash informado é `1a898a1d0d9fd67a3a4686593f0dfdcd5a390dbc7d759fbe154954a57f52a65d`. O ZIP **não está presente** no box: só o diretório extraído. **O hash do ZIP não foi aferido.**
- **Autoridade:** o contrato `PACOTE-WEBHOOKS-ENTRADA-VINCULOS-CAMPANHAS.md` (199 linhas, "C Lnn"). O item a fechar é o delta da `AUDITORIA-INDEPENDENTE-WHE-R75.md` v2 (P1–P10, P12–P14, DIV-1).
  - O PM pertinente não foi recebido como arquivo; README L165 relata o PM base `5f74532b2c28` não editado. Não reabri itens SUF nem acrescentei critérios.
- **Diretório `/workspace/grupos-evidencias-r77/`:** 15 arquivos com nomes reais. **Nenhuma cópia R75 foi usada como atual.**
  - **14 com hash no manifesto:** SHA256 recalculado, 14/14 OK contra `MANIFEST-SHA256.txt`.
  - **O 15º é o próprio manifesto** (1245 B, 15 linhas), que naturalmente não se autolista.

| Arquivo | Bytes | Linhas | SHA256 | vs R75 |
|---|---|---|---|---|
| data.ts | 52753 | 1633 | 4abcdc27…4f1616 | igual |
| db.ts | 35248 | 847 | 548232921…f48aa6 | igual |
| dispatch.ts | 38787 | 966 | 18814e7dd7b6b9d1f017b550a5d98a4ea35a09fc7316871fafaa1cbc0d7c2573 | **alterado** |
| idempotency.ts | 3272 | 106 | e674fb6f…8d65fbdf | igual |
| incoming-webhooks.ts | 8967 | 249 | 6e73b896…954f50 | igual |
| incoming-webhook-read-worker.ts | 852 | 23 | 339c298e…5a6a2f | igual |
| incoming-webhook-worker.ts | 2492 | 76 | eed93b592914799f8502e2b6504643ecbaf5c881ef49218cdb49fbbf73c881d4 | **alterado** |
| incoming-webhook-c35-worker.ts | 1091 | 34 | d7ab2e7fc94d3f795886e00ad4bbadc0c3988d88d13ef5815d4ce778e91e57bf | **novo** |
| incoming-webhooks-gaps.test.ts | 58991 | 1131 | f062961335e4003c1ac05ed256ba25fb497238bb8e969bbb7cd61092e3f84ef2 | **alterado** |
| incoming-webhooks.test.ts | 20221 | 458 | c924ce14…e687 | igual |
| README.md | 31463 | 222 | f7ec7f3364c035dc734ad84817b19de24ebe794ab9557cd7b797929e7118cecf | novo no pacote |
| MAPA.txt | 2983 | 23 | 025ff2fc2bcea3c75da1e4d80fbacc0fbff78ec50d7c67d0400d5b8e5edd36e7 | novo |
| gates-d7481e4d.txt (FINAL) | 80620 | 944 | 0f1c590b606316024b0d75275476b536c40f2500a3ee1e3dc399c03d95acb7c6 | novo |
| gates-c06a91b6-tsc2.txt (INTERMEDIÁRIO) | 81923 | 956 | 67456685b313019be029716f01d6ef40422d6a40bae915fcd660646479c78eaf | novo |

- **Lidos integralmente:** os quatro arquivos alterados ou novos, o MAPA e os trechos pertinentes dos dois logs.
- **Diff `dispatch.ts` R75→R77:** só o novo `readWebhookJson` (L377–380) e a troca de `readJson` por esse leitor em L899/910/923/932/947.
- **Diff do worker:** acrescenta a ação `delete` (L49–59). A ordem de abertura não mudou: `opened` em L30–32; `ready`/`go`/`createDatabase` em L34–36.
- **Os arquivos iguais aos da R75** mantêm as conclusões da auditoria R75 v2.

## 1. Rastreamento no dump (R77/R78)

O dump fica no mesmo caminho atual: 8357 linhas, 12.624.565 B, SHA256 `79f62392…2774fa`. Usei só o conteúdo visível das linhas 8193–8357 (texto, chamadas e resultados de ferramentas), descartando thinking/reasoning/analysis.

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8193–8210 | — | R76, só leitura: `CMP_OK` dos quatro arquivos de 21c904aa |
| 8211 | — | Ordem de fechamento P1–P10/P12–P14/DIV1 |
| 8262–8303 | 15:23:36–15:25:10 | Diffs: dispatch.ts, README, worker, c35-worker (novo), gaps |
| 8306 | 15:25:16 | Testes dirigidos. MAPA L23 relata o c35 com `database is locked` |
| 8309 | 15:25:29 | Correção no c35-worker: `db.close()` antes de `postMessage` (L19) |
| 8312 | 15:25:36 | c35 isolado: 1 passou, 12 skipped, exit 0 |
| 8315→8318 | 15:25:45–15:26:38 | **Gates INTERMEDIÁRIOS** (`gates-c06a91b6-tsc2.txt`) |
| 8329, 8331 | 15:26:49 | **Último diff na árvore:** gaps L805 (tipo de `routes`) e L1121 (`?? ""`), só tipos de teste |
| 8334→8337 | 15:26:52–15:27:44 | **Gates FINAIS** (`gates-d7481e4d.txt`) |
| 8340, 8343 | 15:27:51–53 | Só grep |
| 8346 | 15:27:57 | Commit `71b45a4`: 5 arquivos, 539+/8−; parent 21c904aa; working tree clean; up to date com origin/main |
| 8349 | 15:28:04 | `CMP_OK` dos 5 arquivos e SHA256 iguais aos do manifesto |
| 8352 | — | MAPA escrito em artifacts, fora da árvore |

**Log intermediário `gates-c06a91b6-tsc2.txt` (não é o final):**
- `TSC:2` na L12, com erros em gaps (815,9) TS2322 e (1121,13) TS2769, linhas do arquivo daquela época.
- `LINT:0` na L17; 46 arquivos e 192 testes nas L867–868; `VITEST:0` na L872; `BUILD:0` na L956.

**Log final `gates-d7481e4d.txt`:**
- `TSC:0` na L1 e `LINT:0` na L6.
- `Test Files 46 passed` / `Tests 192 passed` nas L855–856 (Start 18:26:57 UTC = 15:26:57 −03).
- `VITEST:0` na L860; mtime da demo `1794012148` na L861; `BUILD:0` na L944.
- `incoming-webhooks-gaps.test.ts (13 tests)` na L629 e `incoming-webhooks.test.ts (3 tests)` na L752.
- Os stderr esperados vêm das fixtures: L548–549 e L569–570 (`Error: fixture`), L582–583 e L595–596 (`no such table: incoming_webhook_campaigns`).

**Conclusão:** a sequência último diff (15:26:49) → gates finais verdes (192/46, 15:26:52–15:27:44) → commit (15:27:57), sem diff intermediário, é suficiente **como relato**. O log não carrega o hash da revisão.

## 2. Tabela finita: P1–P10, P12–P14 e DIV-1

Todas as referências são linhas reais de `incoming-webhooks-gaps.test.ts` R77, salvo indicação.

| # | Cláusula | Evidência (assert) | Status |
|---|---|---|---|
| P1 | C L169/L110/L119, PATCH/DELETE estrangeiros | L827–861: 404 `not_found` (L854–857); webhook alheio igual (L858); `idempotency_keys` igual (L859) | **SUF** |
| P2 | C L102, desempate por id | L667–674 `alfa`/`Alfa`; L687–689 ids em ordem crescente e length 2 | **SUF** |
| P3 | C L102/L169, `false` populado | Ativos alfa/Alfa e Meio arquivado (L675–684); L690–691 igual ao subconjunto não arquivado da lista completa, na mesma ordem | **SUF** |
| P4 | C L98, DTO integral | L699–719 DTO montado da linha; L721 `toEqual` na lista; L723 `toEqual` em `{webhook, campaignIds}`; L724 chaves exatas | **SUF** |
| P5 | C L75/L117, `2**53` | L725–736 PATCH e DELETE: 400 `validation`, sem recibo (L734), snapshot igual (L736). Fonte: `dispatch.ts:187-192` | **SUF** |
| P6 | C L170, sem chave de sucesso | L737–749: campanha ausente e estrangeira dão 404, e as chaves não existem (L749) | **SUF** |
| P7 | C L135/L172, unlink ausente | L750–758: 200 `{…, linked:false, changed:false}`; links iguais | **SUF** |
| P8 | C L173/L169, fechar/reabrir | L863–944: depois de editar/arquivar/ligar/desligar, reabre e compara `SELECT *` (L902–907); delete abortado 500 (L917–923), reabre e confere igual ao estado ligado, sem chave (L924–930); retry 200 (L932–937), reabre e confere vazio (L938–941) | **SUF** |
| P9 | C L159, erro estrutural nunca 0 | L946–965: DROP depois da abertura (L953–955); `GET projects`/`GET project` dão 500 `internal` (L958–961); corpo sem `webhooks` (L962–963). Stderr: gates final L582–601 | **SUF** |
| P10 | C L175/L147, link×delete na fase DB | L967–1041: as duas conexões abertas (`worker:30-32`, marcadores L1022–1023); link dentro da transação (L1025, `idempotency.ts:45-52`); delete marca tentativa (L1027) e **não** está dentro (L1028); liberação L1029–1030; link `changed:true`, delete `deleted:true`, sem webhook nem vínculo (L1033–1038). Ação delete: `worker:49-59` | **SUF**, com limite (abaixo) |
| P12 | C L131, mesma key em alvo/org | L759–777: a mesma key em alfa→second e Alfa→first, ambos `changed:true` (L770–771); a mesma key na org Sul dá 201 com `organizationId` Sul (L772–777) | **SUF** |
| P13 | C L110/L96, chaves proibidas | L779–803: as 6 chaves do contrato e `organizationId` em POST/PATCH/PUT dão 400 (L795–797), sem recibo (L798–800); linha Sul igual (L802); nenhum "Valido" (L803) | **SUF** |
| P14 | C L178, fixture c35 populada | L1043–1130: `git archive c35defbc…` (L1048), alias `@/`→árvore c35 (L1050–1072); o c35-worker cria e popula (`c35-worker:6-19`); sem tabelas `incoming_webhook%` depois do seed (L1085); falha `after_first_table` (L1102–1107); controles legados iguais e tabelas ausentes (L1109–1110); HEAD cria (L1112–1117); FK de pai ausente lança (L1118–1122); segunda abertura não duplica (L1124–1127) | **SUF documental**, com limite de proveniência |
| DIV-1 | C L110, "limite bounded JSON existente" | `dispatch.ts:377-380` `readWebhookJson` → `readBoundedText` (L320–352 inalterado) com `SIGNUP_BODY_MAX_BYTES` importado (L62–65); chamadas em L899/910/923/932/947. Teste L804–823: corpo maior que a constante nas 5 rotas dá 400 `payload_too_large` (L819–820), sem recibo (L821), snapshot igual (L823) | **SUF** |

**Limites registrados (não invalidam a suficiência):**
- **P10:** o marcador `delete-attempt` é gravado antes do `BEGIN IMMEDIATE` (`idempotency.ts:41-42`, `:78-79`). A espera do delete dentro do BEGIN é inferida pela ordem observada, não por marcador próprio. Só a ordem "link vence" foi exercitada; o contrato pede observar o resultado conforme a ordem real, e ele foi observado.
- **P14:**
  - A origem c35 depende do `git archive` executado pelo escritor; não verifiquei o conteúdo do tar.
  - Há corroboração interna: o banco semeado não tem tabelas `incoming_webhook%` (L1085), coerente com uma árvore anterior à fatia.
  - O worker do seed é do HEAD, mas resolve `@/lib/db` e `@/lib/data` para a árvore c35 pelo hook (L1056–1061).
- **DIV-1:**
  - O valor 8192 só é relatado (README L165; dump L8229 e L8357, `embedded-signup.ts` L10 não entregue). O teste usa a constante importada, então independe do valor.
  - A escolha de `SIGNUP_BODY_MAX_BYTES` foi decisão de engenharia do escritor, registrada no README. Responde à pergunta técnica da R75 com uma constante existente, sem inventar número.
  - Não há conclusão de impacto ou DoS.

**Mantidos, sem reabrir:**
- P11 continua SUF.
- O N/A de "exclusão antiga recusada" continua justificado: `data.ts` não mudou, `deleteCampaign` L726–731 só recusa campanha ausente e não foi criada recusa nova (MAPA L5).
- O índice homônimo segue fora do recorte.

## 3. Diferenças materiais e observações

- **Nenhum bug demonstrável. Nenhuma pendência contratual aberta.**
- **Observação documental, não bloqueante e sem critério novo:** README L165 diz que as mutações usam "o leitor limitado já usado no restante da API". Pela fonte, as rotas legadas continuam em `readJson` sem teto (`dispatch.ts:372-375`, p.ex. L820/841/865); o limitador só era usado em import/signup. A frase é imprecisa; o código e o teste do recorte estão corretos. Sugere-se corrigir a redação quando houver nova escrita.
- **Falha intermediária** (MAPA L23; dump 8306–8312): `database is locked` no c35 por `postMessage` antes do `close`. Corrigido no próprio fixture (`c35-worker:19`) e reexecutado. É defeito de fixture, não de produto.

## 4. Conclusão

**SUFICIÊNCIA DOCUMENTAL PARA ACEITE TÉCNICO DO RECORTE WH-IN-CONFIG v1** na revisão relatada `71b45a49…`, com os 13 itens e DIV-1 fechados por assert específico.

Limites:
- Proveniência Git só relatada.
- ZIP não aferido.
- Sem execução independente.
- Limites de P10 e P14 registrados no §2.

Este parecer **não homologa produção nem o sistema inteiro e não autoriza a próxima fatia**. WHE-02, WHE-04 a WHE-06 e FLX-07 continuam fora do recorte.
