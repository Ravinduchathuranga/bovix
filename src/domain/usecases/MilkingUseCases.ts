import { MilkingRepository } from '../repositories/MilkingRepository';
import { BulkMilkRecord } from '../entities/cattle';

export class RecordBulkMilkUseCase {
  constructor(private milkingRepository: MilkingRepository) {}

  async execute(date: string, session: 'Morning' | 'Evening', amountKg: number, notes?: string): Promise<BulkMilkRecord> {
    if (!date) {
      throw new Error('Please select a valid date.');
    }
    if (isNaN(amountKg) || amountKg <= 0) {
      throw new Error('Milk amount must be a positive number in KG.');
    }
    return await this.milkingRepository.recordBulkMilk({
      date,
      session,
      amountKg: Math.round(amountKg * 10) / 10,
      notes,
    });
  }
}

export class GetMilkRecordsUseCase {
  constructor(private milkingRepository: MilkingRepository) {}

  async execute(): Promise<BulkMilkRecord[]> {
    return await this.milkingRepository.getMilkRecords();
  }
}

export class DeleteMilkRecordUseCase {
  constructor(private milkingRepository: MilkingRepository) {}

  async execute(id: string): Promise<void> {
    return await this.milkingRepository.deleteMilkRecord(id);
  }
}
