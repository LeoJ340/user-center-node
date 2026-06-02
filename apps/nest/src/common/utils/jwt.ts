import jwt, { type SignOptions } from 'jsonwebtoken'
import { config } from '@/config'

export type AccessTokenPayload = {
  sub: string
  sid: string
  type: 'access'
}

export type RefreshTokenPayload = {
  sub: string
  sid: string
  type: 'refresh'
}

export type VerifiedRefreshTokenPayload = RefreshTokenPayload & {
  exp?: number
}

export function signAccessToken(payload: Omit<AccessTokenPayload, 'type'>) {
  const options: SignOptions = {
    expiresIn: config.auth.accessExpiresIn as unknown as SignOptions['expiresIn'],
  }

  return jwt.sign(
    { ...payload, type: 'access' } satisfies AccessTokenPayload,
    config.auth.accessSecret,
    options,
  )
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>) {
  const options: SignOptions = {
    expiresIn: config.auth.refreshExpiresIn as unknown as SignOptions['expiresIn'],
  }

  return jwt.sign(
    { ...payload, type: 'refresh' } satisfies RefreshTokenPayload,
    config.auth.refreshSecret,
    options,
  )
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, config.auth.accessSecret) as AccessTokenPayload
}

export function verifyRefreshToken(token: string) {
  return jwt.verify(token, config.auth.refreshSecret) as VerifiedRefreshTokenPayload
}
