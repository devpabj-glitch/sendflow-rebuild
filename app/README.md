# Orbit — Gestão de Grupos e Campanhas de WhatsApp

Plataforma web própria (SPA) inspirada no estudo de estrutura de interfaces de gestão de WhatsApp: contas, campanhas, grupos, ações, automações, leads, métricas e webhooks. Identidade, textos e código próprios — sem marca, textos ou assets de terceiros.

## Stack

- React 19 + TypeScript
- Vite 6
- React Router (BrowserRouter)
- Estado em memória + seed de demonstração (`src/data/seed.ts`)
- CSS próprio (`src/styles/global.css`), tema claro/escuro

## Comandos

```bash
npm install     # instalar dependências
npm run dev     # desenvolvimento (http://localhost:5173)
npm run build   # build de produção (typecheck + vite → dist/)
npm run preview # servir o build de produção (http://localhost:4173)
```

## Rotas

| Rota | Módulo |
|---|---|
| `/` | Landing |
| `/login`, `/forgot-password` | Autenticação |
| `/termo-de-uso`, `/politica-de-privacidade` | Páginas legais |
| `/whats/overview` | Visão geral com KPIs |
| `/whats/accounts` | Contas (Todas/Conectadas/Desconectadas/Sem sessão) |
| `/whats/accounts-campaigns` | Dashboard cruzado (Por conta/Por campanha/Matriz) |
| `/whats/campaigns` | Campanhas (Campanhas/Ativas/Arquivadas + métricas 7–90 dias) |
| `/whats/group-search` | Busca de grupos |
| `/whats/actions` | Fila de ações (Visão geral/Na fila/Agendado/Processando/Sucesso/Falhas) |
| `/whats/automations` | Automações (gatilho, status, pastas, import JSON) |
| `/whats/leads` | Leads (tabela + tags + exportação) |
| `/whats/deeplinks` | Deep links (pastas, mover em massa) |
| `/whats/history` | Histórico de auditoria |
| `/whats/team` | Equipe e Permissões |
| `/whats/webhooks` | Webhooks (Integrações/Arquivadas) |
| `/whats/projects`, `/whats/broadcasts`, `/whats/leads-groups`, `/whats/personalizacao`, `/whats/integracoes`, `/whats/seguranca`, `/whats/contents` | Placeholders planejados |

## Autenticação

- Registro e login são feitos no servidor — a sessão viaja em cookie httpOnly definido pela API (`src/lib/api.ts`).
- "Esqueci a senha" ainda indisponível nesta fatia.
- Contrato da API: ver `api/README.md` na raiz do repositório.
- Em dev, o Vite faz proxy de `/api` para o servidor.

## Verificação

- `checks/smoke/smoke-report.json` — relatório do smoke test de produção (todas as rotas, login, ausência de marca, sem erros de console)
- `checks/smoke/*.png` — screenshots por rota
- `../RELATORIO.md` + `../capturas/` — estudo de referência usado como especificação

## Estrutura

```
src/
├── App.tsx            # rotas
├── store.tsx          # estado global (Context) + CRUD local
├── types.ts           # tipos de domínio
├── data/seed.ts       # dados de demonstração
├── components/        # Layout (sidebar/topbar), Ui, Icons
└── pages/             # uma página por módulo
```
