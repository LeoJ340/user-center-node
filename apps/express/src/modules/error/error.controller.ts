import type { Request, Response } from 'express';

export const errorController = {
  throwError(_req: Request, _res: Response) {
    _res.status(200).json({
      code: 400,
      data: null,
      message: '123',
      requestId: _res.locals.requestId,
    });
    // throw new Error("测试报错接口")
  },
};
