/**
 * ─────────────────────────────────────────────────────────────
 * Bovix — Firebase Admin SDK Initialization (Shared)
 * ─────────────────────────────────────────────────────────────
 * Provides Firebase Admin instances for the backup/restore
 * scripts. Uses service account JSON files placed in this
 * directory (git-ignored for security).
 *
 * Expected files:
 *   scripts/service-account-prod.json
 *   scripts/service-account-backup.json
 *   scripts/service-account-test.json   (optional)
 *
 * Generate these from Firebase Console → Project Settings →
 * Service Accounts → Generate new private key.
 * ─────────────────────────────────────────────────────────────
 */

import { initializeApp, getApps, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// ── Types ───────────────────────────────────────────────────────────────────────

export type Environment = 'production' | 'backup' | 'test';

interface FirestoreInstance {
  app: App;
  db: Firestore;
  env: Environment;
  projectId: string;
}

// ── Known Firestore Collections ─────────────────────────────────────────────────
// These are the 5 collections used by Bovix. Update this list if new
// collections are added to the application.

export const BOVIX_COLLECTIONS = [
  'cattle',
  'milking_records',
  'company_receipts',
  'farm_stock',
  'stock_usage',
] as const;

// ── Initialization ──────────────────────────────────────────────────────────────

/**
 * Initializes a Firebase Admin SDK instance for the given environment.
 *
 * @param env - The target environment ('production' | 'backup' | 'test')
 * @returns A FirestoreInstance with the Admin app and Firestore reference
 * @throws If the service account file is not found
 */
export function initFirestoreAdmin(env: Environment): FirestoreInstance {
  const serviceAccountPath = path.resolve(
    __dirname,
    `service-account-${env === 'production' ? 'prod' : env}.json`
  );

  if (!fs.existsSync(serviceAccountPath)) {
    throw new Error(
      `Service account file not found: ${serviceAccountPath}\n` +
      `Download it from Firebase Console → Project Settings → Service Accounts → Generate new private key.\n` +
      `Save it as: scripts/service-account-${env === 'production' ? 'prod' : env}.json`
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
  const appName = `bovix-${env}`;

  // Check if the app is already initialized (avoid duplicate init errors)
  const existingApp = getApps().find((a: any) => a?.name === appName);
  if (existingApp) {
    return {
      app: existingApp,
      db: getFirestore(existingApp),
      env,
      projectId: serviceAccount.project_id,
    };
  }

  const app = initializeApp(
    {
      credential: cert(serviceAccount),
      projectId: serviceAccount.project_id,
    },
    appName
  );

  return {
    app,
    db: getFirestore(app),
    env,
    projectId: serviceAccount.project_id,
  };
}

// ── Utilities ───────────────────────────────────────────────────────────────────

/**
 * Returns a formatted timestamp string suitable for filenames.
 * Example: '2026-08-03_061500'
 */
export function getTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}` +
    `_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

/**
 * Logs a section header to the console for readable output.
 */
export function logSection(title: string): void {
  console.log(`\n${'─'.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'─'.repeat(60)}`);
}
