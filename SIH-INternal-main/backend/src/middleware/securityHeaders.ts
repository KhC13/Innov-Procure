import type { NextFunction, Request, Response } from 'express';

/**
 * Security headers equivalent to a conservative Helmet configuration.
 * The CSP deliberately allows only the resources the app actually uses:
 * same-origin assets/API, Google font files, image URLs used by the landing
 * page, and WebSocket connections required by Vite during development.
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const connectSources = isProduction
    ? "'self' https:"
    : "'self' ws: wss: http://localhost:* https://localhost:*";
  const scriptSources = isProduction ? "'self'" : "'self' 'unsafe-inline' 'unsafe-eval'";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSources}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSources}`,
  ].join('; ');

  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains');
  res.setHeader('Content-Security-Policy', csp);
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // API responses contain operational and personal data. Do not let browsers
  // or intermediary caches retain them after the authenticated session ends.
  if (_req.path.startsWith('/api') || _req.path.startsWith('/uploads')) {
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    res.setHeader('Pragma', 'no-cache');
  }

  return next();
}
