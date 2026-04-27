export interface Supplier {
  supplierId: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  paymentTerms: string;
  leadTimeDays: number;
  rating: number;
  isActive: boolean;
}

export interface POLineItem {
  lineItemId: string;
  productId: string;
  quantity: number;
  unitCost: number;
  receivedQty: number;
  receiptStatus: string;
}

export interface PurchaseOrder {
  poId: string;
  supplierId: string;
  supplierName: string;
  warehouseId: string;
  createdById: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  notes?: string;
  lineItems: POLineItem[];
}

export interface CreatePOLineItemRequest {
  productId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePORequest {
  supplierId: string;
  warehouseId: string;
  expectedDate?: string;
  notes?: string;
  items: CreatePOLineItemRequest[];
}

export interface ReceiveLineItemRequest {
  lineItemId: string;
  receivedQty: number;
}

export interface ReceiveGoodsRequest {
  poId: string;
  items: ReceiveLineItemRequest[];
}
