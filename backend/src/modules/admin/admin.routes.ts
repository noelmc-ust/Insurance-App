import { Router } from "express";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import { getDb } from "../../database/db.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

router.get("/stats", async (_req, res) => {
  const db = await getDb();
  const result = await db.request().query(`
    SELECT
      (SELECT COUNT(*) FROM Claims) AS totalClaims,
      (SELECT COUNT(*) FROM Claims WHERE Status='PENDING') AS pendingClaims,
      (SELECT COUNT(*) FROM Claims WHERE Status='APPROVED') AS approvedClaims,
      (SELECT COUNT(*) FROM Claims WHERE Status='REJECTED') AS rejectedClaims,
      (SELECT COUNT(*) FROM Users) AS totalUsers
  `);
  res.json(result.recordset[0]);
});

router.get("/users", async (_req, res) => {
  const db = await getDb();
  const result = await db.request().query(`
    SELECT u.Id, u.Name, u.Email, u.Role, u.CreatedAt, COUNT(c.Id) AS ClaimsCount
    FROM Users u
    LEFT JOIN Claims c ON c.UserId = u.Id
    GROUP BY u.Id, u.Name, u.Email, u.Role, u.CreatedAt
    ORDER BY u.Id DESC
  `);
  res.json(result.recordset);
});

router.get("/claims", async (req, res) => {
  const status = String(req.query.status || "ALL");
  const db = await getDb();
  let query = `
    SELECT c.Id, c.PolicyNumber, c.ClaimType, c.ClaimAmount, c.Status, c.CreatedAt, u.Name AS UserName, u.Email
    FROM Claims c
    JOIN Users u ON u.Id = c.UserId
  `;
  if (status !== "ALL") query += " WHERE c.Status = @status";
  query += " ORDER BY c.Id DESC";
  const request = db.request();
  if (status !== "ALL") request.input("status", status);
  const result = await request.query(query);
  res.json(result.recordset);
});

router.patch("/claims/:id/status", async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body.status || "");
  const adminComment = String(req.body.adminComment || "");
  if (!["APPROVED", "REJECTED", "PENDING"].includes(status)) return res.status(400).json({ message: "Invalid status" });
  const db = await getDb();
  await db
    .request()
    .input("id", id)
    .input("status", status)
    .input("adminComment", adminComment)
    .query("UPDATE Claims SET Status=@status, AdminComment=@adminComment, UpdatedAt=SYSUTCDATETIME() WHERE Id=@id");
  res.json({ success: true });
});

export default router;
