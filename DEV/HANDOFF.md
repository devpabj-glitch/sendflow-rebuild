# Handoff

Produto: Grupos. Referência visual: sessão logada em `sendflow.pro/whats`, só leitura.

## Clone pg779096.click — /casino (08/11/2026, main, sem commit)

- Pacote `casino/` (React 18 + Vite 6 + TS strict, porta dev 5174) clona o lobby da referência: header (logo/Login/Registro), marketing (Promoção/Recompensas/Juros/Rebate/VIP), banner com autoplay, jackpot com tick, marquee, ganhadores, abas Popular/Slots/Recente/Favoritos com seções empilhadas + Carregar mais (15 em 15 de 137), rodapé completo (3 colunas, redes, canal, texto, 8 logos) e nav inferior (Começar/Agente/Promoção/Registro/Perfil). Dialog Login/Registro e páginas member center (VIP/Recompensas/Juros/Rebate) no estado deslogado.
- Verificado por diff geométrico (21/22 PASS por breakpoint) + smoke 9/9 + zero overflow horizontal. `npm run dev`/`build`/`preview` funcionais; dist pronto para CDN.
- Arquitetura para integração: `types/lobby.ts` + `services/` + `config.ts` (VITE_API_BASE/VITE_ASSET_BASE); endpoints originais mapeados em `lobby.service.ts`; dados mock em `mock/lobby.mock.ts`.
- Pendências de dono: (1) API real de lobby/auth; (2) substituir assets hotlinkados por CDN próprio; (3) comportamento real das abas Recente/Favoritos (no original deslogado são painéis vazios); (4) rotas Agente/Perfil exigem sessão (hoje voltam à home, fiel ao deslogado).
- Importante: app/ (Grupos) e api/ INTACTOS — nada do fluxo das fatias foi tocado.

## Fatia 2 (Contas) — API em /api (A1, branch a1/contas)

- Contrato: `docs/contracts/FATIA-02-CONTAS-CONTRATO.md` (§0.1 = decisões D5/D6/D7 do coordenador). Parecer A4: FAVORÁVEL COM RESSALVAS (R1–R3 resolvidas por D5/D6/D7). Merge: NÃO commitado — aguardando orquestrador.
- Endpoints novos (todos exigem sessão): `POST /api/v1/accounts` (201 flat), `GET /api/v1/accounts?search=&page=&pageSize=` ({items,total,page,pageSize}), `GET/PATCH /api/v1/accounts/:id` (404 TENANT_FORBIDDEN genérico p/ alheio/inexistente; malformado → 400). **Sem DELETE** (D5 — proposta futura, requer decisão do dono).
- Para o A2: recurso flat camelCase (`isSpy`, `connectionStatus` SEMPRE `nao_conectada` — DIR-04; sem `phone`); mutações exigem `Content-Type: application/json` (D6 vale também para register/login/logout — logout agora precisa de corpo `{}`); `org_id`/`connectionStatus`/`phone` no body → 400 (não são ignorados).
- Nenhuma env nova; migração 004 (`migrate:status` = 4 aplicadas); gates: typecheck 0 / testes 48-48 / build ok / audit --omit=dev 0.
- Pendências de dono (contrato §10): DELETE de conta (futuro), DEC-02, DEC-12 (limites provisórios), ratificação do sem-unique de (org_id, lower(name)).

## Fatia 1 (Fundação) — API em /api (A1, branch a1/foundation)

- Contrato: `docs/contracts/FATIA-01-FUNDACAO-CONTRATO.md` (§0 = decisões D1–D4; §16 = correções pós-auditoria A3 aplicadas). Parecer A4: `docs/contracts/FATIA-01-FUNDACAO-PARECER.md` (FAVORÁVEL COM RESSALVAS; R1/R2 atendidas). Auditoria A3: aprovada para merge com correções — pacote de 9 itens aplicado (trustProxy 1 hop, timeouts do pool, health com corrida de timeout, 23505 no migrate, register por IP, agregado por IP no login, sweep do Map, scrypt async, .sql ASCII).
- Endpoints: `POST /api/v1/auth/register|login|logout`, `GET /api/v1/auth/me`, `GET /api/v1/health`. Envelope de erro único `{error:{code,message,details?}}` (sem METHOD_NOT_ALLOWED: método inexistente → 404 NOT_FOUND).
- Novas envs (todas com defaults, opcionais): `AUTH_REGISTER_RATE_MAX/_WINDOW_MS/_BLOCK_MS` (10/300000/900000), `AUTH_LOGIN_IP_RATE_MAX/_WINDOW_MS` (30/300000; bloqueio = `AUTH_RATE_BLOCK_MS`).
- Para o A2 (rewiring do front): cookie `grupos_session` (httpOnly; front não lê); login automático no register (201 + cookie) é comportamento NOVO; senha mínima 8 (contrato novo da API; usuários do localStorage com senha <8 precisam re-registrar); e-mail duplicado → 409 AUTH_EMAIL_TAKEN; proxy Vite → http://localhost:8787 com `changeOrigin: true` (snippet no `/api/README.md`).
- Para o orquestrador (deploy): plano documental no contrato §13 (start = `npm run migrate:up && npm run start`); build `npm run build`; variáveis por NOME no `/api/.env.example`; NADA provisionado por decisão D4. PostgreSQL 13+ exigido (`gen_random_uuid()` nativa). Gates da fatia: typecheck + test + build + audit (lint adiado — §11).
- Próxima tela (front): Buscar grupos (`/whats/group-search`), depois Ações e Automações.

Pronto na faixa 88–96:
- Visão geral `/whats/overview` — cerca de 92%
- Contas `/whats/accounts` — cerca de 93% (estado vazio)
- Campanhas `/whats/campaigns` — cerca de 90% (estado vazio)

Marca, logotipo e dados da conta de referência não foram copiados. Identidade: Grupos, marca amarela própria, usuária Marina Alves.

App: `cd app && npm run dev` → http://127.0.0.1:5173/whats/overview
API: `cd api && npm test` (offline) ou `npm run dev` com DATABASE_URL (POST 8787).
Comparações: `checks/live/*-lado-a-lado.png`
