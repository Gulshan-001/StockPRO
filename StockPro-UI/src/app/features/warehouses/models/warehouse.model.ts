export interface Warehouse {
  warehouseId: string;
  name: string;
  location?: string;
  address?: string;
  managerId?: string;
  capacity: number;
  usedCapacity: number;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface WarehouseCreateDto {
  name: string;
  location?: string;
  address?: string;
  managerId?: string;
  capacity: number;
  phone?: string;
}

export interface WarehouseUpdateDto extends WarehouseCreateDto {
  isActive: boolean;
}

export interface StockLevel {
  stockId: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productName: string;
  productSKU: string;
  quantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  location?: string;
  lastUpdated: string;
}

export interface StockInitializeDto {
  warehouseId: string;
  productId: string;
  quantity: number;
  location?: string;
}

export interface StockUpdateDto {
  quantity: number;
  reservedQuantity: number;
  location?: string;
}
