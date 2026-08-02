import { Cattle } from '../entities/cattle';
import { CattleRepository } from '../repositories/CattleRepository';

export class GetAllCattleUseCase {
  constructor(private cattleRepository: CattleRepository) {}

  async execute(): Promise<Cattle[]> {
    return this.cattleRepository.getAllCattle();
  }
}
