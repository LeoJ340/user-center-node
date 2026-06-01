import test from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'crypto'
import { signRefreshToken, verifyRefreshToken } from '@/utils/jwt'
import { hashPassword, verifyPassword } from '@/utils/authCrypto'

test('password', async () => {
  const plainPassword = '123456'
  const wrongPassword = 'Wrong_Password_123456'

  const hashedPassword = await hashPassword(plainPassword)
  console.log(hashedPassword)

  assert.notEqual(hashedPassword, plainPassword, 'Hashed password should not equal plain text')
  assert.ok(
    await verifyPassword(plainPassword, hashedPassword),
    'Correct password should pass verification',
  )
  assert.equal(
    await verifyPassword(wrongPassword, hashedPassword),
    false,
    'Wrong password should fail verification',
  )
})

test('Redis EX', () => {
  const userId = 'd58528ed-16b3-11f1-86a0-3c9c0f8ef061'
  const sid = randomUUID()
  const refreshToken = signRefreshToken({ sub: userId, sid })
  const payload = verifyRefreshToken(refreshToken) as any
  const nowSec = Math.floor(Date.now() / 1000)
  /**
   * payload.exp：token 过期时间戳（秒）
   * nowSec：当前时间戳（秒）
   * exp - nowSec：token 过期时间减去当前时间（距离过期还剩多少秒）
   * Math.max(1, ...)：最小给 1 秒，避免出现 0 或负数导致 Redis EX 不合法/立即失效
   */
  const ttl = Math.max(1, Number(payload.exp ?? nowSec + 7 * 24 * 3600) - nowSec)
  console.log(payload)
  assert.ok(ttl > 0, 'TTL should be positive')
})
