import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  // 基础健康检查接口，用于验证 Nest 服务和全局 HTTP 配置是否正常。
  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}
