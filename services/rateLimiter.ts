/**
 * Rate Limiter for Anonymous AI Demo
 * 
 * Protects the live landing page demo from abuse while keeping it friction-free.
 * 
 * RULES:
 * - 5 photo uploads per IP per 24 hours
 * - Stored in memory (resets on server restart, but this is a Vite SPA so N/A)
 * - Actually we'll use localStorage for client-side tracking (good enough for demo)
 * - Server-side we'd use Redis, but for now client-side is acceptable
 * 
 * UPGRADE PATH (when you hit scale):
 * - Move to Supabase edge function with Upstash Redis
 * - Add Cloudflare Turnstile after 3rd upload
 * - Track by fingerprint (not just IP — VPNs exist)
 * - Add cost tracking (alert if >$X/day)
 */

const RATE_LIMIT_KEY = 'trinibuild_demo_uploads';
const MAX_UPLOADS_PER_DAY = 5;
const RESET_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const LOGIN_LIMIT_KEY = 'trinibuild_login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitData {
  count: number;
  resetAt: number; // timestamp
}

export class RateLimiter {
  /**
   * Check if user can upload another demo photo.
   * Returns { allowed: boolean, remaining: number, resetAt: number }
   */
  static checkLimit(): { allowed: boolean; remaining: number; resetAt: number } {
    if (typeof window === 'undefined') {
      // Server-side render — allow (shouldn't happen in Vite SPA)
      return { allowed: true, remaining: MAX_UPLOADS_PER_DAY, resetAt: Date.now() + RESET_WINDOW_MS };
    }

    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      const now = Date.now();

      if (!stored) {
        // First upload ever
        const data: RateLimitData = {
          count: 0,
          resetAt: now + RESET_WINDOW_MS,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
        return { allowed: true, remaining: MAX_UPLOADS_PER_DAY, resetAt: data.resetAt };
      }

      const data: RateLimitData = JSON.parse(stored);

      // Check if window has expired
      if (now >= data.resetAt) {
        // Reset the counter
        const newData: RateLimitData = {
          count: 0,
          resetAt: now + RESET_WINDOW_MS,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newData));
        return { allowed: true, remaining: MAX_UPLOADS_PER_DAY, resetAt: newData.resetAt };
      }

      // Check if limit exceeded
      if (data.count >= MAX_UPLOADS_PER_DAY) {
        return { allowed: false, remaining: 0, resetAt: data.resetAt };
      }

      // Can upload
      const remaining = MAX_UPLOADS_PER_DAY - data.count;
      return { allowed: true, remaining, resetAt: data.resetAt };
    } catch (err) {
      console.error('Rate limiter error:', err);
      // Fail open (allow upload on error)
      return { allowed: true, remaining: MAX_UPLOADS_PER_DAY, resetAt: Date.now() + RESET_WINDOW_MS };
    }
  }

  /**
   * Increment the upload counter after a successful demo.
   */
  static recordUpload(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(RATE_LIMIT_KEY);
      const now = Date.now();

      if (!stored) {
        const data: RateLimitData = {
          count: 1,
          resetAt: now + RESET_WINDOW_MS,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
        return;
      }

      const data: RateLimitData = JSON.parse(stored);

      // If expired, reset
      if (now >= data.resetAt) {
        const newData: RateLimitData = {
          count: 1,
          resetAt: now + RESET_WINDOW_MS,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newData));
        return;
      }

      // Increment
      data.count += 1;
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Rate limiter record error:', err);
    }
  }

  /**
   * Format remaining time until reset as human-readable string
   */
  static formatResetTime(resetAt: number): string {
    const now = Date.now();
    const diff = resetAt - now;
    if (diff <= 0) return 'now';

    const hours = Math.floor(diff / (60 * 60 * 1000));
    const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} minutes`;
  }

  static checkLoginLimit(identifier: string): { allowed: boolean; remaining: number; resetAt: number } {
    return this.checkWindowedLimit(LOGIN_LIMIT_KEY, identifier, MAX_LOGIN_ATTEMPTS, LOGIN_WINDOW_MS);
  }

  static recordLoginAttempt(identifier: string): void {
    this.recordWindowedAttempt(LOGIN_LIMIT_KEY, identifier, LOGIN_WINDOW_MS);
  }

  static clearLoginAttempts(identifier: string): void {
    if (typeof window === 'undefined') return;

    try {
      const data = this.readWindowedData(LOGIN_LIMIT_KEY);
      delete data[this.normalizeIdentifier(identifier)];
      localStorage.setItem(LOGIN_LIMIT_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Login rate limiter clear error:', err);
    }
  }

  private static checkWindowedLimit(
    storageKey: string,
    identifier: string,
    maxAttempts: number,
    windowMs: number
  ): { allowed: boolean; remaining: number; resetAt: number } {
    if (typeof window === 'undefined') {
      return { allowed: true, remaining: maxAttempts, resetAt: Date.now() + windowMs };
    }

    try {
      const key = this.normalizeIdentifier(identifier);
      const now = Date.now();
      const data = this.readWindowedData(storageKey);
      const current = data[key];

      if (!current || now >= current.resetAt) {
        return { allowed: true, remaining: maxAttempts, resetAt: now + windowMs };
      }

      if (current.count >= maxAttempts) {
        return { allowed: false, remaining: 0, resetAt: current.resetAt };
      }

      return {
        allowed: true,
        remaining: maxAttempts - current.count,
        resetAt: current.resetAt,
      };
    } catch (err) {
      console.error('Windowed rate limiter error:', err);
      return { allowed: true, remaining: maxAttempts, resetAt: Date.now() + windowMs };
    }
  }

  private static recordWindowedAttempt(storageKey: string, identifier: string, windowMs: number): void {
    if (typeof window === 'undefined') return;

    try {
      const key = this.normalizeIdentifier(identifier);
      const now = Date.now();
      const data = this.readWindowedData(storageKey);
      const current = data[key];

      if (!current || now >= current.resetAt) {
        data[key] = { count: 1, resetAt: now + windowMs };
      } else {
        data[key] = { count: current.count + 1, resetAt: current.resetAt };
      }

      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (err) {
      console.error('Windowed rate limiter record error:', err);
    }
  }

  private static readWindowedData(storageKey: string): Record<string, RateLimitData> {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : {};
  }

  private static normalizeIdentifier(identifier: string) {
    return identifier.trim().toLowerCase() || 'anonymous';
  }
}
