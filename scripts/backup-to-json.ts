#!/usr/bin/env ts-node
/**
 * ─────────────────────────────────────────────────────────────
 * Bovix — Firestore to JSON Export
 * ─────────────────────────────────────────────────────────────
 * Exports all Firestore collections from the PRODUCTION project
 * to timestamped JSON files in the /backups directory.
 *
 * This provides a zero-cost, offline backup that can be stored
 * in version control or external storage.
 *
 * Usage:
 *   npm run db:backup:json
 *   # or directly:
 *   cd scripts && npx ts-node backup-to-json.ts
 *
 * Output:
 *   backups/bovix-backup_2026-08-03_061500.json
 *
 * Prerequisites:
 *   - scripts/service-account-prod.json
 * ─────────────────────────────────────────────────────────────
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  initFirestoreAdmin,
  BOVIX_COLLECTIONS,
  getTimestamp,
  logSection,
  Environment,
} from './firebase-admin';

// Allow overriding the source environment via env var
const SOURCE_ENV = (process.env.FIRESTORE_SOURCE || 'production') as Environment;

async function backupToJson(): Promise<void> {
  const startTime = Date.now();
  logSection('📁 Bovix Firestore → JSON Export');

  const source = initFirestoreAdmin(SOURCE_ENV);
  console.log(`  Source    : ${source.projectId} (${SOURCE_ENV})`);
  console.log(`  Time      : ${new Date().toISOString()}`);

  const backupData: Record<string, Record<string, unknown>[]> = {};
  let totalDocs = 0;

  for (const collectionName of BOVIX_COLLECTIONS) {
    logSection(`📦 Collection: ${collectionName}`);

    try {
      const snapshot = await source.db.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`  ⚪ Empty — skipped`);
        backupData[collectionName] = [];
        continue;
      }

      const docs = snapshot.docs.map((doc: any) => ({
        _id: doc.id,
        ...doc.data(),
      }));

      backupData[collectionName] = docs;
      totalDocs += docs.length;
      console.log(`  📖 Exported ${docs.length} documents`);
    } catch (err) {
      console.error(`  ❌ Error reading ${collectionName}:`, err);
      backupData[collectionName] = [];
    }
  }

  // ── Write JSON File ─────────────────────────────────────────────────────────
  const backupsDir = path.resolve(__dirname, '..', 'backups');
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const filename = `bovix-backup_${getTimestamp()}.json`;
  const outputPath = path.join(backupsDir, filename);

  const output = {
    metadata: {
      source: source.projectId,
      environment: SOURCE_ENV,
      timestamp: new Date().toISOString(),
      collections: BOVIX_COLLECTIONS.slice(),
      totalDocuments: totalDocs,
    },
    data: backupData,
  };

  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2), 'utf-8');

  // ── Summary ─────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  const fileSizeKb = (fs.statSync(outputPath).size / 1024).toFixed(1);

  logSection('📊 Export Summary');
  console.log(`  Documents exported : ${totalDocs}`);
  console.log(`  Output file        : ${outputPath}`);
  console.log(`  File size          : ${fileSizeKb} KB`);
  console.log(`  Duration           : ${elapsed}s`);
  console.log('\n✅ JSON export completed successfully.');
}

backupToJson().catch((err) => {
  console.error('Fatal error during JSON export:', err);
  process.exit(1);
});
