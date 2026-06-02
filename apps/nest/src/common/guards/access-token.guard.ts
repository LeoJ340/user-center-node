import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import type { Request } from 'express'
import { verifyAccessToken } from '@/common/utils/jwt'
import type { AuthUser } from '@/modules/auth/types/auth-user.type'

type AuthRequest = Request & {
  user?: AuthUser
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthRequest>()
    const header = request.header('authorization') ?? request.header('Authorization')
    if (!header) throw new UnauthorizedException('未登录')

    const [scheme, token] = header.split(' ')
    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('未登录')

    let payload: ReturnType<typeof verifyAccessToken>
    try {
      payload = verifyAccessToken(token)
    } catch {
      throw new UnauthorizedException('登录已过期')
    }

    if (payload.type !== 'access') throw new UnauthorizedException('未登录')
    request.user = { userId: payload.sub, sid: payload.sid }
    return true
  }
}
