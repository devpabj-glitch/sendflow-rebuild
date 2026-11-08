# Auditoria independente documental — AUT04-BULK-STATE R88

Registro: 07/11/2026 21:54:31 America/Sao_Paulo (UTC−3), lido do `date` do sistema. Revisão final: 07/11/2026 21:56:34 America/Sao_Paulo (UTC−3), também pelo `date`.

Natureza: auditoria documental. Só li, calculei hashes, fiz textdiff e inspecionei o ZIP. Não executei projeto, fontes, testes, build, Git, DB, rede ou provider.

Escopo: escrevi somente este arquivo. Não há aceite global, de UI, de produção ou de Git, e este relatório não libera a próxima fatia. A decisão é do coordenador.

## 1. Revisão, integridade e autoridades

**Revisão (relato do escritor, dump 9333):**
- HEAD `8987395f29807cac5af59bb66587ce5b3945385f`.
- Pai `f096ddc0b6c96137aca2a65ecca106a8fe063d7b`.
- 7 arquivos, 662+/2−.
- CommitDate 08/11 00:49:08 UTC, que equivale a 07/11/2026 21:49:08 UTC−3.
- Isso é relato público do Git do escritor. Não é Git próprio.

**Pacote (fato):**
- `/workspace/grupos-evidencias-aut04-r88/PACOTE-ORIGINAL-R88.zip` tem SHA `a153e00f1a9b018e5d9cd7ed92249bbc261769ec222a728131b63b7424e3d78a`, igual ao informado.
- O ZIP tem 19 entradas. Cada uma confere byte a byte (sha de `unzip -p`) com a cópia solta: 0 divergências.
- O `sha256sum -c` dos 18 hashes do MANIFEST deu 0 falhas.

**Autoridades (fato):** as cópias no pacote são idênticas (`cmp`) aos originais.
- `grupos-execucao-backend/SELECAO-INDEPENDENTE-POS-R86.md`: 134 linhas, `94e567f2…`.
- `grupos-referencia-visual/PARECER-AUT04-BULK-STATUS-POS-R86.md`: 39 linhas, `3b22d9a1…`. Li os dois integralmente: contrato §5 (S69–91) e G0/B1–B7 (S93–106).

**RECEBIMENTO:** `grupos-execucao-backend/RECEBIMENTO-AUT04-BULK-STATE.md` (`dd1f6e03…`). Na L7 ele registra que o coordenador *relata*, às 21h41, uma ordem do usuário e um aceite técnico. **Isso é relato do coordenador, não aprovação verificada.** Não atribuo essa ordem ao usuário como fato.

**Arquivos auditados** (pacote, contagem de linhas pelo `wc`; "T" = arquivo de teste):

| Arquivo | Linhas | Hash |
|---|---|---|
| `automation-bulk-state.test.ts` (T) | 518, 3 testes | `17ae796c…` |
| `jobs.ts` | 1170 | `a454f6e7…` |
| `dispatch.ts` | 1003 | `7afb36a3…` |
| `route.ts` | 7 | `a9995aeb…` |
| `automation-bulk-worker.ts` | 32 | `67f8b005…` |
| `diff.txt` | 733 | `0dd0e3f9…` |
| `gates.txt` | 992 | `5da8d16b…` |
| `gates-falha.txt` | 881 | `9f30e897…` |
| `foco.txt` | 33 | `cb74a1b6…` |
| `foco-antes-const.txt` | 33 | `bd7ec96e…` |
| `g0-antes-diff.txt` | 5 | `452866b7…` |

## 2. Rastro: último diff → foco → gates → commit → CMP (dump confirmado nas linhas visíveis, sem campos de pensamento)

Sequência da rodada:
1. Base em 9174 (21:42:18 UTC−3).
2. G0 em 9268.
3. Diffs de 9271 a 9304.
4. Foco antes do const em 9307: 3/3 verdes.
5. Gates com falha em 9313 (`gates-falha.txt`):
   - LINT1: prefer-const em T L120 (gates-falha L8–11);
   - HTTP smoke FAIL L842, porque `npm run build` herda o lint (L843–848);
   - 1 falho e 52 aprovados, 200/201 (L855–856);
   - VITEST1 (L860) e BUILD1.
6. **Último diff em 9321** (conferido no dump): só `let db` → `const db` em T L120. Não toca helper, handler nem runtime.
7. Gates verdes em 9327 (`gates.txt`): TSC:0 L1, LINT:0 L6, 53 arquivos / 201 testes L901–902, VITEST:0 L906, mtime L907, BUILD:0 L992. O "Start at 00:47:57" é UTC e equivale a 21:47:57 UTC−3.
8. Foco final em 9330 (`foco.txt` L6/20/27/29–30): 3/3.
9. Commit e push em 9333.
10. 7 CMP_OK e ZIP em 9341.
11. Nenhum diff entre 9321 e 9343.

A falha intermediária fica preservada. O smoke HTTP falhou por causa do build, e não só do lint isolado. Ele ficou verde sem mudança de runtime, o que é coerente com a correção de lint.

Limites: o stdout direto dos gates está vazio (o log está no arquivo), não há hash de árvore por gate e não houve rerun pós-commit.

**Inventário nominal (fato, diff próprio):**
- Comparei `/tmp/r86.txt` (52 entradas) com os `✓ src/...` de `gates.txt` (53 entradas).
- Os 52 nomes e contagens anteriores são idênticos.
- O único acréscimo é `automation-bulk-state.test.ts` (3). Resultado: 198 → 201 testes e 52 → 53 arquivos, sem nada removido ou alterado.

## 3. Confronto cláusula × assert

Classes usadas: **Suficiente**, **Falta de prova (FP)** ou **Bug demonstrável**. Falta de prova não é bug.

| Item | Cláusula (SELECAO) | Asserts reais | Classe |
|---|---|---|---|
| G0 | S97 | `g0-antes-diff.txt` L1–5: HEAD R86, STATUS 0, pauseAutomation em jobs L508, rota da coleção e BULK_ROUTE vazio. O toggle individual (jobs L508–526) recusa completed e não chama nextRunUtc. | Suficiente (é captura de fonte e catálogo, não teste de ausência) |
| B1 deactivate | S98 | T L228–242: dedup e ordem (L231). DTO alterado: `toMatchObject({...ativaRest,status:"paused"})` (L234), com oráculo independente `ativa` de createAutomation e todos os campos exceto updatedAt, que só é verificado como ≠ (L235). No-op: `toEqual(pausada)` (L236). Evento exato (L237–240). Campanhas distintas (L126–141). | Suficiente. Nota: toMatchObject não detecta chave extra. |
| B1 activate / repetição | S98 "activate→todas active, DTOs inteiros… evento exato por mudança real… repetir com chave nova: snapshot linhas/eventos íntegros… releitura coincide, não só 200/count" | T L246–252: só `status`, `nextRunAt`, `name[0]` e `campaignId[1]`. **Não há DTO integral.** Não há assert dos 2 `automation.updated` esperados (ativa e pausada → active). Repetição: L256 compara a resposta com a resposta anterior (não é oráculo independente) e L257 só confere a contagem de eventos. Não há snapshot de `automations` nem de `domain_events` antes e depois. | **FP (Δ1)** |
| B2 | S99, S77 "400 validation/field… conferir response error fields" | Completed misturado: 400 com code e message (L267–269); completed com status e updated_at intactos e o outro ID ainda active (L270–274). Inexistente e foreign: 404 (L275–278) e válidos inalterados (L279–281). Seis inválidos: 400 code validation (L282–293). 401, 403 header e 403 Origin (L294–302). Sem key: 400 (L303–305). **Nenhum `error.fields` é assertado** (L292, L305), embora o helper gere `fields.action` e `fields.ids` (jobs L581/584/587) e dispatch o exponha (L281). No 404 só o status é checado (sem `code:not_found`). | **FP (Δ2)**, restrito a fields. Os status estão suficientes. |
| B3 | S100: "SELECT* de automations antes/depois… no-op/não selecionados/outra org íntegros… idempotency_keys só recibo novo e controles mantidos… Controles populados/IDs assertados, não count/mtime" | Dez tabelas por SELECT* `toEqual(baselineRest)` (L241, L306), sem baixa de jobs (L242). **Automations:** não há comparação SELECT* integral. Só há projeções status/next_run_at (L258–265) e status/updated_at de concluida (L270–273). **idempotency_keys:** `baselineKeys` (L212) tem só `length>0` (L216); não há assert de "só recibo novo" nem de controle mantido no teste 1. **Controles:** a população é verificada só por contagem em groups, jobs, attempts, versions e blocks (L217–221). Campaigns, reservations, routing, drafts e assignments não têm assert de população (os INSERTs L179–204 são preparação, não prova). Os IDs são assertados só em automations (L222–226). | **FP (Δ3)** |
| B4 | S101 | Fault `after_first_change` (jobs L535–540, inativo em produção L536) dispara depois do 1º UPDATE e evento e antes do 2º alvo e do recibo (jobs L604–614). Sob BEGIN IMMEDIATE/SAVEPOINT (L542–572): 500 e automations, events e keys integrais (T L343–348). Retry com a mesma key funciona uma vez (L350–352). Replay depois de `later`: texto idêntico (L353–357) e estado não reaplicado (L358–361). Corpo divergente: 400 (L362–364). | Suficiente. É throw JS, não SIGKILL. |
| B5 | S102 | Ativação de vencida preserva next_run_at e não cria job (T L413–419). O tick materializa a ocorrência herdada (L420–424). Pausa não apaga o job prévio e o tick não materializa a pausada (L425–429). Completed não é revivido e o lote fica integral (L431–448). Barreira: worker abre DB (W L16) → ready (L18) → espera go (L20–23) → started (L24) imediatamente antes de applyAutomationBulk (L25). Holder com BEGIN IMMEDIATE (T L494) e 250 ms depois: sem done e status ainda active (L501–503). Commit, depois paused, next_run_at igual e 0 jobs (L504–513). O POST não cria fila (jobs em L241/L306). | Suficiente, limitado. O holder é um lock genérico, não o runner. Serialização é demonstrada pelo lock, não por TCP. |
| B6 | S103 | Mesmo arquivo fechado e reaberto sem seed (T L367–368). SELECT* de automations e keys iguais (L369–370). Replay com texto original (L371–372), keys sem recibo novo (L373) e next_run_at/status (L374–377). | Suficiente |
| B7 | S104 | Foco nominal novo (foco.txt), inventário 52 + 1 (§2), suíte completa, TSC, lint e build depois do último diff (9321 → 9327 → 9330). README asserido (T L115–117). | Suficiente, com os limites de §2 |

**DIVERGÊNCIA CONTRATUAL DE FONTE — S75 (categoria separada; não é bug comportamental e não é delta de assert).** S75, S79 e S89 são obrigações coexistentes: S79 e S89 não dispensam S75. Fato de fonte: `applyAutomationBulk` (jobs L574) **não chama** o alternador individual `pauseAutomation` (jobs L508–526). Em vez disso, reimplementa a mesma lógica (L604–614):
- mesmas colunas status/updated_at;
- mesmo evento `automation.updated {automationId,status}`;
- mesma mensagem de completed (L602 contra L514);
- guarda `AND status = ?`;
- só atua quando o estado difere do alvo.

Pela leitura estática não há diferença comportamental demonstrável, portanto **não é bug**. Ainda assim, a exigência literal de S75 ("só chamar alternador individual quando o estado difere") **não está satisfeita na fonte**, e a QA não a declara satisfeita por equivalência a S79/S89. Cabe ao coordenador decidir como resolver a compatibilidade ou adequação. A QA não propõe refatoração global nem mudança de produto fora do alinhamento contratado.

## 4. Fatos × relatos e limites

São **relatos**: revisão, commit e push; a ordem do usuário atribuída pelo coordenador às 21h41; e o PARECER (pré-mudança). `withIdempotency` está fora do pacote e não foi lido. Em compensação, a recusa sem key é lançada na própria `idempotent()` de dispatch.ts (L429–434), que está no pacote: `ApiError(400, "validation", …, { "idempotency-key": … })`, serializado com `fields` (L269).

Limites:
- O dispatcher foi chamado localmente, não por TCP.
- O mtime do DB demo não prova o DB inteiro.
- O fault é throw, não crash.
- Não há prova de produção, UI, provider ou gatilho AUT03/QI/Q3/Q4.
- AUT04 em massa está fora de GRU (PARECER L34).

## 5. Conclusão

A fatia **ainda não é documentalmente suficiente**. Faltam provas finitas (FP). **Nenhum bug foi demonstrado.** G0, B4, B5, B6 e B7 e o deactivate de B1 estão suficientes e não devem ser reabertos. À parte dos deltas de prova, há **uma divergência contratual de fonte (S75)**, registrada no §3 e na lista abaixo.

**Delta material finito**, com a menor prova para cada ponto:

- **Δ1. B1 (S98), T L244–257.**
  - (a) Depois de `on`, `toEqual` com estrutura exata (sem chave extra) para os dois itens, usando oráculo independente e cobrindo todos os campos: `{ ...ativaRest, status: "active", updatedAt: expect.any(String) }` e `{ ...pausadaRest, status: "active", updatedAt: expect.any(String) }`, onde `pausadaRest` é `pausada` sem updatedAt/status. O updatedAt adequado é o valor relido: igual a `updated_at` do SELECT da linha. Pela S100, não é exigido timestamp distinto. Nenhum campo é dispensado.
  - (b) Lista exata dos eventos novos: `[{automation.updated, ativa, active}, {automation.updated, pausada, active}]`.
  - (c) Antes de `again`, capturar `automations(db)` e `events(db)` e, depois, verificar `toEqual` dos dois. Isso cobre a releitura e a ausência de toggle acidental.
- **Δ2. B2 (S99/S77), T L282–305.** Assert de `error.fields` em cada 400 de input, com as chaves que estão nas fontes do pacote. Em jobs: `action` para toggle e para ação ausente (L581); `ids` para vazio e 101 (L584); `ids` para "" e 1 (L587). Em dispatch, para ausência da key: `idempotency-key` (L431–433). Nenhum literal foi inventado e nenhum campo fora do contrato é exigido.
- **Δ3. B3 (S100), T L210–241/306.**
  - (a) `expect(automations(db))` comparado com `baselineRows` em que só status/updated_at das linhas realmente alteradas mudam e todas as demais (no-op, fora, estrangeira, concluida, vencida) ficam integrais.
  - (b) `keys(db)` igual a `baselineKeys` mais exatamente os recibos novos (scope `api.automation.bulk` e as keys esperadas), mantendo `idem-aut04-controle`.
  - (c) Assert de população com ID em cada tabela preservada: campaigns left/right/foreign, `rsv_aut04`, `rte_aut04`, draft de left, `ver_aut04`, `blk_aut04`, assignment vis, groups e jobs com `job.id`, e attempts.

Nenhum assert contratado pode ser dispensado.

**Separado dos deltas: DIVERGÊNCIA CONTRATUAL DE FONTE S75.** O helper não chama o alternador individual (jobs L574/L604–614 contra L508–526). Não é bug comportamental nem delta de assert, e a QA não declara satisfeita a exigência literal. O coordenador decide resolver a compatibilidade ou adequação, sem refatoração global.
