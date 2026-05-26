import { createClient } from 'redis';
import { config } from '@/config';
import { logger } from '@/config/logger';

export const redis = createClient({ url: config.redis.url });

redis.on('error', (err) => {
  logger.warn({ err }, 'Redis error');
});

redis.on('connect', () => logger.info('Redis connected'));

export async function connectRedis() {
  if (redis.isOpen) return;
  try {
    await redis.connect();
    // Redis Cloud 常见问题：未配置密码时，connect 可能成功，但执行命令会报 NOAUTH。
    // 这里用 PING 提前把鉴权/可用性问题暴露出来，避免业务层误判。
    await redis.ping();
  } catch (err) {
    logger.warn({ err }, 'Redis connect/ping failed');
    try {
      if (redis.isOpen) await redis.disconnect();
    } catch {
      // ignore
    }
    throw err;
  }
}

export async function closeRedis() {
  if (!redis.isOpen) return;
  try {
    await redis.quit();
  } catch (err) {
    logger.warn({ err }, 'Redis quit failed');
  } finally {
    if (!redis.isOpen) return;
    try {
      await redis.disconnect();
    } catch (err) {
      logger.warn({ err }, 'Redis disconnect failed');
    }
  }
}
