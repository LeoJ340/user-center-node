import type { NextFunction, Request, Response } from 'express';
import { AppError } from '@/utils/errors';

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('接口不存在', 404));
}
