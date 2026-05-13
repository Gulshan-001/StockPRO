import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AuditLogEntry } from '../../models/admin.models';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        <div style="width: 92%; max-width: 1400px; display: flex; flex-direction: column;">

          <!-- Breadcrumb -->
          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="router.navigate(['/dashboard'])" class="back-link" style="cursor: pointer;">← BACK TO DASHBOARD</a>
            <span style="color: var(--color-muted); margin: 0 10px;">|</span>
            <a (click)="router.navigate(['/admin/users'])" class="back-link" style="cursor: pointer;">USER MANAGEMENT →</a>
          </div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 52px; letter-spacing: -0.04em; margin-bottom: 5px;">
                Audit Log
              </h1>
              <p class="subtitle" style="max-width: 700px; margin-bottom: 0; font-size: 15px; opacity: 0.7;">
                Immutable · Tamper-proof record of all critical system operations.
              </p>
            </div>
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
              <div style="font-size: 10px; letter-spacing: 2px; color: var(--color-muted); text-transform: uppercase;">Records Loaded</div>
              <div style="font-size: 36px; font-weight: 800; font-family: 'Outfit', sans-serif; color: #fff; letter-spacing: -0.03em;">{{ logs.length }}</div>
            </div>
          </div>

          <!-- Filter Panel -->
          <div class="filter-panel" style="margin-bottom: 24px;">
            <h3 class="section-label">FILTER AUDIT TRAIL</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr auto; gap: 12px; align-items: end;">
              <div class="form-field" style="margin-bottom: 0;">
                <label class="label">USER ID</label>
                <input [(ngModel)]="filter.userId" class="input" placeholder="User ID...">
              </div>
              <div class="form-field" style="margin-bottom: 0;">
                <label class="label">ACTION</label>
                <input [(ngModel)]="filter.action" class="input" placeholder="e.g. ASSIGN_ROLE">
              </div>
              <div class="form-field" style="margin-bottom: 0;">
                <label class="label">ENTITY</label>
                <select [(ngModel)]="filter.entityName" class="input" style="background: rgba(0,0,0,0.5);">
                  <option value="">Any Entity</option>
                  <option value="ApplicationUser">ApplicationUser</option>
                  <option value="StockMovement">StockMovement</option>
                  <option value="PurchaseOrder">PurchaseOrder</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Product">Product</option>
                </select>
              </div>
              <div class="form-field" style="margin-bottom: 0;">
                <label class="label">FROM DATE</label>
                <input [(ngModel)]="filter.fromDate" class="input" type="datetime-local">
              </div>
              <div class="form-field" style="margin-bottom: 0;">
                <label class="label">TO DATE</label>
                <input [(ngModel)]="filter.toDate" class="input" type="datetime-local">
              </div>
              <div style="display: flex; gap: 8px;">
                <button class="btn btn-primary" (click)="loadLogs()" style="padding: 10px 20px; white-space: nowrap;">
                  {{ loading ? 'LOADING...' : 'APPLY' }}
                </button>
                <button class="btn btn-ghost" (click)="clearFilter()" style="padding: 10px 16px;">
                  RESET
                </button>
              </div>
            </div>
          </div>

          <!-- Quick-filter chips -->
          <div style="display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap;">
            <span style="font-size: 10px; color: var(--color-muted); letter-spacing: 1px; align-self: center; text-transform: uppercase;">Quick:</span>
            <button *ngFor="let chip of quickFilters"
                    (click)="applyQuickFilter(chip.action)"
                    class="chip-btn"
                    [class.chip-active]="filter.action === chip.action">
              {{ chip.label }}
            </button>
          </div>

          <!-- Audit Log Table -->
          <div style="background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden;">

            <!-- Loading -->
            <div *ngIf="loading" style="text-align: center; padding: 80px; color: var(--color-muted); font-size: 12px; letter-spacing: 2px;">
              FETCHING AUDIT RECORDS...
            </div>

            <table *ngIf="!loading" style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-border);">
                  <th class="th-cell" style="width: 16%;">TIMESTAMP</th>
                  <th class="th-cell" style="width: 18%;">ACTOR</th>
                  <th class="th-cell" style="width: 16%;">ACTION</th>
                  <th class="th-cell" style="width: 14%;">ENTITY</th>
                  <th class="th-cell" style="width: 18%;">BEFORE</th>
                  <th class="th-cell" style="width: 18%;">AFTER</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let log of logs"
                    style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.03)'"
                    onmouseout="this.style.background='transparent'">

                  <!-- Timestamp -->
                  <td style="padding: 12px 24px;">
                    <div style="font-family: 'Courier New', monospace; font-size: 11px; color: #fff;">
                      {{ log.timestamp | date:'yyyy.MM.dd' }}
                    </div>
                    <div style="font-family: 'Courier New', monospace; font-size: 10px; color: var(--color-muted); margin-top: 2px;">
                      {{ log.timestamp | date:'HH:mm:ss' }}
                    </div>
                  </td>

                  <!-- Actor -->
                  <td style="padding: 12px 24px; overflow: hidden;">
                    <div style="font-weight: 600; color: #fff; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ log.userFullName || '—' }}
                    </div>
                    <div style="font-family: 'Courier New', monospace; font-size: 10px; color: var(--color-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                      {{ log.userEmail || log.userId | slice:0:24 }}
                    </div>
                  </td>

                  <!-- Action -->
                  <td style="padding: 12px 24px;">
                    <span [ngClass]="getActionBadge(log.action || '')">
                      {{ log.action || '—' }}
                    </span>
                  </td>

                  <!-- Entity -->
                  <td style="padding: 12px 24px;">
                    <div style="font-size: 12px; color: #fff;">{{ log.entityName || '—' }}</div>
                    <div *ngIf="log.entityId" style="font-family: 'Courier New', monospace; font-size: 9px; color: var(--color-muted); margin-top: 2px;">
                      {{ log.entityId | slice:0:12 }}...
                    </div>
                  </td>

                  <!-- Old Value -->
                  <td style="padding: 12px 24px;">
                    <div *ngIf="log.oldValue; else noOld"
                         class="value-cell old-value"
                         [title]="log.oldValue">
                      {{ log.oldValue | slice:0:40 }}{{ (log.oldValue || '').length > 40 ? '...' : '' }}
                    </div>
                    <ng-template #noOld>
                      <span style="color: var(--color-muted); font-size: 11px;">—</span>
                    </ng-template>
                  </td>

                  <!-- New Value -->
                  <td style="padding: 12px 24px;">
                    <div *ngIf="log.newValue; else noNew"
                         class="value-cell new-value"
                         [title]="log.newValue">
                      {{ log.newValue | slice:0:40 }}{{ (log.newValue || '').length > 40 ? '...' : '' }}
                    </div>
                    <ng-template #noNew>
                      <span style="color: var(--color-muted); font-size: 11px;">—</span>
                    </ng-template>
                  </td>
                </tr>

                <tr *ngIf="logs.length === 0 && !loading">
                  <td colspan="6" style="text-align: center; padding: 100px; color: var(--color-muted); font-size: 12px; letter-spacing: 2px; opacity: 0.5;">
                    NO AUDIT RECORDS FOUND FOR THE SELECTED FILTERS
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 14px; font-size: 11px; color: var(--color-muted); letter-spacing: 1px; display: flex; justify-content: space-between;">
            <span>IMMUTABLE AUDIT TRAIL · RECORDS ARE READ-ONLY · MAX 500 PER QUERY</span>
            <span>{{ logs.length }} RECORDS SHOWN</span>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-panel { height: 100vh; overflow-y: auto; scrollbar-width: none; }
    .content-panel::-webkit-scrollbar { display: none; }

    .filter-panel {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 24px 28px;
    }
    .section-label {
      font-size: 10px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--color-muted);
      margin-bottom: 18px;
    }
    .th-cell {
      padding: 14px 24px;
      font-size: 10px;
      text-transform: uppercase;
      color: var(--color-muted);
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Quick filter chips */
    .chip-btn {
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      border: 1px solid var(--color-border);
      background: transparent;
      color: var(--color-muted);
      transition: all 0.2s;
    }
    .chip-btn:hover  { background: rgba(255,255,255,0.05); color: #fff; }
    .chip-active { background: rgba(255,255,255,0.08) !important; color: #fff !important; border-color: rgba(255,255,255,0.3) !important; }

    /* Action badges */
    .action-create   { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
    .action-update   { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(251,191,36,0.1); color: #fbbf24; border: 1px solid rgba(251,191,36,0.3); }
    .action-role     { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(129,140,248,0.1); color: #818cf8; border: 1px solid rgba(129,140,248,0.3); }
    .action-deact    { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
    .action-default  { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(255,255,255,0.06); color: #aaa; border: 1px solid rgba(255,255,255,0.1); }

    /* Value diff cells */
    .value-cell  { font-family: 'Courier New', monospace; font-size: 11px; border-radius: 4px; padding: 4px 8px; }
    .old-value   { background: rgba(248,113,113,0.08); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
    .new-value   { background: rgba(74,222,128,0.08); color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
  `]
})
export class AuditLogComponent implements OnInit {
  logs: AuditLogEntry[] = [];
  loading = false;

  filter = {
    userId: '',
    action: '',
    entityName: '',
    fromDate: '',
    toDate: ''
  };

  quickFilters = [
    { label: 'All',         action: '' },
    { label: 'Create User', action: 'CREATE_USER' },
    { label: 'Role Change', action: 'ASSIGN_ROLE' },
    { label: 'Deactivated', action: 'DEACTIVATE_USER' },
    { label: 'Reactivated', action: 'REACTIVATE_USER' },
    { label: 'Updated',     action: 'UPDATE_USER' }
  ];

  constructor(
    private adminService: AdminService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    const f: any = {};
    if (this.filter.userId)     f.userId     = this.filter.userId;
    if (this.filter.action)     f.action     = this.filter.action;
    if (this.filter.entityName) f.entityName = this.filter.entityName;
    if (this.filter.fromDate)   f.fromDate   = new Date(this.filter.fromDate).toISOString();
    if (this.filter.toDate)     f.toDate     = new Date(this.filter.toDate).toISOString();

    this.adminService.getAuditLogs(f).subscribe({
      next: (logs) => { this.logs = logs; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyQuickFilter(action: string): void {
    this.filter.action = action;
    this.loadLogs();
  }

  clearFilter(): void {
    this.filter = { userId: '', action: '', entityName: '', fromDate: '', toDate: '' };
    this.loadLogs();
  }

  getActionBadge(action: string): string {
    if (action.includes('CREATE'))     return 'action-create';
    if (action.includes('UPDATE'))     return 'action-update';
    if (action.includes('ROLE'))       return 'action-role';
    if (action.includes('DEACTIVATE')) return 'action-deact';
    if (action.includes('REACTIVATE')) return 'action-create';
    return 'action-default';
  }
}
