import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // 当前仅保留最小健康检查数据，后续业务模块不要继续堆在 AppService。
  getHealth() {
    return {
      status: 'ok',
      service: '@user-center/nest',
      timestamp: new Date().toISOString(),
    };
  }
}
