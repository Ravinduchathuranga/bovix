import { FirebaseAuthRepository } from '../data/repositories/FirebaseAuthRepository';
import { MockAuthRepository } from '../data/repositories/MockAuthRepository';
import { MockCattleRepository } from '../data/repositories/MockCattleRepository';
import { MockMilkingRepository } from '../data/repositories/MockMilkingRepository';
import { MockReceiptRepository } from '../data/repositories/MockReceiptRepository';
import { LoginUseCase } from '../domain/usecases/LoginUseCase';
import { GoogleLoginUseCase, SignUpUseCase } from '../domain/usecases/AuthUseCases';
import { GetDashboardDataUseCase } from '../domain/usecases/GetDashboardDataUseCase';
import { AddCattleUseCase } from '../domain/usecases/AddCattleUseCase';
import {
  RecordBulkMilkUseCase,
  GetMilkRecordsUseCase,
  DeleteMilkRecordUseCase,
} from '../domain/usecases/MilkingUseCases';
import {
  AddCompanyReceiptUseCase,
  GetReconciliationUseCase,
  DeleteReceiptUseCase,
} from '../domain/usecases/ReceiptUseCases';

// Determine repository instance (FirebaseAuthRepository by default, or fallback if needed)
const USE_FIREBASE = true;

const authRepository = USE_FIREBASE
  ? new FirebaseAuthRepository()
  : new MockAuthRepository();

const cattleRepository = new MockCattleRepository();
const milkingRepository = new MockMilkingRepository();
const receiptRepository = new MockReceiptRepository(milkingRepository);

export const loginUseCase = new LoginUseCase(authRepository);
export const googleLoginUseCase = new GoogleLoginUseCase(authRepository);
export const signUpUseCase = new SignUpUseCase(authRepository);

export const getDashboardDataUseCase = new GetDashboardDataUseCase(cattleRepository);
export const addCattleUseCase = new AddCattleUseCase(cattleRepository);

export const recordBulkMilkUseCase = new RecordBulkMilkUseCase(milkingRepository);
export const getMilkRecordsUseCase = new GetMilkRecordsUseCase(milkingRepository);
export const deleteMilkRecordUseCase = new DeleteMilkRecordUseCase(milkingRepository);

export const addCompanyReceiptUseCase = new AddCompanyReceiptUseCase(receiptRepository);
export const getReconciliationUseCase = new GetReconciliationUseCase(receiptRepository);
export const deleteReceiptUseCase = new DeleteReceiptUseCase(receiptRepository);

export { authRepository, cattleRepository, milkingRepository, receiptRepository };
