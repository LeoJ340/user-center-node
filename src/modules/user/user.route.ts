import { Router } from "express";
import { validateBody } from "@/middlewares/validate";
import { userController } from "./user.controller";
import { createUserSchema } from "./user.schema";

export const userRouter = Router();

userRouter.post("/", validateBody(createUserSchema), userController.create);
userRouter.get("/:id", userController.getById);

