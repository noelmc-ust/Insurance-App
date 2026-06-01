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

router.post("/register", async (req, res) => {
  const parsed = z
    .object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8)
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload" });
  const { name, email, password } = parsed.data;
  const db = await getDb();
  const exists = await db.request().input("email", email).query("SELECT TOP 1 Id FROM Users WHERE Email=@email");
  if (exists.recordset[0]) return res.status(409).json({ message: "Email already registered" });
  const hash = await bcrypt.hash(password, 10);
  const created = await db
    .request()
    .input("name", name)
    .input("email", email)
    .input("passwordHash", hash)
    .query(`
      INSERT INTO Users (Name, Email, PasswordHash, Role)
      OUTPUT INSERTED.Id, INSERTED.Name, INSERTED.Email, INSERTED.Role
      VALUES (@name, @email, @passwordHash, 'USER')
    `);
  return res.status(201).json(created.recordset[0]);
});

router.get("/me", requireAuth, async (req, res) => {
  const db = await getDb();
  const result = await db.request().input("id", req.user!.id).query("SELECT Id, Name, Email, Role, CreatedAt FROM Users WHERE Id=@id");
  return res.json(result.recordset[0]);
});

export default router;
