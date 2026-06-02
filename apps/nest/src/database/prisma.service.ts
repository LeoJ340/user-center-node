import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@prisma/client'
import { config } from '@/config'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    // Prisma v7（engineType=client）要求通过 adapter 显式提供数据库连接。
    const adapter = new PrismaMariaDb({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.pass,
      database: config.db.name,
      connectionLimit: config.db.pool.max,
    })
    super({ adapter })
  }

  // Prisma 会在首次查询时懒连接数据库，避免健康检查和单元测试强依赖 DB 可用。
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
