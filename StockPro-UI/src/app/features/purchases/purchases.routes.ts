import { Routes } from '@angular/router';
import { POListComponent } from './components/po-list/po-list.component';
import { PODetailComponent } from './components/po-detail/po-detail.component';
import { SupplierListComponent } from './components/supplier-list/supplier-list.component';

export const PURCHASE_ROUTES: Routes = [
  { path: '', component: POListComponent },
  { path: 'suppliers', component: SupplierListComponent },
  { path: ':id', component: PODetailComponent }
];
