import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cattle } from '../../domain/entities/cattle';

const SYNC_QUEUE_KEY = '@bovix_sync_queue';

export interface SyncOperation {
  id: string; // unique queue operation id
  operationType: 'ADD' | 'UPDATE' | 'DELETE';
  payload: Cattle | string; // Cattle for ADD/UPDATE, entity id string for DELETE
  timestamp: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
}

export class SyncQueue {
  async getAll(): Promise<SyncOperation[]> {
    try {
      const data = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (!data) return [];
      return JSON.parse(data) as SyncOperation[];
    } catch (err) {
      console.warn('[SyncQueue] Read error:', err);
      return [];
    }
  }

  private async saveAll(queue: SyncOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (err) {
      console.error('[SyncQueue] Write error:', err);
    }
  }

  async enqueue(op: Omit<SyncOperation, 'id' | 'status' | 'retryCount' | 'timestamp'>): Promise<void> {
    const queue = await this.getAll();
    const targetEntityId = typeof op.payload === 'string' ? op.payload : op.payload.id;
    const now = new Date().toISOString();

    // Deduplication and Cancellation logic
    const existingIndex = queue.findIndex((item) => {
      const itemId = typeof item.payload === 'string' ? item.payload : item.payload.id;
      return itemId === targetEntityId;
    });

    let updatedQueue: SyncOperation[] = [...queue];

    if (existingIndex >= 0) {
      const existingOp = queue[existingIndex];

      if (op.operationType === 'DELETE') {
        if (existingOp.operationType === 'ADD') {
          // Created offline, deleted offline before sync -> cancel out both (net no-op)
          updatedQueue.splice(existingIndex, 1);
          await this.saveAll(updatedQueue);
          return;
        } else {
          // Existing UPDATE or DELETE -> replace with new DELETE
          updatedQueue[existingIndex] = {
            id: existingOp.id,
            operationType: 'DELETE',
            payload: targetEntityId,
            timestamp: now,
            status: 'pending',
            retryCount: 0,
          };
          await this.saveAll(updatedQueue);
          return;
        }
      } else if (op.operationType === 'UPDATE') {
        if (existingOp.operationType === 'ADD') {
          // Update the payload of the un-synced ADD operation
          updatedQueue[existingIndex] = {
            ...existingOp,
            payload: op.payload,
            timestamp: now,
            status: 'pending',
          };
          await this.saveAll(updatedQueue);
          return;
        } else if (existingOp.operationType === 'UPDATE') {
          // Merge UPDATE payload
          updatedQueue[existingIndex] = {
            ...existingOp,
            payload: op.payload,
            timestamp: now,
            status: 'pending',
          };
          await this.saveAll(updatedQueue);
          return;
        }
      }
    }

    // New operation not matching existing queue items
    const newOp: SyncOperation = {
      id: `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operationType: op.operationType,
      payload: op.payload,
      timestamp: now,
      status: 'pending',
      retryCount: 0,
    };

    updatedQueue.push(newOp);
    await this.saveAll(updatedQueue);
  }

  async dequeue(id: string): Promise<void> {
    const queue = await this.getAll();
    const updatedQueue = queue.filter((op) => op.id !== id);
    await this.saveAll(updatedQueue);
  }

  async getPending(): Promise<SyncOperation[]> {
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
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
    } catch (err) {
      console.error('[SyncQueue] Clear error:', err);
    }
  }
}
