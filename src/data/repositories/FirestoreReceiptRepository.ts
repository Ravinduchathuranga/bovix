import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { ReceiptRepository } from '../../domain/repositories/ReceiptRepository';
import { MilkingRepository } from '../../domain/repositories/MilkingRepository';
import { CompanyReceiptRecord, MilkReconciliationComparison } from '../../domain/entities/cattle';

export class FirestoreReceiptRepository implements ReceiptRepository {
  private collectionName = 'company_receipts';

  constructor(private milkingRepository: MilkingRepository) {}

  async getAllReceipts(): Promise<CompanyReceiptRecord[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as CompanyReceiptRecord));
    } catch (err) {
      console.warn('Firestore getAllReceipts error:', err);
      return [];
    }
  }

  async addReceipt(
    receiptData: Omit<CompanyReceiptRecord, 'id' | 'createdAt'>
  ): Promise<CompanyReceiptRecord> {
    const id = `rcp_${Date.now()}`;
    const newReceipt: CompanyReceiptRecord = {
      ...receiptData,
      id,
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, this.collectionName, id), newReceipt);
    } catch (err) {
      console.warn('Firestore add receipt error:', err);
    }
    return newReceipt;
  }

  async deleteReceipt(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (err) {
      console.warn('Firestore delete receipt error:', err);
    }
  }

  async getReconciliationData(): Promise<MilkReconciliationComparison[]> {
    const bulkRecords = await this.milkingRepository.getMilkRecords();
    const receipts = await this.getAllReceipts();

    const farmLoggedByDate: { [date: string]: number } = {};
    bulkRecords.forEach((r) => {
      farmLoggedByDate[r.date] = (farmLoggedByDate[r.date] || 0) + r.amountKg;
    });

    const allDates = Array.from(
      new Set([...Object.keys(farmLoggedByDate), ...receipts.map((r) => r.date)])
    ).sort((a, b) => b.localeCompare(a));

    const comparisons: MilkReconciliationComparison[] = allDates.map((date) => {
      const farmLoggedKg = farmLoggedByDate[date] || 0;
      const receipt = receipts.find((r) => r.date === date);
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
