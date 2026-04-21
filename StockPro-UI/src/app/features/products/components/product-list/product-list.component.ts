import { Component, OnInit } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = false;
  searchQuery = '';
  private searchSubject = new Subject<string>();

  canManage = false;

  constructor(
    private productService: ProductService,
    private authService: AuthService
  ) {
    const role = this.authService.userRole;
    this.canManage = role === 'Inventory Manager' || role === 'Admin';
  }

  ngOnInit(): void {
    this.loadProducts();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        this.loading = true;
        return query ? this.productService.searchProducts(query) : this.productService.getAllProducts();
      })
    ).subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  loadProducts(): void {
    this.loading = true;
    this.productService.getAllProducts().subscribe({
      next: (data) => {
        this.products = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  onSearch(query: string): void {
    this.searchSubject.next(query);
  }

  toggleStatus(product: Product): void {
    if (!this.canManage) return;
    
    const updated = { ...product, isActive: !product.isActive };
    this.productService.updateProduct(product.productId, updated).subscribe({
      next: (res) => {
        const index = this.products.findIndex(p => p.productId === res.productId);
        if (index !== -1) {
          this.products[index] = res;
        }
      }
    });
  }

  deleteProduct(id: string): void {
    if (!this.canManage || !confirm('Are you sure you want to delete this product?')) return;

    this.productService.deleteProduct(id).subscribe({
      next: () => {
        this.products = this.products.filter(p => p.productId !== id);
      }
    });
  }
}
