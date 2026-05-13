import { Routes } from '@angular/router';
import { RoleGuard } from '../../core/guards/auth.guard';
import { UserManagementComponent } from './components/user-management/user-management.component';
import { AuditLogComponent } from './components/audit-log/audit-log.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: 'users',
    component: UserManagementComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'audit',
    component: AuditLogComponent,
    canActivate: [RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  }
];
