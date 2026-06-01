import { z } from 'zod'

export const userSchema = z.object({
  id: z.string().trim().uuid().optional(),
  nickname: z.string().trim().min(1).max(255).optional(),
  userAccount: z.string().trim().min(1).max(255).optional(),
  avatar: z.string().trim().max(255).optional(),
  gender: z.number().int().optional(),
  userPassword: z.string().min(8).max(255).optional(),
  phone: z.string().trim().min(3).max(32).optional(),
  email: z.string().trim().email().optional(),
  userStatus: z.number().int().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
  deleted: z.number().int().optional(),
})

export const safeUserSchema = userSchema.omit({ userPassword: true }).strict()

export type User = z.infer<typeof userSchema>
export type SafeUser = z.infer<typeof safeUserSchema>
