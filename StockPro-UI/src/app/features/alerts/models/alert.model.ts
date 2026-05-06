export interface Alert {
  alertId: string;
  recipientId: string;
  type: 'LOW_STOCK' | 'OVERSTOCK' | 'PO_PENDING_APPROVAL' | 'OVERDUE_PO' | string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | string;
  title: string;
  message: string;
  relatedProductId: string | null;
  relatedWarehouseId: string | null;
  isRead: boolean;
  isAcknowledged: boolean;
  createdAt: string;
}
