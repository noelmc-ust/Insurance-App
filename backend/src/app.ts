import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { initDb } from "./database/init.js";
import { storageService } from "./modules/storage/storage.service.js";
import authRoutes from "./modules/auth/auth.routes.js";
import claimsRoutes from "./modules/claims/claims.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import docsRoutes from "./modules/documents/documents.routes.js";

async function start() {
  await initDb();
  await storageService.ensureContainer();

  const app = express();
  app.use(
    cors({
      origin: env.corsOrigin === "*" ? true : env.corsOrigin
    })
  );
  app.use(express.json({ limit: "10mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRoutes);
  app.use("/api/claims", claimsRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/documents", docsRoutes);

  app.listen(env.port, () => {
    console.log(`Backend listening on ${env.port}`);
  });
}

start().catch((err) => {
  console.error("Startup failed", err);
  process.exit(1);
});
