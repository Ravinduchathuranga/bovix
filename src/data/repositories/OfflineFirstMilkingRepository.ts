import { MilkingRepository } from '../../domain/repositories/MilkingRepository';
import { BulkMilkRecord } from '../../domain/entities/cattle';
import { MilkingCache } from '../offline/MilkingCache';
import { MilkingSyncQueue } from '../offline/MilkingSyncQueue';
import { NetworkMonitor } from '../offline/NetworkMonitor';

export class OfflineFirstMilkingRepository implements MilkingRepository {
  constructor(
    private firestoreRepo: MilkingRepository,
    private milkingCache: MilkingCache,
    private syncQueue: MilkingSyncQueue,
    private networkMonitor: NetworkMonitor
  ) { }

  async getMilkRecords(): Promise<BulkMilkRecord[]> {
    if (this.networkMonitor.isOnline()) {
      try {
        const remoteRecords = await this.firestoreRepo.getMilkRecords();
        await this.milkingCache.saveAll(remoteRecords);
        await this.milkingCache.setLastSyncTimestamp(new Date().toISOString());
        return remoteRecords;
      } catch (err) {
        console.warn('[OfflineFirstMilkingRepository] Remote fetch failed, using cache:', err);
        return await this.milkingCache.getAll();
      }
    }
    return await this.milkingCache.getAll();
  }

  async getMilkRecordsByDate(date: string): Promise<BulkMilkRecord[]> {
    if (this.networkMonitor.isOnline()) {
      try {
        const remoteRecords = await this.firestoreRepo.getMilkRecordsByDate(date);
        return remoteRecords;
      } catch (err) {
        console.warn('[OfflineFirstMilkingRepository] Remote fetch by date failed, using cache:', err);
        return await this.milkingCache.getByDate(date);
      }
    }
    return await this.milkingCache.getByDate(date);
  }

  async recordBulkMilk(
    recordData: Omit<BulkMilkRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Promise<BulkMilkRecord> {
    // 1. Composite key (date, session) pre-write deduplication check against local cache
    const sessionAlreadyRecorded = await this.milkingCache.hasSession(
      recordData.date,
      recordData.session
    );
    if (sessionAlreadyRecorded) {
      throw new Error(
        `A ${recordData.session} milking record for ${recordData.date} is already recorded.`
      );
    }

    // 2. Composite key pre-write check against pending sync queue ops
    const pendingOps = await this.syncQueue.getPending();
    const queuedSession = pendingOps.some((op) => {
      if (op.operationType === 'RECORD') {
        const rec = op.payload as BulkMilkRecord;
        return rec.date === recordData.date && rec.session === recordData.session;
      }
      return false;
    });
    if (queuedSession) {
      throw new Error(
        `A ${recordData.session} milking record for ${recordData.date} is already queued for sync.`
      );
    }

    // 3. Deterministic client-generated ID
    const id = recordData.id || `blk_${Date.now()}`;
    const createdAt = recordData.createdAt || new Date().toISOString();

    const newRecord: BulkMilkRecord = {
      ...recordData,
      id,
      createdAt,
    };

    if (this.networkMonitor.isOnline()) {
      try {
        const result = await this.firestoreRepo.recordBulkMilk(newRecord);
        await this.milkingCache.addOne(result);
        return result;
      } catch (err) {
        console.warn('[OfflineFirstMilkingRepository] Write to Firestore failed, queueing offline:', err);
        await this.milkingCache.addOne(newRecord);
        await this.syncQueue.enqueue({
          operationType: 'RECORD',
          payload: newRecord,
        });
        return newRecord;
      }
    } else {
      await this.milkingCache.addOne(newRecord);
      await this.syncQueue.enqueue({
        operationType: 'RECORD',
        payload: newRecord,
      });
      return newRecord;
    }
  }

  async deleteMilkRecord(id: string): Promise<void> {
    if (this.networkMonitor.isOnline()) {
      try {
        await this.firestoreRepo.deleteMilkRecord(id);
        await this.milkingCache.removeOne(id);
      } catch (err) {
        console.warn('[OfflineFirstMilkingRepository] Remote delete failed, queueing offline:', err);
        await this.milkingCache.removeOne(id);
        await this.syncQueue.enqueue({
          operationType: 'DELETE',
          payload: id,
        });
      }
    } else {
      await this.milkingCache.removeOne(id);
      await this.syncQueue.enqueue({
        operationType: 'DELETE',
        payload: id,
      });
    }
  }
}
