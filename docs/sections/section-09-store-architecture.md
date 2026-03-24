# Section 09: Store Architecture at Scale

## Duration: ~35 minutes

## CONCEPTS TAUGHT
- Store injecting another store (direct reads)
- Reactive cross-store coordination with `effect()`
- Mediator pattern: StoreCoordinator for multi-store workflows
- Circular dependency prevention
- Lazy-loaded feature stores vs global stores (lifetime differences)
- Activity log pattern (event-driven store)
- Dashboard that aggregates data from multiple stores
- Final folder structure walkthrough

## PREREQUISITES
- All previous sections (01-08)

## API ENDPOINTS USED
- `GET /todos?limit=20` - for activity/task simulation
- `GET /users?limit=10` - for dashboard user data
- Reads from already-loaded stores (InventoryStore, OrdersStore, AuthStore)

## DELIVERABLES

### Files to Create

1. **`src/app/core/activity-log/activity-log.models.ts`**
   ```typescript
   export interface ActivityEntry {
     id: string;
     action: 'product_added' | 'product_updated' | 'product_deleted'
       | 'order_status_changed' | 'order_created' | 'order_deleted'
       | 'user_login' | 'user_logout';
     description: string;
     timestamp: number;
     userId: number | null;
     metadata?: Record<string, unknown>;
   }
   ```

2. **`src/app/core/activity-log/activity-log.store.ts`**
   ```typescript
   export const ActivityLogStore = signalStore(
     { providedIn: 'root' },

     withState({
       entries: [] as ActivityEntry[],
       maxEntries: 100,
     }),

     withComputed((store) => ({
       recentEntries: computed(() => store.entries().slice(0, 20)),
       entriesByAction: computed(() => {
         const entries = store.entries();
         const grouped: Record<string, number> = {};
         for (const entry of entries) {
           grouped[entry.action] = (grouped[entry.action] ?? 0) + 1;
         }
         return grouped;
       }),
     })),

     withMethods((store) => ({
       // CONCEPT: Event-driven store - Other stores/services call log() to record events.
       // The ActivityLogStore doesn't know about products or orders.
       // It just receives generic activity entries. Full decoupling.
       log(entry: Omit<ActivityEntry, 'id' | 'timestamp'>) {
         const fullEntry: ActivityEntry = {
           ...entry,
           id: crypto.randomUUID(),
           timestamp: Date.now(),
         };
         patchState(store, (s) => ({
           entries: [fullEntry, ...s.entries].slice(0, s.maxEntries),
         }));
       },
       clear() {
         patchState(store, { entries: [] });
       },
     })),
   );
   ```

3. **`src/app/core/coordination/store-coordinator.service.ts`**
   ```typescript
   // CONCEPT: Mediator Pattern - When multiple stores need to react to the same event,
   // a coordinator prevents circular dependencies and centralizes the workflow.
   // Without this, Store A injects Store B injects Store C injects Store A = circular.
   @Injectable({ providedIn: 'root' })
   export class StoreCoordinator {
     private authStore = inject(AuthStore);
     private inventoryStore = inject(InventoryStore);
     private ordersStore = inject(OrdersStore);
     private notificationsStore = inject(NotificationsStore);
     private activityLogStore = inject(ActivityLogStore);

     constructor() {
       // CONCEPT: effect() for cross-store coordination
       // React to auth changes and trigger actions across multiple stores.
       effect(() => {
         const user = this.authStore.user();
         const status = this.authStore.status();

         untracked(() => {
           if (status === 'authenticated' && user) {
             this.onLogin(user);
           }
         });
       });
     }

     // Called when a user successfully logs in
     onLogin(user: User) {
       // Trigger data loading across stores
       this.inventoryStore.loadProducts();
       this.ordersStore.loadOrders();
       this.notificationsStore.showSuccess(`Welcome back, ${user.firstName}!`);
       this.activityLogStore.log({
         action: 'user_login',
         description: `${user.firstName} ${user.lastName} logged in`,
         userId: user.id,
       });
     }

     // Called when user logs out
     onLogout() {
       this.activityLogStore.log({
         action: 'user_logout',
         description: 'User logged out',
         userId: this.authStore.user()?.id ?? null,
       });
       // Note: individual store cleanup happens in their own methods
       // The coordinator orchestrates the sequence
     }

     // Called when a product is added/updated/deleted in inventory
     onProductChange(action: 'product_added' | 'product_updated' | 'product_deleted', productTitle: string) {
       this.activityLogStore.log({
         action,
         description: `Product "${productTitle}" was ${action.replace('product_', '')}`,
         userId: this.authStore.user()?.id ?? null,
       });
     }

     // Called when an order status changes
     onOrderStatusChange(orderId: number, newStatus: string) {
       this.activityLogStore.log({
         action: 'order_status_changed',
         description: `Order #${orderId} moved to "${newStatus}"`,
         userId: this.authStore.user()?.id ?? null,
       });
     }
   }
   ```

4. **`src/app/features/dashboard/store/dashboard.store.ts`**
   ```typescript
   // CONCEPT: Aggregation Store - Reads from multiple other stores to compute
   // dashboard-level metrics. This store has no API calls of its own.
   // It only derives data from other stores.
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
       // from both this store AND the injected stores.
       const inventoryStore = inject(InventoryStore);
       const ordersStore = inject(OrdersStore);
       const authStore = inject(AuthStore);
       const activityLogStore = inject(ActivityLogStore);

       return {
         // Inventory metrics
         inventoryStats: computed(() => inventoryStore.stats()),
         lowStockProducts: computed(() =>
           inventoryStore.entities().filter(p => p.stock > 0 && p.stock <= 10).slice(0, 5)
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
           lowStockCount: inventoryStore.entities().filter(p => p.stock > 0 && p.stock <= 10).length,
           recentActivities: activityLogStore.recentEntries().length,
           pendingTodos: store.todos().filter(t => !t.completed).length,
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
                 next: (res) => patchState(store, { todos: res.todos, todosLoading: false }),
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
                 next: (res) => patchState(store, { users: res.users, usersLoading: false }),
                 error: () => patchState(store, { usersLoading: false }),
               })
             )
           )
         )
       ),
     })),

     withHooks({
       onInit(store) {
         store.loadTodos();
         store.loadUsers();
       },
     }),
   );
   ```

5. **`src/app/features/dashboard/dashboard.component.ts`**
   Full dashboard page with Material cards and data visualization:

   **Layout (responsive grid):**

   Row 1: Summary cards (4 across)
   - Total Products (from inventoryStore)
   - Total Orders (from ordersStore)
   - Total Revenue (from ordersStore)
   - Low Stock Alerts (from inventoryStore)

   Row 2: Two columns
   - LEFT: Orders by Status breakdown (mat-list with status chips and counts)
   - RIGHT: Low Stock Products table (mat-table with product name, stock, price)

   Row 3: Two columns
   - LEFT: Recent Activity feed (mat-list with action icon, description, timestamp using DatePipe)
   - RIGHT: Pending Todos (mat-checkbox list from /todos API)

   Row 4: Full width
   - Activity breakdown by type (horizontal bar of mat-chips showing counts per action type)

   **All data is reactive.** If the user has inventory and orders pages open in other tabs and data changes, the dashboard reflects it because it reads from shared stores.

6. **`src/app/features/dashboard/dashboard.routes.ts`**
   ```typescript
   export const dashboardRoutes: Routes = [
     { path: '', component: DashboardComponent },
   ];
   ```

### Files to Modify

1. **`src/app/core/layout/shell.component.ts`**
   - Enable Dashboard nav link
   - Inject StoreCoordinator in the shell component (or app.component) to ensure it's instantiated:
   ```typescript
   // CONCEPT: Eager initialization - The coordinator uses effect() in its constructor.
   // We inject it in the shell to ensure it's created early, even if no component
   // directly depends on it.
   private coordinator = inject(StoreCoordinator);
   ```

2. **`src/app/features/inventory/store/inventory.store.ts`**
   - In addProduct, updateProduct, deleteProduct methods, call StoreCoordinator:
   ```typescript
   // After successful add:
   inject(StoreCoordinator).onProductChange('product_added', created.title);
   ```

3. **`src/app/features/orders/store/orders.store.ts`**
   - In updateOrderStatus, call coordinator:
   ```typescript
   // After successful status change:
   inject(StoreCoordinator).onOrderStatusChange(id, status);
   ```

4. **`src/app/core/auth/auth.store.ts`**
   - On logout, call coordinator.onLogout() before clearing state

## IMPLEMENTATION SPEC

### Step 1: Activity Log Store
Create the event-driven activity log store.

### Step 2: Store Coordinator
Build the mediator service that wires cross-store workflows.

### Step 3: Wire Coordinator
Inject coordinator in shell. Add coordinator calls to inventory and orders stores.

### Step 4: Dashboard Store
Build the aggregation store that reads from InventoryStore, OrdersStore, AuthStore, ActivityLogStore.

### Step 5: Dashboard UI
Build the full dashboard page with summary cards, lists, and activity feed.

### Step 6: Enable Route
Wire dashboard route, enable nav link.

## TEACHING NOTES

```typescript
// CONCEPT: Store reading another store - DashboardStore injects InventoryStore
// and OrdersStore in withComputed. The computed signals automatically track changes
// from ALL injected stores. When an order status changes in OrdersStore,
// the dashboard's ordersByStatus computed signal updates automatically.

// CONCEPT: Mediator Pattern - Without the StoreCoordinator:
// InventoryStore would need to inject ActivityLogStore + NotificationsStore
// OrdersStore would need to inject ActivityLogStore + NotificationsStore
// AuthStore would need to inject InventoryStore + OrdersStore + NotificationsStore
// That's tight coupling. With the coordinator, each store stays independent.
// The coordinator is the ONLY place that knows about cross-store workflows.

// CONCEPT: effect() for cross-store reactions - The coordinator uses effect()
// to watch authStore.user() and trigger actions across stores.
// This is a valid use of effect(): the reaction involves multiple external systems
// (other stores, router) that cannot be expressed as a single computed().

// CONCEPT: Circular dependency prevention - If Store A injects Store B
// and Store B injects Store A, Angular throws a circular dependency error.
// The coordinator breaks this cycle: both stores are independent,
// and the coordinator injects both without creating a cycle.

// CONCEPT: Eager vs lazy initialization - StoreCoordinator is injected in the shell
// to ensure its constructor runs early. Without this, the coordinator's effect()
// wouldn't activate until some component happened to inject it.

// CONCEPT: Aggregation Store - DashboardStore has no data of its own (except todos/users).
// It DERIVES everything from other stores. This is a common pattern for summary/reporting views.
// The store acts as a computed aggregation layer over existing data.

// CONCEPT: Store lifetime - InventoryStore (providedIn: 'root') lives forever.
// OrderBuilderStore (provided in route) dies on navigation.
// DashboardStore (providedIn: 'root') reads from long-lived stores.
// When DashboardComponent unmounts, the store stays alive but its computed signals
// only recalculate when something reads them (lazy evaluation).
```

## VERIFICATION
1. Dashboard loads with all 4 summary cards showing real data
2. Orders by status breakdown matches the kanban view
3. Low stock products list shows correct items
4. Recent activity shows login event after logging in
5. Adding/editing/deleting inventory products creates activity entries
6. Moving orders on kanban creates activity entries
7. StoreCoordinator triggers inventory + orders load on login
8. Dashboard updates reactively when data changes in other stores
9. Todo list loads from API and shows pending items
10. No circular dependency errors in console
