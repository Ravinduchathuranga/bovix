import AsyncStorage from '@react-native-async-storage/async-storage';
import { MilkingSyncQueue } from '../MilkingSyncQueue';
import { BulkMilkRecord } from '../../../domain/entities/cattle';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('MilkingSyncQueue', () => {
  let queue: MilkingSyncQueue;

  const mockRecord: BulkMilkRecord = {
    id: 'blk_100',
    date: '2026-08-05',
    session: 'Morning',
    amountKg: 140.0,
    createdAt: '2026-08-05T06:00:00.000Z',
  };

  beforeEach(async () => {
    await AsyncStorage.clear();
    queue = new MilkingSyncQueue();
  });

  test('enqueue adds RECORD operation to queue', async () => {
    await queue.enqueue({ operationType: 'RECORD', payload: mockRecord });
    const pending = await queue.getPending();
    expect(pending).toHaveLength(1);
    expect(pending[0].operationType).toBe('RECORD');
    expect(pending[0].payload).toEqual(mockRecord);
  });

  test('enqueue rejects duplicate RECORD for same date and session', async () => {
    await queue.enqueue({ operationType: 'RECORD', payload: mockRecord });

    const duplicateRecord: BulkMilkRecord = {
      ...mockRecord,
      id: 'blk_101',
      amountKg: 150.0,
    };

    await expect(
      queue.enqueue({ operationType: 'RECORD', payload: duplicateRecord })
    ).rejects.toThrow('A Morning milking record for 2026-08-05 is already queued for sync.');
  });

  test('enqueue DELETE cancels out existing RECORD operation for same ID', async () => {
    await queue.enqueue({ operationType: 'RECORD', payload: mockRecord });
    expect(await queue.getPending()).toHaveLength(1);

    await queue.enqueue({ operationType: 'DELETE', payload: 'blk_100' });
    expect(await queue.getAll()).toHaveLength(0);
  });

  test('status transitions work correctly (markSyncing, markFailed, dequeue)', async () => {
    await queue.enqueue({ operationType: 'RECORD', payload: mockRecord });
    let pending = await queue.getPending();
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
    expect(all).toHaveLength(0);
  });
});
