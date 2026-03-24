import { CartProduct, Cart, CartsResponse } from '../../../shared/models/cart.model';

// CONCEPT: Architecture - We map the DummyJSON "Cart" to our domain "Order".
// The API returns carts, but our UI treats them as orders with a status lifecycle.
// This is a common pattern: API models vs. domain models.

export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered';

export interface Order {
  id: number;
  products: CartProduct[];
  total: number;
  discountedTotal: number;
  userId: number;
  totalProducts: number;
  totalQuantity: number;
  // CONCEPT: Client-side enrichment - "status" does not exist on the API response.
  // We add it locally to support the kanban board workflow.
  status: OrderStatus;
}

export type { CartProduct, Cart, CartsResponse };
