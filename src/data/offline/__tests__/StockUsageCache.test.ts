import AsyncStorage from '@react-native-async-storage/async-storage';
import { StockUsageCache } from '../StockUsageCache';
import { FeedUsageRecord } from '../../../domain/entities/stock';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('StockUsageCache', () => {
  let cache: StockUsageCache;

  const mockRecord1: FeedUsageRecord = {
    id: 'usg_1',
    feedStockId: 'stk_1',
    feedStockName: 'Napier Grass Silage',
    date: '2026-08-10',
    amountUsedKg: 120,
    session: 'Morning',
    createdAt: '2026-08-10T07:00:00.000Z',
  };

  const mockRecord2: FeedUsageRecord = {
    id: 'usg_2',
    feedStockId: 'stk_1',
    feedStockName: 'Napier Grass Silage',
    date: '2026-08-10',
    amountUsedKg: 100,
    session: 'Evening',
    createdAt: '2026-08-10T18:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    cache = new StockUsageCache();
  });

  test('getAll returns empty array initially', async () => {
    const records = await cache.getAll();
    expect(records).toEqual([]);
  });

  test('saveAll and getAll persist and retrieve usage records', async () => {
    await cache.saveAll([mockRecord1, mockRecord2]);
    const records = await cache.getAll();
    expect(records).toHaveLength(2);
    expect(records).toContainEqual(mockRecord1);
    expect(records).toContainEqual(mockRecord2);
  });

  test('addOne prepends or updates usage record', async () => {
    await cache.addOne(mockRecord1);
    let records = await cache.getAll();
    expect(records).toHaveLength(1);

    await cache.addOne(mockRecord2);
    records = await cache.getAll();
    expect(records).toHaveLength(2);
  });

  test('removeOne removes record by ID', async () => {
    await cache.saveAll([mockRecord1, mockRecord2]);
    await cache.removeOne('usg_1');
    const records = await cache.getAll();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('usg_2');
  });
});
