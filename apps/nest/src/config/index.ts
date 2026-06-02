import { env } from './env'

function buildRedisUrl() {
  if (env.REDIS_URL) return env.REDIS_URL

  const host = env.REDIS_HOST ?? '127.0.0.1'
  const port = env.REDIS_PORT ?? 6379
  const username = env.REDIS_USERNAME
  const password = env.REDIS_PASSWORD

  if (password == null || password === '') {
    return `redis://${host}:${port}`
  }

  const encodedPassword = encodeURIComponent(password)
  const auth = username
    ? `${encodeURIComponent(username)}:${encodedPassword}`
    : `:${encodedPassword}`

  return `redis://${auth}@${host}:${port}`
}

const databaseUrl = env.DATABASE_URL
const parsedDatabaseUrl = new URL(databaseUrl)
const parsedDatabaseName = decodeURIComponent(parsedDatabaseUrl.pathname.replace(/^\/+/, ''))
const parsedDatabaseUser = decodeURIComponent(parsedDatabaseUrl.username)
const parsedDatabasePass = decodeURIComponent(parsedDatabaseUrl.password)
const parsedDatabasePort = Number(parsedDatabaseUrl.port || 3306)
const poolTimeoutSec = Math.max(1, Math.ceil(env.DB_POOL_ACQUIRE / 1000))

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
  db: {
    url: databaseUrl,
    host: parsedDatabaseUrl.hostname,
    port: parsedDatabasePort,
    user: parsedDatabaseUser,
    pass: parsedDatabasePass,
    name: parsedDatabaseName,
    pool: {
      max: Number(parsedDatabaseUrl.searchParams.get('connection_limit') ?? env.DB_POOL_MAX),
      min: env.DB_POOL_MIN,
      acquire: Number(parsedDatabaseUrl.searchParams.get('pool_timeout') ?? poolTimeoutSec) * 1000,
      idle: env.DB_POOL_IDLE,
    },
  },
  auth: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    url: buildRedisUrl(),
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    username: env.REDIS_USERNAME,
    password: env.REDIS_PASSWORD,
  },
} as const
