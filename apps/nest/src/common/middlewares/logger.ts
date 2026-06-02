import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'
import { config } from '@/config'

const logger = pino({
  level: config.logLevel,
})

// pino-http 会在响应完成时记录请求日志，这里补充 requestId 方便链路追踪。
const httpLogger = pinoHttp({
  logger,
  customProps: (req, res) => ({
    requestId: (res as Response).locals.requestId as string | undefined,
    method: req.method,
    url: req.url,
  }),
})

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    httpLogger(req, res, next)
  }
}
