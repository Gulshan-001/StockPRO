import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovementService, Movement } from '../../services/movement.service';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-movement-history',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        
        <div style="width: 92%; max-width: 1400px; display: flex; flex-direction: column;">
          
          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="goDashboard()" class="back-link" style="cursor: pointer;">
              <span>←</span> BACK TO DASHBOARD
            </a>
          </div>

          <div class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 52px; letter-spacing: -0.04em; margin-bottom: 5px;">Movement Ledger</h1>
              <p class="subtitle" style="max-width: 700px; margin-bottom: 0; font-size: 15px; opacity: 0.7;">Verified cryptographic records of all inventory mutations across the network.</p>
            </div>
            <button class="btn btn-primary" routerLink="/movements/new" style="white-space: nowrap; padding: 12px 28px;">
              + NEW TRANSACTION
            </button>
          </div>

          <!-- Compact Filters -->
          <div style="background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); padding: 15px 25px; border-radius: 12px; border: 1px solid var(--color-border); margin-bottom: 25px; display: flex; align-items: center; gap: 20px;">
            <label class="label" style="margin-bottom: 0; color: #fff; opacity: 0.5;">FILTER BY TYPE:</label>
            <select [(ngModel)]="filterType" (change)="loadHistory()" class="input" style="width: 260px; background: rgba(0,0,0,0.5); padding: 8px 15px; border-radius: 8px;">
              <option value="">ALL TRANSACTIONS</option>
              <option value="STOCK_IN">STOCK IN (GRN)</option>
              <option value="STOCK_OUT">STOCK OUT (ISSUE)</option>
              <option value="TRANSFER_IN">TRANSFER IN</option>
              <option value="TRANSFER_OUT">TRANSFER OUT</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </div>

          <!-- Balanced Ledger Table -->
          <div style="background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; width: 100%; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-border);">
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 14%;">Timestamp</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 12%;">Type</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 12%;">Warehouse</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right; width: 8%;">Qty</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right; width: 10%;">Balance</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 28%;">Audit Notes</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 16%;">Signature</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let m of movements" style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                  <td style="padding: 16px 24px; font-family: 'Courier New', monospace; font-size: 11px; color: var(--color-muted);">
                    {{ m.movementDate | date:'yyyy.MM.dd HH:mm' }}
                  </td>
                  <td style="padding: 16px 24px;">
                    <span class="badge" [ngClass]="getBadgeClass(m.movementType)" style="padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">
                      {{ m.movementType.replace('_', ' ') }}
                    </span>
                  </td>
                  <td style="padding: 16px 24px; font-family: 'Courier New', monospace; color: var(--color-muted); font-size: 12px;">{{ m.warehouseId | slice:0:8 }}</td>
                  <td style="padding: 16px 24px; text-align: right; font-weight: 700; font-size: 15px;" [style.color]="m.quantity > 0 ? '#4ade80' : '#f87171'">
                    {{ m.quantity > 0 ? '+' : '' }}{{ m.quantity }}
                  </td>
                  <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: #fff; font-size: 15px;">
                    {{ m.balanceAfter }}
                  </td>
                  <td style="padding: 16px 24px; color: var(--color-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ m.notes || '-' }}
                  </td>
                  <td style="padding: 16px 24px; color: var(--color-muted); font-size: 10px; font-family: 'Courier New', monospace; opacity: 0.6;">
                    SYSTEM::{{ m.performedBy | slice:0:8 }}
                  </td>
                </tr>
                <tr *ngIf="movements.length === 0">
                  <td colspan="7" style="text-align: center; padding: 100px; color: var(--color-muted); font-style: italic; font-size: 13px; letter-spacing: 2px; opacity: 0.5;">
                    SYSTEM LEDGER IS CURRENTLY EMPTY
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .badge-in { background: rgba(74, 222, 128, 0.1); color: #4ade80; border: 1px solid rgba(74, 222, 128, 0.2); }
    .badge-out { background: rgba(248, 113, 113, 0.1); color: #f87171; border: 1px solid rgba(248, 113, 113, 0.2); }
    .badge-neutral { background: rgba(255, 255, 255, 0.05); color: var(--color-muted); border: 1px solid rgba(255, 255, 255, 0.1); }
    
    .content-panel {
      height: 100vh;
      overflow-y: auto;
      scrollbar-width: none;
    }
    .content-panel::-webkit-scrollbar { display: none; }
  `]
})
export class MovementHistoryComponent implements OnInit {
  movements: Movement[] = [];
  filterType = '';

  constructor(private movementService: MovementService, private router: Router) { }

  ngOnInit(): void {
    this.loadHistory();
  }

  goDashboard(): void {
    this.router.navigate(['/dashboard']);
  }

  loadHistory(): void {
    this.movementService.getHistory(undefined, undefined, this.filterType).subscribe(m => {
      this.movements = m;
    });
  }

  getBadgeClass(type: string): string {
    if (type.includes('IN')) return 'badge-in';
    if (type.includes('OUT')) return 'badge-out';
    return 'badge-neutral';
  }
}
