import { Router } from "express";
import { userRouter } from "@/modules/user/user.route";

export const apiRouter = Router();

apiRouter.use("/users", userRouter);

