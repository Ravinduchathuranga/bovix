import { CattleRepository } from '../repositories/CattleRepository';
import { Cattle } from '../entities/cattle';

export class AddCattleUseCase {
  constructor(private cattleRepository: CattleRepository) {}

  async execute(cattleData: Omit<Cattle, 'id'>): Promise<Cattle> {
    if (!cattleData.tagNumber.trim()) {
      throw new Error('Tag Number is required.');
    }
    if (!cattleData.name.trim()) {
      throw new Error('Cattle Name is required.');
    }
    return await this.cattleRepository.addCattle(cattleData);
  }
}
