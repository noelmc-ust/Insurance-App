# Insurance Claims + Azure Blob Training Project

This is a full training project to learn:
- secure upload to Azure Blob Storage
- private container + SAS-based secure viewing
- claim workflow with `USER` and `ADMIN`
- local Docker setup and Azure App Service deployment path

## Default Login Users
- `admin@insurance.local` / `Admin@123`
- `user@insurance.local` / `User@123`

These are auto-seeded on first backend startup.

## Tech Stack
- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- DB: SQL Server
- Blob: Azure Blob API (`@azure/storage-blob`)

## Local Run (Docker Compose)
From project root:

```bash
docker compose up --build
```

Services:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- SQL Server: localhost:1433
- Azurite Blob Emulator: localhost:10000

## Database Credentials (Local)
- Host: `localhost`
- Port: `1433`
- User: `sa`
- Password: `YourStrong!Passw0rd`
- Database: `insurance_db`

## Blob Credentials (Local Azurite)
- Account Name: `devstoreaccount1`
- Container: `claims-documents`
- Connection string is already set in `docker-compose.yml`.

## API Highlights
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/claims`
- `POST /api/claims` (multipart, field: `documents`)
- `GET /api/claims/:id`
- `GET /api/documents/:id/view-url` (SAS URL for browser view)
- `GET /api/admin/stats`
- `GET /api/admin/users`
- `GET /api/admin/claims?status=ALL|PENDING|APPROVED|REJECTED`
- `PATCH /api/admin/claims/:id/status`

## Production Azure Setup

1. Create Azure resources:
   - Azure Storage Account (Standard, RA-GRS recommended)
   - Blob container: `claims-documents` (private)
   - Azure SQL Database
   - 2x App Service (or 1 with two containers if preferred): frontend + backend
   - Application Insights

2. Configure Storage security features:
   - Disable public blob access
   - Enable soft delete (30 days)
   - Enable blob versioning
   - Enable change feed
   - Enable diagnostic logs

3. Managed Identity (Backend App Service):
   - Turn on system-assigned managed identity
   - Assign RBAC role on storage account:
     - `Storage Blob Data Contributor`

4. Backend App Settings (Azure):
   - `PORT=5000`
   - `CORS_ORIGIN=https://<frontend-app>.azurewebsites.net`
   - `JWT_SECRET=<strong-secret>`
   - `DB_HOST=<azure-sql-server>.database.windows.net`
   - `DB_PORT=1433`
   - `DB_USER=<sql-admin-user>`
   - `DB_PASSWORD=<sql-admin-password>`
   - `DB_NAME=<db-name>`
   - `AZURE_BLOB_CONTAINER=claims-documents`
   - `AZURE_STORAGE_ACCOUNT_NAME=<storage-account-name>`
   - `AZURE_STORAGE_ACCOUNT_URL=https://<storage-account-name>.blob.core.windows.net`
   - Keep `AZURE_STORAGE_CONNECTION_STRING` empty in production to force Managed Identity path.

5. Frontend App Settings (Azure):
   - `VITE_API_BASE=https://<backend-app>.azurewebsites.net`

6. Build + Deploy:
   - Build and deploy frontend and backend containers separately to Azure App Service.

## Notes
- For local learning we use Azurite in Docker.
- For production use real Azure Blob + Managed Identity (no storage keys in app code).
