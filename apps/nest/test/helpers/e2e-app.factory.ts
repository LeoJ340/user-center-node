import { Test } from '@nestjs/testing'
import { BadRequestException, INestApplication, ValidationPipe } from '@nestjs/common'
import type { User } from '@prisma/client'
import cookieParser from 'cookie-parser'
import { App } from 'supertest/types'
import { AppModule } from '@/app.module'
import { hashPassword } from '@/common/utils/authCrypto'
import { GlobalExceptionFilter } from '@/common/filters/global-exception.filter'
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor'
import { config } from '@/config'
import { UserRepository } from '@/modules/user/user.repository'
import { RefreshStoreService } from '@/modules/auth/services/refresh-store.service'

export type E2eContext = {
  app: INestApplication<App>
  apiPrefix: string
  testUser: User
  setCurrentLoginUser: (user: User | null) => void
  mockUserRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'findByLogin'>>
  mockRefreshStore: jest.Mocked<Pick<RefreshStoreService, 'del' | 'get' | 'set'>>
}

export async function createE2eContext(): Promise<E2eContext> {
  const userPassword = await hashPassword('123456')
  const testUser: User = {
    id: 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061',
    nickname: 'leo',
    userAccount: 'leo',
    avatar: null,
    gender: null,
    userPassword,
    phone: null,
    email: 'leo@example.com',
    userStatus: 0,
    deleted: 0,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  }

  let currentLoginUser: User | null = testUser
  const refreshState = new Map<string, { sid: string; hash: string }>()
  const setCurrentLoginUser = (user: User | null) => {
    currentLoginUser = user
  }

  const mockUserRepository: jest.Mocked<Pick<UserRepository, 'findById' | 'findByLogin'>> = {
    findById: jest.fn(async (id: string) => {
      if (id === testUser.id) return testUser
      return null
    }),
    findByLogin: jest.fn(async (account: string) => {
      if (!currentLoginUser) return null
      if (
        [currentLoginUser.userAccount, currentLoginUser.email, currentLoginUser.phone].includes(
          account,
        )
      ) {
        return currentLoginUser
      }
      return null
    }),
  }

  const mockRefreshStore: jest.Mocked<Pick<RefreshStoreService, 'del' | 'get' | 'set'>> = {
    get: jest.fn(async (userId: string) => refreshState.get(userId) ?? null),
    set: jest.fn(async (userId: string, stored: { sid: string; hash: string }, _ttlSec: number) => {
      refreshState.set(userId, stored)
    }),
    del: jest.fn(async (userId: string) => {
      refreshState.delete(userId)
    }),
  }

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(UserRepository)
    .useValue(mockUserRepository)
    .overrideProvider(RefreshStoreService)
    .useValue(mockRefreshStore)
    .compile()

  const app = moduleFixture.createNestApplication()
  app.setGlobalPrefix(config.http.apiPrefix)
  app.use(cookieParser())
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: () => new BadRequestException('参数校验失败'),
    }),
  )
  app.useGlobalFilters(new GlobalExceptionFilter())
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()

  return {
    app,
    apiPrefix: `/${config.http.apiPrefix}`,
    testUser,
    setCurrentLoginUser,
    mockUserRepository,
    mockRefreshStore,
  }
}
