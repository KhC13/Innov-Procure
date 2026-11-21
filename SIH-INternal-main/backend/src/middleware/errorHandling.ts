import { NextFunction, Request, RequestHandler, Response } from 'express';
import multer from 'multer';

export function logServerError(context: string, error: unknown): void {
  console.error(`[${context}]`, error instanceof Error ? {
    message: error.message,
    stack: error.stack,
  } : error);
}

export function sendInternalError(res: Response, context: string, error: unknown): Response {
  logServerError(context, error);
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
}

export function genericErrorHandler(error: unknown, req: Request, res: Response, _next: NextFunction): Response {
  logServerError(`Unhandled ${req.method} ${req.originalUrl}`, error);

  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'The uploaded file exceeds the allowed size.' });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files were uploaded.' });
    }
    return res.status(400).json({ error: 'Invalid file upload.' });
  }

  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = Number((error as { status?: unknown }).status);
    if (status === 400) return res.status(400).json({ error: 'Malformed request.' });
    if (status === 413) return res.status(413).json({ error: 'Request body exceeds the allowed size.' });
  }

  return res.status(500).json({ error: 'An unexpected server error occurred.' });
}

