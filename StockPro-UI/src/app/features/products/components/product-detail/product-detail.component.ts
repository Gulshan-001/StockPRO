import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product?: Product;
  loading = false;
  canManage = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private authService: AuthService
  ) {
    const role = this.authService.userRole;
    this.canManage = role === 'Inventory Manager' || role === 'Admin';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadProduct(id);
    }
  }

  loadProduct(id: string): void {
    this.loading = true;
    this.productService.getProductById(id).subscribe({
      next: (data) => {
        this.product = data;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  editProduct(): void {
    if (this.product) {
      this.router.navigate(['/products', this.product.productId, 'edit']);
    }
  }
}
