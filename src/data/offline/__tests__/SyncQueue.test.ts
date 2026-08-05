import AsyncStorage from '@react-native-async-storage/async-storage';
import { SyncQueue } from '../SyncQueue';
import { Cattle } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('SyncQueue', () => {
  let queue: SyncQueue;

  const mockCattle: Cattle = {
    id: 'cow_1',
    tagNumber: 'TAG-1',
    name: 'Daisy',
    breed: 'Jersey',
    ageYears: 2,
    ageMonths: 6,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 15,
    healthStatus: 'healthy',
    medicalHistory: '',
    calvesDelivered: 1,
  };

  beforeEach(async () => {
    queue = new SyncQueue();
    await AsyncStorage.clear();
  });

  it('should enqueue operation and retrieve pending', async () => {
    await queue.enqueue({ operationType: 'ADD', payload: mockCattle });
    const pending = await queue.getPending();
    expect(pending.length).toBe(1);
    expect(pending[0].operationType).toBe('ADD');
  });

  it('should deduplicate multiple UPDATE operations for same entity', async () => {
    await queue.enqueue({ operationType: 'UPDATE', payload: mockCattle });
    const updatedCow = { ...mockCattle, name: 'Daisy updated' };
    await queue.enqueue({ operationType: 'UPDATE', payload: updatedCow });

    const pending = await queue.getPending();
    expect(pending.length).toBe(1);
    expect((pending[0].payload as Cattle).name).toBe('Daisy updated');
  });

  it('should cancel out ADD and DELETE for same entity created offline', async () => {
    await queue.enqueue({ operationType: 'ADD', payload: mockCattle });
    expect((await queue.getPending()).length).toBe(1);

    await queue.enqueue({ operationType: 'DELETE', payload: 'cow_1' });
    expect((await queue.getPending()).length).toBe(0);
  });

  it('should mark operation status correctly', async () => {
    await queue.enqueue({ operationType: 'ADD', payload: mockCattle });
    const pending = await queue.getPending();
    const opId = pending[0].id;

    await queue.markSyncing(opId);
    let all = await queue.getAll();
    expect(all[0].status).toBe('syncing');

    await queue.markFailed(opId);
    all = await queue.getAll();
    expect(all[0].status).toBe('failed');
    expect(all[0].retryCount).toBe(1);

    await queue.dequeue(opId);
    all = await queue.getAll();
    expect(all.length).toBe(0);
  });
});
