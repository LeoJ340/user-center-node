import { Controller, Get, Param, UseGuards } from '@nestjs/common'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'
import { UserService } from './user.service'

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(AccessTokenGuard)
  getById(@Param('id') id: string) {
    return this.userService.getUserById(id)
  }
}
