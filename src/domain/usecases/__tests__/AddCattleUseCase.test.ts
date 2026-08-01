import { AddCattleUseCase } from '../AddCattleUseCase';
import { CattleRepository } from '../../repositories/CattleRepository';
import { Cattle } from '../../entities/cattle';

describe('AddCattleUseCase', () => {
  let mockCattleRepository: jest.Mocked<CattleRepository>;
  let useCase: AddCattleUseCase;

  beforeEach(() => {
    mockCattleRepository = {
      getAllCattle: jest.fn(),
      getCattleById: jest.fn(),
      addCattle: jest.fn(),
      updateCattle: jest.fn(),
      getDashboardMetrics: jest.fn(),
    };
    useCase = new AddCattleUseCase(mockCattleRepository);
  });

  it('should successfully add cattle when valid details are provided', async () => {
    const cattleData: Omit<Cattle, 'id'> = {
      tagNumber: 'BVX-101',
      name: 'Daisy',
      breed: 'Holstein-Friesian',
      ageYears: 4,
      ageMonths: 2,
      gender: 'female',
      status: 'lactating',
      dailyMilkYieldLiters: 24.5,
      healthStatus: 'healthy',
      medicalHistory: 'None',
      calvesDelivered: 2,
    };

    const expectedResult: Cattle = { ...cattleData, id: 'cow_123' };
    mockCattleRepository.addCattle.mockResolvedValue(expectedResult);

    const result = await useCase.execute(cattleData);

    expect(mockCattleRepository.addCattle).toHaveBeenCalledWith(cattleData);
    expect(result).toEqual(expectedResult);
  });

  it('should throw an error if tag number is empty', async () => {
    const cattleData: Omit<Cattle, 'id'> = {
      tagNumber: '   ',
      name: 'Daisy',
      breed: 'Jersey',
      ageYears: 3,
      ageMonths: 0,
      gender: 'female',
      status: 'lactating',
      dailyMilkYieldLiters: 18,
      healthStatus: 'healthy',
      medicalHistory: '',
      calvesDelivered: 1,
    };

    await expect(useCase.execute(cattleData)).rejects.toThrow('Tag Number is required.');
    expect(mockCattleRepository.addCattle).not.toHaveBeenCalled();
  });

  it('should throw an error if cow name is empty', async () => {
    const cattleData: Omit<Cattle, 'id'> = {
      tagNumber: 'BVX-102',
      name: '',
      breed: 'Jersey',
      ageYears: 3,
      ageMonths: 0,
      gender: 'female',
      status: 'lactating',
      dailyMilkYieldLiters: 18,
      healthStatus: 'healthy',
      medicalHistory: '',
      calvesDelivered: 1,
    };

    await expect(useCase.execute(cattleData)).rejects.toThrow('Cattle Name is required.');
  });

  it('should throw an error if age is negative', async () => {
    const cattleData: Omit<Cattle, 'id'> = {
      tagNumber: 'BVX-103',
      name: 'Bella',
      breed: 'Ayrshire',
      ageYears: -1,
      ageMonths: 4,
      gender: 'female',
      status: 'dry',
      dailyMilkYieldLiters: 0,
      healthStatus: 'healthy',
      medicalHistory: '',
      calvesDelivered: 0,
    };

    await expect(useCase.execute(cattleData)).rejects.toThrow('Age cannot be negative.');
  });

  it('should throw an error if calves delivered is negative', async () => {
    const cattleData: Omit<Cattle, 'id'> = {
      tagNumber: 'BVX-104',
      name: 'Rosie',
      breed: 'Ayrshire',
      ageYears: 2,
      ageMonths: 0,
      gender: 'female',
      status: 'calf',
      dailyMilkYieldLiters: 0,
      healthStatus: 'healthy',
      medicalHistory: '',
      calvesDelivered: -2,
    };

    await expect(useCase.execute(cattleData)).rejects.toThrow('Number of calves delivered cannot be negative.');
  });
});
