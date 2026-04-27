import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface Movement {
  movementId: string;
  productId: string;
  warehouseId: string;
  warehouseName: string;
  movementType: string;
  quantity: number;
  unitCost?: number;
  balanceAfter: number;
  notes: string;
  movementDate: string;
  performedBy: string;
}

@Injectable({
  providedIn: 'root'
})
export class MovementService {
  private apiUrl = `${environment.movementApiUrl}/api/movement`;

  constructor(private http: HttpClient) { }

  stockIn(data: any): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}/stock-in`, data);
  }

  stockOut(data: any): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}/stock-out`, data);
  }

  transfer(data: any): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}/transfer`, data);
  }

  adjustment(data: any): Observable<Movement> {
    return this.http.post<Movement>(`${this.apiUrl}/adjustment`, data);
  }

  getHistory(productId?: string, warehouseId?: string, type?: string): Observable<Movement[]> {
    let params: any = {};
    if (productId) params.productId = productId;
    if (warehouseId) params.warehouseId = warehouseId;
    if (type) params.type = type;
    return this.http.get<Movement[]>(`${this.apiUrl}/history`, { params });
  }
}
