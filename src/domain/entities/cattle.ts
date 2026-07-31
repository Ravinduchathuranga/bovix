// Domain Layer: Entities
export interface Cattle {
  id: string;
  tagNumber: string;
  name: string;
  breed: string;
  ageYears: number;
  gender: 'female' | 'male';
  status: 'lactating' | 'dry' | 'pregnant' | 'calf' | 'sick';
  dailyMilkYieldLiters: number;
  lastMilkingTime?: string;
  healthStatus: 'healthy' | 'needs_attention' | 'under_treatment';
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'farmer' | 'veterinarian' | 'manager';
  farmName: string;
}

export interface BulkMilkRecord {
  id: string;
  date: string; // YYYY-MM-DD
  session: 'Morning' | 'Evening';
  amountKg: number;
  fatPercentage?: number;
  notes?: string;
  createdAt: string;
}

export interface DashboardMetrics {
  totalCattleCount: number;
  lactatingCount: number;
  todayMilkYieldTotal: number; // in KG
  needsAttentionCount: number;
  avgYieldPerCow: number;
}
