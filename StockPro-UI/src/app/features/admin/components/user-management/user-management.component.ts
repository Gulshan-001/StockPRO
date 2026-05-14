import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { AdminUser, CreateUserRequest, AssignRoleRequest } from '../../models/admin.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        <div style="width: 92%; max-width: 1400px; display: flex; flex-direction: column;">

          <!-- Breadcrumb -->
          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="router.navigate(['/dashboard'])" class="back-link" style="cursor: pointer;">← BACK TO DASHBOARD</a>
            <span style="color: var(--color-muted); margin: 0 10px;">|</span>
            <a (click)="router.navigate(['/admin/audit'])" class="back-link" style="cursor: pointer;">AUDIT LOGS →</a>
          </div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 52px; letter-spacing: -0.04em; margin-bottom: 5px;">
                User Management
              </h1>
              <p class="subtitle" style="max-width: 700px; margin-bottom: 0; font-size: 15px; opacity: 0.7;">
                Admin-only · Manage identities, roles, and account access across the platform.
              </p>
            </div>
            <button class="btn btn-primary" (click)="openCreateForm()" style="padding: 12px 24px; white-space: nowrap;">
              + CREATE USER
            </button>
          </div>

          <!-- Stats Bar -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;">
            <div class="stat-card">
              <div class="stat-label">TOTAL USERS</div>
              <div class="stat-value">{{ users.length }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">ACTIVE</div>
              <div class="stat-value" style="color: #4ade80;">{{ activeCount }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">INACTIVE</div>
              <div class="stat-value" style="color: #f87171;">{{ inactiveCount }}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">ADMINS</div>
              <div class="stat-value" style="color: #818cf8;">{{ adminCount }}</div>
            </div>
          </div>

          <!-- Create User Form -->
          <div *ngIf="showCreateForm" class="form-panel" style="margin-bottom: 24px;">
            <h3 class="section-label">CREATE NEW USER</h3>
            <form [formGroup]="createForm" (ngSubmit)="submitCreate()">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 14px; margin-bottom: 16px;">
                <div class="form-field">
                  <label class="label">FULL NAME *</label>
                  <input formControlName="fullName" class="input" placeholder="John Doe">
                </div>
                <div class="form-field">
                  <label class="label">EMAIL *</label>
                  <input formControlName="email" class="input" type="email" placeholder="user@company.com">
                </div>
                <div class="form-field">
                  <label class="label">PASSWORD *</label>
                  <input formControlName="password" class="input" type="password" placeholder="Min 8 chars">
                </div>
                <div class="form-field">
                  <label class="label">ROLE *</label>
                  <select formControlName="role" class="input" style="background: rgba(0,0,0,0.5);">
                    <option *ngFor="let r of availableRoles" [value]="r">{{ r }}</option>
                  </select>
                </div>
              </div>
              <div *ngIf="formError" style="color: #f87171; font-size: 12px; margin-bottom: 12px;">{{ formError }}</div>
              <div *ngIf="formSuccess" style="color: #4ade80; font-size: 12px; margin-bottom: 12px;">{{ formSuccess }}</div>
              <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-ghost" (click)="closeCreateForm()">CANCEL</button>
                <button type="submit" class="btn btn-primary" [disabled]="createForm.invalid || saving">
                  {{ saving ? 'CREATING...' : 'CREATE USER' }}
                </button>
              </div>
            </form>
          </div>

          <!-- Search / Filter -->
          <div style="display: flex; gap: 12px; margin-bottom: 20px; align-items: center;">
            <div style="flex: 1; position: relative;">
              <input [(ngModel)]="searchQuery" (ngModelChange)="applyFilter()"
                     class="input" placeholder="Search by name, email..."
                     style="padding-left: 40px;">
              <span style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--color-muted); font-size: 14px;">⌕</span>
            </div>
            <select [(ngModel)]="roleFilter" (ngModelChange)="applyFilter()"
                    class="input" style="width: 160px; background: rgba(0,0,0,0.5);">
              <option value="">All Roles</option>
              <option *ngFor="let r of availableRoles" [value]="r">{{ r }}</option>
            </select>
            <select [(ngModel)]="statusFilter" (ngModelChange)="applyFilter()"
                    class="input" style="width: 140px; background: rgba(0,0,0,0.5);">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <!-- Global action error/success -->
          <div *ngIf="actionError" style="background: rgba(248,113,113,0.1); border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; padding: 12px 16px; color: #f87171; font-size: 13px; margin-bottom: 16px;">
            ⚠ {{ actionError }}
          </div>
          <div *ngIf="actionSuccess" style="background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.3); border-radius: 8px; padding: 12px 16px; color: #4ade80; font-size: 13px; margin-bottom: 16px;">
            ✓ {{ actionSuccess }}
          </div>

          <!-- Users Table -->
          <div style="background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; overflow: hidden;">
            <!-- Loading state -->
            <div *ngIf="loading" style="text-align: center; padding: 80px; color: var(--color-muted); font-size: 12px; letter-spacing: 2px;">
              LOADING USERS...
            </div>

            <table *ngIf="!loading" style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-border);">
                  <th class="th-cell" style="width: 22%;">FULL NAME</th>
                  <th class="th-cell" style="width: 24%;">EMAIL</th>
                  <th class="th-cell" style="width: 12%;">ROLE</th>
                  <th class="th-cell" style="width: 10%;">STATUS</th>
                  <th class="th-cell" style="width: 14%;">CREATED</th>
                  <th class="th-cell" style="width: 18%; text-align: center;">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let user of filteredUsers"
                    style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;"
                    onmouseover="this.style.background='rgba(255,255,255,0.03)'"
                    onmouseout="this.style.background='transparent'">

                  <!-- Full Name -->
                  <td style="padding: 14px 24px;">
                    <div style="font-weight: 600; color: #fff; font-size: 14px;">{{ user.fullName }}</div>
                    <div *ngIf="user.phoneNumber" style="font-size: 11px; color: var(--color-muted); margin-top: 2px;">{{ user.phoneNumber }}</div>
                  </td>

                  <!-- Email -->
                  <td style="padding: 14px 24px; font-family: 'Courier New', monospace; font-size: 12px; color: var(--color-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                    {{ user.email }}
                  </td>

                  <!-- Role — inline dropdown for quick assignment -->
                  <td style="padding: 14px 24px;">
                    <select *ngIf="editingRoleFor === user.userId"
                            [value]="user.role"
                            (change)="confirmRoleChange(user, $any($event.target).value)"
                            class="input" style="padding: 4px 8px; font-size: 11px; background: rgba(0,0,0,0.7); width: 110px;">
                      <option *ngFor="let r of availableRoles" [value]="r">{{ r }}</option>
                    </select>
                    <span *ngIf="editingRoleFor !== user.userId"
                          [ngClass]="getRoleBadge(user.role)"
                          (click)="startRoleEdit(user.userId)"
                          title="Click to change role"
                          style="cursor: pointer;">
                      {{ user.role }}
                    </span>
                  </td>

                  <!-- Status -->
                  <td style="padding: 14px 24px;">
                    <span [ngClass]="user.isActive ? 'badge-active' : 'badge-inactive'">
                      {{ user.isActive ? 'ACTIVE' : 'INACTIVE' }}
                    </span>
                  </td>

                  <!-- Created -->
                  <td style="padding: 14px 24px; font-family: 'Courier New', monospace; font-size: 11px; color: var(--color-muted);">
                    {{ user.createdAt | date:'yyyy.MM.dd' }}
                  </td>

                  <!-- Actions -->
                  <td style="padding: 14px 24px; text-align: center;">
                    <div style="display: flex; gap: 6px; justify-content: center; flex-wrap: wrap;">

                      <!-- Normal deactivate flow: show DEACTIVATE, then confirm inline -->
                      <ng-container *ngIf="confirmDeactivateFor !== user.userId">
                        <button *ngIf="user.isActive && user.userId !== currentUserId"
                                (click)="startDeactivate(user.userId)"
                                class="action-btn danger-btn"
                                title="Deactivate user">
                          DEACTIVATE
                        </button>
                      </ng-container>

                      <!-- Inline confirmation replaces the button -->
                      <ng-container *ngIf="confirmDeactivateFor === user.userId">
                        <span style="font-size: 10px; color: #f87171; letter-spacing: 1px; align-self: center;">CONFIRM?</span>
                        <button (click)="confirmDeactivate(user)" class="action-btn danger-btn">YES</button>
                        <button (click)="cancelDeactivate()" class="action-btn ghost-btn">NO</button>
                      </ng-container>

                      <button *ngIf="!user.isActive"
                              (click)="reactivate(user)"
                              class="action-btn success-btn"
                              title="Reactivate user">
                        REACTIVATE
                      </button>
                      <button *ngIf="editingRoleFor === user.userId"
                              (click)="cancelRoleEdit()"
                              class="action-btn ghost-btn">
                        CANCEL
                      </button>
                    </div>
                  </td>
                </tr>

                <tr *ngIf="filteredUsers.length === 0 && !loading">
                  <td colspan="6" style="text-align: center; padding: 80px; color: var(--color-muted); font-size: 12px; letter-spacing: 2px; opacity: 0.5;">
                    NO USERS MATCH YOUR FILTERS
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div style="margin-top: 14px; font-size: 11px; color: var(--color-muted); letter-spacing: 1px; text-align: right;">
            SHOWING {{ filteredUsers.length }} OF {{ users.length }} USERS · ADMIN PANEL · AUDIT TRAIL ACTIVE
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-panel { height: 100vh; overflow-y: auto; scrollbar-width: none; }
    .content-panel::-webkit-scrollbar { display: none; }

    .stat-card {
      background: rgba(255,255,255,0.02);
      border: 1px solid var(--color-border);
      border-radius: 10px;
      padding: 20px 24px;
    }
    .stat-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: var(--color-muted);
      margin-bottom: 8px;
    }
    .stat-value {
      font-size: 32px;
      font-weight: 800;
      font-family: 'Outfit', sans-serif;
      color: #fff;
      letter-spacing: -0.03em;
    }

    .form-panel {
      background: rgba(255,255,255,0.03);
      backdrop-filter: blur(20px);
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 28px 30px;
    }
    .section-label {
      font-size: 11px;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: var(--color-muted);
      margin-bottom: 20px;
    }

    .th-cell {
      padding: 14px 24px;
      font-size: 10px;
      text-transform: uppercase;
      color: var(--color-muted);
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    /* Role badges */
    .role-admin   { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(129,140,248,0.1); color: #818cf8; border: 1px solid rgba(129,140,248,0.3); }
    .role-manager { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(16,185,129,0.1); color: #10b981; border: 1px solid rgba(16,185,129,0.3); }
    .role-staff   { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(255,255,255,0.06); color: #aaa; border: 1px solid rgba(255,255,255,0.1); }

    /* Status badges */
    .badge-active   { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
    .badge-inactive { padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }

    /* Action buttons */
    .action-btn {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      border: 1px solid;
      transition: all 0.2s;
    }
    .danger-btn  { background: rgba(248,113,113,0.08); color: #f87171; border-color: rgba(248,113,113,0.25); }
    .danger-btn:hover  { background: rgba(248,113,113,0.18); }
    .success-btn { background: rgba(74,222,128,0.08); color: #4ade80; border-color: rgba(74,222,128,0.25); }
    .success-btn:hover { background: rgba(74,222,128,0.18); }
    .ghost-btn   { background: transparent; color: var(--color-muted); border-color: var(--color-border); }
    .ghost-btn:hover   { background: rgba(255,255,255,0.05); }
  `]
})
export class UserManagementComponent implements OnInit {
  users: AdminUser[] = [];
  filteredUsers: AdminUser[] = [];
  availableRoles: string[] = ['ADMIN', 'MANAGER', 'STAFF'];

  searchQuery = '';
  roleFilter = '';
  statusFilter = '';
  loading = false;
  saving = false;

  showCreateForm = false;
  createForm: FormGroup;
  formError = '';
  formSuccess = '';

  editingRoleFor: string | null = null;
  confirmDeactivateFor: string | null = null;

  actionError = '';
  actionSuccess = '';

  get currentUserId(): string { return this.authService.currentUser?.userId ?? ''; }
  get activeCount(): number   { return this.users.filter(u => u.isActive).length; }
  get inactiveCount(): number { return this.users.filter(u => !u.isActive).length; }
  get adminCount(): number    { return this.users.filter(u => u.role === 'ADMIN').length; }

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    private fb: FormBuilder,
    public router: Router
  ) {
    this.createForm = this.fb.group({
      fullName: ['', Validators.required],
      email:    ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role:     ['STAFF', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.adminService.getUsers().subscribe({
      next: (users) => { this.users = users; this.applyFilter(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  applyFilter(): void {
    this.filteredUsers = this.users.filter(u => {
      const matchSearch = !this.searchQuery ||
        u.fullName.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchRole   = !this.roleFilter   || u.role === this.roleFilter;
      const matchStatus = !this.statusFilter ||
        (this.statusFilter === 'active' ? u.isActive : !u.isActive);
      return matchSearch && matchRole && matchStatus;
    });
  }

  openCreateForm(): void  { this.showCreateForm = true; this.formError = ''; this.formSuccess = ''; }
  closeCreateForm(): void { this.showCreateForm = false; this.createForm.reset({ role: 'STAFF' }); }

  submitCreate(): void {
    if (this.createForm.invalid) return;
    this.saving = true;
    this.formError = '';
    this.formSuccess = '';
    const dto: CreateUserRequest = this.createForm.value;
    this.adminService.createUser(dto).subscribe({
      next: (res) => {
        this.saving = false;
        this.formSuccess = res.message;
        this.createForm.reset({ role: 'STAFF' });
        this.loadUsers();
      },
      error: (err) => {
        this.saving = false;
        this.formError = err.error?.message || 'Failed to create user.';
      }
    });
  }

  startRoleEdit(userId: string): void {
    this.editingRoleFor = userId;
    this.clearMessages();
  }

  cancelRoleEdit(): void { this.editingRoleFor = null; }

  confirmRoleChange(user: AdminUser, newRole: string): void {
    if (newRole === user.role) { this.editingRoleFor = null; return; }
    const dto: AssignRoleRequest = { userId: user.userId, newRole };
    this.adminService.assignRole(dto).subscribe({
      next: (res) => {
        user.role = newRole;
        this.editingRoleFor = null;
        this.actionSuccess = res.message;
        setTimeout(() => this.actionSuccess = '', 4000);
      },
      error: (err) => {
        this.editingRoleFor = null;
        this.actionError = err.error?.message || 'Failed to assign role.';
        setTimeout(() => this.actionError = '', 5000);
      }
    });
  }

  startDeactivate(userId: string): void {
    this.confirmDeactivateFor = userId;
    this.clearMessages();
  }

  cancelDeactivate(): void { this.confirmDeactivateFor = null; }

  confirmDeactivate(user: AdminUser): void {
    this.confirmDeactivateFor = null;
    this.adminService.deactivateUser(user.userId).subscribe({
      next: (res) => {
        user.isActive = false;
        this.applyFilter();
        this.actionSuccess = res.message;
        setTimeout(() => this.actionSuccess = '', 4000);
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to deactivate user.';
        setTimeout(() => this.actionError = '', 5000);
      }
    });
  }

  reactivate(user: AdminUser): void {
    this.adminService.reactivateUser(user.userId).subscribe({
      next: (res) => {
        user.isActive = true;
        this.applyFilter();
        this.actionSuccess = res.message;
        setTimeout(() => this.actionSuccess = '', 4000);
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to reactivate user.';
        setTimeout(() => this.actionError = '', 5000);
      }
    });
  }

  getRoleBadge(role: string): string {
    const map: Record<string, string> = {
      ADMIN: 'role-admin',
      MANAGER: 'role-manager',
      STAFF: 'role-staff'
    };
    return map[role] || 'role-staff';
  }

  private clearMessages(): void { this.actionError = ''; this.actionSuccess = ''; }
}
