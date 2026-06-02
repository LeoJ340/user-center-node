import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  // Prisma 会在首次查询时懒连接数据库，避免健康检查和单元测试强依赖 DB 可用。
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
