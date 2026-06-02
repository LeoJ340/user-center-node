import { Injectable, NotFoundException } from '@nestjs/common'
import { UserRepository } from './user.repository'
import { SafeUser, toSafeUser } from './user.types'

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async getUserById(id: string): Promise<SafeUser> {
    const user = await this.userRepository.findById(id)
    if (!user) throw new NotFoundException('用户不存在')
    return toSafeUser(user)
  }
}
