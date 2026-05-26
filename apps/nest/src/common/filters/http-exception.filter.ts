import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { RestResponse } from '../interfaces/rest-response.interface';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const requestId = response.locals.requestId as string | undefined;

    // Nest 主动抛出的 HttpException 保留原状态码，未知错误统一视为 500。
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.getMessage(exception);

    // 5xx 作为服务端错误记录 error，4xx 等可预期错误记录 warn。
    if (status >= 500) {
      this.logger.error(message, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(message);
    }

    const body: RestResponse<null> = {
      code: status,
      data: null,
      message,
      requestId,
    };

    response.status(status).json(body);
  }

  private getMessage(exception: unknown) {
    // ValidationPipe 的错误信息通常在 response.message 中，可能是字符串数组。
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      if (typeof body === 'string') return body;
      if (
        typeof body === 'object' &&
        body !== null &&
        'message' in body
      ) {
        const message = (body as { message: string | string[] }).message;
        return Array.isArray(message) ? message.join(', ') : message;
      }
      return exception.message;
    }

    if (exception instanceof Error) return exception.message;
    return 'Internal server error';
  }
}
