import request from 'supertest'
import { signRefreshToken, verifyRefreshToken } from '@/common/utils/jwt'
import { createE2eContext, type E2eContext } from './helpers/e2e-app.factory'
import { expectRestContract } from './helpers/contract'

describe('Auth Contract (e2e)', () => {
  let ctx: E2eContext

  beforeEach(async () => {
    ctx = await createE2eContext()
  })

  afterEach(async () => {
    await ctx.app.close()
  })

  it('/auth/refresh should reject unauthenticated', () => {
    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/refresh`)
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 401,
          message: '未登录',
          data: null,
        })
      })
  })

  it('/auth/login should fail validation when body is empty', () => {
    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/login`)
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 400,
          message: '参数校验失败',
          data: null,
        })
      })
  })

  it('/auth/login should reject invalid password', () => {
    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/login`)
      .send({ account: ctx.testUser.userAccount, password: 'wrong-password' })
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 401,
          message: '账号或密码错误',
          data: null,
        })
      })
  })

  it('/auth/login should reject disabled user', () => {
    ctx.setCurrentLoginUser({ ...ctx.testUser, userStatus: 1 })

    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/login`)
      .send({ account: ctx.testUser.userAccount, password: '123456' })
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 403,
          message: '用户状态异常',
          data: null,
        })
      })
  })

  it('/auth/login should reject deleted user', () => {
    ctx.setCurrentLoginUser({ ...ctx.testUser, deleted: 1 })

    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/login`)
      .send({ account: ctx.testUser.userAccount, password: '123456' })
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 404,
          message: '用户不存在',
          data: null,
        })
      })
  })

  it('/auth/logout should return success without token', () => {
    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/logout`)
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 200,
          message: '',
          data: null,
        })
      })
  })

  it('/auth/refresh should reject expired or unknown refresh token', () => {
    const refreshToken = signRefreshToken({
      sub: ctx.testUser.id,
      sid: '4f155411-cd33-4bf1-b014-b00ad40b883c',
    })

    return request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/refresh`)
      .send({ refreshToken })
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 401,
          message: '登录已过期',
          data: null,
        })
      })
  })

  it('/auth/me should reject malformed access token', () => {
    return request(ctx.app.getHttpServer())
      .get(`${ctx.apiPrefix}/auth/me`)
      .set('authorization', 'Bearer malformed.jwt.token')
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 401,
          message: '登录已过期',
          data: null,
        })
      })
  })

  it('login -> me -> refresh -> logout flow should pass', async () => {
    const agent = request.agent(ctx.app.getHttpServer())

    const loginResponse = await agent
      .post(`${ctx.apiPrefix}/auth/login`)
      .send({ account: ctx.testUser.userAccount, password: '123456' })
      .expect(200)

    expect(loginResponse.body).toMatchObject({
      code: 200,
      message: '',
      data: {
        accessToken: expect.any(String),
        user: {
          id: ctx.testUser.id,
          userAccount: ctx.testUser.userAccount,
          email: ctx.testUser.email,
        },
      },
    })
    expectRestContract(loginResponse.body, { code: 200, message: '' })
    expect(loginResponse.body.data.user).not.toHaveProperty('userPassword')

    const accessToken = loginResponse.body.data.accessToken as string

    await agent
      .get(`${ctx.apiPrefix}/auth/me`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 200,
          message: '',
          data: {
            id: ctx.testUser.id,
            userAccount: ctx.testUser.userAccount,
            email: ctx.testUser.email,
          },
        })
      })

    const refreshResponse = await agent.post(`${ctx.apiPrefix}/auth/refresh`).send({}).expect(200)
    expectRestContract(refreshResponse.body, {
      code: 200,
      message: '',
      data: { accessToken: expect.any(String) },
    })

    const refreshTokenFromSetCookie = refreshResponse.headers['set-cookie']
      ?.find((cookie: string) => cookie.startsWith('refresh_token='))
      ?.split(';')[0]
      .split('=')[1]

    expect(refreshTokenFromSetCookie).toEqual(expect.any(String))
    const refreshPayload = verifyRefreshToken(refreshTokenFromSetCookie as string)
    expect(refreshPayload.sub).toBe(ctx.testUser.id)

    await agent
      .post(`${ctx.apiPrefix}/auth/logout`)
      .send({})
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 200,
          message: '',
          data: null,
        })
      })

    expect(ctx.mockRefreshStore.del).toHaveBeenCalledWith(ctx.testUser.id)
  })
})
