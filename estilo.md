Princípios Gerais de Design (para guiar o agente/Cursor)

Tema Principal: Dark mode como default (fácil de toggle para light se quiser no futuro).
Fundo principal: #0F1117 ou #121212 (cinza escuro suave, não preto puro para evitar fadiga).
Superfícies/cards: #1E1E2E ou #171B26 (elevação sutil com sombra leve: shadow-md ou shadow-lg).
Texto primário: #E2E8F0 (branco acinzentado).
Texto secundário: #94A3B8 (cinza claro).
Acentos: Verde #10B981 (lucro, win), Vermelho #EF4444 (loss), Roxo/Azul #7C3AED ou #6366F1 para scores/Zella-like (ex.: hexagon/radar).

Tipografia:
Font principal: Inter, Manrope ou Geist Sans (modernas, legíveis em small sizes).
Headings: Bold 600-700, tamanhos 24-32px para títulos, 16-20px para cards.
Corpo: Regular 400, 14-16px.

Espaçamento e Layout:
Padding generoso: cards com p-6 ou p-8.
Grid flexível: 1-4 colunas responsivo (mobile: stack vertical).
Sidebar esquerda fixa (como no TradeZella): ícones + texto, colapsável em mobile.
Top bar: Logo esquerdo, filtros/date range central, user/subscription direito.

Elementos Visuais Chave (inspirados nas suas imagens):
Cards de Métricas Principais (top row): Retangulares arredondados (border-radius-lg), com ícone pequeno no topo, valor grande central, gauge semicircular ou barra horizontal para win %, profit factor etc. Ex.: Net P&L em verde/vermelho grande, com seta up/down.
Calendário Mensal/Heatmap: Quadrados coloridos (verde escuro para lucro alto, vermelho para perda, cinza para zero trades). Hover mostra detalhes (P&L, % win, trades count). Semanas laterais com resumo.
Zella Score / Consistency Radar: Hexágono ou radar chart (polígono com 5-6 eixos: Consistency, Profit Factor, Recovery, Max Drawdown etc.). Cor gradiente roxo-verde.
Gráficos: Line chart cumulativo P&L (área verde suave), pie/donut para win/loss, bar para avg win/loss.
Recent Trades Table: Tabela clean com colunas (Date, Pair, Pips, R:R, Win/Loss), ícones de tag, cor de linha verde/vermelho.
Progress Tracker / Recovery: Barra horizontal ou steps com %.
Botões e Interações: Primary: bg-indigo-600 hover:bg-indigo-700. Secundário: outline. Ícones Lucide ou Heroicons (minimal).
Animações: Leves (framer-motion): fade-in cards, scale on hover, loading skeletons.

Responsividade: Mobile-first – sidebar vira bottom nav ou hamburger, cards stack, gráficos ajustam height.
Acessibilidade: Contraste WCAG AA (texto >4.5:1), keyboard nav, alt texts em charts.

Estrutura Sugerida de Telas (para o MVP)

Login/Register: Fundo escuro com gradiente sutil, card central branco/escuro com form simples (email, senha, "Entrar com Google" futuro).
Dashboard Principal (como a imagem "Before/After"):
Top: Banner subscription se inativo (rosa claro como no TradeZella).
Sidebar esquerda: Dashboard, Day View, Trade View, Reports, Strategies, Import Trades, Settings.
Main content:
Top row: 4-5 cards grandes (Net P&L, Profit Factor gauge, Win %, Avg Win/Loss bar, Zella Score hexagon).
Calendário mensal central (heatmap squares).
Right column: Radar score + Cumulative P&L line chart.
Bottom: Recent Trades table + Open Positions.

Filtros globais: Date range picker, symbol filter, strategy tag dropdown.

Trade View: Lista detalhada de trades com filtros, preview de cada trade (entry/exit chart simples).
Reports: Geração de PDF preview, botões para email ou download.
Add Trade / Import: Modal ou página dedicada com form (manual) + drag-drop CSV.

Stack de Implementação com Tailwind (fácil para Cursor gerar)

Use Tailwind CSS + shadcn/ui ou Radix UI para componentes prontos (cards, gauges via Recharts, tables via TanStack Table).
Charts: Recharts ou Chart.js (line, pie, radar).
Dark mode: Tailwind dark class (prefers-color-scheme ou toggle manual).
Exemplo classes base:
Card: bg-gray-900/50 border border-gray-800 rounded-xl shadow-lg p-6
Gauge/Progress: bg-green-500/20 text-green-400 para win, bg-red-500/20 text-red-400 para loss.
Heatmap cell: bg-green-900/50 hover:bg-green-700/70 gradiente baseado em valor.