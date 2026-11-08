# Auditoria documental independente — GRU01-EXPORT-LOCAL v1 (G0–G6), entrega R81

**Registro:** 07/11/2026 16:16:56 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL. Não foi executado código do projeto, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`/`wc`, listagem e leitura de bytes do ZIP via `unzip -lv`/`unzip -p` (sem extrair nem executar), `diff`/`grep` textual e um parser Python do dump que descarta thinking/reasoning/analysis.

## 0. Revisão, integridade e autoridades

- **Revisão RELATADA:** `8525e71bde628f97685a9428c477eaa2a4686dda`, pai `82d130e903548a311964b5312860c5e6d51f3e1a` (MANIFEST L1–2; dump L8632 `[main 8525e71]`). **Git não certificado de forma independente.** Os 6 CMP são relato (MANIFEST L3–8; dump L8638).
- **ZIP `PACOTE-ORIGINAL-R81.zip`:** 50051 B, SHA256 `e195fcfcb7ece546bc8a72dc1bfd59ca030fe73aef541cafc4fc420ad2eb1ef9`, **aferido localmente e igual ao esperado** (ENCAMINHAMENTO L8; dump L8638).
  - `unzip -lv` lista 11 entradas (214443 B).
  - O SHA256 do conteúdo de cada entrada (`unzip -p`) é **igual** ao das 11 cópias soltas.
  - Os **10 hashes internos** do MANIFEST (L10–19) conferem com as cópias.
- **Autoridades, lidas integralmente, SHA256 igual ao do ENCAMINHAMENTO L12–13:**
  - Contrato `/workspace/grupos-execucao-backend/PACOTE-PROXIMA-FATIA-POS-R80.md`, 124 linhas, `0819796dbf8827e165edbca7be93400663fa1de21a3fc48a9827494dad7dc6f6` ("C Lnn"), **incluindo o §8 L116–124**.
  - Parecer `/workspace/grupos-referencia-visual/PARECER-GRU01-EXPORT-LOCAL-V1.md`, 32 linhas, `dd016fd02b04d34d7ab66e4b232ba3070dd3a2800bb06ee2aa638b1698465c3f` ("PA Lnn"), **incluindo o §5 L30–32**.

| Arquivo (cópia = entrada do ZIP) | Bytes | Linhas | SHA256 (início) | Papel |
|---|---|---|---|---|
| group-export.ts | 892 | 27 | c45680e6… | serializador novo |
| route.ts | 326 | 9 | 148b9d6c… | wrapper novo |
| dispatch.ts | 39760 | 982 | d21d7c02… | handler |
| group-export.test.ts | 13682 | 324 | 1f444cb2… | asserts G1–G5 |
| README.md | 32800 | 224 | e085fba3… | doc (L149) |
| aderencia-prompt-mestre-v1.md | 40988 | 215 | 7c687094… | matriz (L40) |
| gates.txt | 81991 | 959 | 8db0819d… | log |
| g0-antes-diff.txt | 350 | 5 | ae721476… | transcrição G0 |
| foco.txt | 256 | 7 | 8f38dd3b… | transcrição do foco |
| MAPA.txt | 2343 | 20 | a3a74a6f… | síntese do escritor |
| MANIFEST-SHA256.txt | 1055 | 19 | 8caa2eda… | manifesto |

- **Preparação, fora do ZIP:** ENCAMINHAMENTO (`2c90fb69…`), CRONOLOGIA (`a4e6cdf6…`), INVENTARIO (`ff57bba5…`) e PUBLICO-R81-FILTRADO.jsonl (`f1e3da70…`, não usado; fiz parse próprio). Os hashes conferem com o ENCAMINHAMENTO L33–47.
- **Diff textual contra as cópias R80** (`/workspace/grupos-evidencias-aut04-r80/`):
  - `dispatch.ts`: só o import L56 e o novo handler L588–599. O GET JSON (L580–586) ficou intacto.
  - README: só o acréscimo em L149.
  - Matriz: só a linha L40.

## 1. Fonte do recorte (C L44–76)

- **`group-export.ts`:**
  - Cabeçalho fixo com as 6 colunas (L3).
  - Literalização (L5–11): apóstrofo se o 1º caractere é TAB/CR/LF, ou se o 1º após `trimStart` é `= + - @`. Está conforme C L68.
  - Aspas em todos os campos, com aspas internas duplicadas (L13–15). CRLF em cada registro, inclusive o último, e sem BOM (L17–27).
  - Não serializa `invite_url` nem a descrição (C L70).
- **`dispatch.ts`:**
  - `authorize` (L488) roda antes do handler.
  - L588–599: `getCampaign` por org e id dá 404 **antes** de validar o status (C L58). O status passa pelo `singlePersistedGroupStatus` existente (L593); o listador `listGroups` é reutilizado (L599).
  - Headers exatos (L594–598) e 200. Erros saem em JSON pelo adaptador atual.
- **`route.ts`:** L5–8 `GET` encaminha `{resource:"groups-export", params:{campaignId:id}}` ao `dispatchApi`, sem lógica própria.
- **Sem DDL nem escrita no caminho** (C L74).
- **Bug demonstrável em fonte:** nenhum.

## 2. G0–G6

Referências: teste "T Lnn".

| Item | Exigido (C L84–90, L92; PA L24) | Evidência | Classe |
|---|---|---|---|
| **G0** | Base R80, ausência da rota/handler antes do diff, distinguindo dispatcher de rota | Base `82d130e9` com status vazio (dump L8526, 16:08:57). `g0-antes-diff.txt` L1–5: `EXPORT_ROUTE absent`, GET groups 200 JSON, resource `groups-export` → 404 "Rota não encontrada", rotas sem `groups/export`. É transcrição manual (dump L8587), corroborada pelo dump L8583 (16:10:28), antes do 1º diff L8589 | **SUFICIENTE** (limite: transcrição) |
| **G1** | 200 com headers exatos; CSV interpretado; 6 colunas/ordem/valores, quantidade e ordem position; sem controle/estrangeira; comparar com a coleção | Headers exatos e sem BOM (T L222–228). Parser independente que recusa BOM, caractere fora de aspas e registro sem CRLF (T L34–81). Cabeçalho literal (T L236). IDs na ordem position (T L237) e valores (T L238–252). Igualdade com os IDs da coleção JSON (T L260). Sem `grp_controle`/`grp_sul` nem "Segredo Sul" (T L232–234). Os `.includes` são só complementares (C L92) | **SUFICIENTE** |
| **G2** | Cada um dos 5 status; campanha vazia e filtro sem resultado: 200 só com cabeçalho; GET JSON inalterado | 5 status, cada um com o subconjunto exato na ordem (T L263–268). Campanha vazia → 200 `HEADER` literal (T L269–271). Filtro válido sem resultado na campanha controle (T L274–276). JSON 200 `application/json`, ordem e `inviteUrl` (T L256–261), handler JSON inalterado por diff de fonte (§0) | **SUFICIENTE** |
| **G3** | Unicode, vírgula, aspas e quebra fazem roundtrip; registros/colunas sem inflar; regra finita de fórmula; nome comum igual; DB conserva o original | Casos (T L184–198) e valores esperados com apóstrofo só nos de risco (T L244–251). "comum" e os demais intactos (T L239–243). O parser falharia se houvesse campo extra; contagem exata de 13 IDs (T L237). DB conserva `=soma` e `\tinicio` (T L253–254) | **SUFICIENTE** |
| **G4** | 401, 403, 404 (estrangeira e inexistente), 400 (vazio/duplicado/fora do enum) em JSON; nome de campanha malicioso fora do filename | 6 inválidos → 400 JSON `validation` com `fields.status` e snapshot igual (T L278–286). 401 (T L287–289), 403 (T L290–292), 404 ×2 `not_found` sem conteúdo da Sul (T L293–298). Nome malicioso (T L183) ausente do corpo (T L229) e filename fixo (T L225) | **SUFICIENTE** |
| **G5** | `SELECT *` das 6 tabelas antes/depois; controles não vazios e registrados; reabrir o mesmo arquivo e repetir: mesmo corpo; `invite_url` existe e não aparece | `six()` com as 6 tabelas exatas (T L23–32). Populados pela fixture: grupos alvo, controle e Sul (T L199–203), reserva (T L204–208), job (T L209–214), idempotency_key (T L215–218). Baseline depois do seed/login (T L219–220), igual depois de tudo (T L299). Repetição idêntica (T L301–302). Reabertura com snapshot e corpo idênticos (T L303–309). Convite gravado (T L200, L202–203), presente no JSON (T L261) e ausente do CSV (T L230–231) | **SUFICIENTE** (registro C L89 suprido no §2.1) |
| **G6** | Wrapper; foco; catálogo com a rota nova; regressão nominal; TSC/lint/suíte/build depois do último diff | `route.ts` L5–8. Foco: `foco.txt` L2–7 (transcrição) corroborada pelo dump L8623 (1/1, exit 0). `gates.txt`: TSC:0 L1; LINT:0 L6; rota L260 e L918; teste novo L820; 49 arquivos L869; 195 testes L870; VITEST:0 L874; mtime L875; BUILD:0 L959. **Inventário próprio:** a comparação textual das entradas `✓ …test.ts (N)` do log R80 com o R81 dá as 48 anteriores idênticas e só `group-export.test.ts (1 test)` acrescentado, conforme INVENTARIO L3 | **SUFICIENTE** |

### 2.1 Registro G5 (C L89): conteúdo das 6 tabelas no baseline (T L220)

Fontes: teste R81 \`group-export.test.ts\` ("T"). Helpers: \`/workspace/grupos-evidencias-r77/data.ts\` (\`4abcdc27…\`, cópia de rodada anterior, igual à de R75) e \`/workspace/grupos-evidencias-aut04-r80/jobs.ts\` (\`1f04a097…\`). **Nenhum desses dois helpers está no pacote R81.** O commit relatado altera só 6 arquivos (MAPA L4), nenhum deles \`data.ts\` ou \`jobs.ts\`, mas não certifiquei que essas cópias são as da revisão \`8525e71b\`.

Legenda:
- **PROVADO-asserção:** conteúdo afirmado por \`expect\`.
- **FONTE-fixture:** INSERT executado incondicionalmente no próprio teste antes do baseline. O conteúdo vem do fato relatado de o teste passar (foco 1/1, suíte 195), sem \`expect\` de presença.
- **INFERIDO-helper:** efeito de helper lido em cópia fora do pacote.

| Tabela | Estado no baseline | Conteúdo (não só contagem) | Base | Classe |
|---|---|---|---|---|
| groups | populada | 13 do alvo (T L184–201; \`grp_virgula\` com convite), \`grp_controle\` da Controle (T L202) e \`grp_sul\` da Sul (T L203), todos com \`STAMP\` | T L93–98, L199–203 | **PROVADO-asserção** para os 13 do alvo e o convite (T L237–261: ids, valores e \`inviteUrl\` via JSON). Controle e Sul: **FONTE-fixture** (aparecem só nos asserts de ausência no CSV, T L232–234) |
| campaigns | populada | Alvo/active (renomeada para nome malicioso, T L183), Controle/active, Vazia/draft (org Norte) e Estrangeira/active (org Sul) | T L151–183 | **PROVADO-asserção** indireto: respostas 200 ou cabeçalho em Alvo/Vazia/Controle (T L223, L270, L275) e 404 na Estrangeira por escopo (T L295). As linhas existem; os valores das colunas não são afirmados |
| reservations | populada | \`rsv_export\` (Norte, Alvo, \`grp_virgula\`, active, expira em 2026-12-01) | T L204–208 | **FONTE-fixture** |
| scheduled_jobs | populada | 1 job \`capacity.review\` da Alvo, runAt 2026-07-01 UTC, sem chave | T L209–214; \`jobs.ts\` L287 INSERT incondicional para chamada sem chave (guardas L266–274 não disparam: kind válido, campanha existente, data válida) | **FONTE-fixture**, mediada por helper (**INFERIDO-helper** quanto às colunas) |
| idempotency_keys | populada | \`(Norte, 'api.fixture', 'idem-export-controle', 'hash', '{}')\` | T L215–218 | **FONTE-fixture** |
| domain_events | populada | Por \`recordEvent\` (\`data.ts\` L75–85, INSERT incondicional):<br>• \`organization.created\` ×2 (createOrganization L137; T L147–148)<br>• \`campaign.created\` ×4 (createCampaign L589, depois de passar as guardas de política e status; T L151–182)<br>• \`job.enqueued\` ×1 (\`jobs.ts\` L306; T L209)<br>Mínimo inferido: 7 eventos. Possíveis eventos de \`createOperator\` e do login não verificados (\`identity\` fora do pacote) | **INFERIDO-helper**, sem asserção nem fonte no pacote |

- **Tabelas vazias entre as 6:** nenhuma, pela fonte acima.
- **O que o snapshot prova:** \`six(db)\` antes e depois (T L220, L285, L299, L305, L309) prova **igualdade** do conteúdo integral em cada tabela. **Não prova** que alguma tabela é não vazia, porque não há \`expect\` de tamanho ou conteúdo sobre \`baseline\`.
- **Conclusão do registro:**
  - C L89 pede "registrar", não provar por asserção nem "promover count".
  - O registro fica feito aqui. groups, campaigns, reservations, scheduled_jobs e idempotency_keys estão populados por fonte do próprio teste.
  - domain_events está populado por **inferência** de helper em cópia de rodada anterior, não provada na revisão R81.
  - Isso basta como registro documental. Não vira asserção, e não crio teste obrigatório.

- **Reconciliação histórica (C §8 L116–124; PA §5 L30–32):**
  - A matriz L40 agora cita a orientação anterior «Não criar exportação/provedor», declara que ela "não era fala nem DEC de Loigo", atribui a substituição ao coordenador e restringe aos 6 campos. Diz ainda: "o texto antigo não passa a significar este CSV".
  - README L149 repete a mesma ressalva.
  - Não há promoção a autorização do usuário nem reescrita do sentido antigo, e a versão R80 da linha permanece no histórico.
  - **Conforme.** O escopo excluído (links, leads, convites, provedor, métricas) continua fora (L40).

## 3. Rastreabilidade

Dump `bc-68876892-…jsonl`, 8640 linhas, recorte L8522–8640. O meu parse coincide com a CRONOLOGIA L7–21.

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8526 | 16:08:57 | HEAD `82d130e9`, status vazio |
| 8583 | 16:10:28 | G0 |
| 8589–8614 | 16:10:37–16:10:58 | Diffs: serializador, rota, ajuste do serializador, dispatch ×2, matriz, README |
| **8617** | **16:11:27** | **Último diff** (teste) |
| 8623 | 16:11:52 | Foco 1/1, exit 0 |
| 8626 / 8629 | 16:12:00 / 16:12:58 | Gates (stdout vazio) e grep do log: TSC 0, 195, VITEST 0, rota, BUILD 0 |
| 8632 | 16:13:03 | Commit `8525e71`, 6 arquivos 376+/2− (MAPA L4), pai `82d130e9` |
| 8635 | 16:13:10 | Só grep |
| 8638 | 16:13:22 | 6 `CMP_OK` e o ZIP `e195fc…` (aferido) |

- **Conclusão:** último diff → foco → gates verdes → commit → CMP é suficiente como relato observável, sem diff visível depois de L8617.
- **Limites, não exigidos pelo contrato (C L90, L101):**
  - Sem hash de árvore por gate nem rerun pós-commit.
  - A ligação do log passa por grep/cópia.
  - G0 e foco são transcrições corroboradas.
  - O catálogo prova o build, não uma requisição TCP; o dispatcher não é HTTP real.
  - O mtime não prova a integridade global do banco.

## 4. Classificação, delta e observações

- **Bug demonstrável:** nenhum. **Prova contratual faltante:** nenhuma. **Delta material: vazio.**
- **Observações não bloqueantes, sem critério novo:**
  - **O1 (G5, C L89): SANADA pelo registro QA do §2.1.** O MAPA L11 não fazia o registro. O §2.1 o supre documentalmente, distinguindo provado de inferido. Não é dispensa nem teste novo.
  - **O2:** a matriz L211 ("Fora: … exportar …") pertence ao pacote histórico GRU-05 (L205–213). Não contradiz a L40.
  - **O3:** o parser de teste é próprio (T L34–81), aceitável por C L92 ("decodificador de teste independente e pequeno").
- **Recomendação:** o coordenador pode registrar "PROVADO LIMITADO — exportação CSV autenticada de metadados locais de grupos" (C L102) na revisão relatada `8525e71b…`.

## 5. Conclusão

**SUFICIÊNCIA DOCUMENTAL de G0–G6 do recorte GRU01-EXPORT-LOCAL v1**, revisão relatada `8525e71bde628f97685a9428c477eaa2a4686dda`:
- sem bug, sem prova faltante, sem delta material;
- ZIP e conteúdo aferidos;
- Git/CMP relatados; sem execução independente;
- registro C L89 das 6 tabelas feito no §2.1 (O1 sanada; domain_events inferido, não provado);
- limites do §3 e observações O2–O3 registrados.

Este parecer **não homologa GRP-GRU-01 inteiro, GRU-08, exportação de leads/convites/provedor, UI nem produção**, e **não libera a próxima fatia**: a decisão é do coordenador.
