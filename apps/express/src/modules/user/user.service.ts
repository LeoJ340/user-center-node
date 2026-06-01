import { AppError } from '@/utils/errors'
import { userRepo } from './user.repo'

export const userService = {
  async getUserById(id: number | string) {
    const user = await userRepo.findById(id)
    if (!user) throw new AppError('用户不存在')
    return user
  },
}
