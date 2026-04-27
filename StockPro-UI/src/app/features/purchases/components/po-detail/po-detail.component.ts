import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PurchaseService } from '../../services/purchase.service';
import { PurchaseOrder, POLineItem, ReceiveLineItemRequest } from '../../models/purchase.model';
import { AuthService } from '../../../../core/services/auth.service';
import { ProductService } from '../../../products/services/product.service';
import { Product } from '../../../products/models/product.model';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="app-container bg-inventory" style="grid-template-columns: 1fr;">
      <div class="header-shroud"></div>
      <div class="content-panel animate" style="width: 100%; align-items: center; background: none; overflow-x: hidden; padding-top: 160px; padding-bottom: 80px;">
        <div style="width: 92%; max-width: 1200px; display: flex; flex-direction: column;" *ngIf="po">

          <div class="navigation-trail" style="margin-bottom: 1.5rem;">
            <a (click)="router.navigate(['/purchases'])" class="back-link" style="cursor: pointer;">← BACK TO PURCHASE ORDERS</a>
          </div>

          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px;">
            <div>
              <h1 class="title" style="font-family: 'Outfit', sans-serif; font-size: 42px; letter-spacing: -0.04em; margin-bottom: 5px;">PO-{{ po.poId | slice:0:8 | uppercase }}</h1>
              <p style="margin: 0; font-size: 15px; opacity: 0.7;">{{ po.supplierName }}</p>
            </div>
            <span [ngClass]="getStatusClass(po.status)" style="padding: 8px 18px; border-radius: 6px; font-size: 11px; font-weight: 800; letter-spacing: 1.5px;">{{ po.status }}</span>
          </div>

          <!-- Meta Info -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px;">
              <div style="font-size: 10px; text-transform: uppercase; color: var(--color-muted); letter-spacing: 1px; margin-bottom: 6px;">Order Date</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px;">{{ po.orderDate | date:'yyyy.MM.dd' }}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px;">
              <div style="font-size: 10px; text-transform: uppercase; color: var(--color-muted); letter-spacing: 1px; margin-bottom: 6px;">Expected</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px;">{{ po.expectedDate ? (po.expectedDate | date:'yyyy.MM.dd') : '—' }}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px;">
              <div style="font-size: 10px; text-transform: uppercase; color: var(--color-muted); letter-spacing: 1px; margin-bottom: 6px;">Total Value</div>
              <div style="font-size: 18px; font-weight: 700; color: #fff;">{{ po.totalAmount | number:'1.2-2' }}</div>
            </div>
            <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px;">
              <div style="font-size: 10px; text-transform: uppercase; color: var(--color-muted); letter-spacing: 1px; margin-bottom: 6px;">Received On</div>
              <div style="font-family: 'Courier New', monospace; font-size: 14px;">{{ po.receivedDate ? (po.receivedDate | date:'yyyy.MM.dd') : '—' }}</div>
            </div>
          </div>

          <!-- Notes -->
          <div *ngIf="po.notes" style="background: rgba(255,255,255,0.02); border: 1px solid var(--color-border); border-radius: 10px; padding: 18px; margin-bottom: 25px; color: var(--color-muted); font-size: 14px;">
            <strong style="color: #fff; font-size: 10px; text-transform: uppercase; letter-spacing: 1px;">Notes:</strong> {{ po.notes }}
          </div>

          <!-- Approve / Reject / Submit actions -->
          <div *ngIf="showApproveActions || po.status === 'DRAFT'" style="display: flex; gap: 12px; margin-bottom: 25px;">
            <button *ngIf="po.status === 'DRAFT' && canManage" (click)="submitPO()" class="btn btn-outline" style="padding: 10px 22px; color: #facc15; border-color: rgba(250,204,21,0.3);">
              {{ submitting ? 'SUBMITTING...' : 'SUBMIT FOR APPROVAL' }}
            </button>
            <button *ngIf="showApproveActions" (click)="approvePO()" class="btn btn-outline" style="padding: 10px 22px; color: #4ade80; border-color: rgba(74,222,128,0.3);">
              {{ approving ? 'APPROVING...' : 'APPROVE PO' }}
            </button>
            <button *ngIf="showApproveActions" (click)="rejectPO()" class="btn btn-outline" style="padding: 10px 22px; color: #f87171; border-color: rgba(248,113,113,0.3);">
              {{ rejecting ? 'REJECTING...' : 'REJECT PO' }}
            </button>
          </div>

          <!-- Error -->
          <div *ngIf="actionError" style="margin-bottom: 20px; color: #f87171; font-size: 13px; padding: 12px 18px; background: rgba(248,113,113,0.07); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px;">{{ actionError }}</div>

          <!-- Line Items Table -->
          <h3 style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--color-muted); margin-bottom: 15px;">LINE ITEMS</h3>
          <div style="background: rgba(255,255,255,0.02); backdrop-filter: blur(10px); border: 1px solid var(--color-border); border-radius: 12px; width: 100%; overflow: hidden; margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse; text-align: left;">
              <thead>
                <tr style="background: rgba(255,255,255,0.03); border-bottom: 1px solid var(--color-border);">
                  <th style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700;">Product</th>
                  <th style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right;">Ordered</th>
                  <th style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right;">Received</th>
                  <th style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right;">Unit Cost</th>
                  <th style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right;">Line Total</th>
                  <th style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700;">Receipt Status</th>
                  <th *ngIf="showReceiveForm" style="padding: 14px 20px; font-size: 10px; text-transform: uppercase; color: var(--color-muted); font-weight: 700; text-align: right;">Receive Qty</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of po.lineItems; let i = index" style="border-bottom: 1px solid rgba(255,255,255,0.03);">
                  <td style="padding: 14px 20px;">
                    <div style="font-weight: 600; color: #fff;">{{ getProductName(item.productId) }}</div>
                    <div style="font-family: 'Courier New', monospace; font-size: 10px; color: var(--color-muted);">ID: {{ item.productId | slice:0:8 | uppercase }}</div>
                  </td>
                  <td style="padding: 14px 20px; text-align: right; font-weight: 700;">{{ item.quantity }}</td>
                  <td style="padding: 14px 20px; text-align: right;" [style.color]="item.receivedQty >= item.quantity ? '#4ade80' : (item.receivedQty > 0 ? '#facc15' : 'var(--color-muted)')">{{ item.receivedQty }}</td>
                  <td style="padding: 14px 20px; text-align: right; color: var(--color-muted);">{{ item.unitCost | number:'1.2-2' }}</td>
                  <td style="padding: 14px 20px; text-align: right; font-weight: 700; color: #fff;">{{ item.quantity * item.unitCost | number:'1.2-2' }}</td>
                  <td style="padding: 14px 20px;">
                    <span style="font-size: 9px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 8px; border-radius: 4px;"
                          [style.background]="item.receiptStatus === 'FULLY RECEIVED' ? 'rgba(74,222,128,0.1)' : item.receiptStatus === 'PARTIALLY RECEIVED' ? 'rgba(250,204,21,0.1)' : 'rgba(255,255,255,0.05)'"
                          [style.color]="item.receiptStatus === 'FULLY RECEIVED' ? '#4ade80' : item.receiptStatus === 'PARTIALLY RECEIVED' ? '#facc15' : 'var(--color-muted)'">
                      {{ item.receiptStatus }}
                    </span>
                  </td>
                  <td *ngIf="showReceiveForm" style="padding: 14px 20px; text-align: right;">
                    <input type="number" [(ngModel)]="receiveQtys[i]" min="0" [max]="item.quantity - item.receivedQty"
                      style="width: 70px; background: rgba(0,0,0,0.5); border: 1px solid var(--color-border); border-radius: 6px; padding: 6px 10px; color: #fff; text-align: right; font-size: 13px;">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Receive Goods Section -->
          <div *ngIf="canReceive && po.status === 'APPROVED'">
            <div *ngIf="!showReceiveForm">
              <button (click)="openReceive()" class="btn btn-primary" style="padding: 12px 28px;">RECEIVE GOODS</button>
            </div>
            <div *ngIf="showReceiveForm" style="display: flex; gap: 12px; align-items: center;">
              <button (click)="confirmReceive()" class="btn btn-primary" style="padding: 10px 22px;" [disabled]="receiving">{{ receiving ? 'PROCESSING...' : 'CONFIRM RECEIPT' }}</button>
              <button (click)="cancelReceive()" class="btn btn-ghost" style="padding: 10px 22px;">CANCEL</button>
              <span style="font-size: 12px; color: var(--color-muted);">Enter received quantities per line item above.</span>
            </div>
          </div>

        </div>
        <div *ngIf="!po && !loading" style="text-align: center; color: var(--color-muted); margin-top: 200px; font-size: 13px; letter-spacing: 2px; opacity: 0.5;">PURCHASE ORDER NOT FOUND</div>
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
export class PODetailComponent implements OnInit {
  po: PurchaseOrder | null = null;
  products: Product[] = [];
  loading = true;
  actionError = '';
  receiveQtys: number[] = [];
  showReceiveForm = false;
  submitting = false;
  approving = false;
  rejecting = false;
  receiving = false;

  get canManage(): boolean { return ['ADMIN', 'INVENTORY MANAGER'].includes(this.authService.userRole); }
  get canReceive(): boolean { return ['ADMIN', 'INVENTORY MANAGER', 'WAREHOUSE STAFF'].includes(this.authService.userRole); }
  get showApproveActions(): boolean { return this.canManage && this.po?.status === 'PENDING'; }

  constructor(
    private purchaseService: PurchaseService,
    private productService: ProductService,
    private route: ActivatedRoute,
    public router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.productService.getAllProducts().subscribe(p => this.products = p);
    this.purchaseService.getPOById(id).subscribe({
      next: (po) => { this.po = po; this.receiveQtys = po.lineItems.map(() => 0); this.loading = false; },
      error: () => this.loading = false
    });
  }

  getProductName(id: string): string {
    const p = this.products.find(x => x.productId === id);
    return p ? `${p.name} (${p.sku})` : 'Unknown Product';
  }

  submitPO(): void {
    if (!this.po) return;
    this.submitting = true;
    this.purchaseService.submitPO(this.po.poId).subscribe({
      next: (po) => { this.po = po; this.submitting = false; },
      error: (err) => { this.actionError = err.error?.message || 'Failed to submit.'; this.submitting = false; }
    });
  }

  approvePO(): void {
    if (!this.po) return;
    this.approving = true;
    this.purchaseService.approvePO(this.po.poId).subscribe({
      next: (po) => { this.po = po; this.approving = false; this.actionError = ''; },
      error: (err) => { this.actionError = err.error?.message || 'Failed to approve.'; this.approving = false; }
    });
  }

  rejectPO(): void {
    if (!this.po) return;
    this.rejecting = true;
    this.purchaseService.rejectPO(this.po.poId).subscribe({
      next: (po) => { this.po = po; this.rejecting = false; this.actionError = ''; },
      error: (err) => { this.actionError = err.error?.message || 'Failed to reject.'; this.rejecting = false; }
    });
  }

  openReceive(): void { this.showReceiveForm = true; this.receiveQtys = this.po!.lineItems.map(() => 0); }

  cancelReceive(): void { this.showReceiveForm = false; this.actionError = ''; }

  confirmReceive(): void {
    if (!this.po) return;
    this.receiving = true;
    this.actionError = '';

    const items: ReceiveLineItemRequest[] = this.po.lineItems
      .map((item, i) => ({ lineItemId: item.lineItemId, receivedQty: this.receiveQtys[i] || 0 }))
      .filter(r => r.receivedQty > 0);

    if (items.length === 0) {
      this.actionError = 'Please enter at least one received quantity.';
      this.receiving = false;
      return;
    }

    this.purchaseService.receiveGoods({ poId: this.po.poId, items }).subscribe({
      next: (po) => { this.po = po; this.receiving = false; this.showReceiveForm = false; this.receiveQtys = po.lineItems.map(() => 0); },
      error: (err) => { this.actionError = err.error?.message || 'Failed to receive goods.'; this.receiving = false; }
    });
  }

  getStatusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'status-draft', PENDING: 'status-pending', APPROVED: 'status-approved',
      RECEIVED: 'status-received', CANCELLED: 'status-cancelled'
    };
    return map[status] || 'status-draft';
  }
}
