import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { PurchaseService } from '../../services/purchase.service';
import { PurchaseOrder, Supplier } from '../../models/purchase.model';
import { AuthService } from '../../../../core/services/auth.service';
import { WarehouseService } from '../../../warehouses/services/warehouse.service';
import { ProductService } from '../../../products/services/product.service';
import { Warehouse } from '../../../warehouses/models/warehouse.model';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        <div style="width: 92%; max-width: 1400px; display: flex; flex-direction: column;">

          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="router.navigate(['/dashboard'])" class="back-link" style="cursor: pointer;">← BACK TO DASHBOARD</a>
          </div>

          <div class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 52px; letter-spacing: -0.04em; margin-bottom: 5px;">Purchase Orders</h1>
              <p class="subtitle" style="max-width: 700px; margin-bottom: 0; font-size: 15px; opacity: 0.7;">Procurement lifecycle — from requisition to goods receipt.</p>
            </div>
            <div style="display: flex; gap: 12px;">
              <button class="btn btn-outline" routerLink="/purchases/suppliers" style="padding: 12px 20px;">SUPPLIERS</button>
              <button *ngIf="canCreate" class="btn btn-primary" (click)="openForm()" style="white-space: nowrap; padding: 12px 28px;">+ NEW PO</button>
            </div>
          </div>

          <!-- Status Tabs -->
          <div style="display: flex; gap: 8px; margin-bottom: 25px; border-bottom: 1px solid var(--color-border); padding-bottom: 0;">
            <button *ngFor="let tab of tabs" (click)="selectTab(tab.value)"
              style="padding: 10px 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; border: none; cursor: pointer; background: transparent; border-bottom: 2px solid transparent; transition: all 0.2s;"
              [style.color]="activeTab === tab.value ? '#fff' : 'var(--color-muted)'"
              [style.border-bottom-color]="activeTab === tab.value ? '#fff' : 'transparent'">
              {{ tab.label }}
            </button>
          </div>

          <!-- New PO Form -->
          <div *ngIf="showForm" style="background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid var(--color-border); border-radius: 12px; padding: 30px; margin-bottom: 25px;">
            <h3 style="font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-muted); margin-bottom: 25px;">CREATE PURCHASE ORDER</h3>
            <form [formGroup]="poForm" (ngSubmit)="createPO()">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                <div class="form-field">
                  <label class="label">SUPPLIER *</label>
                  <select formControlName="supplierId" class="input" style="background: rgba(0,0,0,0.5);">
                    <option value="">Select supplier...</option>
                    <option *ngFor="let s of suppliers" [value]="s.supplierId">{{ s.name }}</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="label">WAREHOUSE *</label>
                  <select formControlName="warehouseId" class="input" style="background: rgba(0,0,0,0.5);">
                    <option value="">Select destination...</option>
                    <option *ngFor="let w of warehouses" [value]="w.warehouseId">{{ w.name }}</option>
                  </select>
                </div>
                <div class="form-field">
                  <label class="label">EXPECTED DATE</label>
                  <input formControlName="expectedDate" class="input" type="date">
                </div>
                <div class="form-field" style="grid-column: 1/-1;">
                  <label class="label">NOTES</label>
                  <input formControlName="notes" class="input" placeholder="Optional notes...">
                </div>
              </div>

              <h4 style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-muted); margin-bottom: 15px;">LINE ITEMS</h4>
              <div formArrayName="items">
                <div *ngFor="let item of items.controls; let i = index" [formGroupName]="i" style="display: grid; grid-template-columns: 1fr 1fr 1fr auto; gap: 10px; margin-bottom: 10px; align-items: end;">
                  <div class="form-field" style="margin-bottom: 0;">
                    <label class="label">PRODUCT *</label>
                    <select formControlName="productId" class="input" style="background: rgba(0,0,0,0.5);">
                      <option value="">Select item...</option>
                      <option *ngFor="let p of products" [value]="p.productId">{{ p.name }} ({{ p.sku }})</option>
                    </select>
                  </div>
                  <div class="form-field" style="margin-bottom: 0;"><label class="label">QTY *</label><input formControlName="quantity" class="input" type="number" min="1"></div>
                  <div class="form-field" style="margin-bottom: 0;"><label class="label">UNIT COST *</label><input formControlName="unitCost" class="input" type="number" step="0.01" min="0"></div>
                  <button type="button" (click)="removeItem(i)" style="padding: 10px 14px; background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; cursor: pointer; font-size: 14px;">✕</button>
                </div>
              </div>
              <button type="button" (click)="addItem()" style="margin-top: 5px; padding: 8px 16px; background: transparent; border: 1px dashed var(--color-border); border-radius: 8px; color: var(--color-muted); cursor: pointer; font-size: 11px; letter-spacing: 1px;">+ ADD LINE ITEM</button>

              <div *ngIf="errorMsg" style="margin-top: 15px; color: #f87171; font-size: 13px;">{{ errorMsg }}</div>
              <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 20px;">
                <button type="button" class="btn btn-ghost" (click)="closeForm()">CANCEL</button>
                <button type="submit" class="btn btn-primary" [disabled]="poForm.invalid || saving">{{ saving ? 'CREATING...' : 'CREATE PO' }}</button>
              </div>
            </form>
          </div>

          <!-- POs Table -->
          <div style="background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; width: 100%; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-border);">
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 12%;">PO Ref</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 18%;">Supplier</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 10%;">Status</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 12%;">Order Date</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 12%;">Expected</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 10%; text-align: right;">Total</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 10%; text-align: center;">Items</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 16%;"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let po of pos" style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                  <td style="padding: 16px 24px; font-family: 'Courier New', monospace; font-size: 11px; color: var(--color-muted);">PO-{{ po.poId | slice:0:8 | uppercase }}</td>
                  <td style="padding: 16px 24px; font-weight: 600; color: #fff;">{{ po.supplierName }}</td>
                  <td style="padding: 16px 24px;"><span [ngClass]="getStatusClass(po.status)" style="padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px;">{{ po.status }}</span></td>
                  <td style="padding: 16px 24px; font-family: 'Courier New', monospace; font-size: 12px; color: var(--color-muted);">{{ po.orderDate | date:'yyyy.MM.dd' }}</td>
                  <td style="padding: 16px 24px; font-family: 'Courier New', monospace; font-size: 12px; color: var(--color-muted);">{{ po.expectedDate ? (po.expectedDate | date:'yyyy.MM.dd') : '—' }}</td>
                  <td style="padding: 16px 24px; text-align: right; font-weight: 700; color: #fff;">{{ po.totalAmount | number:'1.2-2' }}</td>
                  <td style="padding: 16px 24px; text-align: center; color: var(--color-muted);">
                    <div style="color: #fff; font-weight: 600;">{{ po.lineItems.length }}</div>
                    <div style="font-size: 10px; opacity: 0.7;">{{ getTotalUnits(po) }} units</div>
                  </td>
                  <td style="padding: 16px 24px;">
                    <div style="display: flex; gap: 6px;">
                      <button (click)="viewDetail(po.poId)" class="btn btn-ghost" style="padding: 4px 14px; font-size: 10px;">VIEW</button>
                      <button *ngIf="canApprove && po.status === 'PENDING'" (click)="quickApprove(po)" class="btn btn-outline" style="padding: 4px 10px; font-size: 10px; color: #4ade80; border-color: rgba(74,222,128,0.3);">APPROVE</button>
                    </div>
                  </td>
                </tr>
                <tr *ngIf="pos.length === 0">
                  <td colspan="8" style="text-align: center; padding: 100px; color: var(--color-muted); font-style: italic; font-size: 13px; letter-spacing: 2px; opacity: 0.5;">NO PURCHASE ORDERS FOUND</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.content-panel { height: 100vh; overflow-y: auto; scrollbar-width: none; } .content-panel::-webkit-scrollbar { display: none; }
    .status-draft { background: rgba(255,255,255,0.08); color: #aaa; border: 1px solid rgba(255,255,255,0.1); }
    .status-pending { background: rgba(250,204,21,0.1); color: #facc15; border: 1px solid rgba(250,204,21,0.3); }
    .status-approved { background: rgba(74,222,128,0.1); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
    .status-received { background: rgba(99,102,241,0.1); color: #818cf8; border: 1px solid rgba(99,102,241,0.3); }
    .status-cancelled { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
  `]
})
export class POListComponent implements OnInit {
  pos: PurchaseOrder[] = [];
  suppliers: Supplier[] = [];
  warehouses: Warehouse[] = [];
  products: Product[] = [];
  activeTab = '';
  showForm = false;
  saving = false;
  errorMsg = '';
  poForm: FormGroup;

  tabs = [
    { label: 'All', value: '' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Received', value: 'RECEIVED' },
    { label: 'Cancelled', value: 'CANCELLED' }
  ];

  get canCreate(): boolean { return ['ADMIN', 'INVENTORY MANAGER', 'MANAGER'].includes(this.authService.userRole); }
  get canApprove(): boolean { return ['ADMIN', 'INVENTORY MANAGER', 'MANAGER'].includes(this.authService.userRole); }
  get items(): FormArray { return this.poForm.get('items') as FormArray; }

  constructor(
    private purchaseService: PurchaseService,
    private warehouseService: WarehouseService,
    private productService: ProductService,
    public router: Router,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.poForm = this.fb.group({
      supplierId: ['', Validators.required],
      warehouseId: ['', Validators.required],
      expectedDate: [''],
      notes: [''],
      items: this.fb.array([this.newLineItem()])
    });
  }

  ngOnInit(): void { 
    this.loadPOs(); 
    this.loadSuppliers();
    this.loadWarehouses();
    this.loadProducts();
  }

  loadPOs(): void {
    this.purchaseService.getPOs(this.activeTab || undefined).subscribe(p => this.pos = p);
  }

  loadSuppliers(): void {
    this.purchaseService.getSuppliers().subscribe(s => this.suppliers = s);
  }

  loadWarehouses(): void {
    this.warehouseService.getAllWarehouses().subscribe(w => this.warehouses = w);
  }

  loadProducts(): void {
    this.productService.getAllProducts().subscribe(p => this.products = p);
  }

  selectTab(status: string): void { this.activeTab = status; this.loadPOs(); }

  viewDetail(id: string): void { this.router.navigate(['/purchases', id]); }

  openForm(): void { this.showForm = true; this.errorMsg = ''; }

  closeForm(): void { this.showForm = false; this.errorMsg = ''; this.poForm.reset(); }

  newLineItem(): FormGroup {
    return this.fb.group({
      productId: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      unitCost: [0, [Validators.required, Validators.min(0)]]
    });
  }

  addItem(): void { this.items.push(this.newLineItem()); }

  removeItem(i: number): void { if (this.items.length > 1) this.items.removeAt(i); }

  createPO(): void {
    if (this.poForm.invalid) return;
    this.saving = true;
    this.errorMsg = '';
    this.purchaseService.createPO(this.poForm.value).subscribe({
      next: () => { this.saving = false; this.closeForm(); this.loadPOs(); },
      error: (err) => { this.saving = false; this.errorMsg = err.error?.message || 'Failed to create PO.'; }
    });
  }

  quickApprove(po: PurchaseOrder): void {
    this.purchaseService.approvePO(po.poId).subscribe({ next: () => this.loadPOs() });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-draft', PENDING: 'status-pending', APPROVED: 'status-approved',
      RECEIVED: 'status-received', CANCELLED: 'status-cancelled'
    };
    return map[status] || 'status-draft';
  }

  getTotalUnits(po: PurchaseOrder): number {
    return po.lineItems.reduce((acc, item) => acc + item.quantity, 0);
  }
}
