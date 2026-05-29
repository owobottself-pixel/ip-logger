import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>;

let _pool: pg.Pool | null = null;
let _db: DrizzleDb | null = null;

function getInstance(): { pool: pg.Pool; db: DrizzleDb } {
  if (!_pool || !_db) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    _pool = new Pool({ connectionString: process.env.DATABASE_URL });
    _db = drizzle(_pool, { schema });
  }
  return { pool: _pool, db: _db };
}

export const pool = new Proxy({} as pg.Pool, {
  get(_, prop) {
    return (getInstance().pool as never as Record<string | symbol, unknown>)[prop];
  },
});

export const db = new Proxy({} as DrizzleDb, {
  get(_, prop) {
    return (getInstance().db as never as Record<string | symbol, unknown>)[prop];
  },
});

export * from "./schema";
