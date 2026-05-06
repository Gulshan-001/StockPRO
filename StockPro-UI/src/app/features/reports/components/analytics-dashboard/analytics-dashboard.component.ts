import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportService } from '../../services/report.service';
import {
  InventoryValueResult,
  WarehouseValueResult,
  TurnoverResult,
  TopMovingProduct,
  DeadStockItem,
  LowStockItem,
  MovementSummaryResult
} from '../../models/report.models';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {

  // ─── KPI State ──────────────────────────────────────────────────────────────
  inventoryValue: InventoryValueResult | null = null;
  turnover: TurnoverResult | null = null;
  deadStockCount = 0;
  lowStockCount = 0;
  movementSummary: MovementSummaryResult | null = null;

  // ─── Chart Data ─────────────────────────────────────────────────────────────
  topProducts: TopMovingProduct[] = [];
  warehouseValues: WarehouseValueResult[] = [];
  deadStockItems: DeadStockItem[] = [];
  lowStockItems: LowStockItem[] = [];

  // ─── Date Filters ───────────────────────────────────────────────────────────
  startDate: string = '';
  endDate: string = '';

  // ─── UI State ───────────────────────────────────────────────────────────────
  loading = true;
  error: string | null = null;
  activeTab: 'overview' | 'products' | 'deadstock' | 'movements' = 'overview';
  snapshotLoading = false;
  snapshotMessage: string | null = null;

  constructor(
    private reportService: ReportService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Default: last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.endDate = this.formatDate(end);
    this.startDate = this.formatDate(start);

    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    this.error = null;

    // Load KPI data in parallel
    this.reportService.getTotalStockValue().subscribe({
      next: v => this.inventoryValue = v,
      error: () => this.error = 'Failed to load inventory value.'
    });

    this.reportService.getInventoryTurnover(this.startDate, this.endDate).subscribe({
      next: t => this.turnover = t,
      error: () => {}
    });

    this.reportService.getTopMovingProducts(this.startDate, this.endDate, 10).subscribe({
      next: p => this.topProducts = p,
      error: () => {}
    });

    this.reportService.getStockValueByWarehouse().subscribe({
      next: w => this.warehouseValues = w,
      error: () => {}
    });

    this.reportService.getDeadStock(90).subscribe({
      next: d => {
        this.deadStockItems = d.slice(0, 5);
        this.deadStockCount = d.length;
      },
      error: () => {}
    });

    this.reportService.getLowStockReport().subscribe({
      next: l => {
        this.lowStockItems = l.slice(0, 5);
        this.lowStockCount = l.length;
      },
      error: () => {}
    });

    this.reportService.getMovementSummary(this.startDate, this.endDate).subscribe({
      next: m => {
        this.movementSummary = m;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  applyFilters(): void {
    this.loadAllData();
  }

  setTab(tab: 'overview' | 'products' | 'deadstock' | 'movements'): void {
    this.activeTab = tab;
  }

  viewFullReport(type: string): void {
    this.router.navigate(['/reports/view'], { queryParams: { type } });
  }

  takeSnapshot(): void {
    this.snapshotLoading = true;
    this.snapshotMessage = null;
    this.reportService.takeSnapshot().subscribe({
      next: r => {
        this.snapshotMessage = `✓ Snapshot created: ${r.recordsWritten} records for ${r.snapshotDate}`;
        this.snapshotLoading = false;
        this.loadAllData();
      },
      error: () => {
        this.snapshotMessage = '✗ Snapshot failed. Check service connectivity.';
        this.snapshotLoading = false;
      }
    });
  }

  getMaxMovement(): number {
    return this.topProducts.length > 0
      ? Math.max(...this.topProducts.map(p => p.totalUnitsMoved))
      : 1;
  }

  getBarWidth(product: TopMovingProduct): string {
    const max = this.getMaxMovement();
    return `${(product.totalUnitsMoved / max) * 100}%`;
  }

  getWarehouseTotalValue(): number {
    return this.warehouseValues.reduce((sum, w) => sum + w.stockValue, 0) || 1;
  }

  getWarehousePercent(value: number): number {
    return Math.round((value / this.getWarehouseTotalValue()) * 100);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
