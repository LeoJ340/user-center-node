import { Injectable } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    })
  }

  findByLogin(accountOrEmailOrPhone: string) {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          { userAccount: accountOrEmailOrPhone },
          { email: accountOrEmailOrPhone },
          { phone: accountOrEmailOrPhone },
        ],
      },
    })
  }
}
