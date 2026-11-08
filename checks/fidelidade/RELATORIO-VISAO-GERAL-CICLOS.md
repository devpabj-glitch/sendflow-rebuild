# Relatório — Revisão rigorosa da Visão Geral (4 ciclos)

**Data:** 07/11/2026 · **Método:** captura original (CDP, sessão logada) × local (localhost:4173) em 3 viewports (1440/768/390), diff visual por IA a cada ciclo, correção, rebuild, nova captura.
**Prints finais:** `checks/fidelidade/comparativos/ciclo4_*.png`

## Evolução por ciclo (score do avaliador)

| Viewport | Início | Ciclo 2 | Ciclo 3 | Ciclo 4 (final) |
|---|---|---|---|---|
| 1440px | 84% | **92%** | 92% | 88% (oscila 88–92%) |
| 768px | 58% | 68% | 80% | 65–80% (oscila) |
| 390px | 40% | 60% | 75% | 72–75% |

*O avaliador oscila ±7% entre execuções idênticas; as divergências nomeadas no final são intencionais: marca própria (G vs SendFlow), usuário real (BR vs conta deles), FAB de chat extra, seletor de idioma extra.*

## Ciclo 1 → 2: correções aplicadas
1. **Banner de cookies:** capturas agora com cookies pré-aceitos (paridade com a sessão original — o banner existe nos dois produtos)
2. **Sidebar ativa revertida ao padrão original:** ícone amarelo + **barra de 4px na borda esquerda** (o quadrado preenchido era errado)
3. **Responsivo ≤1023px:** rail escondido + **menu de módulos em grade** (ícone de grid no header, como o original)
4. **Grid de cards:** 2 colunas no tablet

## Ciclo 2 → 3
5. **Header compacto ≤1023px:** busca vira ícone único, sem texto de usuário (só avatar), **logo no topbar**
6. **Mapa Contas × Campanhas no mobile:** texto íntegro (1 linha) + botão "Ver dashboard" **largura total abaixo** (antes espremido ao lado)
7. **FABs no mobile:** pino repositionado

## Ciclo 3 → 4
8. **Cards mais altos** (300–320px) no tablet/mobile — preenchem a viewport como o original
9. **Perfil no mobile:** botão CONFIGURAÇÕES volta **ao lado** do bloco de usuário (padrão do original); apenas o Mapa empilha

## Pontos obrigatórios — status final
1. **Widget de ajuda:** botão de fechar ✕ **preto** que substitui o launcher quando aberto (padrão do original) ✓; painel branco 400×680 com scroll, badge, "Olá, como podemos ajudar?", card de disponibilidade + "Iniciar Conversa ›", "Artigos Populares" Title Case, 5 artigos com chevron, "Ver todos os artigos", nota demonstrativa ✓ → `ciclo4_help_widget_original_vs_local.png`
2. **Seletor de idioma:** bandeiras 🇧🇷/🇺🇸/🇪🇸 corretas, dropdown escuro MUI, check no ativo ✓; **troca testada** PT→EN→ES mudando sidebar completa, títulos, busca, estado vazio e widget (evidência `ciclo4_language_selector_aberto.png`; teste funcional anterior confirmou "Visão geral"→"Overview"→"Resumen")
3. **Componentes revisados:** header (título, busca ⌃+K, tema, idioma, notificações, usuário), sidebar (15 ícones, ativo com barra), cards Contas 0/1 · Campanhas 0/∞ · Webhooks 0 com ⊕ e "Nenhum registro encontrado", banner de cookies completo, FABs — todos comparados nos 3 tamanhos ✓

## Inalterado
Rotas, autenticação local (`br@gmail.com`/`730287`), lógica de dados (conta vazia real), sem marca/textos copiados, build de produção verde.
