import type { Response } from "express";

/**
 * RESTFULL 响应格式类
 * @author: leoJ
 * @date: 2026-02-28
 */
export class RestResponse<T> {
  public code: number = 200;
  public data: T | null = null;
  public message: string = "";
  public requestId: string = "";
  constructor(code: number = 200, data: T | null = null, message: string = "", requestId: string = "") {
    this.code = code;
    this.data = data;
    this.message = message;
    this.requestId = requestId;
  }
}

export function success<T>(res: Response, data: T | null, message: string = ""): Response<RestResponse<T>> {
  return res.status(200).json({
    code: 200,
    data,
    message,
    requestId: res.locals.requestId,
  });
}
