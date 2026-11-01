import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

interface RateLimitRecord {
  timestamps: number[];
}

export interface UserRateLimiterOptions {
  windowMs?: number;
  max: number;
  message?: string;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
}

export class UserRateLimiter {
  private store = new Map<string, RateLimitRecord>();
  public readonly windowMs: number;
  public readonly max: number;
  public readonly message: string;
  public readonly keyPrefix?: string;
  public readonly keyGenerator?: (req: Request) => string;
  private readonly maxStoreSize = 10000;

  constructor(options: UserRateLimiterOptions) {
    this.windowMs = options.windowMs || 60000;
    this.max = options.max;
    this.message =
      options.message || 'Rate limit exceeded. Please wait a moment before trying again.';
    this.keyPrefix = options.keyPrefix;
    this.keyGenerator = options.keyGenerator;
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const now = Date.now();

      if (this.store.size > this.maxStoreSize) {
        this.purgeExpired(now);
      }

      let key: string;
      if (this.keyGenerator) {
        key = this.keyGenerator(req);
      } else {
        const rawUserId = req.user ? (req.user.userId || (req.user as any).id) : undefined;
        const userId =
          typeof rawUserId === 'string' && rawUserId.trim().length > 0
            ? rawUserId.trim()
            : undefined;

        const baseKey = userId
          ? `user:${userId}`
          : `ip:${req.ip || req.socket.remoteAddress || 'unknown'}`;
        key = this.keyPrefix ? `${this.keyPrefix}:${baseKey}` : baseKey;
      }

      let record = this.store.get(key);
      if (!record) {
        record = { timestamps: [] };
        this.store.set(key, record);
      }

      record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);

      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }

      const count = record.timestamps.length;
      const oldestTimestamp = record.timestamps[0] || now;
      const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + this.windowMs - now) / 1000));

      if (count >= this.max) {
        res.setHeader('RateLimit-Limit', this.max);
        res.setHeader('RateLimit-Remaining', 0);
        res.setHeader('RateLimit-Reset', resetSeconds);
        res.setHeader('Retry-After', resetSeconds);
        return sendError(res, this.message, 429);
      }

      record.timestamps.push(now);
      this.store.set(key, record);

      const remaining = Math.max(0, this.max - record.timestamps.length);

      res.setHeader('RateLimit-Limit', this.max);
      res.setHeader('RateLimit-Remaining', remaining);
      res.setHeader('RateLimit-Reset', resetSeconds);

      next();
    };
  }

  public purgeExpired(now: number = Date.now()): void {
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < this.windowMs);
      if (record.timestamps.length === 0) {
        this.store.delete(key);
      }
    }
  }

  public getStoreSize(): number {
    return this.store.size;
  }

  public reset(): void {
    this.store.clear();
  }
}

export const heavyAiRateLimiterInstance = new UserRateLimiter({
  max: 5,
  windowMs: 60000,
  message:
    'AI request rate limit exceeded (maximum 5 requests per minute). Please wait before trying again.',
});
export const heavyAiLimiter = heavyAiRateLimiterInstance.middleware();

export const lightAiRateLimiterInstance = new UserRateLimiter({
  max: 15,
  windowMs: 60000,
  message:
    'AI content improvement rate limit exceeded (maximum 15 requests per minute). Please wait before trying again.',
});
export const lightAiLimiter = lightAiRateLimiterInstance.middleware();

export const authLoginRateLimiterInstance = new UserRateLimiter({
  max: 5,
  windowMs: 60000,
  keyPrefix: 'auth:login',
  keyGenerator: (req: Request) =>
    `auth:login:ip:${req.ip || req.socket.remoteAddress || 'unknown'}`,
  message: 'Too many login attempts. Please try again in a minute.',
});
export const authLoginLimiterInstance = authLoginRateLimiterInstance;
export const authLoginLimiter = authLoginRateLimiterInstance.middleware();

export const authRegisterRateLimiterInstance = new UserRateLimiter({
  max: 3,
  windowMs: 60000,
  keyPrefix: 'auth:register',
  keyGenerator: (req: Request) =>
    `auth:register:ip:${req.ip || req.socket.remoteAddress || 'unknown'}`,
  message: 'Too many registration attempts. Please try again in a minute.',
});
export const authRegisterLimiterInstance = authRegisterRateLimiterInstance;
export const authRegisterLimiter = authRegisterRateLimiterInstance.middleware();

export const pdfDownloadRateLimiterInstance = new UserRateLimiter({
  max: 5,
  windowMs: 60000,
  keyPrefix: 'pdf:download',
  message:
    'PDF export rate limit exceeded (maximum 5 requests per minute). Please wait before trying again.',
});
export const pdfDownloadLimiterInstance = pdfDownloadRateLimiterInstance;
export const pdfDownloadLimiter = pdfDownloadRateLimiterInstance.middleware();
