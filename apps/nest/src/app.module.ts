import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { Logger } from '@/common/middlewares/logger'
import { RequestId } from '@/common/middlewares/request-id'
import { PrismaModule } from '@/database/prisma.module'
import { RedisModule } from '@/redis/redis.module'
import { AuthModule } from '@/modules/auth/auth.module'
import { UserModule } from '@/modules/user/user.module'
import { ErrorModule } from '@/modules/error/error.module'

@Module({
  imports: [PrismaModule, RedisModule, UserModule, AuthModule, ErrorModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // 请求 ID 要先于日志中间件执行，这样每条请求日志都能带上 requestId。
    consumer.apply(RequestId, Logger).forRoutes('*')
  }
}
