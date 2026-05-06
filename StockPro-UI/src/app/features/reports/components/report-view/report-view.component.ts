import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-report-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report-view.component.html',
  styleUrls: ['./report-view.component.css']
})
export class ReportViewComponent implements OnInit {
  reportType: string = 'dead-stock';
  reportTitle: string = 'Technical Report';
  reportData: any[] = [];
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.reportType = params['type'] || 'dead-stock';
      this.loadReport();
    });
  }

  loadReport(): void {
    this.loading = true;
    switch (this.reportType) {
      case 'dead-stock':
        this.reportTitle = 'Dead Stock Analysis (90+ Days Inactive)';
        this.reportService.getDeadStock().subscribe(data => {
          this.reportData = data;
          this.loading = false;
        });
        break;
      case 'low-stock':
        this.reportTitle = 'Inventory Shortfall & Reorder Report';
        this.reportService.getLowStockReport().subscribe(data => {
          this.reportData = data;
          this.loading = false;
        });
        break;
      case 'top-products':
        this.reportTitle = 'Market Velocity: Top Moving Products';
        this.reportService.getTopMovingProducts().subscribe(data => {
          this.reportData = data;
          this.loading = false;
        });
        break;
      default:
        this.loading = false;
    }
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}
