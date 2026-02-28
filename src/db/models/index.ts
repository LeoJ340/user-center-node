import type { Sequelize } from "sequelize";
import { User } from "./User";

export function initModels(sequelize: Sequelize) {
  User.initModel(sequelize);
  return { User };
}

export const models = { User };

