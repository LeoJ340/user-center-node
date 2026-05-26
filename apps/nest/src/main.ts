import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { config } from '@/config';
import { HttpExceptionFilter } from '@/common/filters/http-exception.filter';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  // 关闭 Nest 默认 body parser，下面手动注册，方便统一控制请求体大小。
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.setGlobalPrefix(config.http.apiPrefix);

  // HTTP 基础能力尽量集中在入口处，保持各业务模块只关注业务本身。
  app.use(helmet());
  app.enableCors({
    origin: (origin, callback) => {
      const allowedOrigins = config.cors.origin
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);

      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  });
  app.use(json({ limit: config.http.bodyLimit }));
  app.use(urlencoded({ extended: true, limit: config.http.bodyLimit }));
  app.use(cookieParser());

  // DTO 校验的全局默认策略：自动转换类型、剔除未声明字段，并拒绝多余字段。
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  // 全局响应面：异常交给 Filter，正常响应交给 Interceptor 包装。
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.enableShutdownHooks();

  await app.listen(config.port);
  logger.log(`Server started on port ${config.port} in ${config.env} mode`);
}
bootstrap();
