import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AlertService } from '../../services/alert.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bell-container" (click)="goToAlerts()">
      <div class="bell-icon">
        <!-- SVG Bell Icon -->
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
      </div>
      <span class="bell-text">Alert Center</span>
      <div *ngIf="unreadCount > 0" class="badge">
        {{ unreadCount }} Unread
      </div>
    </div>
  `,
  styles: [`
    .bell-container {
      position: relative;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 12px 24px;
      border-radius: 30px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }
    .bell-container:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
    }
    .bell-icon {
      color: rgba(255, 255, 255, 0.9);
      display: flex;
    }
    .bell-text {
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.5px;
    }
    .badge {
      background: #ef4444;
      color: white;
      font-size: 11px;
      font-weight: bold;
      padding: 4px 10px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  unreadCount = 0;
  private intervalId: any;

  constructor(
    private alertService: AlertService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Register recipient on login so they can receive alerts
    this.alertService.registerRecipient().subscribe({
      next: () => this.fetchUnreadCount(),
      error: () => this.fetchUnreadCount() // still fetch even if it fails
    });

    // Poll every 60 seconds
    this.intervalId = setInterval(() => {
      this.fetchUnreadCount();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  fetchUnreadCount(): void {
    this.alertService.getUnreadCount().subscribe({
      next: (res) => this.unreadCount = res.count,
      error: (err) => console.error('Failed to fetch unread count', err)
    });
  }

  goToAlerts(): void {
    this.router.navigate(['/alerts']);
  }
}
