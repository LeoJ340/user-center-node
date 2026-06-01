import type { NextFunction, Request, Response } from 'express'
import { AppError } from '@/utils/errors'
import { verifyAccessToken } from '@/utils/jwt'

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? req.header('Authorization')
  if (!header) return next(new AppError('未登录', 401))

  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return next(new AppError('未登录', 401))

  try {
    const payload = verifyAccessToken(token)
    if (payload.type !== 'access') return next(new AppError('未登录', 401))
    req.user = { userId: payload.sub, sid: payload.sid }
    return next()
  } catch {
    return next(new AppError('登录已过期', 401))
  }
}

export function authorize(check: (req: Request) => boolean, message = '无权限') {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError('未登录', 401))
    if (!check(req)) return next(new AppError(message, 403))
    return next()
  }
}
