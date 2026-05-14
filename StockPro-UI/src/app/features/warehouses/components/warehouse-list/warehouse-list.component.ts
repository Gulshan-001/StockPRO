import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WarehouseService } from '../../services/warehouse.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';
import { Warehouse } from '../../models/warehouse.model';
import { StockLevel } from '../../models/warehouse.model';

@Component({
  selector: 'app-warehouse-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container bg-inventory animate">
      <div class="content-panel">
        <div class="navigation-trail">
          <a routerLink="/dashboard" class="back-link">← Back to Dashboard</a>
        </div>
        <header class="page-header">
          <div class="header-content">
            <h1 class="title" style="font-size: 48px;">Logistics Network</h1>
            <p class="subtitle">Manage your inventory locations and monitor capacity across all sites.</p>
          </div>
          <div class="header-actions">
            <button *ngIf="isAdmin" class="btn btn-primary" (click)="onCreate()">+ Add Warehouse</button>
          </div>
        </header>

        <div class="warehouse-grid" *ngIf="warehouses.length > 0; else loading">
          <div *ngFor="let warehouse of warehouses" class="warehouse-card" [routerLink]="[warehouse.warehouseId]">
            <div class="card-header">
              <span class="label">{{ warehouse.isActive ? 'Operating' : 'Closed' }}</span>
              <h3 style="margin-top: 5px;">{{ warehouse.name }}</h3>
            </div>
            
            <div class="card-body">
              <div class="info-item">
                <span class="label">Location</span>
                <span class="value">{{ warehouse.location || 'Not set' }}</span>
              </div>
              
              <div class="capacity-section">
                <div class="capacity-label">
                  <span>Capacity Usage</span>
                  <span>{{ getUsagePercentage(warehouse) }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" 
                       [style.width.%]="getUsagePercentage(warehouse)"
                       [class.warning]="getUsagePercentage(warehouse) > 70"
                       [class.danger]="getUsagePercentage(warehouse) > 90">
                  </div>
                </div>
              </div>
            </div>
            
            <div class="card-footer">
              <span class="view-link">View Detailed Metrics →</span>
            </div>
          </div>

          <!-- Empty State -->
          <div *ngIf="warehouses.length === 0" class="empty-zen-state">
            <div class="empty-glow"></div>
            <div class="empty-content">
              <div class="empty-icon">📍</div>
              <h3 class="title">No Active Warehouses</h3>
              <p class="subtitle" style="margin-bottom: 24px;">
                {{ isAdmin ? 'Your logistics network is currently empty. Initialize your first storage location to begin tracking stock.' : 'No storage locations have been configured yet. Please contact your system administrator.' }}
              </p>
              <button *ngIf="isAdmin" class="btn btn-primary" (click)="onSeed()">Initialize Network</button>
            </div>
          </div>
        </div>

        <ng-template #loading>
          <div class="loading-grid">
            <div class="shimmer-card" *ngFor="let i of [1,2,3]"></div>
          </div>
        </ng-template>
      </div>
      
      <div class="visual-panel"></div>
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 3rem;
    }

    .warehouse-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }

    .warehouse-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 2rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      backdrop-filter: blur(10px);
    }

    .warehouse-card:hover {
      transform: translateY(-5px);
      border-color: rgba(255, 255, 255, 0.3);
      background: rgba(255, 255, 255, 0.06);
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 1.5rem;
    }

    .value {
      font-weight: 500;
      color: #fff;
    }

    .capacity-section {
      margin-top: 2rem;
    }

    .capacity-label {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: var(--color-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .progress-bar {
      height: 4px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #fff;
      transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .progress-fill.warning { background: #fbbf24; }
    .progress-fill.danger { background: #ef4444; }

    .card-footer {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .view-link {
      font-size: 13px;
      color: var(--color-muted);
      font-weight: 500;
      transition: color 0.2s;
    }

    .warehouse-card:hover .view-link {
      color: #fff;
    }

    .empty-zen-state {
      grid-column: 1 / -1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 8rem 2rem;
      position: relative;
    }

    .empty-content {
      text-align: center;
      z-index: 1;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1.5rem;
      opacity: 0.5;
    }

    .empty-glow {
      position: absolute;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.03) 0%, transparent 70%);
      filter: blur(60px);
    }

    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 2rem;
    }

    .shimmer-card {
      height: 300px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 20px;
      animation: pulse 2s infinite ease-in-out;
    }

    @keyframes pulse {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }
  `]
})
export class WarehouseListComponent implements OnInit {
  warehouses: Warehouse[] = [];
  stockLevels: StockLevel[] = [];
  isAdmin = false;

  constructor(
    private warehouseService: WarehouseService,
    private authService: AuthService,
    private router: Router
  ) {
    this.isAdmin = ['ADMIN', 'INVENTORY MANAGER', 'MANAGER'].includes(this.authService.userRole.toUpperCase());
  }

  ngOnInit(): void { 
    this.loadData();
  }

  loadData(): void {
    this.warehouseService.getAllWarehouses().subscribe({
      next: (warehouses) => {
        this.warehouses = warehouses;
        // Load stock levels separately — if it fails, we still show warehouses
        this.warehouseService.getStockLevels().subscribe({
          next: (stock) => this.stockLevels = stock,
          error: () => this.stockLevels = []
        });
      },
      error: () => {
        this.warehouses = [];
        this.stockLevels = [];
      }
    });
  }

  getUsagePercentage(warehouse: Warehouse): number {
    if (!warehouse.capacity) return 0;
    const used = this.stockLevels
      .filter(s => s.warehouseId === warehouse.warehouseId)
      .reduce((sum, s) => sum + s.quantity, 0);
    return Math.round((used / warehouse.capacity) * 100);
  }

  onCreate(): void {
    this.router.navigate(['/warehouses/new']);
  }

  onSeed(): void {
    const seeds = [
      { name: 'Central Distribution Hub', location: 'New Delhi', address: 'Plot 45, Okhla Phase III, New Delhi', capacity: 50000, phone: '+91 11 4567 8901' },
      { name: 'Western Transit Point', location: 'Mumbai', address: 'Sector 10, Kalamboli, Navi Mumbai', capacity: 35000, phone: '+91 22 2745 6321' }
    ];

    seeds.forEach(s => {
      this.warehouseService.createWarehouse(s).subscribe(() => {
        this.loadData();
      });
    });
  }
}
