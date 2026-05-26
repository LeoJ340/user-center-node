import { env } from './env';

// 对外只暴露整理后的配置对象，业务代码避免直接读取 process.env。
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  logLevel: env.LOG_LEVEL,
  http: {
    apiPrefix: env.API_PREFIX.replace(/^\/+|\/+$/g, ''),
    bodyLimit: env.BODY_LIMIT,
  },
  cors: {
    origin: env.CORS_ORIGIN,
  },
  cookie: {
    secure: env.COOKIE_SECURE,
  },
} as const;
