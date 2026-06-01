import sql from "mssql";
import { env } from "../config/env.js";

let pool: sql.ConnectionPool | null = null;

export async function getDb() {
  if (pool) return pool;
  pool = await sql.connect({
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    port: env.db.port,
    database: env.db.database,
    options: {
      trustServerCertificate: true,
      encrypt: false
    }
  });
  return pool;
}
