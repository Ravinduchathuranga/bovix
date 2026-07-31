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
    if (cattleData.ageYears < 0 || cattleData.ageMonths < 0) {
      throw new Error('Age cannot be negative.');
    }
    if (cattleData.calvesDelivered < 0) {
      throw new Error('Number of calves delivered cannot be negative.');
    }
    return await this.cattleRepository.addCattle(cattleData);
  }
}
