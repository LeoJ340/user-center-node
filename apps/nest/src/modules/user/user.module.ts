import { Module } from '@nestjs/common'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'
import { UserController } from './user.controller'
import { UserRepository } from './user.repository'
import { UserService } from './user.service'

@Module({
  controllers: [UserController],
  providers: [AccessTokenGuard, UserRepository, UserService],
  exports: [UserService, UserRepository],
})
export class UserModule {}
