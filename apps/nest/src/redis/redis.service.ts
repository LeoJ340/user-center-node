import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { createClient, type RedisClientType } from 'redis'
import { config } from '@/config'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: RedisClientType = createClient({ url: config.redis.url })

  constructor() {
    this.client.on('error', (err) => {
      this.logger.warn(`Redis error: ${err instanceof Error ? err.message : String(err)}`)
    })
  }

  async get(key: string) {
    await this.ensureReady()
    return this.client.get(key)
  }

  async setEx(key: string, value: string, ttlSec: number) {
    await this.ensureReady()
    await this.client.set(key, value, { EX: ttlSec })
  }

  async del(key: string) {
    await this.ensureReady()
    await this.client.del(key)
  }

  async onModuleDestroy() {
    if (!this.client.isOpen) return
    await this.client.quit()
  }

  private async ensureReady() {
    if (!this.client.isOpen) {
      await this.client.connect()
      await this.client.ping()
    }

    if (!this.client.isReady) {
      throw new Error('Redis not ready')
    }
  }
}
