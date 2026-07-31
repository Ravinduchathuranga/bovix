# Bovix - Dairy Cattle Management App Walkthrough

## Overview
**Bovix** is a React Native app built using Expo SDK 57 and structured strictly adhering to **Clean Architecture** principles.

---

## Clean Architecture Directory Structure
```
Bovix/
├── src/
│   ├── domain/                  # Enterprise Business Rules & Core Data Logic
│   │   ├── entities/
│   │   │   └── cattle.ts        # User, Cattle, Dashboard metrics, and Bulk Milk Record models
│   │   ├── repositories/
│   │   │   ├── AuthRepository.ts
│   │   │   ├── CattleRepository.ts
│   │   │   └── MilkingRepository.ts
│   │   └── usecases/
│   │       ├── LoginUseCase.ts
│   │       ├── GetDashboardDataUseCase.ts
│   │       ├── AddCattleUseCase.ts
│   │       └── MilkingUseCases.ts # RecordBulkMilkUseCase, GetMilkRecordsUseCase, DeleteMilkRecordUseCase
│   ├── data/                    # Data Access & Concrete Implementations
│   │   └── repositories/
│   │       ├── MockAuthRepository.ts
│   │       ├── MockCattleRepository.ts
│   │       └── MockMilkingRepository.ts
│   ├── di/                      # Dependency Injection Container
│   │   └── container.ts
│   └── presentation/            # User Interface & View Models
│       ├── components/
│       │   └── BottomTabs.tsx    # 3-Tab Navigation Bar (Dashboard, Milking, Settings)
│       ├── context/
│       │   └── AuthContext.tsx  # Authentication State Management Context
│       └── screens/
│           ├── LoginScreen.tsx        # Sign-in UI
│           ├── DashboardScreen.tsx    # Farm Metrics & Cattle overview
│           ├── DailyMilkingScreen.tsx # Bulk Milk Collection log (KG)
│           └── SettingsScreen.tsx     # App preferences
├── App.tsx                      # Root Entry Component & Navigation Host
├── tsconfig.json                # TypeScript Configuration
└── package.json
```

---

## Recent Feature Refactoring: Bulk Milk Collection

1. **Entities & Use Cases**:
   - Replaced individual cow milking entries with `BulkMilkRecord` (Date, Session: Morning/Evening, Amount in **KG**, Fat %, Notes).
   - Created `RecordBulkMilkUseCase`, `GetMilkRecordsUseCase`, and `DeleteMilkRecordUseCase`.

2. **Bulk Milking Log UI (`DailyMilkingScreen.tsx`)**:
   - **Summary Indicators**: Today's Total Collection (KG) and All-Time Logged Production (KG).
   - **Interactive Modal**: Input Date, select Session (🌅 Morning / 🌆 Evening), record Weight in **KG**, Fat content %, and optional tank notes.
   - **Collection Log History**: Chronological collection list with quick delete action.

---

## Validation Status

- **Type Check**: `tsc --noEmit` executed with **0 errors**.
- **Build / Bundle Test**: `npx expo export --platform web` succeeded with **0 errors (bundled 224 modules)**.
