import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AlertService } from '../../services/alert.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="bell-container" [class.large]="size === 'large'" [routerLink]="['/alerts']">
      <div class="bell-wrapper">
        <svg xmlns="http://www.w3.org/2000/svg" 
             [attr.width]="size === 'large' ? 32 : 20" 
             [attr.height]="size === 'large' ? 32 : 20" 
             viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bell-icon">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <div *ngIf="unreadCount > 0" class="badge animate-pop" [class.large-badge]="size === 'large'">
          {{ unreadCount > 9 ? '9+' : unreadCount }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bell-container {
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .bell-container:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .bell-container.large {
      padding: 20px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .bell-container.large:hover {
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.3);
      transform: scale(1.05);
    }

    .bell-container.large .bell-icon {
      color: #fff;
      filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.2));
    }

    .bell-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .bell-icon {
      color: #fff !important;
      opacity: 1 !important;
      transition: all 0.2s;
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.4));
    }

    .bell-container:hover .bell-icon {
      filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
      transform: scale(1.1);
    }

    .badge {
      position: absolute;
      top: -6px;
      right: -6px;
      background: #f87171;
      color: #fff;
      font-size: 10px;
      font-weight: 800;
      min-width: 16px;
      height: 16px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      border: 2px solid #000;
      box-shadow: 0 0 10px rgba(248, 113, 113, 0.3);
    }

    .large-badge {
      top: -10px;
      right: -10px;
      min-width: 22px;
      height: 22px;
      font-size: 12px;
      border-radius: 11px;
    }

    .animate-pop {
      animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
    }

    @keyframes pop {
      0% { transform: scale(0); }
      100% { transform: scale(1); }
    }
  `]
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() size: 'small' | 'large' = 'small';
  unreadCount = 0;
  private sub?: Subscription;

  constructor(private alertService: AlertService) { }

  ngOnInit(): void {
    this.sub = this.alertService.unreadCount$.subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
