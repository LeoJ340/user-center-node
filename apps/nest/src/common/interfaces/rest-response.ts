/**
 * RESTFULL 响应格式类
 * @author: leoJ
 * @date: 2026-02-28
 */
export interface RestResponse<T> {
  code: number
  data: T | null
  message: string
  requestId?: string
}
