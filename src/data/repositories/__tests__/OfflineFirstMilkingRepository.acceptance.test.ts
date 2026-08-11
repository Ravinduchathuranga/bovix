import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineFirstMilkingRepository } from '../OfflineFirstMilkingRepository';
import { FirestoreMilkingRepository } from '../FirestoreMilkingRepository';
import { MilkingCache } from '../../offline/MilkingCache';
import { MilkingSyncQueue } from '../../offline/MilkingSyncQueue';
import { MilkingSyncEngine } from '../../offline/MilkingSyncEngine';
import { NetworkMonitor } from '../../offline/NetworkMonitor';
import { BulkMilkRecord } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('OfflineFirstMilkingRepository - Milking CRUD Offline Support Acceptance Tests', () => {
  let offlineRepo: OfflineFirstMilkingRepository;
  let milkingCache: MilkingCache;
  let syncQueue: MilkingSyncQueue;
  let syncEngine: MilkingSyncEngine;
  let mockFirestore: jest.Mocked<FirestoreMilkingRepository>;
  let mockNetwork: jest.Mocked<NetworkMonitor>;

  const morningRecord: BulkMilkRecord = {
    id: 'blk_101',
    date: '2026-08-05',
    session: 'Morning',
    amountKg: 145.5,
    fatPercentage: 3.8,
    notes: 'Morning Tank A',
    createdAt: '2026-08-05T06:30:00.000Z',
  };

  const eveningRecord: BulkMilkRecord = {
    id: 'blk_102',
    date: '2026-08-05',
    session: 'Evening',
    amountKg: 132.0,
    fatPercentage: 4.1,
    notes: 'Evening Tank B',
    createdAt: '2026-08-05T18:30:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    milkingCache = new MilkingCache();
    syncQueue = new MilkingSyncQueue();

    mockFirestore = {
      getMilkRecords: jest.fn().mockResolvedValue([]),
      getMilkRecordsByDate: jest.fn().mockResolvedValue([]),
      recordBulkMilk: jest.fn().mockImplementation(async (data: any) => data),
      deleteMilkRecord: jest.fn().mockResolvedValue(undefined),
    } as any;

    mockNetwork = {
      isOnline: jest.fn().mockReturnValue(true),
      onReconnect: jest.fn().mockReturnValue(jest.fn()),
      dispose: jest.fn(),
    } as any;

    offlineRepo = new OfflineFirstMilkingRepository(
      mockFirestore,
      milkingCache,
      syncQueue,
      mockNetwork
    );

    syncEngine = new MilkingSyncEngine(
      syncQueue,
      milkingCache,
      mockFirestore,
      mockNetwork
    );
  });

  afterEach(() => {
    syncEngine.dispose();
  });

  // Criteria 1: Conflict Resolution - Append-Only (date, session) composite key enforcement
  test('rejects duplicate record for identical (date, session) composite key', async () => {
    mockNetwork.isOnline.mockReturnValue(false);

    // Record morning session
    await offlineRepo.recordBulkMilk({
      date: '2026-08-05',
      session: 'Morning',
      amountKg: 145.5,
    });

    // Attempt duplicate morning session record for same date
    await expect(
      offlineRepo.recordBulkMilk({
        date: '2026-08-05',
        session: 'Morning',
        amountKg: 150.0,
      })
    ).rejects.toThrow('A Morning milking record for 2026-08-05 is already recorded.');
  });

  // Criteria 2: Pre-write Deduplication in Sync Queue
  test('pre-write deduplication prevents duplicate (date, session) entries in sync queue when offline', async () => {
    mockNetwork.isOnline.mockReturnValue(false);

    const rec = await offlineRepo.recordBulkMilk({
      date: '2026-08-05',
      session: 'Morning',
      amountKg: 145.5,
    });

    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
    expect((pending[0].payload as BulkMilkRecord).id).toBe(rec.id);

    // Attempting to directly enqueue duplicate session also throws
    await expect(
      syncQueue.enqueue({
        operationType: 'RECORD',
        payload: {
          id: 'blk_999',
          date: '2026-08-05',
          session: 'Morning',
          amountKg: 160.0,
          createdAt: new Date().toISOString(),
        },
      })
    ).rejects.toThrow('A Morning milking record for 2026-08-05 is already queued for sync.');
  });

  // Criteria 3: Idempotent Writes with Deterministic ID
  test('recordBulkMilk generates deterministic blk_${Date.now()} ID and performs idempotent write', async () => {
    mockNetwork.isOnline.mockReturnValue(false);

    const result = await offlineRepo.recordBulkMilk({
      date: '2026-08-05',
      session: 'Evening',
      amountKg: 130.0,
    });

    // ID must match blk_${Date.now()} pattern
    expect(result.id).toMatch(/^blk_\d+$/);

    // Ensure it was saved to local cache with this ID
    const cached = await milkingCache.getByDate('2026-08-05');
    expect(cached).toContainEqual(expect.objectContaining({ id: result.id, session: 'Evening' }));
  });

  // Criteria 4: Offline Metric Validation (Total Milk KG)
  test('accurately calculates and returns Today Total Milk (KG) metrics from cache when offline', async () => {
    // Populate cache with Morning and Evening records
    await milkingCache.saveAll([morningRecord, eveningRecord]);
    mockNetwork.isOnline.mockReturnValue(false);

    const offlineRecords = await offlineRepo.getMilkRecordsByDate('2026-08-05');
    expect(offlineRecords).toHaveLength(2);

    const totalTodayKg = offlineRecords.reduce((sum, r) => sum + r.amountKg, 0);
    expect(totalTodayKg).toBe(277.5);
    expect(mockFirestore.getMilkRecordsByDate).not.toHaveBeenCalled();
  });

  // Criteria 5: Offline Metric Validation (Sessions AM/PM)
  test('validates AM and PM session availability offline', async () => {
    await milkingCache.saveAll([morningRecord]);
    mockNetwork.isOnline.mockReturnValue(false);

    expect(await milkingCache.hasSession('2026-08-05', 'Morning')).toBe(true);
    expect(await milkingCache.hasSession('2026-08-05', 'Evening')).toBe(false);

    // Record evening session offline
    await offlineRepo.recordBulkMilk({
      date: '2026-08-05',
      session: 'Evening',
      amountKg: 132.0,
    });

    expect(await milkingCache.hasSession('2026-08-05', 'Evening')).toBe(true);

    const allRecords = await offlineRepo.getMilkRecordsByDate('2026-08-05');
    const sessions = allRecords.map((r) => r.session);
    expect(sessions).toContain('Morning');
    expect(sessions).toContain('Evening');
  });

  // Background Sync Test
  test('syncs offline recorded milk records upon network reconnection', async () => {
    mockNetwork.isOnline.mockReturnValue(false);

    const record = await offlineRepo.recordBulkMilk({
      date: '2026-08-05',
      session: 'Morning',
      amountKg: 145.5,
    });

    // Reconnect
    mockNetwork.isOnline.mockReturnValue(true);

    await syncEngine.sync();

    expect(mockFirestore.recordBulkMilk).toHaveBeenCalledWith(
      expect.objectContaining({ id: record.id, amountKg: 145.5 })
    );

    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(0);
  });
});
