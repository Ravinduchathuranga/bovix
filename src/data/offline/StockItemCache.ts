import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedStockItem } from '../../domain/entities/stock';

const STOCK_ITEM_CACHE_KEY = '@bovix_stock_item_cache';
const STOCK_ITEM_LAST_SYNC_KEY = '@bovix_stock_item_last_sync';

export class StockItemCache {
  async getAll(): Promise<FeedStockItem[]> {
    try {
      const data = await AsyncStorage.getItem(STOCK_ITEM_CACHE_KEY);
      if (!data) return [];
      return JSON.parse(data) as FeedStockItem[];
    } catch (err) {
      console.warn('[StockItemCache] Read error:', err);
      return [];
    }
  }

  async getById(id: string): Promise<FeedStockItem | null> {
    const all = await this.getAll();
    return all.find((item) => item.id === id) || null;
  }

  async saveAll(items: FeedStockItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STOCK_ITEM_CACHE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('[StockItemCache] Write error:', err);
    }
  }

  async addOne(item: FeedStockItem): Promise<void> {
    const list = await this.getAll();
    const index = list.findIndex((i) => i.id === item.id);
    if (index >= 0) {
      list[index] = item;
    } else {
      list.unshift(item);
    }
    await this.saveAll(list);
  }

  async updateOne(id: string, updates: Partial<FeedStockItem>): Promise<FeedStockItem | null> {
    const list = await this.getAll();
    const index = list.findIndex((i) => i.id === id);
    if (index < 0) return null;

    const updatedItem: FeedStockItem = {
      ...list[index],
      ...updates,
      updatedAt: updates.updatedAt || new Date().toISOString(),
    };

    list[index] = updatedItem;
    await this.saveAll(list);
    return updatedItem;
  }

  async removeOne(id: string): Promise<void> {
    const list = await this.getAll();
    const updatedList = list.filter((i) => i.id !== id);
    await this.saveAll(updatedList);
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STOCK_ITEM_LAST_SYNC_KEY);
    } catch (err) {
      console.warn('[StockItemCache] Get last sync error:', err);
      return null;
    }
  }

  async setLastSyncTimestamp(ts: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STOCK_ITEM_LAST_SYNC_KEY, ts);
    } catch (err) {
      console.error('[StockItemCache] Set last sync error:', err);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([STOCK_ITEM_CACHE_KEY, STOCK_ITEM_LAST_SYNC_KEY]);
    } catch (err) {
      console.error('[StockItemCache] Clear error:', err);
    }
  }
}
