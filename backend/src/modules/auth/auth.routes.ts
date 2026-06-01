import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { getDb } from "../../database/db.js";
import { env } from "../../config/env.js";
import { requireAuth } from "../../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
  const { email, password } = parsed.data;
  const db = await getDb();
  const userRes = await db.request().input("email", email).query("SELECT TOP 1 * FROM Users WHERE Email = @email");
  const user = userRes.recordset[0];
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.PasswordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = jwt.sign({ id: user.Id, email: user.Email, role: user.Role }, env.jwtSecret, { expiresIn: "8h" });
  return res.json({
    token,
    user: { id: user.Id, name: user.Name, email: user.Email, role: user.Role }
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const db = await getDb();
  const result = await db.request().input("id", req.user!.id).query("SELECT Id, Name, Email, Role, CreatedAt FROM Users WHERE Id=@id");
  return res.json(result.recordset[0]);
});

export default router;
