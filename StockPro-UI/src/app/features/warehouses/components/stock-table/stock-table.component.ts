import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StockLevel } from '../../models/warehouse.model';

@Component({
  selector: 'app-stock-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stock-table-container">
      <div class="table-actions" *ngIf="showActions">
        <div class="search-box">
          <input type="text" placeholder="Search product..." (input)="onSearch($event)">
        </div>
      </div>

      <div class="table-wrapper">
        <table class="premium-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Quantity</th>
              <th>Reserved</th>
              <th>Available</th>
              <th>Location</th>
              <th>Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let stock of stockLevels" class="table-row">
              <td class="product-cell">
                <div class="product-name">{{ stock.productName }}</div>
              </td>
              <td><span class="sku-badge">{{ stock.productSKU }}</span></td>
              <td><span class="qty-value">{{ stock.quantity }}</span></td>
              <td><span class="reserved-value">{{ stock.reservedQuantity }}</span></td>
              <td>
                <span class="available-badge" 
                      [class.low]="stock.availableQuantity < 10"
                      [class.out]="stock.availableQuantity === 0">
                  {{ stock.availableQuantity }}
                </span>
              </td>
              <td>{{ stock.location || '-' }}</td>
              <td class="date-cell">{{ stock.lastUpdated | date:'short' }}</td>
            </tr>
            <tr *ngIf="stockLevels.length === 0">
              <td colspan="7" class="empty-state">
                <div class="empty-content">
                  <p>No stock found in this warehouse.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .stock-table-container {
      background: rgba(15, 23, 42, 0.3);
      border-radius: 1rem;
      border: 1px solid rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .premium-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    .premium-table th {
      background: rgba(30, 41, 59, 0.5);
      padding: 1rem 1.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .premium-table td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #e2e8f0;
      font-size: 0.95rem;
    }

    .table-row {
      transition: background 0.2s;
    }

    .table-row:hover {
      background: rgba(59, 130, 246, 0.05);
    }

    .product-name {
      font-weight: 600;
      color: #f1f5f9;
    }

    .sku-badge {
      background: rgba(51, 65, 85, 0.5);
      padding: 0.2rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.8rem;
      font-family: monospace;
      color: #cbd5e1;
    }

    .available-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-weight: 600;
      font-size: 0.85rem;
      background: rgba(34, 197, 94, 0.15);
      color: #4ade80;
    }

    .available-badge.low {
      background: rgba(251, 191, 36, 0.15);
      color: #fbbf24;
    }

    .available-badge.out {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .empty-state {
      padding: 4rem;
      text-align: center;
      color: #64748b;
    }

    .date-cell {
      color: #64748b;
      font-size: 0.85rem;
    }
  `]
})
export class StockTableComponent implements OnInit {
  @Input() stockLevels: StockLevel[] = [];
  @Input() showActions: boolean = true;

  constructor() {}

  ngOnInit(): void {}

  onSearch(event: any): void {
    // Implement local search if needed
  }
}
