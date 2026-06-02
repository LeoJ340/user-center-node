import { createHash } from 'node:crypto'
import bcrypt from 'bcryptjs'

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(plain: string, hashed: string) {
  return bcrypt.compare(plain, hashed)
}
