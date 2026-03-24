import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';

import { Product } from '../../../shared/models/product.model';
import { ProductsApiService } from '../../products/services/products-api.service';
import { OrdersApiService } from '../../orders/services/orders-api.service';
import { withLoading } from '../../../shared/store-features/with-loading';
import { withPagination } from '../../../shared/store-features/with-pagination';
import { withUndoRedo } from '../../../shared/store-features/with-undo-redo';

// CONCEPT: Feature-scoped store - Provided at route level, not root.
// It is created when the user navigates to /order-builder and destroyed when they leave.
// Compare with InventoryStore (providedIn: 'root') which lives forever.

export interface OrderItem {
  productId: number;
  quantity: number;
  title: string;
  price: number;
  thumbnail: string;
}

type OrderBuilderState = {
  currentStep: number;
  selectedProducts: OrderItem[];
  notes: string;
};

export const OrderBuilderStore = signalStore(
  withState<OrderBuilderState>({
    currentStep: 0,
    selectedProducts: [],
    notes: '',
  }),

  // CONCEPT: Composing features - This store uses 3 reusable features.
  // Each adds state, computed signals, and methods without any duplication.
  // Feature composition order matters: later features CAN access state/methods
  // from earlier features. withLoading() must come before withMethods() that calls setLoading().
  withLoading(),
  withPagination({ pageSize: 10 }),
  withUndoRedo<OrderBuilderState>(['selectedProducts', 'notes']),

  // CONCEPT: withEntities - Normalized storage for available products to browse.
  // These are the products the user can add to their order (loaded from API).
  withEntities<Product>(),

  withComputed((store) => ({
    orderTotal: computed(() =>
      store.selectedProducts().reduce((sum, p) => sum + p.price * p.quantity, 0)
    ),
    itemCount: computed(() =>
      store.selectedProducts().reduce((sum, p) => sum + p.quantity, 0)
    ),
    canSubmit: computed(() => store.selectedProducts().length > 0 && !store.loading()),
    steps: computed(() => ['Select Products', 'Review & Notes', 'Confirm']),
    isLastStep: computed(() => store.currentStep() === 2),
  })),

  withMethods((store, productsApi = inject(ProductsApiService), ordersApi = inject(OrdersApiService)) => ({
    // CONCEPT: rxMethod - switchMap cancels the previous request if pagination changes quickly.
    // Uses withLoading's setLoading/setLoaded/setError and withPagination's pageSize/skip.
    loadAvailableProducts: rxMethod<void>(
      pipe(
        tap(() => store.setLoading()),
        switchMap(() =>
          productsApi.getAll({ limit: store.pageSize(), skip: store.skip() }).pipe(
            tapResponse({
              next: (res) => {
                patchState(store, setAllEntities(res.products));
                store.setTotalItems(res.total);
                store.setLoaded();
              },
              error: (err: Error) => store.setError(err.message),
            })
          )
        )
      )
    ),

    addToOrder(product: Product, quantity = 1) {
      // CONCEPT: snapshot() before mutation - Save current state for undo.
      // If the user regrets this action, they can press Undo to restore.
      store.snapshot();
      patchState(store, (s) => ({
        selectedProducts: [
          ...s.selectedProducts.filter(p => p.productId !== product.id),
          { productId: product.id, quantity, title: product.title, price: product.price, thumbnail: product.thumbnail },
        ],
      }));
    },

    removeFromOrder(productId: number) {
      store.snapshot();
      patchState(store, (s) => ({
        selectedProducts: s.selectedProducts.filter(p => p.productId !== productId),
      }));
    },

    updateQuantity(productId: number, quantity: number) {
      store.snapshot();
      patchState(store, (s) => ({
        selectedProducts: s.selectedProducts.map(p =>
          p.productId === productId ? { ...p, quantity } : p
        ),
      }));
    },

    setNotes(notes: string) {
      patchState(store, { notes });
    },

    nextStep() {
      patchState(store, (s) => ({ currentStep: Math.min(s.currentStep + 1, 2) }));
    },
    prevStep() {
      patchState(store, (s) => ({ currentStep: Math.max(s.currentStep - 1, 0) }));
    },
    goToStep(step: number) {
      patchState(store, { currentStep: step });
    },

    // CONCEPT: rxMethod with exhaustMap - Ignores duplicate submit clicks while
    // the first request is in-flight. Prevents double-ordering.
    submitOrder: rxMethod<void>(
      pipe(
        tap(() => store.setLoading()),
        exhaustMap(() => {
          const products = store.selectedProducts().map(p => ({
            id: p.productId,
            quantity: p.quantity,
          }));
          return ordersApi.createOrder(1, products).pipe(
            tapResponse({
              next: () => {
                store.setLoaded();
                patchState(store, { selectedProducts: [], notes: '', currentStep: 0 });
                store.clearHistory();
              },
              error: (err: Error) => store.setError(err.message),
            })
          );
        })
      )
    ),
  })),

  withHooks({
    onInit(store) {
      // CONCEPT: withHooks onInit - Load the first page of products automatically
      // when the store is created (i.e., when the user navigates to /order-builder).
      store.loadAvailableProducts();
    },
  }),
);
