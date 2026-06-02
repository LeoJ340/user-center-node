import { BadRequestException, Controller, Get, UseGuards } from '@nestjs/common'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'

@Controller('error')
export class ErrorController {
  @Get()
  @UseGuards(AccessTokenGuard)
  throwError() {
    throw new BadRequestException('123')
  }
}
