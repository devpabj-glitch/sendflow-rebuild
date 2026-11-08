# Rodada 2 — Polimento Visual + Multilinguagem

**Data:** 07/11/2026 · **Prints:** `checks/fidelidade/comparativos/*.png` (original × local) · **Evidências i18n/widget:** `checks/fidelidade/local/i18n_pt.png`, `i18n_es.png`, `help_widget.png`

## Novidades implementadas

### 1. Seletor de idioma (topo, com bandeiras) ✅
- Botão com a bandeira do idioma atual + chevron, ao lado do alternador de tema
- Dropdown: Português 🇧🇷 / English 🇺🇸 / Español 🇪🇸 com bandeiras SVG e check amarelo no ativo
- **Funcional:** troca sidebar completa, títulos de tela, busca, estado vazio e textos do widget de ajuda
- Persistente (localStorage `grupos-lang`), PT padrão — testado: "Visão geral" → "Overview" → "Resumen"

### 2. Widget de ajuda/chat (canto inferior) ✅
- FAB cinza de chat abre painel visual estático
- Cabeçalho amarelo: avatar "?", "Grupos", "Olá, como podemos ajudar?"
- "Artigos populares" com 3 artigos demonstrativos + nota
- Traduzido junto com o seletor de idioma

### 3. Busca global (topo) ✅
- Campo "Buscar" com ícone, atalho ⌃ + K, 128px — abre modal com resultados por módulo/conta/campanha/lead/grupo

## Polimento desta rodada (por tela)

| Tela | Ajustes | Score (avaliador) |
|---|---|---|
| Login | — (mantido da rodada 1: ~90%) | ~90% |
| Visão geral | Fonte do painel → **Roboto** (a do original); espaçamentos; cards raio 12px | 87%* |
| Contas | Roboto + tabs sublinhadas; espaçamento do cabeçalho | 87%* |
| Campanhas | Roboto; espaçamento mais justo (texto de vazio visível a y=852) | 85% |
| Automações | Roboto; título maior; margens da busca/tabs; paginação MUI | 78% (era 72) |
| Buscar grupos | Roboto; helper em largura total; dropdown Ordenação com caixa | 78%* |

\* O avaliador penaliza o botão extra de idioma (intencional) e oscila ±5% entre execuções; reclamações recorrentes de "ícones ausentes" nos cards de Campanhas e do texto de vazio foram **refutadas via inspeção de DOM** (presentes e visíveis).

## Estrutura de multilinguagem (pronta para expansão)
- `src/i18n.tsx`: provider + dicionários pt/en/es + componente `LangFlag`
- Cobertura atual: sidebar (15 itens), topo, títulos de todas as rotas, estado vazio, widget de ajuda
- Para estender: adicionar chaves nos 3 dicionários e usar `t('chave')`

## Verificação
- `npm run build` ✓ (tsc + vite)
- Teste funcional i18n ✓ (troca PT/EN/ES persistente)
- Widget de ajuda ✓ · Busca global ✓ · Autenticação local intacta (`br@gmail.com` / `730287`)
- Nenhuma rota nova, nenhum módulo novo, nenhuma marca/texto copiado
