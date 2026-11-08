# Auditoria independente documental — AUT04 R89 (somente correção Δ1–Δ3 e S75)

Registro: 07/11/2026 22:05:36 America/Sao_Paulo (UTC−3), pelo `date` do sistema.

Natureza: auditoria documental. Só li, calculei hashes, fiz textdiff e `patch` aplicado a cópias de texto em /tmp, e inspecionei o ZIP. Não executei projeto, código, testes, build, DB, Git, rede nem provider. Do dump li apenas campos públicos (role, tool_name, tool_args, tool_result), sem thinking/reasoning/analysis.

Escopo: escrevi somente este arquivo. Fecho apenas Δ1–Δ3 e a divergência S75 do relatório final R88. G0, B1 deactivate e B4–B7 **não foram reabertos**. Não há aceite global, de UI, de produção ou de Git, e este relatório não libera a próxima fatia.

## 1. Integridade, revisão e autoridades

**Pacote:**
- `/workspace/grupos-evidencias-aut04-r89/PACOTE-ORIGINAL-R89.zip` tem SHA `7ac8c17fa009afb24c40f2eda511cb7a0698b50cd7accb89f2c713448df05e3e`, igual ao informado (fato).
- O ZIP tem 10 entradas. Todas são idênticas byte a byte às cópias soltas (sha de `unzip -p`): 0 divergências.
- `sha256sum -c` dos 9 hashes do MANIFEST: 9 OK.

**Cópias soltas** (linhas pelo `wc`):

| Arquivo | Linhas | Hash |
|---|---|---|
| `automation-bulk-state.test.ts` (T) | 594 | `2e56d753…` |
| `jobs.ts` (J) | 1162 | `d997f955…` |
| `diff.txt` | 193 | `e5771f7a…` |
| `foco.txt` | 33 | `151fd040…` |
| `gates.txt` | 994 | `de47b2b3…` |
| `inventario-antes.txt` e `inventario-depois.txt` | 53 | ambos `c5c35050…` |
| `MAPA.txt` | 15 | `deab80ae…` |

Documentos de preparação lidos integralmente:

| Arquivo | Linhas |
|---|---|
| ENCAMINHAMENTO-QA.md | 70 |
| CRONOLOGIA-PUBLICA-R89.md | 35 |
| INVENTARIO-R88-R89.md | 59 |

**Textdiff próprio (fato).** Apliquei `diff.txt` às cópias R88 de jobs.ts (`a454f6e7…`) e do teste (`17ae796c…`) e o resultado é idêntico byte a byte (`cmp`) às cópias R89. O diff toca só 2 arquivos.
- jobs.ts: −11/+1 nas linhas R88 L601–612. É uma mudança estreita, sem refatoração global.
- `pauseAutomation` (J L508–526) não foi alterado.

**Revisão (relato do escritor).** Dump 9397: `c244ad180c43c4b2325f990e111754211ed8fdb0`, pai `8987395f29807cac5af59bb66587ce5b3945385f`, 2 arquivos 98+/30−, commit às 22:00:56 UTC−3.
- O cabeçalho do MANIFEST com revision/parent/cmp é relato, não hash.
- O CMP da 9403 compara `git show` com `git show` da mesma revisão. É coerência da exportação, não comparação com a árvore de trabalho. Não é Git próprio.

**Autoridades:**
- O R88 final na cópia do ZIP é idêntico (`cmp`) a `/workspace/grupos-qualidade/AUDITORIA-INDEPENDENTE-AUT04-R88.md`, `0dc56c98…`.
- SELECAO (`94e567f2…`, S75/S79/S89/S98–S100) e PARECER (`3b22d9a1…`) foram lidos integralmente no R88. As dependências R88 (dispatch, route, worker, README, G0, logs) estão em `/workspace/grupos-evidencias-aut04-r88` com os hashes listados no ENCAMINHAMENTO L46–58.
- A "decisão do coordenador/solicitante" de manter o reuso literal de S75 é **relato de coordenação**. Não a certifico como aprovação do usuário.

## 2. Rastro e gates (dump confirmado)

Sequência da rodada:
1. Base em 9350 (HEAD 8987395f, 21:57:38 UTC−3).
2. Último diff em 9385 (`search_replace`, único diffString no intervalo 9384–9405). **Não há diff em 9386–9405.**
3. Foco em 9388 (`foco.txt` L6/20/27/29–30): 3/3, 184/117/635 ms.
   - O stderr em L7–19 é o `Error: falha injetada depois da primeira alteração` de J L539, acionado em J L606 dentro de `runAutomationBulkTransaction` (L554).
   - É o caminho 500 esperado do ensaio B4, e o teste está ✓ (L20). **Não é falha.**
4. Gates em 9391/9394 (`gates.txt`):
   - TSC:0 L3, LINT:0 L8;
   - 53 arquivos L903, 201 testes L904, VITEST:0 L908;
   - mtime L909, BUILD:0 L994;
   - nenhuma ocorrência de "FAIL".
   - O "Start at 01:00:01" é UTC: 01:00:01 UTC de 08/11 equivale a 22:00:01 UTC−3 de 07/11, antes do commit das 22:00:56.
5. Commit e push em 9397.
6. CMP e ZIP em 9403.

**Inventário (fato, diff próprio).** Os `✓ src/...` de gates R89 são idênticos aos de gates R88: 53 nomes e as mesmas contagens, 201 testes. `inventario-antes` = `inventario-depois` = `inventario-depois` R88.

Limites: não há hash de árvore por gate, não houve rerun pós-commit e o stdout direto dos gates está vazio (o log está no arquivo).

## 3. Cláusula → assert (só os itens reabertos pelo R88)

| Item R88 | Exigência | Asserts R89 (T) e oráculo | Classe |
|---|---|---|---|
| Δ1(a) DTO activate | S98, R88 L116: `toEqual` exato, todos os campos, updatedAt relido, sem exigir timestamp distinto | L284–292: `toEqual([{...ativaRest,status:"active",updatedAt:ativaRead.updated_at},{...pausadaRest,…pausadaRead.updated_at}])`. `ativaRest` e `pausadaRest` vêm das fixtures createAutomation/pauseAutomation (L258, L286): oráculo independente, sem chave extra, com updatedAt do SELECT. | Suficiente |
| Δ1(b) eventos | lista exata de 2 | L293–297: `toEqual` dos 2 `automation.updated` active, em ordem. `events()` passou a usar `ORDER BY rowid` (L53–55), mudança explícita que mantém SELECT *. | Suficiente |
| Δ1(c) repetição com chave nova | snapshot de linhas e eventos | L298–304: `automations(db)` e `events(db)` com `toEqual` antes e depois de `again`. | Suficiente |
| Δ2 fields | R88 L119, chaves das fontes | L329–341: `fields.action` em toggle e ação ausente; `fields.ids` em [], "", 1 e 101, como em J L581/584/587. L351–356: `fields["idempotency-key"]`, de dispatch R88 L431–433. `expect.any(String)` não exige literal inventado. | Suficiente |
| Δ3(a) automations integral | S100 | L272 e L279: depois de off, os não alvos são integrais e a ativa difere só em status/updated_at. L358–372: depois das recusas, todas as linhas não selecionadas `toEqual` baseline (concluida, fora, estrangeira, vencida e outras); ativa e pausada com `rest` integral. | Suficiente. Nota: L280/L370 também exigem updated_at ≠, o que é mais estrito que S100. Não é dispensa nem delta, e os gates passaram. |
| Δ3(b) idempotency_keys | só recibos novos e controle | L373–378: `toEqual` da lista exata, 3 recibos `api.automation.bulk` (off-01, on-01, on-02) + `...baselineKeys` integral, incluindo `idem-aut04-controle` (L250–252). Isso prova que os 400/404/401/403 não gravaram recibo. Corpos dos recibos = respostas (L379–382). | Suficiente |
| Δ3(c) controles populados com IDs | IDs, não contagem | L233–249: campaigns left/right/foreign, group.id, `rsv_aut04`, `rte_aut04`, draft de left, `ver_aut04`, `blk_aut04`, assignment (left/vis/group), `job.id` e `attempt.id`/`job_id`. Comparação SELECT * das 10 tabelas em L267/L357. | Suficiente |

**S75 (divergência contratual de fonte do R88), agora resolvida na fonte:**
- J L591: `runAutomationBulkTransaction`, com BEGIN IMMEDIATE ou SAVEPOINT (J L546/L550).
- J L603: `if (row.status === target) continue`, ou seja no-op sem chamada.
- J L604: `pauseAutomation(db, organizationId, row.id)` é chamado **só quando o estado difere**. Para active/paused, a inversão do alternador produz o alvo.
- O UPDATE e o evento próprios foram removidos, assim como a pré-recusa de completed. Completed agora é recusado pelo próprio alternador (J L513–515), dentro da transação e depois do lock, e o erro desfaz tudo.

Provas mantidas:
- **Completed:** lote misto → 400, concluida intacta e ativa ainda active (T L314–321); depois, linhas inteiras iguais (L358–372).
- **Helper:** `toThrow(/encerrou/)` e automations integral (T L523 e seguintes).
- **Rollback depois de `pauseAutomation`:** o fault (L419–424) restaura automations, events e keys.
- **No-op:** pausada no deactivate `toEqual(pausada)` (L262), eventos exatos (L264–266) e repetição sem toggle (L303–304).

Exigência literal S75: **satisfeita na fonte**. Não houve refatoração global e não há bug demonstrado.

## 4. Limites (inalterados, não reabertos)

- O dispatcher foi chamado localmente, não por TCP.
- O mtime não prova o DB inteiro.
- O fault é throw, não SIGKILL.
- O holder do lock é genérico, não o runner.
- O POST não enfileira; ativar uma automação vencida deixa o tick herdado agir.
- Não há prova de gatilho, envio, provider, UI, produção nem AUT03/QI/Q3/Q4. AUT04 em massa está fora de GRU.
- `idempotency.ts` aparece só no stack trace do foco e não foi lido.
- Git, push e CMP são relatos do escritor.

## 5. Conclusão

**Delta material vazio para o escopo R89.**
- Δ1, Δ2 e Δ3 estão fechados por asserts com oráculo independente, comparação integral e controles com IDs.
- A divergência S75 está resolvida na fonte: reuso literal de `pauseAutomation` só quando difere, dentro da transação, com completed, rollback e no-op preservados.
- Somados aos itens suficientes do R88 (G0, B1 deactivate, B4–B7, não reabertos), o resultado é **SUFICIÊNCIA DOCUMENTAL LIMITADA** de AUT04-BULK-STATE: ativar e desativar uma seleção de automações locais, nos limites do §4.

Nenhum assert contratado foi dispensado. Não há homologação global, de UI, de produção ou de Git, e a decisão sobre a próxima fatia é do coordenador.
