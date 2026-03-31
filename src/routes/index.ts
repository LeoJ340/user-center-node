import { Router } from "express";
import { userRouter } from "@/modules/user/user.route";
import { authRouter } from "@/modules/auth/auth.route";

export const apiRouter = Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/auth", authRouter);

