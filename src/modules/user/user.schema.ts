import { z } from "zod";

export const createUserSchema = z.object({
  userAccount: z.string().min(1).max(255).optional(),
  userPassword: z.string().min(1).max(255),
  nickname: z.string().max(255).optional(),
  avatar: z.string().max(255).optional(),
  gender: z.number().int().optional(),
  phone: z.string().max(255).optional(),
  email: z.string().email().optional(),
  userStatus: z.number().int().min(0).optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

