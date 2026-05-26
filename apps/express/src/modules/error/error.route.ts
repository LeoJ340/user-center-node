import { Router } from "express";
import { errorController } from "./error.controller";
import {authenticate} from "@/middlewares/auth";

export const errorRouter = Router();

errorRouter.get("/", authenticate, errorController.throwError);
