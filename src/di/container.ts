import { MockAuthRepository } from '../data/repositories/MockAuthRepository';
import { MockCattleRepository } from '../data/repositories/MockCattleRepository';
import { MockMilkingRepository } from '../data/repositories/MockMilkingRepository';
import { LoginUseCase } from '../domain/usecases/LoginUseCase';
import { GetDashboardDataUseCase } from '../domain/usecases/GetDashboardDataUseCase';
import { AddCattleUseCase } from '../domain/usecases/AddCattleUseCase';
import {
  RecordBulkMilkUseCase,
  GetMilkRecordsUseCase,
  DeleteMilkRecordUseCase,
} from '../domain/usecases/MilkingUseCases';

// Singletons / Dependencies
const authRepository = new MockAuthRepository();
const cattleRepository = new MockCattleRepository();
const milkingRepository = new MockMilkingRepository();

export const loginUseCase = new LoginUseCase(authRepository);
export const getDashboardDataUseCase = new GetDashboardDataUseCase(cattleRepository);
export const addCattleUseCase = new AddCattleUseCase(cattleRepository);
export const recordBulkMilkUseCase = new RecordBulkMilkUseCase(milkingRepository);
export const getMilkRecordsUseCase = new GetMilkRecordsUseCase(milkingRepository);
export const deleteMilkRecordUseCase = new DeleteMilkRecordUseCase(milkingRepository);

export { authRepository, cattleRepository, milkingRepository };
