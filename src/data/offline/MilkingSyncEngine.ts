import { MilkingSyncQueue } from './MilkingSyncQueue';
import { MilkingCache } from './MilkingCache';
import { MilkingRepository } from '../../domain/repositories/MilkingRepository';
import { NetworkMonitor } from './NetworkMonitor';
import { BulkMilkRecord } from '../../domain/entities/cattle';

export class MilkingSyncEngine {
  private isSyncing: boolean = false;
  private unsubscribeReconnect: (() => void) | null = null;

  constructor(
    private syncQueue: MilkingSyncQueue,
    private milkingCache: MilkingCache,
    private firestoreRepo: MilkingRepository,
    private networkMonitor: NetworkMonitor
  ) {
    this.unsubscribeReconnect = this.networkMonitor.onReconnect(() => {
      this.sync().catch((err) => {
        console.error('[MilkingSyncEngine] Auto-sync on reconnect failed:', err);
      });
    });
  }

  async sync(): Promise<void> {
    if (!this.networkMonitor.isOnline()) {
      return;
    }

    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;

    try {
      const pendingOps = await this.syncQueue.getPending();

      for (const op of pendingOps) {
        if (op.retryCount >= 3) {
          console.warn(
            `[MilkingSyncEngine] Dropping operation ${op.id} after exceeding max retry count (3).`
          );
          await this.syncQueue.dequeue(op.id);
          continue;
        }

        await this.syncQueue.markSyncing(op.id);

        try {
          if (op.operationType === 'RECORD') {
            const recordData = op.payload as BulkMilkRecord;
            await this.firestoreRepo.recordBulkMilk(recordData);
          } else if (op.operationType === 'DELETE') {
            const recordId = op.payload as string;
            await this.firestoreRepo.deleteMilkRecord(recordId);
          }

          await this.syncQueue.dequeue(op.id);
        } catch (err) {
          console.error(`[MilkingSyncEngine] Error syncing op ${op.id}:`, err);
          await this.syncQueue.markFailed(op.id);
        }
      }

      // Post-sync cache refresh from server
      try {
        const remoteRecords = await this.firestoreRepo.getMilkRecords();
        await this.milkingCache.saveAll(remoteRecords);
        await this.milkingCache.setLastSyncTimestamp(new Date().toISOString());
      } catch (cacheErr) {
        console.warn('[MilkingSyncEngine] Failed to refresh cache post-sync:', cacheErr);
      }
    } finally {
      this.isSyncing = false;
    }
  }

  dispose(): void {
    if (this.unsubscribeReconnect) {
      this.unsubscribeReconnect();
      this.unsubscribeReconnect = null;
    }
  }
}
