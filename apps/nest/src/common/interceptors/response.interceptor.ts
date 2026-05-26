import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Response } from 'express';
import { map, Observable } from 'rxjs';
import type { RestResponse } from '../interfaces/rest-response.interface';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, RestResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<RestResponse<T>> {
    const response = context.switchToHttp().getResponse<Response>();

    // Controller 只返回业务数据，统一响应格式在这里集中包装。
    return next.handle().pipe(
      map((data) => ({
        code: response.statusCode,
        data: data ?? null,
        message: 'success',
        requestId: response.locals.requestId as string | undefined,
      })),
    );
  }
}
