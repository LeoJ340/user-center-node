import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import { logger } from "@/config/logger";
import { requestId } from "@/middlewares/requestId";
import { errorHandler } from "@/middlewares/errorHandler";
import { notFound } from "@/middlewares/notFound";
import { apiRouter } from "@/routes";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");

  app.use(requestId);
  app.use(
    pinoHttp({
      logger,
      customProps: (req, res) => ({
        requestId: (res as any).locals?.requestId,
        method: req.method,
        url: req.url,
      }),
    })
  );

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));

  app.use("/api/v1", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

