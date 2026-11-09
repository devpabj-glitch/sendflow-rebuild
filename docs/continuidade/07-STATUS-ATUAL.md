# 07 — Status atual por módulo (snapshot 09/11/2026)

**Escopo:** estado real do repositório `sendflow-rebuild` (produto **Grupos**) por módulo, na ordem do prompt mestre (PM-GRUPOS v1.0, 182 IDs, 29 módulos). Detalhe por ID com SHA e teste: ver a coluna "Estado no repo (09/11/2026)" em `05-MAPA-FUNCOES-182.md`.

**Totais (182 IDs):** FEITO 18 · EM ANDAMENTO 4 · PULADO 72 · BLOQ-EXT 43 · NÃO INICIADO 45.

## Estado geral

- **Backend (pasta `/api`):** Fastify 5 + TypeScript + PostgreSQL, 7 migrações reversíveis (001–006 no `main` + 007 Projetos no WIP), auth de servidor com sessão opaca e rate limit, tenant (`org_id`) em tudo, envelope de erro único. Gates no `main`: typecheck 0 erros · **86/86 testes** · build ok · `npm audit --omit=dev` 0.
- **Front (pasta `/app`):** React 18 + Vite, telas Visão geral/Contas/Campanhas/Contas×Campanhas/Buscar grupos ligadas à API real; login de servidor; demarcado visual final FORA DE ESCOPO (ordem do dono 09/11).
- **Fatias concluídas e mergeadas no `main`:** F1 Fundação (e14c4b7+d3bd71a), F2 Contas (e6a3e55+cb6cb62), F3 Campanhas (1628e9d+6f9e75b), F4 ASC (7e0a755+06f8bf7), F5 Grupos (c47a41a+1527df7). Todas com verificação A3 aprovada.
- **Em andamento:** F6 Projetos — WIP na branch `a1/projetos` (6690e06): `/api/v1/projects` + migração 007 + 12 testes novos (**98/98** no worktree). **Sem merge, sem verificação A3, não iniciada a próxima fatia** (ordem do dono).
- **Produção (09/11/2026, deploy completo executado e verificado):** serviço **api** `f221c911-6407-4694-94e0-8dcf76e88c13` → https://api-production-29a4.up.railway.app (health `{"status":"ok","db":"up"}`); serviço **sendflow-rebuild** re-deployado com front ligado à API (`VITE_API_URL`); **Postgres** novo com volume `postgres-volume`. Start da API via `api/Procfile` (`NODE_ENV=production node dist/db/migrate.js up && node dist/index.js` — migra na subida, sem devDeps). Verificação: register 201 → login 200 → me 200 → Contas vazia → criar 201 → releitura com 1 item (curl na API pública) **e** fluxo no navegador (Playwright): login → overview → Contas mostra o registro → reload mantém sessão; evidências em `checks/deploy-verify/1-4.png`; 0 erros inesperados (só o 401 esperado do auth/me pré-login). Rollback: deployment anterior do front `e151577d` restaurável no painel + tag `backup-pre-deploy-2026-11-09`. Segredos: `DATABASE_URL` só como referência interna do Railway; usuário de teste `verificacao.deploy@grupos.test` criado no banco novo (sem dados anteriores a perder). Pendências: (1) definir **Root Directory = /api** no serviço api no painel para o caminho GitHub (o upload CLI atual usa pasta limpa); (2) `git push` ao GitHub segue bloqueado pelo harness — quando liberar, o front (conectado ao repo) pode auto-redeployar; (3) `railway ssh` ainda pendura (chave ccpru-book registrada; investigar toggle SSH/rede depois).

## Resumo por módulo (ordem do PM)

| # | Módulo | Estados (contagem) | Evidência principal |
|---|---|---|---|
| 1 | NAV — Shell/navegação/visão geral | FEITO 6 · NÃO INICIADO 1 | Shell front e5225f4→d3bd71a; busca global de grupos e colunas Contas/Campanhas na API (1527df7, cb6cb62+6f9e75b); breadcrumb não existe; front sem suíte |
| 2 | CTA — Contas | FEITO 3 · PULADO 1 · BLOQ-EXT 2 | e6a3e55+cb6cb62; 48/48 na fatia 2; status sempre `nao_conectada` (DIR-04) |
| 3 | CMP — Campanhas | FEITO 4 · PULADO 4 | 1628e9d+6f9e75b; tipos oficiais por D13; testes releases; A3 com smoke real |
| 4 | ASC — Contas associadas | FEITO 1 · PULADO 3 | Matriz front 7e0a755 sobre PATCH `accountIds` (D13, 1628e9d); A3 |
| 5 | GRU — Grupos | FEITO 4 · PULADO 4 · BLOQ-EXT 2 | c47a41a+1527df7; 16 testes groups; cheio derivado DEC06 com oráculo SQL |
| 6 | CRG — Padrão de criação | NÃO INICIADO 4 · BLOQ-EXT 4 · PULADO 4 | Sem fatia ordenada; limites DEC-12/DEC-07/LAC |
| 7 | IMP — Importar grupos | NÃO INICIADO 3 · BLOQ-EXT 1 · PULADO 2 | Sem fatia ordenada |
| 8 | FIL — Fila de ações | NÃO INICIADO 4 · PULADO 4 | Sem fatia ordenada; DEC-10/LAC |
| 9 | VGC — Visão geral/link único | PULADO 3 · NÃO INICIADO 3 | KPIs e formato do link = DEC-14/DEC-11 |
| 10 | REC — Recursos da campanha | PULADO 5 · NÃO INICIADO 4 · BLOQ-EXT 3 | Sem fatia ordenada |
| 11 | MSG — Editor de mensagem | NÃO INICIADO 5 · BLOQ-EXT 3 · PULADO 1 | Visual final fora de escopo; envio NT |
| 12 | ACM — Ações manuais | NÃO INICIADO 5 · BLOQ-EXT 3 · PULADO 1 | Pré-requisito de ASC-03 registrado |
| 13 | AUT — Automações | NÃO INICIADO 4 · PULADO 2 · BLOQ-EXT 1 | Gatilho "ao encher" adiado (DEC-06) |
| 14 | PRJ — Projetos | **EM ANDAMENTO 4** | Branch `a1/projetos` 6690e06; 98/98 no worktree; sem A3 |
| 15 | MET — Métricas globais | NÃO INICIADO 2 · PULADO 4 | Fórmulas DEC-14 |
| 16 | LSC — Leadscoring | PULADO 1 · BLOQ-EXT 1 · NÃO INICIADO 1 | DEC-17; eventos de provedor |
| 17 | ATV — Atividades | NÃO INICIADO 1 | Conteúdo não amostrado |
| 18 | SOL — Solicitações de entrada | NÃO INICIADO 2 · BLOQ-EXT 2 · PULADO 1 | LAC-08 |
| 19 | ASP — Anti-spam | NÃO INICIADO 2 · PULADO 2 | DEC-18 |
| 20 | BLK — Blacklists | NÃO INICIADO 2 | — |
| 21 | IAG — Agente de IA | BLOQ-EXT 6 · PULADO 1 | Provedor de IA NT; DEC-19 |
| 22 | WHE — Webhooks de entrada | NÃO INICIADO 1 · BLOQ-EXT 5 | Contrato por plataforma |
| 23 | WHS — Webhooks de saída | BLOQ-EXT 5 | Envio externo NT (DIR-04) |
| 24 | BRD — Broadcasts/Leads | BLOQ-EXT 2 · PULADO 1 | DEC-20 |
| 25 | TRN — Treinamentos/suporte | PULADO 3 | DEC-09 |
| 26 | ZZZ — Rótulos sem conteúdo | PULADO 15 | DEC/DEC-21 — não inventar |
| 27 | VIS — Linguagem visual | PULADO 6 | **Fora de escopo por ordem do dono 09/11/2026** |
| 28 | EXC — Conteúdo excluído | PULADO 3 | Não é requisito do produto |
| 29 | INT — Integração Meta/WhatsApp | BLOQ-EXT 3 · PULADO 1 · NÃO INICIADO 1 | DIR-06; contrato oficial pendente |

## Decisões do dono vigentes que moldam o mapa

- **D13** (tipos de campanha oficiais), **D16** (DELETE de grupo), **D15** (sem massa), **D12** (idempotência arquivar), **D10** (sem seleção múltipla), **D5** (sem DELETE de conta), **DEC06** (cheio derivado, gatilho fora). Pendentes de dono: DELETE de conta, DEC-02, DEC-12, DEC-03/05/14 etc. (ver `03-PENDENCIAS-E-PROXIMOS-PASSOS.md`).

## Próximos passos propostos (nenhum iniciado)

1. Credencial Railway (`railway login` interativo ou `RAILWAY_API_TOKEN`) → deploy do `main` publicado com backup (tag já criada) e verificação SUCCESS/rota pública/fluxo login→Contas→releitura. **Pré-requisito adicional: liberar/realizar o `git push` do main** (bloqueado pela permissão do harness; commits 0337385 e anteriores prontos localmente).
2. Decisão do dono sobre a F6 Projetos (revisão A3 + merge ou retrabalho).
3. Ordenar próximas fatias pelo PM (candidatos naturais: PRJ → FIL/ACM → CRG/IMP).
