import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
<div class="app-container bg-auth">
  
  <div class="content-panel auth-panel animate">

    <h1 class="title" style="font-size: 28px;">Get started</h1>
    <p class="subtitle">Join the ecosystem. Securely initialize your workspace access.</p>

    <div *ngIf="errorMessage" class="text-error" style="margin-bottom: 20px; font-weight: 500;">
      {{ errorMessage }}
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()" novalidate style="max-width: 440px; width: 100%;">
      
      <div class="form-group">
        <label class="label">Full Name</label>
        <input type="text" formControlName="fullName" class="input" placeholder="Your name">
      </div>

      <div class="form-group">
        <label class="label">Email Address</label>
        <input type="email" formControlName="email" class="input" placeholder="you@company.com">
      </div>

      <div class="form-group">
        <label class="label">Password</label>
        <input [type]="showPassword ? 'text' : 'password'" formControlName="password" class="input" placeholder="••••••••">
      </div>

      <!-- Informational Role Banner -->
      <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); padding: 16px; border-radius: 12px; margin-top: 24px;">
        <p style="font-size: 11px; line-height: 1.5; color: var(--color-muted); margin: 0;">
          <strong style="color: #fff; display: block; margin-bottom: 4px;">Security Notice:</strong>
          All new accounts are initialized with <span style="color: #fff; font-weight: 600;">Staff</span> clearance. High-level access must be authorized by an Administrator.
        </p>
      </div>

      <button type="submit" class="btn btn-primary" [disabled]="form.invalid || isLoading" style="width: 100%; margin-top: 24px;">
        {{ isLoading ? 'Initializing...' : 'Create Account' }}
      </button>

    </form>

    <p style="margin-top: 30px; font-size: 13px; color: var(--color-muted);">
      Already a member? <a routerLink="/auth/login" style="color: #fff; font-weight: 600;">Sign in</a>
    </p>
  </div>

  <div class="visual-panel">
  </div>

</div>
  `,
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.form = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*\d).+$/)]]
    });
  }

  onSubmit(): void {
    if (this.form.invalid || this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    // Backend defaults to STAFF automatically
    this.authService.register(this.form.value).subscribe({
      next: () => {
        this.isLoading = false;
        this.successMessage = 'Access initialized. Redirecting to vault...';
        setTimeout(() => this.router.navigate(['/auth/login']), 1800);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message ?? 'Registration failed. Please try again.';
      }
    });
  }

  togglePassword(): void { this.showPassword = !this.showPassword; }
  get fullNameCtrl() { return this.form.get('fullName'); }
  get emailCtrl()    { return this.form.get('email'); }
  get passwordCtrl() { return this.form.get('password'); }
}
