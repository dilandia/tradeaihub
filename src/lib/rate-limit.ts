/**
 * TDR-06: Rate limiting utility for AI endpoints and Server Actions.
 * Prevents abuse of expensive operations using user-based rate limiting.
 *
 * Supports two modes:
 * 1. Default (AI endpoints): checkRateLimit(userId) — 10 req/min
 * 2. Custom (Server Actions): checkRateLimit(userId, action, { max, windowMs }) — configurable per action
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
  /** Seconds until the user can retry (convenience for error messages) */
  retryAfterSeconds: number;
}

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

// In-memory store: key -> RateLimitRecord
// Key is either `userId` (default) or `userId:action` (namespaced)
const rateLimitStore = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per user

/**
 * Check if user has exceeded rate limit.
 *
 * @overload Default mode (AI endpoints): 10 req/min per user
 * @param userId - User identifier
 *
 * @overload Custom mode (Server Actions): configurable per action
 * @param userId - User identifier
 * @param action - Action name (e.g. "import-trades", "create-trade")
 * @param options - { max, windowMs } for this specific action
 */
export function checkRateLimit(userId: string): RateLimitResult;
export function checkRateLimit(userId: string, action: string, options: RateLimitOptions): RateLimitResult;
export function checkRateLimit(
  userId: string,
  action?: string,
  options?: RateLimitOptions
): RateLimitResult {
  const storeKey = action ? `${userId}:${action}` : userId;
  const maxRequests = options?.max ?? RATE_LIMIT_MAX_REQUESTS;
  const windowMs = options?.windowMs ?? RATE_LIMIT_WINDOW_MS;

  const now = Date.now();
  const record = rateLimitStore.get(storeKey);

  // If no record or window expired, create new record
  if (!record || now >= record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(storeKey, newRecord);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetIn: windowMs,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    };
  }

  // Window is still active
  const isAllowed = record.count < maxRequests;
  const resetIn = Math.max(0, record.resetTime - now);

  if (isAllowed) {
    record.count++;
  }

  return {
    allowed: isAllowed,
    remaining: Math.max(0, maxRequests - record.count),
    resetIn,
    retryAfterSeconds: Math.ceil(resetIn / 1000),
  };
}

/**
 * Clean up expired rate limit records periodically
 * Call this once on server startup
 */
export function startRateLimitCleanup(): void {
  setInterval(() => {
    const now = Date.now();
    for (const [userId, record] of rateLimitStore.entries()) {
      if (now >= record.resetTime) {
        rateLimitStore.delete(userId);
      }
    }
  }, 5 * 60 * 1000); // Cleanup every 5 minutes
}
