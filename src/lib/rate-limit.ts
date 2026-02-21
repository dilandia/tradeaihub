/**
 * TDR-06: Rate limiting utility for AI endpoints
 * Prevents abuse of expensive AI API calls using user-based rate limiting.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory store: userId -> RateLimitRecord
const rateLimitStore = new Map<string, RateLimitRecord>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // Max 10 requests per minute per user

/**
 * Check if user has exceeded rate limit
 * Returns { allowed: boolean, remaining: number, resetIn: number }
 */
export function checkRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
  resetIn: number;
} {
  const now = Date.now();
  const record = rateLimitStore.get(userId);

  // If no record or window expired, create new record
  if (!record || now >= record.resetTime) {
    const newRecord: RateLimitRecord = {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    };
    rateLimitStore.set(userId, newRecord);
    return {
      allowed: true,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      resetIn: RATE_LIMIT_WINDOW_MS,
    };
  }

  // Window is still active
  const isAllowed = record.count < RATE_LIMIT_MAX_REQUESTS;
  const resetIn = Math.max(0, record.resetTime - now);

  if (isAllowed) {
    record.count++;
  }

  return {
    allowed: isAllowed,
    remaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - record.count),
    resetIn,
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
