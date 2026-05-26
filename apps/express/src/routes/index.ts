import { Router } from "express";
import { userRouter } from "@/modules/user/user.route";
import { authRouter } from "@/modules/auth/auth.route";
import { errorRouter } from "@/modules/error/error.route";

export const apiRouter = Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/auth", authRouter);
apiRouter.use("/error", errorRouter);

