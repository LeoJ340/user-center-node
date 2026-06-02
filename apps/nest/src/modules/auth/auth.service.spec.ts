import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common'
import type { User } from '@prisma/client'
import { hashPassword, hashToken } from '@/common/utils/authCrypto'
import { signRefreshToken } from '@/common/utils/jwt'
import { UserRepository } from '@/modules/user/user.repository'
import { AuthService } from './auth.service'
import { RefreshStoreService } from './services/refresh-store.service'

describe('AuthService', () => {
  let authService: AuthService
  let userRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'findByLogin'>>
  let refreshStore: jest.Mocked<Pick<RefreshStoreService, 'del' | 'get' | 'set'>>

  const baseUser = {
    id: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
    nickname: 'leo',
    userAccount: 'leo',
    avatar: null,
    gender: null,
    userPassword: 'hashed-password',
    phone: null,
    email: 'leo@example.com',
    userStatus: 0,
    deleted: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  } satisfies User

  beforeEach(() => {
    userRepository = {
      findById: jest.fn(),
      findByLogin: jest.fn(),
    }
    refreshStore = {
      del: jest.fn(),
      get: jest.fn(),
      set: jest.fn(),
    }

    authService = new AuthService(
      userRepository as unknown as UserRepository,
      refreshStore as unknown as RefreshStoreService,
    )
  })

  it('logs in and stores hashed refresh token', async () => {
    const hashedPassword = await hashPassword('123456')
    userRepository.findByLogin.mockResolvedValue({
      ...baseUser,
      userPassword: hashedPassword,
    })

    const result = await authService.login('leo', '123456')

    expect(result.accessToken).toEqual(expect.any(String))
    expect(result.refreshToken).toEqual(expect.any(String))
    expect(result.user).toMatchObject({
      id: baseUser.id,
      userAccount: baseUser.userAccount,
      email: baseUser.email,
    })
    expect(result.user).not.toHaveProperty('userPassword')
    expect(refreshStore.set).toHaveBeenCalledWith(
      baseUser.id,
      expect.objectContaining({
        hash: hashToken(result.refreshToken),
      }),
      expect.any(Number),
    )
  })

  it('rejects invalid login credentials', async () => {
    const hashedPassword = await hashPassword('123456')
    userRepository.findByLogin.mockResolvedValue({
      ...baseUser,
      userPassword: hashedPassword,
    })

    await expect(authService.login('leo', 'wrong-password')).rejects.toBeInstanceOf(
      UnauthorizedException,
    )
  })

  it('rejects disabled and deleted users', async () => {
    userRepository.findByLogin.mockResolvedValue({
      ...baseUser,
      userStatus: 1,
    })
    await expect(authService.login('leo', '123456')).rejects.toBeInstanceOf(ForbiddenException)

    userRepository.findByLogin.mockResolvedValue({
      ...baseUser,
      deleted: 1,
    })
    await expect(authService.login('leo', '123456')).rejects.toBeInstanceOf(NotFoundException)
  })

  it('rotates refresh token when stored hash matches', async () => {
    const sid = '4f155411-cd33-4bf1-b014-b00ad40b883c'
    const refreshToken = signRefreshToken({ sub: baseUser.id, sid })
    refreshStore.get.mockResolvedValue({
      sid,
      hash: hashToken(refreshToken),
    })

    const result = await authService.refresh(refreshToken)

    expect(result.accessToken).toEqual(expect.any(String))
    expect(result.refreshToken).toEqual(expect.any(String))
    expect(refreshStore.set).toHaveBeenCalledWith(
      baseUser.id,
      expect.objectContaining({
        sid,
        hash: hashToken(result.refreshToken),
      }),
      expect.any(Number),
    )
  })

  it('rejects refresh token when Redis state is missing', async () => {
    const refreshToken = signRefreshToken({
      sub: baseUser.id,
      sid: '4f155411-cd33-4bf1-b014-b00ad40b883c',
    })
    refreshStore.get.mockResolvedValue(null)

    await expect(authService.refresh(refreshToken)).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('deletes refresh state on logout', async () => {
    const refreshToken = signRefreshToken({
      sub: baseUser.id,
      sid: '4f155411-cd33-4bf1-b014-b00ad40b883c',
    })

    await authService.logout(refreshToken)

    expect(refreshStore.del).toHaveBeenCalledWith(baseUser.id)
  })
})
