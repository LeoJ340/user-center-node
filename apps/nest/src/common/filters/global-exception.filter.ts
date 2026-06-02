import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import type { Request, Response } from 'express'
import type { RestResponse } from '../interfaces/rest-response'

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const requestId = response.locals.requestId as string | undefined

    // 业务异常返回 HTTP 200（业务码放 code 字段），系统异常返回 HTTP 500。
    // 业务层推荐异常选择约定（统一口径）：
    // - BadRequestException(400): 参数错误、前置条件不满足
    // - UnauthorizedException(401): 未登录、token 无效/过期、认证失败
    // - ForbiddenException(403): 已登录但无权限或账号状态不允许
    // - NotFoundException(404): 目标资源不存在
    // - ConflictException(409): 资源冲突（重复创建、状态冲突）
    // - ServiceUnavailableException(503): 下游依赖不可用（Redis/DB/外部服务）
    // 说明：过滤器会把上述业务异常统一封装为 HTTP 200 + body.code，便于前端统一处理。
    const isHttpException = exception instanceof HttpException
    const code = isHttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR
    // HTTP响应状态
    const httpStatus = isHttpException ? HttpStatus.OK : HttpStatus.INTERNAL_SERVER_ERROR

    let message = this.getMessage(exception)
    if (code === HttpStatus.INTERNAL_SERVER_ERROR) {
      message = '服务器内部错误'
    } else if (code === HttpStatus.NOT_FOUND && /^Cannot\s/.test(message)) {
      message = '接口不存在'
    }

    const logPayload = {
      event: 'http_exception',
      kind: isHttpException ? 'business' : 'system',
      method: request.method,
      path: request.originalUrl ?? request.url,
      requestId: requestId ?? '-',
      code,
      message,
    }

    if (isHttpException) {
      this.logger.warn(JSON.stringify(logPayload))
    } else {
      const stack = exception instanceof Error ? exception.stack : undefined
      this.logger.error(JSON.stringify(logPayload), stack)
    }

    const body: RestResponse<null> = {
      code,
      data: null,
      message,
      requestId,
    }

    response.status(httpStatus).json(body)
  }

  private getMessage(exception: unknown): string {
    if (exception instanceof HttpException) {
      const body = exception.getResponse()
      if (typeof body === 'string') return body
      if (typeof body === 'object' && body !== null) {
        const message = (body as { message?: unknown }).message
        if (Array.isArray(message)) {
          const plainMessages = message.filter((item): item is string => typeof item === 'string')
          if (plainMessages.length > 0) return plainMessages.join(', ')
        }
        if (typeof message === 'string' && message.trim().length > 0) {
          return message
        }
      }

      if (exception.message.trim().length > 0) return exception.message
      return '服务器内部错误'
    }

    if (exception instanceof Error && exception.message.trim().length > 0) {
      return exception.message
    }
    return '服务器内部错误'
  }
}
