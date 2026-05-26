import pino from "pino";
import { config } from "./index";

export const logger = pino({
  level: config.logLevel,
  redact: {
    paths: ["req.headers.authorization", "req.headers.cookie"],
    remove: true
  }
});

