import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ path: resolve(process.cwd(), "../.env") });
loadEnv({ path: resolve(process.cwd(), ".env") });

const schema = z.object({
  TELEGRAM_BOT_TOKEN: z.string().min(1),
  BACKEND_API_URL: z.string().url().default("http://localhost:14000"),
  BOT_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(60_000),
  PUBLIC_APP_URL: z.string().url().default("http://localhost:15173")
});

export const config = schema.parse(process.env);
