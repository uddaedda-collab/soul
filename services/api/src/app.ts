import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { ZodError } from 'zod';
import { corsOrigins, isProduction } from './config/env.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { mediaRouter } from './routes/media.js';
import { notificationsRouter } from './routes/notifications.js';
import { roomsRouter } from './routes/rooms.js';
import { usersRouter } from './routes/users.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet());
  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(isProduction ? 'combined' : 'dev'));
  app.use(rateLimit({
    windowMs: 60_000,
    limit: 180,
    standardHeaders: true,
    legacyHeaders: false
  }));

  app.use('/health', healthRouter);
  app.use('/auth', authRouter);
  app.use('/rooms', roomsRouter);
  app.use('/media', mediaRouter);
  app.use('/notifications', notificationsRouter);
  app.use('/users', usersRouter);
  app.use('/admin', adminRouter);

  app.get('/', (_req, res) => {
    res.json({
      ok: true,
      service: 'soulsync-api',
      health: '/health'
    });
  });

  app.use((req, res) => {
    res.status(404).json({ error: 'NOT_FOUND', path: req.path });
  });

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      res.status(400).json({ error: 'VALIDATION_ERROR', details: error.flatten() });
      return;
    }

    const message = error instanceof Error ? error.message : 'INTERNAL_ERROR';
    const status = message.includes('NOT_FOUND') ? 404 : message.includes('PASSWORD') ? 403 : 500;
    res.status(status).json({ error: message });
  });

  return app;
}
