import { env } from './env'

function buildDatabaseUrl() {
  if (env.DATABASE_URL) return env.DATABASE_URL

  const auth = `${encodeURIComponent(env.DB_USER)}:${encodeURIComponent(env.DB_PASS)}`
  const database = encodeURIComponent(env.DB_NAME)
  const poolTimeoutSec = Math.max(1, Math.ceil(env.DB_POOL_ACQUIRE / 1000))
  const params = new URLSearchParams({
    connection_limit: String(env.DB_POOL_MAX),
    pool_timeout: String(poolTimeoutSec),
  })

  return `mysql://${auth}@${env.DB_HOST}:${env.DB_PORT}/${database}?${params.toString()}`
}

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

const databaseUrl = buildDatabaseUrl()
process.env.DATABASE_URL = databaseUrl

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
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    pass: env.DB_PASS,
    name: env.DB_NAME,
    pool: {
      max: env.DB_POOL_MAX,
      min: env.DB_POOL_MIN,
      acquire: env.DB_POOL_ACQUIRE,
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
