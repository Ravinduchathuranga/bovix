import AsyncStorage from '@react-native-async-storage/async-storage';
import { Cattle } from '../../domain/entities/cattle';

const CATTLE_CACHE_KEY = '@bovix_cattle_cache';
const CATTLE_LAST_SYNC_KEY = '@bovix_cattle_last_sync';

export class CattleCache {
  async getAll(): Promise<Cattle[]> {
    try {
      const data = await AsyncStorage.getItem(CATTLE_CACHE_KEY);
      if (!data) return [];
      return JSON.parse(data) as Cattle[];
    } catch (err) {
      console.warn('[CattleCache] Read error:', err);
      return [];
    }
  }

  async saveAll(cattle: Cattle[]): Promise<void> {
    try {
      await AsyncStorage.setItem(CATTLE_CACHE_KEY, JSON.stringify(cattle));
    } catch (err) {
      console.error('[CattleCache] Write error:', err);
    }
  }

  async upsertOne(cattle: Cattle): Promise<Cattle[]> {
    const list = await this.getAll();
    const index = list.findIndex((c) => c.id === cattle.id);
    let updatedList: Cattle[];
    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = cattle;
    } else {
      updatedList = [cattle, ...list];
    }
    await this.saveAll(updatedList);
    return updatedList;
  }

  async removeOne(id: string): Promise<Cattle[]> {
    const list = await this.getAll();
    const updatedList = list.filter((c) => c.id !== id);
    await this.saveAll(updatedList);
    return updatedList;
  }

  async getLastSyncTimestamp(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(CATTLE_LAST_SYNC_KEY);
    } catch (err) {
      console.warn('[CattleCache] Get last sync error:', err);
      return null;
    }
  }

  async setLastSyncTimestamp(ts: string): Promise<void> {
    try {
      await AsyncStorage.setItem(CATTLE_LAST_SYNC_KEY, ts);
    } catch (err) {
      console.error('[CattleCache] Set last sync error:', err);
    }
  }

  async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CATTLE_CACHE_KEY, CATTLE_LAST_SYNC_KEY]);
    } catch (err) {
      console.error('[CattleCache] Clear error:', err);
    }
  }
}
