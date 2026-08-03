#!/usr/bin/env ts-node
/**
 * ─────────────────────────────────────────────────────────────
 * Bovix — Firestore Restore from JSON
 * ─────────────────────────────────────────────────────────────
 * Restores Firestore data from a JSON backup file into any
 * target environment. Useful for:
 *   - Disaster recovery (restore production from backup)
 *   - Seeding the test database with production-like data
 *
 * Usage:
 *   # Restore to backup project (default target):
 *   npm run db:restore
 *
 *   # Seed the test database:
 *   npm run db:seed-test
 *
 *   # Custom: specify both source file and target
 *   FIRESTORE_TARGET=test BACKUP_FILE=backups/bovix-backup_2026-08-03_061500.json \
 *     npx ts-node restore-firestore.ts
 *
 * Prerequisites:
 *   - A JSON backup file in /backups (created by backup-to-json.ts)
 *   - Service account for the target environment
 * ─────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  initFirestoreAdmin,
  BOVIX_COLLECTIONS,
  logSection,
  Environment,
} from './firebase-admin';

// ── Configuration via Environment Variables ─────────────────────────────────
const TARGET_ENV = (process.env.FIRESTORE_TARGET || 'backup') as Environment;

interface BackupFile {
  metadata: {
    source: string;
    environment: string;
    timestamp: string;
    collections: string[];
    totalDocuments: number;
  };
  data: Record<string, Array<Record<string, unknown>>>;
}

/**
 * Finds the most recent backup file in the backups/ directory,
 * or uses the file specified by the BACKUP_FILE env var.
 */
function resolveBackupFile(): string {
  const explicit = process.env.BACKUP_FILE;
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Specified backup file not found: ${resolved}`);
    }
    return resolved;
  }

  // Auto-detect the most recent backup
  const backupsDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    throw new Error(`Backups directory not found: ${backupsDir}`);
  }

  const files = fs
    .readdirSync(backupsDir)
    .filter((f) => f.startsWith('bovix-backup_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error(
      `No backup files found in ${backupsDir}.\n` +
        `Run 'npm run db:backup:json' first to create a backup.`
    );
  }

  return path.join(backupsDir, files[0]);
}

async function restoreFirestore(): Promise<void> {
  const startTime = Date.now();
  logSection('🔄 Bovix Firestore Restore from JSON');

  // ── Safety check: prevent accidental restore to production ──────────────────
  if (TARGET_ENV === 'production') {
    console.error(
      '❌ SAFETY BLOCK: Restoring directly to PRODUCTION is disabled.\n' +
        '   To restore production data, first restore to the backup project,\n' +
        '   verify the data, then manually promote it.\n' +
        '   If you truly need to restore production, edit this script.'
    );
    process.exit(1);
  }

  // Resolve the backup file
  const backupFilePath = resolveBackupFile();
  console.log(`  Backup file : ${backupFilePath}`);

  // Parse the backup
  const raw = fs.readFileSync(backupFilePath, 'utf-8');
  const backup: BackupFile = JSON.parse(raw);

  console.log(`  Source info  : ${backup.metadata.source} (${backup.metadata.environment})`);
  console.log(`  Backup date  : ${backup.metadata.timestamp}`);
  console.log(`  Total docs   : ${backup.metadata.totalDocuments}`);

  // Initialize target
  const target = initFirestoreAdmin(TARGET_ENV);
  console.log(`  Target       : ${target.projectId} (${TARGET_ENV})`);

  let totalDocsRestored = 0;
  let totalErrors = 0;

  for (const collectionName of BOVIX_COLLECTIONS) {
    logSection(`📦 Restoring: ${collectionName}`);

    const docs = backup.data[collectionName];
    if (!docs || docs.length === 0) {
      console.log(`  ⚪ No data — skipped`);
      continue;
    }

    console.log(`  📖 ${docs.length} documents to restore`);

    try {
      const BATCH_SIZE = 450;
      let batchCount = 0;
      let batch = target.db.batch();

      for (const doc of docs) {
        // Extract the document ID (stored as _id during export)
        const docId = doc._id as string;
        if (!docId) {
          console.warn(`  ⚠️  Skipping document without _id in ${collectionName}`);
          continue;
        }

        // Remove the _id field from the data (it's the document key, not a field)
        const { _id, ...data } = doc;
        const targetRef = target.db.collection(collectionName).doc(docId);
        batch.set(targetRef, data, { merge: true });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  ✅ Committed batch of ${batchCount} documents`);
          totalDocsRestored += batchCount;
          batchCount = 0;
          batch = target.db.batch();
        }
      }

      // Commit remaining
      if (batchCount > 0) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} documents`);
        totalDocsRestored += batchCount;
      }
    } catch (err) {
      console.error(`  ❌ Error restoring ${collectionName}:`, err);
      totalErrors++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logSection('📊 Restore Summary');
  console.log(`  Documents restored : ${totalDocsRestored}`);
  console.log(`  Errors             : ${totalErrors}`);
  console.log(`  Target project     : ${target.projectId} (${TARGET_ENV})`);
  console.log(`  Duration           : ${elapsed}s`);

  if (totalErrors > 0) {
    console.error('\n⚠️  Restore completed with errors. Review the log above.');
    process.exit(1);
  } else {
    console.log('\n✅ Restore completed successfully.');
  }
}

restoreFirestore().catch((err) => {
  console.error('Fatal error during restore:', err);
  process.exit(1);
});
