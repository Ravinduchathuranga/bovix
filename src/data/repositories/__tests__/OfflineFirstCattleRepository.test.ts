import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineFirstCattleRepository } from '../OfflineFirstCattleRepository';
import { FirestoreCattleRepository } from '../FirestoreCattleRepository';
import { CattleCache } from '../../offline/CattleCache';
import { SyncQueue } from '../../offline/SyncQueue';
import { NetworkMonitor } from '../../offline/NetworkMonitor';
import { Cattle } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('OfflineFirstCattleRepository', () => {
  let repository: OfflineFirstCattleRepository;
  let cattleCache: CattleCache;
  let syncQueue: SyncQueue;
  let mockFirestoreRepo: jest.Mocked<FirestoreCattleRepository>;
  let mockNetworkMonitor: jest.Mocked<NetworkMonitor>;

  const mockCattle: Cattle = {
    id: 'cow_1',
    tagNumber: 'TAG-100',
    name: 'Molly',
    breed: 'Jersey',
    ageYears: 3,
    ageMonths: 2,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 18,
    healthStatus: 'healthy',
    medicalHistory: '',
    calvesDelivered: 1,
  };

  const sickCattle: Cattle = {
    id: 'cow_2',
    tagNumber: 'TAG-101',
    name: 'Buttercup',
    breed: 'Holstein',
    ageYears: 5,
    ageMonths: 0,
    gender: 'female',
    status: 'sick',
    dailyMilkYieldLiters: 5,
    healthStatus: 'needs_attention',
    medicalHistory: 'Mastitis treatment',
    calvesDelivered: 3,
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    cattleCache = new CattleCache();
    syncQueue = new SyncQueue();

    mockFirestoreRepo = {
      getAllCattle: jest.fn().mockResolvedValue([mockCattle, sickCattle]),
      getCattleById: jest.fn().mockResolvedValue(mockCattle),
      addCattle: jest.fn().mockResolvedValue(mockCattle),
      updateCattle: jest.fn().mockResolvedValue(mockCattle),
      deleteCattle: jest.fn().mockResolvedValue(undefined),
      getDashboardMetrics: jest.fn(),
    } as any;

    mockNetworkMonitor = {
      isOnline: jest.fn().mockReturnValue(true),
      onReconnect: jest.fn(),
      dispose: jest.fn(),
    } as any;

    repository = new OfflineFirstCattleRepository(
      mockFirestoreRepo,
      cattleCache,
      syncQueue,
      mockNetworkMonitor
    );
  });

  describe('getAllCattle', () => {
    it('should fetch from Firestore when online and update cache', async () => {
      const result = await repository.getAllCattle();
      expect(result).toEqual([mockCattle, sickCattle]);
      expect(mockFirestoreRepo.getAllCattle).toHaveBeenCalled();
      expect(await cattleCache.getAll()).toEqual([mockCattle, sickCattle]);
    });

    it('should read from cache when offline', async () => {
      mockNetworkMonitor.isOnline.mockReturnValue(false);
      await cattleCache.saveAll([mockCattle]);

      const result = await repository.getAllCattle();
      expect(result).toEqual([mockCattle]);
      expect(mockFirestoreRepo.getAllCattle).not.toHaveBeenCalled();
    });
  });

  describe('addCattle', () => {
    it('should add to Firestore and cache when online', async () => {
      const newCowData: Omit<Cattle, 'id'> = {
        tagNumber: 'TAG-102',
        name: 'Penny',
        breed: 'Guernsey',
        ageYears: 2,
        ageMonths: 0,
        gender: 'female',
        status: 'dry',
        dailyMilkYieldLiters: 0,
        healthStatus: 'healthy',
        medicalHistory: '',
        calvesDelivered: 0,
      };

      const result = await repository.addCattle(newCowData);
      expect(result.id).toMatch(/^cow_/);
      expect(mockFirestoreRepo.addCattle).toHaveBeenCalledWith(expect.objectContaining({ name: 'Penny' }));
      expect((await cattleCache.getAll()).length).toBe(1);
      expect((await syncQueue.getPending()).length).toBe(0);
    });

    it('should update cache and enqueue to SyncQueue when offline', async () => {
      mockNetworkMonitor.isOnline.mockReturnValue(false);
      const newCowData: Omit<Cattle, 'id'> = {
        tagNumber: 'TAG-103',
        name: 'Luna',
        breed: 'Jersey',
        ageYears: 1,
        ageMonths: 6,
        gender: 'female',
        status: 'calf',
        dailyMilkYieldLiters: 0,
        healthStatus: 'healthy',
        medicalHistory: '',
        calvesDelivered: 0,
      };

      const result = await repository.addCattle(newCowData);
      expect(mockFirestoreRepo.addCattle).not.toHaveBeenCalled();
      expect((await cattleCache.getAll()).length).toBe(1);
      const pending = await syncQueue.getPending();
      expect(pending.length).toBe(1);
      expect(pending[0].operationType).toBe('ADD');
      expect((pending[0].payload as Cattle).name).toBe('Luna');
    });
  });

  describe('getDashboardMetrics offline validation', () => {
    it('should correctly derive metrics from offline cache', async () => {
      mockNetworkMonitor.isOnline.mockReturnValue(false);
      await cattleCache.saveAll([mockCattle, sickCattle]);

      const metrics = await repository.getDashboardMetrics();

      expect(metrics.totalCattleCount).toBe(2);
      expect(metrics.lactatingCount).toBe(1); // mockCattle is lactating
      expect(metrics.needsAttentionCount).toBe(1); // sickCattle has healthStatus 'needs_attention'
      expect(metrics.todayMilkYieldTotal).toBe(23); // 18 + 5
      expect(metrics.avgYieldPerCow).toBe(11.5);
    });
  });
});
