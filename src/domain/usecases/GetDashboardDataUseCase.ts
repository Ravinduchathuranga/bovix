import { Cattle, DashboardMetrics } from '../entities/cattle';
import { CattleRepository } from '../repositories/CattleRepository';

export class GetDashboardDataUseCase {
  constructor(private cattleRepository: CattleRepository) {}

  async execute(): Promise<{ metrics: DashboardMetrics; recentCattle: Cattle[] }> {
    const metrics = await this.cattleRepository.getDashboardMetrics();
    const allCattle = await this.cattleRepository.getAllCattle();
    return {
      metrics,
      recentCattle: allCattle.slice(0, 5),
    };
  }
}
