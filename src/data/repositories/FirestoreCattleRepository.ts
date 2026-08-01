import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { CattleRepository } from '../../domain/repositories/CattleRepository';
import { Cattle, DashboardMetrics } from '../../domain/entities/cattle';

export class FirestoreCattleRepository implements CattleRepository {
  private collectionName = 'cattle';

  async getAllCattle(): Promise<Cattle[]> {
    try {
      const q = query(collection(db, this.collectionName), orderBy('tagNumber', 'asc'));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return [];
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as Cattle));
    } catch (err) {
      console.warn('Firestore read error:', err);
      return [];
    }
  }

  async getCattleById(id: string): Promise<Cattle | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as Cattle;
      }
      return null;
    } catch (err) {
      console.warn('Firestore getById error:', err);
      return null;
    }
  }

  async addCattle(cattleData: Omit<Cattle, 'id'>): Promise<Cattle> {
    const id = `cow_${Date.now()}`;
    const newCattle: Cattle = { ...cattleData, id };
    try {
      const docData = Object.fromEntries(
        Object.entries(newCattle).filter(([_, v]) => v !== undefined)
      );
      await setDoc(doc(db, this.collectionName, id), docData);
    } catch (err) {
      console.error('Firestore write error:', err);
      throw err;
    }
    return newCattle;
  }

  async updateCattle(cattle: Cattle): Promise<Cattle> {
    try {
      const docRef = doc(db, this.collectionName, cattle.id);
      const docData = Object.fromEntries(
        Object.entries(cattle).filter(([_, v]) => v !== undefined)
      );
      await updateDoc(docRef, docData);
    } catch (err) {
      console.error('Firestore update error:', err);
      throw err;
    }
    return cattle;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const cattleList = await this.getAllCattle();
    const totalCount = cattleList.length;
    const lactating = cattleList.filter((c) => c.status === 'lactating');
    const totalYield = cattleList.reduce((acc, c) => acc + c.dailyMilkYieldLiters, 0);
    const needsAttention = cattleList.filter(
      (c) => c.healthStatus === 'needs_attention' || c.healthStatus === 'under_treatment'
    ).length;

    return {
      totalCattleCount: totalCount,
      lactatingCount: lactating.length,
      todayMilkYieldTotal: Math.round(totalYield * 10) / 10,
      needsAttentionCount: needsAttention,
      avgYieldPerCow: totalCount > 0 ? Math.round((totalYield / totalCount) * 10) / 10 : 0,
    };
  }
}
