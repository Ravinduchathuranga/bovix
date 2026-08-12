/**
 * Acceptance Tests for OfflineFirstCattleRepository
 *
 * These tests map 1:1 to the proposed failing test cases, adapted to the
 * existing architecture (4-arg constructor, CattleCache, SyncQueue, SyncEngine).
 *
 * Acceptance criteria verified:
 *  1. addCattle uses deterministic cow_${Date.now()} ID and queues via SyncQueue when offline
 *  2. getDashboardMetrics derives totalCattleCount, lactatingCount, needsAttentionCount from cache
 *  3. SyncEngine resolves LWW conflicts using updatedAt ISO timestamps
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineFirstCattleRepository } from '../OfflineFirstCattleRepository';
import { FirestoreCattleRepository } from '../FirestoreCattleRepository';
import { CattleCache } from '../../offline/CattleCache';
import { SyncQueue } from '../../offline/SyncQueue';
import { SyncEngine } from '../../offline/SyncEngine';
import { NetworkMonitor } from '../../offline/NetworkMonitor';
import { Cattle } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('OfflineFirstCattleRepository - Cattle CRUD Offline Support (Acceptance)', () => {
  let offlineRepo: OfflineFirstCattleRepository;
  let cattleCache: CattleCache;
  let syncQueue: SyncQueue;
  let syncEngine: SyncEngine;
  let mockFirestore: jest.Mocked<FirestoreCattleRepository>;
  let mockNetwork: jest.Mocked<NetworkMonitor>;

  // Complete Cattle fixtures satisfying the domain interface
  const lactatingCow: Cattle = {
    id: 'cow_1',
    tagNumber: 'COW-001',
    name: 'Daisy',
    breed: 'Holstein',
    ageYears: 4,
    ageMonths: 0,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 22,
    healthStatus: 'healthy',
    medicalHistory: '',
    calvesDelivered: 2,
  };

  const dryCow: Cattle = {
    id: 'cow_2',
    tagNumber: 'COW-002',
    name: 'Rosie',
    breed: 'Jersey',
    ageYears: 3,
    ageMonths: 6,
    gender: 'female',
    status: 'dry',
    dailyMilkYieldLiters: 0,
    healthStatus: 'healthy',
    medicalHistory: '',
    calvesDelivered: 1,
  };

  const sickCow: Cattle = {
    id: 'cow_3',
    tagNumber: 'COW-003',
    name: 'Bella',
    breed: 'Ayrshire',
    ageYears: 5,
    ageMonths: 2,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 8,
    healthStatus: 'needs_attention',
    medicalHistory: 'Mastitis treatment Aug 2026',
    calvesDelivered: 3,
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    cattleCache = new CattleCache();
    syncQueue = new SyncQueue();

    mockFirestore = {
      getAllCattle: jest.fn().mockResolvedValue([]),
      getCattleById: jest.fn().mockResolvedValue(null),
      addCattle: jest.fn().mockImplementation(async (data: any) => data),
      updateCattle: jest.fn().mockImplementation(async (data: any) => data),
      deleteCattle: jest.fn().mockResolvedValue(undefined),
      getDashboardMetrics: jest.fn(),
    } as any;

    mockNetwork = {
      isOnline: jest.fn().mockReturnValue(true),
      onReconnect: jest.fn().mockReturnValue(jest.fn()),
      dispose: jest.fn(),
    } as any;

    offlineRepo = new OfflineFirstCattleRepository(
      mockFirestore,
      cattleCache,
      syncQueue,
      mockNetwork
    );

    syncEngine = new SyncEngine(
      syncQueue,
      cattleCache,
      mockFirestore,
      mockNetwork
    );
  });

  afterEach(() => {
    syncEngine.dispose();
  });

  // ─── Test 1: Deterministic ID + offline queue ─────────────────────────────

  test('addCattle uses deterministic ID and queues write via SyncQueue when offline', async () => {
    // Arrange: Simulate offline state
    mockNetwork.isOnline.mockReturnValue(false);

    const newCow: Omit<Cattle, 'id'> = {
      tagNumber: 'COW-001',
      name: 'Daisy',
      breed: 'Holstein',
      ageYears: 4,
      ageMonths: 0,
      gender: 'female',
      status: 'lactating',
      dailyMilkYieldLiters: 22,
      healthStatus: 'healthy',
      medicalHistory: '',
      calvesDelivered: 2,
    };

    // Act
    const result = await offlineRepo.addCattle(newCow);

    // Assert: ID must be deterministically generated on the client
    expect(result.id).toMatch(/^cow_\d+$/);

    // Assert: Firestore must NOT be called while offline
    expect(mockFirestore.addCattle).not.toHaveBeenCalled();

    // Assert: The operation must be queued in SyncQueue for deduplication
    const pendingOps = await syncQueue.getPending();
    expect(pendingOps.length).toBe(1);
    expect(pendingOps[0]).toEqual(
      expect.objectContaining({
        operationType: 'ADD',
        status: 'pending',
        payload: expect.objectContaining({ id: result.id }),
      })
    );

    // Assert: The cattle must also be in the local cache (optimistic update)
    const cached = await cattleCache.getAll();
    expect(cached).toContainEqual(expect.objectContaining({ id: result.id }));
  });

  // ─── Test 2: Offline dashboard metrics from cache ─────────────────────────

  test('offline dashboard metrics are correctly derived from local cache', async () => {
    // Arrange: Pre-populate local cache with complete Cattle records
    await cattleCache.saveAll([lactatingCow, dryCow, sickCow]);

    // Simulate offline state
    mockNetwork.isOnline.mockReturnValue(false);

    // Act
    const metrics = await offlineRepo.getDashboardMetrics();

    // Assert: Metrics must be successfully derived without network access
    expect(metrics.totalCattleCount).toBe(3);
    expect(metrics.lactatingCount).toBe(2); // lactatingCow + sickCow (status: 'lactating')
    expect(metrics.needsAttentionCount).toBe(1); // sickCow has healthStatus: 'needs_attention'
    expect(mockFirestore.getAllCattle).not.toHaveBeenCalled();
  });

  // ─── Test 3: LWW conflict resolution via SyncEngine ──────────────────────

  test('sync resolves Last-Write-Wins (LWW) data conflicts using updatedAt', async () => {
    // Arrange: The remote server has a stale record
    const staleServerCow: Cattle = {
      ...lactatingCow,
      status: 'dry',
      updatedAt: '2020-09-13T12:26:40.000Z', // older timestamp
    };

    // The local offline edit is newer
    const localUpdatedCow: Cattle = {
      ...lactatingCow,
      status: 'lactating',
      updatedAt: '2023-11-14T22:13:20.000Z', // newer timestamp
    };

    // Server returns the stale record when fetched
    mockFirestore.getCattleById.mockResolvedValue(staleServerCow);

    // Queue the local update as if it happened offline
    await syncQueue.enqueue({
      operationType: 'UPDATE',
      payload: localUpdatedCow,
    });

    // Simulate reconnection (online)
    mockNetwork.isOnline.mockReturnValue(true);

    // Act: Trigger sync process
    await syncEngine.sync();

    // Assert: The local update should proceed because its updatedAt is newer
    expect(mockFirestore.updateCattle).toHaveBeenCalledWith(localUpdatedCow);
  });

  test('sync skips local update when remote updatedAt is newer (LWW server wins)', async () => {
    // Arrange: The remote server has a NEWER record
    const freshServerCow: Cattle = {
      ...lactatingCow,
      status: 'pregnant',
      updatedAt: '2026-08-05T10:00:00.000Z', // newer
    };

    // The local offline edit is older
    const staleLocalCow: Cattle = {
      ...lactatingCow,
      status: 'lactating',
      updatedAt: '2026-08-05T07:00:00.000Z', // older
    };

    mockFirestore.getCattleById.mockResolvedValue(freshServerCow);

    await syncQueue.enqueue({
      operationType: 'UPDATE',
      payload: staleLocalCow,
    });

    mockNetwork.isOnline.mockReturnValue(true);

    // Act
    await syncEngine.sync();

    // Assert: The local update should be SKIPPED because server is newer
    expect(mockFirestore.updateCattle).not.toHaveBeenCalled();

    // Assert: The queue should be drained (operation removed, not retried)
    expect((await syncQueue.getPending()).length).toBe(0);
  });
});
