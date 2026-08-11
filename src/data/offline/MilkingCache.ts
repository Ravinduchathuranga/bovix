import AsyncStorage from '@react-native-async-storage/async-storage';
import { BulkMilkRecord } from '../../domain/entities/cattle';

const MILKING_CACHE_KEY = '@bovix_milking_cache';
const MILKING_LAST_SYNC_KEY = '@bovix_milking_last_sync';

export class MilkingCache {
  async getAll(): Promise<BulkMilkRecord[]> {
    try {
      const data = await AsyncStorage.getItem(MILKING_CACHE_KEY);
      if (!data) return [];
      return JSON.parse(data) as BulkMilkRecord[];
    } catch (err) {
      console.warn('[MilkingCache] Read error:', err);
      return [];
    }
  }

  async getByDate(date: string): Promise<BulkMilkRecord[]> {
    const all = await this.getAll();
    return all.filter((r) => r.date === date);
  }

  async saveAll(records: BulkMilkRecord[]): Promise<void> {
    try {
      await AsyncStorage.setItem(MILKING_CACHE_KEY, JSON.stringify(records));
    } catch (err) {
      console.error('[MilkingCache] Write error:', err);
    }
  }

  async addOne(record: BulkMilkRecord): Promise<void> {
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

  async hasSession(date: string, session: 'Morning' | 'Evening'): Promise<boolean> {
    const records = await this.getByDate(date);
    return records.some((r) => r.session === session);
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(MILKING_LAST_SYNC_KEY);
    } catch (err) {
      console.warn('[MilkingCache] Get last sync error:', err);
      return null;
    }
  }

  async setLastSyncTimestamp(ts: string): Promise<void> {
    try {
      await AsyncStorage.setItem(MILKING_LAST_SYNC_KEY, ts);
    } catch (err) {
      console.error('[MilkingCache] Set last sync error:', err);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([MILKING_CACHE_KEY, MILKING_LAST_SYNC_KEY]);
    } catch (err) {
      console.error('[MilkingCache] Clear error:', err);
    }
  }
}
