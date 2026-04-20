import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="app-container bg-dashboard animate">
    
    <div class="content-panel" style="padding: 100px 10%; justify-content: flex-start;">

      <h1 class="title" style="font-size: 48px;">Welcome back, {{ userName }}</h1>
      <p class="subtitle">Select a module to continue your inventory management operations.</p>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px;">
        <div (click)="goProfile()" style="background: var(--color-surface); border: 1px solid var(--color-border); padding: 40px; border-radius: 20px; cursor: pointer; transition: all 0.3s; height: 100%;">
          <span class="label">Identity</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Account Settings</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Update your details and security preferences.</p>
        </div>
        
        <div style="background: var(--color-surface); border: 1px solid var(--color-border); padding: 40px; border-radius: 20px; opacity: 0.5; position: relative;">
          <span class="label">System</span>
          <h3 style="font-size: 20px; margin-top: 10px;">Inventory (UC2)</h3>
          <p style="color: var(--color-muted); font-size: 13px; margin-top: 8px;">Next module: Product and stock management.</p>
          <span style="position: absolute; top: 20px; right: 20px; font-size: 10px; font-weight: 800; padding: 2px 8px; border: 1px solid var(--color-muted); border-radius: 4px;">LOCKED</span>
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

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.currentUser;
    this.userName = user?.fullName?.split(' ')[0] ?? 'User';
    this.userRole = user?.role ?? '';
  }

  goProfile(): void { this.router.navigate(['/auth/profile']); }
  logout(): void    { this.authService.logout(); }
}
