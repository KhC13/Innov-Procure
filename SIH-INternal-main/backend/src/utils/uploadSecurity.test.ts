import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import {
  detectAllowedFile,
  canAccessStartupDocuments,
  isSafeFilename,
  resolveUploadDir,
} from './uploadSecurity.js';

test('rejects HTML disguised as an allowed PDF', () => {
  const spoofed = Buffer.from('<html><script>alert(1)</script></html>');
  assert.equal(detectAllowedFile(spoofed, 'report.pdf', 'application/pdf'), null);
});

test('accepts a PDF with matching magic bytes and MIME', () => {
  const pdf = Buffer.from('%PDF-1.7\n1 0 obj\n%%EOF');
  assert.deepEqual(
    detectAllowedFile(pdf, 'report.pdf', 'application/pdf'),
    { mime: 'application/pdf', extension: 'pdf' }
  );
});

test('rejects oversized and traversal-oriented filenames', () => {
  assert.equal(detectAllowedFile(Buffer.alloc(25 * 1024 * 1024 + 1), 'report.pdf', 'application/pdf'), null);
  assert.equal(detectAllowedFile(Buffer.from('%PDF-1.7\n%%EOF'), '..\\report.pdf', 'application/pdf'), null);
});

test('allows only server-style safe filenames', () => {
  assert.equal(isSafeFilename('b00d3f2a-5b8a-4c6d.pdf'), true);
  assert.equal(isSafeFilename('../evil.pdf'), false);
  assert.equal(isSafeFilename('evil.html'), false);
});

test('uses private storage instead of public web roots', () => {
  const privateDir = resolveUploadDir();
  assert.equal(path.relative(process.cwd(), privateDir).startsWith('frontend'), false);
  assert.equal(path.relative(process.cwd(), privateDir).startsWith('public'), false);
  assert.equal(path.relative(process.cwd(), privateDir).startsWith('backend/uploads'), false);
});

test('authorizes startup owners and administrators but rejects cross-startup access', () => {
  assert.equal(canAccessStartupDocuments('STARTUP', 'startup-1', 'startup-1'), true);
  assert.equal(canAccessStartupDocuments('STARTUP', 'startup-1', 'startup-2'), false);
  assert.equal(canAccessStartupDocuments('GOVERNMENT_ADMIN', null, 'startup-2'), true);
  assert.equal(canAccessStartupDocuments('EVALUATOR', null, 'startup-2'), false);
});
