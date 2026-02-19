/**
 * Design system tokens – TradeZella dark 2026
 * Alinhado a estilo.md
 */
export const tokens = {
  colors: {
    background: "#121212",
    card: "#1E1E2E",
    foreground: "#E2E8F0",
    muted: "#94A3B8",
    profit: "#10B981",
    loss: "#EF4444",
    score: "#7C3AED",
    scoreAlt: "#6366F1",
    border: "#2d2d3d",
  },
  typography: {
    fontSans: "var(--font-sans), Inter, Manrope, system-ui, sans-serif",
    headingWeight: "600",
    headingBold: "700",
    bodyWeight: "400",
    titleSize: "24px",
    titleSizeLg: "32px",
    cardTitleSize: "16px",
    cardTitleSizeLg: "20px",
    bodySize: "14px",
    bodySizeLg: "16px",
  },
  spacing: {
    cardPadding: "1.5rem",
    cardPaddingLg: "2rem",
  },
  radius: {
    card: "0.75rem",
    button: "0.5rem",
  },
  shadow: {
    card: "0 4px 6px -1px rgb(0 0 0 / 0.2), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    cardHover: "0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
  },
} as const;
