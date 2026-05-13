# StockPRO - Industrial Inventory Ecosystem & Distributed Ledger

![StockPRO Banner](https://img.shields.io/badge/StockPRO-Operational%20Zen-0A0A0A?style=for-the-badge&logoScale=1.2)
![Angular](https://img.shields.io/badge/Angular%2017-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![.NET 8](https://img.shields.io/badge/.NET%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

StockPRO is a mission-critical, distributed inventory management platform engineered for high-concurrency industrial environments. Built on a **Microservices Mesh Architecture**, it ensures absolute data integrity through an immutable movement ledger, atomic stock orchestration, and a forensic-grade audit system.

---

## 🏗️ System Architecture: Distributed Microservices Mesh

StockPRO is designed as a collection of autonomous services, each responsible for a specific business domain. This decoupling allows for independent scaling, technology flexibility, and high availability.

### 1. Architectural Foundations
- **Database-per-Service**: Each microservice owns its schema. Cross-service data leakage is strictly prohibited at the database level.
- **Service Discovery**: Leverages Docker's internal DNS resolution for seamless service-to-service communication.
- **Shared Secret Authentication**: Internal communications (e.g., Audit Logging) are protected by a shared internal API key, separate from the public JWT system.
- **Bounded Contexts**: Following Domain-Driven Design (DDD), services like `Purchase` and `Warehouse` have clearly defined boundaries.

### 2. Microservice Catalog

| Service | Primary Domain | Responsibility |
| :--- | :--- | :--- |
| **StockPro.Auth** | Identity & Security | Manages JWT issuance, RBAC, and the global Forensic Audit Ledger. |
| **StockPro.ProductItem** | Master Data | The source of truth for the product catalog and technical specifications. |
| **StockPro.WarehouseStock**| Site Inventory | Tracks real-time stock balances and manages warehouse site metadata. |
| **StockPro.StockMovement** | Transactional Logic | The engine that processes all stock movements (GRN, Issue, Transfer). |
| **StockPro.Purchase** | Procurement | Orchestrates the lifecycle of Purchase Orders and Supplier relationships. |
| **StockPro.Alert** | Monitoring | A background monitoring service that triggers threshold alerts. |
| **StockPro.Analytics** | Reporting | Aggregates data for high-density dashboards and daily state snapshots. |

---

## 🛠️ Frontend Technical Specification (Angular 17+)

The StockPRO frontend is a reactive, standalone application designed to minimize cognitive load while maximizing data density through a "Technical Zen" aesthetic.

### 1. Reactive State Orchestration (RxJS)
The application is entirely driven by reactive streams, ensuring the UI is a direct reflection of the underlying state.
- **BehaviorSubject State**: We maintain the "Single Source of Truth" in core services using `BehaviorSubjects`.
- **Advanced Operator Pipeline**:
    - `switchMap`: Cancels obsolete HTTP requests during rapid filtering or navigation.
    - `debounceTime(300)`: Throttles high-frequency inputs (like search) to protect backend services.
    - `distinctUntilChanged`: Ensures redundant updates aren't triggered if state hasn't changed.
    - `shareReplay(1)`: Optimizes data fetching by sharing a single execution among multiple subscribers.

### 2. Security & Identity Lifecycle
- **AuthInterceptor**: Injects the `Authorization: Bearer` header and intercepts `401/403` errors.
- **JWT Decoding**: Decodes payloads locally to extract `UserRole` and `Exp` claims for instant UI adaptation.
- **Route Guards**: Uses `CanActivateFn` and `CanMatchFn` to enforce permissions before routing.

### 3. Dynamic Form Architectures
- **FormArray Integration**: Used for multi-line Purchase Orders, allowing dynamic addition/removal of items with real-time total calculation.
- **Cross-Component Validation**: Custom validators that check stock levels against a shared data stream before allowing a "Stock Out" submission.

---

## 📑 Use Case Specification (UC1 - UC8)

---

### 🔐 UC1: Identity, Authentication & Role-Based Access Control

#### Overview
UC1 is the security foundation of the entire ecosystem. Every other microservice depends on tokens issued by this service. It is built on top of `Microsoft.AspNetCore.Identity` using `ApplicationUser`, a custom extension of `IdentityUser` that adds `FullName`, `IsActive`, `CreatedAt`, and `LastLoginAt` fields.

#### Backend — `StockPro.Auth` Service
- **`AuthController.cs`** manages all public-facing authentication logic:
    - `POST /api/auth/register`: Creates a new user and **hard-locks** their role to `STAFF`. This prevents public self-escalation. If the role does not exist in `AspNetRoles`, it is created on the fly.
    - `POST /api/auth/login`: Validates credentials via `SignInManager.CheckPasswordSignInAsync` with `lockoutOnFailure: true`. Deactivated accounts (`IsActive = false`) are rejected with a `401` before password check. On success, `LastLoginAt` is updated and a JWT is issued.
    - `GET /api/auth/profile`: Extracts `UserId` from `ClaimTypes.NameIdentifier` (falls back to `sub` claim) and returns full profile.
    - `PUT /api/auth/profile`: Self-service update for `FullName` and `PhoneNumber`.
    - `PUT /api/auth/password`: Uses `UserManager.ChangePasswordAsync` with current password verification.
    - `GET /api/auth/users`: Admin-only endpoint returning all users with their roles.

- **`TokenService.cs`** — JWT Issuance Logic:
    - Algorithm: `HmacSha256` with a `SymmetricSecurityKey`.
    - Claims embedded: `sub` (User GUID), `email`, `ClaimTypes.Role`, `fullName`, `jti` (unique token ID).
    - Expiration: **8 hours** from issuance.
    - Settings resolved from `JwtSettings` section in `appsettings.json`.

#### Frontend — Angular Auth Module
- **`AuthService`** (`auth.service.ts`) uses `BehaviorSubject<UserProfile | null>` to broadcast user state globally.
    - Token stored in `localStorage` under key `stockpro_token`.
    - `isTokenExpired()`: Decodes the JWT's Base64 payload locally to read `exp` claim — avoids an API call for session checks.
    - `logout()`: Clears both `stockpro_token` and `stockpro_user` from storage and redirects to `/auth/login`.
- **`AuthInterceptor`**: Reads the token on every outbound request and injects `Authorization: Bearer <token>`.
- **`RoleGuard`**: Reads `userRole` from the `AuthService` stream to allow/deny route activation before component initialization.

#### Role Hierarchy & Permissions
| Role | User Mgmt | Catalog | Warehouse | Movements | Procurement | Alerts | Audit |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| INVENTORY MANAGER | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| STAFF | ❌ | ❌ | 👁️ | ✅ | ✅ | ✅ | ❌ |

---

### 🏗️ UC2: Product Master Data & Technical Catalog

#### Overview
UC2 manages the industrial product catalog — the master data that every other service references by `ProductId`. The `StockPro.ProductItem` service owns this data exclusively.

#### Backend — `StockPro.ProductItem` Service
- **`ProductsController.cs`** provides full CRUD operations:
    - `GET /api/products`: Returns all products, ordered and hydrated.
    - `GET /api/products/{id}`: Returns a single product by GUID. Returns `404` if not found.
    - `GET /api/products/barcode/{code}`: Lookup by barcode string — supports scanning workflows.
    - `GET /api/products/search?q=`: Server-side text search — matches product names and SKUs.
    - `POST /api/products`: Creates a new product. Validates for duplicate SKUs; throws `InvalidOperationException` if conflict found.
    - `PUT /api/products/{id}`: Full update of product metadata.
    - `DELETE /api/products/{id}`: Removes product from catalog. Returns `404` if not found.

#### Data Model — `Product`
- **Key Fields**: `ProductId (GUID)`, `SKU`, `Name`, `Description`, `CategoryId`, `UoM`, `CostPrice`, `ReorderLevel`, `Barcode`.
- `ReorderLevel`: Used by the Alert service (UC6) to trigger `LOW_STOCK` events.
- `CostPrice`: Used by the Analytics service (UC7) for portfolio valuation.

#### Frontend — Products Feature
- **Reactive Table**: A live-updating data grid bound to the product stream from `ProductService`.
- **Search Pipeline**: Uses `debounceTime(300)` and `switchMap` to cancel inflight requests and hit `GET /api/products/search` on every keystroke.
- **Create/Edit Form**: An Angular Reactive Form with validators for required fields, SKU uniqueness checks, and numeric constraints on `ReorderLevel`.

---

### 📦 UC3: Warehouse Management & Stock Level Orchestration

#### Overview
UC3 manages physical site locations and their real-time stock balances. The `StockPro.WarehouseStock` service is the authority for `AvailableQuantity` and `ReservedQuantity` per product, per warehouse.

#### Backend — `StockPro.WarehouseStock` Service
- **`WarehousesController.cs`**:
    - `GET /api/warehouses`: Returns all registered sites.
    - `GET /api/warehouses/{id}`: Returns a single warehouse by GUID.
    - `POST /api/warehouses`: Creates a new warehouse site. Requires Manager+ role.
    - `PUT /api/warehouses/{id}`: Updates site metadata (name, location code, address).
    - `DELETE /api/warehouses/{id}`: Soft-deletes the site. Throws `InvalidOperationException` if the warehouse has active stock levels.
- **Stock Level Endpoints**: A separate `StockLevelsController` manages the `GET /api/warehouses/levels` endpoint, returning a cross-product, cross-site roll-up of all current balances.

#### Data Model — `StockLevel`
- **Key Fields**: `ProductId (GUID)`, `WarehouseId (GUID)`, `AvailableQty (int)`, `ReservedQty (int)`.
- **Atomic Update Pattern**: Balances are updated using EF Core `ExecuteUpdateAsync` to prevent lost-update race conditions.

#### Frontend — Warehouses & Levels Feature
- **Global Grid**: Displays a merged view of product names vs. warehouse columns, showing live balance counts.
- **Low-Stock Highlighting**: Cells where `AvailableQty < ReorderLevel` are visually flagged in the frontend grid without API overhead, using local computation on the loaded data.

---

### 📜 UC4: Immutable Stock Movement Engine & Ledger

#### Overview
UC4 is the transactional heart of StockPRO. The `StockPro.StockMovement` service processes all inventory mutations and writes them to a permanent, append-only ledger.

#### Backend — `StockPro.StockMovement` Service
- **`MovementController.cs`** exposes four core operations:
    - `POST /api/movement/stock-in`: Processes a Goods Receipt Note (GRN). Increments `AvailableQty` in WarehouseStock.
    - `POST /api/movement/stock-out`: Processes an inventory issue/dispatch. Decrements `AvailableQty`. Validates that sufficient stock exists before committing.
    - `POST /api/movement/transfer`: Atomic inter-warehouse movement. Decrements at source, increments at destination in a single DB transaction. Uses both `stock_in` and `stock_out` aliases for compatibility.
    - `POST /api/movement/adjustment`: Manual correction for physical stocktakes. Can be positive or negative delta.
    - `GET /api/movement/history`: Filterable history supporting `productId`, `warehouseId`, `type`, `startDate`, `endDate` query parameters.

#### Immutability Guarantee
- Once a `StockMovement` record is persisted, it is **never updated or deleted**.
- Corrections are made via new, offsetting movements (e.g., a negative adjustment).
- Every record is stamped with a system-generated `ReferenceId` and `Notes` field for traceability.

#### Cross-Service Integration
- When UC5 `Purchase` service receives goods on a PO, it makes an **HTTP call** to `POST /api/movement/stock-in`, propagating the current user's JWT via the `Authorization` header.
- The Movement service then calls `WarehouseStock` to update the balance.

#### Frontend — Movements Feature
- **Spec-Sheet Ledger Table**: A high-density, monospace-font table showing all historical records.
- **Multi-Dimensional Filters**: Filter bar allows simultaneous filtering by product, warehouse, movement type, and date range — all bound reactively using `combineLatest`.

---

### 🛍️ UC5: Procurement, Supplier Management & PO Lifecycle

#### Overview
UC5 introduces the procurement domain — managing vendors and orchestrating multi-step Purchase Orders. The `StockPro.Purchase` service is entirely self-contained, with its own `PurchaseDbContext`, `Supplier`, `PurchaseOrder`, and `POLineItem` tables.

#### Backend — `StockPro.Purchase` Service

**Supplier Management (`SuppliersController.cs`)**:
- `GET /api/suppliers`: Ordered by name, returns all vendor records.
- `POST /api/suppliers`: Creates a new vendor. Validates for email uniqueness at the service level.
- `PUT /api/suppliers/{id}`: Updates vendor metadata. Checks email uniqueness excluding self to prevent false conflicts.

**Purchase Order Lifecycle (`PurchaseOrdersController.cs` + `PurchaseServiceImpl.cs`)**:
- `POST /api/purchase-orders`: Creates a new PO in `DRAFT` status. Validates that the supplier is **active** and that at least one line item is present. `TotalAmount` is auto-calculated as `Σ(Quantity × UnitCost)`.
- `PUT /api/purchase-orders/{id}/submit`: Transitions `DRAFT` → `PENDING`. Guards against invalid current state.
- `PUT /api/purchase-orders/approve`: Transitions `PENDING` → `APPROVED`. Rejects if PO is not in `PENDING`.
- `PUT /api/purchase-orders/reject`: Transitions `PENDING` → `CANCELLED`. Appends rejection notes.
- `POST /api/purchase-orders/receive`: The most complex operation — Processes a partial or full goods receipt for an `APPROVED` PO.
    - Validates per-line-item received quantity against ordered quantity. Throws if `NewTotal > OrderedQty`.
    - Calls `CreateStockInMovementAsync()` for each line item, which makes an **outbound HTTP call** to `StockMovement` with the JWT propagated.
    - Auto-marks PO as `RECEIVED` if all line items are fully received.

#### Data Model
- **`Supplier`**: `SupplierId`, `Name`, `Email`, `ContactPerson`, `Phone`, `Address`, `City`, `Country`, `PaymentTerms`, `LeadTimeDays`, `Rating (decimal)`, `IsActive`.
- **`PurchaseOrder`**: `PoId`, `SupplierId (FK)`, `WarehouseId`, `CreatedById`, `Status`, `TotalAmount`, `OrderDate`, `ExpectedDate`, `ReceivedDate`, `Notes`.
- **`POLineItem`**: `LineItemId`, `PoId (FK)`, `ProductId`, `Quantity`, `UnitCost`, `ReceivedQty`.

#### Frontend — Purchases Feature
- **Multi-Line PO Form**: Uses `FormArray` to dynamically add/remove product line items, with a reactive total calculated via `valueChanges`.
- **Approval Workflow**: Status-driven action buttons that surface only relevant transitions (e.g., "Approve" only on `PENDING` POs).
- **Items Count Bug Fix**: We resolved a deserialization issue where `lineItems` were not being aggregated properly on the list view — the fix involved ensuring the backend `GET` call eagerly loads `LineItems` using `.Include(p => p.LineItems)`.

---

### 🔔 UC6: Alert & Monitoring Engine

#### Overview
UC6 introduces real-time operational awareness. The `StockPro.Alert` service has two layers: an HTTP API for operators to manage alerts, and a background worker that automatically generates alerts by polling other services.

#### Backend — `StockPro.Alert` Service

**`AlertsController.cs`**:
- `GET /api/alerts`: Returns all alerts for the **currently authenticated user** (scoped by `RecipientId` from JWT).
- `GET /api/alerts/unread-count`: Returns a lightweight count of unread alerts for the notification badge.
- `PUT /api/alerts/read/{id}`: Marks a specific alert as `IsRead = true`.
- `PUT /api/alerts/acknowledge/{id}`: Marks a specific alert as `IsAcknowledged = true` — clears it from the active alert dashboard.
- `POST /api/alerts/register-recipient`: Called by the frontend on login. Seeds the user as a recipient in the Alert DB if they have no existing alerts. Generates a welcome `INFO` alert. **Idempotent** — safe to call multiple times.

**Alert Data Model (`Alert.cs`)**:
- `AlertId (GUID)`, `RecipientId (GUID)`, `Type (LOW_STOCK | OVERSTOCK | PO_PENDING_APPROVAL | OVERDUE_PO)`, `Severity (INFO | WARNING | CRITICAL)`, `Title`, `Message`, `RelatedProductId?`, `RelatedWarehouseId?`, `IsRead`, `IsAcknowledged`, `CreatedAt`.

**Background Monitoring Worker**:
- A `BackgroundService` (`AlertMonitorWorker.cs`) runs on a configurable interval (60 seconds).
- Polls the `StockMovement`/`WarehouseStock` services for current levels.
- Compares against `ReorderLevel` from the `ProductItem` service.
- Generates `LOW_STOCK` alerts with `WARNING` or `CRITICAL` severity based on threshold depth.

#### Frontend — Alerts Integration
- **Notification Badge**: A top-bar widget polls `GET /api/alerts/unread-count` every 30 seconds via a `timer(0, 30000)` RxJS observable.
- **Alert Tray**: Expandable list of active alerts with severity-coded indicators.
- **Registration Flow**: `POST /api/alerts/register-recipient` is called automatically after successful login to ensure the user is enrolled in the monitoring system.

---

### 📈 UC7: Analytics, Reporting & Operational Intelligence

#### Overview
UC7 aggregates data from across the microservices mesh to provide operational intelligence. The `StockPro.Analytics` service (`ReportController.cs`) exposes 9 distinct report endpoints.

#### Backend — `StockPro.Analytics` Service

**`ReportController.cs`** — All endpoints require authenticated access:
- `GET /api/reports/value`: **Total Inventory Valuation** — Aggregates `Σ(StockLevel.Qty × Product.CostPrice)` across all warehouses.
- `GET /api/reports/value/by-warehouse`: Per-warehouse breakdown of inventory value.
- `GET /api/reports/turnover?startDate&endDate`: **Inventory Turnover Rate** — `COGS / Average Inventory Value` over a configurable date range. Default: last 30 days.
- `GET /api/reports/top-products?startDate&endDate&topN=10`: Products ranked by total units moved (inbound + outbound). Default: top 10 over last 30 days.
- `GET /api/reports/slow-products?startDate&endDate&thresholdUnits=10`: Products with movement below a configurable threshold over the period. Default: 3-month lookback, threshold of 10 units.
- `GET /api/reports/dead-stock?days=90`: Products with **zero** movement for 90+ configurable days.
- `GET /api/reports/po-summary?startDate&endDate`: PO count and total spend broken down by supplier and warehouse.
- `GET /api/reports/low-stock`: **Live snapshot** — products currently below their `ReorderLevel`.
- `GET /api/reports/movement-summary?startDate&endDate`: Aggregated counts and quantities for each movement type (In/Out/Transfer).
- `POST /api/reports/snapshot?date`: **Manual Snapshot Trigger** — writes a denormalized state capture to the `Snapshots` table. An automated daily job runs this automatically.

#### Frontend — Analytics Dashboard (`analytics-dashboard.component`)
- **KPI Cards**: Large-format figures for Total Value, Low Stock Count, Active Alerts, and Top Mover.
- **Date Range Controls**: A reactive date picker that triggers `switchMap`-based refetch of all report streams simultaneously.
- **Spec-Sheet Tables**: High-density tabular reports rendered for top-movers, slow-movers, and dead stock — matching the "Operational Zen" design language.

---

### 🛡️ UC8: Administrative Overdrive, User Control & Forensic Audit

#### Overview
UC8 is the command center for system administrators. It extends `StockPro.Auth` with an `AdminController` and a full `AdminServiceImpl` that provides user lifecycle management, role reassignment, and a forensic audit ledger.

#### Backend — `AdminController.cs` (Auth Service, `api/admin`)

**User Management**:
- `GET /api/admin/users`: Lists all users with roles, active status, and login metadata.
- `GET /api/admin/users/{id}`: Single user lookup by Identity GUID.
- `POST /api/admin/users`: Admin creates a user with an **explicitly specified role** — bypasses the public `STAFF`-only registration lock.
- `PUT /api/admin/users/{id}`: Updates profile fields (`FullName`, `PhoneNumber`). Logs `UPDATE_USER` action to audit.
- `PUT /api/admin/users/{id}/deactivate`: Sets `IsActive = false`. **Self-deactivation is blocked** at the service level. Historical data is preserved (not deleted). Logs `DEACTIVATE_USER`.
- `PUT /api/admin/users/{id}/reactivate`: Reverses deactivation. Logs `REACTIVATE_USER`.

**Role Management**:
- `GET /api/admin/roles`: Returns the system's valid role list `[ADMIN, INVENTORY MANAGER, STAFF]`.
- `PUT /api/admin/roles`: Assigns a new role. **Removes all existing roles first**, then assigns the new one. Prevents duplicate role accumulation. Validates against the `ValidRoles` whitelist. Logs `ASSIGN_ROLE` with `OldValue=Role=X` and `NewValue=Role=Y`.

**Forensic Audit Log**:
- `GET /api/admin/audit`: Filterable query supporting `userId`, `action`, `entityName`, `fromDate`, `toDate`. Results are `OrderByDescending(Timestamp)` and capped at **500 records** to prevent unbounded queries.
- `POST /api/admin/audit/log`: **Internal cross-service endpoint** marked `[AllowAnonymous]` but protected by `X-Internal-Key` header. Rejects if key is missing or doesn't match `config["InternalApiKey"]`. Used by all other microservices to log events centrally.

#### Audit Log Data Model (`AuditLog.cs`)
- `AuditId (GUID)`, `UserId (string, FK to AspNetUsers)`, `Action (string[100])`, `EntityName (string[100])`, `EntityId (GUID?)`, `OldValue (string?)`, `NewValue (string?)`, `Timestamp (DateTime UTC)`.
- **Write-Once Guarantee**: `LogActionAsync` never throws to the caller — failures fall back to `ILogger.LogError` to prevent audit failures from breaking the primary business operation.

#### Frontend — Admin Module (`admin` feature)
- **User Management Table**: Full CRUD with inline role-change dropdowns and activate/deactivate toggles.
- **Audit Ledger Viewer**: A high-density spec-sheet table showing every logged event, filterable by user, action type, entity, and date range.
- **Value Diff Display**: The `OldValue` and `NewValue` columns are rendered side-by-side for clear before/after forensic comparison.





---

## 🗄️ Database Schema Dictionary

StockPRO utilizes PostgreSQL with service-isolated schemas. Below are the core technical tables for each domain.

### 1. Auth & Audit (`StockProAuthDb`)
- **`AspNetUsers`**: Core user credentials, profile data, and `IsActive` flags.
- **`AspNetRoles`**: System roles (`ADMIN`, `INVENTORY MANAGER`, `STAFF`).
- **`AuditLogs`**: Forensic trail containing `Action`, `EntityName`, `OldValue`, `NewValue`, and `Timestamp`.

### 2. Product Master (`StockProProductDb`)
- **`Products`**: SKU, Name, Description, CategoryId, UoM, and Technical Specs.
- **`Categories`**: Hierarchical grouping for product classification.

### 3. Warehouse & Levels (`StockProWarehouseDb`)
- **`Warehouses`**: Name, Location Code, Address, and Capacity metadata.
- **`StockLevels`**: Join table between `ProductId` and `WarehouseId` tracking `AvailableQty` and `ReservedQty`.

### 4. Movement Ledger (`StockProInventoryDb`)
- **`StockMovements`**: Type (In/Out/Transfer), ProductId, WarehouseId, Quantity, UnitCost, Reason, and SystemSignature.

### 5. Procurement (`StockProPurchaseDb`)
- **`Suppliers`**: Vendor name, Email, LeadTimeDays, and Rating.
- **`PurchaseOrders`**: Status, SupplierId, WarehouseId, TotalAmount, and DateMetadata.
- **`POLineItems`**: ProductId, PoId, OrderedQuantity, UnitCost, and ReceivedQuantity.

### 6. Alerts (`StockProAlertDb`)
- **`Alerts`**: Title, Message, Severity, Type, RecipientId, and `IsRead`/`IsAcknowledged` flags.

### 7. Analytics (`StockProAnalyticsDb`)
- **`Snapshots`**: Denormalized captures of product stock levels and valuations per date.

---

## 📡 API Mesh: Endpoint Reference Matrix

| Service | Endpoint | Method | Role | Description |
| :--- | :--- | :---: | :---: | :--- |
| **Auth** | `/api/auth/login` | POST | Public | Authenticate and return JWT |
| **Auth** | `/api/admin/users` | GET | ADMIN | List all system users |
| **Auth** | `/api/admin/audit` | GET | ADMIN | Review the forensic audit trail |
| **Product**| `/api/products` | GET | Staff+ | Retrieve filterable catalog |
| **Product**| `/api/products` | POST | Manager | Create new master data |
| **W-Stock** | `/api/warehouse` | GET | Staff+ | List all site locations |
| **W-Stock** | `/api/warehouse/levels`| GET | Staff+ | Get live stock balances |
| **Movement**| `/api/movement/history`| GET | Staff+ | View immutable ledger |
| **Movement**| `/api/movement/transfer`| POST | Staff+ | Atomic inter-site movement |
| **Purchase**| `/api/purchaseorders` | POST | Staff+ | Initiate procurement flow |
| **Purchase**| `/api/suppliers` | GET | Staff+ | List verified vendors |
| **Alert** | `/api/alerts/active` | GET | Staff+ | List unread system alerts |
| **Analytics**| `/api/reports/value` | GET | Manager | Total inventory valuation |

---

## ⚙️ Anatomy of a Transaction: Procurement Flow

1. **PO Creation**: Staff creates a `DRAFT` PO in `StockPro.Purchase`.
2. **Approval**: Manager reviews and transitions status to `APPROVED`.
3. **GRN Processing**: Warehouse staff marks the PO as `RECEIVED`.
4. **Inventory Sync**:
    - `StockPro.Purchase` calls `StockPro.StockMovement` to record a `STOCK_IN`.
    - `StockPro.StockMovement` updates `StockPro.WarehouseStock` levels atomically.
5. **Audit Event**: `StockPro.Auth` records the entire transaction for compliance.
6. **Alert Check**: `StockPro.Alert` background worker verifies if the new stock clears any `LOW_STOCK` warnings.

---

## 🚀 Operations & Deployment Runbook

### 1. Requirements
- **Docker Engine** 24.0+
- **PostgreSQL 16**
- **Angular CLI** (Optional, for local development)

### 2. Bootstrapping the Ecosystem
```powershell
# 1. Start the distributed mesh
docker-compose up -d --build

# 2. Monitor internal health
docker-compose ps

# 3. Check specific logs (e.g. Auth)
docker-compose logs -f auth
```

### 3. Database Management
Migrations are handled via EF Core. To force a refresh:
```powershell
dotnet ef database update --project StockPro.Auth
```

### 4. Production Hardening
- **JWT Secrets**: Must be rotated every 90 days.
- **Internal API Keys**: Should be injected via secure Vault/Environment variables.
- **CORS**: Whitelist only trusted frontend production origins.

---

## 🧪 Testing Strategy & Quality Assurance

### 1. Backend (MSTest & Moq)
- **Unit Testing**: 90% coverage on core services (`PurchaseOrder`, `MovementEngine`).
- **Integration Testing**: Verifies cross-service DTO mapping and DB constraints.

### 2. Frontend (Jasmine & Karma)
- **Component Integrity**: Verifies reactive state updates in the dashboard.
- **Interceptor Validation**: Ensures tokens are correctly attached to every request.

---

## 📂 Project Structure Map

```text
StockPRO/
├── StockPro-UI/                    # Angular 17+ Frontend
│   ├── src/app/
│   │   ├── core/                   # Interceptors, Guards, State Services
│   │   ├── features/               # Lazily loaded modules (Admin, Purchase, etc.)
│   │   └── shared/                 # Technical UI Component library
├── StockPro.Auth/                  # Identity & Audit Sink
├── StockPro.ProductItem/           # Product Master Service
├── StockPro.WarehouseStock/        # Real-time Stock Orchestration
├── StockPro.StockMovement/         # Transactional Ledger Engine
├── StockPro.Purchase/              # Procurement & Supplier Service
├── StockPro.Alert/                 # Monitoring & Background Jobs
├── StockPro.Analytics/             # Aggregated Intelligence
├── Tests/                          # Centralized MSTest Suite
└── docker-compose.yml              # Multi-container Definition
```

---

## 🔒 Access Control Matrix (Detailed)

| Operation | Admin | Manager | Staff |
| :--- | :---: | :---: | :---: |
| Deactivate User | ✅ | ❌ | ❌ |
| View Audit Log | ✅ | ❌ | ❌ |
| Approve PO | ✅ | ✅ | ❌ |
| Edit Product | ✅ | ✅ | ❌ |
| Record Movement | ✅ | ✅ | ✅ |
| View Alerts | ✅ | ✅ | ✅ |
| View Analytics | ✅ | ✅ | ❌ |

---

## 📜 Compliance & Forensic Readiness
Every action within StockPRO is designed for forensic audit readiness. The **Forensic Audit Log (UC8)** ensures that no data mutation occurs without a recorded identity, timestamp, and state diff. This system is compliant with industrial standards for inventory accountability.

---
