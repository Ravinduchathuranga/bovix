import { MilkingRepository } from '../../domain/repositories/MilkingRepository';
import { BulkMilkRecord } from '../../domain/entities/cattle';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const INITIAL_BULK_RECORDS: BulkMilkRecord[] = [
  {
    id: 'blk_101',
    date: today,
    session: 'Morning',
    amountKg: 145.5,
    fatPercentage: 4.2,
    notes: 'Morning collection from Main Tank',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'blk_102',
    date: today,
    session: 'Evening',
    amountKg: 132.0,
    fatPercentage: 4.3,
    notes: 'Evening collection',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'blk_103',
    date: yesterday,
    session: 'Morning',
    amountKg: 142.0,
    fatPercentage: 4.1,
    notes: 'Normal morning collection',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'blk_104',
    date: yesterday,
    session: 'Evening',
    amountKg: 138.5,
    fatPercentage: 4.2,
    notes: 'Evening collection',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export class MockMilkingRepository implements MilkingRepository {
  private records: BulkMilkRecord[] = [...INITIAL_BULK_RECORDS];

  async getMilkRecords(): Promise<BulkMilkRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...this.records].sort((a, b) => b.date.localeCompare(a.date));
  }

  async getMilkRecordsByDate(date: string): Promise<BulkMilkRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.records.filter((r) => r.date === date);
  }

  async recordBulkMilk(recordData: Omit<BulkMilkRecord, 'id' | 'createdAt'>): Promise<BulkMilkRecord> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newRecord: BulkMilkRecord = {
      ...recordData,
      id: `blk_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.records.unshift(newRecord);
    return newRecord;
  }

  async deleteMilkRecord(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.records = this.records.filter((r) => r.id !== id);
  }
}
