import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { delay } from 'rxjs/operators';
import { ApiService } from '../../../shared/services/api.service';
import { Cart, CartsResponse, OrderStatus } from '../models/order.model';

// CONCEPT: Architecture - The API service is a thin wrapper around ApiService.
// It knows about endpoints and response shapes, but nothing about state management.
// Components never call this directly -- they go through the store.

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private api = inject(ApiService);

  getAll(): Observable<CartsResponse> {
    return this.api.get<CartsResponse>('/carts', { limit: 30 });
  }

  getById(id: number): Observable<Cart> {
    return this.api.get<Cart>(`/carts/${id}`);
  }

  // CONCEPT: Simulated mutation - DummyJSON accepts PUT but returns the original data.
  // We add an artificial delay (800ms) so you can observe the async behavior:
  // the optimistic update happens instantly, then the API confirms (or fails) later.
  updateStatus(id: number, status: OrderStatus): Observable<Cart> {
    return this.api.put<Cart>(`/carts/${id}`, { status }).pipe(
      delay(800),
    );
  }

  deleteOrder(id: number): Observable<Cart> {
    return this.api.delete<Cart>(`/carts/${id}`);
  }

  // CONCEPT: Architecture - POST /carts/add simulates creating an order.
  // DummyJSON accepts the request and returns a response but does not persist.
  createOrder(userId: number, products: { id: number; quantity: number }[]): Observable<Cart> {
    return this.api.post<Cart>('/carts/add', { userId, products });
  }
}
