import { ReceiptRepository } from '../../domain/repositories/ReceiptRepository';
import { MilkingRepository } from '../../domain/repositories/MilkingRepository';
import { CompanyReceiptRecord, MilkReconciliationComparison } from '../../domain/entities/cattle';

const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

const INITIAL_RECEIPTS: CompanyReceiptRecord[] = [
  {
    id: 'rcp_201',
    date: yesterday,
    receiptNumber: 'REC-88912',
    companyName: 'Lactalis Dairy Co.',
    companyScaleKg: 278.0, // Farm logged: 142 + 138.5 = 280.5 kg (Diff: -2.5 kg)
    companyFatPercentage: 4.1,
    pricePerKg: 0.85,
    totalPayout: 236.3,
    notes: 'Official slip from driver',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

export class MockReceiptRepository implements ReceiptRepository {
  private receipts: CompanyReceiptRecord[] = [...INITIAL_RECEIPTS];

  constructor(private milkingRepository: MilkingRepository) {}

  async getAllReceipts(): Promise<CompanyReceiptRecord[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...this.receipts].sort((a, b) => b.date.localeCompare(a.date));
  }

  async addReceipt(
    receiptData: Omit<CompanyReceiptRecord, 'id' | 'createdAt'>
  ): Promise<CompanyReceiptRecord> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newReceipt: CompanyReceiptRecord = {
      ...receiptData,
      id: `rcp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.receipts.unshift(newReceipt);
    return newReceipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    this.receipts = this.receipts.filter((r) => r.id !== id);
  }

  async getReconciliationData(): Promise<MilkReconciliationComparison[]> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    // Fetch all local bulk records
    const bulkRecords = await this.milkingRepository.getMilkRecords();

    // Group farm logged milk by date
    const farmLoggedByDate: { [date: string]: number } = {};
    bulkRecords.forEach((r) => {
      farmLoggedByDate[r.date] = (farmLoggedByDate[r.date] || 0) + r.amountKg;
    });

    // Extract all unique dates from farm logs & receipts
    const allDates = Array.from(
      new Set([...Object.keys(farmLoggedByDate), ...this.receipts.map((r) => r.date)])
    ).sort((a, b) => b.localeCompare(a));

    const comparisons: MilkReconciliationComparison[] = allDates.map((date) => {
      const farmLoggedKg = farmLoggedByDate[date] || 0;
      const receipt = this.receipts.find((r) => r.date === date);
      const companyScaleKg = receipt ? receipt.companyScaleKg : 0;

      const differenceKg = Math.round((companyScaleKg - farmLoggedKg) * 10) / 10;
      const variancePercentage =
        farmLoggedKg > 0 ? Math.round((differenceKg / farmLoggedKg) * 1000) / 10 : 0;

      let status: MilkReconciliationComparison['status'] = 'match';
      if (!receipt) {
        status = 'minor_discrepancy';
      } else if (Math.abs(differenceKg) <= 2.0) {
        status = 'match';
      } else if (Math.abs(differenceKg) <= 5.0) {
        status = 'minor_discrepancy';
      } else {
        status = 'discrepancy';
      }

      return {
        date,
        farmLoggedKg,
        companyReceiptKg: companyScaleKg,
        differenceKg,
        variancePercentage,
        status,
        receipt,
      };
    });

    return comparisons;
  }
}
