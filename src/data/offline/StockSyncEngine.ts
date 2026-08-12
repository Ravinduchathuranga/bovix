import { StockSyncQueue } from './StockSyncQueue';
import { StockItemCache } from './StockItemCache';
import { StockUsageCache } from './StockUsageCache';
import { StockRepository } from '../../domain/repositories/StockRepository';
import { NetworkMonitor } from './NetworkMonitor';
import { FeedStockItem, FeedUsageRecord } from '../../domain/entities/stock';

export class StockSyncEngine {
  private isSyncing: boolean = false;
  private unsubscribeReconnect: (() => void) | null = null;

  constructor(
    private syncQueue: StockSyncQueue,
    private stockItemCache: StockItemCache,
    private stockUsageCache: StockUsageCache,
    private firestoreRepo: StockRepository,
    private networkMonitor: NetworkMonitor
  ) {
    this.unsubscribeReconnect = this.networkMonitor.onReconnect(() => {
      this.sync().catch((err) => {
        console.error('[StockSyncEngine] Auto-sync on reconnect failed:', err);
      });
    });
  }

  async sync(): Promise<void> {
    if (!this.networkMonitor.isOnline()) return;
    if (this.isSyncing) return;

    this.isSyncing = true;

    try {
      const pendingOps = await this.syncQueue.getPending();

      for (const op of pendingOps) {
        if (op.retryCount >= 3) {
          console.warn(
            `[StockSyncEngine] Dropping operation ${op.id} after exceeding max retry count (3).`
          );
          await this.syncQueue.dequeue(op.id);
          continue;
        }

        await this.syncQueue.markSyncing(op.id);

        try {
          if (op.entityType === 'STOCK_ITEM') {
            if (op.operationType === 'ADD') {
              const itemData = op.payload as FeedStockItem;
              await this.firestoreRepo.addStockItem(itemData);
            } else if (op.operationType === 'UPDATE') {
              const updates = op.payload as Partial<FeedStockItem>;
              // LWW Check: compare local op.timestamp with remote item's updatedAt if item exists
              const remoteItems = await this.firestoreRepo.getStockItems();
              const remoteItem = remoteItems.find((i) => i.id === op.entityId);

              if (remoteItem && remoteItem.updatedAt) {
                const remoteTime = new Date(remoteItem.updatedAt).getTime();
                const localTime = new Date(op.timestamp).getTime();

                if (remoteTime > localTime) {
                  console.info(
                    `[StockSyncEngine] Skipping local update for ${op.entityId} — remote is newer (remote: ${remoteItem.updatedAt}, local: ${op.timestamp}).`
                  );
                  await this.syncQueue.dequeue(op.id);
                  continue;
                }
              }

              await this.firestoreRepo.updateStockItem(op.entityId, updates);
            } else if (op.operationType === 'DELETE') {
              await this.firestoreRepo.deleteStockItem(op.entityId);
            }
          } else if (op.entityType === 'USAGE_RECORD') {
            if (op.operationType === 'RECORD') {
              const usageData = op.payload as FeedUsageRecord;
              await this.firestoreRepo.recordFeedUsage(usageData);
            }
          }

          await this.syncQueue.dequeue(op.id);
        } catch (err) {
          console.error(`[StockSyncEngine] Failed to sync operation ${op.id}:`, err);
          await this.syncQueue.markFailed(op.id);
        }
      }

      // Post-sync: refresh caches from Firestore to ensure single source of truth
      const freshItems = await this.firestoreRepo.getStockItems();
      await this.stockItemCache.saveAll(freshItems);
      await this.stockItemCache.setLastSyncTimestamp(new Date().toISOString());

      const freshUsage = await this.firestoreRepo.getFeedUsageHistory();
      await this.stockUsageCache.saveAll(freshUsage);
    } catch (err) {
      console.error('[StockSyncEngine] Sync iteration error:', err);
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
