import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authAttemptRateLimit,
  clearRateLimitStore,
  publicRateLimit,
} from './rateLimiting.js';

function mockRequest(path = '/auth/login', body: Record<string, unknown> = {}, ip = '127.0.0.1') {
  return {
    method: 'POST',
    path,
    body,
    headers: {},
    ip,
    socket: { remoteAddress: ip },
  } as any;
}

function mockResponse(statusCode = 200) {
  const finishHandlers: Array<() => void> = [];
  const headers: Record<string, string> = {};
  const response = {
    statusCode,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return this;
    },
    once(event: string, handler: () => void) {
      if (event === 'finish') finishHandlers.push(handler);
      return this;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      return payload;
    },
  } as any;
  return {
    response,
    headers,
    finish() {
      for (const handler of finishHandlers) handler();
    },
  };
}

test('authentication routes apply exponential backoff after repeated failures', () => {
  clearRateLimitStore();
  process.env.AUTH_RATE_LIMIT_BACKOFF_THRESHOLD = '2';
  process.env.AUTH_RATE_LIMIT_BASE_DELAY_MS = '1000';
  process.env.AUTH_RATE_LIMIT_MAX_BACKOFF_MS = '60000';

  const req = mockRequest('/auth/login', { email: 'person@example.com' });

  let first = mockResponse(401);
  authAttemptRateLimit(req, first.response, () => {});
  first.finish();

  let second = mockResponse(401);
  authAttemptRateLimit(req, second.response, () => {});
  second.finish();

  let blocked = mockResponse();
  authAttemptRateLimit(req, blocked.response, () => {});
  assert.equal(blocked.response.statusCode, 429);
  assert.ok(Number(blocked.headers['retry-after']) >= 1);
});

test('public requests enforce a configured fixed window', () => {
  clearRateLimitStore();
  process.env.PUBLIC_RATE_LIMIT_WINDOW_MS = '60000';
  process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS = '1';

  const req = mockRequest('/problems', {}, '203.0.113.10');
  req.method = 'GET';

  publicRateLimit(req, mockResponse().response, () => {});
  const limited = mockResponse();
  publicRateLimit(req, limited.response, () => {});
  assert.equal(limited.response.statusCode, 429);
});
