import { FirebaseAuthRepository } from '../data/repositories/FirebaseAuthRepository';
import { FirestoreCattleRepository } from '../data/repositories/FirestoreCattleRepository';
import { FirestoreMilkingRepository } from '../data/repositories/FirestoreMilkingRepository';
import { FirestoreReceiptRepository } from '../data/repositories/FirestoreReceiptRepository';
import { FirestoreStockRepository } from '../data/repositories/FirestoreStockRepository';

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
import {
  GetStockItemsUseCase,
  AddStockItemUseCase,
  RefillStockUseCase,
  DeleteStockItemUseCase,
  RecordFeedUsageUseCase,
  GetFeedUsageHistoryUseCase,
} from '../domain/usecases/StockUseCases';

import { NetworkMonitor, CattleCache, SyncQueue, SyncEngine } from '../data/offline';
import { OfflineFirstCattleRepository } from '../data/repositories/OfflineFirstCattleRepository';

// Singletons / Repositories
const authRepository = new FirebaseAuthRepository();
const firestoreCattleRepository = new FirestoreCattleRepository();
const networkMonitor = new NetworkMonitor();
const cattleCache = new CattleCache();
const syncQueue = new SyncQueue();
const syncEngine = new SyncEngine(syncQueue, cattleCache, firestoreCattleRepository, networkMonitor);
const cattleRepository = new OfflineFirstCattleRepository(
  firestoreCattleRepository,
  cattleCache,
  syncQueue,
  networkMonitor
);
const milkingRepository = new FirestoreMilkingRepository();
const receiptRepository = new FirestoreReceiptRepository(milkingRepository);
const stockRepository = new FirestoreStockRepository();

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

export const getStockItemsUseCase = new GetStockItemsUseCase(stockRepository);
export const addStockItemUseCase = new AddStockItemUseCase(stockRepository);
export const refillStockUseCase = new RefillStockUseCase(stockRepository);
export const deleteStockItemUseCase = new DeleteStockItemUseCase(stockRepository);
export const recordFeedUsageUseCase = new RecordFeedUsageUseCase(stockRepository);
export const getFeedUsageHistoryUseCase = new GetFeedUsageHistoryUseCase(stockRepository);

export { authRepository, cattleRepository, milkingRepository, receiptRepository, stockRepository };
