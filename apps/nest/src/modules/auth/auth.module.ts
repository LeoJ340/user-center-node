import { Module } from '@nestjs/common'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'
import { UserModule } from '@/modules/user/user.module'
import { AuthController } from './auth.controller'
import { AuthService } from './auth.service'
import { RefreshStoreService } from './services/refresh-store.service'

@Module({
  imports: [UserModule],
  controllers: [AuthController],
  providers: [AuthService, AccessTokenGuard, RefreshStoreService],
  exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
