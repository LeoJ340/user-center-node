import type { Request, Response } from "express";
import { RestResponse, success } from "@/utils/response";
import { userService } from "./user.service";
import type { User } from "@/db/models/User";

export const userController = {
  async create(req: Request, res: Response) {
    const user = await userService.createUser(req.body);
    return success(res, new RestResponse<User>(200, user, "创建用户成功"));
  },

  async getById(req: Request, res: Response) {
    const id = Number(req.params.id);
    const user = await userService.getUserById(id);
    return success(res, user, "获取用户成功");
  },
};

