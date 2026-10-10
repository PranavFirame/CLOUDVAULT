import Redis from "ioredis";

// Memory fallback store for fail-safe rate limiting when Redis is unavailable
const memoryRateLimits = new Map<string, { count: number; expiresAt: number }>();

let redisClient: Redis | null = null;
let redisIsAvailable = false;

export function getRedisClient(): Redis | null {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 800,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) return null; // stop reconnecting if down
        return Math.min(times * 100, 1000);
      },
    });

    redisClient.on("connect", () => {
      redisIsAvailable = true;
    });

    redisClient.on("error", () => {
      redisIsAvailable = false;
    });

    redisClient.connect().catch(() => {
      redisIsAvailable = false;
    });
  } catch {
    redisIsAvailable = false;
  }

  return redisClient;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
}

/**
 * Fail-safe rate limiter.
 * If Redis is available, it uses an atomic Redis pipeline.
 * If Redis is offline, it securely falls back to local in-memory rate limiting,
 * ensuring sensitive authentication operations never become unrestricted.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const client = getRedisClient();

  if (redisIsAvailable && client) {
    try {
      const now = Date.now();
      const clearBefore = now - windowSeconds * 1000;
      const redisKey = `ratelimit:${key}`;

      const multi = client.multi();
      multi.zremrangebyscore(redisKey, 0, clearBefore);
      multi.zadd(redisKey, now, `${now}-${Math.random()}`);
      multi.zcard(redisKey);
      multi.expire(redisKey, windowSeconds);

      const results = await multi.exec();
      if (results && results[2] && !results[2][0]) {
        const count = results[2][1] as number;
        const allowed = count <= limit;
        return {
          allowed,
          remaining: Math.max(0, limit - count),
          resetSeconds: windowSeconds,
        };
      }
    } catch {
      // Fall through to memory limiter if Redis execution fails
    }
  }

  // Memory fallback rate limiter
  const now = Date.now();
  const entry = memoryRateLimits.get(key);

  if (!entry || entry.expiresAt <= now) {
    memoryRateLimits.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.ceil((entry.expiresAt - now) / 1000);

  return {
    allowed: entry.count <= limit,
    remaining,
    resetSeconds,
  };
}
