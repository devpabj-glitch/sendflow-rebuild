# Auditoria documental independente — WH-IN-CONFIG v1, entrega R75

**Registro:** versão 1 em 07/11/2026 ~15:12; **versão 2 (esta) atualizada em 07/11/2026; correção final com `date` do shell às 15:17:52 −03** (America/Sao_Paulo). Frente QA (Grok Bot executor); escrita autorizada só deste arquivo.
**Estado final:** **AUDITORIA DOCUMENTAL CONCLUÍDA, COM DELTA CONTRATUAL ABERTO** (§6). Sem execução independente: **não foi executado código do projeto, teste, banco, build, repo nem rede**. Só usei leitura de arquivos e utilitários locais de metadados (`sha256sum`, `wc`, `cat -n`, `date`). **Não homologa o pacote e não libera a próxima fatia.**

## 0. Fontes, integridade e limites

- **Revisão RELATADA:** `21c904aaf4fd4066dc7441aa2a2d1ddd783ff993`, pai `23c31aa8f49f85503a3a6e9c14d89808e1d780d9`. O escritor R76 (read-only) RELATA que as cópias são iguais a `git show 21c904aa` (cmp/blob). Isso **não é certificação independente**: os hashes abaixo provam apenas os bytes recebidos.
- **Contrato (autoridade):** `/workspace/grupos-execucao-backend/PACOTE-WEBHOOKS-ENTRADA-VINCULOS-CAMPANHAS.md`, 199 linhas ("C Lnn"). O parecer finito (`PARECER-ACEITE-FINITO-WHE-R74.md`) e o MAPA do escritor não dispensam cláusulas.
- **Diretório:** `/workspace/grupos-evidencias-r75/`. Nomes reais: `data.ts`, `db.ts`, `gates-696272.txt`, `idempotency.ts`, `incoming-webhooks-gaps.test.ts` ("gaps"), `incoming-webhooks.test.ts` ("test"), `manifest.json`, `incoming-webhooks.ts`, `dispatch.ts`, `incoming-webhook-worker.ts`, `incoming-webhook-read-worker.ts`, `MAPA.txt`, `manifest-complemento.json`.
- **Todos lidos integralmente.** SHA256 e bytes recalculados localmente e iguais aos manifestos:

| Arquivo | Bytes | Linhas | SHA256 | Manifesto |
|---|---|---|---|---|
| data.ts | 52753 | 1633 | 4abcdc27c59e584de9b210f2e5125c1343ba58c6924448f8f12f6e228f4f1616 | manifest.json |
| db.ts | 35248 | 847 | 548232921785568b75689636e1adf263567783c3d3d95b4c5d704b3546f48aa6 | manifest.json |
| gates-696272.txt | 77198 | 899 | 3fc183d3562af55d7fbad24940a025983870eb743042ad082598edd03122bff6 | manifest.json |
| idempotency.ts | 3272 | 106 | e674fb6f661fa17fc349aca199b86ce3c028cd69bd4a04e1307ee9ec8d65fbdf | manifest.json |
| incoming-webhooks-gaps.test.ts | 34491 | 651 | 98c3353c95a921d12e62c0e89c95419ede281aed3a2d2a503e30947e365bcca3 | manifest.json |
| incoming-webhooks.test.ts | 20221 | 458 | c924ce142b9747cbd511624d56147a773f154868ae78c95c1d0f15350e05f687 | manifest.json |
| incoming-webhooks.ts | 8967 | 249 | 6e73b896b8f7f3f717577d3cf873ba2324502ffebfcfad1be674603854954f50 | manifest-complemento.json |
| dispatch.ts | 38523 | 961 | 7888a7f9736c5b2e67b8b4a3804424ab526ba8f299111096356d7d9e0bc2ff04 | manifest-complemento.json |
| incoming-webhook-worker.ts | 1956 | 64 | ac410efb44e4e3ac7c68c22385629b48b731d8cfb01eda8b6e4ff1782545b465 | manifest-complemento.json |
| incoming-webhook-read-worker.ts | 852 | 23 | 339c298e3e0084c672d2afc58bbd4c0b58767fcb43028ede5b2c7d91b27a6a2f | manifest-complemento.json |
| MAPA.txt (fora do git) | 5498 | 84 | 5443171c9cab9d8a34b655773732826e6361fd25836445ceede7891027a077a9 | manifest-complemento.json |

- **Não recebidos (não exigidos pelo pedido):** os Route Handlers `src/app/api/v1/incoming-webhooks/**/route.ts`. O mapeamento URL→`route.resource` fica inferido pela lista de rotas do build (gates L231–233, L859–861).
- **Dump:** `bc-68876892-0c2c-553d-9afb-372723d790a3.jsonl`, 12.326.040 bytes / 8192 linhas. Usado só o conteúdo visível do R75 (linhas 8079–8192); thinking/reasoning/analysis descartados.

**Legenda.** **SUF**: evidência suficiente para a cláusula. **PEND**: prova contratada faltante; a fonte pode ser favorável, mas isso não dispensa o teste. **DIV?**: possível divergência de fonte frente ao contrato, dependente de leitura do coordenador. **N/A**: cláusula sem caso aplicável, com justificativa por fonte. **BUG**: defeito demonstrável. Ausência de teste nunca é BUG.

## 1. Rastreabilidade revisão × gates (dump R75, America/Sao_Paulo)

| Dump | Hora | Evento |
|---|---|---|
| 8130–8153 | 15:01:03–15:01:40 | Últimos `search_replace` na árvore |
| 8156 | 15:01:58 | Testes dirigidos |
| 8159 | 15:02:08–15:02:58 | Gates: L10 `TSC:0`; L15 `LINT:0`; L804–805 46 arquivos / 186 testes; L809 `VITEST:0`; L810 mtime demo `1794012148`; L893 `BUILD:0`; L896 `exit_code: 0` |
| 8173 / 8176 | 15:02:52 / 15:03:36 | `git show/diff` da c35, só leitura |
| 8184 | 15:04:11 | Commit: 5 arquivos, 311+/31− |
| 8187 | — | Push; `git show` = `21c904aa…`; working tree clean |
| 8190 | 15:04:45 | Edição só em `MAPA.txt`, fora da árvore |

**Conclusão:** nenhum diff na árvore entre gates e commit. A ligação gates→revisão é sequencial e suficiente como relato com stdout; o log em si não traz o hash.

**Anomalias sem impacto:**
- Saída de `next build` intercalada no Vitest (gates L26–233), não verificada.
- `Error: fixture / constraint failed` (L570–580, L681–692) vem dos triggers dos próprios testes, que passaram (L585, L715).

## 2. Verificações pedidas nas fontes novas

1. **W4: `opened` é gravado depois da abertura.** SUF. `incoming-webhook-worker.ts:29-31`: `createDatabase` (29), depois `writeFileSync(opened)` (30) e espera `phaseGo` (31).
2. **W7 link×delete não sobrepõe.** Confirmado pela fonte. No modo `ready/go`, `ready` (`worker:33`) e `go` (`:34`) vêm antes de `createDatabase` (`:35`); o delete do teste (`gaps:457`) termina antes da abertura.
3. **Auth e origin antes do replay.** SUF pela fonte.
   - Origin é checada em `dispatch.ts:432`, antes de qualquer rota.
   - `authorize` (`:481`) roda antes de todas as rotas de webhook (`:889-955`).
   - O replay só acontece dentro de `idempotent`/`withIdempotency` (`:410-427`; `idempotency.ts:75-76`), sempre depois da autorização.
   - Comportamento observado: `gaps:178-182` (401).
4. **Organização e body.**
   - A organização vem só de `authorize` (`dispatch.ts:393-408`); `idempotent` remove `organizationId` do hash (`:424-425`).
   - O canonical de cada rota recusa chave extra: `assertExactKeys`, `:172-179`, `:195`, `:216`, `:242`, `:928`, `:943`.
5. **Escopo de idempotência por alvo** (C L131). SUF pela fonte. `create`, `update:{id}` (`:907`), `delete:{id}` (`:921`), `link:{id}:{campaignId}` (`:935`), `unlink:{id}:{campaignId}` (`:950`). A busca e o recibo usam `(organization_id, scope, key)` (`idempotency.ts:28-34`, `:88-92`).
6. **`??0` no detalhe.** SUF pela fonte; teste PEND (§6).
   - `readProjectDetail` (`dispatch.ts:136-160`) só aplica `?? 0` (`:150`) depois de `projectAccountCounts`/`projectWebhookCounts` retornarem.
   - Os mapas já vêm pré-preenchidos com 0 para cada projeto existente (`data.ts:186`, `:207`).
   - Erro de consulta faz ROLLBACK e rethrow (`:152-158`). `fail` só converte `DomainError`; qualquer outro erro vira 500 `internal` (`:281-282`), nunca 0.
   - A coleção (`:118-134`) segue o mesmo padrão.
7. **Rotas sem fallback de ingestão.** SUF pela fonte.
   - O dispatcher devolve 404 para resource desconhecido (`dispatch.ts:957`).
   - O build lista só as três rotas de gestão (gates L231–233).
   - Não existe resource de recepção.

## 3. W1–W8

### W1 — CRUD, lista e archive (C L169, L98–112): PEND parcial

Evidência existente:
- `test:126-196`.
- `gaps:156-200`.
- `gaps:342-358`.

Fonte:
- Ordem `archived ASC, name NOCASE, id ASC`: `incoming-webhooks.ts:100-101`.
- `safeConfigVersion` com `Number.isSafeInteger`: `dispatch.ts:187-192`.
- No-op sem incremento: `incoming-webhooks.ts:178-180`.
- Versão apresentada checada antes do no-op: `:170-174`.

PEND: P1–P5 (§6). O 409 por versão obsoleta no DELETE já é SUF (`gaps:316-323`).

### W2 — vínculo explícito e FKs (C L170): SUF, com uma PEND

- Matriz INSERT/UPDATE: `gaps:466-504`.
- Campanha estrangeira dá 404 sem linha: `test:236-242`.
- Campanha inexistente dá 404: `gaps:236`.
- `requireWebhook`/`requireCampaign` filtram por organização: `incoming-webhooks.ts:79-88`.

PEND P6: a cláusula pede "sem linha/chave de sucesso"; o recibo ausente depois do 404 não foi afirmado.

### W3 — cardinalidade (C L171): SUF

- `test:203-249`.
- `gaps:331-338`.
- `ON CONFLICT DO NOTHING` com `changes`: `incoming-webhooks.ts:224-231`.

### W4 — duplicado, replay e concorrência (C L172, L133–135, L145): SUF, com uma PEND

- Replay, hash divergente e delete repetido: `test:153-163`, `:295-307`; `gaps:178-182`.
- Concorrência `test:370-457`:
  - duas conexões abertas antes da disputa (`worker:29-31`);
  - a primeira dentro da transação (`idempotency.ts:45-52`, `:80`);
  - a segunda no ponto imediatamente anterior ao `BEGIN` (`:41-42` seguido sincronamente de `:78-79`);
  - um id, uma linha e um recibo (`test:445-454`);
  - rechecagem interna em `idempotency.ts:82-86`.
- Limites registrados, sem invalidar a prova: a janela síncrona entre marcador e `BEGIN` é mínima; o teste não distingue se o perdedor fez replay pela rechecagem ou pelo `catch`.

PEND P7: unlink de par ausente com `changed:false`. A fonte é favorável (`incoming-webhooks.ts:242-248`), mas `test:252-258` não faz esse assert.

### W5 — preservação e rollback (C L173, L139): SUF, com uma PEND

- Link: `gaps:238-255`.
- Unlink efetivo: `gaps:291-313`.
- GET: `gaps:256-259`.
- DELETE com falha: `gaps:506-546`.
- CREATE com falha: `test:340-354`.
- Ordem trabalho → recibo → COMMIT: `idempotency.ts:87-94`.
- Rollback com rethrow: `:96-104`.

PEND P8: fechar e reabrir antes de reler. Hoje só existe no create (`test:333-339`, dois campos).

### W6 — derivação por projeto (C L174, L153–161): SUF nos cenários, com uma PEND

- Cenários: `test:260-277`; `gaps:277-289`, `:363-437`, `:563-570`.
- SQL: `data.ts:191-210`; formato em `dispatch.ts:118-160`.

PEND P9: estrutura ausente gera erro e nunca 0 (C L159). A fonte é favorável (§2.6); falta o teste.

### W7 — archive e delete (C L175, L87–91, L141, L147)

- Archive: `gaps:261-269`. SUF.
- Delete de webhook: `test:279-307`. SUF.
- `deleteCampaign` com outro par presente: `gaps:549-571`. SUF.
- **"Exclusão antiga recusada preserva pares": N/A.**
  - `deleteCampaign` (`data.ts:726-731`) só recusa campanha inexistente, coberto em `gaps:324-325`.
  - As FKs que apontam para `campaigns` são CASCADE ou SET NULL (`db.ts:68-265`).
  - A FK composta sem ação de `scheduled_jobs` (`db.ts:236`) fica satisfeita depois do SET NULL de `db.ts:216`; empiricamente, `gaps:228` + `:326`.
  - A rota `dispatch.ts:568-571` não acrescenta recusa.
  - Conclusão: não existe ramo legado de recusa de campanha existente.
- **PEND P10:** link×delete com sobreposição na fase DB (C L147, L175). Ver §2.2.

### W8 — honestidade e regressão (C L176, L125): SUF

- `not_integrated` (`incoming-webhooks.ts:42`).
- `receive` dá 404 (`test:312-316`; `dispatch.ts:957`).
- Build só com rotas de gestão; gates verdes.
- O inventário nominal dos 186 testes não aparece no log (limite de relato, não pendência contratual).

## 4. Transversais

- **Isolamento.**
  - SUF: 403 de membership; GET estrangeiro 404; campanha estrangeira 404; FKs compostas; contagem por organização; snapshot de leitura; organização só do contexto; escopo por alvo (§2.3–2.5).
  - PEND: P1 (PATCH/DELETE estrangeiros), P12 (mesma key em outra organização ou alvo), P13 (chaves de body proibidas).
- **Rollback.** SUF em create, delete e migração. O wrapper não grava recibo quando há erro (`idempotency.ts:96-104`). Falha específica em link/unlink não é exigida: o contrato dá um único exemplo ("p.ex.", C L173).
- **Contagem.** SUF pela fonte (§2.6); PEND P9.
- **Exclusão.** SUF (W7). `deleteCampaign` sem transação explícita é legado; a cascata é atômica no próprio DELETE. A leitura integral de `data.ts` confirma que nenhuma escrita fora da contagem toca `incoming_webhook*`; `archiveCampaigns` (`:676-712`) e `deleteAccount` (`:425-430`) não alteram vínculos.
- **Migração.**
  - Comportamento SUF: `gaps:574-650`; DDL em `BEGIN IMMEDIATE`/ROLLBACK (`db.ts:463-518`); falha `after_first_table` (`:483`, `:521-525`); homônimos recusados (`gaps:119-144`, `test:357-366`).
  - CHECKs por `includes` normalizado: limite já conhecido, sem exigir parser universal.
  - Os ganchos de teste no runtime são guardados por `NODE_ENV === "production"`.
- **Proveniência.** PEND P14. C L178 exige "fixture base c35defb populada". O que existe é o schema atual sem as tabelas novas (`gaps:577-586`), mais o relato do escritor (linhas 1–360 de `db.ts` com o mesmo SHA256; diff só com inserções; MAPA L53–57), que não verifiquei. A ordem do coordenador ao escritor (dump 8079) relaxou o tipo de prova, mas não dispensa a cláusula: o contrato continua sendo a autoridade.

## 5. Classificação de achados

- **BUG demonstrável em fonte:** nenhum.
- **DIV-1, divergência estática a esclarecer/corrigir no escopo:** contrato linha 110, literal: "Usar limite bounded JSON existente". Não há bug reproduzido nem impacto ou DoS concluído, porque nada foi executado.
  - As rotas de webhook leem o corpo com `readJson` (`dispatch.ts:372-375`, chamado em `:894`, `:905`, `:918`, `:927`, `:942`), que é `request.text()` sem limite.
  - O leitor com limite `readBoundedText` (`:320-352`) só é usado em import (`:354-356`, `GROUP_IMPORT_MAX_BYTES`) e signup (`:872`, `SIGNUP_BODY_MAX_BYTES`).
  - O uso de `readJson` pelas rotas legadas não satisfaz a cláusula, porque "bounded" é explícito.
  - Nas fontes recebidas não aparece um limite de JSON geral; as duas constantes vêm de módulos não entregues e seus valores não foram lidos.
  - **Pergunta técnica ao coordenador:** qual constante existente deve limitar as rotas `incoming-webhooks` via `readBoundedText`: `GROUP_IMPORT_MAX_BYTES`, `SIGNUP_BODY_MAX_BYTES` ou outra já existente? Sem inventar número.
  - **Menor prova depois da correção:** um corpo acima do limite escolhido em POST, PATCH, DELETE e PUT/DELETE de vínculo → 400 `payload_too_large`, sem linha nem recibo.
- **N/A:** W7 "exclusão antiga recusada" (§3).
- **PEND:** P1–P14 (§6).
- **Retirado sem pendência:** índice homônimo. C L81 fala literalmente de "tabela homônima"; aplicar a índice era extrapolação.

## 6. Delta contratual aberto: lista finita

Cada item é prova de teste no padrão existente (dispatcher, fixtures sintéticas), sem teste universal e sem ampliar o contrato. Fonte favorável não dispensa nenhum deles.

| # | Critério (contrato) | Evidência atual / lacuna | Menor prova necessária |
|---|---|---|---|
| P1 | W1/isolamento: "401/403/foreign404 pororg" (C L169, L110, L119) | Só GET estrangeiro (`gaps:235`) | PATCH e DELETE em `incoming-webhook` com id de outra organização → 404 `not_found`; snapshot do webhook alheio e de `idempotency_keys` inalterados |
| P2 | W1 ordem com desempate `id` (C L102) | SQL `incoming-webhooks.ts:100-101`; `gaps:342-358` sem nomes iguais | Dois webhooks com o mesmo nome (variando maiúsculas) → lista em `id ASC` |
| P3 | W1 filtro `false` populado (C L102, L169) | `gaps:158-159` só com lista vazia | Com ativos e arquivados presentes, `?archived=false` devolve exatamente os ativos, na ordem |
| P4 | W1 DTO (C L98) | `toMatchObject` (`gaps:202`, `test:145`) | `toEqual` do DTO completo da lista e do detalhe contra a linha persistida (inclui `createdAt`/`updatedAt`/`organizationId`) e `campaignIds` como campo irmão |
| P5 | W1 versão inteira positiva segura (C L75, L117) | Fonte `dispatch.ts:187-192`; casos 0/−1/1,5/"1" (`gaps:183-192`) | `baseVersion = 2**53` em PATCH e DELETE → 400 validation, sem mutação |
| P6 | W2 "A/B ou inexistente 404 sem linha/chave de sucesso" (C L170) | Linha ausente afirmada (`test:242`); chave não | Depois do 404 de campanha estrangeira e inexistente, afirmar ausência da `Idempotency-Key` usada em `idempotency_keys` |
| P7 | W4 "DELETE par ausente noop" (C L135, L172) | Fonte `incoming-webhooks.ts:242-248`; `test:252-258` sem assert | DELETE de vínculo ausente com pais válidos → 200 `changed:false`, links inalterados |
| P8 | W5 "Fechar/reabrir antes de reler persistência" (C L173; também "reabrirDB" em C L169) | Só create (`test:333-339`) | Em arquivo, depois de editar/arquivar, link/unlink e delete com falha + retry: `close` → `createDatabase` → `SELECT *` de webhooks/links igual ao esperado |
| P9 | W6 "Migração/consulta falha → erro explícito, nunca fallback silencioso de 0" (C L159) | Fonte favorável (§2.6); sem teste | Fixture que remove `incoming_webhook_campaigns` depois da abertura → `GET projects` e `GET project` respondem 500 `internal`, sem `counts.webhooks` |
| P10 | W7 "Intercalar link×delete com barreira/conexões e observar resultado conforme ordem real" (C L175, L147) | `gaps:439-461` com `ready`/`go` antes da abertura (`worker:33-35`) | Reusar o modo `opened`/`phaseGo` e o hold de fase (`worker:29-31`; `idempotency.ts:37-53`): link retido depois do `BEGIN` enquanto o DELETE do webhook tenta entrar; afirmar o resultado pela ordem de commit (sem vínculo órfão; link vence → delete remove o filho; ou delete vence → link 404) |
| P11 | W1 "versão obsoleta 409 sem alteração" no DELETE (C L169, L120) | 409 no DELETE em `gaps:316-323` | — já SUF; **não é pendência** (mantido só para fechar o mapa W1) |
| P12 | Isolamento "mesma key em alvo/org diferentes não mascara operação" (C L131) | Fonte favorável (§2.5); sem teste | Mesma `Idempotency-Key` em link A→C1 e A→C2 → os dois efetivos; a mesma key em outra organização → efeito próprio |
| P13 | "desconhecidas 400, inclusive projectId/accountIds/secret/url/event/status"; body não escolhe `organizationId` (C L110, L96) | Só `secret` (`test:134-138`) | Para cada chave citada e para `organizationId`: POST/PATCH (e PUT de vínculo com body não vazio) → 400, sem linha nem recibo |
| P14 | Migração "fixture basec35defb populada" (C L178) | Schema atual sem as tabelas novas (`gaps:577-586`); relato git não verificado | Banco criado e populado pelo `db.ts` da c35 (cópia temporária da árvore c35, sem tocar `main`) e aberto pelo HEAD, com as mesmas asserções de `gaps:574-650` |

P11 não é pendência. **Pendências efetivas: P1–P10, P12–P14 (13 itens).** **Além dos 13 testes, há um item de fonte: DIV-1 (§5)**, uma correção ou esclarecimento no escopo contratado (bounded JSON), seguida da prova indicada lá.

## 7. Histórico (versão 1, SUPERADA)

As afirmações abaixo, da versão 1, estão **superadas** por esta versão 2:
- "FONTES FALTANTES (FALTA-F) `incoming-webhooks.ts`, `dispatch.ts`, workers" → recebidas e lidas (§0, §2).
- "auth antes do replay / escopo por alvo / `??0` / marcador `opened` / roteamento de ingestão: sem conclusão" → concluídos em §2.
- "W7: o relato diz que o `ready` vem antes da abertura" → confirmado pela fonte (`worker:33-35`).
- Versão 2 inicial: "bounded JSON: conforme se 'existente' = padrão legado" → superada por DIV-1. Citações `worker:277-284` (offset de concatenação) → corrigidas para `worker:29-35`.
- "Delta D/E: registrar limites para decisão de escopo" → substituído pela lista de pendências contratuais P1–P14. Nenhuma cláusula aplicável foi renunciada.
- "Proveniência c35 como limite" → agora P14, pendência contratual.
- O índice homônimo já tinha sido rebaixado no adendo e segue fora do delta.

Fora do recorte: WHE-02, WHE-04 a WHE-06 e FLX-07 continuam NT. Este documento não homologa, não aprova e não autoriza o próximo pacote.
