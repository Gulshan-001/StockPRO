export interface InventoryValueResult {
  totalStockValue: number;
  totalProducts: number;
  totalWarehouses: number;
  calculatedAt: string;
}

export interface WarehouseValueResult {
  warehouseId: string;
  warehouseName: string;
  stockValue: number;
  productCount: number;
}

export interface TurnoverResult {
  turnoverRate: number;
  costOfGoodsSold: number;
  averageInventoryValue: number;
  startDate: string;
  endDate: string;
}

export interface TopMovingProduct {
  productId: string;
  productName: string;
  sku: string;
  totalUnitsIn: number;
  totalUnitsOut: number;
  totalUnitsMoved: number;
  rank: number;
}

export interface SlowMovingProduct {
  productId: string;
  productName: string;
  sku: string;
  totalUnitsMoved: number;
  currentStock: number;
  stockValue: number;
}

export interface DeadStockItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  stockValue: number;
  lastMovementDate: string | null;
  daysSinceLastMovement: number;
}

export interface SupplierSpendItem {
  supplierId: string;
  supplierName: string;
  poCount: number;
  totalSpend: number;
}

export interface WarehouseSpendItem {
  warehouseId: string;
  warehouseName: string;
  poCount: number;
  totalSpend: number;
}

export interface POSummaryResult {
  totalPOs: number;
  totalSpend: number;
  bySupplier: SupplierSpendItem[];
  byWarehouse: WarehouseSpendItem[];
  startDate: string;
  endDate: string;
}

export interface MovementSummaryResult {
  totalMovements: number;
  totalStockIn: number;
  totalStockOut: number;
  totalTransfers: number;
  totalAdjustments: number;
  startDate: string;
  endDate: string;
}

export interface LowStockItem {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  shortfallUnits: number;
}

export interface SnapshotResult {
  recordsWritten: number;
  snapshotDate: string;
  createdAt: string;
}
