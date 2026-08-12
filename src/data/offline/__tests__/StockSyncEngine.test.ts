import AsyncStorage from '@react-native-async-storage/async-storage';
import { StockSyncEngine } from '../StockSyncEngine';
import { StockSyncQueue } from '../StockSyncQueue';
import { StockItemCache } from '../StockItemCache';
import { StockUsageCache } from '../StockUsageCache';
import { StockRepository } from '../../../domain/repositories/StockRepository';
import { NetworkMonitor } from '../NetworkMonitor';
import { FeedStockItem, FeedUsageRecord } from '../../../domain/entities/stock';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('StockSyncEngine', () => {
  let syncEngine: StockSyncEngine;
  let syncQueue: StockSyncQueue;
  let stockItemCache: StockItemCache;
  let stockUsageCache: StockUsageCache;
  let mockFirestore: jest.Mocked<StockRepository>;
  let mockNetwork: jest.Mocked<NetworkMonitor>;

  const mockItem: FeedStockItem = {
    id: 'stk_1',
    name: 'Silage',
    category: 'Silage',
    currentStockKg: 1000,
    unit: 'KG',
    minThresholdKg: 100,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
  };

  const mockUsage: FeedUsageRecord = {
    id: 'usg_1',
    feedStockId: 'stk_1',
    feedStockName: 'Silage',
    date: '2026-08-10',
    amountUsedKg: 50,
    createdAt: '2026-08-10T12:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    syncQueue = new StockSyncQueue();
    stockItemCache = new StockItemCache();
    stockUsageCache = new StockUsageCache();

    mockFirestore = {
      getStockItems: jest.fn().mockResolvedValue([mockItem]),
      addStockItem: jest.fn().mockImplementation(async (item) => item),
      updateStockItem: jest.fn().mockImplementation(async (id, updates) => ({ ...mockItem, ...updates })),
      deleteStockItem: jest.fn().mockResolvedValue(undefined),
      recordFeedUsage: jest.fn().mockImplementation(async (usage) => usage),
      getFeedUsageHistory: jest.fn().mockResolvedValue([mockUsage]),
    } as any;

    mockNetwork = {
      isOnline: jest.fn().mockReturnValue(true),
      onReconnect: jest.fn().mockReturnValue(jest.fn()),
      dispose: jest.fn(),
    } as any;

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

  test('does nothing when offline', async () => {
    mockNetwork.isOnline.mockReturnValue(false);
    await syncQueue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'ADD',
      payload: mockItem,
      entityId: mockItem.id,
    });

    await syncEngine.sync();

    expect(mockFirestore.addStockItem).not.toHaveBeenCalled();
  });

  test('syncs STOCK_ITEM ADD operation when online', async () => {
    await syncQueue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'ADD',
      payload: mockItem,
      entityId: mockItem.id,
    });

    await syncEngine.sync();

    expect(mockFirestore.addStockItem).toHaveBeenCalledWith(mockItem);
    expect(await syncQueue.getPending()).toHaveLength(0);
  });

  test('syncs USAGE_RECORD RECORD operation when online', async () => {
    await syncQueue.enqueue({
      entityType: 'USAGE_RECORD',
      operationType: 'RECORD',
      payload: mockUsage,
      entityId: mockUsage.id,
    });

    await syncEngine.sync();

    expect(mockFirestore.recordFeedUsage).toHaveBeenCalledWith(mockUsage);
    expect(await syncQueue.getPending()).toHaveLength(0);
  });

  test('LWW check skips local update if remote is newer', async () => {
    const remoteNewerItem: FeedStockItem = {
      ...mockItem,
      currentStockKg: 1500,
      updatedAt: '2099-01-01T15:00:00.000Z', // always in the future relative to test run
    };

    mockFirestore.getStockItems.mockResolvedValue([remoteNewerItem]);

    await syncQueue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'UPDATE',
      payload: { currentStockKg: 800 },
      entityId: mockItem.id,
    });

    await syncEngine.sync();

    // Should skip update because remote timestamp is newer
    expect(mockFirestore.updateStockItem).not.toHaveBeenCalled();
    expect(await syncQueue.getPending()).toHaveLength(0);
  });
});
