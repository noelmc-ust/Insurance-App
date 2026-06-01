import sql from "mssql";
import { env } from "../config/env.js";

let pool: sql.ConnectionPool | null = null;

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureDatabaseExists() {
  const masterPool = await sql.connect({
    user: env.db.user,
    password: env.db.password,
    server: env.db.server,
    port: env.db.port,
    database: "master",
    options: {
      trustServerCertificate: true,
      encrypt: false
    }
  });
  await masterPool.request().query(`
    IF DB_ID('${env.db.database}') IS NULL
    BEGIN
      CREATE DATABASE [${env.db.database}]
    END
  `);
  await masterPool.close();
}

export async function getDb() {
  if (pool) return pool;

  let lastError: unknown;
  for (let i = 0; i < 20; i += 1) {
    try {
      await ensureDatabaseExists();
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
    } catch (err) {
      lastError = err;
      await sleep(3000);
    }
  }
  throw lastError;
}
