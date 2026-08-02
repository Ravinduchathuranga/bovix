import { CompanyReceiptRecord, MilkReconciliationComparison } from '../entities/cattle';

export interface ReceiptRepository {
  getAllReceipts(): Promise<CompanyReceiptRecord[]>;
  addReceipt(receipt: Omit<CompanyReceiptRecord, 'id' | 'createdAt'>): Promise<CompanyReceiptRecord>;
  deleteReceipt(id: string): Promise<void>;
  getReconciliationData(): Promise<MilkReconciliationComparison[]>;
}
