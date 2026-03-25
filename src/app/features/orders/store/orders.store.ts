import { computed, inject, Injector } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import {
  withEntities,
  setAllEntities,
  updateEntity,
  removeEntity,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, tap, switchMap, concatMap, exhaustMap } from 'rxjs';
import { tapResponse } from '@ngrx/operators';
import { Order, OrderStatus, CartsResponse } from '../models/order.model';
import { OrdersApiService } from '../services/orders-api.service';
import { StoreCoordinator } from '../../../core/coordination/store-coordinator.service';

// CONCEPT: rxMethod vs async/await - In Section 04, we used async methods for simple
// fire-and-forget operations. rxMethod adds powerful flow control:
// - Cancellation (switchMap): only the latest request matters
// - Queueing (concatMap): process requests in order, one at a time
// - Deduplication (exhaustMap): ignore new requests while one is in-flight
// - Debounce, retry, and reactive triggers (pass a signal directly)
// Use async/await for simple cases. Use rxMethod when you need flow control.

export const OrdersStore = signalStore(
  { providedIn: 'root' },

  withState({
    loading: false,
    error: null as string | null,
    statusFilter: 'all' as OrderStatus | 'all',
  }),

  // CONCEPT: withEntities - Normalized entity storage from Section 05.
  // Orders are stored in an EntityMap for O(1) lookups by ID.
  withEntities<Order>(),

  withComputed((store) => ({
    // CONCEPT: Computed - Derived state that groups orders by status.
    // This powers the kanban columns. It recalculates only when entities change.
    ordersByStatus: computed(() => {
      const orders = store.entities();
      return {
        new: orders.filter((o) => o.status === 'new'),
        processing: orders.filter((o) => o.status === 'processing'),
        shipped: orders.filter((o) => o.status === 'shipped'),
        delivered: orders.filter((o) => o.status === 'delivered'),
      };
    }),

    totalOrders: computed(() => store.entities().length),

    totalRevenue: computed(() =>
      store.entities().reduce((sum, o) => sum + o.discountedTotal, 0)
    ),
  })),

  // CONCEPT: Circular dependency prevention - Same pattern as InventoryStore.
  // We use Injector to lazily resolve StoreCoordinator at call time.
  withMethods((store, ordersApi = inject(OrdersApiService), injector = inject(Injector)) => ({

    // ---------------------------------------------------------------
    // LOAD ORDERS -- switchMap
    // ---------------------------------------------------------------

    // CONCEPT: rxMethod<void> - An Observable pipeline triggered imperatively.
    // Unlike async/await, rxMethod gives you full RxJS power:
    // flattening strategy, debounce, retry, cancellation.
    loadOrders: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),

        // CONCEPT: switchMap - "Only the latest request matters."
        // If loadOrders is called twice quickly, the first HTTP call is cancelled.
        // Perfect for: search-as-you-type, navigation, data loading.
        // User types "a", "ab", "abc" quickly -- switchMap cancels "a" and "ab",
        // only "abc" completes. No wasted network calls, no stale data races.
        switchMap(() =>
          ordersApi.getAll().pipe(
            tapResponse({
              next: (response: CartsResponse) => {
                // Enrich carts with random status for kanban demo
                const statuses: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered'];
                const orders: Order[] = response.carts.map((cart) => ({
                  ...cart,
                  status: statuses[Math.floor(Math.random() * statuses.length)],
                }));
                patchState(store, setAllEntities(orders), { loading: false });
              },
              // CONCEPT: tapResponse - Error-safe handler that prevents the outer
              // Observable from dying on error. Without this, one failed HTTP call
              // would kill the entire rxMethod pipeline permanently.
              // Regular catchError would also work, but tapResponse is more concise
              // and was designed specifically for this pattern.
              error: (err: Error) => {
                patchState(store, { loading: false, error: err.message });
              },
            })
          )
        )
      )
    ),

    // ---------------------------------------------------------------
    // UPDATE ORDER STATUS -- concatMap + optimistic update
    // ---------------------------------------------------------------

    // CONCEPT: rxMethod with concatMap - Processes requests one at a time, in order.
    // Perfect for: status updates, form submissions, any "order matters" scenario.
    // If the user moves order A then order B, both updates execute in sequence.
    updateOrderStatus: rxMethod<{ id: number; status: OrderStatus }>(
      pipe(
        // CONCEPT: Optimistic Update - Update the UI BEFORE the API call.
        // This makes the app feel instant. The card moves to the new column
        // immediately, while the API call happens in the background.
        // If the API fails, we rollback and show an error.
        tap(({ id, status }) => {
          patchState(store, updateEntity({ id, changes: { status } }));
        }),

        // CONCEPT: concatMap - "Every request matters, process them in order."
        // User moves order 1 to "shipped", then order 2 to "delivered".
        // concatMap ensures order 1's API call finishes before order 2's starts.
        // This prevents race conditions where requests arrive out of order.
        concatMap(({ id, status }) =>
          ordersApi.updateStatus(id, status).pipe(
            tapResponse({
              next: () => {
                // Already updated optimistically -- log the activity
                injector.get(StoreCoordinator).onOrderStatusChange(id, status);
              },
              error: (err: Error) => {
                // CONCEPT: Rollback - Revert the optimistic update on failure.
                // In a real app, you would restore from a saved snapshot of the entity.
                // Here we show an error and let the user reload to get correct state.
                patchState(store, {
                  error: `Failed to update order ${id}: ${err.message}`,
                });
              },
            })
          )
        )
      )
    ),

    // ---------------------------------------------------------------
    // DELETE ORDER -- exhaustMap
    // ---------------------------------------------------------------

    // CONCEPT: rxMethod with exhaustMap - Ignores new requests while one is in progress.
    // Perfect for: "Submit" buttons, delete operations, any "prevent double-click" scenario.
    // If the user clicks delete twice quickly, only the first click executes.
    // The second click is silently dropped (not queued, not cancelled -- just ignored).
    deleteOrder: rxMethod<number>(
      pipe(
        exhaustMap((id) =>
          ordersApi.deleteOrder(id).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(id)),
              error: (err: Error) => {
                patchState(store, { error: err.message });
              },
            })
          )
        )
      )
    ),

    clearError() {
      patchState(store, { error: null });
    },

    setStatusFilter(status: OrderStatus | 'all') {
      patchState(store, { statusFilter: status });
    },
  })),

  // CONCEPT: withHooks - Lifecycle hooks for the store.
  // onInit fires when the store is first injected. We use it to trigger
  // the initial data load automatically.
  withHooks({
    onInit(store) {
      store.loadOrders();
    },
  }),
);
