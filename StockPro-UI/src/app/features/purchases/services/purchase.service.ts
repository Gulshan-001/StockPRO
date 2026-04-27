import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Supplier, PurchaseOrder,
  CreatePORequest, ReceiveGoodsRequest
} from '../models/purchase.model';

@Injectable({ providedIn: 'root' })
export class PurchaseService {
  private baseUrl = `${environment.purchaseApiUrl}`;

  constructor(private http: HttpClient) { }

  // ─── Suppliers ─────────────────────────────────────────────────────

  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.baseUrl}/api/suppliers`);
  }

  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(`${this.baseUrl}/api/suppliers/${id}`);
  }

  createSupplier(data: any): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.baseUrl}/api/suppliers`, data);
  }

  updateSupplier(id: string, data: any): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.baseUrl}/api/suppliers/${id}`, data);
  }

  // ─── Purchase Orders ───────────────────────────────────────────────

  getPOs(status?: string): Observable<PurchaseOrder[]> {
    const params: any = {};
    if (status) params.status = status;
    return this.http.get<PurchaseOrder[]>(`${this.baseUrl}/api/purchase-orders`, { params });
  }

  getPOById(id: string): Observable<PurchaseOrder> {
    return this.http.get<PurchaseOrder>(`${this.baseUrl}/api/purchase-orders/${id}`);
  }

  createPO(data: CreatePORequest): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/api/purchase-orders`, data);
  }

  submitPO(id: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.baseUrl}/api/purchase-orders/${id}/submit`, {});
  }

  approvePO(poId: string, notes?: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.baseUrl}/api/purchase-orders/approve`, { poId, notes });
  }

  rejectPO(poId: string, notes?: string): Observable<PurchaseOrder> {
    return this.http.put<PurchaseOrder>(`${this.baseUrl}/api/purchase-orders/reject`, { poId, notes });
  }

  receiveGoods(data: ReceiveGoodsRequest): Observable<PurchaseOrder> {
    return this.http.post<PurchaseOrder>(`${this.baseUrl}/api/purchase-orders/receive`, data);
  }
}
