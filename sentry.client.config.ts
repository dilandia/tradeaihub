import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",

  // Performance
  tracesSampleRate: 0.1, // 10% das transacoes em producao

  // Session Replay
  replaysSessionSampleRate: 0.05, // 5% das sessoes
  replaysOnErrorSampleRate: 1.0, // 100% das sessoes com erro

  // Environment
  environment: process.env.NODE_ENV,

  // Filtrar erros comuns que nao sao uteis
  ignoreErrors: [
    "ResizeObserver loop",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    "Load failed",
    "Failed to fetch",
    "NetworkError",
    "ChunkLoadError",
    /^Loading chunk \d+ failed/,
  ],

  // Nao enviar PII
  sendDefaultPii: false,

  // So inicializar se DSN estiver configurado
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
})
