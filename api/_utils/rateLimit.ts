import type { VercelRequest, VercelResponse } from '@vercel/node';

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  windowMs: number;
  maxAttempts: number;
  keyPrefix: string;
};

const buckets = new Map<string, RateLimitBucket>();

function getClientIp(req: VercelRequest) {
  const forwarded = req.headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  return firstForwarded?.split(',')[0]?.trim()
    || req.headers['x-real-ip']?.toString()
    || req.socket.remoteAddress
    || 'unknown';
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of buckets.entries()) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }
}

export function enforceRateLimit(
  req: VercelRequest,
  res: VercelResponse,
  options: RateLimitOptions
) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${options.keyPrefix}:${getClientIp(req)}`;
  const bucket = buckets.get(key) || {
    count: 0,
    resetAt: now + options.windowMs,
  };

  if (now >= bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + options.windowMs;
  }

  bucket.count += 1;
  buckets.set(key, bucket);

  const remaining = Math.max(options.maxAttempts - bucket.count, 0);
  const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

  res.setHeader('X-RateLimit-Limit', String(options.maxAttempts));
  res.setHeader('X-RateLimit-Remaining', String(remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));

  if (bucket.count > options.maxAttempts) {
    res.setHeader('Retry-After', String(resetSeconds));
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Try again in ${resetSeconds} seconds.`,
    });
    return false;
  }

  return true;
}

export const RATE_LIMITS = {
  login: { windowMs: 15 * 60 * 1000, maxAttempts: 5 },
  ai: { windowMs: 60 * 1000, maxAttempts: 20 },
};
