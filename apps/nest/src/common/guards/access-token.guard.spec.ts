import { ExecutionContext, UnauthorizedException } from '@nestjs/common'
import { signAccessToken, signRefreshToken } from '@/common/utils/jwt'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'

describe('AccessTokenGuard', () => {
  const guard = new AccessTokenGuard()

  function createContext(authorization?: string) {
    const request = {
      header: jest.fn((name: string) => {
        if (name.toLowerCase() !== 'authorization') return undefined
        return authorization
      }),
      user: undefined,
    }

    const context = {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext

    return { context, request }
  }

  it('accepts valid access token and attaches auth user', () => {
    const token = signAccessToken({
      sub: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
      sid: '4f155411-cd33-4bf1-b014-b00ad40b883c',
    })
    const { context, request } = createContext(`Bearer ${token}`)

    expect(guard.canActivate(context)).toBe(true)
    expect(request.user).toEqual({
      userId: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
      sid: '4f155411-cd33-4bf1-b014-b00ad40b883c',
    })
  })

  it('rejects missing token', () => {
    const { context } = createContext()

    expect(() => guard.canActivate(context)).toThrow(new UnauthorizedException('未登录'))
  })

  it('rejects refresh token', () => {
    const token = signRefreshToken({
      sub: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
      sid: '4f155411-cd33-4bf1-b014-b00ad40b883c',
    })
    const { context } = createContext(`Bearer ${token}`)

    expect(() => guard.canActivate(context)).toThrow(new UnauthorizedException('未登录'))
  })

  it('rejects malformed access token as expired login', () => {
    const { context } = createContext('Bearer malformed.jwt.token')

    expect(() => guard.canActivate(context)).toThrow(new UnauthorizedException('登录已过期'))
  })
})
