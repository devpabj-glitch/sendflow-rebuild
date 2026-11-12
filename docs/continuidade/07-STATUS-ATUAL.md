# 07 — Status atual por módulo (snapshot 12/11/2026 — pós FATIA-07, fatia b)

**Escopo:** estado real do repositório `sendflow-rebuild` (produto **Grupos**) por módulo, na ordem do prompt mestre (PM-GRUPOS v1.0, 182 IDs, 29 módulos). Detalhe por ID com SHA e teste: ver a coluna "Estado no repo (09/11/2026)" em `05-MAPA-FUNCOES-182.md`.

**Totais (182 IDs):** FEITO 25 · EM ANDAMENTO 0 · PULADO 71 · BLOQ-EXT 20 · NÃO INICIADO 63 · SUBSTITUÍDO 1 · OBSOLETO 2 *(atualizados 12/11/2026 — FATIA-07/fatia b: CTA-06, INT-02 e INT-04 → FEITO, CTA-02 consolidado; antes da fatia b: FEITO 22 · PULADO 72 · NÃO INICIADO 65, já refletindo F6 Projetos FEITO + D19/Evolution; original: BLOQ-EXT 43 · NÃO INICIADO 45)*.

## Estado geral

- **Backend (pasta `/api`):** Fastify 5 + TypeScript + PostgreSQL, 9 migrações reversíveis (001–008 no `main`; 008 = Contas QR/Evolution, FATIA-07 12/11), auth de servidor com sessão opaca e rate limit, tenant (`org_id`) em tudo, envelope de erro único. Gates no `main` (pós-FATIA-07): typecheck 0 erros · **151/151 testes** · build ok · `npm audit --omit=dev` 0.
- **Evolution 2.3.7 (provedor WhatsApp, decisão D19):** operacional no projeto Railway "grupos" com Postgres, Redis e volume persistentes próprios; comunicação pela rede interna do Railway; chave só em variável de ambiente. FATIA-07 validou contra a instância real: webhook `POST /api/v1/webhooks/evolution` recebendo eventos com secret timing-safe validado; **QR REAL emitido e aguardando leitura pelo dono**.
- **Front (pasta `/app`):** React 18 + Vite, telas Visão geral/Contas/Campanhas/Contas×Campanhas/Buscar grupos ligadas à API real; login de servidor; demarcado visual final FORA DE ESCOPO (ordem do dono 09/11).
- **Fatias concluídas e mergeadas no `main`:** F1 Fundação (e14c4b7+d3bd71a), F2 Contas (e6a3e55+cb6cb62), F3 Campanhas (1628e9d+6f9e75b), F4 ASC (7e0a755+06f8bf7), F5 Grupos (c47a41a+1527df7), F6 Projetos (c14d692), F7 Contas QR/Evolution (881a179+deccb66, merges 091021e+ae78c11). Todas com verificação A3 aprovada.
- **F6 Projetos CONCLUÍDA (12/11/2026):** merge `c14d692` no `main` (branch `a1/projetos` 6690e06): `/api/v1/projects` + migração 007 + 12 testes novos. **A3 APROVADO (12/11): 5/5 gates** (typecheck 0, **98/98**, build ok, audit 0; isolamento por tenant revisado no diff; 2 achados baixos documentais). Gates re-rodados no main pós-merge: 98/98.
- **F7 Contas QR CONCLUÍDA (12/11/2026, fatia b do plano D19):** contrato `docs/contracts/FATIA-07-CONTAS-QR-CONTRATO.md` (A1 `e265d72`, emendado pelo parecer A4 R1/R2/R3/R5 + 6 fatos validados contra a Evolution 2.3.7 real). Backend `881a179`: migração 008 (`evolution_instance_name` UNIQUE, `phone`/`phone_jid`, CHECK dos 5 estados, tabela `integration_events`), adaptador `api/src/providers/evolution`, endpoints `POST /accounts/:id/connect` · `GET /accounts/:id/qr` · `POST /accounts/:id/disconnect`, webhook `POST /api/v1/webhooks/evolution` sem sessão (secret timing-safe, apikey redigida) — **151/151 testes**. Front `deccb66`: modal QR com polling 3s e 5 estados reais (nao_conectada/aguardando_qr/conectada/desconectada/banida), zero otimismo, desconectar com confirmação. Merges main `091021e`+`ae78c11`. **A3 APROVADO**; **deploy Railway api+front SUCCESS**; smoke E2E real completo (QR real emitido, webhooks chegando, secret validado). **QR REAL aguardando leitura pelo dono.**
- **Produção (09/11/2026, deploy completo executado e verificado):** serviço **api** `f221c911-6407-4694-94e0-8dcf76e88c13` → https://api-production-29a4.up.railway.app (health `{"status":"ok","db":"up"}`); serviço **sendflow-rebuild** re-deployado com front ligado à API (`VITE_API_URL`); **Postgres** novo com volume `postgres-volume`. Start da API via `api/Procfile` (`NODE_ENV=production node dist/db/migrate.js up && node dist/index.js` — migra na subida, sem devDeps). Verificação: register 201 → login 200 → me 200 → Contas vazia → criar 201 → releitura com 1 item (curl na API pública) **e** fluxo no navegador (Playwright): login → overview → Contas mostra o registro → reload mantém sessão; evidências em `checks/deploy-verify/1-4.png`; 0 erros inesperados (só o 401 esperado do auth/me pré-login). Rollback: deployment anterior do front `e151577d` restaurável no painel + tag `backup-pre-deploy-2026-11-09`. Segredos: `DATABASE_URL` só como referência interna do Railway; usuário de teste `verificacao.deploy@grupos.test` criado no banco novo (sem dados anteriores a perder). Pendências (atualizado 12/11): (1) **Conexão GitHub↔Railway do workspace quebrada** — "No workspace member has their GitHub account connected with access to this repository": auto-deploy por push NÃO dispara e `serviceConnect` da api falha ("User does not have access to the repo"); requer ação do dono no painel (Settings → reconectar o GitHub com acesso ao repo devpabj-glitch/sendflow-rebuild). Enquanto isso, deploys manuais funcionam (`serviceInstanceDeploy` via GraphQL do CLI); o deployment front **469f8443** (12/11, SUCCESS) buildou da última visão do repo (`028f4bd`; o `main` `5717a0a` differe só por 1 PNG de evidência fora do build — artefato idêntico) e o teste completo passou de novo (health/login/criação/releitura). (2) Root Directory = **/api** já aplicado no serviço api via GraphQL ✓ (start via `api/Procfile` ✓); falta só conectar o repo (item 1) para o caminho GitHub. (3) `railway ssh` ainda pendura (chave ccpru-book registrada; investigar toggle SSH/rede depois).

## Resumo por módulo (ordem do PM)

| # | Módulo | Estados (contagem) | Evidência principal |
|---|---|---|---|
| 1 | NAV — Shell/navegação/visão geral | FEITO 6 · NÃO INICIADO 1 | Shell front e5225f4→d3bd71a; busca global de grupos e colunas Contas/Campanhas na API (1527df7, cb6cb62+6f9e75b); breadcrumb não existe; front sem suíte |
| 2 | CTA — Contas | FEITO 4 · PULADO 1 · NÃO INICIADO 1 | F2 e6a3e55+cb6cb62 (48/48); **F7 Contas QR 881a179+deccb66 (12/11)**: status real da Evolution com 5 estados honestos (antes sempre `nao_conectada`), conectar/QR/desconectar com confirmação; 151/151; A3 + smoke E2E real; só CTA-04 (DEC-14) e CTA-05 (alerta 24h) pendentes |
| 3 | CMP — Campanhas | FEITO 4 · PULADO 4 | 1628e9d+6f9e75b; tipos oficiais por D13; testes releases; A3 com smoke real |
| 4 | ASC — Contas associadas | FEITO 1 · PULADO 3 | Matriz front 7e0a755 sobre PATCH `accountIds` (D13, 1628e9d); A3 |
| 5 | GRU — Grupos | FEITO 4 · PULADO 4 · NÃO INICIADO 2 | c47a41a+1527df7; 16 testes groups; cheio derivado DEC06 com oráculo SQL; GRU-06/07 destravados p/ Evolution 2.3.7 (D19), além das ações de provedor da toolbar (GRU-01) e do filtro Suspenso (GRU-02) |
| 6 | CRG — Padrão de criação | NÃO INICIADO 8 · PULADO 4 | Sem fatia ordenada; limites DEC-12/DEC-07/LAC; CRG-02/07/09/12 destravados p/ Evolution 2.3.7 (D19) |
| 7 | IMP — Importar grupos | NÃO INICIADO 4 · PULADO 2 | Sem fatia ordenada; IMP-02 destravado p/ Evolution 2.3.7 (D19) |
| 8 | FIL — Fila de ações | NÃO INICIADO 4 · PULADO 4 | Sem fatia ordenada; DEC-10/LAC |
| 9 | VGC — Visão geral/link único | PULADO 3 · NÃO INICIADO 3 | KPIs e formato do link = DEC-14/DEC-11 |
| 10 | REC — Recursos da campanha | PULADO 5 · NÃO INICIADO 5 · BLOQ-EXT 2 | Sem fatia ordenada; REC-08 destravado p/ Evolution 2.3.7 (D19); REC-06 (Hotmart) e REC-09 seguem BLOQ-EXT |
| 11 | MSG — Editor de mensagem | NÃO INICIADO 8 · PULADO 1 | Visual final fora de escopo; MSG-02/03/06 destravados p/ Evolution 2.3.7 (D19 — envio real); botão IA segue bloqueado (provedor de IA) |
| 12 | ACM — Ações manuais | NÃO INICIADO 8 · PULADO 1 | Pré-requisito de ASC-03 registrado; ACM-04/05/09 destravados p/ Evolution 2.3.7 (D19) |
| 13 | AUT — Automações | NÃO INICIADO 5 · PULADO 2 | Gatilho "ao encher" adiado (DEC-06); AUT-06 destravado p/ Evolution 2.3.7 (D19) |
| 14 | PRJ - Projetos | **FEITO 4** (12/11) | Merge `c14d692` (a1/projetos 6690e06); A3 aprovado 12/11 (5/5 gates, 98/98, tenant OK) |
| 15 | MET — Métricas globais | NÃO INICIADO 2 · PULADO 4 | Fórmulas DEC-14 |
| 16 | LSC — Leadscoring | PULADO 1 · NÃO INICIADO 2 | DEC-17; LSC-02 destravado p/ Evolution 2.3.7 (D19 — eventos de provedor passam a existir) |
| 17 | ATV — Atividades | NÃO INICIADO 1 | Conteúdo não amostrado |
| 18 | SOL — Solicitações de entrada | NÃO INICIADO 4 · PULADO 1 | LAC-08; SOL-02 (parcial — aprovar/recusar real) e SOL-05 destravados p/ Evolution 2.3.7 (D19) |
| 19 | ASP — Anti-spam | NÃO INICIADO 2 · PULADO 2 | DEC-18 |
| 20 | BLK — Blacklists | NÃO INICIADO 2 | — |
| 21 | IAG — Agente de IA | BLOQ-EXT 6 · PULADO 1 | Provedor de IA NT; DEC-19 |
| 22 | WHE — Webhooks de entrada | NÃO INICIADO 1 · BLOQ-EXT 5 | Contrato por plataforma; WHE-01 destravado p/ Evolution 2.3.7 (D19 — eventos WhatsApp passam a existir); WHE-02..06 seguem BLOQ-EXT (plataformas de terceiros) |
| 23 | WHS — Webhooks de saída | BLOQ-EXT 5 | Envio externo NT (DIR-04) |
| 24 | BRD — Broadcasts/Leads | BLOQ-EXT 2 · PULADO 1 | DEC-20 |
| 25 | TRN — Treinamentos/suporte | PULADO 3 | DEC-09 |
| 26 | ZZZ — Rótulos sem conteúdo | PULADO 15 | DEC/DEC-21 — não inventar |
| 27 | VIS — Linguagem visual | PULADO 6 | **Fora de escopo por ordem do dono 09/11/2026** |
| 28 | EXC — Conteúdo excluído | PULADO 3 | Não é requisito do produto |
| 29 | INT — Integração WhatsApp (Evolution QR) | FEITO 2 · SUBSTITUÍDO 1 · OBSOLETO 2 | D19 (12/11): QR via Evolution 2.3.7 operacional (Postgres/Redis/volume no projeto "grupos"; rede interna, chave só em env); ES v5 descartado (INT-01 SUBSTITUÍDO; INT-03/05 OBSOLETAS); 2.4.x proibido (RC, exige licença). **F7 (12/11):** INT-02 FEITO parcial (instanceName UNIQUE distinto, tenant, auditoria integration_events, nunca "conectado" falso; replay/readiness p/ fatias c–f) e INT-04 FEITO (honestidade materializada — máquina de estados por evidência + testes); 151/151; A3 aprovado |

## Decisões do dono vigentes que moldam o mapa

- **D13** (tipos de campanha oficiais), **D16** (DELETE de grupo), **D15** (sem massa), **D12** (idempotência arquivar), **D10** (sem seleção múltipla), **D5** (sem DELETE de conta), **DEC06** (cheio derivado, gatilho fora). Pendentes de dono: DELETE de conta, DEC-02, DEC-12, DEC-03/05/14 etc. (ver `03-PENDENCIAS-E-PROXIMOS-PASSOS.md`).
- **D19 (12/11/2026) — INT via Evolution API 2.3.7 por QR code:** Embedded Signup v5 da Meta **descartado** (GRP-INT-01 SUBSTITUÍDO; INT-03/INT-05 OBSOLETAS no caminho QR); **2.4.x proibido** (RC, exige licença). Evolution self-hosted dedicada ao Grupos no projeto Railway "grupos" (Postgres, Redis e volume persistentes próprios), comunicação pela rede interna do Railway, chave (`AUTHENTICATION_API_KEY`) só em variável de ambiente. Destrava os IDs de provedor WhatsApp: CTA-05/06, GRU-01 (ações em provedor), GRU-02 (Suspenso), GRU-06/07, CRG-02/07/09/12, IMP-02, REC-08, MSG-02/03/06 (envio real; botão IA segue bloqueado), ACM-04/05/09, AUT-06, LSC-02, SOL-02 (parcial), SOL-05, WHE-01 — BLOQ-EXT 43→20, NÃO INICIADO 45→65. Seguem BLOQ-EXT: IAG-01..04/06/07 (provedor de IA), WHE-02..06 (plataformas de terceiros), BRD-01/03, REC-06 (Hotmart), REC-09, WHS-01..05 (saída a destinos externos).

## Próximos passos propostos (nenhum iniciado)

1. Deploy da F6 Projetos no `main` (merge `c14d692`) com backup (tag + dump) e verificação SUCCESS/rota pública/fluxo autenticado. Credencial Railway resolvida (deploys manuais via CLI/GraphQL funcionam; auto-deploy GitHub ainda quebrado).
2. ~~Decisão do dono sobre a F6 Projetos~~ (concluída 12/11: A3 aprovado + merge `c14d692`).
3. Ordenar próximas fatias pelo PM (candidatos naturais: PRJ → FIL/ACM → CRG/IMP).
4. **Plano de fatias da integração Evolution (decisão D19, 12/11/2026):** **(a)** ~~fechar F6 Projetos~~ (concluída 12/11: A3 + merge `c14d692`); **(b)** ~~Contas: conectar por QR code com estado real de conexão~~ (concluída 12/11: FATIA-07 mergeada `091021e`+`ae78c11`, A3 aprovado, deploy api+front SUCCESS, smoke E2E real completo — **aguardando o dono ler o QR**); **(c)** Grupos reais: criação/participantes/cheio a partir do provedor ← **PRÓXIMA**; **(d)** Link único + distribuição; **(e)** FIL/ACM/MSG/AUT (envio real destravado pela D19); **(f)** webhooks de entrada/anti-spam/métricas de provedor.
