import { app, InvocationContext, ServiceBusQueueTrigger } from "@azure/functions";
import { BlobSASPermissions, BlobServiceClient, SASProtocol, generateBlobSASQueryParameters } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import sql from "mssql";
import { ServiceBusClient } from "@azure/service-bus";

const KEYWORDS = ["adhaar", "dob", "dateofbirth", "validity", "policy", "claim"];

async function callOcrApi(blobUrl: string) {
  const apiUrl = process.env.OCR_API_URL || "https://api.ocr.space/parse/image";
  const apiKey = process.env.OCR_API_KEY;
  if (!apiKey) {
    throw new Error("OCR_API_KEY is required for validation.");
  }

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      apikey: apiKey,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      url: blobUrl,
      language: "eng",
      OCREngine: "2",
      isOverlayRequired: "false"
    })
  });

  if (!response.ok) {
    throw new Error(`OCR API failed with status ${response.status}`);
  }

  return response.json();
}

function scoreText(text: string) {
  const normalized = text.toLowerCase();
  const hits = KEYWORDS.filter((keyword) => normalized.includes(keyword));
  return hits.length / KEYWORDS.length;
}

async function updateDocumentStatus(documentId: number, status: string, score: number, note: string, blobPath?: string) {
  const config = {
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    server: process.env.DB_HOST || "",
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || "",
    options: { encrypt: true, trustServerCertificate: true }
  };

  if (!config.server || !config.user || !config.password || !config.database) {
    throw new Error("Missing SQL config for document validation update.");
  }

  const pool = await sql.connect(config as any);
  const request = pool.request()
    .input("documentId", documentId)
    .input("status", status)
    .input("score", score)
    .input("note", note);

  if (typeof blobPath === "string") {
    request.input("blobPath", blobPath);
  }

  await request.query(`
      UPDATE Documents
      SET ValidationStatus=@status,
          ValidationScore=@score,
          ValidationNotes=@note
          ${typeof blobPath === "string" ? ", BlobPath=@blobPath" : ""}
      WHERE Id=@documentId
    `);
  await pool.close();
}

async function notifyUser(email: string, subject: string, message: string) {
  const namespace = process.env.AZURE_SERVICEBUS_NAMESPACE;
  if (!namespace) return;
  const client = new ServiceBusClient(namespace, new DefaultAzureCredential());
  const sender = client.createSender(process.env.AZURE_SERVICEBUS_NOTIFICATION_QUEUE || "document-notifications");
  await sender.sendMessages({ body: { email, subject, message } });
  await sender.close();
  await client.close();
}

export async function documentValidationQueueTrigger(
  message: unknown,
  context: InvocationContext
): Promise<void> {
  const payload = message as any;
  context.log(`Received validation request for document ${payload.documentId}`);

  try {
    const blobService = new BlobServiceClient(process.env.AZURE_STORAGE_ACCOUNT_URL || "", new DefaultAzureCredential());
    const tempContainer = blobService.getContainerClient(process.env.AZURE_TEMP_BLOB_CONTAINER || "claims-validation-temp");
    const finalContainer = blobService.getContainerClient(process.env.AZURE_BLOB_CONTAINER || "claims-documents");

    const blobClient = tempContainer.getBlockBlobClient(payload.blobPath);
    const startsOn = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + 15 * 60 * 1000);
    const delegation = await blobService.getUserDelegationKey(startsOn, expiresOn);
    const sas = generateBlobSASQueryParameters(
      {
        containerName: tempContainer.containerName,
        blobName: payload.blobPath,
        permissions: BlobSASPermissions.parse("r"),
        startsOn,
        expiresOn,
        protocol: SASProtocol.Https,
        version: "2020-08-04"
      },
      delegation,
      (process.env.AZURE_STORAGE_ACCOUNT_NAME || "")
    ).toString();
    const blobUrl = `${blobClient.url}?${sas}`;
    const ocrResult = await callOcrApi(blobUrl);
    const text = String(ocrResult.text || "");
    const score = Math.min(1, scoreText(text) + (typeof ocrResult.confidence === "number" ? ocrResult.confidence : 0) / 2);

    if (score >= 0.5) {
      const finalBlobPath = payload.blobPath.replace(/^temp\//, "");
      await finalContainer.getBlockBlobClient(finalBlobPath).uploadData(await blobClient.downloadToBuffer());
      await tempContainer.getBlockBlobClient(payload.blobPath).deleteIfExists();
      await updateDocumentStatus(payload.documentId, "VALIDATED", score, `OCR validation passed (${Math.round(score * 100)}%)`, finalBlobPath);
      await notifyUser(payload.email, "Document validation passed", `Your document ${payload.fileName} passed validation and is now stored.`);
      context.log(`Document ${payload.documentId} validated and stored.`);
    } else {
      await tempContainer.getBlockBlobClient(payload.blobPath).deleteIfExists();
      await updateDocumentStatus(payload.documentId, "REJECTED", score, `OCR validation failed. Keywords matched ${Math.round(score * 100)}% of expected criteria.`);
      await notifyUser(payload.email, "Document validation failed", `Your document ${payload.fileName} was rejected because it did not meet the OCR validation rules.`);
      context.log(`Document ${payload.documentId} rejected.`);
    }
  } catch (error) {
    context.error("Document validation failed", error);
    await updateDocumentStatus(payload.documentId, "ERROR", 0, error instanceof Error ? error.message : "Validation failed");
    await notifyUser(payload.email, "Document validation error", `We could not validate ${payload.fileName} due to an internal error.`);
  }
}

app.serviceBusQueue("documentValidationQueue", {
  queueName: process.env.AZURE_SERVICEBUS_VALIDATION_QUEUE || "document-validation",
  connection: "AzureWebJobsStorage",
  handler: documentValidationQueueTrigger
});
