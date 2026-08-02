import {
  AddStockItemUseCase,
  RefillStockUseCase,
  RecordFeedUsageUseCase,
  DeleteStockItemUseCase,
} from '../StockUseCases';
import { StockRepository } from '../../repositories/StockRepository';
import { FeedStockItem, FeedUsageRecord } from '../../entities/stock';

describe('StockUseCases', () => {
  let mockStockRepo: jest.Mocked<StockRepository>;

  beforeEach(() => {
    mockStockRepo = {
      getStockItems: jest.fn(),
      addStockItem: jest.fn(),
      updateStockItem: jest.fn(),
      deleteStockItem: jest.fn(),
      recordFeedUsage: jest.fn(),
      getFeedUsageHistory: jest.fn(),
    };
  });

  describe('AddStockItemUseCase', () => {
    it('should create a new stock item with rounded stock levels', async () => {
      const useCase = new AddStockItemUseCase(mockStockRepo);
      const expectedItem: FeedStockItem = {
        id: 'stk_123',
        name: 'Napier Grass Silage',
        category: 'Silage',
        currentStockKg: 1500,
        unit: 'KG',
        minThresholdKg: 200,
        costPerUnit: 45,
        supplierName: 'Agro Feeds',
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T10:00:00Z',
      };

      mockStockRepo.addStockItem.mockResolvedValue(expectedItem);

      const result = await useCase.execute(
        'Napier Grass Silage',
        'Silage',
        1500.04,
        'KG',
        200,
        45,
        'Agro Feeds'
      );

      expect(mockStockRepo.addStockItem).toHaveBeenCalledWith({
        name: 'Napier Grass Silage',
        category: 'Silage',
        currentStockKg: 1500,
        unit: 'KG',
        minThresholdKg: 200,
        costPerUnit: 45,
        supplierName: 'Agro Feeds',
        notes: undefined,
      });
      expect(result).toEqual(expectedItem);
    });

    it('should throw validation error if feed name is empty', async () => {
      const useCase = new AddStockItemUseCase(mockStockRepo);
      await expect(useCase.execute('', 'Silage', 100)).rejects.toThrow(
        'Feed item name is required.'
      );
    });
  });

  describe('RefillStockUseCase', () => {
    it('should calculate new total stock and call updateStockItem', async () => {
      const useCase = new RefillStockUseCase(mockStockRepo);
      const updatedItem: FeedStockItem = {
        id: 'stk_1',
        name: 'Dairy Concentrate',
        category: 'Concentrate',
        currentStockKg: 700,
        unit: 'KG',
        minThresholdKg: 100,
        createdAt: '2026-08-02T10:00:00Z',
        updatedAt: '2026-08-02T11:00:00Z',
      };

      mockStockRepo.updateStockItem.mockResolvedValue(updatedItem);

      const result = await useCase.execute('stk_1', 500, 200);

      expect(mockStockRepo.updateStockItem).toHaveBeenCalledWith(
        'stk_1',
        expect.objectContaining({
          currentStockKg: 700,
        })
      );
      expect(result).toEqual(updatedItem);
    });
  });

  describe('RecordFeedUsageUseCase', () => {
    it('should deduct used feed amount from stock and log consumption', async () => {
      const useCase = new RecordFeedUsageUseCase(mockStockRepo);
      const usageRecord: FeedUsageRecord = {
        id: 'usg_1',
        feedStockId: 'stk_1',
        feedStockName: 'Napier Silage',
        date: '2026-08-02',
        amountUsedKg: 150,
        session: 'Morning',
        createdAt: '2026-08-02T10:00:00Z',
      };

      mockStockRepo.recordFeedUsage.mockResolvedValue(usageRecord);

      const result = await useCase.execute(
        'stk_1',
        'Napier Silage',
        1000,
        150,
        '2026-08-02',
        'Morning'
      );

      expect(mockStockRepo.updateStockItem).toHaveBeenCalledWith(
        'stk_1',
        expect.objectContaining({
          currentStockKg: 850,
        })
      );
      expect(mockStockRepo.recordFeedUsage).toHaveBeenCalledWith({
        feedStockId: 'stk_1',
        feedStockName: 'Napier Silage',
        date: '2026-08-02',
        amountUsedKg: 150,
        session: 'Morning',
        notes: undefined,
      });
      expect(result).toEqual(usageRecord);
    });
  });

  describe('DeleteStockItemUseCase', () => {
    it('should delete stock item by ID', async () => {
      const useCase = new DeleteStockItemUseCase(mockStockRepo);
      mockStockRepo.deleteStockItem.mockResolvedValue();

      await useCase.execute('stk_1');

      expect(mockStockRepo.deleteStockItem).toHaveBeenCalledWith('stk_1');
    });
  });
});
