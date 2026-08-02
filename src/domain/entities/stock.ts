export type FeedCategory = 'Forage' | 'Concentrate' | 'Supplement' | 'Silage' | 'Other';
export type FeedUnit = 'KG' | 'Bags' | 'Tons' | 'Units';

export interface FeedStockItem {
  id: string;
  name: string; // e.g. "Napier Grass Silage", "Dairy Concentrate 18%"
  category: FeedCategory;
  currentStockKg: number;
  unit: FeedUnit;
  minThresholdKg: number; // Low stock alert threshold
  costPerUnit?: number; // Cost in RS per unit
  supplierName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedUsageRecord {
  id: string;
  feedStockId: string;
  feedStockName: string;
  date: string; // YYYY-MM-DD
  amountUsedKg: number;
  session?: 'Morning' | 'Evening' | 'Full Day';
  notes?: string;
  createdAt: string;
}
