# Section 06: Async & Side Effects

## Duration: ~35 minutes

## CONCEPTS TAUGHT
- `rxMethod()` from `@ngrx/signals/rxjs-interop` for Observable-based side effects
- `tapResponse()` for error-safe response handling
- Flattening operators: `switchMap` vs `concatMap` vs `exhaustMap` and when to use each
- Optimistic updates: update UI first, rollback on error
- Debounce and retry patterns inside rxMethod
- Reactive triggers: passing signals directly to rxMethod

## PREREQUISITES
- Section 04 (SignalStore fundamentals)
- Section 05 (Entities, CRUD)

## API ENDPOINTS USED
- `GET /carts` - all carts (as orders)
- `GET /carts/:id` - single cart
- `GET /carts/user/:userId` - carts by user
- `PUT /carts/:id` - update cart (simulated)
- `DELETE /carts/:id` - delete cart (simulated)
- `GET /todos?limit=20` - todos (used as order tasks)

## DELIVERABLES

### Files to Create

1. **`src/app/features/orders/models/order.model.ts`**
   Map carts to "orders" with added status for kanban:
   ```typescript
   export type OrderStatus = 'new' | 'processing' | 'shipped' | 'delivered';

   export interface Order {
     id: number;
     products: CartProduct[];
     total: number;
     discountedTotal: number;
     userId: number;
     totalProducts: number;
     totalQuantity: number;
     status: OrderStatus; // Client-side enrichment
   }
   ```

2. **`src/app/features/orders/services/orders-api.service.ts`**
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class OrdersApiService {
     private api = inject(ApiService);

     getAll(): Observable<CartsResponse> {
       return this.api.get<CartsResponse>('/carts', { limit: 30 });
     }

     getById(id: number): Observable<Cart> {
       return this.api.get<Cart>(`/carts/${id}`);
     }

     updateStatus(id: number, status: OrderStatus): Observable<Cart> {
       // Simulate status update via PUT
       return this.api.put<Cart>(`/carts/${id}`, { status }).pipe(
         // Add artificial delay to demonstrate async patterns
         delay(800),
       );
     }

     deleteOrder(id: number): Observable<any> {
       return this.api.delete(`/carts/${id}`);
     }
   }
   ```

3. **`src/app/features/orders/store/orders.store.ts`**
   Full SignalStore with `rxMethod` for all async operations:

   ```typescript
   export const OrdersStore = signalStore(
     { providedIn: 'root' },

     withState({
       loading: false,
       error: null as string | null,
       statusFilter: 'all' as OrderStatus | 'all',
     }),

     withEntities<Order>(),

     withComputed((store) => ({
       // Group orders by status for kanban columns
       ordersByStatus: computed(() => {
         const orders = store.entities();
         return {
           new: orders.filter(o => o.status === 'new'),
           processing: orders.filter(o => o.status === 'processing'),
           shipped: orders.filter(o => o.status === 'shipped'),
           delivered: orders.filter(o => o.status === 'delivered'),
         };
       }),
       totalOrders: computed(() => store.entities().length),
       totalRevenue: computed(() =>
         store.entities().reduce((sum, o) => sum + o.discountedTotal, 0)
       ),
     })),

     withMethods((store, ordersApi = inject(OrdersApiService)) => ({

       // CONCEPT: rxMethod<void> - An Observable pipeline triggered imperatively.
       // Unlike async/await, rxMethod gives you full RxJS power:
       // flattening strategy, debounce, retry, cancellation.
       loadOrders: rxMethod<void>(
         pipe(
           tap(() => patchState(store, { loading: true, error: null })),
           // CONCEPT: switchMap - Cancels the previous request if a new one comes in.
           // Perfect for: search-as-you-type, navigation, any "only latest matters" scenario.
           // If the user triggers loadOrders twice quickly, the first HTTP call is cancelled.
           switchMap(() =>
             ordersApi.getAll().pipe(
               tapResponse({
                 next: (response) => {
                   // Enrich carts with random status for kanban demo
                   const statuses: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered'];
                   const orders: Order[] = response.carts.map(cart => ({
                     ...cart,
                     status: statuses[Math.floor(Math.random() * statuses.length)],
                   }));
                   patchState(store, setAllEntities(orders), { loading: false });
                 },
                 // CONCEPT: tapResponse - Error-safe handler that prevents
                 // the outer Observable from dying on error. Without this,
                 // one failed HTTP call would kill the entire rxMethod pipeline.
                 error: (err: Error) => {
                   patchState(store, { loading: false, error: err.message });
                 },
               })
             )
           )
         )
       ),

       // CONCEPT: rxMethod with concatMap - Processes requests one at a time, in order.
       // Perfect for: status updates, form submissions, any "order matters" scenario.
       // If the user moves order A then order B, both updates are applied in sequence.
       updateOrderStatus: rxMethod<{ id: number; status: OrderStatus }>(
         pipe(
           // CONCEPT: Optimistic Update - Update the UI BEFORE the API call.
           // This makes the app feel instant. If the API fails, we rollback.
           tap(({ id, status }) => {
             // Save current state for potential rollback
             patchState(store, updateEntity({ id, changes: { status } }));
           }),
           // CONCEPT: concatMap - Queues requests and processes them one by one.
           // Order A's update completes before order B's update starts.
           concatMap(({ id, status }) =>
             ordersApi.updateStatus(id, status).pipe(
               tapResponse({
                 next: () => {
                   // Already updated optimistically, nothing to do
                 },
                 error: (err: Error) => {
                   // CONCEPT: Rollback - Revert the optimistic update on failure.
                   // In a real app, you'd restore from a saved snapshot.
                   // Here we just show an error and reload.
                   patchState(store, { error: `Failed to update order ${id}: ${err.message}` });
                   // Trigger reload to get correct state from server
                   // (In production, you'd restore from a snapshot instead)
                 },
               })
             )
           )
         )
       ),

       // CONCEPT: rxMethod with exhaustMap - Ignores new requests while one is in progress.
       // Perfect for: "Submit" buttons, any "prevent double-click" scenario.
       // If the user clicks delete twice quickly, only the first click executes.
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

     withHooks({
       onInit(store) {
         store.loadOrders();
       },
     }),
   );
   ```

4. **`src/app/features/orders/components/order-card.component.ts`**
   A draggable order card for the kanban board:
   - Shows: order ID, user ID, total products, total price, discounted price
   - Product list preview (first 3 items with thumbnails)
   - Status chip (color-coded)
   - Action menu (mat-menu): Change Status submenu, Delete

5. **`src/app/features/orders/components/orders-kanban.component.ts`**
   Kanban board with 4 columns:
   ```
   | New | Processing | Shipped | Delivered |
   | [cards] | [cards] | [cards] | [cards] |
   ```

   **Implementation:**
   - Use Angular CDK DragDrop (`cdkDropList`, `cdkDrag`) for drag-and-drop between columns
   - Each column is a `cdkDropList` connected to the other 3
   - On drop: call `store.updateOrderStatus({ id, status: targetColumn })`
   - The optimistic update makes the card appear in the new column instantly
   - Show mat-progress-bar per column when an update is in-flight
   - Column headers show count: "New (5)", "Processing (3)", etc.
   - Use `store.ordersByStatus()` computed signal for column data

   **Also include:**
   - Stats row at top: Total Orders, Total Revenue, Orders by Status breakdown
   - Status filter tabs (mat-tab-group): All, New, Processing, Shipped, Delivered
   - Error snackbar when operations fail

   **Flattening Operator Demo:**
   Add a visible "Async Strategy" toggle (mat-button-toggle-group) that shows text explaining:
   - switchMap: "Latest wins. Good for search/loading. Previous request cancelled."
   - concatMap: "Queue in order. Good for status updates. All requests execute sequentially."
   - exhaustMap: "Ignore while busy. Good for submit buttons. Prevents double-click."

   This is a teaching aid. Show which operator is used for each operation.

6. **`src/app/features/orders/orders.routes.ts`**
   ```typescript
   export const ordersRoutes: Routes = [
     { path: '', component: OrdersKanbanComponent },
   ];
   ```

### Files to Modify

1. **`src/app/core/layout/shell.component.ts`**
   - Enable Orders nav link

2. **`src/app/features/inventory/store/inventory.store.ts`** (optional enhancement)
   Refactor the loadProducts method from async/await to rxMethod to show the migration:
   ```typescript
   // BEFORE (Section 4):
   async loadProducts() { ... }

   // AFTER (Section 6):
   loadProducts: rxMethod<void>(pipe(
     tap(() => patchState(store, { loading: true, error: null })),
     switchMap(() => productsApi.getAll({...}).pipe(
       tapResponse({
         next: (response) => patchState(store, setAllEntities(response.products), { loading: false, total: response.total }),
         error: (err) => patchState(store, { loading: false, error: err.message }),
       })
     ))
   )),
   ```

## IMPLEMENTATION SPEC

### Step 1: Models and API Service
Create order models and OrdersApiService.

### Step 2: OrdersStore
Build the full store with all 3 rxMethod patterns (switchMap, concatMap, exhaustMap).

### Step 3: Kanban Board
Build the drag-and-drop kanban using CDK DragDrop. The key moment is when the presenter drags a card between columns and the UI updates instantly (optimistic) while the API call happens in the background.

### Step 4: Operator Demo
Add the visual teaching aid showing which operator is used where and why.

### Step 5: (Optional) Refactor Inventory
Migrate InventoryStore's loadProducts from async to rxMethod to show the pattern side by side.

## TEACHING NOTES

```typescript
// CONCEPT: rxMethod vs async/await - async methods (Section 4) work fine for simple cases.
// rxMethod adds: cancellation (switchMap), queueing (concatMap), dedup (exhaustMap),
// debounce, retry, and the ability to pass signals directly as triggers.
// Use async/await for simple fire-and-forget. Use rxMethod when you need flow control.

// CONCEPT: switchMap - "Only the latest request matters."
// User types "a", "ab", "abc" quickly. switchMap cancels "a" and "ab" requests.
// Only "abc" completes. Use for: search, navigation, data loading.

// CONCEPT: concatMap - "Every request matters, process them in order."
// User moves order 1 to "shipped", then order 2 to "delivered".
// concatMap ensures order 1's API call finishes before order 2's starts.
// Use for: mutations where order matters, sequential operations.

// CONCEPT: exhaustMap - "Ignore new requests while one is in progress."
// User double-clicks "Delete". exhaustMap ignores the second click.
// Use for: form submissions, delete operations, anything that shouldn't repeat.

// CONCEPT: Optimistic Updates - Update the UI IMMEDIATELY, then call the API.
// If the API succeeds, great, the UI is already correct.
// If the API fails, ROLLBACK to the previous state and show an error.
// This makes the app feel instant even with slow APIs.

// CONCEPT: tapResponse - A safe error handler for rxMethod pipelines.
// Regular .subscribe() or .pipe(catchError()) would kill the outer stream on error.
// tapResponse catches the error, calls your handler, and keeps the stream alive
// so the next rxMethod trigger still works.

// CONCEPT: Reactive triggers - You can pass a signal directly to rxMethod:
// store.loadOrders(someSignal) -- the method re-runs whenever the signal changes.
// This is how you create "auto-fetch when filters change" patterns.
```

## VERIFICATION
1. Kanban board loads with 4 columns and order cards
2. Dragging a card between columns updates status optimistically
3. Failed API calls show error and (ideally) rollback
4. Delete operation works with exhaustMap (no double-delete)
5. Stats row shows correct totals
6. Loading indicators appear during operations
7. Operator demo explains each strategy visually
8. CDK drag-and-drop animations are smooth
