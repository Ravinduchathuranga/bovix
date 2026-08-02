import { MilkingRepository } from '../repositories/MilkingRepository';
import { BulkMilkRecord } from '../entities/cattle';

export class RecordBulkMilkUseCase {
  constructor(private milkingRepository: MilkingRepository) {}

  async execute(
    date: string,
    session: 'Morning' | 'Evening',
    amountKg: number,
    fatPercentage?: number,
    notes?: string
  ): Promise<BulkMilkRecord> {
    if (!date) {
      throw new Error('Please select a valid date.');
    }
    if (isNaN(amountKg) || amountKg <= 0) {
      throw new Error('Milk amount must be a positive number in KG.');
    }
    if (fatPercentage !== undefined && (isNaN(fatPercentage) || fatPercentage < 0 || fatPercentage > 100)) {
      throw new Error('Fat percentage must be a valid percentage between 0 and 100.');
    }
    return await this.milkingRepository.recordBulkMilk({
      date,
      session,
      amountKg: Math.round(amountKg * 10) / 10,
      fatPercentage: fatPercentage !== undefined ? Math.round(fatPercentage * 10) / 10 : undefined,
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
