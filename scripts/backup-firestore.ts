#!/usr/bin/env ts-node
/**
 * ─────────────────────────────────────────────────────────────
 * Bovix — Firestore Cross-Project Backup
 * ─────────────────────────────────────────────────────────────
 * Reads all documents from the PRODUCTION Firestore project
 * and writes them into the BACKUP Firestore project.
 *
 * Usage:
 *   npm run db:backup
 *   # or directly:
 *   cd scripts && npx ts-node backup-firestore.ts
 *
 * Prerequisites:
 *   - scripts/service-account-prod.json
 *   - scripts/service-account-backup.json
 * ─────────────────────────────────────────────────────────────
 */

import {
  initFirestoreAdmin,
  BOVIX_COLLECTIONS,
  getTimestamp,
  logSection,
} from './firebase-admin';

async function backupFirestore(): Promise<void> {
  const startTime = Date.now();
  logSection('🔵 Bovix Firestore Backup — Cross-Project');

  // Initialize source (production) and target (backup) Admin instances
  const source = initFirestoreAdmin('production');
  const target = initFirestoreAdmin('backup');

  console.log(`  Source : ${source.projectId} (production)`);
  console.log(`  Target : ${target.projectId} (backup)`);
  console.log(`  Time   : ${new Date().toISOString()}`);

  let totalDocsCopied = 0;
  let totalErrors = 0;

  for (const collectionName of BOVIX_COLLECTIONS) {
    logSection(`📦 Collection: ${collectionName}`);

    try {
      // Read all documents from source
      const snapshot = await source.db.collection(collectionName).get();

      if (snapshot.empty) {
        console.log(`  ⚪ Empty — skipped`);
        continue;
      }

      console.log(`  📖 Read ${snapshot.size} documents from source`);

      // Batch write to target (Firestore batches support up to 500 ops)
      const BATCH_SIZE = 450;
      let batchCount = 0;
      let batch = target.db.batch();

      for (const doc of snapshot.docs) {
        const targetRef = target.db.collection(collectionName).doc(doc.id);
        batch.set(targetRef, doc.data(), { merge: true });
        batchCount++;

        if (batchCount >= BATCH_SIZE) {
          await batch.commit();
          console.log(`  ✅ Committed batch of ${batchCount} documents`);
          totalDocsCopied += batchCount;
          batchCount = 0;
          batch = target.db.batch();
        }
      }

      // Commit remaining documents
      if (batchCount > 0) {
        await batch.commit();
        console.log(`  ✅ Committed final batch of ${batchCount} documents`);
        totalDocsCopied += batchCount;
      }
    } catch (err) {
      console.error(`  ❌ Error backing up ${collectionName}:`, err);
      totalErrors++;
    }
  }

  // ── Summary ─────────────────────────────────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  logSection('📊 Backup Summary');
  console.log(`  Documents copied : ${totalDocsCopied}`);
  console.log(`  Errors           : ${totalErrors}`);
  console.log(`  Duration         : ${elapsed}s`);
  console.log(`  Timestamp        : ${getTimestamp()}`);

  if (totalErrors > 0) {
    console.error('\n⚠️  Backup completed with errors. Review the log above.');
    process.exit(1);
  } else {
    console.log('\n✅ Backup completed successfully.');
  }
}

backupFirestore().catch((err) => {
  console.error('Fatal error during backup:', err);
  process.exit(1);
});
