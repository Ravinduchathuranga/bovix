import AsyncStorage from '@react-native-async-storage/async-storage';
import { FeedUsageRecord } from '../../domain/entities/stock';

const STOCK_USAGE_CACHE_KEY = '@bovix_stock_usage_cache';

export class StockUsageCache {
  async getAll(): Promise<FeedUsageRecord[]> {
    try {
      const data = await AsyncStorage.getItem(STOCK_USAGE_CACHE_KEY);
      if (!data) return [];
      return JSON.parse(data) as FeedUsageRecord[];
    } catch (err) {
      console.warn('[StockUsageCache] Read error:', err);
      return [];
    }
  }

  async saveAll(records: FeedUsageRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STOCK_USAGE_CACHE_KEY, JSON.stringify(records));
    } catch (err) {
      console.error('[StockUsageCache] Write error:', err);
    }
  }

  async addOne(record: FeedUsageRecord): Promise<void> {
    const list = await this.getAll();
    const index = list.findIndex((r) => r.id === record.id);
    if (index >= 0) {
      list[index] = record;
    } else {
      list.unshift(record);
    }
    await this.saveAll(list);
  }

  async removeOne(id: string): Promise<void> {
    const list = await this.getAll();
    const updatedList = list.filter((r) => r.id !== id);
    await this.saveAll(updatedList);
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STOCK_USAGE_CACHE_KEY);
    } catch (err) {
      console.error('[StockUsageCache] Clear error:', err);
    }
  }
}
