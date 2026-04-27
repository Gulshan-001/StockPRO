# StockPRO - Enterprise Inventory Ecosystem

![StockPRO Banner](https://img.shields.io/badge/StockPRO-Operational%20Zen-0A0A0A?style=for-the-badge&logoScale=1.2)
![Angular](https://img.shields.io/badge/Angular%2017-DD0031?style=for-the-badge&logo=angular&logoColor=white)
![.NET 8](https://img.shields.io/badge/.NET%208-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)

StockPRO is a high-performance, minimalist inventory management system built for high-stakes operational environments. By prioritizing "Operational Zen" and "Architectural Minimalist" aesthetics, StockPRO reduces cognitive load while providing industrial-grade security and scalability via a distributed microservices architecture. It is designed to act as a robust central nervous system for supply chains, orchestrating products, warehouses, ledgers, and procurement across an entire organization.

---

## 🔐 UC1: Authentication & Identity Management

The foundation of the StockPRO ecosystem, focusing on a secure, role-hardened entry point and a distraction-free command center. This module is responsible for the absolute gatekeeping of the system, verifying every identity before allowing interaction with the microservices.

### Deep Architecture & Implementation Details
- **Architectural Minimalist Entry**: A high-density, no-scroll login and registration system. Built with Angular Reactive Forms and custom validation, it utilizes a cinematic "Operational Zen" background system to maintain a professional atmosphere.
- **Strict Role-Based Access Control (RBAC)**: Implements a rigid hierarchy across all microservices with three primary roles:
    - **ADMIN**: Full system override, user management, global ledger access, and capability to assign privileges.
    - **INVENTORY MANAGER**: Product master data control, supplier registry management, warehouse orchestration, and purchase order approval rights.
    - **STAFF / WAREHOUSE STAFF**: Execution of stock movements (In/Out/Transfer), drafting purchase orders, and receiving physical goods.
- **Microservice JWT Security**: Stateless authentication using industry-standard JSON Web Tokens distributed across the entire ecosystem.
    - **Claims-based Authorization**: User ID, Full Name, and Role are securely embedded inside the token payload.
    - **Cryptography**: Passwords are salted and hashed at the database level using `Microsoft.AspNetCore.Identity`'s highly optimized algorithms.
- **Dynamic Operational Dashboard**: A unified landing zone that dynamically adjusts its modules and routing based on the user's encoded role.

---

## 🏗️ UC2: Product & Item Management

A high-precision catalog system designed for technical inventory, utilizing a "Spec-Sheet" aesthetic for high-density data viewing. This service acts as the global dictionary for every physical item that flows through the system.

### Deep Architecture & Implementation Details
- **Spec-Sheet Ledger Aesthetic**: Replaces generic, bloated tables with a "Technical Blueprint" layout. This high-density view allows managers to see detailed product specs (SKU, Price, Thresholds) without unnecessary whitespace.
- **Master Product Catalog Schema**: Centralized management of product metadata including SKU uniqueness enforcement, Unit of Measure (UoM) standardization, and financial valuations.
- **High-Performance Search & Indexing**: A frontend-optimized search algorithm that filters thousands of items instantly using RxJS `debounceTime` to optimize API load.

---

## 📦 UC3: Warehouse Orchestration & Stock Levels

Real-time inventory orchestration across multiple physical and logical locations, providing a single source of truth for global stock balances and spatial capacity.

### Deep Architecture & Implementation Details
- **Warehouse Isolation Architecture**: Each warehouse operates as a logical silo, preventing "Stock Leakage" between locations.
- **Multi-Node Capacity Tracking**: Tracks specific locations and total physical capacity, warning managers when a facility is nearing maximum volume limits.
- **Real-Time Balance Calculation Engine**: Tracks Available Quantity (ready for use) vs. Reserved Quantity (committed to pending orders), preventing double-allocation.
- **Atomic Stock Persistence**: Utilizing EF Core's change tracking and PostgreSQL transaction blocks to ensure stock updates are 100% accurate under high concurrency.

---

## 📜 UC4: Stock Movement Engine & Immutable Ledger

The "Heart of the System"—a cryptographically-inspired ledger that records every mutation of inventory with absolute precision. This is a write-only, immutable transaction engine.

### Deep Architecture & Implementation Details
- **Immutable Movement Ledger**: Records are permanently written to the ledger. There are NO `DELETE` or `UPDATE` endpoints for historical movements, ensuring a 100% accurate audit trail.
- **Transactional Flow Automation**: 
    - **Stock-In (GRN)**: Increases destination balance and records Unit Cost.
    - **Stock-Out (Issue)**: Decreases balance with strict reference requirements.
    - **Stock Transfer**: Two-phase atomic operation ensuring consistency between source and target warehouses.
- **Verified Audit Signatures**: Every record is stamped with a system-generated cryptographic signature (`SYSTEM::{ID_HASH}`) for audit readiness.

---

## 🛒 UC5: Purchase & Supplier System

A complete, end-to-end procurement lifecycle engine. From supplier registry management to automated goods receipt and microservice-to-microservice stock integration.

### Deep Architecture & Implementation Details
- **Supplier Registry Engine**: A centralized database enforcing uniqueness on contact details and tracking critical performance metrics (Lead Times, Payment Terms, Ratings).
- **Finite State Machine PO Lifecycle**: Purchase Orders follow a strict state machine: `DRAFT → PENDING → APPROVED → RECEIVED / CANCELLED`.
- **Inter-Service Communication (GRN → Stock Integration)**: When goods are received in the `Purchase` service, it makes a secure, authorized service-to-service call to the `StockMovement` microservice to automatically update physical inventory levels.
- **Token Propagation**: Uses `IHttpContextAccessor` to securely forward the user's JWT token between microservices during automated stock updates.

---

## 📂 Ecosystem Project Structure

```text
StockPRO/
├── StockPro-UI/                # Angular 17+ Standalone Application (The Unified Client)
├── StockPro.Auth/              # Identity Microservice (.NET 8, Port 5000)
├── StockPro.ProductItem/       # Product Catalog Microservice (.NET 8, Port 5001)
├── StockPro.WarehouseStock/    # Warehouse Orchestration Microservice (.NET 8, Port 5002)
├── StockPro.StockMovement/     # Transactional Ledger Microservice (.NET 8, Port 5003)
├── StockPro.Purchase/          # Procurement & Supplier Microservice (.NET 8, Port 5004)
├── docker-compose.yml          # Global Container Orchestration
└── StockPro.slnx               # Visual Studio Solution File
```

---

## 🚀 Quick Start (Containerized Development)

### 1. Environment Setup
Ensure you have **Docker Desktop** installed and running.

### 2. Boot the Ecosystem
From the project root directory:
```powershell
docker-compose up --build -d
```
*This will initialize 5 .NET Microservices and a PostgreSQL cluster via Docker network orchestration.*

### 3. Frontend Setup (Angular 17)
```powershell
cd StockPro-UI
npm install
npm start
```

---

## 🗺️ Project Roadmap
- [x] **UC1**: Auth & Identity Management (JWT + RBAC)
- [x] **UC2**: Product & Master Data Management
- [x] **UC3**: Warehouse Orchestration & Stock Levels
- [x] **UC4**: Stock Movement Engine & Immutable Ledger
- [x] **UC5**: Purchase & Supplier System (Full Procurement Lifecycle)
- [ ] **UC6**: Advanced Analytics & Performance Reporting Dashboard
- [ ] **UC7**: Supplier Portal & Automated Alerts
- [ ] **UC8**: Multi-Tenant Cloud Architecture (SaaS Readiness)

---
*Created with focus by the StockPRO Development Team.*
