import { Router } from "express";
import { validateBody } from "@/middlewares/validate";
import { authenticate } from "@/middlewares/auth";
import { authController } from "./auth.controller";
import { loginSchema } from "./auth.schema";

export const authRouter = Router();

authRouter.post("/login", validateBody(loginSchema), authController.login);
authRouter.post("/refresh", authController.refresh);
authRouter.post("/logout", authController.logout);
authRouter.get("/me", authenticate, authController.me);

