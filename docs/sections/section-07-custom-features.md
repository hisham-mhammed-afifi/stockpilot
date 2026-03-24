# Section 07: Custom Store Features (Composability)

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- `signalStoreFeature()` for reusable store plugins
- Building `withLoading()`, `withPagination()`, `withUndoRedo()`, `withLocalStorage()`
- Composing multiple features into a single store
- Feature ordering and dependency awareness
- Applying features to multiple stores
- Multi-step form with undo/redo

## PREREQUISITES
- Section 04-06 (SignalStore, entities, rxMethod)

## API ENDPOINTS USED
- `GET /products?limit=10&skip=N` - paginated products for order builder
- `POST /carts/add` - create a new cart/order (simulated)

## DELIVERABLES

### Files to Create

1. **`src/app/shared/store-features/with-loading.ts`**
   ```typescript
   import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

   // CONCEPT: signalStoreFeature() - Creates a reusable plugin that can be added
   // to ANY SignalStore via composition. Write once, use in every store.
   // This eliminates the loading/error boilerplate from every store.
   export function withLoading() {
     return signalStoreFeature(
       withState({
         loading: false,
         error: null as string | null,
       }),
       withComputed((state) => ({
         hasError: computed(() => state.error() !== null),
       })),
       withMethods((store) => ({
         setLoading() {
           patchState(store, { loading: true, error: null });
         },
         setLoaded() {
           patchState(store, { loading: false });
         },
         setError(error: string) {
           patchState(store, { loading: false, error });
         },
         clearError() {
           patchState(store, { error: null });
         },
       })),
     );
   }
   ```

2. **`src/app/shared/store-features/with-pagination.ts`**
   ```typescript
   // CONCEPT: Parameterized features - Accept configuration via function arguments.
   // This makes the feature flexible: withPagination({ pageSize: 10 }) vs withPagination({ pageSize: 50 }).
   export function withPagination(config?: { pageSize?: number }) {
     const pageSize = config?.pageSize ?? 20;

     return signalStoreFeature(
       withState({
         currentPage: 1,
         pageSize,
         totalItems: 0,
       }),
       withComputed((state) => ({
         totalPages: computed(() => Math.ceil(state.totalItems() / state.pageSize())),
         skip: computed(() => (state.currentPage() - 1) * state.pageSize()),
         hasNextPage: computed(() => state.currentPage() < Math.ceil(state.totalItems() / state.pageSize())),
         hasPrevPage: computed(() => state.currentPage() > 1),
         paginationInfo: computed(() => ({
           page: state.currentPage(),
           pageSize: state.pageSize(),
           total: state.totalItems(),
           totalPages: Math.ceil(state.totalItems() / state.pageSize()),
           showing: {
             from: (state.currentPage() - 1) * state.pageSize() + 1,
             to: Math.min(state.currentPage() * state.pageSize(), state.totalItems()),
           },
         })),
       })),
       withMethods((store) => ({
         nextPage() {
           patchState(store, (s) => ({
             currentPage: Math.min(s.currentPage + 1, Math.ceil(s.totalItems / s.pageSize)),
           }));
         },
         prevPage() {
           patchState(store, (s) => ({
             currentPage: Math.max(s.currentPage - 1, 1),
           }));
         },
         goToPage(page: number) {
           patchState(store, { currentPage: page });
         },
         setTotalItems(total: number) {
           patchState(store, { totalItems: total });
         },
         resetPagination() {
           patchState(store, { currentPage: 1 });
         },
         setPageSize(size: number) {
           patchState(store, { pageSize: size, currentPage: 1 });
         },
       })),
     );
   }
   ```

3. **`src/app/shared/store-features/with-undo-redo.ts`**
   ```typescript
   // CONCEPT: Generic undo/redo - Works with any state shape.
   // The feature maintains a history stack and a future stack.
   // snapshot() saves current state, undo() pops from history, redo() pops from future.
   export function withUndoRedo<State extends Record<string, unknown>>(
     stateKeys: (keyof State)[]
   ) {
     return signalStoreFeature(
       withState({
         _undoHistory: [] as Partial<State>[],
         _redoFuture: [] as Partial<State>[],
       }),
       withComputed((state) => ({
         canUndo: computed(() => (state as any)._undoHistory().length > 0),
         canRedo: computed(() => (state as any)._redoFuture().length > 0),
         historyLength: computed(() => (state as any)._undoHistory().length),
       })),
       withMethods((store) => ({
         // Call snapshot() BEFORE making a change to save the current state
         snapshot() {
           const current: any = {};
           for (const key of stateKeys) {
             current[key] = (store as any)[key]();
           }
           patchState(store as any, (s: any) => ({
             _undoHistory: [...s._undoHistory, current].slice(-50), // Keep max 50 snapshots
             _redoFuture: [], // Clear redo stack on new action
           }));
         },
         undo() {
           const history = (store as any)._undoHistory();
           if (history.length === 0) return;
           // Save current state to redo stack
           const current: any = {};
           for (const key of stateKeys) {
             current[key] = (store as any)[key]();
           }
           const previous = history[history.length - 1];
           patchState(store as any, {
             ...previous,
             _undoHistory: history.slice(0, -1),
             _redoFuture: [...(store as any)._redoFuture(), current],
           });
         },
         redo() {
           const future = (store as any)._redoFuture();
           if (future.length === 0) return;
           const current: any = {};
           for (const key of stateKeys) {
             current[key] = (store as any)[key]();
           }
           const next = future[future.length - 1];
           patchState(store as any, {
             ...next,
             _redoFuture: future.slice(0, -1),
             _undoHistory: [...(store as any)._undoHistory(), current],
           });
         },
         clearHistory() {
           patchState(store as any, { _undoHistory: [], _redoFuture: [] });
         },
       })),
     );
   }
   ```

4. **`src/app/shared/store-features/with-local-storage.ts`**
   ```typescript
   // CONCEPT: Persistence feature - Automatically saves/restores state to localStorage.
   // Combined with withHooks, it loads saved state on init and saves on every change.
   export function withLocalStorage<Key extends string>(
     storageKey: string,
     keys: Key[]
   ) {
     return signalStoreFeature(
       withMethods((store) => ({
         _saveToStorage() {
           const data: Record<string, unknown> = {};
           for (const key of keys) {
             data[key] = (store as any)[key]();
           }
           try {
             localStorage.setItem(storageKey, JSON.stringify(data));
           } catch { /* quota exceeded, silently fail */ }
         },
         _loadFromStorage(): Partial<Record<Key, unknown>> | null {
           try {
             const raw = localStorage.getItem(storageKey);
             return raw ? JSON.parse(raw) : null;
           } catch {
             return null;
           }
         },
       })),
       withHooks({
         onInit(store: any) {
           const saved = store._loadFromStorage();
           if (saved) {
             patchState(store, saved);
           }
           // Auto-save on changes
           for (const key of keys) {
             effect(() => {
               (store as any)[key](); // Track the signal
               untracked(() => store._saveToStorage());
             });
           }
         },
       }),
     );
   }
   ```

5. **`src/app/features/order-builder/store/order-builder.store.ts`**
   Multi-step order builder using composed features:
   ```typescript
   type OrderBuilderState = {
     currentStep: number;
     selectedProducts: { productId: number; quantity: number; title: string; price: number; thumbnail: string }[];
     notes: string;
   };

   export const OrderBuilderStore = signalStore(
     // CONCEPT: Feature-scoped store - Provided at route level, not root.
     // It is created when the user navigates to /order-builder and destroyed when they leave.

     withState<OrderBuilderState>({
       currentStep: 0,
       selectedProducts: [],
       notes: '',
     }),

     // CONCEPT: Composing features - This store uses 3 reusable features.
     // Each adds state, computed signals, and methods without any duplication.
     withLoading(),
     withPagination({ pageSize: 10 }),
     withUndoRedo<OrderBuilderState>(['selectedProducts', 'notes']),

     withEntities<Product>(), // available products to choose from

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
         // CONCEPT: snapshot() before mutation - Save current state for undo
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
         store.loadAvailableProducts();
       },
     }),
   );
   ```

6. **`src/app/features/orders/services/orders-api.service.ts`** (update)
   Add createOrder method:
   ```typescript
   createOrder(userId: number, products: { id: number; quantity: number }[]): Observable<Cart> {
     return this.api.post<Cart>('/carts/add', { userId, products });
   }
   ```

7. **`src/app/features/order-builder/components/order-builder.component.ts`**
   Multi-step wizard with mat-stepper:
   - Step 1: Product selection grid (paginated via withPagination)
     - Product cards with "Add to Order" button and quantity input
     - Selected products shown as chips/badges
   - Step 2: Review order
     - Table of selected products with quantity adjustment and remove
     - Notes textarea
     - Order total display
   - Step 3: Confirmation
     - Order summary
     - Submit button

   **Undo/Redo toolbar:**
   - Persistent toolbar at top with: Undo button, Redo button, History count badge
   - Undo/redo affect product selections and notes
   - Show `store.canUndo()` and `store.canRedo()` to enable/disable buttons

8. **`src/app/features/order-builder/order-builder.routes.ts`**
   ```typescript
   export const orderBuilderRoutes: Routes = [
     {
       path: '',
       component: OrderBuilderComponent,
       providers: [OrderBuilderStore], // CONCEPT: Feature-scoped store
     },
   ];
   ```

### Files to Modify

1. **`src/app/core/layout/shell.component.ts`**
   - Enable Order Builder nav link

2. **`src/app/core/theme/theme.store.ts`** (refactor)
   Refactor ThemeService to use SignalStore + withLocalStorage:
   ```typescript
   export const ThemeStore = signalStore(
     { providedIn: 'root' },
     withState({ theme: 'system' as 'light' | 'dark' | 'system' }),
     withLocalStorage('stockpilot-theme', ['theme']),
     withComputed(/* ... same isDark, icon logic */),
     withMethods(/* ... same setTheme, toggleTheme */),
   );
   ```
   Update all references from ThemeService to ThemeStore.

## IMPLEMENTATION SPEC

### Step 1: Build Reusable Features
Create all 4 feature files in shared/store-features/. These are the library pieces.

### Step 2: Refactor ThemeStore
Show how withLocalStorage makes theme persistence trivial.

### Step 3: Build OrderBuilderStore
Compose withLoading + withPagination + withUndoRedo + withEntities in one store.

### Step 4: Build Order Builder UI
Multi-step wizard with undo/redo toolbar. The undo/redo demo is the highlight.

### Step 5: Wire Routes
Feature-scoped providers. Show that the store is destroyed on navigation away.

## TEACHING NOTES

```typescript
// CONCEPT: signalStoreFeature() - Write it once, use it everywhere.
// withLoading() eliminates 5-10 lines of boilerplate from EVERY store.
// withPagination() eliminates 15-20 lines. Across 10 stores, that's 200+ lines saved.

// CONCEPT: Feature composition order - Features are applied top to bottom.
// Later features CAN access state/methods from earlier features.
// withLoading() must come before withMethods() that calls setLoading().

// CONCEPT: Feature-scoped stores - OrderBuilderStore is provided at the route level.
// When the user navigates to /order-builder, the store is created.
// When they navigate away, it's destroyed. Fresh state every visit.
// Compare with InventoryStore (providedIn: 'root') which lives forever.

// CONCEPT: Undo/Redo architecture - snapshot() saves the state BEFORE a mutation.
// The history stack grows with each snapshot. undo() pops from history into redo.
// This works with any state shape because we track specific keys generically.

// CONCEPT: withLocalStorage persistence - Combined with effect(), the feature
// auto-saves every time tracked signals change. On next app load, it restores
// from localStorage. Zero manual code in the consuming store.

// CONCEPT: Parameterized features - withPagination({ pageSize: 10 }) lets each
// store customize the feature's behavior. The feature code is generic.
// The configuration is specific to each use case.
```

## VERIFICATION
1. Theme persists across page reloads (localStorage)
2. Order Builder wizard works through all 3 steps
3. Product selection with pagination loads correctly
4. Undo/redo buttons enable/disable correctly
5. Adding/removing products can be undone/redone
6. Quantity changes can be undone
7. Order submission works (exhaustMap prevents double-submit)
8. Store is destroyed on navigation away (fresh state on return)
9. All 4 reusable features work independently
