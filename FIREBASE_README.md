# Gulf Way DocFlow - Production Architecture & Firebase Configuration

Gulf Way DocFlow is an enterprise-grade Company Form Management, Document Generation, Digital Signature, Document Numbering, Approval, and Digital Records Management System built for multi-company logistics, fleet, and corporate operations.

---

## 1. Firebase & Cloud Firestore Architecture

The system is engineered for Cloud Firestore and Firebase Storage integration with strict server-side boundary enforcement:
- **Server-Only Security**: All atomic sequence increments, numbering token evaluations, signature embedding, and final document sealing occur within server-side runtimes.
- **Firebase Admin SDK**: Private keys, service account credentials, and Cloud Storage signing keys are never shipped to the browser.
- **Transactions**: Document sequence generation relies on Firestore Transactions (`runTransaction`) with mutex concurrency locks to prevent race conditions.

### Firestore Collections Data Model

| Collection | Document ID | Description |
| :--- | :--- | :--- |
| `companies` | `comp_{id}` | Multi-company directory (GWDS, GWL, GWT, etc.), Trade License, Logo, Stamp |
| `departments` | `dept_{id}` | Operational departments (HR, Fleet & Operations, Finance, Legal) |
| `users` | `usr_{id}` | User profiles, Company assignments, Role references, and Status |
| `roles` | `role_{id}` | System & custom roles (SUPER_ADMIN, COMPANY_ADMIN, APPROVER, etc.) |
| `numberingRules` | `rule_{id}` | Configurable pattern (`{COMPANY}-{DEPARTMENT}-{FORMCODE}-{YYYY}-{SEQ:6}`), reset type, and counters |
| `formTemplates` | `form_{id}` | Form metadata, instructions, field coordinates, version histories |
| `documents` | `doc_{id}` | Drafts, assigned document numbers, values, status history, signatures, hash |
| `auditLogs` | `aud_{id}` | Immutable record of logins, numbering, approvals, stamps, and state changes |

---

## 2. Firebase Cloud Storage Structure

Uploaded PDF templates, authorized company stamps, user signature stamps, and final generated PDFs are stored with role-protected paths:

```
gs://<YOUR_FIREBASE_STORAGE_BUCKET>/
├── templates/
│   └── {formId}/
│       └── v{version}.pdf
├── stamps/
│   └── {companyId}/
│       └── official_stamp.png
├── signatures/
│   └── {documentId}/
│       └── sig_{timestamp}.png
├── signed_copies/
│   └── {documentId}/
│       └── physical_scan_{timestamp}.pdf
└── final_records/
    └── {documentId}/
        └── {documentNumber}_sealed.pdf
```

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
# Server Port (fixed to 3000 in Cloud Run container)
PORT=3000

# Firebase Cloud Admin SDK Credentials
FIREBASE_PROJECT_ID="gulf-way-docflow"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk@gulf-way-docflow.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgk..."
FIREBASE_STORAGE_BUCKET="gulf-way-docflow.firebasestorage.app"

# Application Base URL (for QR code verification)
APP_URL="https://ais-dev-toaovsks72n7oo4hu4m5pd-751871831613.europe-west2.run.app"

# Server-side signing & hashing secret
DOCUMENT_SIGNING_SECRET="gw-docflow-enterprise-secret-key-2026"
```

---

## 4. Key Business Logic & Non-Negotiable Rules

1. **No Client-Side Sequence Generation**: React or client code never computes or reserves numbers.
2. **Drafts Never Assign Numbers**: Clicking "Save Draft" records form fields without sequence counter increment.
3. **Irreversible Number Allocation**: Generating a number requires explicit modal confirmation and atomically increments the sequence counter.
4. **Never Reused**: Once assigned, a number is permanently locked to that record. If cancelled, it is marked `VOID`, never recycled.
5. **No Overwriting Published Templates**: Editing a published form automatically increments `currentVersion` (e.g., v1 -> v2) and preserves previous versions for historical documents.
6. **Immutable Final Seal**: Finalized documents have their SHA-256 hash computed and locked.
7. **Public QR Code Privacy**: Public verification (`/verify/:token`) renders only validation status, company, document number, and issue date—never exposing personal employee data.
