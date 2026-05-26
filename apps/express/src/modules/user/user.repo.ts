import { Op } from "sequelize";
import type { InferAttributes, Transaction, WhereOptions } from "sequelize";
import { User } from "@/db/models/User";

export const userRepo = {

  findOne(where: WhereOptions<InferAttributes<User>>) {
    return User.findOne({ where })
  },

  findById(id: number | string) {
    return User.findByPk(id)
  },

  findByLogin(accountOrEmailOrPhone: string) {
    return User.findOne({
      where: {
        [Op.or]: [
          { userAccount: accountOrEmailOrPhone },
          { email: accountOrEmailOrPhone },
          { phone: accountOrEmailOrPhone },
        ],
      },
    })
  },
};

