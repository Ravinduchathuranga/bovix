import AsyncStorage from '@react-native-async-storage/async-storage';
import { StockItemCache } from '../StockItemCache';
import { FeedStockItem } from '../../../domain/entities/stock';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('StockItemCache', () => {
  let cache: StockItemCache;

  const mockItem1: FeedStockItem = {
    id: 'stk_1',
    name: 'Napier Grass Silage',
    category: 'Silage',
    currentStockKg: 1500,
    unit: 'KG',
    minThresholdKg: 200,
    costPerUnit: 45,
    supplierName: 'Agro Feeds',
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  const mockItem2: FeedStockItem = {
    id: 'stk_2',
    name: 'Dairy Concentrate 18%',
    category: 'Concentrate',
    currentStockKg: 500,
    unit: 'KG',
    minThresholdKg: 100,
    costPerUnit: 80,
    createdAt: '2026-08-01T10:00:00.000Z',
    updatedAt: '2026-08-01T10:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    cache = new StockItemCache();
  });

  test('getAll returns empty array initially', async () => {
    const items = await cache.getAll();
    expect(items).toEqual([]);
  });

  test('saveAll and getAll persist and retrieve stock items', async () => {
    await cache.saveAll([mockItem1, mockItem2]);
    const items = await cache.getAll();
    expect(items).toHaveLength(2);
    expect(items).toContainEqual(mockItem1);
    expect(items).toContainEqual(mockItem2);
  });

  test('getById finds item by ID', async () => {
    await cache.saveAll([mockItem1, mockItem2]);
    const item = await cache.getById('stk_2');
    expect(item).toEqual(mockItem2);

    const missing = await cache.getById('stk_999');
    expect(missing).toBeNull();
  });

  test('addOne inserts new item or updates existing', async () => {
    await cache.addOne(mockItem1);
    let items = await cache.getAll();
    expect(items).toHaveLength(1);

    const updatedItem1 = { ...mockItem1, currentStockKg: 2000 };
    await cache.addOne(updatedItem1);
    items = await cache.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].currentStockKg).toBe(2000);
  });

  test('updateOne modifies partial item fields in place', async () => {
    await cache.saveAll([mockItem1, mockItem2]);
    const updated = await cache.updateOne('stk_1', { currentStockKg: 1200 });

    expect(updated).not.toBeNull();
    expect(updated?.currentStockKg).toBe(1200);
    expect(updated?.name).toBe('Napier Grass Silage');

    const itemFromCache = await cache.getById('stk_1');
    expect(itemFromCache?.currentStockKg).toBe(1200);
  });

  test('removeOne deletes stock item by ID', async () => {
    await cache.saveAll([mockItem1, mockItem2]);
    await cache.removeOne('stk_1');
    const items = await cache.getAll();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('stk_2');
  });
});
