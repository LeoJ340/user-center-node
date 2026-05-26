import { Router } from "express";
import { authenticate } from "@/middlewares/auth";
import { userController } from "./user.controller";

export const userRouter = Router();

userRouter.get("/:id", authenticate, userController.getById);

