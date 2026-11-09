# Investigação de tokens — madrugada 08→09/11/2026

Status: somente leitura. Nenhuma alteração de código, configuração ou sessões foi feita para esta análise.
Data da análise: 09/11/2026. Autor: orquestrador (a pedido do maestro).

## 1. Escopo e fontes

- Janela: 08/11/2026 18:00 → 09/11/2026 06:00 (Brasília).
- Fontes usadas:
  - `~/.local/share/opencode/opencode.db` (cópia em temporário; tabelas `session_v2`, `session_message` — o par legado `session`/`message` parou em 01/11).
  - `~/glm-proxy/logs/proxy.log` + `state.json` (proxy de duas chaves, criado 08/11 20:02).
  - `DEV/WORKLOG.md` do sendflow-rebuild (cruzamento de horários).
  - `~/.local/share/opencode/log/opencode.log` (erros/retentativas).
- O proxy não registra tokens (só requisições); a medição de tokens vem do banco do opencode, que grava o uso reportado pela API em cada resposta.

## 2. Totais da janela (18:00 → 06:00)

| Métrica | Valor |
|---|---|
| Chamadas ao modelo (respostas com uso gravado) | 1.446 |
| Input (fora de cache) | 5.132.925 |
| Output + reasoning | 1.173.945 |
| Cache lido | 175.771.584 |
| Cache escrito (reportado) | 0 |
| **Soma total** | **182.078.454 (~182,1M)** |

Por agente:

| Agente | Chamadas | Input | Cache lido | Output |
|---|---|---|---|---|
| build (sessões principais) | 597 | 2.939.992 | 124.120.960 | 237.077 |
| general (A1/A2/A4 e gerais) | 510 | 1.404.312 | 35.239.168 | 277.345 |
| verifier (A3) | 266 | 345.256 | 11.884.800 | 77.792 |
| code-reviewer (A3) | 72 | 433.899 | 4.522.432 | 16.845 |
| explore | 1 | 9.466 | 4.224 | 3 |

Modelos: `glm-5.3` 1.265 chamadas (87%), `glm-5.3-flash` 181 (13%). Todo o tráfego passou pelo proxy (upstream bigmodel), confirmação cruzada: 1.531 POSTs no proxy vs 1.446 respostas gravadas + falhas (429×5, 500×8, health checks).

## 3. Por tarefa (sessão raiz)

| Tarefa | Sessões | Chamadas | Contexto total | Contexto médio/chamada | Período | % da janela |
|---|---|---|---|---|---|---|
| Clonar pg779096.click (casino) — FORA do prompt mestre | 1 | 282 (304 até 06:11) | 73,66M | ~275K (14K→464K) | 22:54→05:59 | 40,4% |
| Orquestrador + fatias F2–F6 (A1/A2/A3/A4) — prompt mestre | 36 | 910 | 70,53M | ~77K (raiz: 274K) | 21:15→00:49 | 38,7% |
| SendFlow visual parity (loop de semelhança) — FORA do mestre | 1 | 79 (86 até 06:xx) | 19,24M | ~249K | 22:53→05:56 | 10,6% |
| Tracking Omaze: CSP e SecurityPage — FORA do mestre | 1 | 114 | 12,32M | ~108K | 21:18→21:48 | 6,8% |
| Tracker Omaze: donation_1 — FORA do mestre | 1 | 61 | 5,16M | ~85K | 05:22→05:56 | 2,8% |
| Diversos (teste de disponibilidade etc.) | 2 | 5 | ~0,07M | — | — | 0,1% |

Trabalho fora do prompt mestre (clone + parity + trilhas Omaze): **110,4M = 60,6%** da madrugada.

## 4. Linha do tempo por hora (BRT)

| Hora | Reqs proxy | Chamadas | Tokens | O que rodava |
|---|---|---|---|---|
| 20h | 5 (2×429) | 3 | ~0,1M | Proxy no ar 20:02; chave 1 já morta; testes |
| 21h | 358 | 356 | 26,9M | Fatias F2/F3 (A1 contrato+implementar, A2 front, A3 verificação+review, A4 parecer+mapa) + Tracking Omaze CSP (114 chamadas) |
| 22h | 351 | 345 | 27,3M | F3/F4 continuam; 22:53 inicia parity; 22:54 inicia clone; A3 verificação F3/F4 (119 chamadas de verifier+review na hora) |
| 23h | 354 | 349 | 45,2M | F5 Grupos; **clone acelera: 134 chamadas / 27,05M na hora**; parity em paralelo |
| 00h | 162 | 161 | 18,1M | F6 Projetos encerra 00:49; clone+parity seguem |
| 01h–03h | 0 geradas | 0 | 0 | **Buraco de quota**: chave 2 estourou teto de 5h às 23:58 (liberaria 01:58); tempestade de retry 01:53 (~20 tentativas/min) e 03:50 (~10 em 70s), todas rejeitadas antes de gerar |
| 04h | 4 | 4 | 0,84M | Parity retoma 04:07; reenvio fresh de 203K (cache expirou no buraco) |
| 05h | 233 | 231 | 63,6M | **Hora mais cara**: clone 121 chamadas/45,0M; parity 49/13,4M; Omaze donation_1 61/5,2M |
| 06h (até 06:59) | 64 | 33 | 12,1M | Clone (contexto já em 458K) + parity; janela pedida termina 06:00 |

Paralelismo: 134 de 242 minutos da madrugada tiveram ≥2 trilhas gerando tokens ao mesmo tempo (55%). Das 22:53 às 00:49 foram 3 trilhas simultâneas (fatias + clone + parity).

## 5. Causas, com números

1. **Sessão de clone sem condição de parada e sem teto de contexto** — 73,66M (40,4%). Uma única sessão de 7h05, contexto crescendo monotonicamente de 14K até 464K/chamada sem compactação; cada uma das 304 chamadas reenviou o contexto inteiro (média 275K). Só a hora 05h dela custou 45,0M.
2. **Loop de fatias do orquestrador com ciclo pesado por fatia** — 70,53M (38,7%). 5 fatias (F2–F6) × ~8 sessões por fatia (contrato → implementar → front → correções → verificação → code review → parecer → mapa 05) = 36 sessões / 910 chamadas em 3h34. Cada verificação A3 sozinha consumiu 68–73 chamadas (2,4–3,8M); a raiz do orquestrador reenviou ~274K de contexto por chamada (16,7M só ela).
3. **Contexto gigante reenviado a cada chamada (mecanismo transversal)** — as 3 sessões longas (clone, parity, raiz) somam **121,8M = 66,9%** da madrugada em reenvio de contexto (médias de 249–275K/chamada). Média geral da noite: 126K de cache lido por chamada.
4. **Loop de semelhança visual sem limite de voltas** — 19,24M (10,6%). Sessão única com **26 execuções de `npm run build`** no ciclo editar→buildar→checar, além de 2 reenvios fresh de 167–302K.
5. **Trilhas Omaze fora do mestre** — 17,48M (9,6%). Tracking CSP: 114 chamadas em 30 min; donation_1: 61 chamadas às 05h22, direto no horário de pós-quota.
6. **Retentativas por limite/API** — custo em tokens ~zero (as 5×429 e 8×500 e as ~30 tentativas das tempestades não geraram conteúdo), mas efeito colateral real: o buraco de 3h18 (00:49→04:07) deixou o cache expirar e forçou **4 reenvios fresh de 204–302K (≈1,09M input full-price)** entre 04:58 e 05:54. Chave usada: **chave 2 em 100% das 1.523 chamadas OK** (chave 1 bloqueada até 12/11 por teto de período; chave 2 estourou o teto de 5h às 23:58). O proxy ainda rejeitou às 03:50 com o prazo de liberação já vencido (estado de "esgotada" não foi limpo no deadline).

## 6. Os ~7 bilhões batem?

**Não batem com a madrugada.**

- Madrugada (18:00→06:00): **182,1M = 2,6% de 7B**.
- O que explica a ordem de grandeza: o **acumulado do banco desde 22/09 é 5,79B** (5,71B disso cache lido, 98,6%). O painel do plano quase certamente exibia consumo acumulado do período, não da madrugada.
- Diferença ~7B − 5,79B ≈ **1,2B (17%)**, fontes prováveis:
  1. Uso anterior a 22/09 (o banco do opencode só começa nessa data; a conta GLM pode ter consumo anterior).
  2. Requisições faturadas sem uso gravado: 8×500, streams abortados, chamadas em falha (o banco só grava uso de resposta bem-sucedida).
  3. O painel pode somar as **duas contas/chaves do proxy**; o uso pesado de 05–07/11 (1,48B) passou pela chave 1 antes do proxy existir, e a chave 1 acabou bloqueada até 12/11 por teto de período — sinal de que parte do consumo veio por ela.
  4. Possível divergência de contagem de cache no painel (o banco grava cache_write=0 em tudo; o provedor pode contar escrita de cache que o opencode não reflete).

## 7. Travas propostas (NÃO aplicadas)

1. **Limite de voltas por loop**: teto duro por tarefa — verificação A3 ≤ 30 chamadas, loop de semelhança ≤ 8 ciclos de build, clone ≤ 60 chamadas sem merge de progresso; parada obrigatória ao repetir o mesmo erro 2× seguidas.
2. **Teto de tokens por fatia/sessão**: orçamento explícito por sessão (ex.: fatia ≤ 15M de contexto acumulado; subagente ≤ 8M; sessão de clone/prova de conceito ≤ 10M) com checkpoint obrigatório em DEV/HANDOFF ao atingir 80%.
3. **Contexto enxuto**: compactar sessão quando o contexto passar de ~150K (o clone chegou a 464K); proibir leitura integral de HTML/capture no contexto principal — resumir em arquivo e ler trechos; nunca reler artefato grande inteiro na mesma sessão.
4. **Condição de parada explícita**: toda tarefa autônoma noturna nasce com critério de término (checklist fechado OU orçamento estourado OU prazo) registrado no prompt e no WORKLOG antes de começar.
5. **Uma trilha longa por vez**: não sobrepor clone/prova de conceito com fatias do orquestrador (3 trilhas paralelas das 22:53 às 00:49 triplicaram o reenvio por minuto).
6. **Proxy com backoff**: em 429, backoff exponencial e máximo 5 tentativas; limpar o estado "esgotada" exatamente no deadline (hoje ele seguiu rejeitando às 03:50 com prazo vencido às 01:58).
7. **Retomada pós-quota**: ao voltar de bloqueio > 30 min, compactar a sessão antes de continuar (evita os reenvios fresh de 200–300K pós-expiração de cache).
8. **Contador de tokens no proxy**: hoje o proxy não registra tokens, o que impossibilita auditar por chave sem o banco do opencode; logar `usage` de cada resposta no `proxy.log`.

## 8. Método e reprodutibilidade

- Copia do banco feita para temporário antes de ler (original intocado).
- Scripts de extração arquivados em `%TEMP%\opencode\tokinvi\` (01–13), saída bruta em `extract.json`.
- Tokens por chamada = campo `tokens` gravado pelo opencode na resposta (`input`, `output`, `reasoning`, `cache.read`, `cache.write`); soma = input + output + reasoning + cache lido + cache escrito.
