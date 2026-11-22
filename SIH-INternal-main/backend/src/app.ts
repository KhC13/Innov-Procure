import cors from 'cors';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { initDatabaseSchema } from './db/index.js';
import { router as apiRouter } from './routes/index.js';
import { seedDatabaseIfEmpty } from './services/seedData.js';
import { strictValidation } from './middleware/validation.js';
import { authMiddleware, AuthRequest } from './middleware/auth.js';
import { query } from './db/index.js';
import { canAccessStartupDocuments, isSafeFilename, resolveUploadDir } from './utils/uploadSecurity.js';
import { genericErrorHandler, sendInternalError } from './middleware/errorHandling.js';
import { authenticatedRateLimit, publicRateLimit, tieredRateLimit } from './middleware/rateLimiting.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { isNeo4jConfigured, verifyNeo4jConnection } from './services/neo4j.js';

export async function createApp() {
  const app = express();
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Security and request middleware
  app.use(securityHeaders);
  app.use(cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  }));
  app.use(express.json({ limit: '1mb', strict: true }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use('/api', tieredRateLimit);
  app.use('/api', strictValidation);

  // Initialize PostgreSQL Schema and Seed Data
  try {
    await initDatabaseSchema();
    await seedDatabaseIfEmpty();
  } catch (dbErr) {
    console.error('Database initialization warning:', dbErr);
  }

  if (isNeo4jConfigured()) {
    try {
      const neo4jStatus = await verifyNeo4jConnection();
      console.log(`Neo4j connection verified successfully (${neo4jStatus.latencyMs} ms).`);
    } catch {
      // Neo4j is an incremental capability; keep the existing PostgreSQL app
      // available while making the integration failure explicit in server logs.
      console.warn('Neo4j connection verification failed.');
    }
  }

  // Private uploads: authenticated downloads only, never publicly executable.
  app.get('/uploads/:filename', authenticatedRateLimit, authMiddleware, async (req: AuthRequest, res) => {
    const filename = req.params.filename;
    if (!isSafeFilename(filename)) {
      return res.status(400).json({ error: 'Invalid filename.' });
    }

    const uploadsDir = resolveUploadDir();
    const filePath = path.resolve(uploadsDir, filename);
    if (path.dirname(filePath) !== uploadsDir || !fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found.' });
    }

    try {
      const startupDoc = await query(
        'SELECT startup_id FROM startup_documents WHERE file_url = $1',
        [`/uploads/${filename}`]
      );
      if (startupDoc.rows.length > 0) {
        const startupId = startupDoc.rows[0].startup_id;
        if (!canAccessStartupDocuments(req.user?.role, req.user?.startupId, startupId)) {
          return res.status(403).json({ error: 'Forbidden: You are not authorized to access this document.' });
        }
      } else {
        const generalFile = await query('SELECT id FROM files WHERE filename = $1', [filename]);
        if (generalFile.rows.length === 0) {
          return res.status(404).json({ error: 'File not found.' });
        }
      }
    } catch (err: any) {
      console.error('Upload authorization error:', err);
      return sendInternalError(res, 'Upload authorization', err);
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
    return res.sendFile(filePath);
  });

  // Health check endpoint
  app.get('/api/health', publicRateLimit, (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'InnovProcure',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // Mount API router FIRST
  app.use('/api', apiRouter);

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(process.cwd(), 'frontend', 'vite.config.ts'),
      root: path.resolve(process.cwd(), 'frontend'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'frontend', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(genericErrorHandler);
  return app;
}
