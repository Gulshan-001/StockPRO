import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { WarehouseService } from '../../services/warehouse.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="app-container bg-inventory animate">
      <div class="content-panel">
        <div class="navigation-trail">
          <a routerLink="/warehouses" class="back-link">← Back to Network</a>
        </div>

        <header class="page-header">
          <h1 class="title" style="font-size: 48px;">{{ isEditMode ? 'Edit Location' : 'New Storage Hub' }}</h1>
          <p class="subtitle">Define the operational parameters for this warehouse location.</p>
        </header>

        <div class="form-card">
          <form [formGroup]="warehouseForm" (ngSubmit)="onSubmit()">
            <div class="form-grid">
              <div class="form-group">
                <label class="label">HUB NAME</label>
                <input type="text" formControlName="name" class="input" placeholder="e.g. Northern Logistics Center">
                <div class="text-error" *ngIf="warehouseForm.get('name')?.touched && warehouseForm.get('name')?.invalid">
                  Name is required (max 100 chars).
                </div>
              </div>

              <div class="form-group">
                <label class="label">LOCATION / CITY</label>
                <input type="text" formControlName="location" class="input" placeholder="e.g. New Delhi">
              </div>

              <div class="form-group" style="grid-column: span 2;">
                <label class="label">FULL OPERATIONAL ADDRESS</label>
                <textarea formControlName="address" class="input" rows="3" placeholder="Enter complete physical address..."></textarea>
              </div>

              <div class="form-group">
                <label class="label">TOTAL STORAGE CAPACITY (UNITS)</label>
                <input type="number" formControlName="capacity" class="input" placeholder="10000">
                <div class="text-error" *ngIf="warehouseForm.get('capacity')?.touched && warehouseForm.get('capacity')?.invalid">
                  Capacity must be at least 1.
                </div>
              </div>

              <div class="form-group">
                <label class="label">CONTACT PHONE</label>
                <input type="text" formControlName="phone" class="input" placeholder="+91 XXXXX XXXXX">
              </div>

              <div class="form-group" *ngIf="isEditMode">
                <label class="label" style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                  <input type="checkbox" formControlName="isActive">
                  OPERATIONAL STATUS (ACTIVE)
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" [disabled]="submitting || warehouseForm.invalid">
                {{ submitting ? 'SYNCHRONIZING...' : (isEditMode ? 'UPDATE HUB' : 'INITIALIZE HUB') }}
              </button>
              <button type="button" class="btn btn-ghost" routerLink="/warehouses">CANCEL</button>
            </div>
            
            <p class="text-error" *ngIf="errorMessage" style="margin-top: 20px;">{{ errorMessage }}</p>
          </form>
        </div>
      </div>
      <div class="visual-panel"></div>
    </div>
  `,
  styles: [`
    .form-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      padding: 3rem;
      border-radius: 24px;
      backdrop-filter: blur(20px);
      max-width: 800px;
    }

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }

    .form-actions {
      margin-top: 3rem;
      display: flex;
      gap: 1rem;
    }

    input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #fff;
    }
  `]
})
export class WarehouseFormComponent implements OnInit {
  warehouseForm: FormGroup;
  isEditMode = false;
  warehouseId?: string;
  submitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private warehouseService: WarehouseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.warehouseForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      location: [''],
      address: [''],
      capacity: [1000, [Validators.required, Validators.min(1)]],
      phone: [''],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.warehouseId = this.route.snapshot.params['id'];
    if (this.warehouseId && this.warehouseId !== 'new') {
      this.isEditMode = true;
      this.loadWarehouse();
    }
  }

  loadWarehouse(): void {
    if (!this.warehouseId) return;
    this.warehouseService.getWarehouseById(this.warehouseId).subscribe({
      next: (w) => this.warehouseForm.patchValue(w),
      error: () => this.errorMessage = 'Failed to load warehouse details.'
    });
  }

  onSubmit(): void {
    if (this.warehouseForm.invalid) return;

    this.submitting = true;
    this.errorMessage = '';
    const data = this.warehouseForm.value;

    const request$ = this.isEditMode && this.warehouseId
      ? this.warehouseService.updateWarehouse(this.warehouseId, data)
      : this.warehouseService.createWarehouse(data);

    request$.subscribe({
      next: () => this.router.navigate(['/warehouses']),
      error: (err) => {
        this.submitting = false;
        const msg = err.error?.message || 'Failed to save warehouse.';
        const details = err.error?.details ? ` (${err.error.details})` : '';
        const inner = err.error?.inner && err.error.inner !== 'No inner exception' ? ` [Inner: ${err.error.inner}]` : '';
        this.errorMessage = msg + details + inner;
      }
    });
  }
}
