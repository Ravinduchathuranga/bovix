import AsyncStorage from '@react-native-async-storage/async-storage';
import { StockSyncQueue } from '../StockSyncQueue';
import { FeedStockItem, FeedUsageRecord } from '../../../domain/entities/stock';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('StockSyncQueue', () => {
  let queue: StockSyncQueue;

  const mockItem: FeedStockItem = {
    id: 'stk_10',
    name: 'Mineral Block',
    category: 'Supplement',
    currentStockKg: 50,
    unit: 'KG',
    minThresholdKg: 10,
    createdAt: '2026-08-10T10:00:00.000Z',
    updatedAt: '2026-08-10T10:00:00.000Z',
  };

  const mockUsage: FeedUsageRecord = {
    id: 'usg_10',
    feedStockId: 'stk_10',
    feedStockName: 'Mineral Block',
    date: '2026-08-10',
    amountUsedKg: 5,
    createdAt: '2026-08-10T12:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    queue = new StockSyncQueue();
  });

  test('enqueue STOCK_ITEM ADD', async () => {
    await queue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'ADD',
      payload: mockItem,
      entityId: mockItem.id,
    });
    const pending = await queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].entityType).toBe('STOCK_ITEM');
    expect(pending[0].operationType).toBe('ADD');
  });

  test('enqueue STOCK_ITEM UPDATE replaces existing pending UPDATE for same entityId', async () => {
    await queue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'UPDATE',
      payload: { currentStockKg: 40 },
      entityId: mockItem.id,
    });

    await queue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'UPDATE',
      payload: { currentStockKg: 30, notes: 'Deducted twice' },
      entityId: mockItem.id,
    });

    const pending = await queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].payload).toEqual({ currentStockKg: 30, notes: 'Deducted twice' });
  });

  test('enqueue STOCK_ITEM DELETE cancels out pending ADD for same entityId', async () => {
    await queue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'ADD',
      payload: mockItem,
      entityId: mockItem.id,
    });
    expect(await queue.getPending()).toHaveLength(1);

    await queue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'DELETE',
      payload: mockItem.id,
      entityId: mockItem.id,
    });

    expect(await queue.getAll()).toHaveLength(0);
  });

  test('enqueue USAGE_RECORD RECORD creates independent operations', async () => {
    await queue.enqueue({
      entityType: 'USAGE_RECORD',
      operationType: 'RECORD',
      payload: mockUsage,
      entityId: mockUsage.id,
      correlationId: 'corr_1',
    });

    const pending = await queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].correlationId).toBe('corr_1');
  });

  test('status transitions (markSyncing, markFailed, dequeue)', async () => {
    await queue.enqueue({
      entityType: 'STOCK_ITEM',
      operationType: 'ADD',
      payload: mockItem,
      entityId: mockItem.id,
    });

    const pending = await queue.getPending();
    const opId = pending[0].id;

    await queue.markSyncing(opId);
    let all = await queue.getAll();
    expect(all[0].status).toBe('syncing');

    await queue.markFailed(opId);
    all = await queue.getAll();
    expect(all[0].status).toBe('pending');
    expect(all[0].retryCount).toBe(1);

    await queue.dequeue(opId);
    all = await queue.getAll();
    expect(all).toHaveLength(0);
  });
});
