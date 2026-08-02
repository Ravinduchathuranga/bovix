import { FirebaseAuthRepository } from '../data/repositories/FirebaseAuthRepository';
import { FirestoreCattleRepository } from '../data/repositories/FirestoreCattleRepository';
import { FirestoreMilkingRepository } from '../data/repositories/FirestoreMilkingRepository';
import { FirestoreReceiptRepository } from '../data/repositories/FirestoreReceiptRepository';
import { LoginUseCase } from '../domain/usecases/LoginUseCase';
import { GoogleLoginUseCase, SignUpUseCase } from '../domain/usecases/AuthUseCases';
import { GetDashboardDataUseCase } from '../domain/usecases/GetDashboardDataUseCase';
import { AddCattleUseCase } from '../domain/usecases/AddCattleUseCase';
import { DeleteCattleUseCase } from '../domain/usecases/DeleteCattleUseCase';
import { GetAllCattleUseCase } from '../domain/usecases/GetAllCattleUseCase';
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

// Singletons / Repositories
const authRepository = new FirebaseAuthRepository();
const cattleRepository = new FirestoreCattleRepository();
const milkingRepository = new FirestoreMilkingRepository();
const receiptRepository = new FirestoreReceiptRepository(milkingRepository);

export const loginUseCase = new LoginUseCase(authRepository);
export const googleLoginUseCase = new GoogleLoginUseCase(authRepository);
export const signUpUseCase = new SignUpUseCase(authRepository);

export const getDashboardDataUseCase = new GetDashboardDataUseCase(cattleRepository);
export const getAllCattleUseCase = new GetAllCattleUseCase(cattleRepository);
export const addCattleUseCase = new AddCattleUseCase(cattleRepository);
export const deleteCattleUseCase = new DeleteCattleUseCase(cattleRepository);

export const recordBulkMilkUseCase = new RecordBulkMilkUseCase(milkingRepository);
export const getMilkRecordsUseCase = new GetMilkRecordsUseCase(milkingRepository);
export const deleteMilkRecordUseCase = new DeleteMilkRecordUseCase(milkingRepository);

export const addCompanyReceiptUseCase = new AddCompanyReceiptUseCase(receiptRepository);
export const getReconciliationUseCase = new GetReconciliationUseCase(receiptRepository);
export const deleteReceiptUseCase = new DeleteReceiptUseCase(receiptRepository);

export { authRepository, cattleRepository, milkingRepository, receiptRepository };
