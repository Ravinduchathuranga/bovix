import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedStockItem, FeedUsageRecord } from '../../domain/entities/stock';

const STOCK_SYNC_QUEUE_KEY = '@bovix_stock_sync_queue';

export interface StockSyncOperation {
  id: string;
  entityType: 'STOCK_ITEM' | 'USAGE_RECORD';
  operationType: 'ADD' | 'UPDATE' | 'DELETE' | 'RECORD';
  payload: FeedStockItem | FeedUsageRecord | Partial<FeedStockItem> | string;
  entityId: string;
  correlationId?: string;
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

export class StockSyncQueue {
  async getAll(): Promise<StockSyncOperation[]> {
    try {
      const data = await AsyncStorage.getItem(STOCK_SYNC_QUEUE_KEY);
      if (!data) return [];
      return JSON.parse(data) as StockSyncOperation[];
    } catch (err) {
      console.warn('[StockSyncQueue] Read error:', err);
      return [];
    }
  }

  async getPending(): Promise<StockSyncOperation[]> {
    const queue = await this.getAll();
    return queue.filter((op) => op.status === 'pending');
  }

  async saveQueue(queue: StockSyncOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STOCK_SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[StockSyncQueue] Write error:', err);
    }
  }

  async enqueue(
    op: Omit<StockSyncOperation, 'id' | 'timestamp' | 'status' | 'retryCount'>
  ): Promise<StockSyncOperation> {
    const queue = await this.getAll();
    const newOp: StockSyncOperation = {
      ...op,
      id: `op_stk_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    // Deduplication rules for STOCK_ITEM
    if (op.entityType === 'STOCK_ITEM') {
      if (op.operationType === 'UPDATE') {
        const existingUpdateIndex = queue.findIndex(
          (o) =>
            o.entityType === 'STOCK_ITEM' &&
            o.entityId === op.entityId &&
            o.operationType === 'UPDATE' &&
            o.status === 'pending'
        );
        if (existingUpdateIndex >= 0) {
          // Replace existing update payload with latest values
          const existingPayload = queue[existingUpdateIndex].payload as Partial<FeedStockItem>;
          queue[existingUpdateIndex].payload = {
            ...existingPayload,
            ...(op.payload as Partial<FeedStockItem>),
          };
          queue[existingUpdateIndex].timestamp = newOp.timestamp;
          await this.saveQueue(queue);
          return queue[existingUpdateIndex];
        }
      } else if (op.operationType === 'DELETE') {
        const existingAddIndex = queue.findIndex(
          (o) =>
            o.entityType === 'STOCK_ITEM' &&
            o.entityId === op.entityId &&
            o.operationType === 'ADD' &&
            o.status === 'pending'
        );
        if (existingAddIndex >= 0) {
          // Cancel out ADD and DELETE for un-synced item
          queue.splice(existingAddIndex, 1);
          await this.saveQueue(queue);
          return newOp;
        }
      }
    }

    queue.push(newOp);
    await this.saveQueue(queue);
    return newOp;
  }

  async dequeue(id: string): Promise<void> {
    const queue = await this.getAll();
    const updated = queue.filter((op) => op.id !== id);
    await this.saveQueue(updated);
  }

  async markSyncing(id: string): Promise<void> {
    const queue = await this.getAll();
    const op = queue.find((o) => o.id === id);
    if (op) {
      op.status = 'syncing';
      await this.saveQueue(queue);
    }
  }

  async markFailed(id: string): Promise<void> {
    const queue = await this.getAll();
    const op = queue.find((o) => o.id === id);
    if (op) {
      op.status = 'failed';
      op.retryCount += 1;
      // Reset back to pending if retry budget allows
      if (op.retryCount < 3) {
        op.status = 'pending';
      }
      await this.saveQueue(queue);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STOCK_SYNC_QUEUE_KEY);
    } catch (err) {
      console.error('[StockSyncQueue] Clear error:', err);
    }
  }
}
