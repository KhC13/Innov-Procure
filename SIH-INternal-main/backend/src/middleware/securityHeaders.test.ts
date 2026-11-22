import assert from 'node:assert/strict';
import test from 'node:test';
import { securityHeaders } from './securityHeaders.js';

test('securityHeaders applies the required browser protections', () => {
  const headers = new Map<string, string>();
  const response = {
    setHeader(name: string, value: string) {
      headers.set(name, value);
    },
  } as any;
  const request = { path: '/api/health' } as any;
  let continued = false;

  securityHeaders(request, response, () => { continued = true; });

  assert.equal(continued, true);
  assert.equal(headers.get('X-Frame-Options'), 'DENY');
  assert.equal(headers.get('X-Content-Type-Options'), 'nosniff');
  assert.equal(headers.get('Strict-Transport-Security'), 'max-age=63072000; includeSubDomains');
  assert.equal(headers.get('Permissions-Policy'), 'geolocation=(), camera=(), microphone=()');
  assert.equal(headers.get('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.match(headers.get('Content-Security-Policy') || '', /frame-ancestors 'none'/);
  assert.equal(headers.get('Cache-Control'), 'no-store, max-age=0');
});
