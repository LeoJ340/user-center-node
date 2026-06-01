/**
 * 全局自定义错误类
 * @author: leoJ
 * @date: 2026-02-28
 */
export class AppError extends Error {
  public readonly code: number
  constructor(message: string, code: number = 500) {
    super(message)
    this.code = code
  }
}

export function isAppError(err: unknown): err is AppError {
  return typeof err === 'object' && err !== null && 'code' in err && 'message' in err
}
