import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Warehouse, WarehouseCreateDto, WarehouseUpdateDto, StockLevel, StockInitializeDto, StockUpdateDto } from '../models/warehouse.model';

@Injectable({
  providedIn: 'root'
})
export class WarehouseService {
  private readonly WAREHOUSE_API = `${environment.warehouseApiUrl}/api/warehouses`;
  private readonly STOCK_API = `${environment.warehouseApiUrl}/api/stock`;

  constructor(private http: HttpClient) {}

  // Warehouses
  getAllWarehouses(): Observable<Warehouse[]> {
    return this.http.get<Warehouse[]>(this.WAREHOUSE_API);
  }

  getWarehouseById(id: string): Observable<Warehouse> {
    return this.http.get<Warehouse>(`${this.WAREHOUSE_API}/${id}`);
  }

  createWarehouse(warehouse: WarehouseCreateDto): Observable<Warehouse> {
    return this.http.post<Warehouse>(this.WAREHOUSE_API, warehouse);
  }

  updateWarehouse(id: string, warehouse: WarehouseUpdateDto): Observable<Warehouse> {
    return this.http.put<Warehouse>(`${this.WAREHOUSE_API}/${id}`, warehouse);
  }

  deleteWarehouse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.WAREHOUSE_API}/${id}`);
  }

  // Stock
  getStockLevels(warehouseId?: string, productId?: string): Observable<StockLevel[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (productId) params = params.set('productId', productId);
    return this.http.get<StockLevel[]>(this.STOCK_API, { params });
  }

  initializeStock(dto: StockInitializeDto): Observable<StockLevel> {
    return this.http.post<StockLevel>(`${this.STOCK_API}/initialize`, dto);
  }

  updateStock(warehouseId: string, productId: string, dto: StockUpdateDto): Observable<StockLevel> {
    return this.http.put<StockLevel>(`${this.STOCK_API}/${warehouseId}/${productId}`, dto);
  }
}
