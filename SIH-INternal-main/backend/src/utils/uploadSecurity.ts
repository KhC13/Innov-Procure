import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export const MAX_UPLOAD_SIZE = 25 * 1024 * 1024;

export function resolveUploadDir(): string {
  const defaultDir = path.resolve(process.cwd(), 'backend', 'storage', 'uploads');
  const configured = process.env.UPLOAD_DIR?.trim();
  if (!configured) return defaultDir;

  const resolved = path.resolve(process.cwd(), configured);
  const relative = path.relative(process.cwd(), resolved);
  const forbidden = [
    'frontend',
    'frontend/public',
    'public',
    'dist',
    'backend/uploads',
  ];

  if (relative.startsWith('..') || forbidden.some((dir) => relative === dir || relative.startsWith(`${dir}${path.sep}`))) {
    return defaultDir;
  }
  return resolved;
}

export function createSafeFilename(detectedExtension: string): string {
  if (!/^([a-z0-9]+)$/.test(detectedExtension)) {
    throw new Error('Invalid upload extension');
  }
  return `${crypto.randomUUID()}.${detectedExtension}`;
}

export function isSafeFilename(filename: string): boolean {
  return /^[A-Za-z0-9-]+\.(pdf|doc|docx|xls|xlsx|jpg|png)$/.test(filename) &&
    path.basename(filename) === filename &&
    !filename.includes('..');
}

export function canAccessStartupDocuments(
  role: string | undefined,
  userStartupId: string | null | undefined,
  targetStartupId: string
): boolean {
  if (role === 'SUPER_ADMIN' || role === 'GOVERNMENT_ADMIN') return true;
  return role === 'STARTUP' && userStartupId === targetStartupId;
}

export function detectAllowedFile(buffer: Buffer, originalName: string, suppliedMime: string):
  { mime: string; extension: string } | null {
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_SIZE) return null;
  if (originalName.length > 255 ||
    /[\/\\\x00-\x1f\x7f]/.test(originalName) ||
    path.basename(originalName) !== originalName) return null;

  const extension = path.extname(originalName).toLowerCase();
  const allowed = new Map<string, { mime: string; extension: string }>([
    ['.pdf', { mime: 'application/pdf', extension: 'pdf' }],
    ['.doc', { mime: 'application/msword', extension: 'doc' }],
    ['.docx', { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extension: 'docx' }],
    ['.xls', { mime: 'application/vnd.ms-excel', extension: 'xls' }],
    ['.xlsx', { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', extension: 'xlsx' }],
    ['.jpg', { mime: 'image/jpeg', extension: 'jpg' }],
    ['.jpeg', { mime: 'image/jpeg', extension: 'jpg' }],
    ['.png', { mime: 'image/png', extension: 'png' }],
  ]);
  const expected = allowed.get(extension);
  if (!expected || suppliedMime !== expected.mime) return null;

  if (extension === '.pdf') {
    const tail = buffer.subarray(Math.max(0, buffer.length - 4096)).toString('latin1');
    if (buffer.subarray(0, 5).toString('ascii') !== '%PDF-' || !tail.includes('%%EOF')) return null;
    return expected;
  }

  if (extension === '.jpg' || extension === '.jpeg') {
    if (buffer.length < 4 ||
      buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff ||
      buffer[buffer.length - 2] !== 0xff || buffer[buffer.length - 1] !== 0xd9) return null;
    return expected;
  }

  if (extension === '.png') {
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const iend = Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
    if (!buffer.subarray(0, 8).equals(signature) || !buffer.subarray(Math.max(0, buffer.length - 12)).includes(iend)) return null;
    return expected;
  }

  if (extension === '.doc') {
    const cfb = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    if (!buffer.subarray(0, 8).equals(cfb)) return null;
    return expected;
  }

  if (extension === '.xls') {
    const cfb = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    if (!buffer.subarray(0, 8).equals(cfb)) return null;
    return expected;
  }

  if (extension === '.docx' || extension === '.xlsx') {
    if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) return null;
    const packageText = buffer.toString('latin1');
    if (!packageText.includes('[Content_Types].xml')) return null;
    if (extension === '.docx' && (!packageText.includes('word/') || /vbaProject|macroEnabled|\.html?(?:$|[\x00])/i.test(packageText))) return null;
    if (extension === '.xlsx' && (!packageText.includes('xl/') || /vbaProject|macroEnabled|\.html?(?:$|[\x00])/i.test(packageText))) return null;
    if (/(\.exe|\.dll|\.js|\.jse|\.bat|\.cmd|\.ps1|\.vbs|\.hta)(?:$|[\x00])/i.test(packageText)) return null;
    return expected;
  }

  return null;
}

export function removeUploadedFiles(files: Array<{ path?: string }>): void {
  for (const file of files) {
    if (!file.path) continue;
    try {
      fs.unlinkSync(file.path);
    } catch {
      // Invalid or partially-written uploads are best-effort removed.
    }
  }
}

export function finalizeUploadedFile(file: { path: string; filename: string; mimetype: string; originalname: string; size: number }):
  { mime: string; extension: string } | null {
  const buffer = fs.readFileSync(file.path);
  const detected = detectAllowedFile(buffer, file.originalname, file.mimetype);
  if (!detected) {
    removeUploadedFiles([file]);
    return null;
  }

  const safeName = createSafeFilename(detected.extension);
  const safePath = path.join(path.dirname(file.path), safeName);
  fs.renameSync(file.path, safePath);
  file.path = safePath;
  file.filename = safeName;
  file.mimetype = detected.mime;
  return detected;
}
