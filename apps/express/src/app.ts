import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import cookieParser from 'cookie-parser';

import { config } from '@/config';
import { logger } from '@/config/logger';
import { requestId } from '@/middlewares/requestId';
import { errorHandler } from '@/middlewares/errorHandler';
import { notFound } from '@/middlewares/notFound';
import { apiRouter } from '@/routes';

export function createApp() {
  const app = express();

  // 禁用 X-Powered-By 头
  app.disable('x-powered-by');

  // 请求 ID
  app.use(requestId);
  // 日志
  app.use(
    pinoHttp({
      logger,
      customProps: (req, res) => ({
        requestId: (res as any).locals?.requestId,
        method: req.method,
        url: req.url,
      }),
    }),
  );

  // 安全头
  app.use(helmet());
  // CORS
  const allowedOrigins = config.cors.origin
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );
  // 解析 JSON 请求体
  app.use(express.json({ limit: '1mb' }));
  // 解析 Cookie
  app.use(cookieParser());

  app.use('/api/v1', apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
