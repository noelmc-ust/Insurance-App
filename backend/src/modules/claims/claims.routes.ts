import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth.js";
import { getDb } from "../../database/db.js";
import { storageService } from "../storage/storage.service.js";
import { validationQueueService } from "../validation/validation.service.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", requireAuth, async (req, res) => {
  const db = await getDb();
  const result = await db.request().input("userId", req.user!.id).query(`
    SELECT Id, PolicyNumber, ClaimType, ClaimAmount, Status, AdminComment, CreatedAt
    FROM Claims WHERE UserId = @userId ORDER BY Id DESC
  `);
  res.json(result.recordset);
});

router.get("/:id", requireAuth, async (req, res) => {
  const claimId = Number(req.params.id);
  const db = await getDb();
  const claimRs = await db.request().input("id", claimId).query("SELECT * FROM Claims WHERE Id=@id");
  const claim = claimRs.recordset[0];
  if (!claim) return res.status(404).json({ message: "Claim not found" });
  if (req.user!.role !== "ADMIN" && claim.UserId !== req.user!.id) return res.status(403).json({ message: "Forbidden" });
  const docsRs = await db.request().input("claimId", claimId).query("SELECT * FROM Documents WHERE ClaimId=@claimId ORDER BY Id DESC");
  return res.json({ claim, documents: docsRs.recordset });
});

router.post("/", requireAuth, upload.array("documents"), async (req, res) => {
  const parsed = z
    .object({
      fullName: z.string().min(1),
      policyNumber: z.string().min(1),
      claimType: z.string().min(1),
      claimAmount: z.coerce.number().positive(),
      description: z.string().min(1)
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid payload", errors: parsed.error.issues });
  const db = await getDb();
  const files = (req.files || []) as Express.Multer.File[];
  const { fullName, policyNumber, claimType, claimAmount, description } = parsed.data;

  const claimResult = await db
    .request()
    .input("userId", req.user!.id)
    .input("fullName", fullName)
    .input("policyNumber", policyNumber)
    .input("claimType", claimType)
    .input("claimAmount", claimAmount)
    .input("description", description)
    .query(`
      INSERT INTO Claims (UserId, FullName, PolicyNumber, ClaimType, ClaimAmount, Description)
      OUTPUT INSERTED.Id
      VALUES (@userId, @fullName, @policyNumber, @claimType, @claimAmount, @description)
    `);

  const claimId = claimResult.recordset[0].Id as number;
  for (const file of files) {
    const safeName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    const tempBlobPath = `temp/claims/user-${req.user!.id}/claim-${claimId}/${safeName}`;
    await storageService.uploadToContainer(file.buffer, tempBlobPath, file.mimetype || "application/octet-stream", "claims-validation-temp");

    const insertResult = await db
      .request()
      .input("claimId", claimId)
      .input("fileName", file.originalname)
      .input("blobPath", tempBlobPath)
      .input("contentType", file.mimetype || "application/octet-stream")
      .input("fileSize", file.size)
      .query(`
        INSERT INTO Documents (ClaimId, FileName, BlobPath, ContentType, FileSize, ValidationStatus, ValidationNotes)
        OUTPUT INSERTED.Id
        VALUES (@claimId, @fileName, @blobPath, @contentType, @fileSize, 'PENDING_VALIDATION', 'Queued for OCR validation')
      `);

    const documentId = insertResult.recordset[0].Id as number;
    await validationQueueService.enqueueDocumentValidation({
      claimId,
      documentId,
      userId: req.user!.id,
      email: req.user!.email,
      blobPath: tempBlobPath,
      fileName: file.originalname,
      contentType: file.mimetype || "application/octet-stream",
      fileSize: file.size
    });
  }
  return res.status(202).json({ id: claimId, status: "PENDING_VALIDATION" });
});

export default router;
