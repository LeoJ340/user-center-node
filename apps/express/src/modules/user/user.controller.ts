import type { Request, Response } from 'express';
import { success } from '@/utils/response';
import { userService } from './user.service';

export const userController = {
  async getById(req: Request, res: Response) {
    const id = String(req.params.id);
    const user = await userService.getUserById(id);
    const json = typeof (user as any).toJSON === 'function' ? (user as any).toJSON() : user;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { userPassword, ...rest } = json as any;
    return success(res, rest, '获取用户成功');
  },
};
