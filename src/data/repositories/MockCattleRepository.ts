import { CattleRepository } from '../../domain/repositories/CattleRepository';
import { Cattle, DashboardMetrics } from '../../domain/entities/cattle';

const INITIAL_CATTLE: Cattle[] = [
  {
    id: 'cow_1',
    tagNumber: 'BVX-101',
    name: 'Bella',
    breed: 'Holstein Friesian',
    ageYears: 4,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 28.5,
    lastMilkingTime: '06:30 AM',
    healthStatus: 'healthy',
  },
  {
    id: 'cow_2',
    tagNumber: 'BVX-102',
    name: 'Daisy',
    breed: 'Jersey',
    ageYears: 3,
    gender: 'female',
    status: 'lactating',
    dailyMilkYieldLiters: 22.0,
    lastMilkingTime: '06:45 AM',
    healthStatus: 'healthy',
  },
  {
    id: 'cow_3',
    tagNumber: 'BVX-103',
    name: 'Luna',
    breed: 'Swiss Brown',
    ageYears: 5,
    gender: 'female',
    status: 'dry',
    dailyMilkYieldLiters: 0,
    lastMilkingTime: 'N/A',
    healthStatus: 'needs_attention',
  },
  {
    id: 'cow_4',
    tagNumber: 'BVX-104',
    name: 'Molly',
    breed: 'Guernsey',
    ageYears: 2,
    gender: 'female',
    status: 'pregnant',
    dailyMilkYieldLiters: 14.2,
    lastMilkingTime: '06:15 AM',
    healthStatus: 'healthy',
  },
  {
    id: 'cow_5',
    tagNumber: 'BVX-105',
    name: 'Rosie',
    breed: 'Ayrshire',
    ageYears: 6,
    gender: 'female',
    status: 'sick',
    dailyMilkYieldLiters: 8.0,
    lastMilkingTime: '07:00 AM',
    healthStatus: 'under_treatment',
  },
];

export class MockCattleRepository implements CattleRepository {
  private cattleList: Cattle[] = [...INITIAL_CATTLE];

  async getAllCattle(): Promise<Cattle[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [...this.cattleList];
  }

  async getCattleById(id: string): Promise<Cattle | null> {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return this.cattleList.find((c) => c.id === id) || null;
  }

  async addCattle(cattleData: Omit<Cattle, 'id'>): Promise<Cattle> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newCattle: Cattle = {
      ...cattleData,
      id: `cow_${Date.now()}`,
    };
    this.cattleList.unshift(newCattle);
    return newCattle;
  }

  async updateCattle(cattle: Cattle): Promise<Cattle> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const index = this.cattleList.findIndex((c) => c.id === cattle.id);
    if (index !== -1) {
      this.cattleList[index] = cattle;
    }
    return cattle;
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const totalCount = this.cattleList.length;
    const lactating = this.cattleList.filter((c) => c.status === 'lactating');
    const totalYield = this.cattleList.reduce((acc, c) => acc + c.dailyMilkYieldLiters, 0);
    const needsAttention = this.cattleList.filter(
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
