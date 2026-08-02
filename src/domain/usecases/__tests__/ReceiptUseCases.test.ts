import {
  AddCompanyReceiptUseCase,
  GetReconciliationUseCase,
  DeleteReceiptUseCase,
} from '../ReceiptUseCases';
import { ReceiptRepository } from '../../repositories/ReceiptRepository';
import { CompanyReceiptRecord, MilkReconciliationComparison } from '../../entities/cattle';

describe('ReceiptUseCases', () => {
  let mockReceiptRepository: jest.Mocked<ReceiptRepository>;

  beforeEach(() => {
    mockReceiptRepository = {
      getAllReceipts: jest.fn(),
      addReceipt: jest.fn(),
      deleteReceipt: jest.fn(),
      getReconciliationData: jest.fn(),
    };
  });

  describe('AddCompanyReceiptUseCase', () => {
    let useCase: AddCompanyReceiptUseCase;

    beforeEach(() => {
      useCase = new AddCompanyReceiptUseCase(mockReceiptRepository);
    });

    it('should add company receipt and calculate total payout correctly', async () => {
      const mockReceipt: CompanyReceiptRecord = {
        id: 'rcp_100',
        date: '2026-08-01',
        receiptNumber: 'REC-9001',
        companyName: 'Lactalis',
        companyScaleKg: 200.0,
        pricePerKg: 0.85,
        totalPayout: 170.0,
        createdAt: new Date().toISOString(),
      };

      mockReceiptRepository.addReceipt.mockResolvedValue(mockReceipt);

      const result = await useCase.execute(
        '2026-08-01',
        ' REC-9001 ',
        'Lactalis',
        200,
        undefined,
        0.85
      );

      expect(mockReceiptRepository.addReceipt).toHaveBeenCalledWith({
        date: '2026-08-01',
        receiptNumber: 'REC-9001',
        companyName: 'Lactalis',
        companyScaleKg: 200,
        companyFatPercentage: undefined,
        pricePerKg: 0.85,
        totalPayout: 170,
        notes: undefined,
      });

      expect(result).toEqual(mockReceipt);
    });

    it('should throw an error if receipt number is missing', async () => {
      await expect(useCase.execute('2026-08-01', '', 'Company', 100)).rejects.toThrow(
        'Receipt number is required.'
      );
    });

    it('should throw an error if company scale weight is invalid', async () => {
      await expect(useCase.execute('2026-08-01', 'REC-1', 'Company', 0)).rejects.toThrow(
        'Company scale weight must be a positive number in KG.'
      );
    });
  });

  describe('GetReconciliationUseCase', () => {
    it('should retrieve reconciliation comparisons list', async () => {
      const useCase = new GetReconciliationUseCase(mockReceiptRepository);
      const mockComparisons: MilkReconciliationComparison[] = [
        {
          date: '2026-08-01',
          farmLoggedKg: 200,
          companyReceiptKg: 201,
          differenceKg: 1,
          variancePercentage: 0.5,
          status: 'match',
        },
      ];

      mockReceiptRepository.getReconciliationData.mockResolvedValue(mockComparisons);

      const result = await useCase.execute();
      expect(result).toEqual(mockComparisons);
      expect(mockReceiptRepository.getReconciliationData).toHaveBeenCalled();
    });
  });

  describe('DeleteReceiptUseCase', () => {
    it('should invoke deleteReceipt on repository', async () => {
      const useCase = new DeleteReceiptUseCase(mockReceiptRepository);
      mockReceiptRepository.deleteReceipt.mockResolvedValue();

      await useCase.execute('rcp_777');
      expect(mockReceiptRepository.deleteReceipt).toHaveBeenCalledWith('rcp_777');
    });
  });
});
