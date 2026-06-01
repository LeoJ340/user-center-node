import path from 'path'
import dotenv from 'dotenv'
import { z } from 'zod'

const nodeEnv = (process.env.NODE_ENV ?? 'development') as string
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`)
dotenv.config({ path: envFile })

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default('info'),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string().optional().default(''),
  DB_NAME: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(5),
  DB_POOL_MIN: z.coerce.number().int().min(0).default(0),
  DB_POOL_ACQUIRE: z.coerce.number().int().positive().default(30000),
  DB_POOL_IDLE: z.coerce.number().int().positive().default(10000),

  CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  COOKIE_SECURE: z.coerce.boolean().default(false),

  JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1).default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1).default('7d'),

  // Redis: 支持 REDIS_URL 或分段配置（host/port/username/password）
  REDIS_URL: z.string().min(1).optional(),
  REDIS_HOST: z.string().min(1).optional().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().int().positive().optional().default(6379),
  REDIS_USERNAME: z.string().min(1).optional(),
  REDIS_PASSWORD: z.string().optional(),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  console.error('环境变量校验失败：\n', JSON.stringify(parsed.error.flatten().fieldErrors, null, 2))
  process.exit(1)
}

export const env = parsed.data
export type Env = typeof env
