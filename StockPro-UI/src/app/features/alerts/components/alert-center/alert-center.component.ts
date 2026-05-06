import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { Alert } from '../../models/alert.model';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        <div style="width: 92%; max-width: 1200px; display: flex; flex-direction: column;">

          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="router.navigate(['/dashboard'])" class="back-link" style="cursor: pointer;">← BACK TO DASHBOARD</a>
          </div>

          <div class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 52px; letter-spacing: -0.04em; margin-bottom: 5px;">Alert Center</h1>
              <p class="subtitle" style="max-width: 700px; margin-bottom: 0; font-size: 15px; opacity: 0.7;">System notifications, warnings, and required actions.</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <button *ngIf="unreadAlerts.length > 0" class="btn btn-outline" (click)="markAllRead()" style="padding: 12px 20px; font-size: 12px;">MARK ALL READ</button>
            </div>
          </div>

          <!-- Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 25px; border-bottom: 1px solid var(--color-border); padding-bottom: 0;">
            <button *ngFor="let tab of tabs" (click)="selectTab(tab.value)"
              style="padding: 10px 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: none; cursor: pointer; background: transparent; border-bottom: 2px solid transparent; transition: all 0.2s;"
              [style.color]="activeTab === tab.value ? '#fff' : 'var(--color-muted)'"
              [style.border-bottom-color]="activeTab === tab.value ? '#fff' : 'transparent'">
              {{ tab.label }}
            </button>
          </div>

          <!-- Alerts List -->
          <div style="display: flex; flex-direction: column; gap: 15px;">
            <div *ngFor="let alert of filteredAlerts" 
                 class="alert-card" 
                 [ngClass]="'severity-' + alert.severity.toLowerCase() + (alert.isRead ? ' read' : ' unread')">
              
              <div class="alert-content">
                <div class="alert-header">
                  <span class="alert-title">{{ alert.title }}</span>
                  <span class="alert-badge" [ngClass]="'badge-' + alert.severity.toLowerCase()">{{ alert.severity }}</span>
                  <span class="alert-time">{{ alert.createdAt | date:'MMM d, HH:mm' }}</span>
                </div>
                <div class="alert-message">{{ alert.message }}</div>
              </div>

              <div class="alert-actions">
                <button *ngIf="!alert.isRead" class="btn btn-ghost" (click)="markRead(alert)" style="padding: 6px 12px; font-size: 11px;">MARK READ</button>
                <button *ngIf="!alert.isAcknowledged" class="btn btn-outline" (click)="acknowledge(alert)" style="padding: 6px 12px; font-size: 11px;">ACKNOWLEDGE</button>
              </div>
            </div>

            <div *ngIf="filteredAlerts.length === 0" style="text-align: center; padding: 100px; color: var(--color-muted); background: rgba(255,255,255,0.02); border: 1px dashed var(--color-border); border-radius: 12px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 15px; opacity: 0.5;">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              <h3 style="font-size: 16px; font-weight: 600; margin-bottom: 5px; color: #fff;">All Clear</h3>
              <p style="font-size: 13px;">No alerts found for this filter. You're all caught up.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .alert-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 25px;
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(10px);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      transition: all 0.2s;
    }
    .alert-card:hover {
      background: rgba(255,255,255,0.05);
    }
    .alert-card.read {
      opacity: 0.7;
    }
    .alert-card.unread {
      background: rgba(255,255,255,0.06);
    }
    .alert-content {
      flex: 1;
      padding-right: 20px;
    }
    .alert-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }
    .alert-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
    }
    .alert-time {
      font-size: 12px;
      color: var(--color-muted);
      font-family: 'Courier New', monospace;
    }
    .alert-message {
      font-size: 14px;
      color: rgba(255,255,255,0.8);
      line-height: 1.5;
    }
    .alert-badge {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 3px 8px;
      border-radius: 4px;
    }
    .alert-actions {
      display: flex;
      gap: 10px;
    }
    
    /* Severities */
    .severity-critical { border-left: 4px solid #f87171; }
    .severity-warning { border-left: 4px solid #facc15; }
    .severity-info { border-left: 4px solid #60a5fa; }
    
    .badge-critical { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
    .badge-warning { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid rgba(250,204,21,0.3); }
    .badge-info { background: rgba(96,165,250,0.1); color: #60a5fa; border: 1px solid rgba(96,165,250,0.3); }
  `]
})
export class AlertCenterComponent implements OnInit {
  alerts: Alert[] = [];
  activeTab = 'ALL';

  tabs = [
    { label: 'All Alerts', value: 'ALL' },
    { label: 'Unread', value: 'UNREAD' },
    { label: 'Critical', value: 'CRITICAL' },
    { label: 'Acknowledged', value: 'ACKNOWLEDGED' }
  ];

  constructor(
    private alertService: AlertService,
    public router: Router
  ) {}

  ngOnInit(): void {
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.alertService.getAlerts().subscribe({
      next: (data) => this.alerts = data,
      error: (err) => console.error('Failed to load alerts', err)
    });
  }

  get filteredAlerts(): Alert[] {
    switch(this.activeTab) {
      case 'UNREAD': return this.alerts.filter(a => !a.isRead && !a.isAcknowledged);
      case 'CRITICAL': return this.alerts.filter(a => a.severity === 'CRITICAL' && !a.isAcknowledged);
      case 'ACKNOWLEDGED': return this.alerts.filter(a => a.isAcknowledged);
      default: return this.alerts.filter(a => !a.isAcknowledged); // ALL pending by default
    }
  }

  get unreadAlerts(): Alert[] {
    return this.alerts.filter(a => !a.isRead && !a.isAcknowledged);
  }

  selectTab(tab: string): void {
    this.activeTab = tab;
  }

  markRead(alert: Alert): void {
    this.alertService.markAsRead(alert.alertId).subscribe(() => {
      alert.isRead = true;
    });
  }

  acknowledge(alert: Alert): void {
    this.alertService.acknowledge(alert.alertId).subscribe(() => {
      alert.isRead = true;
      alert.isAcknowledged = true;
      // remove from current view if we are not on ACKNOWLEDGED tab
      if (this.activeTab !== 'ACKNOWLEDGED') {
        this.alerts = this.alerts.filter(a => a.alertId !== alert.alertId);
      }
    });
  }

  markAllRead(): void {
    const unreads = this.unreadAlerts;
    unreads.forEach(a => {
      this.alertService.markAsRead(a.alertId).subscribe(() => a.isRead = true);
    });
  }
}
