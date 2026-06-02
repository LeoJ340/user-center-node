import request from 'supertest'
import { createE2eContext, type E2eContext } from './helpers/e2e-app.factory'
import { expectRestContract } from './helpers/contract'

describe('Health Contract (e2e)', () => {
  let ctx: E2eContext

  beforeEach(async () => {
    ctx = await createE2eContext()
  })

  afterEach(async () => {
    await ctx.app.close()
  })

  it('/health should follow success contract', () => {
    return request(ctx.app.getHttpServer())
      .get(`${ctx.apiPrefix}/health`)
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 200,
          message: '',
          data: {
            status: 'ok',
            service: '@user-center/nest',
          },
        })
      })
  })

  it('not-exists route should return not-found business code', () => {
    return request(ctx.app.getHttpServer())
      .get(`${ctx.apiPrefix}/not-exists`)
      .expect(200)
      .expect(({ body }) => {
        expectRestContract(body, {
          code: 404,
          message: '接口不存在',
          data: null,
        })
      })
  })
})
