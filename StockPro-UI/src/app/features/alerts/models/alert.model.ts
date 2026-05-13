export interface Alert {
  alertId: string;
  recipientId: string;
  type: string; // LOW_STOCK, OVERSTOCK, PO_PENDING, etc.
  severity: string; // INFO, WARNING, CRITICAL
  title: string;
  message: string;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: string;
  relatedProductId?: string;
  relatedWarehouseId?: string;
}

export interface UnreadCountResponse {
  count: number;
}
