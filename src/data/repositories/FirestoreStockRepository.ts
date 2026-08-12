import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { StockRepository } from '../../domain/repositories/StockRepository';
import { FeedStockItem, FeedUsageRecord } from '../../domain/entities/stock';

export class FirestoreStockRepository implements StockRepository {
  private stockCollection = 'farm_stock';
  private usageCollection = 'stock_usage';

  async getStockItems(): Promise<FeedStockItem[]> {
    try {
      const q = query(collection(db, this.stockCollection), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FeedStockItem));
    } catch (err) {
      console.warn('Firestore getStockItems error:', err);
      return [];
    }
  }

  async addStockItem(
    itemData: Omit<FeedStockItem, 'id' | 'createdAt' | 'updatedAt'> | FeedStockItem
  ): Promise<FeedStockItem> {
    const fullItem = itemData as Partial<FeedStockItem>;
    const id = fullItem.id || `stk_${Date.now()}`;
    const now = new Date().toISOString();
    const newItem: FeedStockItem = {
      name: fullItem.name || '',
      category: fullItem.category || 'Other',
      currentStockKg: fullItem.currentStockKg || 0,
      unit: fullItem.unit || 'KG',
      minThresholdKg: fullItem.minThresholdKg || 50,
      costPerUnit: fullItem.costPerUnit,
      supplierName: fullItem.supplierName,
      notes: fullItem.notes,
      id,
      createdAt: fullItem.createdAt || now,
      updatedAt: fullItem.updatedAt || now,
    };
    try {
      const docData = Object.fromEntries(
        Object.entries(newItem).filter(([_, v]) => v !== undefined)
      );
      await setDoc(doc(db, this.stockCollection, id), docData);
    } catch (err) {
      console.error('Firestore add stock item error:', err);
      throw err;
    }
    return newItem;
  }

  async updateStockItem(id: string, updates: Partial<FeedStockItem>): Promise<FeedStockItem> {
    try {
      const docRef = doc(db, this.stockCollection, id);
      const cleanUpdates = Object.fromEntries(
        Object.entries({ ...updates, updatedAt: updates.updatedAt || new Date().toISOString() }).filter(
          ([_, v]) => v !== undefined
        )
      );
      await updateDoc(docRef, cleanUpdates);

      // Return updated mock representation
      const all = await this.getStockItems();
      const updated = all.find((item) => item.id === id);
      if (!updated) {
        throw new Error('Item updated but not found in snapshot.');
      }
      return updated;
    } catch (err) {
      console.error('Firestore update stock item error:', err);
      throw err;
    }
  }

  async deleteStockItem(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.stockCollection, id));
    } catch (err) {
      console.error('Firestore delete stock item error:', err);
      throw err;
    }
  }

  async recordFeedUsage(
    usageData: Omit<FeedUsageRecord, 'id' | 'createdAt'> | FeedUsageRecord
  ): Promise<FeedUsageRecord> {
    const fullUsage = usageData as Partial<FeedUsageRecord>;
    const id = fullUsage.id || `usg_${Date.now()}`;
    const newUsage: FeedUsageRecord = {
      feedStockId: fullUsage.feedStockId || '',
      feedStockName: fullUsage.feedStockName || '',
      date: fullUsage.date || new Date().toISOString().split('T')[0],
      amountUsedKg: fullUsage.amountUsedKg || 0,
      session: fullUsage.session,
      notes: fullUsage.notes,
      id,
      createdAt: fullUsage.createdAt || new Date().toISOString(),
    };
    try {
      const docData = Object.fromEntries(
        Object.entries(newUsage).filter(([_, v]) => v !== undefined)
      );
      await setDoc(doc(db, this.usageCollection, id), docData);
    } catch (err) {
      console.error('Firestore record feed usage error:', err);
      throw err;
    }
    return newUsage;
  }

  async getFeedUsageHistory(): Promise<FeedUsageRecord[]> {
    try {
      const q = query(collection(db, this.usageCollection), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as FeedUsageRecord));
    } catch (err) {
      console.warn('Firestore getFeedUsageHistory error:', err);
      return [];
    }
  }
}
