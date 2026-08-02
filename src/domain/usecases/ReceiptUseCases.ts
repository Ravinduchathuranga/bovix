import { ReceiptRepository } from '../repositories/ReceiptRepository';
import { CompanyReceiptRecord, MilkReconciliationComparison } from '../entities/cattle';

export class AddCompanyReceiptUseCase {
  constructor(private receiptRepository: ReceiptRepository) {}

  async execute(
    date: string,
    receiptNumber: string,
    companyName: string,
    companyScaleKg: number,
    companyFatPercentage?: number,
    pricePerKg?: number,
    notes?: string
  ): Promise<CompanyReceiptRecord> {
    if (!date) {
      throw new Error('Please select a date.');
    }
    if (!receiptNumber || !receiptNumber.trim()) {
      throw new Error('Receipt number is required.');
    }
    if (isNaN(companyScaleKg) || companyScaleKg <= 0) {
      throw new Error('Company scale weight must be a positive number in KG.');
    }

    const totalPayout =
      pricePerKg && pricePerKg > 0 ? Math.round(companyScaleKg * pricePerKg * 100) / 100 : undefined;

    return await this.receiptRepository.addReceipt({
      date,
      receiptNumber: receiptNumber.trim(),
      companyName: companyName.trim() || 'Dairy Buyer Inc.',
      companyScaleKg: Math.round(companyScaleKg * 10) / 10,
      companyFatPercentage,
      pricePerKg,
      totalPayout,
      notes,
    });
  }
}

export class GetReconciliationUseCase {
  constructor(private receiptRepository: ReceiptRepository) {}

  async execute(): Promise<MilkReconciliationComparison[]> {
    return await this.receiptRepository.getReconciliationData();
  }
}

export class DeleteReceiptUseCase {
  constructor(private receiptRepository: ReceiptRepository) {}

  async execute(id: string): Promise<void> {
    return await this.receiptRepository.deleteReceipt(id);
  }
}
