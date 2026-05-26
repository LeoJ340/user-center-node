import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '@/utils/errors';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return next(new AppError('参数校验失败', 400));
    req.body = parsed.data;
    return next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.query);
    if (!parsed.success) return next(new AppError('参数校验失败', 400));
    // Express 5 把 req.query 改成了只读 getter（内部懒解析 URL），
    // 直接 req.query = xxx 会抛 TypeError。这里用 defineProperty 覆盖成普通属性。
    Object.defineProperty(req, 'query', {
      value: parsed.data,
      writable: true,
      configurable: true,
      enumerable: true,
    });
    return next();
  };
}
