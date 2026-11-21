import type { NextFunction, Request, Response } from 'express';

type FixedWindowOptions = {
  windowMs: number;
  maxRequests: number;
  message: string;
};

type AuthBackoffOptions = {
  windowMs: number;
  threshold: number;
  baseDelayMs: number;
  maxDelayMs: number;
};

type FixedEntry = { count: number; resetAt: number };
type AuthEntry = { failures: number; resetAt: number; blockedUntil: number };

const fixedStore = new Map<string, FixedEntry>();
const authStore = new Map<string, AuthEntry>();

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function getClientIp(req: Request): string {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = req.headers['x-forwarded-for'];
    const first = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];
    if (first?.trim()) return first.trim();
  }
  return req.socket.remoteAddress || req.ip || 'unknown';
}

function fixedWindow(options: FixedWindowOptions): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${req.method}:${getClientIp(req)}:${req.path}`;
    const current = fixedStore.get(key);
    const entry = !current || now >= current.resetAt
      ? { count: 1, resetAt: now + options.windowMs }
      : { ...current, count: current.count + 1 };

    fixedStore.set(key, entry);
    const remaining = Math.max(0, options.maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', String(options.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));

    if (entry.count > options.maxRequests) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({ error: options.message, retryAfterSeconds });
      return;
    }
    next();
  };
}

export function publicRateLimit(req: Request, res: Response, next: NextFunction): void {
  fixedWindow({
    windowMs: positiveInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: positiveInt(process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS, 60),
    message: 'Too many requests. Please try again later.',
  })(req, res, next);
}

export function authenticatedRateLimit(req: Request, res: Response, next: NextFunction): void {
  fixedWindow({
    windowMs: positiveInt(process.env.AUTHENTICATED_RATE_LIMIT_WINDOW_MS, 60_000),
    maxRequests: positiveInt(process.env.AUTHENTICATED_RATE_LIMIT_MAX_REQUESTS, 300),
    message: 'Too many requests. Please try again later.',
  })(req, res, next);
}

export function tieredRateLimit(req: Request, res: Response, next: NextFunction): void {
  if (/^\/auth\/(?:login|register|signup|password-reset|forgot-password|reset-password)(?:\/|$)/.test(req.path)) {
    authAttemptRateLimit(req, res, next);
    return;
  }
  if (req.headers.authorization?.startsWith('Bearer ')) {
    authenticatedRateLimit(req, res, next);
    return;
  }
  publicRateLimit(req, res, next);
}

function authAccountKey(req: Request): string {
  const body = req.body && typeof req.body === 'object' ? req.body as Record<string, unknown> : {};
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  return email ? `account:${email}` : '';
}

function getAuthOptions(): AuthBackoffOptions {
  return {
    windowMs: positiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 15 * 60_000),
    threshold: positiveInt(process.env.AUTH_RATE_LIMIT_BACKOFF_THRESHOLD, 5),
    baseDelayMs: positiveInt(process.env.AUTH_RATE_LIMIT_BASE_DELAY_MS, 1_000),
    maxDelayMs: positiveInt(process.env.AUTH_RATE_LIMIT_MAX_BACKOFF_MS, 15 * 60_000),
  };
}

function retryDelay(entry: AuthEntry, options: AuthBackoffOptions): number {
  if (entry.failures < options.threshold) return 0;
  const exponent = Math.max(0, entry.failures - options.threshold);
  const delay = options.baseDelayMs * (2 ** exponent);
  return Math.min(options.maxDelayMs, delay);
}

export function authAttemptRateLimit(req: Request, res: Response, next: NextFunction): void {
  const options = getAuthOptions();
  const now = Date.now();
  const ipKey = `ip:${getClientIp(req)}`;
  const accountKey = authAccountKey(req);
  const keys = accountKey ? [ipKey, accountKey] : [ipKey];

  for (const key of keys) {
    const existing = authStore.get(key);
    if (existing && now >= existing.resetAt) authStore.delete(key);
  }

  const entries = keys.map((key) => authStore.get(key)).filter((entry): entry is AuthEntry => Boolean(entry));
  for (const entry of entries) {
    if (now < entry.blockedUntil) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSeconds));
      res.status(429).json({
        error: 'Too many authentication failures. Please wait before trying again.',
        retryAfterSeconds,
      });
      return;
    }
  }

  res.once('finish', () => {
    if (res.statusCode === 400 || res.statusCode === 401 || res.statusCode === 403 || res.statusCode >= 500) {
      for (const key of keys) {
        const existing = authStore.get(key);
        const failures = (existing?.failures || 0) + 1;
        const updated: AuthEntry = {
          failures,
          resetAt: existing?.resetAt && now < existing.resetAt ? existing.resetAt : now + options.windowMs,
          blockedUntil: 0,
        };
        if (failures >= options.threshold) {
          updated.blockedUntil = now + retryDelay(updated, options);
        }
        authStore.set(key, updated);
      }
    } else if (res.statusCode >= 200 && res.statusCode < 400) {
      for (const key of keys) authStore.delete(key);
    }
  });
  next();
}

export function clearRateLimitStore(): void {
  fixedStore.clear();
  authStore.clear();
}
