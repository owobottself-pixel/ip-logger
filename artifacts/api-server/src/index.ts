import app from "./app";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

if (process.env.DATABASE_URL) {
  const migrationsFolder = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../lib/db/migrations",
  );
  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder });
    logger.info("Database migrations applied");
  } catch (err) {
    logger.error({ err }, "Database migration failed — server will still start");
  }
} else {
  logger.warn("DATABASE_URL not set — skipping migrations");
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
