import {
  RecordBulkMilkUseCase,
  GetMilkRecordsUseCase,
  DeleteMilkRecordUseCase,
} from '../MilkingUseCases';
import { MilkingRepository } from '../../repositories/MilkingRepository';
import { BulkMilkRecord } from '../../entities/cattle';

describe('MilkingUseCases', () => {
  let mockMilkingRepository: jest.Mocked<MilkingRepository>;

  beforeEach(() => {
    mockMilkingRepository = {
      getMilkRecords: jest.fn(),
      getMilkRecordsByDate: jest.fn(),
      recordBulkMilk: jest.fn(),
      deleteMilkRecord: jest.fn(),
    };
  });

  describe('RecordBulkMilkUseCase', () => {
    let useCase: RecordBulkMilkUseCase;

    beforeEach(() => {
      useCase = new RecordBulkMilkUseCase(mockMilkingRepository);
    });

    it('should successfully record bulk milk with rounded float precision', async () => {
      const mockRecord: BulkMilkRecord = {
        id: 'blk_1',
        date: '2026-08-01',
        session: 'Morning',
        amountKg: 145.5,
        notes: 'Morning yield',
        createdAt: new Date().toISOString(),
      };

      mockMilkingRepository.recordBulkMilk.mockResolvedValue(mockRecord);

      const result = await useCase.execute('2026-08-01', 'Morning', 145.48, undefined, 'Morning yield');

      expect(mockMilkingRepository.recordBulkMilk).toHaveBeenCalledWith({
        date: '2026-08-01',
        session: 'Morning',
        amountKg: 145.5,
        fatPercentage: undefined,
        notes: 'Morning yield',
      });
      expect(result).toEqual(mockRecord);
    });

    it('should throw an error if date is missing', async () => {
      await expect(useCase.execute('', 'Morning', 100)).rejects.toThrow('Please select a valid date.');
    });

    it('should throw an error if milk amount is zero or negative', async () => {
      await expect(useCase.execute('2026-08-01', 'Evening', 0)).rejects.toThrow(
        'Milk amount must be a positive number in KG.'
      );
      await expect(useCase.execute('2026-08-01', 'Evening', -15.5)).rejects.toThrow(
        'Milk amount must be a positive number in KG.'
      );
    });
  });

  describe('GetMilkRecordsUseCase', () => {
    it('should retrieve list of bulk milk records', async () => {
      const useCase = new GetMilkRecordsUseCase(mockMilkingRepository);
      const records: BulkMilkRecord[] = [
        {
          id: 'blk_1',
          date: '2026-08-01',
          session: 'Morning',
          amountKg: 120,
          createdAt: new Date().toISOString(),
        },
      ];
      mockMilkingRepository.getMilkRecords.mockResolvedValue(records);

      const result = await useCase.execute();
      expect(result).toEqual(records);
      expect(mockMilkingRepository.getMilkRecords).toHaveBeenCalled();
    });
  });

  describe('DeleteMilkRecordUseCase', () => {
    it('should call delete on repository with correct ID', async () => {
      const useCase = new DeleteMilkRecordUseCase(mockMilkingRepository);
      mockMilkingRepository.deleteMilkRecord.mockResolvedValue();

      await useCase.execute('blk_999');

      expect(mockMilkingRepository.deleteMilkRecord).toHaveBeenCalledWith('blk_999');
    });
  });
});
