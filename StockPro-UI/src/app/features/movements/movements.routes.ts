import { Routes } from '@angular/router';
import { MovementFormComponent } from './components/movement-form/movement-form.component';
import { MovementHistoryComponent } from './components/movement-history/movement-history.component';

export const MOVEMENT_ROUTES: Routes = [
  { path: 'new', component: MovementFormComponent },
  { path: 'history', component: MovementHistoryComponent },
  { path: '', redirectTo: 'history', pathMatch: 'full' }
];
