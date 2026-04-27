import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'dashboard',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule)
  },
  {
    path: 'products',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/products/products.routes').then(r => r.PRODUCT_ROUTES)
  },
  {
    path: 'warehouses',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/warehouses/warehouses.routes').then(r => r.WAREHOUSE_ROUTES)
  },
  {
    path: 'movements',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/movements/movements.routes').then(r => r.MOVEMENT_ROUTES)
  },
  {
    path: 'purchases',
    canActivate: [AuthGuard],
    loadChildren: () => import('./features/purchases/purchases.routes').then(r => r.PURCHASE_ROUTES)
  },
  { path: 'unauthorized', redirectTo: 'auth/login' },
  { path: '**', redirectTo: 'auth/login' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
