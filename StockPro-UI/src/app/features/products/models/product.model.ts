export interface Product {
  productId: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays?: number;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCreateDto {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  brand?: string;
  unitOfMeasure?: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  maxStockLevel: number;
  leadTimeDays?: number;
  barcode?: string;
  imageUrl?: string;
}

export interface ProductUpdateDto extends ProductCreateDto {
  isActive: boolean;
}
