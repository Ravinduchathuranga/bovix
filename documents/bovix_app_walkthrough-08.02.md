# Bovix - Dairy Cattle Management App Walkthrough

## Overview
**Bovix** is a React Native app built using Expo SDK 57 and structured strictly adhering to **Clean Architecture** principles with Firebase Firestore persistence.

---

## Clean Architecture Directory Structure
```
Bovix/
├── src/
│   ├── domain/                  # Enterprise Business Rules & Core Data Logic
│   │   ├── entities/
│   │   │   └── cattle.ts        # User, Cattle, Bulk Milk, and Receipt models
│   │   ├── repositories/
│   │   │   ├── AuthRepository.ts
│   │   │   ├── CattleRepository.ts   # Defines cattle CRUD & metrics
│   │   │   ├── MilkingRepository.ts
│   │   │   └── ReceiptRepository.ts
│   │   └── usecases/
│   │       ├── LoginUseCase.ts
│   │       ├── GetDashboardDataUseCase.ts
│   │       ├── AddCattleUseCase.ts
│   │       ├── DeleteCattleUseCase.ts
│   │       ├── MilkingUseCases.ts
│   │       └── ReceiptUseCases.ts
│   ├── data/                    # Data Access & Concrete Implementations
│   │   └── repositories/
│   │       ├── FirebaseAuthRepository.ts
│   │       ├── FirestoreCattleRepository.ts
│   │       ├── FirestoreMilkingRepository.ts
│   │       └── FirestoreReceiptRepository.ts
│   ├── di/                      # Dependency Injection Container
│   │   └── container.ts          # Dependency bindings
│   └── presentation/            # User Interface & View Models
│       ├── components/
│       │   ├── BottomTabs.tsx          # 3-Tab Streamlined Navigation (Dashboard, Daily Logs, Settings)
│       │   ├── AppDatePicker.tsx       # Cross-platform date selector
│       │   ├── DateTabBar.tsx          # Interactive horizontal scrollable date tab bar
│       │   └── CattleDetailsModal.tsx  # Interactive cattle profile view
│       ├── context/
│       │   └── AuthContext.tsx        # Authentication Context
│       └── screens/
│           ├── LoginScreen.tsx          # Sign-in UI
│           ├── DashboardScreen.tsx      # Farm Metrics & Cattle list
│           ├── AddCattleScreen.tsx      # Add Cattle form
│           ├── DailyMilkingScreen.tsx   # Consolidated Screen: Interactive Date Bar, Local Milk Logs & Compare Slips
│           └── SettingsScreen.tsx       # App preferences
├── App.tsx                      # Root Entry Component
├── tsconfig.json                # TypeScript Configuration
└── package.json
```

---

## Streamlined Architecture & Navigation

1. **Unified Daily Logs Screen (`DailyMilkingScreen.tsx`)**:
   - Houses both **Local Milk Collection Logs** (Morning/Evening yields) and **Company Paper Compare Slips** (Scale reconciliation, tested fat %, payouts RS) under a single interactive date bar.
   - Eliminates navigation friction by bringing scale comparison and yield logs into one view.

2. **Streamlined 3-Tab Navigation Bar (`BottomTabs.tsx`)**:
   - **📊 Dashboard**: High-level farm metrics & livestock management.
   - **🥛 Daily Logs**: Synchronized daily milk yields, paper compare slips, & date tab bar.
   - **⚙️ Settings**: Account and app configurations.

---

## Validation Status

- **Type Check**: `npx tsc --noEmit` executed with **0 errors**.
