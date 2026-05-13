import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { NotificationBellComponent } from '../alerts/components/notification-bell/notification-bell.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NotificationBellComponent],
  template: `
  <div class="app-container bg-dashboard animate">
    
    <div class="content-panel" style="padding: 100px 10%; justify-content: flex-start;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
        <h1 class="title" style="font-size: 48px; margin-bottom: 0;">{{ welcomeTitle }}, {{ userName }}</h1>
        <app-notification-bell size="large"></app-notification-bell>
      </div>
      
      <p class="subtitle">{{ isAdmin ? 'Global system override active. Manage the enterprise ecosystem with precision.' : 'Select a module to continue your inventory management operations.' }}</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div (click)="goProfile()" [style.background]="tileBg" [style.border-color]="tileBorder" style="border-width: 1px; border-style: solid; padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" [style.color]="labelColor">Identity</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Account Settings</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Update your details and security preferences.</p>
        </div>
        
        <div (click)="goProducts()" [style.background]="tileBg" [style.border-color]="tileBorder" style="border-width: 1px; border-style: solid; padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" [style.color]="labelColor">{{ isAdmin ? 'Administrative Core' : 'System' }}</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Product Catalog</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Access master data, SKU lookup, and pricing rules.</p>
        </div>

        <div (click)="goWarehouses()" [style.background]="tileBg" [style.border-color]="tileBorder" style="border-width: 1px; border-style: solid; padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" [style.color]="labelColor">Logistics</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Warehouse Network</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Monitor stock levels and capacity across locations.</p>
        </div>

        <div (click)="goMovements()" [style.background]="tileBg" [style.border-color]="tileBorder" style="border-width: 1px; border-style: solid; padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" [style.color]="labelColor">Operations</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Stock Movements</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Execute transfers, receipts, and audit stock history.</p>
        </div>

        <div (click)="goPurchases()" [style.background]="tileBg" [style.border-color]="tileBorder" style="border-width: 1px; border-style: solid; padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" [style.color]="labelColor">Procurement</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Purchase Orders</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Manage suppliers, raise POs, and receive goods into stock.</p>
        </div>

        <div *ngIf="isAdmin || isManager" (click)="goReports()" [style.background]="tileBg" [style.border-color]="tileBorder" style="border-width: 1px; border-style: solid; padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" [style.color]="labelColor">Intelligence</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Analytics & Reports</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Inventory valuation, turnover, dead stock, and PO summaries.</p>
        </div>

        <div *ngIf="isAdmin" (click)="goAdmin()" style="background: rgba(129,140,248,0.04); border: 1px solid rgba(129,140,248,0.25); padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label" style="color: #818cf8;">Administration</span>
          <h3 style="font-size: 20px; margin-top: 10px; color: #fff;">Admin Panel</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Manage users, assign roles, and review the immutable audit trail.</p>
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 60px;">
        <button class="btn btn-ghost" (click)="logout()">Sign Out</button>
      </div>
    </div>

    <!-- Right Side: Immersive Visual (Hidden on mobile) -->
    <div class="visual-panel">
    </div>

  </div>
  `
})
export class DashboardComponent implements OnInit {
  userName = '';
  userRole = '';

  constructor(private authService: AuthService, private router: Router) { }

  get isAdmin(): boolean   { return this.userRole.toUpperCase() === 'ADMIN'; }
  get isManager(): boolean { return this.userRole.toUpperCase() === 'INVENTORY MANAGER' || this.userRole.toUpperCase() === 'MANAGER'; }

  get welcomeTitle(): string {
    if (this.isAdmin) return 'Command Authority';
    if (this.isManager) return 'Operational Orchestrator';
    return 'Welcome back';
  }

  get tileBg(): string {
    if (this.isAdmin) return 'rgba(239, 68, 68, 0.04)';   // System Crimson (Admin)
    if (this.isManager) return 'rgba(16, 185, 129, 0.04)'; // Operational Emerald (Manager)
    return 'var(--color-surface)';
  }

  get tileBorder(): string {
    if (this.isAdmin) return 'rgba(239, 68, 68, 0.25)';
    if (this.isManager) return 'rgba(16, 185, 129, 0.25)';
    return 'var(--color-border)';
  }

  get labelColor(): string {
    if (this.isAdmin) return '#ef4444';   // Admin Red
    if (this.isManager) return '#10b981'; // Manager Green
    return 'var(--color-muted)';
  }

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.userName = user?.fullName?.split(' ')[0] ?? 'User';
    this.userRole = user?.role ?? '';
  }

  goProfile(): void   { this.router.navigate(['/auth/profile']); }
  goProducts(): void  { this.router.navigate(['/products']); }
  goWarehouses(): void { this.router.navigate(['/warehouses']); }
  goMovements(): void  { this.router.navigate(['/movements']); }
  goPurchases(): void  { this.router.navigate(['/purchases']); }
  goReports(): void    { this.router.navigate(['/reports']); }
  goAlerts(): void      { this.router.navigate(['/alerts']); }
  goAdmin(): void       { this.router.navigate(['/admin/users']); }
  logout(): void        { this.authService.logout(); }
}
