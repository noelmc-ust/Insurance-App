import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { getDb } from "../../database/db.js";
import { storageService } from "../storage/storage.service.js";

const router = Router();

router.get("/:id/view-url", requireAuth, async (req, res) => {
  const docId = Number(req.params.id);
  const db = await getDb();
  const result = await db
    .request()
    .input("docId", docId)
    .query(`
      SELECT d.*, c.UserId
      FROM Documents d
      JOIN Claims c ON c.Id = d.ClaimId
      WHERE d.Id = @docId
    `);
  const doc = result.recordset[0];
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (req.user!.role !== "ADMIN" && doc.UserId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  const url = await storageService.getReadUrl(doc.BlobPath, 5);
  return res.json({ url, contentType: doc.ContentType, fileName: doc.FileName });
});

router.get("/:id/content", requireAuth, async (req, res) => {
  const docId = Number(req.params.id);
  const db = await getDb();
  const result = await db
    .request()
    .input("docId", docId)
    .query(`
      SELECT d.*, c.UserId
      FROM Documents d
      JOIN Claims c ON c.Id = d.ClaimId
      WHERE d.Id = @docId
    `);
  const doc = result.recordset[0];
  if (!doc) return res.status(404).json({ message: "Document not found" });
  if (req.user!.role !== "ADMIN" && doc.UserId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });

  const downloadResponse = await storageService.download(doc.BlobPath);
  res.setHeader("Content-Type", doc.ContentType || "application/octet-stream");
  res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(doc.FileName)}"`);
  if (!downloadResponse.readableStreamBody) return res.status(404).json({ message: "Blob content not found" });
  downloadResponse.readableStreamBody.pipe(res);
});

export default router;
