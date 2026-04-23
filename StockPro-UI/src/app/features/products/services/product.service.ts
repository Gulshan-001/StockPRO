import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Product, ProductCreateDto, ProductUpdateDto } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API = `${environment.productApiUrl}/api/products`;

  constructor(private http: HttpClient) {}

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(this.API);
  }

  getProductById(id: string): Observable<Product> {
    return this.http.get<Product>(`${this.API}/${id}`);
  }

  getProductByBarcode(barcode: string): Observable<Product> {
    return this.http.get<Product>(`${this.API}/barcode/${barcode}`);
  }

  searchProducts(query: string): Observable<Product[]> {
    const params = new HttpParams().set('q', query);
    return this.http.get<Product[]>(`${this.API}/search`, { params });
  }

  createProduct(product: ProductCreateDto): Observable<Product> {
    return this.http.post<Product>(this.API, product);
  }

  updateProduct(id: string, product: ProductUpdateDto): Observable<Product> {
    return this.http.put<Product>(`${this.API}/${id}`, product);
  }

  deleteProduct(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
