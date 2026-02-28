import type { Transaction } from "sequelize";
import { User } from "@/db/models/User";

export const userRepo = {
  findById(id: number) {
    return User.findByPk(id);
  },

  findByUserAccount(userAccount: string) {
    return User.findOne({ where: { userAccount } });
  },

  findByEmail(email: string) {
    return User.findOne({ where: { email } });
  },

  create(
    input: {
      userAccount?: string;
      userPassword: string;
      nickname?: string;
      avatar?: string;
      gender?: number;
      phone?: string;
      email?: string;
      userStatus?: number;
    },
    tx?: Transaction
  ) {
    return User.create(input, { transaction: tx });
  },
};

