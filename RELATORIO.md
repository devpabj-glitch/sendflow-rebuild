# Relatório Técnico — Interface Logada SendFlow (módulo WhatsApp)

**Data:** 07/11/2026
**Método:** Inspeção via CDP (Chrome dedicado, porta 9222) + Playwright conectado à sessão logada. Navegação **somente leitura** por links/rotas; nenhum botão de ação acionado, nenhum dado criado, nenhuma mensagem enviada.
**Escopo:** Telas e rotas visíveis na UI do produto em `sendflow.pro/whats/*` para o plano/log atual. Contadores refletem a conta no momento da captura (listas majoritariamente vazias — conta nova).
**Artefatos:** `capturas/*.json` (estrutura por tela) e `capturas/*.png` (screenshot por tela), `index.json` (índice da varredura).

---

## 1. Arquitetura de navegação

### 1.1 Shell global (presente em todas as telas)

- **Sidebar esquerda fixa** com grupos colapsáveis; **topbar** com:
  - Busca global: `Buscar + k` (atalho Ctrl+K)
  - Alternador de tema (claro/escuro): ícone `brightness_7`
  - Central de notificações: ícone `notifications`
  - Menu do usuário (avatar iniciais → nome, e-mail, telefone, "CONFIGURAÇÕES")
- **Banner de cookies** persistente até decisão: `APENAS NECESSÁRIOS` / `ACEITAR TODOS` / "Pode personalizar"
- **Padrões de tabela/lista:** ordenação padrão "Data de criação", busca textual com ícone, paginação `Linhas por página 12`, botões `first page / previous page / next page`
- **Estado vazio padrão:** "Nenhum registro encontrado"
- **Widget de suporte** externo: `suporte.sendflow.com.br` (chat)
- **Rodapé:** "Política de Privacidade" (`/privacy.html`) e "gerencie seus dados" (`/account/privacy`)

### 1.2 Sidebar — estrutura completa mapeada

**Grupo "Início"** (sempre visível):

| Item | Rota |
|---|---|
| Visão geral | `/whats/overview` |
| Ações | `/whats/actions` |
| Automações | `/whats/automations` |
| Projetos | `/whats/projects` |
| Leads | `/whats/leads` |
| Broadcast | `/whats/broadcasts` |
| Broadcast Legado | `/whats/leads-groups` |
| Deep link | `/whats/deeplinks` |
| Histórico | `/whats/history` |
| Equipe | `/whats/attendants` |
| Treinamentos | `/whats/contents` |

**Grupo "Visão geral" (dashboard, expansível `expand_more`):**

| Item | Rota |
|---|---|
| Contas e Campanhas | `/whats/accounts-campaigns` |
| Contas | `/whats/accounts` |
| Campanhas | `/whats/campaigns` |
| Webhooks | `/whats/webhooks` |

**Grupos colapsados não expandidos na captura** (itens internos não mapeados): `Personalização`, `Integrações`, `Segurança`.

**Observações:** não existe item de menu chamado "Métricas" nem "Grupos"; métricas estão embutidas nas telas de Campanhas e do dashboard Contas e Campanhas; gestão de grupos aparece via "Buscar grupos" (`/whats/group-search`) dentro de Campanhas.

---

## 2. Módulos — detalhamento por tela

### 2.1 Visão geral — `/whats/overview`
- Card "Mapa Contas × Campanhas": status "Todas as associações estão em ordem", link "Ver dashboard" → `/whats/accounts-campaigns`
- Card "Contas": contador `0/1` (usadas/total do plano) + botão `add_circle_outline` (adicionar)
- Badges: "Legimo/Legado" (selo de recurso legado em uso)
- Atalhos rápidos (botão "Atalhos" no canto)

### 2.2 Ações — `/whats/actions` (fila de execução)
- Botões: `ADICIONAR`, `PASTA`-style organização ausente; "Filtrar por", "Agrupar Sim/Não"
- **Abas de status:** `Visão geral` · `Na fila` · `Agendado` · `Processando` · `Sucesso` · `Falhas`
- **Campos de filtro:** `filterBy`, `groupBy`, intervalo de datas "Início do intervalo" / "Fim do intervalo" (placeholder `DD/MM/YYYY hh:mm`, datepicker "Choose date")
- Paginação padrão; estado vazio "Nenhum registro encontrado"
- Fluxo implícito: cadastro de ação → fila → agendamento → processamento → sucesso/falha (abas)

### 2.3 Automações — `/whats/automations`
- Botões: `PASTA` · `ADICIONAR` · `IMPORTAR JSON` · `Open`
- **Filtro por status:** `ATIVADO` / `DESATIVADO` / `TODOS`
- **Filtro por Gatilho** (placeholder "Todos") + busca textual
- Tabela com paginação 12; estado vazio padrão
- Fluxo implícito: criar/importar automação → escolher gatilho → ativar/desativar; organização em pastas

### 2.4 Projetos — `/whats/projects` 🔒
- **Bloqueado por plano:** "Ooops! Esse recurso não está disponível para o seu plano"
- Descrição do recurso: organizar campanhas, webhooks e contas por projetos
- Botões visíveis: `QUERO MUDAR DE PLANO` (upsell) e `ADICIONAR PROJETO`

### 2.5 Leads — `/whats/leads`
- **Abas:** `Visão geral` · `Tags`
- Botões: `ADICIONAR` · `EXPORTAR LEADS` (dropdown) · duplicar (`file_copy`) · `Remover todos os leads` (ação destrutiva presente na UI)
- **Tabela:** colunas `Nome | Número | Email | Campos | Tags | (ações)`
- Filtro por tags ("Todos"); paginação 12

### 2.6 Broadcast — `/whats/broadcasts`
- Botão: `Cadastrar`
- Estado vazio "Nenhum registro encontrado" (lista simples)

### 2.7 Broadcast Legado — `/whats/leads-groups`
- Botão: `Cadastrar`; badge "Legado" no título
- Mesmo padrão de lista do Broadcast (versão antiga mantida)

### 2.8 Deep link — `/whats/deeplinks`
- Botões/controles: busca, `PASTA` · `DEEP LINK` (criação), `Selecionar tudo (0/0)` (checkbox em massa), `Mover para Pasta`
- Ordenação padrão "Data de criação"; paginação 12
- Fluxo: criar deep link → organizar em pastas → mover itens em massa

### 2.9 Histórico — `/whats/history` (auditoria)
- Filtro `filter_list` + busca
- **Colunas da tabela:** `Ação | Onde | Endereço de IP | ID | Equipe | Data de início | Data de fim`
- Estado vazio padrão

### 2.10 Equipe — `/whats/attendants`
- Contador `0/0` (colaboradores/limite) + `ATUALIZAR` · `ADICIONAR`
- **Abas:** `Equipe` · `Permissões`
- Aviso: colaborador entra com e-mail cadastrado + senha enviada por e-mail; recomendação de troca de senha no 1º login
- Estado vazio: "Nenhum resultado encontrado"

### 2.11 Treinamentos — `/whats/contents` 🔒
- Redireciona para `/whats/contents/root`; "Acesso bloqueado! Você ainda não tem acesso ao conteúdo WhatsUp"
- 4 itens de conteúdo listados (links sem rótulo textual visível; ids em `/whats/contents/{id}`)

### 2.12 Contas e Campanhas (dashboard) — `/whats/accounts-campaigns`
- Descrição: "Visão cruzada das associações entre contas e campanhas, com alertas de saúde"
- **KPIs no topo:** `Contas {n} Total` · `Conectadas {n} Online` · `Desconectadas {n} Offline` · `Campanhas {n} Associadas`
- **Abas de visão:** `Por conta` · `Por campanha` · `Matriz`
- Alternância de exibição: `TABELA (0)` / `CARDS`
- Filtros: `TODOS` · `CONTAS OCIOSAS (0)` · `CAMPANHAS EXPOSTAS (0)` (alertas de saúde da operação)
- Estado vazio: "Nenhuma conta encontrada"

### 2.13 Contas — `/whats/accounts`
- Botões: `add Conta`; link lateral "hub Contas e Campanhas"; banner `Fazer upgrade de plano`
- **Abas de status:** `Todas` · `Conectadas` · `Desconectadas` · `Sem sessão`
- Ordenação "Data de criação"; busca; paginação 12; estado vazio padrão
- Ciclo de vida implícito da conta: conectar → conectada/desconectada → sem sessão (QR/expiração)

### 2.14 Campanhas — `/whats/campaigns`
- Botões/links: `tune Padrão de criação` · `add Campanha` · `hub Contas e Campanhas` · `manage_search Buscar grupos` (`/whats/group-search`) · `Ver exportações` (`/whats/actions?actionTypes=releasesExportLeads&groupBy=no`)
- **Abas:** `Campanhas` · `Ativas` · `Arquivadas`
- **Períodos do painel:** `7 Dias` · `14 Dias` · `21 Dias` · `28 Dias` · `90 Dias`
- Painel de métricas: "Cliques, entradas e saídas dos últimos 90 dias. Participantes e grupos mostram o total atual e os grupos distintos..." (gráficos/contadores de desempenho)
- Paginação padrão

### 2.15 Webhooks — `/whats/webhooks`
- Botão: `add Webhook`
- **Abas:** `Integrações` · `Arquivadas`
- Ordenação "Data de criação"; busca; paginação 12; estado vazio padrão
- Ciclo: criar webhook (integração) → arquivar

### 2.16 Login — `/login?redirect=...` (fluxo de entrada)
- Formulário de autenticação com **Google reCAPTCHA invisível** embutido
- Após login: redirect para a rota pedida (`/whats/overview`)

### 2.17 Privacidade — `/account/privacy`
- Página "gerencie seus dados" (LGPD): gestão de dados pessoais da conta

---

## 3. Rotas descobertas (não visitadas ou sem sidebar)

| Rota | Origem |
|---|---|
| `/whats/group-search` | link "Buscar grupos" em Campanhas |
| `/whats/actions?actionTypes=releasesExportLeads&groupBy=no` | "Ver exportações" em Campanhas |
| `/whats/contents/root` e `/whats/contents/{id}` | Treinamentos |
| `suporte.sendflow.com.br/widget?...` | widget de suporte (externo) |

## 4. Estados e padrões transversais

- **Gating de plano:** Projetos bloqueado; Treinamentos bloqueado; banner "Fazer upgrade de plano" em Contas; contador `0/1` contas no plano
- **Estados de conta:** Conectada / Desconectada / Sem sessão
- **Estados de ação/fila:** Na fila / Agendado / Processando / Sucesso / Falhas
- **Estados de automação:** Ativado / Desativado
- **Estados de campanha:** Ativa / Arquivada
- **Estados de webhook:** Integração / Arquivada
- **Vazios:** "Nenhum registro encontrado" (padrão), "Nenhum resultado encontrado" (Equipe), "Nenhuma conta encontrada" (dashboard)
- **Massa:** seleção múltipla com "Selecionar tudo (n/n)" e "Mover para Pasta" (Deep link)

## 5. Limitações do levantamento

1. Conta com listas vazias (0 registros) — **não foi possível capturar colunas/detalhes de linhas populadas** nem telas de edição/detalhe (ex.: formulário completo de campanha, editor de automação, drawer de webhook).
2. Submenus `Personalização`, `Integrações` e `Segurança` estavam colapsados; itens internos não mapeados.
3. Nenhum clique em botões de ação (por restrição de segurança do estudo) — fluxos "implícitos" foram inferidos pelos rótulos/abas.
4. `group-search` e `contents/{id}` não visitados na varredura.

## 6. Arquivos gerados

```
C:\Users\ccpru\sendflow-ui-study\
├── RELATORIO.md            (este arquivo)
├── index.json              (índice da varredura: 17 telas)
├── session-cookies.json    (sessão da janela dedicada — apagar quando encerrar)
└── capturas\
    ├── whats_overview.json/.png
    ├── whats_actions.json/.png
    ├── whats_automations.json/.png
    ├── whats_projects.json/.png
    ├── whats_leads.json/.png
    ├── whats_broadcasts.json/.png
    ├── whats_leads_groups.json/.png
    ├── whats_deeplinks.json/.png
    ├── whats_history.json/.png
    ├── whats_attendants.json/.png
    ├── whats_contents.json/.png
    ├── whats_accounts_campaigns.json/.png
    ├── whats_accounts.json/.png
    ├── whats_campaigns.json/.png
    ├── whats_webhooks.json/.png
    ├── privacy_html.json/.png
    └── account_privacy.json/.png
```
