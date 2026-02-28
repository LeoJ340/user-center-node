import path from "path";
import dotenv from "dotenv";
import { z } from "zod";

const nodeEnv = (process.env.NODE_ENV ?? "development") as string;
const envFile = path.resolve(process.cwd(), `.env.${nodeEnv}`);
dotenv.config({ path: envFile });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.string().default("info"),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().int().positive().default(3306),
  DB_USER: z.string().min(1),
  DB_PASS: z.string().optional().default(""),
  DB_NAME: z.string().min(1),
  DB_POOL_MAX: z.coerce.number().int().positive().default(5),
  DB_POOL_MIN: z.coerce.number().int().positive().default(0),
  DB_POOL_ACQUIRE: z.coerce.number().int().positive().default(30000),
  DB_POOL_IDLE: z.coerce.number().int().positive().default(10000),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error(
    "环境变量校验失败：\n",
    JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
  );
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;

