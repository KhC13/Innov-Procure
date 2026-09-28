import cors from 'cors';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabaseSchema } from './db/index.js';
import { router as apiRouter } from './routes/index.js';
import { seedDatabaseIfEmpty } from './services/seedData.js';

export async function createApp() {
  const app = express();
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Basic middleware
  app.use(cors({
    origin: (origin, callback) => {
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize PostgreSQL Schema and Seed Data
  try {
    await initDatabaseSchema();
    await seedDatabaseIfEmpty();
  } catch (dbErr) {
    console.error('Database initialization warning:', dbErr);
  }

  // Static uploads directory
  const uploadsPath = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'backend/uploads');
  app.use('/uploads', express.static(uploadsPath));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
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

  return app;
}
