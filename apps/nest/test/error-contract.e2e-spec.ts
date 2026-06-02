import request from 'supertest'
import { createE2eContext, type E2eContext } from './helpers/e2e-app.factory'
import { expectRestContract } from './helpers/contract'

describe('Error Contract (e2e)', () => {
  let ctx: E2eContext

  beforeEach(async () => {
    ctx = await createE2eContext()
  })

  afterEach(async () => {
    await ctx.app.close()
  })

  it('/error should reject unauthenticated request', () => {
    return request(ctx.app.getHttpServer())
      .get(`${ctx.apiPrefix}/error`)
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 401,
          message: '未登录',
          data: null,
        })
      })
  })

  it('/error should return business bad request for authenticated user', async () => {
    const loginResponse = await request(ctx.app.getHttpServer())
      .post(`${ctx.apiPrefix}/auth/login`)
      .send({ account: ctx.testUser.userAccount, password: '123456' })
      .expect(200)
    const accessToken = loginResponse.body.data.accessToken as string

    await request(ctx.app.getHttpServer())
      .get(`${ctx.apiPrefix}/error`)
      .set('authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 400,
          message: '123',
          data: null,
        })
      })
  })
})
