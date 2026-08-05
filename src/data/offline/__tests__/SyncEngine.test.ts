import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncEngine } from '../SyncEngine';
import { SyncQueue } from '../SyncQueue';
import { CattleCache } from '../CattleCache';
import { FirestoreCattleRepository } from '../../repositories/FirestoreCattleRepository';
import { NetworkMonitor } from '../NetworkMonitor';
import { Cattle } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('SyncEngine', () => {
  let syncEngine: SyncEngine;
  let syncQueue: SyncQueue;
  let cattleCache: CattleCache;
  let mockFirestoreRepo: jest.Mocked<FirestoreCattleRepository>;
  let mockNetworkMonitor: jest.Mocked<NetworkMonitor>;

  const mockCattle: Cattle = {
    id: 'cow_1',
    tagNumber: 'TAG-1',
    name: 'Bella',
    breed: 'Holstein',
    ageYears: 4,
    ageMonths: 0,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 22,
    healthStatus: 'healthy',
    medicalHistory: '',
    calvesDelivered: 2,
    updatedAt: '2026-08-05T08:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    syncQueue = new SyncQueue();
    cattleCache = new CattleCache();

    mockFirestoreRepo = {
      getAllCattle: jest.fn().mockResolvedValue([mockCattle]),
      getCattleById: jest.fn(),
      addCattle: jest.fn().mockResolvedValue(mockCattle),
      updateCattle: jest.fn().mockResolvedValue(mockCattle),
      deleteCattle: jest.fn().mockResolvedValue(undefined),
      getDashboardMetrics: jest.fn(),
    } as any;

    mockNetworkMonitor = {
      isOnline: jest.fn().mockReturnValue(true),
      onReconnect: jest.fn().mockReturnValue(jest.fn()),
      dispose: jest.fn(),
    } as any;

    syncEngine = new SyncEngine(syncQueue, cattleCache, mockFirestoreRepo, mockNetworkMonitor);
  });

  afterEach(() => {
    syncEngine.dispose();
  });

  it('should process pending ADD operations when online', async () => {
    await syncQueue.enqueue({ operationType: 'ADD', payload: mockCattle });

    await syncEngine.sync();

    expect(mockFirestoreRepo.addCattle).toHaveBeenCalledWith(mockCattle);
    expect((await syncQueue.getPending()).length).toBe(0);
  });

  it('should apply LWW and skip local UPDATE if remote record is newer', async () => {
    const localCattle = { ...mockCattle, updatedAt: '2026-08-05T07:00:00.000Z' };
    const remoteCattle = { ...mockCattle, updatedAt: '2026-08-05T09:00:00.000Z' };

    mockFirestoreRepo.getCattleById.mockResolvedValue(remoteCattle);
    await syncQueue.enqueue({ operationType: 'UPDATE', payload: localCattle });

    await syncEngine.sync();

    expect(mockFirestoreRepo.updateCattle).not.toHaveBeenCalled();
    expect((await syncQueue.getPending()).length).toBe(0);
  });

  it('should apply local UPDATE if local record is newer than remote', async () => {
    const localCattle = { ...mockCattle, updatedAt: '2026-08-05T10:00:00.000Z' };
    const remoteCattle = { ...mockCattle, updatedAt: '2026-08-05T09:00:00.000Z' };

    mockFirestoreRepo.getCattleById.mockResolvedValue(remoteCattle);
    await syncQueue.enqueue({ operationType: 'UPDATE', payload: localCattle });

    await syncEngine.sync();

    expect(mockFirestoreRepo.updateCattle).toHaveBeenCalledWith(localCattle);
    expect((await syncQueue.getPending()).length).toBe(0);
  });

  it('should process operations in priority order: DELETE -> UPDATE -> ADD', async () => {
    const callOrder: string[] = [];

    mockFirestoreRepo.deleteCattle.mockImplementation(async () => {
      callOrder.push('DELETE');
    });
    mockFirestoreRepo.updateCattle.mockImplementation(async () => {
      callOrder.push('UPDATE');
      return mockCattle;
    });
    mockFirestoreRepo.addCattle.mockImplementation(async () => {
      callOrder.push('ADD');
      return mockCattle;
    });

    await syncQueue.enqueue({ operationType: 'ADD', payload: { ...mockCattle, id: 'cow_add' } });
    await syncQueue.enqueue({ operationType: 'UPDATE', payload: { ...mockCattle, id: 'cow_update' } });
    await syncQueue.enqueue({ operationType: 'DELETE', payload: 'cow_delete' });

    await syncEngine.sync();

    expect(callOrder).toEqual(['DELETE', 'UPDATE', 'ADD']);
  });
});
