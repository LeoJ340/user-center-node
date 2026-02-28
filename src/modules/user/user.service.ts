import { sequelize } from "@/db/sequelize";
import { AppError } from "@/utils/errors";
import { userRepo } from "./user.repo";
import type { CreateUserInput } from "./user.schema";

export const userService = {
  async createUser(input: CreateUserInput) {
    return sequelize.transaction(async (tx) => {
      if (input.userAccount) {
        const existsAccount = await userRepo.findByUserAccount(input.userAccount);
        if (existsAccount) throw new AppError("账号已被占用");
      }
      if (input.email) {
        const existsEmail = await userRepo.findByEmail(input.email);
        if (existsEmail) throw new AppError("邮箱已被占用");
      }
      return userRepo.create(input, tx);
    });
  },

  async getUserById(id: number) {
    const user = await userRepo.findById(id);
    if (!user) throw new AppError("用户不存在");
    return user;
  },
};

