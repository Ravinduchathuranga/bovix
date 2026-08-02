import { CattleRepository } from '../repositories/CattleRepository';

export class DeleteCattleUseCase {
  constructor(private cattleRepository: CattleRepository) {}

  async execute(id: string): Promise<void> {
    if (!id || !id.trim()) {
      throw new Error('Cattle ID is required for deletion.');
    }
    await this.cattleRepository.deleteCattle(id.trim());
  }
}
