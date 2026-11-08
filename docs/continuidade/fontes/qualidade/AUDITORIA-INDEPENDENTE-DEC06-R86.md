# Auditoria documental independente — DEC06 classificação OR e filtros locais Cheios/Não cheios (G0, A1–A9), entrega R86

**Registro:** 07/11/2026 18:19:21 -0300 (America/Sao_Paulo, via `date`). Frente QA (Grok Bot executor). Escrita autorizada só deste arquivo.

**Natureza:** parecer DOCUMENTAL. Não executei projeto, fonte, teste, banco, build, Git nem rede. Usei leitura, `sha256sum`/`wc`/`cmp`, `unzip -Z1`/`unzip -p` (leitura de bytes, sem extrair), `diff`/`grep` textual e parse do dump só de campos visíveis (thinking/reasoning/analysis descartados).

Siglas: "T Lnn" = `group-fullness.test.ts`; "D Lnn" = `data.ts` R86; "X Lnn" = `dispatch.ts` R86; "C Lnn" = `PACOTE-DEC06-FILTROS-CHEIOS.md`; "DE Lnn" = `DECISAO-DEC06-GRUPO-CHEIO.md`; "PA Lnn" = `PARECER-DEC06-FILTROS-CHEIOS.md`.

## 0. Revisão, integridade e autoridades

- **Revisão RELATADA:** `f096ddc0b6c96137aca2a65ecca106a8fe063d7b`, pai `a66de577a7bef048f2f56ca5ef55a192b400bd2f` (MANIFEST L1–2).
  - Dump L9084: `[main f096ddc]`, "5 files changed, 465 insertions(+), 9 deletions(-)".
  - Dump L9087: "working tree clean".
  - Commit, push e os 5 CMP (MANIFEST L3–7) são relato. **Git não certificado.**
- **ZIP `PACOTE-ORIGINAL-R86.zip`:** 94883 B, SHA256 `ceb5203aaecfae23f72b5a3a34b3e0c215cb98f039d45a55f65f623408f348e5`, **aferido e igual ao esperado**.
  - **17 entradas**, todas byte a byte iguais às cópias soltas.
  - Os **16 hashes internos** do MANIFEST (L9–24) dão `OK`.
- **Preparação, fora do ZIP:** ENCAMINHAMENTO `9dcdd5d0…` (61 linhas), CRONOLOGIA `e4ef7330…` (38), INVENTARIO `e82f15c2…` (59) e JSONL `2eff5e3c…` (não usado; fiz parse próprio). Os hashes conferem com o ENCAMINHAMENTO L41–61.
- **Autoridades** (cópias do pacote **idênticas por `cmp`** aos originais):

| Autoridade | Caminho original | Linhas | SHA256 | Data |
|---|---|---|---|---|
| Decisão | `/workspace/grupos-execucao-backend/DECISAO-DEC06-GRUPO-CHEIO.md` | 43 | `0ab322fca7993aa26ffa9d4611b2526033038547f3469c254fde548b4f9135e8` | 18:02:02 |
| Contrato | `/workspace/grupos-execucao-backend/PACOTE-DEC06-FILTROS-CHEIOS.md` | 153 | `2ff67d96a129322841939df3f81a3f3ddca2b71e1a866ebba20d395a4ebd42df` | 18:02:02 |
| Parecer | `/workspace/grupos-referencia-visual/PARECER-DEC06-FILTROS-CHEIOS.md` | 41 | `69d72960ad056e1a03454e303627eef53a335df97cb389dd50aae9031fc034e6` | ~18:04 |

  As três são anteriores ao 1º diff (dump L9029 em diante; base em L8925, 18:04:57).
- **Proveniência da decisão:**
  - A DE L7–11 registra a decisão como mensagem direta do usuário, verificada por Grupos — Execução Backend: posição 849, `speakerId cu:[ID-REDIGIDO]`.
  - O PA L9 relata verificação própria, com role `user` e texto idêntico.
  - **Esta frente não verificou o transcript.** 17h58 é horário atribuído pelo coordenador, não timestamp nativo (DE L11).
  - O texto da decisão (DE L15–29) é usado só como autoridade de contrato.
- **Diff textual contra as dependências R84/R85:**
  - `dispatch.ts`: import `nowIso` (X L5), `groupFullness` (X L36) e o handler (X L588–602).
  - `data.ts`: import `internalCeiling` (D L5), parser, `localCeilingSql` e `countedFull` (D L960–983), e `listGroups` (D L985–1011).
  - README: L108–109 e L153.
  - Matriz: L41, L43 e L114.
  - Confere com o `diff.txt` (hunks L1–165).

## 1. Fonte (C §3–4, L35–60)

- **Parser, D L962–971:**
  - Sem chave devolve `undefined`.
  - Mais de um valor, ou valor fora de `full`/`not_full`, lança `DomainError` com `fields.fullness`.
  - Isso cobre vazio, `?fullness` sem valor, caixa diferente e espaço (C L53).
- **Teto C, D L973–975, `localCeilingSql`:** `CASE`.
  - Com capacity inteiro ≥ 1, margin inteira (COALESCE 0) ≥ 0 e margin < capacity: `capacity − COALESCE(margin, 0)`.
  - Caso contrário: 0.
  - Reproduz `internalCeiling` (C L41).
- **Predicado F, D L1003–1008:**
  - `(status = 'full' OR C < 1 OR occupancy + (SELECT COUNT(*) FROM reservations WHERE group_id = groups.id AND status = 'active' AND expires_at > ?) >= C)`.
  - O `not_full` usa `NOT` do mesmo predicado.
  - O `t` vai num **único parâmetro** vinculado, dentro de **um statement** com tenant, campanha, status e nome (D L1011, `ORDER BY position`).
  - É COUNT de linhas, sem DISTINCT por visitante (C L40). Não usa `groupIneligibility` (C L46).
- **`countedFull`, D L977–983:** espelho TS do OR. É usado só pelo teste. Não é o caminho HTTP.
- **Handler, X L583–602:**
  1. `getCampaign` → 404 (X L585).
  2. Status (X L590).
  3. Nome.
  4. `fullness` (X L592).
  5. Listagem com `{ value, at: nowIso() }`: **um instante capturado uma vez** por requisição filtrada (X L600).
  - É a ordem de C L56.
- **CSV, X L604–616:** não lê `fullness`; chama `listGroups` só com status (C L57).
- **Bug demonstrável em fonte:** nenhum.

## 2. G0 e A1–A9

| Item | Exigido (C L85–94) | Evidência | Classe |
|---|---|---|---|
| **G0** | Base, helpers e handlers atuais; fixture discriminante; status sozinho não dá F; equivalente | `g0-antes-diff.txt` L7–24 (**bruto**; dump L9008, 18:08:08, EXIT:0): HEAD `a66de577` com STATUS vazio; CEILING ausente 10, zero 10, dois 8, inválido 0; COUNT 2/0; inelegibilidade do suspenso = `suspended`; `status=full` só traz o manual; `fullness=full` → 200 com o universo (parâmetro ignorado). Colunas sem `fullness`; JOB_KINDS sem gatilho. Inventário pré-diff (dump L9025). Leitura integral das autoridades pelo escritor é **relato** | **SUFICIENTE** |
| **A1** (C L86) | M/L nas quatro combinações; igualdade e acima incluem; logo abaixo exclui | HTTP `fullness=full` = `cheios` e `not_full` = `naoCheios` com DTO inteiro (T L298–310). manual (M=1, 1+0 < 8), calculado (available, 6+2 = 8), ambos uma vez, aberto (6+1 = 7) em não cheios (T L169–172, L188–192). acima 6+3 (T L173, L193–195), margemZero 9+1 = 10, margemAbaixo 8+1 = 9 < 10 (T L174–175, L196–197). Calculado continua `available` (T L313). Espelho `countedFull` (T L271–277) | **SUFICIENTE** |
| **A2** (C L87) | No mesmo t: ativa futura conta, `expires == t`/vencida não, released/expired não; visitante repetido conta 2; um t por requisição; antes e depois da expiração muda sem UPDATE | Helper `countActiveReservations` no t controlado: calculado 2 com o mesmo visitante (T L279–282); relógio 3 em T e 0 em T2 (T L283–284); igual, released e expired confirmados (T L285–296; fixture T L198–204). Predicado do produto com t fixado via `listGroups(..., {at: T})` / `{at: T2}`: relógio sai de cheios para não cheios (T L337–345), snapshot igual sem UPDATE (T L341, L346). **Qualificação:** T/T2 são argumento direto do listador, **não relógio HTTP congelado**. O "um t por requisição" HTTP é **prova estática** (X L600 + statement único D L1011), aceita por C L59/L96. O HTTP usa relógio real, posterior a 2026-11-07 (T L120), então reservas T/T2 já venceram e LATER (2027) segue futura: `cheios` sem relógio (T L309) | **SUFICIENTE**, com a qualificação |
| **A3** (C L88) | Sem link e suspended/blocked/archived com L entram em cheios, status intacto; inelegibilidade separada; `status=full&fullness=not_full` → []; partição | Sem link via `invite_url = NULL` (T L186–187), suspenso, bloqueado e arquivado em `cheios` (T L298, L309), status preservado (T L314–315). `groupIneligibility` → no_link/suspended/blocked/archived, e suspensoAberto não cheio e `suspended` (T L316–320). `[]` (T L321). União = universo, interseção vazia (T L311–312) | **SUFICIENTE** |
| **A4** (C L89) | AND com status/nome; IDs/ordem e DTO inteiro contra fixture independente; sem parâmetro igual ao anterior; vazios | Oráculo = literais devolvidos por `createGroup` + a única alteração de fixture `inviteUrl: null` (T L169–187). Não usa a resposta. Universo sem parâmetro (T L306). AND: `status=available&fullness=full` (T L322–324), com nome (T L325–330). Sem match e campanha vazia → [] (T L331–332) | **SUFICIENTE** |
| **A5** (C L90) | 400 `fields.fullness` (vazio, repetido, caixa, espaço, inválido); status/nome inválidos preservados; 401, 403, 404 ×2; controles não entram | 9 casos → 400 `validation` com `fields.fullness` (T L348–352). `status` inválido e nome repetido antes de `fullness` (T L353–360). 401, 403, 404 estrangeira e 404 inexistente, este com `fullness` inválido, o que prova o 404 antes da query (T L361–369). Controles da mesma org/outra campanha e da Sul, com os dois sinais (T L182–185, L188), ausentes (T L333–335) | **SUFICIENTE** |
| **A6** (C L91) | `SELECT *` das 8 tabelas antes/depois de leituras válidas e recusadas; alvo e controles populados, com IDs/nomes/vínculos assertados; reabertura com t fixado | `eight()` (T L26–37). As 8 tabelas não vazias por assert (T L229–236). IDs/nomes/`campaign_id`/status de 4 controles e 2 alvos por assert sobre o SELECT persistido (T L237–244). Igualdade em T L341, L346, L370, L389, L393 e L399. Reabertura do mesmo arquivo sem reseed (T L391–392), t fixado T/T2 com a mesma seleção (T L394–395) e HTTP reaberto = `cheios` (T L396–398). Registro no §2.1 | **SUFICIENTE** |
| **A7** (C L92) | Margem positiva e 0; helper vs SQL; não inserir legado incompatível nem migrar | Margem 2 e 0 (T L169–181). Sem coluna `fullness`, `margin NOT NULL` (T L246–248). INSERT com `margin = capacity` recusado e ausente (T L249–256), sem migração. Tabela TEMP com literais (10,NULL), (10,0), (10,2), (10,10), (0,0), (1.5,0): `localCeilingSql` = `internalCeiling` (T L257–267). Coluna real do calculado → 8 (T L268–270). Ver §3 sobre a falha | **SUFICIENTE** |
| **A8** (C L93; §5 L62–77) | Docs citam ambos os sinais e AUT03; o filtro não emite nem consome; GET sem job/evento; gatilho **não implementado** e não opcional | README L108 ("O gatilho “encher grupo” segue exigido nos dois sinais"…). Matriz L114 (AUT-03: "exige esse gatilho nos dois sinais… Esta fatia não o emite… Sobreposição, rearme e consumidor continuam em aberto… Não tratar o filtro como gatilho. A emissão continua pendente"). Strings assertadas (T L122–127). `JOB_KINDS` inalterado (T L121). Jobs/eventos/automações iguais pelos snapshots. **A obrigação continua expressamente NÃO IMPLEMENTADA e delimitada, como manda C §5; esta fatia não a satisfaz e esta QA não pede sua implementação** | **SUFICIENTE** (para o limite declarado) |
| **CSV** (C L57) | Não lê `fullness` | `?fullness=full` igual ao CSV aberto (T L372–379). Com status, `fullness` ignorado (T L380–388). Handler inalterado (X L604–616) | **SUFICIENTE** |
| **A9** (C L94) | Foco e suíte depois do último diff; inventário nominal; falhas preservadas | Foco verde bruto `foco.txt` L6–9: 1/1, 178 ms (dump L9071, 18:12:39). `gates.txt`: TSC:0 L1, LINT:0 L6, rota L333 e L926, novo L818, 52 arquivos L879, 198 testes L880, VITEST:0 L884, mtime L885, BUILD:0 L969. **Inventário próprio:** as entradas `✓ …test.ts (N)` do R85 e do R86 dão os 51 anteriores idênticos em nome e contagem, mais só `group-fullness.test.ts (1 test)`; `inventario-antes.txt` confere com o R85 | **SUFICIENTE** |

### 2.1 Registro A6: oito tabelas no baseline (T L228)

| Tabela | Conteúdo semeado (fonte) | Classe |
|---|---|---|
| groups | 13 alvo e 4 controles (T L169–186) | Não vazia por assert (T L229). Alvo com DTO inteiro (T L306). 4 controles e 2 alvos por id/nome/`campaign_id`/status no SELECT (T L237–244) |
| campaigns | Alvo, Controle, Vazia e Sul (T L137–168) | Não vazia por assert (T L230). `campaign_id` assertado (T L237–244) |
| reservations | 2 por grupo calculado e controles, aberto, acima ×3, mz, ma e 7 do relógio (T L188–204) | Não vazia por assert (T L231). Contagens por assert (T L279–296) |
| routing_log | `rte_dec06` (T L205–209) | Não vazia por assert (T L232); conteúdo pela fonte |
| scheduled_jobs | `capacity.review` (T L210–215) | Não vazia por assert (T L233); conteúdo pela fonte |
| automations | `aut_dec06` active (T L216–222) | Não vazia por assert (T L234); conteúdo pela fonte |
| domain_events | Eventos dos helpers | Não vazia por assert (T L235); tipos **inferidos**, não afirmados |
| idempotency_keys | `idem-dec06` (T L223–226) | Não vazia por assert (T L236); conteúdo pela fonte |

- **Tabelas vazias:** nenhuma.
- **O que o snapshot prova:** igualdade integral, não conteúdo.

## 3. Falha intermediária e rastreabilidade

- **Falha (dump L9064, 18:12:16):** EXIT:1, "Tests 1 failed", "expected +0 to be 10".
  - Aconteceu no ensaio de A7 com subselect de **parâmetros** numéricos (`foco-falha.txt` L33–39, transcrição **manual** criada em L9074, corroborada pelo resultado L9064).
  - "Número ligado como REAL, typeof ≠ integer" é **diagnóstico relatado**. O stdout só prova a diferença 0 vs 10.
- **Correção (dump L9068, 18:12:32):** só no teste, com tabela TEMP de literais e assert da coluna real (T L257–270). O SQL do produto não muda nessa correção.
  - Não é bug reproduzido do produto: a coluna real dá 8 (T L268–270), e o caminho HTTP classificou corretamente (T L309–310).
- **Registro:** não omitida nem tratada como verde.

| Dump | Hora (−03) | Evento |
|---|---|---|
| 8925 | 18:04:57 | Base |
| 9008 | 18:08:08 | G0 |
| 9025 | 18:10:07 | Inventário pré-diff |
| 9029–9048 | — | Fonte e docs (CRONOLOGIA L10–11) |
| 9061 | 18:11:59 | Teste criado |
| 9064 | 18:12:16 | Falha |
| **9068** | **18:12:32** | **Último diff de projeto** |
| 9071 | 18:12:39 | Foco verde |
| 9074 | 18:12:47 | Edição só em `/tmp/foco-dec06-falha.txt`, fora do projeto |
| 9076 / 9079 | 18:12:48 / 18:13:45 | Gates (stdout vazio) e grep do log |
| 9081 | 18:13:45 | Inventário pós |
| 9084 | 18:14:02 | Commit |
| 9087 | 18:14:09 | Push e árvore limpa |
| 9104 | 18:14:36 | ZIP `ceb5203a…` |

Sem edição de projeto entre L9069 e L9104 além do `/tmp` de L9074. A ordem último diff → foco → gates → commit → push → ZIP vale como relato observável.

## 4. Limites (fatos × relatos)

- **Fatos aferidos:** ZIP, cópias, hashes, autoridades por `cmp`, diffs de fonte, asserts e inventário textual.
- **Relatos:** commit, push, blobs (MAPA L42–46), foco, gates, CMP, a leitura das autoridades pelo escritor e o diagnóstico REAL/typeof.
- **Sem:** hash de árvore por gate, rerun pós-commit e ensaio de concorrência.
- **Clock HTTP:** não congelado. A coerência de instante único é estática.
- **Outros:** dispatcher não é TCP; o mtime não prova o banco; as mensagens de erro SQL do log vêm de testes aprovados.
- **Proveniência da decisão:** é relato das frentes Backend e Referência.

## 5. Conclusão

**SUFICIÊNCIA DOCUMENTAL do recorte "classificação OR e filtros locais Cheios/Não cheios"** na revisão relatada `f096ddc0…`:
- G0 e A1–A9, CSV e o registro de A6 estão suficientes;
- delta material vazio e nenhum bug demonstrável;
- falha de ensaio registrada, com correção só no teste;
- clock T/T2 qualificado como argumento do listador, não relógio HTTP.

**A obrigação do gatilho "encher grupo" nos dois sinais (C §5, A8) continua expressamente NÃO IMPLEMENTADA.** Está delimitada e documentada, sem ser tratada como opcional nem como satisfeita pelo filtro; sobreposição, rearme, ponto de emissão e consumidor seguem em aberto. Isto não fecha DEC-06 nem AUT-03.

Máximo registrável pelo coordenador: **PROVADO LIMITADO — classificação OR e filtros locais Cheios/Não cheios** (C L114). Este parecer não homologa toolbar, UI, provedor, Git nem produção, e **não libera a próxima implementação**: a decisão é do coordenador.
