import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import { config } from '@/config'
import { AccessTokenGuard } from '@/common/guards/access-token.guard'
import { CurrentUser } from './decorators/current-user.decorator'
import { AuthService, REFRESH_COOKIE_NAME } from './auth.service'
import { LoginDto } from './dto/login.dto'
import { RefreshTokenDto } from './dto/refresh-token.dto'
import type { AuthUser } from './types/auth-user.type'

function cookieOptions() {
  const refreshPath = `/${config.http.apiPrefix}/auth/refresh`
  return {
    httpOnly: true,
    secure: config.cookie.secure,
    sameSite: 'lax' as const,
    path: refreshPath,
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.authService.login(body.account, body.password)
    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions())

    return {
      accessToken: result.accessToken,
      user: result.user,
    }
  }

  @Post('refresh')
  async refresh(
    @Req() request: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      (request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? body.refreshToken

    if (!refreshToken) {
      throw new UnauthorizedException('未登录')
    }

    const result = await this.authService.refresh(refreshToken)
    response.cookie(REFRESH_COOKIE_NAME, result.refreshToken, cookieOptions())

    return {
      accessToken: result.accessToken,
    }
  }

  @Post('logout')
  async logout(
    @Req() request: Request,
    @Body() body: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken =
      (request.cookies?.[REFRESH_COOKIE_NAME] as string | undefined) ?? body.refreshToken

    await this.authService.logout(refreshToken)
    response.clearCookie(REFRESH_COOKIE_NAME, cookieOptions())
    return null
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user.userId)
  }
}
