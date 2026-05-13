import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { WarehouseService } from '../../services/warehouse.service';
import { Warehouse, StockLevel } from '../../models/warehouse.model';
import { StockTableComponent } from '../stock-table/stock-table.component';
import { ProductService } from '../../../products/services/product.service';
import { Product } from '../../../products/models/product.model';
import { switchMap } from 'rxjs/operators';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-warehouse-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, StockTableComponent],
  template: `
    <div class="app-container bg-inventory animate" *ngIf="warehouse">
      <div class="content-panel">
        <div class="navigation-trail" style="margin-bottom: 2rem;">
          <a routerLink="/warehouses" class="back-link" style="cursor: pointer; text-decoration: none; color: var(--color-muted); font-size: 13px; font-weight: 500; display: inline-flex; align-items: center; gap: 8px;">
            <span>←</span> BACK TO LOGISTICS
          </a>
        </div>

        <header class="detail-header">
          <div class="title-section">
            <h1 class="title" style="font-size: 48px;">{{ warehouse.name }}</h1>
            <div class="status-pill">
              <span class="status-indicator" [class.active]="warehouse.isActive"></span>
              <span class="status-text">{{ warehouse.isActive ? 'Operating' : 'Closed' }}</span>
            </div>
          </div>
          <div class="header-actions">
            <button *ngIf="canManage" class="btn btn-ghost" [routerLink]="['/warehouses', warehouse.warehouseId, 'edit']">Edit Location</button>
            <button class="btn btn-primary" routerLink="/movements/new" [queryParams]="{ warehouseId: warehouse.warehouseId }">+ Add Stock</button>
          </div>
        </header>

        <div class="stats-grid">
          <div class="stat-card">
            <span class="label">Total Capacity</span>
            <span class="stat-value">{{ warehouse.capacity }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Used Capacity</span>
            <span class="stat-value">{{ getTotalUsedCapacity() }}</span>
          </div>
          <div class="stat-card">
            <span class="label">Utilization</span>
            <span class="stat-value">{{ getUsagePercentage() }}%</span>
          </div>
        </div>

        <section class="stock-section">
          <div class="section-header">
            <h2 class="title" style="font-size: 24px;">Inventory Stock</h2>
          </div>
          <app-stock-table [stockLevels]="stockLevels" [showActions]="false"></app-stock-table>
        </section>
      </div>
      <div class="visual-panel"></div>
    </div>
  `,
  styles: [`
    .breadcrumb {
      margin-bottom: 2rem;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-muted);
    }

    .breadcrumb a {
      color: var(--color-muted);
      text-decoration: none;
      transition: color 0.2s;
    }

    .breadcrumb a:hover { color: #fff; }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 4rem;
    }

    .status-pill {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 8px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #ef4444;
      box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
    }

    .status-indicator.active {
      background: #10b981;
      box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    }

    .status-text {
      font-size: 13px;
      color: var(--color-muted);
      font-weight: 500;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-bottom: 4rem;
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      padding: 30px;
      border-radius: 20px;
      backdrop-filter: blur(10px);
    }

    .stat-value {
      display: block;
      color: #fff;
      font-size: 32px;
      font-weight: 700;
      margin-top: 8px;
      letter-spacing: -0.02em;
    }

    .stock-section {
      margin-top: 4rem;
    }

    .section-header {
      margin-bottom: 2rem;
    }
  `]
})
export class WarehouseDetailComponent implements OnInit {
  warehouse?: Warehouse;
  stockLevels: StockLevel[] = [];

  constructor(
    private route: ActivatedRoute,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    private authService: AuthService
  ) {}

  get canManage(): boolean {
    const role = this.authService.userRole.toUpperCase();
    return role === 'ADMIN' || role === 'INVENTORY MANAGER' || role === 'MANAGER';
  }

  ngOnInit(): void {
    this.route.params.pipe(
      switchMap(params => {
        const id = params['id'];
        return forkJoin({
          warehouse: this.warehouseService.getWarehouseById(id),
          stock: this.warehouseService.getStockLevels(id),
          products: this.productService.getAllProducts()
        });
      })
    ).subscribe({
      next: (data) => {
        this.warehouse = data.warehouse;
        // Enrich stock levels with product data
        this.stockLevels = data.stock.map(s => {
          const p = data.products.find(x => x.productId === s.productId);
          return {
            ...s,
            productName: p ? p.name : 'Unknown Product',
            productSKU: p ? p.sku : 'N/A',
            availableQuantity: s.quantity - s.reservedQuantity
          };
        });
      }
    });
  }

  getTotalUsedCapacity(): number {
    return this.stockLevels.reduce((sum, s) => sum + s.quantity, 0);
  }

  getUsagePercentage(): number {
    if (!this.warehouse || !this.warehouse.capacity) return 0;
    return Math.round((this.getTotalUsedCapacity() / this.warehouse.capacity) * 100);
  }
}
