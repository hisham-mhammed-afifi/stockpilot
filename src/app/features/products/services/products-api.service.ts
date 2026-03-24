import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { Product, ProductsResponse } from '../../../shared/models/product.model';

// CONCEPT: Architecture - Feature-specific API services wrap the generic ApiService.
// They provide typed methods for each endpoint, keeping HTTP details out of components.
// Methods return Observable<T> because HttpClient is Observable-based.
// Components bridge to Promises via firstValueFrom() when feeding resource().
@Injectable({ providedIn: 'root' })
export class ProductsApiService {
  private api = inject(ApiService);

  getAll(params: { limit: number; skip: number; sortBy?: string; order?: string }): Observable<ProductsResponse> {
    return this.api.get<ProductsResponse>('/products', params);
  }

  search(query: string, limit = 10): Observable<ProductsResponse> {
    return this.api.get<ProductsResponse>('/products/search', { q: query, limit });
  }

  getById(id: number): Observable<Product> {
    return this.api.get<Product>(`/products/${id}`);
  }

  getCategories(): Observable<{ slug: string; name: string; url: string }[]> {
    return this.api.get<{ slug: string; name: string; url: string }[]>('/products/categories');
  }

  getByCategory(category: string): Observable<ProductsResponse> {
    return this.api.get<ProductsResponse>(`/products/category/${category}`);
  }

  // CONCEPT: Architecture - CRUD methods map 1:1 to REST endpoints.
  // DummyJSON simulates these operations (returns fake responses) but does not persist changes.

  add(product: Partial<Product>): Observable<Product> {
    return this.api.post<Product>('/products/add', product);
  }

  update(id: number, changes: Partial<Product>): Observable<Product> {
    return this.api.put<Product>(`/products/${id}`, changes);
  }

  delete(id: number): Observable<Product & { isDeleted: boolean; deletedOn: string }> {
    return this.api.delete(`/products/${id}`);
  }
}
