// Domain Layer: Entities
export interface Cattle {
  id: string;
  tagNumber: string;
  name: string;
  breed: string;
  ageYears: number;
  ageMonths: number;
  gender: 'female' | 'male';
  status: 'lactating' | 'dry' | 'pregnant' | 'calf' | 'sick';
  dailyMilkYieldLiters: number;
  lastMilkingTime?: string;
  healthStatus: 'healthy' | 'needs_attention' | 'under_treatment';
  imageUri?: string;
  images?: string[];
  medicalHistory: string;
  calvesDelivered: number;
  updatedAt?: string;
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

export interface CompanyReceiptRecord {
  id: string;
  date: string; // YYYY-MM-DD
  receiptNumber: string;
  companyName: string;
  companyScaleKg: number;
  companyFatPercentage?: number;
  pricePerKg?: number;
  totalPayout?: number;
  notes?: string;
  createdAt: string;
}

export interface MilkReconciliationComparison {
  date: string;
  farmLoggedKg: number;
  companyReceiptKg: number;
  differenceKg: number; // companyScaleKg - farmLoggedKg
  variancePercentage: number; // ((differenceKg) / farmLoggedKg) * 100
  status: 'match' | 'minor_discrepancy' | 'discrepancy'; // green, yellow, red
  receipt?: CompanyReceiptRecord;
}

export interface DashboardMetrics {
  totalCattleCount: number;
  lactatingCount: number;
  todayMilkYieldTotal: number; // in KG
  needsAttentionCount: number;
  avgYieldPerCow: number;
}
