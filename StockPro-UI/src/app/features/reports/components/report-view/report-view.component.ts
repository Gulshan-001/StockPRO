import { Component, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';
import {
  TopMovingProduct, SlowMovingProduct, DeadStockItem,
  LowStockItem, POSummaryResult, MovementSummaryResult
} from '../../models/report.models';

type ReportType = 'top-products' | 'slow-products' | 'dead-stock' | 'low-stock' | 'po-summary' | 'movement-summary' | 'warehouse-value';

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.css']
})
export class ReportViewComponent implements OnInit {

  reportType: ReportType = 'top-products';
  reportTitle = '';

  startDate: string = '';
  endDate: string = '';
  deadStockDays = 90;

  // Data arrays
  topProducts: TopMovingProduct[] = [];
  slowProducts: SlowMovingProduct[] = [];
  deadStock: DeadStockItem[] = [];
  lowStock: LowStockItem[] = [];
  poSummary: POSummaryResult | null = null;
  movementSummary: MovementSummaryResult | null = null;

  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    this.endDate = end.toISOString().split('T')[0];
    this.startDate = start.toISOString().split('T')[0];

    this.route.queryParams.subscribe(params => {
      this.reportType = (params['type'] as ReportType) || 'top-products';
      this.setTitle();
      this.loadReport();
    });
  }

  setTitle(): void {
    const titles: Record<ReportType, string> = {
      'top-products': 'Top Moving Products',
      'slow-products': 'Slow Moving Products',
      'dead-stock': 'Dead Stock Report',
      'low-stock': 'Low Stock Report',
      'po-summary': 'Purchase Order Summary',
      'movement-summary': 'Movement Summary',
      'warehouse-value': 'Warehouse Value Breakdown'
    };
    this.reportTitle = titles[this.reportType] || 'Report';
  }

  loadReport(): void {
    this.loading = true;
    this.error = null;

    switch (this.reportType) {
      case 'top-products':
        this.reportService.getTopMovingProducts(this.startDate, this.endDate, 50).subscribe({
          next: d => { this.topProducts = d; this.loading = false; },
          error: () => { this.error = 'Failed to load report.'; this.loading = false; }
        });
        break;
      case 'slow-products':
        this.reportService.getSlowMovingProducts(this.startDate, this.endDate).subscribe({
          next: d => { this.slowProducts = d; this.loading = false; },
          error: () => { this.error = 'Failed to load report.'; this.loading = false; }
        });
        break;
      case 'dead-stock':
        this.reportService.getDeadStock(this.deadStockDays).subscribe({
          next: d => { this.deadStock = d; this.loading = false; },
          error: () => { this.error = 'Failed to load report.'; this.loading = false; }
        });
        break;
      case 'low-stock':
        this.reportService.getLowStockReport().subscribe({
          next: d => { this.lowStock = d; this.loading = false; },
          error: () => { this.error = 'Failed to load report.'; this.loading = false; }
        });
        break;
      case 'po-summary':
        this.reportService.getPOSummary(this.startDate, this.endDate).subscribe({
          next: d => { this.poSummary = d; this.loading = false; },
          error: () => { this.error = 'Failed to load report.'; this.loading = false; }
        });
        break;
      case 'movement-summary':
        this.reportService.getMovementSummary(this.startDate, this.endDate).subscribe({
          next: d => { this.movementSummary = d; this.loading = false; },
          error: () => { this.error = 'Failed to load report.'; this.loading = false; }
        });
        break;
      default:
        this.loading = false;
    }
  }

  applyFilters(): void {
    this.loadReport();
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}
