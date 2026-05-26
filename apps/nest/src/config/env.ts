import path from 'node:path';
import dotenv from 'dotenv';
import { z } from 'zod';

const nodeEnv = process.env.NODE_ENV ?? 'development';

// 优先加载当前环境文件，再加载通用 .env，便于本地按环境覆盖。
dotenv.config({ path: path.resolve(process.cwd(), `.env.${nodeEnv}`) });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// z.coerce.boolean() 会把字符串 "false" 转成 true，这里显式处理布尔环境变量。
const booleanEnv = z.preprocess((value) => {
  if (typeof value !== 'string') return value;
  if (value.toLowerCase() === 'true') return true;
  if (value.toLowerCase() === 'false') return false;
  return value;
}, z.boolean());

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),
  API_PREFIX: z.string().trim().min(1).default('api/v1'),
  CORS_ORIGIN: z.string().trim().min(1).default('http://localhost:5173'),
  COOKIE_SECURE: booleanEnv.default(false),
  BODY_LIMIT: z.string().trim().min(1).default('1mb'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // 配置加载发生在 Nest 启动之前，这里不能依赖 Nest Logger。
  console.error(
    'Environment validation failed:\n',
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2),
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
