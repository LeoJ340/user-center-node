import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@generated/prisma/client'
import { config } from '@/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    // Prisma v7（engineType=client）要求通过 adapter 显式提供数据库连接。
    // 统一从 DATABASE_URL 解析连接信息，避免 CLI 与 runtime 配置分叉。
    const dbUrl = new URL(config.db.url)
    const adapter = new PrismaMariaDb({
      host: dbUrl.hostname,
      port: Number(dbUrl.port || 3306),
      user: decodeURIComponent(dbUrl.username),
      password: decodeURIComponent(dbUrl.password),
      database: decodeURIComponent(dbUrl.pathname.replace(/^\/+/, '')),
      connectionLimit: config.db.pool.max,
      acquireTimeout: config.db.pool.acquire,
    })
    super({ adapter })
  }

  // Prisma 会在首次查询时懒连接数据库，避免健康检查和单元测试强依赖 DB 可用。
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
