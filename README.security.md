# Bovix — Security & Secrets Setup Guide

## How Service Account Keys Work in This Project

The backup/restore scripts in `scripts/` require Firebase Admin SDK service account keys.
These keys grant **full admin access** to Firestore and are **never committed to git**.

### For Local Script Execution

1. Download the service account key from Firebase Console:
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Select the project (`bovix-prod`, `bovix-backup`, or `bovix-test`)
   - Navigate to **Project Settings → Service Accounts → Generate new private key**
   - Save the file as one of the following (all git-ignored):

   | Environment | Save file as |
   |-------------|-------------|
   | Production  | `scripts/service-account-prod.json` |
   | Backup      | `scripts/service-account-backup.json` |
   | Test        | `scripts/service-account-test.json` |

2. Run the desired script:
   ```bash
   cd scripts
   npx ts-node backup-to-json.ts        # JSON backup
   npx ts-node backup-firestore.ts      # Cross-project mirror
   ```

3. **Delete the file after use** — do not leave service account keys on disk longer than needed.

### For CI/CD (GitHub Actions)

Service account keys are injected from GitHub Secrets at runtime — you do NOT commit them.

| GitHub Secret | Used for |
|---------------|---------|
| `FIREBASE_PROD_SERVICE_ACCOUNT` | Production Firestore access |
| `FIREBASE_BACKUP_SERVICE_ACCOUNT` | Backup Firestore access |

To add/rotate: **GitHub repo → Settings → Secrets and variables → Actions → New repository secret**
Paste the entire contents of the downloaded service account JSON as the secret value.

---

## Environment Variables (.env files)

Never commit `.env*` files. Use `.env.example` as a reference template.

| File | Purpose | Git-tracked? |
|------|---------|-------------|
| `.env.example` | Template (no real values) | ✅ Yes |
| `.env` | Local dev (real test keys) | ❌ Never |
| `.env.test` | Test env keys | ❌ Never |
| `.env.production` | Production keys | ❌ Never |
| `.env.backup` | Backup env keys | ❌ Never |

---

## Firestore Security Rules

All 5 collections (`cattle`, `milking_records`, `company_receipts`, `farm_stock`, `stock_usage`) require `request.auth != null`. All other paths default to **deny**.

The Firebase Web API Key is bundled in the app binary (this is normal for Firebase SDK), but is useless without a valid authenticated Firebase user token due to these rules.
