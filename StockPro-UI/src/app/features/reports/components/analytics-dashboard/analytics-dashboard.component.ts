import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import {
  InventoryValueResult,
  WarehouseValueResult,
  TurnoverResult,
  TopMovingProduct,
  DeadStockItem,
  MovementSummaryResult,
  LowStockItem
} from '../../models/report.models';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {
  // KPI Data
  inventoryValue?: InventoryValueResult;
  turnover?: TurnoverResult;
  deadStock: DeadStockItem[] = [];
  lowStock: LowStockItem[] = [];

  // Visuals
  warehouseDistribution: WarehouseValueResult[] = [];
  topProducts: TopMovingProduct[] = [];
  movementSummary?: MovementSummaryResult;

  // Filters
  startDate: string = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
  endDate: string = new Date().toISOString().split('T')[0];

  loading = false;
  activeTab: 'overview' | 'movement' | 'inventory' = 'overview';
  snapshotStatus: string | null = null;

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadAllData();
  }

  loadAllData(): void {
    this.loading = true;
    
    // Load KPIs
    this.reportService.getTotalStockValue().subscribe(data => this.inventoryValue = data);
    this.reportService.getInventoryTurnover(this.startDate, this.endDate).subscribe(data => this.turnover = data);
    this.reportService.getDeadStock(90).subscribe(data => this.deadStock = data);
    this.reportService.getLowStockReport().subscribe(data => this.lowStock = data);

    // Load Charts
    this.reportService.getStockValueByWarehouse().subscribe(data => {
      this.warehouseDistribution = data.sort((a, b) => b.stockValue - a.stockValue);
    });
    
    this.reportService.getTopMovingProducts(this.startDate, this.endDate, 5).subscribe(data => {
      this.topProducts = data;
    });

    this.reportService.getMovementSummary(this.startDate, this.endDate)
      .pipe(finalize(() => this.loading = false))
      .subscribe(data => this.movementSummary = data);
  }

  applyFilters(): void {
    this.loadAllData();
  }

  setTab(tab: 'overview' | 'movement' | 'inventory'): void {
    this.activeTab = tab;
  }

  takeSnapshot(): void {
    this.snapshotStatus = 'Processing snapshot...';
    this.reportService.takeSnapshot().subscribe({
      next: (res) => {
        this.snapshotStatus = `Snapshot complete! ${res.recordsWritten} records captured.`;
        setTimeout(() => this.snapshotStatus = null, 5000);
        this.loadAllData();
      },
      error: () => {
        this.snapshotStatus = 'Error creating snapshot.';
        setTimeout(() => this.snapshotStatus = null, 5000);
      }
    });
  }

  getPercentage(val: number, total: number): string {
    if (!total) return '0%';
    return Math.min(100, Math.round((val / total) * 100)) + '%';
  }

  getMaxValue(arr: WarehouseValueResult[]): number {
    return Math.max(...arr.map(a => a.stockValue), 1);
  }

  getMaxMovement(arr: TopMovingProduct[]): number {
    return Math.max(...arr.map(a => a.totalUnitsMoved), 1);
  }
}
