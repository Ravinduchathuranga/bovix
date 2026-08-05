import AsyncStorage from '@react-native-async-storage/async-storage';
import { CattleCache } from '../CattleCache';
import { Cattle } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('CattleCache', () => {
  let cache: CattleCache;

  const mockCattle: Cattle = {
    id: 'cow_1',
    tagNumber: 'TAG-1',
    name: 'Bessie',
    breed: 'Holstein',
    ageYears: 3,
    ageMonths: 0,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 20,
    healthStatus: 'healthy',
    medicalHistory: '',
    calvesDelivered: 1,
  };

  beforeEach(async () => {
    cache = new CattleCache();
    await AsyncStorage.clear();
  });

  it('should return empty list when cache is empty', async () => {
    const list = await cache.getAll();
    expect(list).toEqual([]);
  });

  it('should save and retrieve all cattle', async () => {
    await cache.saveAll([mockCattle]);
    const list = await cache.getAll();
    expect(list).toEqual([mockCattle]);
  });

  it('should upsert cattle correctly', async () => {
    await cache.upsertOne(mockCattle);
    let list = await cache.getAll();
    expect(list.length).toBe(1);

    const updatedCow = { ...mockCattle, name: 'Bessie 2' };
    await cache.upsertOne(updatedCow);
    list = await cache.getAll();
    expect(list.length).toBe(1);
    expect(list[0].name).toBe('Bessie 2');
  });

  it('should remove cattle by id', async () => {
    await cache.saveAll([mockCattle]);
    await cache.removeOne('cow_1');
    const list = await cache.getAll();
    expect(list).toEqual([]);
  });

  it('should manage last sync timestamp', async () => {
    expect(await cache.getLastSyncTimestamp()).toBeNull();
    const ts = '2026-08-05T00:00:00.000Z';
    await cache.setLastSyncTimestamp(ts);
    expect(await cache.getLastSyncTimestamp()).toBe(ts);
  });
});
