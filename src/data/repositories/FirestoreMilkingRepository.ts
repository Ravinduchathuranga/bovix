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
import { MilkingRepository } from '../../domain/repositories/MilkingRepository';
import { BulkMilkRecord } from '../../domain/entities/cattle';

export class FirestoreMilkingRepository implements MilkingRepository {
  private collectionName = 'milking_records';

  async getMilkRecords(): Promise<BulkMilkRecord[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BulkMilkRecord));
    } catch (err) {
      console.warn('Firestore getMilkRecords error:', err);
      return [];
    }
  }

  async getMilkRecordsByDate(date: string): Promise<BulkMilkRecord[]> {
    const all = await this.getMilkRecords();
    return all.filter((r) => r.date === date);
  }

  async recordBulkMilk(
    recordData: Omit<BulkMilkRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Promise<BulkMilkRecord> {
    const id = recordData.id || `blk_${Date.now()}`;
    const newRecord: BulkMilkRecord = {
      ...recordData,
      id,
      createdAt: recordData.createdAt || new Date().toISOString(),
    };
    try {
      const docData = Object.fromEntries(
        Object.entries(newRecord).filter(([_, v]) => v !== undefined)
      );
      await setDoc(doc(db, this.collectionName, id), docData);
    } catch (err) {
      console.error('Firestore record bulk milk error:', err);
      throw err;
    }
    return newRecord;
  }

  async deleteMilkRecord(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (err) {
      console.error('Firestore delete milk record error:', err);
      throw err;
    }
  }
}
