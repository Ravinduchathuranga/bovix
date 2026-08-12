# Bovix — Product Specification

**Version:** 1.0.0  
**Platform:** iOS · Android (Expo SDK 57, React Native 0.86)  
**Bundle ID:** `com.bovix.app`  
**EAS Project ID:** `e4d0da5a-6d22-447b-843f-3df06c31fb60`  
**Status:** Active Development  
**Last Updated:** 2026-08-10

---

## 1. Product Overview

### 1.1 Purpose

**Bovix** is a mobile-first dairy farm management application designed for small-to-medium dairy operations. It digitises the day-to-day record-keeping that most farms still manage on paper: cattle profiles, morning/evening milk collection logs, company scale receipts, and feed stock levels. The app works reliably regardless of connectivity by implementing an offline-first synchronisation layer backed by Firebase Firestore.

### 1.2 Vision Statement

> "Give every dairy farmer — regardless of technical background or internet reliability — a single, reliable source of truth for their herd and production data."

### 1.3 Problem Statement

Small dairy farms in regions with intermittent connectivity face three recurring challenges:

| # | Problem | Impact |
|---|---------|--------|
| 1 | Paper logbooks are lost, damaged, or inconsistent | Data gaps, disputes with milk buyers |
| 2 | No easy way to reconcile farm-logged yields against company scale receipts | Revenue leakage, undetected measurement errors |
| 3 | Feed stock levels tracked mentally or on whiteboards | Over/under-purchasing, waste |

Bovix solves all three in a single, cohesive mobile application.

---

## 2. Target Users

### 2.1 Primary User

**The Farmer / Farm Owner**
- Operates a herd of 5–50 dairy cattle
- May have limited smartphone experience
- Is in the field, often with poor or no internet access
- Logs morning and evening milking sessions daily
- Monitors individual cattle health and status

### 2.2 Secondary Users

| Role | Description |
|------|-------------|
| **Veterinarian** | Reviews individual cattle health, medical history, and status flags |
| **Farm Manager** | Oversees stock levels, production trends, and payout reconciliation across multiple sessions |

### 2.3 User Roles (System)

```
'farmer' | 'veterinarian' | 'manager'
```

Authentication is handled via Firebase Auth (email/password + Google OAuth via Expo AuthSession).

---

## 3. Core Feature Modules

### 3.1 Cattle Management

The foundational module for managing the herd.

#### 3.1.1 Add Cattle (`AddCattleScreen`)

Users can register new animals with the following profile:

| Field | Type | Required |
|-------|------|----------|
| Tag Number | String | ✅ |
| Name | String | ✅ |
| Breed | String | ✅ |
| Age (Years + Months) | Number | ✅ |
| Gender | `female` / `male` | ✅ |
| Status | `lactating` / `dry` / `pregnant` / `calf` / `sick` | ✅ |
| Daily Milk Yield (L) | Number | optional |
| Health Status | `healthy` / `needs_attention` / `under_treatment` | ✅ |
| Medical History | Text | optional |
| Calves Delivered | Number | optional |
| Photo(s) | Image URI(s) via `expo-image-picker` | optional |

#### 3.1.2 Cattle List (`CattleScreen`)

- Displays all registered cattle with status badges
- Filter/sort by status, health, breed
- Tap to open the Cattle Profile Modal

#### 3.1.3 Cattle Profile (`CattleProfileScreen` + `CattleDetailsModal`)

- Full read view of all cattle attributes
- Inline edit capability
- Displays last milking time
- Health status indicator with colour-coding (green / amber / red)

#### 3.1.4 Cattle CRUD Use Cases

| Use Case | Description |
|----------|-------------|
| `AddCattleUseCase` | Creates and persists a new cattle record |
| `GetAllCattleUseCase` | Returns all cattle for the authenticated farm |
| `DeleteCattleUseCase` | Soft-deletes a cattle record |
| `GetDashboardDataUseCase` | Aggregates herd metrics for the dashboard |

---

### 3.2 Milk Production Module

Handles all logging and analysis of milk yields.

#### 3.2.1 Daily Milking Screen (`DailyMilkingScreen`)

A consolidated screen with an interactive horizontal **date tab bar** (`DateTabBar`) that lets users scroll through dates and review or enter records for any given day.

**Sub-sections on this screen:**

1. **Bulk Milk Log** — records morning/evening collective yields for the whole herd
2. **Company Receipt Compare Slips** — records what the dairy buyer measured on their scale

#### 3.2.2 Bulk Milk Record (`BulkMilkRecord`)

| Field | Type | Notes |
|-------|------|-------|
| Date | `YYYY-MM-DD` | Required |
| Session | `Morning` / `Evening` | Required |
| Amount (KG) | Number | Required, must be positive |
| Fat % | Number | Optional, 0–100% |
| Notes | String | Optional |

**Use Cases:** `RecordBulkMilkUseCase`, `GetMilkRecordsUseCase`, `DeleteMilkRecordUseCase`

#### 3.2.3 Company Receipt Reconciliation (`CompanyReceiptRecord`)

| Field | Type | Notes |
|-------|------|-------|
| Date | `YYYY-MM-DD` | Required |
| Receipt Number | String | Required, unique identifier |
| Company Name | String | Defaults to `"Dairy Buyer Inc."` |
| Company Scale (KG) | Number | Required |
| Company Fat % | Number | Optional |
| Price per KG (RS) | Number | Optional |
| Total Payout (RS) | Number | Auto-calculated: `companyScaleKg × pricePerKg` |
| Notes | String | Optional |

**Use Cases:** `AddCompanyReceiptUseCase`, `GetReconciliationUseCase`, `DeleteReceiptUseCase`

#### 3.2.4 Milk Reconciliation (`MilkReconciliationComparison`)

Automatically computed each time data is fetched:

| Metric | Formula |
|--------|---------|
| Difference (KG) | `companyScaleKg − farmLoggedKg` |
| Variance % | `(differenceKg / farmLoggedKg) × 100` |
| Status | `match` < 2% · `minor_discrepancy` 2–5% · `discrepancy` > 5% |

Visual indicators: 🟢 match · 🟡 minor discrepancy · 🔴 discrepancy

---

### 3.3 Feed Stock Management

Tracks all farm feed inventory and usage.

#### 3.3.1 Feed Stock Item (`FeedStockItem`)

| Field | Type | Notes |
|-------|------|-------|
| Name | String | e.g., "Napier Grass Silage", "Dairy Concentrate 18%" |
| Category | `Forage` / `Concentrate` / `Supplement` / `Silage` / `Other` | Required |
| Current Stock (KG) | Number | Running balance |
| Unit | `KG` / `Bags` / `Tons` / `Units` | Display unit |
| Min Threshold (KG) | Number | Triggers low-stock alert |
| Cost per Unit (RS) | Number | Optional |
| Supplier Name | String | Optional |
| Notes | String | Optional |

#### 3.3.2 Feed Usage Record (`FeedUsageRecord`)

| Field | Type | Notes |
|-------|------|-------|
| Feed Stock ID | String | Links to parent `FeedStockItem` |
| Date | `YYYY-MM-DD` | Required |
| Amount Used (KG) | Number | Deducted from current stock atomically |
| Session | `Morning` / `Evening` / `Full Day` | Optional |
| Notes | String | Optional |

#### 3.3.3 Feed Stock Use Cases

| Use Case | Behaviour |
|----------|-----------|
| `GetStockItemsUseCase` | Returns all inventory items |
| `AddStockItemUseCase` | Validates and persists new item |
| `RefillStockUseCase` | Adds replenishment quantity to current stock |
| `DeleteStockItemUseCase` | Removes a feed item and its history |
| `RecordFeedUsageUseCase` | Deducts from stock and writes a usage log atomically |
| `GetFeedUsageHistoryUseCase` | Returns full consumption timeline |

---

### 3.4 Dashboard

The **Dashboard Screen** (`DashboardScreen`) provides a high-level operational overview:

| Metric | Source |
|--------|--------|
| Total Cattle Count | `GetDashboardDataUseCase` |
| Lactating Count | Filtered from cattle list |
| Today's Total Milk Yield (KG) | Sum of today's `BulkMilkRecord` entries |
| Cattle Needing Attention | Count with `healthStatus ≠ 'healthy'` |
| Avg Yield per Cow | `todayMilkYieldTotal / lactatingCount` |

---

### 3.5 Authentication

- **Provider:** Firebase Authentication
- **Methods:** Email/Password, Google OAuth (via `expo-auth-session` + `expo-web-browser`)
- **Session Management:** `AuthContext` wraps the app; unauthenticated users are redirected to `LoginScreen`
- **Firestore Access:** All collections are protected by `request.auth != null` rules

---

### 3.6 Settings

The **Settings Screen** (`SettingsScreen`) includes:

- User profile management (name, farm name)
- Logout
- App preferences (future expansion)

---

## 4. Navigation Architecture

```
App.tsx
└── AuthProvider
    ├── [Unauthenticated] → LoginScreen
    └── [Authenticated]
        ├── BottomTabs (Production | Stock)
        │   ├── CattleProductionScreen [sub-tabs]
        │   │   ├── Dashboard (DashboardScreen)
        │   │   ├── Cattle  (CattleScreen)
        │   │   └── Daily Logs (DailyMilkingScreen)
        │   └── StockManagementScreen
        ├── [Full-screen overlay] AddCattleScreen
        ├── [Full-screen overlay] SettingsScreen
        └── DrawerMenu (side navigation)
```

**Transition animations** are handled by `ScreenTransition`, which wraps each screen with a fade/slide animation.

---

## 5. Offline-First Architecture

Bovix is designed to work fully offline. Connectivity is monitored via `@react-native-community/netinfo` through the `NetworkMonitor` module.

### 5.1 Layer Diagram

```
Presentation Layer
       ↓
Use Cases (domain)
       ↓
OfflineFirst*Repository  ← Decorator Pattern
    ↙           ↘
AsyncStorage     Firestore*Repository
 (local cache)   (remote source of truth)
```

### 5.2 Offline Modules per Domain

| Module | Cache | Sync Queue | Sync Engine |
|--------|-------|------------|-------------|
| Cattle | `CattleCache` | `SyncQueue` | `SyncEngine` |
| Milking | `MilkingCache` | `MilkingSyncQueue` | `MilkingSyncEngine` |
| Stock | `StockItemCache` + `StockUsageCache` | `StockSyncQueue` | `StockSyncEngine` |

### 5.3 Synchronisation Strategy

- **Write path (offline):** Operation is written to `AsyncStorage` immediately; a sync-queue entry is created.
- **Sync on reconnect:** `NetworkMonitor` triggers the sync engine, which replays the queue against Firestore in order.
- **Conflict resolution:** Last-Write-Wins (LWW) using `updatedAt` timestamps.
- **Idempotency:** Each queued operation carries a stable ID to prevent duplicate writes on retry.
- **Cross-entity atomicity:** Feed usage deductions and stock updates are correlated in a single queue entry.

---

## 6. Data Model (Firestore Collections)

| Collection | Document Key | Description |
|------------|-------------|-------------|
| `cattle` | `{cattleId}` | Individual cattle records |
| `milking_records` | `{recordId}` | Bulk milk session logs |
| `company_receipts` | `{receiptId}` | Dairy buyer scale receipts |
| `farm_stock` | `{stockId}` | Feed inventory items |
| `stock_usage` | `{usageId}` | Feed consumption history |

All documents are scoped to a single authenticated user namespace (future: multi-tenant with `ownerId` field).

---

## 7. Security

### 7.1 Firestore Rules

Production rules (`firestore.rules`) enforce:

```
allow read, write: if request.auth != null;
```

Applied to: `cattle`, `milking_records`, `company_receipts`, `farm_stock`, `stock_usage`.

All other paths: `allow read, write: if false`.

### 7.2 Future Enhancements

- Owner-based access control (`ownerId` field) for multi-farm/multi-user support
- Read-only role for veterinarians
- Rate limiting via Firebase App Check

### 7.3 Encryption

- iOS: `ITSAppUsesNonExemptEncryption: false` (no custom crypto)
- Data in transit: HTTPS (Firebase SDK enforced)
- Data at rest (local): AsyncStorage — unencrypted (future: SecureStore for sensitive fields)

---

## 8. Non-Functional Requirements

### 8.1 Performance

| Metric | Target |
|--------|--------|
| App cold start | < 3 seconds on mid-range device |
| Screen transition | < 200 ms (ScreenTransition animation) |
| Firestore read latency | < 500 ms on 4G |
| Offline read (AsyncStorage) | < 50 ms |

### 8.2 Offline Availability

- **All read operations** must succeed offline using cached data.
- **All write operations** must queue and sync without user intervention.
- Sync queue must survive app restarts (AsyncStorage persistence).

### 8.3 Reliability

- Sync engine must retry failed operations with exponential back-off.
- Duplicate writes must be prevented via idempotency keys.
- No data loss on app crash mid-sync.

### 8.4 Scalability

- Designed for herds of 5–200 cattle.
- Firestore pagination should be implemented if herd size exceeds 100.

### 8.5 Device Support

| Platform | Minimum Version |
|----------|----------------|
| iOS | iOS 13+ |
| Android | Android 8.0 (API 26+) |
| Tablet | Supported (portrait + landscape via `supportsTablet: true`) |

---

## 9. Technology Stack

| Layer | Technology |
|-------|-----------|
| Runtime | React Native 0.86 / Expo SDK 57 |
| Language | TypeScript ~6.0 |
| State / Auth | React Context API + Firebase Auth |
| Remote DB | Firebase Firestore (v12) |
| Local Cache | AsyncStorage 2.2 |
| Offline Sync | Custom SyncEngine / SyncQueue |
| Navigation | Custom state-machine (App.tsx) |
| UI Icons | `lucide-react-native` + `@expo/vector-icons` |
| Date Picker | `@react-native-community/datetimepicker` |
| Image Picker | `expo-image-picker` |
| Network Monitor | `@react-native-community/netinfo` |
| Build / Deploy | EAS Build + EAS Update (OTA) |
| Testing | Jest 29 + ts-jest |
| CI | GitHub Actions (`.github/`) |
| Infrastructure | Docker (`infra/docker-compose.yaml`) |

---

## 10. Infrastructure & DevOps

### 10.1 Environments

| Environment | Firebase Project | Firestore Rules File |
|-------------|-----------------|----------------------|
| Production | `bovix-prod` | `firestore.rules` |
| Test | `bovix-test` | `firestore.test.rules` |
| Backup | `bovix-backup` | `firestore.backup.rules` |

### 10.2 Database Scripts

| Script | Command |
|--------|---------|
| Backup Firestore | `npm run db:backup` |
| Backup to JSON | `npm run db:backup:json` |
| Restore from backup | `npm run db:restore` |
| Seed test DB | `npm run db:seed-test` |
| Deploy prod rules | `npm run db:deploy-rules:prod` |

### 10.3 OTA Updates

- Managed via `expo-updates` with `runtimeVersion.policy: "appVersion"`
- Update URL: `https://u.expo.dev/e4d0da5a-6d22-447b-843f-3df06c31fb60`

---

## 11. Testing Strategy

| Layer | Framework | Coverage |
|-------|-----------|---------|
| Domain Use Cases | Jest + ts-jest | Unit — business logic validation |
| Repository Layer | Jest (mocked Firestore) | Integration |
| Offline/Sync Engine | Jest | Unit — cache, queue, LWW |
| UI Components | Jest / TestSprite | Component render + interaction |
| End-to-End | TestSprite | Full user flows |

Test files are co-located under `__tests__/` directories within each layer.

---

## 12. Known Limitations & Future Roadmap

### 12.1 Current Limitations

| Area | Limitation |
|------|-----------|
| Multi-tenancy | All data is per authenticated user; no farm-sharing |
| AsyncStorage | Not encrypted at rest |
| Cattle photos | Stored as URI; not yet synced to Firebase Storage |
| Analytics | No trend charts or export functionality yet |

### 12.2 Planned Enhancements

- [ ] Per-cattle individual milking logs (currently bulk only)
- [ ] Monthly/weekly production trend charts
- [ ] CSV/PDF export of milking logs and receipts
- [ ] Push notifications for low stock alerts
- [ ] Multi-user farm access with role-based permissions
- [ ] Firebase Storage integration for cattle photos
- [ ] Veterinarian portal (read-only web view)
- [ ] Integration with national cattle registration systems

---

## 13. Glossary

| Term | Definition |
|------|-----------|
| **Bulk Milk Record** | A single morning or evening session yield for the whole herd |
| **Company Receipt** | Official weight measurement from the dairy buyer's scale |
| **Reconciliation** | Comparison of farm-logged vs. company-measured milk quantities |
| **Feed Stock Item** | An inventory record for a particular type of cattle feed |
| **Feed Usage Record** | A consumption entry that deducts from the stock balance |
| **Sync Queue** | Persistent list of write operations awaiting network connectivity |
| **LWW** | Last-Write-Wins — conflict resolution strategy based on `updatedAt` timestamp |
| **EAS** | Expo Application Services — cloud build and OTA update platform |
| **Lactating** | A cow actively producing milk |
| **Dry** | A cow temporarily not producing milk (between lactation cycles) |
