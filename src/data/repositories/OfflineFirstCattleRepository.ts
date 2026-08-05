import { CattleRepository } from '../../domain/repositories/CattleRepository';
import { Cattle, DashboardMetrics } from '../../domain/entities/cattle';
import { FirestoreCattleRepository } from './FirestoreCattleRepository';
import { CattleCache } from '../offline/CattleCache';
import { SyncQueue } from '../offline/SyncQueue';
import { NetworkMonitor } from '../offline/NetworkMonitor';

export class OfflineFirstCattleRepository implements CattleRepository {
  constructor(
    private firestoreRepo: FirestoreCattleRepository,
    private cattleCache: CattleCache,
    private syncQueue: SyncQueue,
    private networkMonitor: NetworkMonitor
  ) {}

  async getAllCattle(): Promise<Cattle[]> {
    if (this.networkMonitor.isOnline()) {
      try {
        const remoteCattle = await this.firestoreRepo.getAllCattle();
        await this.cattleCache.saveAll(remoteCattle);
        await this.cattleCache.setLastSyncTimestamp(new Date().toISOString());
        return remoteCattle;
      } catch (err) {
        console.warn('[OfflineFirstCattleRepository] Remote read failed, falling back to cache:', err);
        return await this.cattleCache.getAll();
      }
    }
    return await this.cattleCache.getAll();
  }

  async getCattleById(id: string): Promise<Cattle | null> {
    if (this.networkMonitor.isOnline()) {
      try {
        const remoteCow = await this.firestoreRepo.getCattleById(id);
        if (remoteCow) {
          await this.cattleCache.upsertOne(remoteCow);
          return remoteCow;
        }
      } catch (err) {
        console.warn('[OfflineFirstCattleRepository] Remote getById failed, falling back to cache:', err);
      }
    }
    const cachedList = await this.cattleCache.getAll();
    return cachedList.find((c) => c.id === id) || null;
  }

  async addCattle(cattleData: Omit<Cattle, 'id'> & { id?: string }): Promise<Cattle> {
    const id = cattleData.id || `cow_${Date.now()}`;
    const newCattle: Cattle = {
      ...cattleData,
      id,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic cache update
    await this.cattleCache.upsertOne(newCattle);

    if (this.networkMonitor.isOnline()) {
      try {
        await this.firestoreRepo.addCattle(newCattle);
      } catch (err) {
        console.warn('[OfflineFirstCattleRepository] Remote add failed, enqueueing for sync:', err);
        await this.syncQueue.enqueue({ operationType: 'ADD', payload: newCattle });
      }
    } else {
      await this.syncQueue.enqueue({ operationType: 'ADD', payload: newCattle });
    }

    return newCattle;
  }

  async updateCattle(cattle: Cattle): Promise<Cattle> {
    const stampedCattle: Cattle = {
      ...cattle,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic cache update
    await this.cattleCache.upsertOne(stampedCattle);

    if (this.networkMonitor.isOnline()) {
      try {
        await this.firestoreRepo.updateCattle(stampedCattle);
      } catch (err) {
        console.warn('[OfflineFirstCattleRepository] Remote update failed, enqueueing for sync:', err);
        await this.syncQueue.enqueue({ operationType: 'UPDATE', payload: stampedCattle });
      }
    } else {
      await this.syncQueue.enqueue({ operationType: 'UPDATE', payload: stampedCattle });
    }

    return stampedCattle;
  }

  async deleteCattle(id: string): Promise<void> {
    // Optimistic cache update
    await this.cattleCache.removeOne(id);

    if (this.networkMonitor.isOnline()) {
      try {
        await this.firestoreRepo.deleteCattle(id);
      } catch (err) {
        console.warn('[OfflineFirstCattleRepository] Remote delete failed, enqueueing for sync:', err);
        await this.syncQueue.enqueue({ operationType: 'DELETE', payload: id });
      }
    } else {
      await this.syncQueue.enqueue({ operationType: 'DELETE', payload: id });
    }
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cattleList = await this.getAllCattle();
    const totalCount = cattleList.length;
    const lactating = cattleList.filter((c) => c.status === 'lactating');
    const totalYield = cattleList.reduce((acc, c) => acc + c.dailyMilkYieldLiters, 0);
    const needsAttention = cattleList.filter(
      (c) => c.healthStatus === 'needs_attention' || c.healthStatus === 'under_treatment'
    ).length;

    return {
      totalCattleCount: totalCount,
      lactatingCount: lactating.length,
      todayMilkYieldTotal: Math.round(totalYield * 10) / 10,
      needsAttentionCount: needsAttention,
      avgYieldPerCow: totalCount > 0 ? Math.round((totalYield / totalCount) * 10) / 10 : 0,
    };
  }
}
