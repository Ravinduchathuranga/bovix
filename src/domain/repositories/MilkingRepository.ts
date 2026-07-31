import { BulkMilkRecord } from '../entities/cattle';

export interface MilkingRepository {
  getMilkRecords(): Promise<BulkMilkRecord[]>;
  getMilkRecordsByDate(date: string): Promise<BulkMilkRecord[]>;
  recordBulkMilk(record: Omit<BulkMilkRecord, 'id' | 'createdAt'>): Promise<BulkMilkRecord>;
  deleteMilkRecord(id: string): Promise<void>;
}
