# Ativo

## Trilha atual (12/11/2026) — Integração WhatsApp via Evolution API 2.3.7 (decisão D19 do dono)

Ciclo por fatia: contrato A1 → parecer A4 → implementar A1 (backend, `sendflow-wt-a1`) + A2 (front, `sendflow-wt-a2`) → verificação A3 → merge pelo orquestrador → deploy com backup (tag + dump) → conferência SUCCESS + fluxo autenticado.

- **(a) F6 Projetos — CONCLUÍDA 12/11** (merge `c14d692`, A3 aprovado 5/5, deploy SUCCESS, fluxo verificado).
- **(b) Contas: conectar por QR + estado real — EM ANDAMENTO.** Contrato: `docs/contracts/FATIA-07-CONTAS-QR-CONTRATO.md` (branch `a1/contas-qr`). Infra pronta: Evolution 2.3.7 + Postgres + Redis + volume no projeto Railway "grupos"; envs `EVOLUTION_*` já aplicadas no serviço api. QR final só é lido pelo dono (registrado no HANDOFF).
- **(c) Grupos reais (criar, participantes, cheio real) — aguardando (b).**
- **(d) Link único + distribuição (VGC, REC, CRG, IMP) — aguardando (c).**
- **(e) Fila, ações, mensagens, automações (FIL, ACM, MSG, AUT) — aguardando (d).** Número caiu/banido → fila pausa sozinha + aviso.
- **(f) Webhooks in/out, anti-spam/blacklist, solicitações, atividades, métricas reais — aguardando (e).**

Regras fixas da sessão: sem parar para perguntar (pendências → DEV/HANDOFF.md); loop testar→corrigir→testar; mesmo erro 3× → registrar, pular, voltar no fim; deploy falhou → rollback sozinho, corrigir, republicar; compactar acima de 150K; A3 ≤30 chamadas; uma trilha longa por vez.

## Trilha A — Fidelidade visual 88–96 nas telas logadas, com identidade Grupos (pausada durante a integração)

Feito: visão geral, contas, campanhas.
Aberto: buscar grupos, ações, automações, demais itens do trilho. Demarcação visual final FORA DE ESCOPO (ordem do dono 09/11).
