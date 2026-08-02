import { DeleteCattleUseCase } from '../DeleteCattleUseCase';
import { CattleRepository } from '../../repositories/CattleRepository';

describe('DeleteCattleUseCase', () => {
  let mockCattleRepository: jest.Mocked<CattleRepository>;
  let useCase: DeleteCattleUseCase;

  beforeEach(() => {
    mockCattleRepository = {
      getAllCattle: jest.fn(),
      getCattleById: jest.fn(),
      addCattle: jest.fn(),
      updateCattle: jest.fn(),
      deleteCattle: jest.fn(),
      getDashboardMetrics: jest.fn(),
    };
    useCase = new DeleteCattleUseCase(mockCattleRepository);
  });

  it('should successfully invoke deleteCattle on repository', async () => {
    mockCattleRepository.deleteCattle.mockResolvedValue();

    await useCase.execute('cow_101');

    expect(mockCattleRepository.deleteCattle).toHaveBeenCalledWith('cow_101');
  });

  it('should throw an error if ID is empty', async () => {
    await expect(useCase.execute('')).rejects.toThrow('Cattle ID is required for deletion.');
    expect(mockCattleRepository.deleteCattle).not.toHaveBeenCalled();
  });
});
