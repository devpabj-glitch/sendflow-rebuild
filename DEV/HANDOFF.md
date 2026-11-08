# Handoff

Produto: Grupos. Referência visual: sessão logada em `sendflow.pro/whats`, só leitura.

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
