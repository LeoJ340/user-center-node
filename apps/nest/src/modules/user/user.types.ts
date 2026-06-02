import type { User } from '@generated/prisma/client'

export type SafeUser = Omit<User, 'userPassword'>

export function toSafeUser(user: User): SafeUser {
  const { userPassword: _userPassword, ...safeUser } = user
  return safeUser
}
