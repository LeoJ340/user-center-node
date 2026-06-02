import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import { hashToken, verifyPassword } from '@/common/utils/authCrypto'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@/common/utils/jwt'
import { UserRepository } from '@/modules/user/user.repository'
import { SafeUser, toSafeUser } from '@/modules/user/user.types'
import { RefreshStoreService } from './services/refresh-store.service'

export const REFRESH_COOKIE_NAME = 'refresh_token'

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshStore: RefreshStoreService,
  ) {}

  async login(account: string, password: string) {
    const user = await this.userRepository.findByLogin(account)
    if (!user) throw new UnauthorizedException('账号或密码错误')
    if (user.userStatus !== 0) throw new ForbiddenException('用户状态异常')
    if (user.deleted !== 0) throw new NotFoundException('用户不存在')

    const ok = await verifyPassword(password, user.userPassword)
    if (!ok) throw new UnauthorizedException('账号或密码错误')

    const userId = String(user.id)
    // sid 用于把 Access/Refresh 绑定到同一次“登录会话”。
    // 当前方案不做多端管理，但保留 sid 有利于后续扩展（例如踢下线/会话表）。
    const sid = randomUUID()
    const refreshToken = signRefreshToken({ sub: userId, sid })
    const accessToken = signAccessToken({ sub: userId, sid })
    const ttl = this.getRefreshTokenTtl(refreshToken)

    try {
      await this.refreshStore.set(userId, { sid, hash: hashToken(refreshToken) }, ttl)
    } catch (err) {
      throw this.mapRedisError(err)
    }

    return {
      accessToken,
      refreshToken,
      user: toSafeUser(user),
    }
  }

  async refresh(refreshToken: string) {
    let payload: ReturnType<typeof verifyRefreshToken>
    try {
      payload = verifyRefreshToken(refreshToken)
    } catch {
      throw new UnauthorizedException('登录已过期')
    }
    if (payload.type !== 'refresh') throw new UnauthorizedException('登录已过期')

    const userId = String(payload.sub)
    let stored: { sid: string; hash: string } | null

    try {
      stored = await this.refreshStore.get(userId)
    } catch (err) {
      throw this.mapRedisError(err)
    }

    if (!stored) throw new UnauthorizedException('登录已过期')

    const incomingHash = hashToken(refreshToken)
    if (stored.sid !== payload.sid || stored.hash !== incomingHash) {
      throw new UnauthorizedException('登录已过期')
    }

    const sid = String(payload.sid)
    const newRefreshToken = signRefreshToken({ sub: userId, sid })
    const newAccessToken = signAccessToken({ sub: userId, sid })
    const ttl = this.getRefreshTokenTtl(newRefreshToken)

    try {
      // Refresh Token 旋转：覆盖存储 hash，使旧 refreshToken 立即失效。
      await this.refreshStore.set(userId, { sid, hash: hashToken(newRefreshToken) }, ttl)
    } catch (err) {
      throw this.mapRedisError(err)
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    }
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) return

    try {
      const payload = verifyRefreshToken(refreshToken)
      await this.refreshStore.del(String(payload.sub))
    } catch {
      // Ignore invalid refresh token and Redis cleanup errors on logout.
    }
  }

  async me(userId: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(userId)
    if (!user) throw new NotFoundException('用户不存在')
    return toSafeUser(user)
  }

  /**
   * payload.exp：token 过期时间戳（秒）
   * nowSec：当前时间戳（秒）
   * payload.exp - nowSec：token 过期时间减去当前时间（距离过期还剩多少秒）
   * Math.max(1, ...)：最小给 1 秒，避免出现 0 或负数导致 Redis EX 不合法/立即失效
   */
  private getRefreshTokenTtl(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    const nowSec = Math.floor(Date.now() / 1000)
    return Math.max(1, Number(payload.exp ?? nowSec + 7 * 24 * 3600) - nowSec)
  }

  private mapRedisError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('NOAUTH')) {
      return new ServiceUnavailableException('Redis鉴权失败（请检查密码/用户名）')
    }
    if (message.includes('WRONGPASS')) {
      return new ServiceUnavailableException('Redis鉴权失败（密码错误）')
    }
    if (
      message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT')
    ) {
      return new ServiceUnavailableException('Redis不可用（网络或地址不可达）')
    }
    return new ServiceUnavailableException('Redis不可用')
  }
}
