import { connectRedis, redis } from "@/db/redis";

type Stored = { sid: string; hash: string };

const redisKeyForUser = (userId: string) => `auth:rt:user:${userId}`;

async function ensureRedisReady() {
  await connectRedis();
  if (!redis.isReady) {
    throw new Error("Redis not ready");
  }
}

export const refreshStore = {
  async get(userId: string): Promise<Stored | null> {
    // 强依赖 Redis：确保 refresh 状态可撤销、可旋转。
    await ensureRedisReady();

    const v = await redis.get(redisKeyForUser(userId));
    if (!v) return null;
    try {
      return JSON.parse(v) as Stored;
    } catch {
      return null;
    }
  },

  async set(userId: string, stored: Stored, ttlSec: number) {
    await ensureRedisReady();
    // 使用 Redis TTL 保证 refresh 自动过期清理。
    await redis.set(redisKeyForUser(userId), JSON.stringify(stored), { EX: ttlSec });
  },

  async del(userId: string) {
    await ensureRedisReady();
    await redis.del(redisKeyForUser(userId));
  },
};

