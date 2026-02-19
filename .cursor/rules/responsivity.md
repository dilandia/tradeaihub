# Regra: Responsividade e Mobile-First (obrigatória em todos os agentes)

- Todo componente, página ou layout novo deve ser **mobile-first**.
- Use classes Tailwind com breakpoints:
  - default: mobile (<640px) → stack vertical, touch-friendly, sem overflow horizontal
  - sm: (≥640px) → ajustes iniciais para tablet
  - md: (≥768px) → grids 2 colunas onde fizer sentido
  - lg: (≥1024px) → sidebar fixa, rows horizontais amplas, hover effects
  - xl/2xl: (≥1280px+) → layouts mais espaçosos
- Priorize UX agradável:
  - Botões/touch targets ≥44px em mobile
  - Espaçamentos consistentes (p-4 em mobile, p-6 em desktop)
  - Evite zoom forçado (viewport meta já está ok)
  - Sidebar deve virar hamburger menu em mobile (use Drawer ou Sheet do shadcn)
  - Teste visualmente com devtools responsive mode antes de finalizar
- Mantenha a estética do projeto (estilo.md) em todos os tamanhos (sem quebras de cor ou glow)
- Sempre que criar ou editar UI, inclua responsividade no mesmo commit/diff

Essa regra tem prioridade alta e deve ser aplicada automaticamente.
