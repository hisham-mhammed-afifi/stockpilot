import { computed, inject } from '@angular/core';
import {
  signalStore,
  withState,
  withComputed,
  withMethods,
  withHooks,
  patchState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, tap, switchMap } from 'rxjs';
import { ApiService } from '../../../shared/services/api.service';
import { Todo, TodosResponse } from '../../../shared/models/todo.model';
import { User } from '../../../shared/models/user.model';
import { InventoryStore } from '../../inventory/store/inventory.store';
import { OrdersStore } from '../../orders/store/orders.store';
import { AuthStore } from '../../../core/auth/auth.store';
import { ActivityLogStore } from '../../../core/activity-log/activity-log.store';

// CONCEPT: Aggregation Store - DashboardStore has no domain data of its own (except todos/users).
// It DERIVES everything from other stores. This is a common pattern for summary/reporting views.
// The store acts as a computed aggregation layer over existing data.
export const DashboardStore = signalStore(
  { providedIn: 'root' },

  withState({
    todosLoading: false,
    todos: [] as Todo[],
    usersLoading: false,
    users: [] as User[],
  }),

  withComputed((store) => {
    // CONCEPT: Store reads another store - Inject other stores directly
    // in the withComputed factory. The computed signals track changes
    // from both this store AND the injected stores. When an order status
    // changes in OrdersStore, the dashboard's ordersByStatus computed
    // signal updates automatically.
    const inventoryStore = inject(InventoryStore);
    const ordersStore = inject(OrdersStore);
    const authStore = inject(AuthStore);
    const activityLogStore = inject(ActivityLogStore);

    return {
      // Inventory metrics
      inventoryStats: computed(() => inventoryStore.stats()),
      lowStockProducts: computed(() =>
        inventoryStore
          .entities()
          .filter((p) => p.stock > 0 && p.stock <= 10)
          .slice(0, 5)
      ),

      // Order metrics
      ordersByStatus: computed(() => ordersStore.ordersByStatus()),
      totalRevenue: computed(() => ordersStore.totalRevenue()),
      totalOrders: computed(() => ordersStore.totalOrders()),

      // Activity
      recentActivity: computed(() => activityLogStore.recentEntries()),
      activityByAction: computed(() => activityLogStore.entriesByAction()),

      // User info
      currentUser: computed(() => authStore.user()),

      // Combined metrics
      dashboardSummary: computed(() => ({
        totalProducts: inventoryStore.entities().length,
        totalOrders: ordersStore.totalOrders(),
        totalRevenue: ordersStore.totalRevenue(),
        lowStockCount: inventoryStore
          .entities()
          .filter((p) => p.stock > 0 && p.stock <= 10).length,
        recentActivities: activityLogStore.recentEntries().length,
        pendingTodos: store.todos().filter((t) => !t.completed).length,
      })),
    };
  }),

  withMethods((store, api = inject(ApiService)) => ({
    loadTodos: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { todosLoading: true })),
        switchMap(() =>
          api.get<TodosResponse>('/todos', { limit: 20 }).pipe(
            tapResponse({
              next: (res) =>
                patchState(store, {
                  todos: res.todos,
                  todosLoading: false,
                }),
              error: () => patchState(store, { todosLoading: false }),
            })
          )
        )
      )
    ),

    loadUsers: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { usersLoading: true })),
        switchMap(() =>
          api.get<{ users: User[] }>('/users', { limit: 10 }).pipe(
            tapResponse({
              next: (res) =>
                patchState(store, {
                  users: res.users,
                  usersLoading: false,
                }),
              error: () => patchState(store, { usersLoading: false }),
            })
          )
        )
      )
    ),
  })),

  // CONCEPT: Store lifetime - DashboardStore is providedIn: 'root', so it lives forever.
  // onInit fires once when the store is first injected. The todos and users load immediately.
  // When the user navigates away from the dashboard, the store stays alive but its computed
  // signals only recalculate when something reads them (lazy evaluation).
  withHooks({
    onInit(store) {
      store.loadTodos();
      store.loadUsers();
    },
  }),
);
