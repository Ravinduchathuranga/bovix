import AsyncStorage from '@react-native-async-storage/async-storage';
import { BulkMilkRecord } from '../../domain/entities/cattle';

const MILKING_SYNC_QUEUE_KEY = '@bovix_milking_sync_queue';

export interface MilkingSyncOperation {
  id: string;
  operationType: 'RECORD' | 'DELETE';
  payload: BulkMilkRecord | string; // BulkMilkRecord for RECORD, record id string for DELETE
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

export class MilkingSyncQueue {
  async getAll(): Promise<MilkingSyncOperation[]> {
    try {
      const data = await AsyncStorage.getItem(MILKING_SYNC_QUEUE_KEY);
      if (!data) return [];
      return JSON.parse(data) as MilkingSyncOperation[];
    } catch (err) {
      console.warn('[MilkingSyncQueue] Read error:', err);
      return [];
    }
  }

  private async saveAll(queue: MilkingSyncOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MILKING_SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[MilkingSyncQueue] Write error:', err);
    }
  }

  async enqueue(
    op: Omit<MilkingSyncOperation, 'id' | 'status' | 'retryCount' | 'timestamp'>
  ): Promise<void> {
    const queue = await this.getAll();
    const now = new Date().toISOString();

    if (op.operationType === 'RECORD') {
      const newRecord = op.payload as BulkMilkRecord;

      // Pre-write deduplication check against queued RECORD operations
      const hasQueuedSession = queue.some((item) => {
        if (item.operationType === 'RECORD') {
          const r = item.payload as BulkMilkRecord;
          return r.date === newRecord.date && r.session === newRecord.session;
        }
        return false;
      });

      if (hasQueuedSession) {
        throw new Error(
          `A ${newRecord.session} milking record for ${newRecord.date} is already queued for sync.`
        );
      }
    }

    if (op.operationType === 'DELETE') {
      const targetId = op.payload as string;
      const existingIndex = queue.findIndex((item) => {
        if (item.operationType === 'RECORD') {
          return (item.payload as BulkMilkRecord).id === targetId;
        }
        return false;
      });

      if (existingIndex >= 0) {
        // Created offline, deleted offline before sync -> cancel out both
        const updatedQueue = [...queue];
        updatedQueue.splice(existingIndex, 1);
        await this.saveAll(updatedQueue);
        return;
      }
    }

    const newOp: MilkingSyncOperation = {
      id: `op_milk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operationType: op.operationType,
      payload: op.payload,
      timestamp: now,
      status: 'pending',
      retryCount: 0,
    };

    const updatedQueue = [...queue, newOp];
    await this.saveAll(updatedQueue);
  }

  async dequeue(id: string): Promise<void> {
    const queue = await this.getAll();
    const updatedQueue = queue.filter((op) => op.id !== id);
    await this.saveAll(updatedQueue);
  }

  async getPending(): Promise<MilkingSyncOperation[]> {
    const queue = await this.getAll();
    return queue.filter((op) => op.status === 'pending' || op.status === 'failed');
  }

  async markSyncing(id: string): Promise<void> {
    const queue = await this.getAll();
    const updatedQueue = queue.map((op) =>
      op.id === id ? { ...op, status: 'syncing' as const } : op
    );
    await this.saveAll(updatedQueue);
  }

  async markFailed(id: string): Promise<void> {
    const queue = await this.getAll();
    const updatedQueue = queue.map((op) =>
      op.id === id ? { ...op, status: 'failed' as const, retryCount: op.retryCount + 1 } : op
    );
    await this.saveAll(updatedQueue);
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(MILKING_SYNC_QUEUE_KEY);
    } catch (err) {
      console.error('[MilkingSyncQueue] Clear error:', err);
    }
  }
}
