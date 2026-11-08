# 06 — Inventário rota → tela → função do repositório atual (sendflow-rebuild)

**Método:** leitura documental pelas ferramentas GitHub (somente leitura), sem clone, sem checkout, sem executar código, em 08/11/2026 ~00:50 Brasília.
- `main` = `81d75b91d8c0628dab3537e9be8942fa173d6cc8` (merge do PR #5 em 08/11 00:08 Brasília; `main` ainda neste SHA na leitura).
- PR #6 `cursor/demo-module-visual-c444`, head `19c4c8c9f02c2f23bad9d56e2f6370b98a8aebb2`: aberto, não mergeado, `mergeable_state: clean`, 19 arquivos.
- Arquivos lidos: `app/src/App.tsx` (rotas), `components/Layout.tsx` (menu/busca global), `store.tsx`, `auth.ts`, `types.ts`, `data/seed.ts`, as 15 páginas com dados, `package.json`, `DEV/HANDOFF.md`; árvore recursiva completa (1119 entradas, sem truncamento).

## Fatos de arquitetura no `main` (lidos no código)
- **Stack:** Vite + React 18 + react-router-dom 6 + TypeScript (`app/package.json`). Scripts: `dev`, `build` (tsc --noEmit + vite build), `preview`. **Não há script de teste no `main`**; o PR #6 relata 5 testes.
- **Dados:** todas as telas com dados usam `useStore()` (`store.tsx`). O estado fica **só no `localStorage` do navegador** (chave `orbit-data-v1`), a partir de `data/seed.ts`. Nas páginas lidas não há `fetch` nem chamada a API. Nada chega a um servidor.
- **Autenticação:** `auth.ts` é **local no navegador**: usuários e sessão ficam no `localStorage`, a senha vira hash SHA-256 no cliente e há um **usuário inicial fixo no código-fonte**. A credencial não foi reproduzida aqui. `RequireAuth` só verifica a sessão local. **Não é autenticação de servidor.**
- **Entidades no cliente** (`types.ts`): Account, Campaign (com métricas por período), ActionItem, Automation, Lead, Deeplink/Folder, AuditEntry, TeamMember, PermissionRow, Webhook, GroupItem. Isto é **modelo de tela**, não contrato de backend.
- `DEV/HANDOFF.md` declara percentuais (~90–93%) para três telas. **São autodeclarados e não foram medidos nem validados** (Referência e Qualidade não aceitam percentual sem método).

## Rotas do `main` 81d75b9
Status visual: **R** = aprovado pelo usuário segundo relato (Referência/coordenador); **T** = tela com interação só local (localStorage); **P** = placeholder (componente `Placeholder`, só título e nota); **→** = redirecionamento. "Módulo PM candidato" é a correspondência por nome, para orientar. **Não comprova a função GRP.**

| Rota | Componente | Status | O que a tela faz (lido no código) | Módulo PM candidato |
|---|---|---|---|---|
| `/` | Landing | R (home) | Página pública | — (fora do PM) |
| `/login` | Login | R (login) | Formulário de e-mail e senha contra `auth.ts` local; banner de cookies | NAV / acesso (auth não especificada no PM: §0) |
| `/forgot-password` | ForgotPassword | T | Formulário "Enviar link"; sem envio real localizado | — |
| `/termo-de-uso`, `/politica-de-privacidade`, `/account/privacy` | Termos / Privacidade | T | Texto estático | — |
| `/privacy.html` | → `/politica-de-privacidade` | → | — | — |
| `/whats` | → `overview` | → | Shell `Layout` (menu lateral, busca global em dados locais, tema, idioma pt/en/es, notificações, suporte) | NAV-01/04 |
| `/whats/overview` | Overview | T | Visão inicial; "Salvar nesta sessão" | NAV-05 |
| `/whats/accounts-campaigns` | AccountsCampaigns | T | Matriz Conta × Campanha (tabela/cards, alerta, filtro de status) | NAV-05 / ASC |
| `/whats/accounts` | Accounts | T | Lista e CRUD local de contas (Conectada/Desconectada/Sem sessão), aviso de upgrade de plano | CTA |
| `/whats/campaigns` | Campaigns | T | Lista e CRUD local de campanhas (Ativa/Arquivada), "Padrão de criação" | CMP (CRG candidato) |
| `/whats/group-search` | GroupSearch | T | Busca de grupo por nome/GID; filtros conta/campanha/categoria; ordenação | GRU (busca global) |
| `/whats/actions` | ActionsPage | T | Lista e cadastro local de ações (Na fila/Agendado/Processando/Sucesso/Falhas) | FIL / ACM |
| `/whats/automations` | Automations | T | Lista local de automações com pastas, ativar/desativar, "Importar JSON" | AUT |
| `/whats/leads` | Leads | T | CRUD local de leads, tags, campos, Exportar | BRD (Leads) |
| `/whats/deeplinks` | Deeplinks | T | Deep links com pastas, mover em massa, cliques | NAV-02 "Deep link" (área só rotulada) |
| `/whats/history` | HistoryPage | T | Auditoria local (ação, onde, IP, equipe, início/fim) | NAV-02 "Histórico" |
| `/whats/attendants` | → `/whats/team` | → | — | — |
| `/whats/team` | TeamPage | T | Membros (Ativo/Convidado) e permissões Ver/Editar/Gerenciar por módulo | NAV-02 "Equipe" |
| `/whats/webhooks` | WebhooksPage | T | Webhooks com nome/URL/evento (ex.: `lead.created`), Integração/Arquivada | WHE ou WHS: **ambíguo**, uma única tela com campo "evento" |
| `/whats/projects` | Placeholder | P | "Projetos" | PRJ |
| `/whats/broadcasts` | Placeholder | P | "Broadcast" | BRD |
| `/whats/leads-groups` | Placeholder | P | "Broadcast legado" | BRD |
| `/whats/personalizacao` | Placeholder | P | "Modelos de mensagem, variáveis e marcas d'água" | NAV-02 "Modelos de mensagem" / CMP variáveis |
| `/whats/integracoes` | Placeholder | P | "Conectores, API e automações externas" | WHE/WHS/INT |
| `/whats/seguranca` | Placeholder | P | "Listas de bloqueio e regras anti-spam" | ASP / BLK |
| `/whats/contents` | Placeholder (bloqueado) | P | "Treinamentos" | TRN |
| `/profile` | Profile | T | Perfil do usuário local | NAV-05 (cartão de perfil) |
| `/subscriptions` | Subscriptions | T | "Minhas Assinaturas" (estático) | — |
| `*` | → `/` | → | — | — |

Contagem lida: sob `/whats` há 20 sub-rotas (12 telas com interação local, 7 placeholders, 1 redirecionamento) mais o índice → `overview`; fora disso há 7 rotas públicas/conta, 1 redirecionamento público e o curinga `*`. A Referência relatou ter revisado "20 rotas", com as 4 principais medidas em 360/390/473/768/1440 sem overflow e as restantes em 473/1440. É relato; a Qualidade não auditou.

**Menu lateral do `main`:** Início, Visão geral, Ações, Automações, Projetos, Leads, Broadcast, Broadcast legado, Personalização, Integrações, Deep link, Segurança, Histórico, Equipe, Treinamentos. Contas, Campanhas, Webhooks e Buscar grupos têm rota, mas no `main` só são acessíveis pelo grupo "Visão geral".

## O que o PR #6 muda (demo, NÃO mergeado, NÃO publicado)
Lido em `list_pull_request_files` e no corpo do PR:
- Nova rota **`/whats/campaigns/:id`** (`CampaignDetail.tsx`, 268 linhas) com as 12 abas nomeadas no quadro 07:05. Têm conteúdo descrito: Visão geral, Contas associadas, Grupos, Solicitações, Leadscoring e Ações. Ficam só com o nome: Diagnósticos, Atividades, Mensagens, Mensagens recebidas, Calendário e Automações (PM GRP-ZZZ: conteúdo desconhecido).
- Menu passa a mostrar Contas, Campanhas e Webhooks.
- Interruptor **Vazio / Demonstração** (`app/src/demo/*`), com dados fictícios isolados e aviso "não grava no servidor".
- `demo/rules.ts`: `countsAsFull(manual, calculated) = manual || calculated`. Em código, cheio é **OU** (ver divergência de redação em 03-PENDENCIAS).
- Telas tocadas: Overview (busca por coluna, avatares, contadores), Accounts (modal com Conta espião e Tipo), Campaigns (cards com 4 métricas, Arquivar, ordenação por data de atualização, texto do período), AccountsCampaigns.
- Fora, segundo o próprio PR: editor de mensagem, webhooks completos, SendIA, métricas (quadro 42:08), segundo módulo.
- Testes: 5 (`demo/rules.test.ts`) e `tsc`, **relatados** pelo agente visual; não reexecutados aqui.

## Riscos documentais encontrados (para o coordenador; nada foi alterado)
1. O repositório é **público** (`visibility: public`) e o `auth.ts` do `main` tem um usuário e senha iniciais fixos no código. Isso precisa ser substituído na integração de auth real. Não use essa credencial e não a reproduza na documentação.
2. A árvore pública contém `capturas/*.json` (por exemplo `whats_leads.json`, `whats_accounts.json`), `capture/`, `checks/` e `investigation.cany/` (478 arquivos). **O conteúdo não foi lido.** A Referência alertou que materiais brutos do estudo podem conter dados pessoais ou credenciais expostas. Precisa de revisão de privacidade antes de qualquer outra publicação.
3. Este pacote cita IDs de projeto/serviço da Railway (via `ESTADO-INFRA`). Não são segredos, mas o repositório é público: o coordenador decide se mantém.
