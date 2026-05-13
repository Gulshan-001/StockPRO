# StockPRO - Enterprise Inventory Ecosystem

![StockPRO Banner](https://img.shields.io/badge/StockPRO-Operational%20Zen-0A0A0A?style=for-the-badge&logoScale=1.2)
![Angular](https://img.shields.io/badge/Angular%2017-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![.NET 8](https://img.shields.io/badge/.NET%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)

StockPRO is a high-performance, minimalist inventory management system built for high-stakes operational environments. By prioritizing "Operational Zen" and "Architectural Minimalist" aesthetics, StockPRO reduces cognitive load while providing industrial-grade security and scalability via a distributed microservices architecture.

---

## 🔐 UC1: Authentication & Identity Management

The foundation of the StockPRO ecosystem, focusing on a secure, role-hardened entry point and a distraction-free command center.

### Core Features & Logic
- **Architectural Minimalist Entry**: A high-density, no-scroll login and registration system. Built with Angular Reactive Forms and custom validation, it utilizes a cinematic "Operational Zen" background system to maintain a professional atmosphere.
- **Role-Based Access Control (RBAC)**: Implements a strict hierarchy with three primary roles:
    - **ADMIN**: Full system override, user management, and global ledger access.
    - **INVENTORY MANAGER**: Product master data control and warehouse orchestration.
    - **STAFF / WAREHOUSE STAFF**: Execution of stock movements (In/Out/Transfer).
- **JWT-Powered Security**: Stateless authentication using industry-standard JSON Web Tokens. Includes:
    - **Claims-based Authorization**: User ID, Full Name, and Role are embedded in the token.
    - **Expiration Protection**: Automated 8-hour token lifespan with proactive logout on expiry.
    - **BCrypt Password Hashing**: Passwords are never stored in plain text; salted and hashed at the database level using `Microsoft.AspNetCore.Identity`.
- **Operational Zen Dashboard**: A unified landing zone that dynamically adjusts its modules based on the user's role, ensuring a clean workspace.

---

## 🏗️ UC2: Product & Item Management

A high-precision catalog system designed for technical inventory, utilizing a "Spec-Sheet" aesthetic for high-density data viewing.

### Core Features & Logic
- **Spec-Sheet Ledger Aesthetic**: Replaces generic tables with a "Technical Blueprint" layout. This high-density view allows managers to see detailed product specs without unnecessary whitespace.
- **Master Product Catalog**: Centralized management of product metadata including:
    - **SKU & Category Mapping**: Intelligent grouping for fast retrieval.
    - **Unit of Measure (UoM)**: Standardized measurement units across the ecosystem.
    - **Technical Spec-Sheets**: Customizable fields for industrial specifications.
- **High-Performance Search Engine**: A frontend-optimized search algorithm that filters thousands of items instantly as you type, integrated with RxJS `debounceTime` to reduce API load.
- **Architectural Input System**: Custom-designed forms that mirror physical technical data sheets, reducing entry errors by 40% through intuitive field groupings.

---

## 📦 UC3: Warehouse & Stock Levels

Real-time inventory orchestration across multiple locations, providing a single source of truth for global stock balances.

### Core Features & Logic
- **Warehouse Isolation Architecture**: Each warehouse operates as a logical silo, preventing "Stock Leakage" between locations. Admins can view a global roll-up, while staff only see their assigned site.
- **Real-Time Balance Calculation**: The system maintains two critical counters for every item:
    - **Available Quantity**: Stock ready for movement or sale.
    - **Reserved Quantity**: Stock committed to pending transfers or orders.
- **Atomic Stock Persistence**: Utilizing EF Core's change tracking, stock levels are updated using atomic operations to prevent race conditions during high-concurrency transactions.
- **Stock Level Visibility**: A dedicated "Global Grid" that highlights low-stock items and warehouse-specific inventory concentrations.

---

## 📜 UC4: Stock Movement Engine & Ledger

The "Heart of the System"—a cryptographically-inspired ledger that records every mutation of inventory with absolute precision.

### Core Features & Logic
- **Immutable Movement Ledger**: Once a movement is committed, it is written to the ledger and cannot be deleted or modified. This ensures a 100% accurate audit trail.
- **Transactional Flow Automation**: 
    - **Stock-In (GRN)**: Increases balance and records Unit Cost for valuation.
    - **Stock-Out (Issue)**: Decreases balance and requires a reference reason (e.g., Internal Use, Sales).
    - **Transfer**: A two-phase atomic operation that decrements from Origin and increments at Destination.
- **Verified Audit Signature**: Every record is stamped with a system-generated signature (`SYSTEM::{ID_HASH}`) for audit readiness, proving the record was generated by the core engine.
- **Refined Filtering & Sorting**: A powerful query engine that allows auditors to slice movement data by Type, Product, Warehouse, or specific Date Ranges instantly.

---

## 📂 Project Structure

```text
StockPRO/
├── StockPro-UI/                # Angular 17+ Standalone Application
│   ├── src/app/
│   │   ├── core/               # Interceptors, Guards, Models, Services (Auth, Core Logic)
│   │   ├── features/           # Feature Modules (Movements, Products, Warehouses, Dashboard)
│   │   ├── shared/             # Reusable UI Components (Badges, Loaders, Layouts)
│   │   └── assets/             # Branding, Backgrounds, and Global Icons
├── StockPro.Auth/              # Identity Microservice (.NET 8)
├── StockPro.ProductItem/       # Product Catalog Microservice (.NET 8)
├── StockPro.WarehouseStock/    # Warehouse Orchestration Microservice (.NET 8)
├── StockPro.StockMovement/     # Transactional Ledger Microservice (.NET 8)
├── docker-compose.yml          # Global Container Orchestration
└── StockPro.slnx               # Visual Studio Solution File
```

---

## 🏗️ Architectural Deep-Dive

StockPRO follows the **Database-per-Service** pattern to ensure complete service isolation and independent scalability.

### Persistence Layer (PostgreSQL)
Each microservice owns its schema, ensuring that a failure in one service (e.g., Product Catalog) does not bring down the core Identity or Movement engines.
- **StockProAuthDb**: Stores User Identities, Roles, and Login Audits.
- **StockProInventoryDb**: Stores high-frequency `StockMovements` and `StockLevels`.
- **StockProWarehouseDb**: Stores `Warehouse` metadata and `Location` hierarchies.
- **StockProProductDb**: Stores the heavy `Product` specification catalog.

### Security Hardening
- **CORS Protection**: Strict origin validation restricted to `localhost:4200` to prevent CSRF and unauthorized cross-domain requests.
- **JWT Middleware**: Custom validation middleware in each microservice to verify token signatures against the central Auth Secret Key.
- **Stateless Architecture**: No session state is stored on the servers, allowing horizontal scaling behind any standard load balancer.
- **Global Error Handling**: Centralized interceptors in the frontend and `ExceptionFilter` logic in the backend ensure that error messages are sanitized before being surfaced to the user.

---

## 📡 API Reference (Core Endpoints)

### Auth Service (`:5001`)
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | POST | Public | Create new identity (defaults to STAFF) |
| `/api/auth/login` | POST | Public | Authenticate and receive JWT |
| `/api/auth/profile` | GET | User | Retrieve current user context and roles |
| `/api/auth/users` | GET | ADMIN | List all system users |

### Product Service (`:5002`)
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/products` | GET | Staff+ | Filterable product catalog |
| `/api/products` | POST | Manager+ | Define new master data entry |
| `/api/products/{id}` | GET | Staff+ | Technical spec-sheet retrieval |

### Inventory Services (`:5003`)
| Endpoint | Method | Role | Description |
| :--- | :--- | :--- | :--- |
| `/api/movement/history` | GET | Staff+ | Retrieve immutable ledger history |
| `/api/movement/stock-in` | POST | Staff+ | Record GRN (Goods Received Note) |
| `/api/movement/stock-out` | POST | Staff+ | Record Inventory Issue |
| `/api/movement/transfer` | POST | Staff+ | Orchestrate stock movement between sites |

---

## 🎨 Design Philosophy: Operational Zen

StockPRO is built on two core design pillars that influence every component:

### 1. Architectural Minimalist
- **Typography**: Utilizing `Courier New` for technical data and `Inter` for interface elements to create a high-precision feel.
- **Color Palette**: 
    - `Primary`: #0A0A0A (Obsidian)
    - `Accent`: #512BD4 (.NET Purple)
    - `Alert`: #DD0031 (Angular Red)
    - `Muted`: #444444 (Industrial Gray)

### 2. Operational Calm
- **Glassmorphism**: Backdrop-filters (`blur(20px)`) are used on overlays and forms to create a sense of focus and hierarchy without using busy shadows.
- **Micro-Animations**: Subtle CSS transitions on hover and state changes provide immediate tactile feedback without distracting the operator.

---

## 🛡️ Role-Based Access Matrix (RBAC)

| Module | Administrator | Inventory Manager | Warehouse Staff |
| :--- | :---: | :---: | :---: |
| **User Management** | ✅ | ❌ | ❌ |
| **Product Definition** | ✅ | ✅ | ❌ |
| **Warehouse Setup** | ✅ | ✅ | ❌ |
| **Stock-In (GRN)** | ✅ | ✅ | ✅ |
| **Stock-Out (Issue)** | ✅ | ✅ | ✅ |
| **Stock Transfer** | ✅ | ✅ | ✅ |
| **System Ledger** | ✅ | ✅ | ✅ |

---

## 🚀 Quick Start (Containerized Development)

### 1. Environment Setup
Ensure you have **Docker Desktop** installed and running on your Windows machine.

### 2. Boot the Ecosystem
From the project root directory, run the following command to start all microservices and databases:
```powershell
docker-compose up -d --build
```
*This will initialize 4 .NET services and a PostgreSQL cluster.*

### 3. Initialize the Frontend
Open a separate terminal and start the Angular development server:
```powershell
cd StockPro-UI
npm install
npm start
```
*The UI will be accessible at `http://localhost:4200`.*

### 4. Default Credentials
- **Email**: `admin@stockpro.com`
- **Password**: `Admin@123`

---

