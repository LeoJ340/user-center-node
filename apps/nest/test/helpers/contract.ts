const CONTRACT_MESSAGES = [
  '',
  '未登录',
  '登录已过期',
  '参数校验失败',
  '账号或密码错误',
  '用户状态异常',
  '用户不存在',
  '接口不存在',
  '123',
  '服务器内部错误',
] as const

type ContractMessage = (typeof CONTRACT_MESSAGES)[number]

export function expectRestContract(
  body: unknown,
  expected: {
    code: number
    message: ContractMessage
    data?: unknown
  },
) {
  const response = body as Record<string, unknown>
  expect(Object.keys(response).sort()).toEqual(['code', 'data', 'message', 'requestId'])
  expect(response.code).toBe(expected.code)
  expect(response.message).toBe(expected.message)
  expect(CONTRACT_MESSAGES).toContain(response.message as ContractMessage)
  expect(response.requestId).toEqual(expect.any(String))

  if (expected.data === null) {
    expect(response.data).toBeNull()
    return
  }

  if (expected.data !== undefined) {
    expect(response.data).toMatchObject(expected.data as Record<string, unknown>)
  }
}
