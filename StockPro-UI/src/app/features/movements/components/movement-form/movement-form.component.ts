import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MovementService } from '../../services/movement.service';
import { ProductService } from '../../../products/services/product.service';
import { WarehouseService } from '../../../warehouses/services/warehouse.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Product } from '../../../products/models/product.model';
import { Warehouse } from '../../../warehouses/models/warehouse.model';

@Component({
  selector: 'app-movement-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; padding-top: 160px; padding-bottom: 80px;">
        
        <div style="width: 90%; max-width: 900px;">
          
          <div class="navigation-trail">
            <a (click)="cancel()" class="back-link" style="cursor: pointer;">
              <span>←</span> BACK TO LEDGER
            </a>
          </div>

          <div class="header-section" style="margin-bottom: 50px;">
            <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 56px; letter-spacing: -0.04em; margin-bottom: 10px;">Initialize Transaction</h1>
            <p class="subtitle" style="font-size: 16px;">Create a new auditable movement record in the decentralized ledger.</p>
          </div>

          <div class="content-card" style="background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid var(--color-border); padding: 50px; border-radius: 12px;">
            <form [formGroup]="movementForm" (ngSubmit)="onSubmit()">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 35px;">
                
                <div class="form-group">
                  <label class="label">MOVEMENT TYPE</label>
                  <select formControlName="type" class="input" style="background: rgba(0,0,0,0.6);">
                    <option value="STOCK_IN">STOCK IN (GRN)</option>
                    <option value="STOCK_OUT">STOCK OUT (ISSUE)</option>
                    <option value="TRANSFER">INTER-WAREHOUSE TRANSFER</option>
                    <option value="ADJUSTMENT">ADJUSTMENT / CORRECTION</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="label">TARGET PRODUCT</label>
                  <select formControlName="productId" class="input" style="background: rgba(0,0,0,0.6);">
                    <option *ngFor="let p of products" [value]="p.productId">{{ p.name }} ({{ p.sku }})</option>
                  </select>
                </div>

                <!-- Conditional Warehouse Fields -->
                <div class="form-group" *ngIf="movementForm.get('type')?.value !== 'TRANSFER'">
                  <label class="label">WAREHOUSE</label>
                  <select formControlName="warehouseId" class="input" style="background: rgba(0,0,0,0.6);">
                    <option *ngFor="let w of warehouses" [value]="w.warehouseId">{{ w.name }}</option>
                  </select>
                </div>

                <ng-container *ngIf="movementForm.get('type')?.value === 'TRANSFER'">
                  <div class="form-group">
                    <label class="label">SOURCE WAREHOUSE</label>
                    <select formControlName="sourceWarehouseId" class="input" style="background: rgba(0,0,0,0.6);">
                      <option *ngFor="let w of warehouses" [value]="w.warehouseId">{{ w.name }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label class="label">DESTINATION WAREHOUSE</label>
                    <select formControlName="targetWarehouseId" class="input" style="background: rgba(0,0,0,0.6);">
                      <option *ngFor="let w of warehouses" [value]="w.warehouseId">{{ w.name }}</option>
                    </select>
                  </div>
                </ng-container>

                <div class="form-group">
                  <label class="label">QUANTITY UNITS</label>
                  <input type="number" formControlName="quantity" class="input" placeholder="0">
                </div>

                <div class="form-group" *ngIf="movementForm.get('type')?.value === 'STOCK_IN'">
                  <label class="label">UNIT COST (VALUATION)</label>
                  <input type="number" formControlName="unitCost" class="input" placeholder="0.00">
                </div>

                <div class="form-group" style="grid-column: span 2;">
                  <label class="label">AUDIT NOTES / REFERENCE</label>
                  <textarea formControlName="notes" class="input" rows="4" placeholder="Reason for this movement transaction..."></textarea>
                </div>
              </div>

              <div class="form-actions" style="margin-top: 40px; display: flex; gap: 20px;">
                <button type="submit" class="btn btn-primary" [disabled]="loading || movementForm.invalid">
                  {{ loading ? 'PROCESSING...' : 'INITIALIZE TRANSACTION' }}
                </button>
                <button type="button" class="btn btn-ghost" (click)="cancel()">CANCEL</button>
              </div>

              <p class="text-error" *ngIf="errorMessage" style="margin-top: 20px;">{{ errorMessage }}</p>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .content-panel {
      height: 100vh;
      overflow-y: auto;
      scrollbar-width: none;
    }
    .content-panel::-webkit-scrollbar { display: none; }
  `]
})
export class MovementFormComponent implements OnInit {
  movementForm: FormGroup;
  products: Product[] = [];
  warehouses: Warehouse[] = [];
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private movementService: MovementService,
    private productService: ProductService,
    private warehouseService: WarehouseService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.movementForm = this.fb.group({
      type: ['STOCK_IN', Validators.required],
      productId: ['', Validators.required],
      warehouseId: [''],
      sourceWarehouseId: [''],
      targetWarehouseId: [''],
      quantity: [0, [Validators.required, Validators.min(1)]],
      unitCost: [0],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.productService.getAllProducts().subscribe((p: Product[]) => this.products = p);
    this.warehouseService.getAllWarehouses().subscribe((w: Warehouse[]) => {
      this.warehouses = w;
      // Pre-select if passed via query params
      const warehouseId = this.route.snapshot.queryParamMap.get('warehouseId');
      if (warehouseId) {
        this.movementForm.patchValue({ warehouseId });
      }
    });

    // Watch type changes to adjust validators
    this.movementForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'TRANSFER') {
        this.movementForm.get('sourceWarehouseId')?.setValidators(Validators.required);
        this.movementForm.get('targetWarehouseId')?.setValidators(Validators.required);
        this.movementForm.get('warehouseId')?.clearValidators();
      } else {
        this.movementForm.get('warehouseId')?.setValidators(Validators.required);
        this.movementForm.get('sourceWarehouseId')?.clearValidators();
        this.movementForm.get('targetWarehouseId')?.clearValidators();
      }
      this.movementForm.get('warehouseId')?.updateValueAndValidity();
      this.movementForm.get('sourceWarehouseId')?.updateValueAndValidity();
      this.movementForm.get('targetWarehouseId')?.updateValueAndValidity();
    });
  }

  onSubmit(): void {
    if (this.movementForm.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    const val = this.movementForm.value;
    let obs$;

    // Construct clean payload matching the Backend DTO exactly
    let payload: any = {
      productId: val.productId,
      quantity: val.quantity,
      notes: val.notes
    };

    switch (val.type) {
      case 'STOCK_IN':
        payload.warehouseId = val.warehouseId;
        payload.unitCost = val.unitCost;
        obs$ = this.movementService.stockIn(payload);
        break;
      case 'STOCK_OUT':
        payload.warehouseId = val.warehouseId;
        obs$ = this.movementService.stockOut(payload);
        break;
      case 'TRANSFER':
        payload.productId = val.productId;
        payload.sourceWarehouseId = val.sourceWarehouseId;
        payload.targetWarehouseId = val.targetWarehouseId;
        payload.quantity = val.quantity;
        payload.notes = val.notes;
        obs$ = this.movementService.transfer(payload);
        break;
      case 'ADJUSTMENT':
        payload.warehouseId = val.warehouseId;
        obs$ = this.movementService.adjustment(payload);
        break;
      default:
        return;
    }

    obs$.subscribe({
      next: () => {
        this.router.navigate(['/movements/history']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Failed to execute movement.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/movements/history']);
  }
}
