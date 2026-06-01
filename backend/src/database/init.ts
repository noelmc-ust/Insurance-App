import bcrypt from "bcryptjs";
import { getDb } from "./db.js";

export async function initDb() {
  const db = await getDb();
  await db.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
    CREATE TABLE Users (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      Name NVARCHAR(100) NOT NULL,
      Email NVARCHAR(200) UNIQUE NOT NULL,
      PasswordHash NVARCHAR(255) NOT NULL,
      Role NVARCHAR(20) NOT NULL,
      CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Claims' AND xtype='U')
    CREATE TABLE Claims (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      UserId INT NOT NULL FOREIGN KEY REFERENCES Users(Id),
      FullName NVARCHAR(120) NOT NULL,
      PolicyNumber NVARCHAR(80) NOT NULL,
      ClaimType NVARCHAR(80) NOT NULL,
      ClaimAmount DECIMAL(18,2) NOT NULL,
      Description NVARCHAR(MAX) NOT NULL,
      Status NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
      AdminComment NVARCHAR(MAX) NULL,
      CreatedAt DATETIME2 DEFAULT SYSUTCDATETIME(),
      UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );

    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Documents' AND xtype='U')
    CREATE TABLE Documents (
      Id INT IDENTITY(1,1) PRIMARY KEY,
      ClaimId INT NOT NULL FOREIGN KEY REFERENCES Claims(Id),
      FileName NVARCHAR(260) NOT NULL,
      BlobPath NVARCHAR(500) NOT NULL,
      ContentType NVARCHAR(120) NOT NULL,
      FileSize BIGINT NOT NULL,
      UploadedAt DATETIME2 DEFAULT SYSUTCDATETIME()
    );
  `);

  const countRes = await db.request().query("SELECT COUNT(*) AS count FROM Users");
  const count = countRes.recordset[0].count as number;
  if (count === 0) {
    const adminHash = await bcrypt.hash("Admin@123", 10);
    const userHash = await bcrypt.hash("User@123", 10);
    await db
      .request()
      .input("adminHash", adminHash)
      .input("userHash", userHash)
      .query(`
      INSERT INTO Users (Name, Email, PasswordHash, Role) VALUES
      ('Admin User', 'admin@insurance.local', @adminHash, 'ADMIN'),
      ('Normal User', 'user@insurance.local', @userHash, 'USER');
    `);
  }
}
