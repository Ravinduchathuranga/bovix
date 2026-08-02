import { GetAllCattleUseCase } from '../GetAllCattleUseCase';
import { GetDashboardDataUseCase } from '../GetDashboardDataUseCase';
import { CattleRepository } from '../../repositories/CattleRepository';
import { Cattle, DashboardMetrics } from '../../entities/cattle';

describe('CattleQueriesUseCases', () => {
  let mockCattleRepository: jest.Mocked<CattleRepository>;

  const mockCattleList: Cattle[] = [
    {
      id: 'cow_1',
      tagNumber: 'COW-001',
      name: 'Bella',
      breed: 'Holstein Friesian',
      ageYears: 3,
      ageMonths: 2,
      gender: 'female',
      status: 'lactating',
      dailyMilkYieldLiters: 25.5,
      healthStatus: 'healthy',
      medicalHistory: 'None',
      calvesDelivered: 1,
    },
    {
      id: 'cow_2',
      tagNumber: 'COW-002',
      name: 'Daisy',
      breed: 'Jersey',
      ageYears: 4,
      ageMonths: 0,
      gender: 'female',
      status: 'lactating',
      dailyMilkYieldLiters: 20.0,
      healthStatus: 'healthy',
      medicalHistory: 'Routine vaccination',
      calvesDelivered: 2,
    },
  ];

  const mockMetrics: DashboardMetrics = {
    totalCattleCount: 2,
    lactatingCount: 2,
    todayMilkYieldTotal: 45.5,
    needsAttentionCount: 0,
    avgYieldPerCow: 22.75,
  };

  beforeEach(() => {
    mockCattleRepository = {
      getAllCattle: jest.fn(),
      getCattleById: jest.fn(),
      addCattle: jest.fn(),
      updateCattle: jest.fn(),
      deleteCattle: jest.fn(),
      getDashboardMetrics: jest.fn(),
    };
  });

  describe('GetAllCattleUseCase', () => {
    it('should retrieve full list of cattle from repository', async () => {
      const useCase = new GetAllCattleUseCase(mockCattleRepository);
      mockCattleRepository.getAllCattle.mockResolvedValue(mockCattleList);

      const result = await useCase.execute();

      expect(mockCattleRepository.getAllCattle).toHaveBeenCalled();
      expect(result).toEqual(mockCattleList);
    });
  });

  describe('GetDashboardDataUseCase', () => {
    it('should return dashboard metrics and recent cattle sliced to top 5', async () => {
      const useCase = new GetDashboardDataUseCase(mockCattleRepository);
      mockCattleRepository.getDashboardMetrics.mockResolvedValue(mockMetrics);
      mockCattleRepository.getAllCattle.mockResolvedValue(mockCattleList);

      const result = await useCase.execute();

      expect(mockCattleRepository.getDashboardMetrics).toHaveBeenCalled();
      expect(mockCattleRepository.getAllCattle).toHaveBeenCalled();
      expect(result.metrics).toEqual(mockMetrics);
      expect(result.recentCattle).toHaveLength(2);
      expect(result.recentCattle).toEqual(mockCattleList);
    });
  });
});
