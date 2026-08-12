import { StockRepository } from '../../domain/repositories/StockRepository';
import { FeedStockItem, FeedUsageRecord } from '../../domain/entities/stock';
import { StockItemCache } from '../offline/StockItemCache';
import { StockUsageCache } from '../offline/StockUsageCache';
import { StockSyncQueue } from '../offline/StockSyncQueue';
import { NetworkMonitor } from '../offline/NetworkMonitor';

export class OfflineFirstStockRepository implements StockRepository {
  constructor(
    private firestoreRepo: StockRepository,
    private stockItemCache: StockItemCache,
    private stockUsageCache: StockUsageCache,
    private syncQueue: StockSyncQueue,
    private networkMonitor: NetworkMonitor
  ) {}

  async getStockItems(): Promise<FeedStockItem[]> {
    if (this.networkMonitor.isOnline()) {
      try {
        const items = await this.firestoreRepo.getStockItems();
        await this.stockItemCache.saveAll(items);
        await this.stockItemCache.setLastSyncTimestamp(new Date().toISOString());
        return items;
      } catch (err) {
        console.warn('[OfflineFirstStockRepository] Online fetch failed, falling back to cache:', err);
        return await this.stockItemCache.getAll();
      }
    }
    return await this.stockItemCache.getAll();
  }

  async addStockItem(
    itemData: Omit<FeedStockItem, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FeedStockItem> {
    const id = `stk_${Date.now()}`;
    const now = new Date().toISOString();
    const newItem: FeedStockItem = {
      ...itemData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    if (this.networkMonitor.isOnline()) {
      try {
        const saved = await this.firestoreRepo.addStockItem(newItem);
        await this.stockItemCache.addOne(saved);
        return saved;
      } catch (err) {
        console.warn('[OfflineFirstStockRepository] Online add failed, falling back to queue:', err);
      }
    }

    // Offline or network fallback
    await this.stockItemCache.addOne(newItem);
    await this.syncQueue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'ADD',
      payload: newItem,
      entityId: newItem.id,
    });
    return newItem;
  }

  async updateStockItem(id: string, updates: Partial<FeedStockItem>): Promise<FeedStockItem> {
    const now = new Date().toISOString();
    const cleanUpdates = { ...updates, updatedAt: now };

    if (this.networkMonitor.isOnline()) {
      try {
        const updated = await this.firestoreRepo.updateStockItem(id, cleanUpdates);
        await this.stockItemCache.addOne(updated);
        return updated;
      } catch (err) {
        console.warn('[OfflineFirstStockRepository] Online update failed, falling back to queue:', err);
      }
    }

    // Offline or network fallback
    const updated = await this.stockItemCache.updateOne(id, cleanUpdates);
    if (!updated) {
      throw new Error(`Stock item ${id} not found in local cache.`);
    }

    await this.syncQueue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'UPDATE',
      payload: cleanUpdates,
      entityId: id,
    });

    return updated;
  }

  async deleteStockItem(id: string): Promise<void> {
    if (this.networkMonitor.isOnline()) {
      try {
        await this.firestoreRepo.deleteStockItem(id);
        await this.stockItemCache.removeOne(id);
        return;
      } catch (err) {
        console.warn('[OfflineFirstStockRepository] Online delete failed, falling back to queue:', err);
      }
    }

    // Offline or network fallback
    await this.stockItemCache.removeOne(id);
    await this.syncQueue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'DELETE',
      payload: id,
      entityId: id,
    });
  }

  async recordFeedUsage(
    usageData: Omit<FeedUsageRecord, 'id' | 'createdAt'>
  ): Promise<FeedUsageRecord> {
    const usageId = `usg_${Date.now()}`;
    const now = new Date().toISOString();
    const correlationId = `corr_${Date.now()}`;

    const newUsage: FeedUsageRecord = {
      ...usageData,
      id: usageId,
      createdAt: now,
    };

    if (this.networkMonitor.isOnline()) {
      try {
        const savedUsage = await this.firestoreRepo.recordFeedUsage(newUsage);
        await this.stockUsageCache.addOne(savedUsage);
        return savedUsage;
      } catch (err) {
        console.warn('[OfflineFirstStockRepository] Online recordFeedUsage failed, falling back to queue:', err);
      }
    }

    // Offline or network fallback:
    // 1. Save usage record to StockUsageCache
    await this.stockUsageCache.addOne(newUsage);

    // 2. Queue usage record creation
    await this.syncQueue.enqueue({
      entityType: 'USAGE_RECORD',
      operationType: 'RECORD',
      payload: newUsage,
      entityId: usageId,
      correlationId,
    });

    return newUsage;
  }

  async getFeedUsageHistory(): Promise<FeedUsageRecord[]> {
    if (this.networkMonitor.isOnline()) {
      try {
        const history = await this.firestoreRepo.getFeedUsageHistory();
        await this.stockUsageCache.saveAll(history);
        return history;
      } catch (err) {
        console.warn('[OfflineFirstStockRepository] Online getFeedUsageHistory failed, falling back to cache:', err);
        return await this.stockUsageCache.getAll();
      }
    }
    return await this.stockUsageCache.getAll();
  }
}
