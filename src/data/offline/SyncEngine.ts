import { SyncQueue, SyncOperation } from './SyncQueue';
import { CattleCache } from './CattleCache';
import { FirestoreCattleRepository } from '../repositories/FirestoreCattleRepository';
import { NetworkMonitor } from './NetworkMonitor';
import { Cattle } from '../../domain/entities/cattle';

export class SyncEngine {
  private isSyncing: boolean = false;
  private unsubscribeNetwork: (() => void) | null = null;

  constructor(
    private syncQueue: SyncQueue,
    private cattleCache: CattleCache,
    private firestoreRepo: FirestoreCattleRepository,
    private networkMonitor: NetworkMonitor
  ) {
    this.unsubscribeNetwork = this.networkMonitor.onReconnect(() => {
      this.sync();
    });
  }

  async sync(): Promise<void> {
    if (this.isSyncing) return;
    if (!this.networkMonitor.isOnline()) return;

    this.isSyncing = true;
    try {
      const pendingOps = await this.syncQueue.getPending();
      if (pendingOps.length === 0) {
        this.isSyncing = false;
        return;
      }

      // Priority ordering: DELETE -> UPDATE -> ADD
      const sortedOps = [...pendingOps].sort((a, b) => {
        const orderMap: Record<SyncOperation['operationType'], number> = {
          DELETE: 1,
          UPDATE: 2,
          ADD: 3,
        };
        return orderMap[a.operationType] - orderMap[b.operationType];
      });

      for (const op of sortedOps) {
        if (!this.networkMonitor.isOnline()) {
          console.warn('[SyncEngine] Network connection lost during sync batch.');
          break;
        }

        if (op.retryCount >= 3) {
          console.warn(`[SyncEngine] Operation ${op.id} exceeded max retries (3). Dequeueing to prevent queue blocking.`);
          await this.syncQueue.dequeue(op.id);
          continue;
        }

        await this.syncQueue.markSyncing(op.id);

        try {
          if (op.operationType === 'DELETE') {
            const cattleId = op.payload as string;
            await this.firestoreRepo.deleteCattle(cattleId);
          } else if (op.operationType === 'UPDATE') {
            const localCattle = op.payload as Cattle;
            const remoteCattle = await this.firestoreRepo.getCattleById(localCattle.id);

            // LWW Conflict Resolution
            if (
              remoteCattle &&
              remoteCattle.updatedAt &&
              localCattle.updatedAt &&
              new Date(remoteCattle.updatedAt).getTime() > new Date(localCattle.updatedAt).getTime()
            ) {
              console.log(`[SyncEngine] LWW: Remote record (${remoteCattle.updatedAt}) is newer than local (${localCattle.updatedAt}). Skipping local update.`);
            } else {
              await this.firestoreRepo.updateCattle(localCattle);
            }
          } else if (op.operationType === 'ADD') {
            const cattle = op.payload as Cattle;
            await this.firestoreRepo.addCattle(cattle);
          }

          // Successfully processed operation
          await this.syncQueue.dequeue(op.id);
        } catch (err) {
          console.error(`[SyncEngine] Failed to process ${op.operationType} for operation ${op.id}:`, err);
          await this.syncQueue.markFailed(op.id);
        }
      }

      // Post-sync reconciliation: refresh local cache from Firestore if online
      if (this.networkMonitor.isOnline()) {
        try {
          const freshCattle = await this.firestoreRepo.getAllCattle();
          await this.cattleCache.saveAll(freshCattle);
          await this.cattleCache.setLastSyncTimestamp(new Date().toISOString());
        } catch (err) {
          console.warn('[SyncEngine] Failed to refresh cache after sync:', err);
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  dispose(): void {
    if (this.unsubscribeNetwork) {
      this.unsubscribeNetwork();
      this.unsubscribeNetwork = null;
    }
  }
}
