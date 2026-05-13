import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  InventoryValueResult,
  WarehouseValueResult,
  TurnoverResult,
  TopMovingProduct,
  SlowMovingProduct,
  DeadStockItem,
  POSummaryResult,
  MovementSummaryResult,
  LowStockItem,
  SnapshotResult
} from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly API = `${environment.analyticsApiUrl}/api/reports`;

  constructor(private http: HttpClient) {}

  getTotalStockValue(): Observable<InventoryValueResult> {
    return this.http.get<InventoryValueResult>(`${this.API}/value`);
  }

  getStockValueByWarehouse(): Observable<WarehouseValueResult[]> {
    return this.http.get<WarehouseValueResult[]>(`${this.API}/value/by-warehouse`);
  }

  getInventoryTurnover(startDate?: string, endDate?: string): Observable<TurnoverResult> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<TurnoverResult>(`${this.API}/turnover`, { params });
  }

  getTopMovingProducts(startDate?: string, endDate?: string, topN: number = 10): Observable<TopMovingProduct[]> {
    let params = new HttpParams().set('topN', topN.toString());
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<TopMovingProduct[]>(`${this.API}/top-products`, { params });
  }

  getSlowMovingProducts(startDate?: string, endDate?: string, thresholdUnits: number = 10): Observable<SlowMovingProduct[]> {
    let params = new HttpParams().set('thresholdUnits', thresholdUnits.toString());
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<SlowMovingProduct[]>(`${this.API}/slow-products`, { params });
  }

  getDeadStock(days: number = 90): Observable<DeadStockItem[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<DeadStockItem[]>(`${this.API}/dead-stock`, { params });
  }

  getPOSummary(startDate?: string, endDate?: string): Observable<POSummaryResult> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<POSummaryResult>(`${this.API}/po-summary`, { params });
  }

  getLowStockReport(): Observable<LowStockItem[]> {
    return this.http.get<LowStockItem[]>(`${this.API}/low-stock`);
  }

  getMovementSummary(startDate?: string, endDate?: string): Observable<MovementSummaryResult> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<MovementSummaryResult>(`${this.API}/movement-summary`, { params });
  }

  takeSnapshot(date?: string): Observable<SnapshotResult> {
    let params = new HttpParams();
    if (date) params = params.set('date', date);
    return this.http.post<SnapshotResult>(`${this.API}/snapshot`, {}, { params });
  }
}
