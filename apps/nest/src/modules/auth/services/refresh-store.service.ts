import { Injectable } from '@nestjs/common'
import { RedisService } from '@/redis/redis.service'

type StoredRefreshToken = {
  sid: string
  hash: string
}

@Injectable()
export class RefreshStoreService {
  constructor(private readonly redis: RedisService) {}

  private redisKeyForUser(userId: string) {
    return `auth:rt:user:${userId}`
  }

  async get(userId: string): Promise<StoredRefreshToken | null> {
    const value = await this.redis.get(this.redisKeyForUser(userId))
    if (!value) return null

    try {
      return JSON.parse(value) as StoredRefreshToken
    } catch {
      return null
    }
  }

  async set(userId: string, stored: StoredRefreshToken, ttlSec: number) {
    await this.redis.setEx(this.redisKeyForUser(userId), JSON.stringify(stored), ttlSec)
  }

  async del(userId: string) {
    await this.redis.del(this.redisKeyForUser(userId))
  }
}
