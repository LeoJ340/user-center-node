import type { NextFunction, Request, Response } from "express";
import { AppError } from "@/utils/errors";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError("路由不存在"));
}

