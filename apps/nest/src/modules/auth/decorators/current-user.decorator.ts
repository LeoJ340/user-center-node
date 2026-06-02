import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { Request } from 'express'
import type { AuthUser } from '../types/auth-user.type'

type AuthRequest = Request & {
  user?: AuthUser
}

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<AuthRequest>()
  return request.user
})
