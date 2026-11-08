# Relatório de Fidelidade Visual — Orbit × Referência (SendFlow)

**Data:** 07/11/2026 · **Alvo:** 88–96% de fidelidade visual · **Método:** capturas das telas originais via CDP (sessão logada, somente leitura) × build local (`http://localhost:4173`), avaliadas por diff visual de UI (zai-vision) + extração de DOM real do original.

**Prints lado a lado (original à esquerda × local à direita):** `checks/fidelidade/comparativos/*.png`
**Capturas individuais:** `checks/fidelidade/original/` e `checks/fidelidade/local/`

## Placar final

| Tela | Antes | Depois | Status |
|---|---|---|---|
| Login (antes de logar) | ~45% | **~90%** | ✅ na meta |
| Visão geral | 74% | **92%** | ✅ na meta |
| Contas | 85% | **92%** | ✅ na meta |
| Campanhas | 75% | **85%** | ⚠️ perto (avaliador não enxerga ícones presentes — verificados via DOM) |
| Buscar grupos | 40% | **87%** | ⚠️ perto |
| Automações | 50% | **72%** | ⚠️ estrutura correta, ajustes finos pendentes |

*Nota: o avaliador visual oscila ±5% entre execuções e contradiz-se em detalhes (ex.: ora pede tab preenchida, ora sublinhada). Ícones dos cards de Campanhas confirmados presentes via inspeção de DOM.*

## O que foi ajustado por tela

### 1. Login / antes de logar (reescrita completa)
- Split-screen: painel de marca à esquerda (marca própria) + coluna de formulário 320px à direita, centralizada como o original
- Inputs escuros (#1E1E1E, borda #3A3A3A, raio 6px) com placeholder interno ("Email *", "Senha *") — antes eram inputs brancos com label externa
- Heading "Bem vindo de volta!" amarelo, centralizado
- Link "Esqueceu a senha?" único, branco bold, entre senha e botão (antes duplicado)
- Botão "Login" amarelo #FFD400 + botão outline "Quero saber mais" (antes texto solto)
- Banner de cookies completo: ícone azul, título, texto legal com links, ícone de ajustes, "APENAS NECESSÁRIOS" + "ACEITAR TODOS" (uppercase)
- Rodapé "© Orbit. All rights reserved." · fonte grotesque (não Poppins) · fundo #191919
- Removidos: logo no topo do formulário, parágrafo de cookie inline, links perdidos ("login"), ícones stray

### 2. Visão geral
- Card de perfil agora mostra o **usuário logado real** (BR / br@gmail.com) — antes tinha dados fictícios
- Divisor vertical de altura total antes do botão CONFIGURAÇÕES
- Sidebar ativa: quadrado amarelo com ícone escuro
- Banner de cookies compacto (mesma estrutura do login)
- 2 FABs: pino amarelo + bolha de chat cinza (antes 1 botão cinza de chat)
- kbd "⌃ + K" · busca 128px

### 3. Contas
- Tema interno trocado de azul/navy global para amarelo/preto do painel (override escopado no shell)
- Tabs em estilo sublinhado (MUI) com ativo amarelo
- Estado vazio centralizado maior

### 4. Campanhas
- 8 cards de métricas com ícones amarelos (alvo, entrada, %, saída, pessoas, grupos, checkbox cheio/vazio)
- Linha informativa com ícone ⓘ + texto real ("...grupos distintos de WhatsApp entre campanhas.")
- Períodos 7/14/21/28/90 em linha própria à direita; ativo preenchido de amarelo
- Rótulos fiéis: "Sairam", "0 grupos distintos de WhatsApp"
- Paginação estilo MUI + "Ver exportações →" antes do estado vazio

### 5. Buscar grupos (reescrita)
- Campo de busca grande full-width (52px, borda 2px amarela, placeholder real "Nome do grupo ou GID")
- Título em conteúdo com ícone + dropdown "Ordenação / Mais recentes" com caixa
- Texto de ajuda **real do original** ("Grupos que estão em alguma campanha deste cliente...")
- Estado vazio: ícone lupa riscada 44px + "Nenhum grupo encontrado." — sem tabela fantasma (antes tinha tabela inteira inventada)

### 6. Automações (reestruturada)
- Botões "+ PASTA" / "+ ADICIONAR" / "⬆ IMPORTAR JSON" (uppercase, com ícones)
- Busca em campo largo com placeholder "Buscar" + filtro "Gatilho" ao lado
- Tabs ATIVADO/DESATIVADO/TODOS em linha própria, estilo sublinhado
- Vazio: paginação antes do texto "Nenhum registro encontrado", **sem chrome de tabela** (antes tinha tabela vazia)
- Tema amarelo (antes azul)

## Dados
- Seed zerado: **nenhum dado inventado** — todas as listas vazias com estados vazios reais ("Nenhum registro encontrado", contadores 0/1, 0/∞, 0), igual à conta de referência
- Perfil mostra o usuário autenticado real (`br@gmail.com`)

## Autenticação (mantida local)
`br@gmail.com` / `730287` (SHA-256 em localStorage), rotas `/whats/*` protegidas, logout no menu do usuário.
