Architecture Decision Summary
Architecture Style

Modular Monolith

Not Microservices.

Reason:

Only 3 core domains
Fast development
Easier deployment
Easier AI-agent generation
Easier debugging
Single App Service deployment

Structure:

Frontend (React)

Backend (Node.js + Express + TypeScript)

Modules:
- Authentication
- Users
- Claims
- Documents
- Admin
- Azure Blob Storage

Single deployment unit.

Main Objective

This application exists primarily to demonstrate:

Azure Blob Storage
Secure File Upload
Secure File Viewing
Geo Redundant Storage
Disaster Recovery
Blob Security
Versioning
Soft Delete
Managed Identity
SAS Token Access

The insurance workflow is intentionally simple and acts as a realistic business scenario.

Functional Requirements
Roles

Only 2 roles exist.

Admin

Can:

Login
View all users
View all claims
View claim details
View uploaded documents
Approve claims
Reject claims
Add comments
User

Can:

Login
Create claims
Upload documents
View submitted claims
View claim status
View admin comments
Open uploaded documents
Initial System Users

On first startup:

Seed two users automatically.

Admin
Email:
admin@insurance.local

Password:
Admin@123
User
Email:
user@insurance.local

Password:
User@123

These users should be created automatically if they do not already exist.

Implementation:

Application Startup

↓

Check Users Table

↓

If Empty

↓

Insert Default Users
User Module
Dashboard

Displays all claims created by logged-in user.

Example:

Claim 001
Status: Pending

Claim 002
Status: Approved

Claim 003
Status: Rejected
Status Colors

Pending

Yellow

Approved

Green

Rejected

Red
Claim Details

Shows:

Claim Information

Uploaded Documents

Status

Admin Comment
Claim Creation Page

Fields:

Full Name

Policy Number

Claim Type

Claim Amount

Description

Documents Section

Upload Documents

Multiple upload supported.

<input type="file" multiple>

No UI limit.

Users can upload:

1 file

10 files

100 files

1000 files

Backend handles storage.

Admin Module
Dashboard

Displays:

Total Claims

Pending Claims

Approved Claims

Rejected Claims

Total Users
Users Page

New Requirement

Admin must see all users.

Table:

User Name

Email

Role

Created Date

Claims Count

Read-only.

No user management required.

Claims Page

Displays:

Claim ID

User

Status

Created Date

Filters:

Pending

Approved

Rejected

All
Claim Details Page

Admin sees:

User Information

Claim Information

All Uploaded Documents

Approval Section
Document Viewing Requirement

Very Important.

Admin must NOT download documents.

Instead:

Open

↓

View directly inside browser

Supported:

PDF

PNG

JPEG

TXT

Implementation

Backend generates temporary SAS URL.

Frontend opens:

Document Viewer Modal

Example:

+--------------------+
| PDF Viewer         |
|                    |
| Claim Report.pdf   |
|                    |
| [ PDF Preview ]    |
|                    |
+--------------------+

No download required.

Storage Architecture
Azure Blob Storage

Container:

claims-documents

Private.

No public access.

Blob Path Convention

claims/

    user-1/

        claim-1/

            report.pdf

            invoice.pdf

            image.jpg

    user-2/

        claim-5/

            report.pdf
Database Requirement

YES.

Database is required.

Do NOT store claim metadata in Blob Storage.

Use:

Azure SQL Database

Reason:

Structured data.

Fast queries.

Real-world design.

Database Schema
Users
Users

Id
Email
PasswordHash
Role
CreatedAt
Claims
Claims

Id

UserId

PolicyNumber

ClaimType

ClaimAmount

Description

Status

AdminComment

CreatedAt

UpdatedAt
Documents
Documents

Id

ClaimId

FileName

BlobPath

ContentType

FileSize

UploadedAt
Authentication

JWT Authentication

Roles:

ADMIN

USER

Token Flow

Login

↓

JWT Token

↓

Stored In Browser

↓

Sent In Headers
Blob Upload Flow
React

↓

Backend API

↓

Azure Blob Storage

↓

Store Metadata In SQL
Blob Viewing Flow
Admin Clicks File

↓

Backend Validates User

↓

Backend Generates SAS URL

↓

Temporary URL

↓

Document Opens In Viewer
Security Architecture
Public Access

Disabled

Allow Blob Public Access = FALSE

Mandatory.

Storage Access

Use:

Managed Identity

Never:

Storage Keys

Never:

Connection Strings

in production.

RBAC

App Service Managed Identity receives:

Storage Blob Data Contributor
SAS URLs

Generated only when:

Authorized User Requests Document

Expiry:

5 Minutes
Geo Redundant Storage

Storage Account Type:

RA-GRS

Read Access Geo Redundant Storage.

Provides:

Primary Region

Secondary Region

Automatic Replication
Disaster Recovery Story

Example:

Primary Region Fails

Files already exist in secondary region.

Replication happens automatically.

Benefits:

No manual backups

Regional protection

High durability
Additional Blob Features

Enable all of the following.

Soft Delete

Retention:

30 Days

Deleted files recoverable.

Blob Versioning

Enabled.

Every update creates new version.

Change Feed

Enabled.

Tracks:

Create

Delete

Modify

events.

Useful for auditing.

Access Logging

Enabled.

Track:

Uploads

Downloads

Reads

Deletes
Local Development

Docker Compose

Services

Frontend

Backend

SQL Server

Azure Blob Storage remains real Azure.

Reason:

Main objective is learning Azure Storage.

Docker Environment

Frontend
localhost:3000

Backend
localhost:5000

SQL
localhost:1433
Production Deployment
Frontend

Azure App Service

React Build

Backend

Azure App Service

Node.js

Database

Azure SQL Database

Storage

Azure Blob Storage

RA-GRS Enabled

Monitoring
Application Insights

Monitor:

Requests

Failures

Exceptions

Performance
Storage Monitoring

Monitor:

Blob Uploads

Blob Downloads

Storage Capacity

Replication Health
Recommended Final Folder Structure
backend/

├── src
│
├── modules
│   ├── auth
│   ├── users
│   ├── claims
│   ├── documents
│   ├── admin
│   └── storage
│
├── database
│
├── middleware
│
├── services
│
├── config
│
└── app.ts
frontend/

├── src
│
├── pages
│   ├── Login
│   ├── Dashboard
│   ├── ClaimCreate
│   ├── ClaimDetails
│   ├── AdminDashboard
│   ├── Users
│   └── Claims
│
├── components
│
├── services
│
└── layouts
Final Architecture Verdict

For this project, the optimal architecture is:

React + TypeScript

↓

Node.js + Express + TypeScript

↓

Azure SQL Database

↓

Azure Blob Storage (RA-GRS)

Security:
- Managed Identity
- Private Containers
- SAS URLs
- Soft Delete
- Versioning
- Change Feed

Deployment:
- Azure App Service
- Docker Compose for local testing

Users:
- Admin
- User

Core Modules:
- Authentication
- Claims
- Documents
- Admin

Primary Goal:
Demonstrate enterprise-grade Azure Blob Storage architecture, security, replication, disas