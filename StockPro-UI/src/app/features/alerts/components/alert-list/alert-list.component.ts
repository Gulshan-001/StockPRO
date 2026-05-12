import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert.model';

@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container bg-inventory animate">
      <div class="content-panel" style="grid-template-columns: 1fr; width: 100%; max-width: 1200px; margin: 0 auto;">
        
        <div class="navigation-trail">
          <a routerLink="/dashboard" class="back-link">← DASHBOARD</a>
        </div>

        <header style="margin-bottom: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div>
            <h1 class="title" style="font-size: 52px; letter-spacing: -0.04em;">Notification Center</h1>
            <p class="subtitle" style="max-width: 600px; margin-bottom: 0;">Real-time intelligence on inventory anomalies and system events.</p>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 10px; letter-spacing: 2px; color: var(--color-muted); text-transform: uppercase; margin-bottom: 4px;">Status</div>
            <div style="font-size: 18px; font-weight: 700; color: #4ade80;">System Monitoring Active</div>
          </div>
        </header>

        <div class="alert-stack">
          <div *ngIf="loading" style="padding: 100px; text-align: center; color: var(--color-muted); letter-spacing: 2px;">SYNCHRONIZING FEED...</div>
          
          <div *ngIf="!loading && alerts.length === 0" class="empty-state">
            <div style="font-size: 60px; margin-bottom: 20px; opacity: 0.2;">✓</div>
            <h3 style="font-size: 24px; font-weight: 700; margin-bottom: 10px;">Zero Anomalies Detected</h3>
            <p style="color: var(--color-muted); max-width: 400px; margin: 0 auto;">Your inventory ecosystem is currently operating within optimal parameters.</p>
          </div>

          <div *ngFor="let alert of alerts" 
               class="alert-card" 
               [class.unread]="!alert.isRead"
               [class.critical]="alert.severity === 'CRITICAL'"
               [class.warning]="alert.severity === 'WARNING'">
            
            <div class="alert-icon">
              <span *ngIf="alert.severity === 'CRITICAL'">⚠</span>
              <span *ngIf="alert.severity === 'WARNING'">⚡</span>
              <span *ngIf="alert.severity === 'INFO'">ℹ</span>
              <span *ngIf="alert.type === 'SYSTEM'">⚙</span>
            </div>

            <div class="alert-content">
              <div class="alert-meta">
                <span class="alert-type">{{ alert.type.replace('_', ' ') }}</span>
                <span class="alert-date">{{ alert.createdAt | date:'MMM d, HH:mm' }}</span>
              </div>
              <h3 class="alert-title">{{ alert.title }}</h3>
              <p class="alert-message">{{ alert.message }}</p>
              
              <div class="alert-actions">
                <button *ngIf="!alert.isRead" (click)="markAsRead(alert)" class="action-btn">Mark as Read</button>
                <button *ngIf="!alert.isAcknowledged" (click)="acknowledge(alert)" class="action-btn primary">Acknowledge</button>
                <a *ngIf="alert.relatedProductId" [routerLink]="['/products', alert.relatedProductId]" class="action-btn ghost">View Product</a>
                <a *ngIf="alert.relatedWarehouseId" [routerLink]="['/warehouses', alert.relatedWarehouseId]" class="action-btn ghost">View Warehouse</a>
              </div>
            </div>

            <div *ngIf="!alert.isRead" class="unread-dot"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .alert-stack {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .alert-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      padding: 24px;
      display: flex;
      gap: 20px;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .alert-card:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.2);
      transform: translateX(4px);
    }

    .alert-card.unread {
      background: rgba(255, 255, 255, 0.06);
      border-left: 4px solid #fff;
    }

    .alert-card.warning { border-left: 4px solid #fbbf24; }
    .alert-card.critical { border-left: 4px solid #f87171; background: rgba(248, 113, 113, 0.04); }

    .alert-icon {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .alert-content { flex: 1; }

    .alert-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .alert-type {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--color-muted);
    }

    .alert-date {
      font-size: 11px;
      color: var(--color-muted);
    }

    .alert-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 6px;
      color: #fff;
    }

    .alert-message {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
      line-height: 1.5;
      margin-bottom: 20px;
    }

    .alert-actions {
      display: flex;
      gap: 12px;
    }

    .action-btn {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: var(--color-muted);
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: rgba(255, 255, 255, 0.05);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .action-btn.primary {
      background: #fff;
      color: #000;
      border: none;
    }

    .action-btn.ghost {
      border: none;
      padding: 6px 0;
      text-decoration: none;
    }

    .unread-dot {
      width: 10px;
      height: 10px;
      background: #f87171;
      border-radius: 50%;
      position: absolute;
      top: 24px;
      right: 24px;
      box-shadow: 0 0 10px rgba(248, 113, 113, 0.5);
    }

    .empty-state {
      padding: 100px;
      text-align: center;
      border: 1px dashed var(--color-border);
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.01);
    }
  `]
})
export class AlertListComponent implements OnInit {
  alerts: Alert[] = [];
  loading = true;

  constructor(private alertService: AlertService) { }

  ngOnInit(): void {
    this.loadAlerts();
    this.alertService.registerRecipient().subscribe();
  }

  loadAlerts(): void {
    this.loading = true;
    this.alertService.getAlerts().subscribe({
      next: (data) => {
        this.alerts = data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  markAsRead(alert: Alert): void {
    this.alertService.markAsRead(alert.alertId).subscribe(() => {
      alert.isRead = true;
    });
  }

  acknowledge(alert: Alert): void {
    this.alertService.acknowledge(alert.alertId).subscribe(() => {
      alert.isAcknowledged = true;
      alert.isRead = true;
    });
  }
}
