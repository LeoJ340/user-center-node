import { randomUUID } from 'node:crypto'
import { Injectable, NestMiddleware } from '@nestjs/common'
import type { NextFunction, Request, Response } from 'express'

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 允许上游网关透传 requestId；没有时由当前服务生成。
    const incoming = req.header('x-request-id') ?? req.header('X-Request-Id') ?? randomUUID()

    res.locals.requestId = incoming
    res.setHeader('x-request-id', incoming)
    next()
  }
}
