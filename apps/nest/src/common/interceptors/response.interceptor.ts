import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import type { Response as ExpressResponse } from 'express'
import { map, Observable } from 'rxjs'
import type { RestResponse } from '../interfaces/rest-response'

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, RestResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<RestResponse<T>> {
    const response = context.switchToHttp().getResponse<ExpressResponse>()

    // Controller 只返回业务数据，统一响应格式在这里集中包装。
    return next.handle().pipe(
      map((data) => ({
        code: 200,
        data: data ?? null,
        message: '',
        requestId: response.locals.requestId as string | undefined,
      })),
    )
  }
}
