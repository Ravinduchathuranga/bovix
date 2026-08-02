import { FeedStockItem, FeedUsageRecord } from '../entities/stock';

export interface StockRepository {
  getStockItems(): Promise<FeedStockItem[]>;
  addStockItem(item: Omit<FeedStockItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<FeedStockItem>;
  updateStockItem(id: string, updates: Partial<FeedStockItem>): Promise<FeedStockItem>;
  deleteStockItem(id: string): Promise<void>;
  recordFeedUsage(usage: Omit<FeedUsageRecord, 'id' | 'createdAt'>): Promise<FeedUsageRecord>;
  getFeedUsageHistory(): Promise<FeedUsageRecord[]>;
}
