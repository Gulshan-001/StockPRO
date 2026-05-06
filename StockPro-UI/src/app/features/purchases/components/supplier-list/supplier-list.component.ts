import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { PurchaseService } from '../../services/purchase.service';
import { Supplier } from '../../models/purchase.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        <div style="width: 92%; max-width: 1400px; display: flex; flex-direction: column;">

          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="router.navigate(['/purchases'])" class="back-link" style="cursor: pointer;">← BACK TO PURCHASE ORDERS</a>
          </div>

          <div class="header-section" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 52px; letter-spacing: -0.04em; margin-bottom: 5px;">Supplier Registry</h1>
              <p class="subtitle" style="max-width: 700px; margin-bottom: 0; font-size: 15px; opacity: 0.7;">Vetted supplier network powering the procurement engine.</p>
            </div>
            <button *ngIf="isAdmin || isManager" class="btn btn-primary" (click)="openForm()" style="white-space: nowrap; padding: 12px 28px;">+ NEW SUPPLIER</button>
          </div>

          <!-- Form -->
          <div *ngIf="showForm" style="background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid var(--color-border); border-radius: 12px; padding: 30px; margin-bottom: 25px;">
            <h3 style="font-size: 14px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-muted); margin-bottom: 25px;">{{ editingId ? 'UPDATE SUPPLIER' : 'REGISTER NEW SUPPLIER' }}</h3>
            <form [formGroup]="supplierForm" (ngSubmit)="saveSupplier()" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
              <div class="form-field"><label class="label">NAME *</label><input formControlName="name" class="input" placeholder="Global Components Ltd."></div>
              <div class="form-field"><label class="label">CONTACT PERSON</label><input formControlName="contactPerson" class="input" placeholder="Full name"></div>
              <div class="form-field"><label class="label">EMAIL *</label><input formControlName="email" class="input" type="email" placeholder="supplier@company.com"></div>
              <div class="form-field"><label class="label">PHONE</label><input formControlName="phone" class="input" placeholder="+1 234 567 8900"></div>
              <div class="form-field"><label class="label">CITY</label><input formControlName="city" class="input" placeholder="Dubai"></div>
              <div class="form-field"><label class="label">COUNTRY</label><input formControlName="country" class="input" placeholder="UAE"></div>
              <div class="form-field"><label class="label">PAYMENT TERMS</label><input formControlName="paymentTerms" class="input" placeholder="NET-30"></div>
              <div class="form-field"><label class="label">LEAD TIME (DAYS)</label><input formControlName="leadTimeDays" class="input" type="number"></div>
              <div class="form-field"><label class="label">RATING (0–5)</label><input formControlName="rating" class="input" type="number" step="0.01"></div>
              <div class="form-field" style="grid-column: 1/-1;"><label class="label">ADDRESS</label><input formControlName="address" class="input" placeholder="Street address"></div>
              <div *ngIf="errorMsg" style="grid-column: 1/-1; color: #f87171; font-size: 13px;">{{ errorMsg }}</div>
              <div style="grid-column: 1/-1; display: flex; gap: 10px; justify-content: flex-end;">
                <button type="button" class="btn btn-ghost" (click)="closeForm()">CANCEL</button>
                <button type="submit" class="btn btn-primary" [disabled]="supplierForm.invalid || saving">{{ saving ? 'SAVING...' : (editingId ? 'UPDATE' : 'REGISTER') }}</button>
              </div>
            </form>
          </div>

          <!-- Table -->
          <div style="background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; width: 100%; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; text-align: left; table-layout: fixed;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-border);">
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 22%;">Supplier</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 15%;">Contact</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 20%;">Email</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 13%;">Location</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 8%;">Lead</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 9%;">Rating</th>
                  <th style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 8%;">Status</th>
                  <th *ngIf="isAdmin || isManager" style="padding: 16px 24px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; width: 5%;"></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of suppliers" style="border-bottom: 1px solid rgba(255,255,255,0.03); transition: background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='transparent'">
                  <td style="padding: 16px 24px; font-weight: 600; color: #fff;">{{ s.name }}</td>
                  <td style="padding: 16px 24px; color: var(--color-muted); font-size: 13px;">{{ s.contactPerson }}</td>
                  <td style="padding: 16px 24px; color: var(--color-muted); font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{{ s.email }}</td>
                  <td style="padding: 16px 24px; color: var(--color-muted); font-size: 13px;">{{ s.city }}, {{ s.country }}</td>
                  <td style="padding: 16px 24px; font-family: 'Courier New', monospace; font-size: 13px; color: var(--color-muted);">{{ s.leadTimeDays }}d</td>
                  <td style="padding: 16px 24px; font-weight: 700; color: #facc15;">{{ s.rating | number:'1.1-2' }} ★</td>
                  <td style="padding: 16px 24px;">
                    <span [style.background]="s.isActive ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)'" [style.color]="s.isActive ? '#4ade80' : '#f87171'" style="padding: 3px 8px; border-radius: 4px; font-size: 9px; font-weight: 800; letter-spacing: 0.5px; border: 1px solid currentColor;">{{ s.isActive ? 'ACTIVE' : 'INACTIVE' }}</span>
                  </td>
                  <td *ngIf="isAdmin || isManager" style="padding: 16px 24px;"><button (click)="editSupplier(s)" class="btn btn-ghost" style="padding: 4px 14px; font-size: 10px;">EDIT</button></td>
                </tr>
                <tr *ngIf="suppliers.length === 0">
                  <td [attr.colspan]="(isAdmin || isManager) ? 8 : 7" style="text-align: center; padding: 100px; color: var(--color-muted); font-style: italic; font-size: 13px; letter-spacing: 2px; opacity: 0.5;">NO SUPPLIERS REGISTERED YET</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`.content-panel { height: 100vh; overflow-y: auto; scrollbar-width: none; } .content-panel::-webkit-scrollbar { display: none; }`]
})
export class SupplierListComponent implements OnInit {
  suppliers: Supplier[] = [];
  showForm = false;
  editingId: string | null = null;
  saving = false;
  errorMsg = '';
  supplierForm: FormGroup;

  get isAdmin(): boolean { return this.authService.currentUser?.role?.toUpperCase() === 'ADMIN'; }
  get isManager(): boolean { return this.authService.currentUser?.role?.toUpperCase() === 'INVENTORY MANAGER'; }

  constructor(private purchaseService: PurchaseService, public router: Router, private fb: FormBuilder, private authService: AuthService) {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      contactPerson: [''],
      email: ['', [Validators.required, Validators.email]],
      phone: [''],
      address: [''],
      city: [''],
      country: [''],
      paymentTerms: [''],
      leadTimeDays: [0],
      rating: [0],
      isActive: [true]
    });
  }

  ngOnInit(): void { this.loadSuppliers(); }

  loadSuppliers(): void {
    this.purchaseService.getSuppliers().subscribe(s => this.suppliers = s);
  }

  openForm(): void {
    this.editingId = null;
    this.supplierForm.reset({ leadTimeDays: 0, rating: 0, isActive: true });
    this.showForm = true;
    this.errorMsg = '';
  }

  editSupplier(s: Supplier): void {
    this.editingId = s.supplierId;
    this.supplierForm.patchValue(s);
    this.showForm = true;
    this.errorMsg = '';
  }

  closeForm(): void { this.showForm = false; this.editingId = null; this.errorMsg = ''; }

  saveSupplier(): void {
    if (this.supplierForm.invalid) return;
    this.saving = true;
    this.errorMsg = '';
    const data = this.supplierForm.value;
    const call = this.editingId
      ? this.purchaseService.updateSupplier(this.editingId, data)
      : this.purchaseService.createSupplier(data);
    call.subscribe({
      next: () => { this.saving = false; this.closeForm(); this.loadSuppliers(); },
      error: (err) => { this.saving = false; this.errorMsg = err.error?.message || 'An error occurred.'; }
    });
  }
}
