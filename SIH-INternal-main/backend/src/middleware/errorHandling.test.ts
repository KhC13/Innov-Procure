import assert from 'node:assert/strict';
import test from 'node:test';
import { sendInternalError } from './errorHandling.js';

test('sendInternalError logs details but returns only a generic client message', () => {
  let statusCode = 0;
  let body: unknown;
  const response = {
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      body = payload;
      return this;
    },
  };

  const originalError = console.error;
  console.error = () => {};
  try {
    sendInternalError(response as any, 'Test operation', new Error('internal-database-failure'));
  } finally {
    console.error = originalError;
  }

  assert.equal(statusCode, 500);
  assert.deepEqual(body, { error: 'An unexpected server error occurred.' });
  assert.equal(JSON.stringify(body).includes('postgres'), false);
  assert.equal(JSON.stringify(body).includes('/internal/'), false);
});
