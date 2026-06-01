import type { NextFunction, Request, Response } from 'express'
import { isAppError } from '@/utils/errors'
import { logger } from '@/config/logger'

/**
 * 全局错误处理中间件
 * @author: leoJ
 * @date: 2026-02-28
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const requestId = res.locals.requestId

  if (isAppError(err)) {
    logger.warn({ requestId, code: err.code }, err.message)
    return res.status(200).json({
      code: err.code,
      message: err.message,
      data: null,
      requestId,
    })
  }

  logger.error({ requestId, err }, 'Unhandled error')
  return res.status(500).json({
    code: 500,
    message: '服务器内部错误',
    data: null,
    requestId,
  })
}
