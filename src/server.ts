import http from "http";
import { createApp } from "@/app";
import { config } from "@/config";
import { logger } from "@/config/logger";
import { connectDb, sequelize } from "@/db/sequelize";
import { initModels } from "@/db/models";

async function start() {
  await connectDb();
  initModels(sequelize);

  const app = createApp();
  const server = http.createServer(app);

  server.listen(config.port, () => {
    logger.info({ port: config.port, env: config.env }, "Server started");
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, "Shutting down");
    server.close(async () => {
      await sequelize.close();
      process.exit(0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  logger.error({ err }, "Failed to start server");
  process.exit(1);
});

