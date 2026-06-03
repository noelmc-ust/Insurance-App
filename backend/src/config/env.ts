import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  jwtSecret: process.env.JWT_SECRET || "dev-secret",
  db: {
    user: process.env.DB_USER || "sa",
    password: process.env.DB_PASSWORD || "YourStrong!Passw0rd",
    server: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 1433),
    database: process.env.DB_NAME || "insurance_db"
  },
  azure: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT_NAME || "",
    accountUrl: process.env.AZURE_STORAGE_ACCOUNT_URL || "",
    container: process.env.AZURE_BLOB_CONTAINER || "claims-documents",
    tempContainer: process.env.AZURE_TEMP_BLOB_CONTAINER || "claims-validation-temp",
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || "",
    serviceBusNamespace: process.env.AZURE_SERVICEBUS_NAMESPACE || "",
    validationQueueName: process.env.AZURE_SERVICEBUS_VALIDATION_QUEUE || "document-validation",
    notificationQueueName: process.env.AZURE_SERVICEBUS_NOTIFICATION_QUEUE || "document-notifications",
    ocrApiUrl: process.env.OCR_API_URL || "",
    ocrApiKey: process.env.OCR_API_KEY || ""
  },
  nodeEnv: process.env.NODE_ENV || "development",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000"
};
