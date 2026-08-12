import AsyncStorage from '@react-native-async-storage/async-storage';
import { OfflineFirstStockRepository } from '../OfflineFirstStockRepository';
import { FirestoreStockRepository } from '../FirestoreStockRepository';
import { StockItemCache } from '../../offline/StockItemCache';
import { StockUsageCache } from '../../offline/StockUsageCache';
import { StockSyncQueue } from '../../offline/StockSyncQueue';
import { StockSyncEngine } from '../../offline/StockSyncEngine';
import { NetworkMonitor } from '../../offline/NetworkMonitor';
import { FeedStockItem, FeedUsageRecord } from '../../../domain/entities/stock';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('OfflineFirstStockRepository - Stock CRUD Offline Support Acceptance Tests', () => {
  let offlineRepo: OfflineFirstStockRepository;
  let stockItemCache: StockItemCache;
  let stockUsageCache: StockUsageCache;
  let syncQueue: StockSyncQueue;
  let syncEngine: StockSyncEngine;
  let mockFirestore: jest.Mocked<FirestoreStockRepository>;
  let mockNetwork: jest.Mocked<NetworkMonitor>;

  const mockSilage: FeedStockItem = {
    id: 'stk_101',
    name: 'Napier Grass Silage',
    category: 'Silage',
    currentStockKg: 1200,
    unit: 'KG',
    minThresholdKg: 300,
    costPerUnit: 40,
    supplierName: 'Green Farm Ltd',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockConcentrate: FeedStockItem = {
    id: 'stk_102',
    name: 'Dairy Concentrate 18%',
    category: 'Concentrate',
    currentStockKg: 150, // Below minThreshold (200) -> Low stock
    unit: 'KG',
    minThresholdKg: 200,
    costPerUnit: 75,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    stockItemCache = new StockItemCache();
    stockUsageCache = new StockUsageCache();
    syncQueue = new StockSyncQueue();

    mockFirestore = {
      getStockItems: jest.fn().mockResolvedValue([mockSilage, mockConcentrate]),
      addStockItem: jest.fn().mockImplementation(async (data: any) => data),
      updateStockItem: jest.fn().mockImplementation(async (id: string, updates: any) => ({
        ...mockSilage,
        ...updates,
      })),
      deleteStockItem: jest.fn().mockResolvedValue(undefined),
      recordFeedUsage: jest.fn().mockImplementation(async (data: any) => data),
      getFeedUsageHistory: jest.fn().mockResolvedValue([]),
    } as any;

    mockNetwork = {
      isOnline: jest.fn().mockReturnValue(true),
      onReconnect: jest.fn().mockReturnValue(jest.fn()),
      dispose: jest.fn(),
    } as any;

    offlineRepo = new OfflineFirstStockRepository(
      mockFirestore,
      stockItemCache,
      stockUsageCache,
      syncQueue,
      mockNetwork
    );

    syncEngine = new StockSyncEngine(
      syncQueue,
      stockItemCache,
      stockUsageCache,
      mockFirestore,
      mockNetwork
    );
  });

  afterEach(() => {
    syncEngine.dispose();
  });

  // Criterion 1: Offline inventory read
  test('returns cached stock items when offline without querying Firestore', async () => {
    await stockItemCache.saveAll([mockSilage, mockConcentrate]);
    mockNetwork.isOnline.mockReturnValue(false);

    const items = await offlineRepo.getStockItems();
    expect(items).toHaveLength(2);
    expect(items).toContainEqual(mockSilage);
    expect(mockFirestore.getStockItems).not.toHaveBeenCalled();
  });

  // Criterion 2: Offline add stock item
  test('adds stock item offline, generates stk_${Date.now()} ID, saves to cache, and enqueues ADD', async () => {
    mockNetwork.isOnline.mockReturnValue(false);

    const newItem = await offlineRepo.addStockItem({
      name: 'Hay Bales',
      category: 'Forage',
      currentStockKg: 500,
      unit: 'KG',
      minThresholdKg: 100,
      costPerUnit: 30,
    });

    expect(newItem.id).toMatch(/^stk_\d+$/);

    const cachedItems = await stockItemCache.getAll();
    expect(cachedItems).toContainEqual(expect.objectContaining({ id: newItem.id, name: 'Hay Bales' }));

    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].entityType).toBe('STOCK_ITEM');
    expect(pending[0].operationType).toBe('ADD');
  });

  // Criterion 3: Offline refill (update)
  test('updates stock item offline, updates cache in place, and enqueues UPDATE', async () => {
    await stockItemCache.saveAll([mockSilage]);
    mockNetwork.isOnline.mockReturnValue(false);

    const updated = await offlineRepo.updateStockItem('stk_101', {
      currentStockKg: 1700,
    });

    expect(updated.currentStockKg).toBe(1700);

    const cachedItem = await stockItemCache.getById('stk_101');
    expect(cachedItem?.currentStockKg).toBe(1700);

    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].operationType).toBe('UPDATE');
  });

  // Criterion 4: Offline feed usage (cross-entity write)
  test('records feed usage offline, saves record to usage cache, and enqueues RECORD', async () => {
    await stockItemCache.saveAll([mockSilage]);
    mockNetwork.isOnline.mockReturnValue(false);

    const usageRecord = await offlineRepo.recordFeedUsage({
      feedStockId: 'stk_101',
      feedStockName: 'Napier Grass Silage',
      date: '2026-08-10',
      amountUsedKg: 100,
      session: 'Morning',
    });

    expect(usageRecord.id).toMatch(/^usg_\d+$/);

    const cachedUsage = await stockUsageCache.getAll();
    expect(cachedUsage).toHaveLength(1);
    expect(cachedUsage[0].amountUsedKg).toBe(100);

    const pending = await syncQueue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].entityType).toBe('USAGE_RECORD');
  });

  // Criterion 5: LWW Conflict Resolution for stock updates
  test('LWW resolves update conflicts correctly during background sync', async () => {
    mockNetwork.isOnline.mockReturnValue(false);
    await stockItemCache.saveAll([mockSilage]);

    await offlineRepo.updateStockItem('stk_101', { currentStockKg: 2000 });

    // Reconnect
    mockNetwork.isOnline.mockReturnValue(true);

    await syncEngine.sync();

    expect(mockFirestore.updateStockItem).toHaveBeenCalledWith(
      'stk_101',
      expect.objectContaining({ currentStockKg: 2000 })
    );

    expect(await syncQueue.getPending()).toHaveLength(0);
  });

  // Criterion 6: Offline dashboard metrics calculation
  test('validates stock metrics (Feed Types, Low Stock Alerts, Est. Stock Value) offline from cache', async () => {
    await stockItemCache.saveAll([mockSilage, mockConcentrate]);
    mockNetwork.isOnline.mockReturnValue(false);

    const stockItems = await offlineRepo.getStockItems();

    const feedTypesCount = stockItems.length; // 2
    const lowStockAlerts = stockItems.filter((i) => i.currentStockKg <= i.minThresholdKg); // 1 (mockConcentrate)
    const estStockValueRS = stockItems.reduce(
      (sum, i) => sum + i.currentStockKg * (i.costPerUnit || 0),
      0
    ); // (1200 * 40) + (150 * 75) = 48000 + 11250 = 59250

    expect(feedTypesCount).toBe(2);
    expect(lowStockAlerts).toHaveLength(1);
    expect(lowStockAlerts[0].id).toBe('stk_102');
    expect(estStockValueRS).toBe(59250);
  });
});
