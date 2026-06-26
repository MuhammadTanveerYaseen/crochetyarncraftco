/**
 * In-memory sliding-window rate limiter for Next.js API routes.
 * Per-IP, no external dependencies. Safe for single-instance deployments
 * and dev servers. For serverless/multi-instance, swap the store for Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ max: 60, windowMs: 60_000 });
 *   const { success, remaining } = limiter.check(ip);
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

interface RateLimiterOptions {
  /** Maximum requests allowed within the window */
  max: number;
  /** Window duration in milliseconds */
  windowMs: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitRecord>();
  private readonly max: number;
  private readonly windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor({ max, windowMs }: RateLimiterOptions) {
    this.max = max;
    this.windowMs = windowMs;

    // Periodically clear expired entries to prevent unbounded memory growth.
    // Only run in Node.js environments (not edge runtime).
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(
        () => this.cleanup(),
        Math.min(windowMs * 2, 5 * 60_000) // cleanup every 2 windows, max 5 min
      );
      // Allow the process to exit without waiting for this interval
      if (this.cleanupInterval?.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record || now >= record.resetAt) {
      // First request in this window, or window has expired
      const resetAt = now + this.windowMs;
      this.store.set(identifier, { count: 1, resetAt });
      return {
        success: true,
        remaining: this.max - 1,
        resetAt,
        retryAfterSeconds: 0,
      };
    }

    if (record.count >= this.max) {
      return {
        success: false,
        remaining: 0,
        resetAt: record.resetAt,
        retryAfterSeconds: Math.ceil((record.resetAt - now) / 1000),
      };
    }

    record.count += 1;
    return {
      success: true,
      remaining: this.max - record.count,
      resetAt: record.resetAt,
      retryAfterSeconds: 0,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now >= record.resetAt) {
        this.store.delete(key);
      }
    }
  }

  /** Call this in tests or when the limiter is no longer needed */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}

// ─── Pre-built limiters (singleton pattern for Next.js serverful deployments) ─

import { RATE_LIMITS } from '@/lib/config';

// Singletons are preserved across hot reloads in dev via global cache
const g = global as any;

export const queryLimiter: RateLimiter =
  g.__queryLimiter ?? (g.__queryLimiter = new RateLimiter(RATE_LIMITS.QUERY));

export const mutationLimiter: RateLimiter =
  g.__mutationLimiter ??
  (g.__mutationLimiter = new RateLimiter(RATE_LIMITS.MUTATION));

// ─── Helper: extract client IP from Next.js request ──────────────────────────

export function getClientIp(request: Request): string {
  // Check common proxy headers first (Vercel, Cloudflare, etc.)
  const forwarded =
    (request.headers as any).get?.('x-forwarded-for') ??
    (request.headers as Headers).get('x-forwarded-for');

  if (forwarded) {
    // x-forwarded-for can be a comma-separated list; take the first (original client)
    return forwarded.split(',')[0].trim();
  }

  const realIp =
    (request.headers as any).get?.('x-real-ip') ??
    (request.headers as Headers).get('x-real-ip');

  if (realIp) return realIp.trim();

  // Fallback for local dev
  return '127.0.0.1';
}

/**
 * Determine if a GraphQL request body is a mutation.
 * We check the operation type to apply tighter mutation rate limits.
 */
export function isMutation(body: { query?: string }): boolean {
  if (!body?.query) return false;
  const trimmed = body.query.trim();
  return trimmed.startsWith('mutation') || trimmed.startsWith('mutation ');
}
