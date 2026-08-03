import { StockRepository } from '../repositories/StockRepository';
import { FeedCategory, FeedStockItem, FeedUnit, FeedUsageRecord } from '../entities/stock';

export class GetStockItemsUseCase {
  constructor(private stockRepository: StockRepository) {}

  async execute(): Promise<FeedStockItem[]> {
    return await this.stockRepository.getStockItems();
  }
}

export class AddStockItemUseCase {
  constructor(private stockRepository: StockRepository) {}

  async execute(
    name: string,
    category: FeedCategory,
    currentStockKg: number,
    unit: FeedUnit = 'KG',
    minThresholdKg: number = 50,
    costPerUnit?: number,
    supplierName?: string,
    notes?: string
  ): Promise<FeedStockItem> {
    if (!name || !name.trim()) {
      throw new Error('Feed item name is required.');
    }
    if (isNaN(currentStockKg) || currentStockKg < 0) {
      throw new Error('Current stock amount must be zero or a positive number.');
    }
    if (isNaN(minThresholdKg) || minThresholdKg < 0) {
      throw new Error('Minimum threshold must be zero or a positive number.');
    }

    return await this.stockRepository.addStockItem({
      name: name.trim(),
      category,
      currentStockKg: Math.round(currentStockKg * 10) / 10,
      unit,
      minThresholdKg: Math.round(minThresholdKg * 10) / 10,
      costPerUnit: costPerUnit && costPerUnit > 0 ? Math.round(costPerUnit * 100) / 100 : undefined,
      supplierName: supplierName ? supplierName.trim() : undefined,
      notes: notes ? notes.trim() : undefined,
    });
  }
}

export class RefillStockUseCase {
  constructor(private stockRepository: StockRepository) {}

  async execute(id: string, currentStockKg: number, refillAmountKg: number): Promise<FeedStockItem> {
    if (!id) {
      throw new Error('Feed item ID is required.');
    }
    if (isNaN(refillAmountKg) || refillAmountKg <= 0) {
      throw new Error('Refill amount must be a positive number.');
    }

    const newTotal = Math.round((currentStockKg + refillAmountKg) * 10) / 10;
    return await this.stockRepository.updateStockItem(id, {
      currentStockKg: newTotal,
      updatedAt: new Date().toISOString(),
    });
  }
}

export class DeleteStockItemUseCase {
  constructor(private stockRepository: StockRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error('Feed item ID is required.');
    }
    return await this.stockRepository.deleteStockItem(id);
  }
}

export class RecordFeedUsageUseCase {
  constructor(private stockRepository: StockRepository) {}

  async execute(
    feedStockId: string,
    feedStockName: string,
    currentStockKg: number,
    amountUsedKg: number,
    date: string,
    session?: 'Morning' | 'Evening' | 'Full Day',
    notes?: string
  ): Promise<FeedUsageRecord> {
    if (!feedStockId) {
      throw new Error('Please select a valid feed item.');
    }
    if (isNaN(amountUsedKg) || amountUsedKg <= 0) {
      throw new Error('Amount used must be a positive number.');
    }
    if (!date) {
      throw new Error('Please select a date.');
    }

    const remainingStock = Math.max(0, Math.round((currentStockKg - amountUsedKg) * 10) / 10);

    // Update remaining stock on feed item
    await this.stockRepository.updateStockItem(feedStockId, {
      currentStockKg: remainingStock,
      updatedAt: new Date().toISOString(),
    });

    // Record consumption entry
    return await this.stockRepository.recordFeedUsage({
      feedStockId,
      feedStockName,
      date,
      amountUsedKg: Math.round(amountUsedKg * 10) / 10,
      session,
      notes: notes ? notes.trim() : undefined,
    });
  }
}

export class GetFeedUsageHistoryUseCase {
  constructor(private stockRepository: StockRepository) {}

  async execute(): Promise<FeedUsageRecord[]> {
    return await this.stockRepository.getFeedUsageHistory();
  }
}
