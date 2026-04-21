import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

@Component({
  standalone: true,
  selector: 'app-product-form',
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  productForm: FormGroup;
  isEditMode = false;
  productId?: string;
  loading = false;
  submitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.productForm = this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: [''],
      category: [''],
      brand: [''],
      unitOfMeasure: [''],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
      maxStockLevel: [100, [Validators.required, Validators.min(1)]],
      leadTimeDays: [null, [Validators.min(0)]],
      barcode: ['', [Validators.maxLength(100)]],
      imageUrl: ['', [Validators.maxLength(255)]],
      isActive: [true]
    }, { validators: this.pricingValidator });
  }

  ngOnInit(): void {
    this.productId = this.route.snapshot.params['id'];
    if (this.productId) {
      this.isEditMode = true;
      this.loadProduct();
    }
  }

  pricingValidator(group: FormGroup) {
    const cost = group.get('costPrice')?.value;
    const selling = group.get('sellingPrice')?.value;
    return cost <= selling ? null : { pricingError: true };
  }

  loadProduct(): void {
    if (!this.productId) return;
    this.loading = true;
    this.productService.getProductById(this.productId).subscribe({
      next: (product) => {
        this.productForm.patchValue(product);
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load product.';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.submitting = true;
    this.errorMessage = '';

    const data = this.productForm.value;

    if (this.isEditMode && this.productId) {
      this.productService.updateProduct(this.productId, data).subscribe({
        next: () => this.router.navigate(['/products']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Update failed.';
          this.submitting = false;
        }
      });
    } else {
      this.productService.createProduct(data).subscribe({
        next: () => this.router.navigate(['/products']),
        error: (err) => {
          this.errorMessage = err.error?.message || 'Creation failed.';
          this.submitting = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/products']);
  }
}
