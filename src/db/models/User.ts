import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  type Sequelize,
} from "sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare nickname: string | null;
  declare userAccount: string | null;
  declare avatar: string | null;
  declare gender: number | null;
  declare userPassword: string;
  declare phone: string | null;
  declare email: string | null;
  declare userStatus: CreationOptional<number>;
  declare deleted: CreationOptional<number>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: Date | null;

  static initModel(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        nickname: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        userAccount: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        avatar: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        gender: {
          type: DataTypes.TINYINT,
          allowNull: true,
        },
        userPassword: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        userStatus: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 0,
        },
        deleted: {
          type: DataTypes.TINYINT,
          allowNull: false,
          defaultValue: 0,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          field: "create_time",
          defaultValue: DataTypes.NOW,
        },
        updatedAt: {
          type: DataTypes.DATE,
          allowNull: true,
          field: "update_time",
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        tableName: "user",
        timestamps: true,
        underscored: true,
        createdAt: "create_time",
        updatedAt: "update_time",
      }
    );

    return User;
  }
}

