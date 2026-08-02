import { Cattle, DashboardMetrics } from '../entities/cattle';

export interface CattleRepository {
  getAllCattle(): Promise<Cattle[]>;
  getCattleById(id: string): Promise<Cattle | null>;
  addCattle(cattle: Omit<Cattle, 'id'>): Promise<Cattle>;
  updateCattle(cattle: Cattle): Promise<Cattle>;
  deleteCattle(id: string): Promise<void>;
  getDashboardMetrics(): Promise<DashboardMetrics>;
}
