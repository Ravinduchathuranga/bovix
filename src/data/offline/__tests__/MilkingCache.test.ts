import AsyncStorage from '@react-native-async-storage/async-storage';
import { MilkingCache } from '../MilkingCache';
import { BulkMilkRecord } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('MilkingCache', () => {
  let cache: MilkingCache;

  const mockRecord1: BulkMilkRecord = {
    id: 'blk_1',
    date: '2026-08-05',
    session: 'Morning',
    amountKg: 150.5,
    notes: 'Tank 1',
    createdAt: '2026-08-05T06:00:00.000Z',
  };

  const mockRecord2: BulkMilkRecord = {
    id: 'blk_2',
    date: '2026-08-05',
    session: 'Evening',
    amountKg: 130.0,
    notes: 'Tank 2',
    createdAt: '2026-08-05T18:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    cache = new MilkingCache();
  });

  test('getAll returns empty array initially', async () => {
    const records = await cache.getAll();
    expect(records).toEqual([]);
  });

  test('saveAll and getAll persist and retrieve records', async () => {
    await cache.saveAll([mockRecord1, mockRecord2]);
    const records = await cache.getAll();
    expect(records).toHaveLength(2);
    expect(records).toContainEqual(mockRecord1);
    expect(records).toContainEqual(mockRecord2);
  });

  test('getByDate filters records by date', async () => {
    const mockRecord3: BulkMilkRecord = {
      id: 'blk_3',
      date: '2026-08-06',
      session: 'Morning',
      amountKg: 140.0,
      createdAt: '2026-08-06T06:00:00.000Z',
    };
    await cache.saveAll([mockRecord1, mockRecord2, mockRecord3]);

    const august5Records = await cache.getByDate('2026-08-05');
    expect(august5Records).toHaveLength(2);

    const august6Records = await cache.getByDate('2026-08-06');
    expect(august6Records).toHaveLength(1);
    expect(august6Records[0].id).toBe('blk_3');
  });

  test('addOne appends new record or updates existing record', async () => {
    await cache.addOne(mockRecord1);
    let records = await cache.getAll();
    expect(records).toHaveLength(1);

    const updatedRecord1 = { ...mockRecord1, amountKg: 160.0 };
    await cache.addOne(updatedRecord1);
    records = await cache.getAll();
    expect(records).toHaveLength(1);
    expect(records[0].amountKg).toBe(160.0);
  });

  test('removeOne deletes record by ID', async () => {
    await cache.saveAll([mockRecord1, mockRecord2]);
    await cache.removeOne('blk_1');
    const records = await cache.getAll();
    expect(records).toHaveLength(1);
    expect(records[0].id).toBe('blk_2');
  });

  test('hasSession checks composite key (date, session) uniqueness', async () => {
    await cache.saveAll([mockRecord1]);
    expect(await cache.hasSession('2026-08-05', 'Morning')).toBe(true);
    expect(await cache.hasSession('2026-08-05', 'Evening')).toBe(false);
    expect(await cache.hasSession('2026-08-06', 'Morning')).toBe(false);
  });
});
