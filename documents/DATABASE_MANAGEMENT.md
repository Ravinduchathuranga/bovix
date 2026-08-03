# 🗄️ Bovix — Database Management Runbook

> Operational guide for managing the Bovix Firestore databases across
> production, test, and backup environments.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Environment Setup](#environment-setup)
- [Daily Operations](#daily-operations)
- [Backup Procedures](#backup-procedures)
- [Restore Procedures](#restore-procedures)
- [Security Rules Deployment](#security-rules-deployment)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

Bovix uses **three separate Firebase projects** (all on the free Spark plan):

| Environment | Firebase Project | Purpose | Access |
|-------------|-----------------|---------|--------|
| 🟢 Production | `bovix-prod` | Live user data | Client app (production builds) |
| 🟡 Test / Dev | `bovix-test` | Development & CI testing | Client app (dev builds), CI pipeline |
| 🔵 Backup | `bovix-backup` | Automated mirror of production | Admin SDK scripts only |

### Firestore Collections

All three environments share the same collection schema:

| Collection | Description |
|-----------|-------------|
| `cattle` | Cattle records (tag number, breed, health status, yield) |
| `milking_records` | Bulk milking session logs |
| `company_receipts` | Company receipt records for reconciliation |
| `farm_stock` | Feed inventory items |
| `stock_usage` | Feed usage history |

---

## Environment Setup

### Prerequisites

1. **Firebase Projects**: Create all three projects in the [Firebase Console](https://console.firebase.google.com/)
2. **Service Account Keys**: Download from each project → Project Settings → Service Accounts → Generate new private key
3. **Place service accounts** in the `scripts/` directory:
   - `scripts/service-account-prod.json`
   - `scripts/service-account-backup.json`
   - `scripts/service-account-test.json` (optional, for seeding)

> ⚠️ Service account files are git-ignored. Never commit them to version control.

### Environment Files

| File | Environment | Description |
|------|-------------|-------------|
| `.env` | Default (test) | Used for local `expo start` development |
| `.env.test` | Test | Explicit test environment credentials |
| `.env.production` | Production | Production Firebase credentials |
| `.env.backup` | Backup | Backup project credentials |

**To switch environments locally:**
```bash
# Use test environment (default)
cp .env.test .env

# Use production (⚠️ use with caution)
cp .env.production .env
```

### Install Script Dependencies

```bash
cd scripts
npm install
```

---

## Daily Operations

### Check Which Database You're Connected To

When the app starts, it logs the active environment:

```
[Bovix DB] Connected to Firestore: bovix-test (🟡 TEST / DEV)
```

If you see a warning about production in dev mode, switch to `.env.test`:
```
[Bovix DB] ⚠️ WARNING: Running in __DEV__ mode against PRODUCTION database!
```

### EAS Build Profiles

| Profile | Command | Environment |
|---------|---------|-------------|
| Development | `eas build --profile development` | 🟡 Test |
| Main | `eas build --profile main` | 🟡 Test |
| Production | `eas build --profile production` | 🟢 Production |

---

## Backup Procedures

### Option 1: Cross-Project Backup (Production → Backup Firestore)

Copies all documents from `bovix-prod` to `bovix-backup`:

```bash
npm run db:backup
```

**What it does:**
1. Connects to both production and backup Firebase projects via Admin SDK
2. Reads all documents from each collection in production
3. Batch-writes them to the backup project with `merge: true`
4. Logs a summary with document counts and duration

### Option 2: JSON Export (Production → Local File)

Exports all data to a timestamped JSON file in `backups/`:

```bash
npm run db:backup:json
```

**Output:** `backups/bovix-backup_2026-08-03_061500.json`

**To export from a different source:**
```bash
cd scripts
FIRESTORE_SOURCE=test npx ts-node backup-to-json.ts
```

### Option 3: Automated Weekly Backup (GitHub Actions)

The `backup.yml` workflow runs automatically every **Sunday at 02:00 UTC**:

- Exports production Firestore to JSON
- Uploads the JSON as a GitHub Actions artifact (90-day retention)
- Mirrors data to the backup Firestore project

**Manual trigger:** Go to Actions → "Bovix Scheduled Database Backup" → Run workflow

### Backup Verification

After any backup, verify the data:

1. Check the backup log output for document counts
2. For JSON backups, inspect the file:
   ```bash
   cat backups/bovix-backup_*.json | python3 -m json.tool | head -30
   ```
3. For cross-project backups, check the backup project in Firebase Console

---

## Restore Procedures

### Restore to Test Database (Seeding)

Seeds the test database with production-like data:

```bash
npm run db:seed-test
```

### Restore to Backup Project

Restores from the most recent JSON backup:

```bash
npm run db:restore
```

### Restore from a Specific Backup File

```bash
cd scripts
BACKUP_FILE=../backups/bovix-backup_2026-08-03_061500.json \
  FIRESTORE_TARGET=test \
  npx ts-node restore-firestore.ts
```

### ⚠️ Production Restore

Direct restore to production is **blocked by default** as a safety measure. If you need to restore production data:

1. Restore to the backup project first
2. Verify all data in Firebase Console
3. Edit `restore-firestore.ts` to remove the production safety block
4. Run the restore with `FIRESTORE_TARGET=production`
5. **Re-enable the safety block immediately after**

---

## Security Rules Deployment

Each environment has its own Firestore rules file:

| File | Deploy To | Description |
|------|-----------|-------------|
| `firestore.rules` | `bovix-prod` | Per-collection auth checks + default deny |
| `firestore.test.rules` | `bovix-test` | Permissive (any auth user, all paths) |
| `firestore.backup.rules` | `bovix-backup` | Fully locked (deny all client access) |

### Deploying Rules

```bash
# Deploy production rules
firebase deploy --only firestore:rules --project bovix-prod

# Deploy test rules (rename first)
cp firestore.test.rules firestore.rules.bak
cp firestore.test.rules firestore.rules
firebase deploy --only firestore:rules --project bovix-test
cp firestore.rules.bak firestore.rules
rm firestore.rules.bak

# Deploy backup rules
cp firestore.backup.rules firestore.rules.bak
cp firestore.backup.rules firestore.rules
firebase deploy --only firestore:rules --project bovix-backup
cp firestore.rules.bak firestore.rules
rm firestore.rules.bak
```

> **Tip:** Consider using `firebase.json` with multi-project config for streamlined deployments.

---

## CI/CD Integration

### GitHub Secrets Required

Configure these in your repository's Settings → Secrets and variables → Actions:

| Secret | Description |
|--------|-------------|
| `EXPO_TOKEN` | Expo access token for EAS |
| `TEST_FIREBASE_API_KEY` | Test project API key |
| `TEST_FIREBASE_MESSAGING_SENDER_ID` | Test project messaging sender ID |
| `TEST_FIREBASE_APP_ID` | Test project app ID |
| `TEST_GOOGLE_WEB_CLIENT_ID` | Test project Google OAuth web client ID |
| `TEST_GOOGLE_ANDROID_CLIENT_ID` | Test project Google OAuth Android client ID |
| `FIREBASE_PROD_SERVICE_ACCOUNT` | Production service account JSON (for backup workflow) |
| `FIREBASE_BACKUP_SERVICE_ACCOUNT` | Backup service account JSON (for backup workflow) |

### How CI Uses the Test Database

The `ci.yml` workflow injects test environment variables via the `env` block, ensuring:

- TypeScript type checking runs against test config
- Jest tests connect to `bovix-test`
- OTA updates deploy with the correct environment

---

## Troubleshooting

### "Service account file not found"

```
Error: Service account file not found: /path/to/scripts/service-account-prod.json
```

**Fix:** Download the service account key from Firebase Console and place it in `scripts/`.

### "Running in __DEV__ mode against PRODUCTION database!"

**Fix:** You have `.env.production` credentials in your `.env` file. Run:
```bash
cp .env.test .env
```

### "App is connected to the BACKUP database"

**Fix:** The client app should never connect to the backup project. Check your `.env` file.

### Backup shows 0 documents

Possible causes:
1. The source project has no data yet
2. Service account doesn't have Firestore access
3. Collections are named differently than expected

**Fix:** Verify data exists in Firebase Console, and check that the service account has the "Cloud Datastore User" role.

### CI tests mutating production data

This should no longer happen with the updated `ci.yml`. Verify:
1. The `env` block in `ci.yml` points to `bovix-test`
2. GitHub Secrets contain test (not production) credentials
3. The `EXPO_PUBLIC_APP_ENV` is set to `test`

---

## Cost Summary

| Resource | Monthly Cost |
|----------|-------------|
| Firebase Spark plan × 3 projects | **$0** |
| GitHub Actions (backup workflow) | **$0** (2000 min/month free) |
| GitHub Artifacts (JSON backups) | **$0** (500 MB free) |
| **Total** | **$0/month** |

---

*Last updated: 2026-08-03*
