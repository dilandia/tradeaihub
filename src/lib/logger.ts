/**
 * Centralized structured logger using pino.
 *
 * Usage:
 *   import { logger } from "@/lib/logger"
 *   logger.info({ userId, tradeId }, "Trade imported successfully")
 *   logger.error({ error, accountId }, "Sync failed")
 *   logger.warn({ plan }, "Rate limit approaching")
 *
 * In production: outputs JSON (structured, searchable)
 * In development: outputs pretty-printed colored logs
 *
 * IMPORTANT: This is server-only. Do NOT import in client components
 * or Edge Runtime (middleware.ts).
 */
import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  ...(isDev && {
    transport: {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "HH:MM:ss",
        ignore: "pid,hostname",
      },
    },
  }),
  base: {
    env: process.env.NODE_ENV,
    service: "tradeaihub",
  },
});

// Child loggers for specific modules
export const syncLogger = logger.child({ module: "sync" });
export const tradeLogger = logger.child({ module: "trades" });
export const authLogger = logger.child({ module: "auth" });
export const aiLogger = logger.child({ module: "ai" });
export const stripeLogger = logger.child({ module: "stripe" });
