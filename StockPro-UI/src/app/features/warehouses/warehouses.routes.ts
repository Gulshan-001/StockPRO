import { Routes } from '@angular/router';
import { WarehouseListComponent } from './components/warehouse-list/warehouse-list.component';
import { WarehouseDetailComponent } from './components/warehouse-detail/warehouse-detail.component';

import { WarehouseFormComponent } from './components/warehouse-form/warehouse-form.component';

export const WAREHOUSE_ROUTES: Routes = [
  { path: '', component: WarehouseListComponent },
  { path: 'new', component: WarehouseFormComponent },
  { path: ':id', component: WarehouseDetailComponent },
  { path: ':id/edit', component: WarehouseFormComponent }
];
