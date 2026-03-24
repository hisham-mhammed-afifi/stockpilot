# Section 10: Migration, Anti-Patterns & Decision Making

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- Live migration: BehaviorSubject service to SignalStore
- Live migration: Classic NgRx Store (actions/reducers/effects) to SignalStore
- Anti-patterns gallery: 8 common mistakes with broken/fixed demos
- Decision tree: when to use which state management approach
- Final architecture recap

## PREREQUISITES
- All previous sections (01-09)

## API ENDPOINTS USED
- `GET /products?limit=10` - for legacy demo

## DELIVERABLES

### Files to Create

1. **`src/app/features/legacy/product-legacy.service.ts`**
   A "legacy" BehaviorSubject-based service to demonstrate migration:

   ```typescript
   // CONCEPT: Legacy Pattern - This is how many Angular apps manage state pre-signals.
   // BehaviorSubject + async pipe + manual subscription management.
   // It works, but it's verbose and error-prone.
   @Injectable({ providedIn: 'root' })
   export class ProductLegacyService {
     private productsSubject = new BehaviorSubject<Product[]>([]);
     private loadingSubject = new BehaviorSubject<boolean>(false);
     private errorSubject = new BehaviorSubject<string | null>(null);
     private selectedIdSubject = new BehaviorSubject<number | null>(null);

     // CONCEPT: Legacy - Expose as Observable for components to subscribe
     readonly products$ = this.productsSubject.asObservable();
     readonly loading$ = this.loadingSubject.asObservable();
     readonly error$ = this.errorSubject.asObservable();

     // CONCEPT: Legacy - Derived state via RxJS pipe
     readonly selectedProduct$ = combineLatest([
       this.productsSubject,
       this.selectedIdSubject,
     ]).pipe(
       map(([products, id]) => id ? products.find(p => p.id === id) ?? null : null),
     );

     readonly productCount$ = this.productsSubject.pipe(
       map(products => products.length),
     );

     private http = inject(HttpClient);
     private destroyRef = inject(DestroyRef);

     loadProducts() {
       this.loadingSubject.next(true);
       this.errorSubject.next(null);

       this.http.get<ProductsResponse>(`${environment.apiUrl}/products?limit=10`)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
           next: (response) => {
             this.productsSubject.next(response.products);
             this.loadingSubject.next(false);
           },
           error: (err) => {
             this.errorSubject.next(err.message);
             this.loadingSubject.next(false);
           },
         });
     }

     selectProduct(id: number | null) {
       this.selectedIdSubject.next(id);
     }

     addProduct(product: Partial<Product>) {
       this.loadingSubject.next(true);
       this.http.post<Product>(`${environment.apiUrl}/products/add`, product)
         .pipe(takeUntilDestroyed(this.destroyRef))
         .subscribe({
           next: (created) => {
             this.productsSubject.next([...this.productsSubject.value, created]);
             this.loadingSubject.next(false);
           },
           error: (err) => {
             this.errorSubject.next(err.message);
             this.loadingSubject.next(false);
           },
         });
     }

     deleteProduct(id: number) {
       // CONCEPT: Legacy - Manual array manipulation
       this.productsSubject.next(this.productsSubject.value.filter(p => p.id !== id));
     }
   }
   ```

2. **`src/app/features/legacy/product-legacy-migrated.store.ts`**
   The SAME functionality rewritten as a SignalStore:
   ```typescript
   // CONCEPT: Migration Result - Same behavior, less code, no manual subscriptions,
   // no takeUntilDestroyed, no combineLatest, no BehaviorSubject ceremony.
   export const ProductMigratedStore = signalStore(
     withState({
       products: [] as Product[],
       loading: false,
       error: null as string | null,
       selectedId: null as number | null,
     }),

     withComputed((store) => ({
       selectedProduct: computed(() => {
         const id = store.selectedId();
         return id ? store.products().find(p => p.id === id) ?? null : null;
       }),
       productCount: computed(() => store.products().length),
     })),

     withMethods((store) => ({
       selectProduct(id: number | null) {
         patchState(store, { selectedId: id });
       },

       loadProducts: rxMethod<void>(
         pipe(
           tap(() => patchState(store, { loading: true, error: null })),
           switchMap(() =>
             inject(HttpClient).get<ProductsResponse>(`${environment.apiUrl}/products?limit=10`).pipe(
               tapResponse({
                 next: (res) => patchState(store, { products: res.products, loading: false }),
                 error: (err: Error) => patchState(store, { error: err.message, loading: false }),
               })
             )
           )
         )
       ),

       addProduct: rxMethod<Partial<Product>>(
         pipe(
           tap(() => patchState(store, { loading: true })),
           concatMap((product) =>
             inject(HttpClient).post<Product>(`${environment.apiUrl}/products/add`, product).pipe(
               tapResponse({
                 next: (created) => patchState(store, (s) => ({
                   products: [...s.products, created],
                   loading: false,
                 })),
                 error: (err: Error) => patchState(store, { error: err.message, loading: false }),
               })
             )
           )
         )
       ),

       deleteProduct(id: number) {
         patchState(store, (s) => ({
           products: s.products.filter(p => p.id !== id),
         }));
       },
     })),

     withHooks({
       onInit(store) {
         store.loadProducts();
       },
     }),
   );
   ```

3. **`src/app/features/legacy/product-legacy.component.ts`**
   Side-by-side comparison page:

   **Layout:**
   Two columns, full height:

   **LEFT: "BehaviorSubject Service"**
   - Component using ProductLegacyService
   - Uses `async` pipe everywhere
   - Shows the code in `<pre>` blocks below the UI
   - Highlights pain points with red badges:
     - "4 BehaviorSubjects needed"
     - "combineLatest for derived state"
     - "Manual takeUntilDestroyed"
     - "Imperative .next() calls"

   **RIGHT: "SignalStore"**
   - Component using ProductMigratedStore
   - Uses direct signal reads `store.products()`
   - Shows the code in `<pre>` blocks below the UI
   - Highlights improvements with green badges:
     - "1 withState call"
     - "computed() for derived state"
     - "rxMethod handles cleanup"
     - "Declarative patchState()"

   **Bottom: Migration Cheat Sheet**
   A table showing the mapping:
   | BehaviorSubject Pattern | SignalStore Equivalent |
   |---|---|
   | `new BehaviorSubject(value)` | `withState({ key: value })` |
   | `.asObservable()` | `store.key()` (auto-exposed as signal) |
   | `.pipe(map(...))` / `combineLatest` | `withComputed(() => computed(...))` |
   | `.next(value)` | `patchState(store, { key: value })` |
   | `.subscribe()` + `takeUntilDestroyed` | `rxMethod(pipe(...))` |
   | Manual loading/error flags | `withLoading()` feature |

4. **`src/app/features/legacy/anti-patterns.component.ts`**
   Anti-patterns gallery page showing 8 common mistakes:

   For each anti-pattern, show a mat-expansion-panel with:
   - Title (the mistake)
   - "BAD" code block with explanation
   - "GOOD" code block with fix
   - Interactive demo when applicable

   **Anti-pattern 1: "effect() for state derivation"**
   ```typescript
   // BAD: Using effect to sync derived state
   effect(() => {
     this.fullName.set(this.firstName() + ' ' + this.lastName());
   });
   // GOOD: Use computed
   fullName = computed(() => this.firstName() + ' ' + this.lastName());
   ```

   **Anti-pattern 2: "Everything in global state"**
   ```typescript
   // BAD: Form validation state in a global store
   // GOOD: Keep UI state in the component
   ```

   **Anti-pattern 3: "Subscribing to set signals"**
   ```typescript
   // BAD:
   this.service.data$.subscribe(data => this.data.set(data));
   // GOOD:
   data = toSignal(this.service.data$);
   ```

   **Anti-pattern 4: "Mutating signal values"**
   ```typescript
   // BAD:
   this.items().push(newItem); // Mutating the array!
   // GOOD:
   this.items.update(items => [...items, newItem]);
   ```

   **Anti-pattern 5: "Calling APIs from components"**
   ```typescript
   // BAD: Component calls HttpClient directly
   // GOOD: Component calls store method, store calls API
   ```

   **Anti-pattern 6: "Storing derived data in state"**
   ```typescript
   // BAD: Storing filteredProducts in state
   patchState(store, { filteredProducts: products.filter(...) });
   // GOOD: Use computed()
   filteredProducts = computed(() => store.entities().filter(...));
   ```

   **Anti-pattern 7: "One mega store"**
   ```typescript
   // BAD: AppStore with auth + products + orders + theme + notifications
   // GOOD: Separate stores per feature, coordinate via mediator
   ```

   **Anti-pattern 8: "Nested objects in entity state"**
   ```typescript
   // BAD: orders: [{ ...order, products: [{ ...product }] }]
   // GOOD: Normalize with separate entity collections
   ```

5. **`src/app/features/legacy/decision-tree.component.ts`**
   Interactive decision tree component:

   Build a visual flowchart (can use nested mat-cards or a simple tree layout):
   ```
   "Is state used by only 1 component?"
     YES -> signal() in the component
     NO -> "Is it shared within a single feature?"
       YES -> "Is the logic simple (< 3 signals, no async)?"
         YES -> Signal service (injectable)
         NO -> SignalStore scoped to feature route
       NO -> "Is it app-wide?"
         YES -> Global SignalStore (providedIn: 'root')
         NO -> "Does it come from an API?"
           YES -> "Simple GET with no mutations?"
             YES -> resource() in component
             NO -> SignalStore with rxMethod + withEntities
           NO -> Pass via Input/Output
   ```

   Make it interactive: user clicks answers and the tree highlights the recommended path.

6. **`src/app/features/legacy/legacy.routes.ts`**
   ```typescript
   export const legacyRoutes: Routes = [
     { path: '', component: ProductLegacyComponent },
     { path: 'anti-patterns', component: AntiPatternsComponent },
     { path: 'decision-tree', component: DecisionTreeComponent },
   ];
   ```

### Files to Modify

1. **`src/app/app.routes.ts`**
   - Add: `{ path: 'workshop', loadChildren: () => import('./features/legacy/legacy.routes').then(m => m.legacyRoutes) }`

2. **`src/app/core/layout/shell.component.ts`**
   - Add "Workshop" section in sidebar with links:
     - Migration Demo (`/workshop`)
     - Anti-Patterns (`/workshop/anti-patterns`)
     - Decision Tree (`/workshop/decision-tree`)
     - Signals Playground (`/signals-playground`) (from Section 2)

## IMPLEMENTATION SPEC

### Step 1: Legacy Service
Create ProductLegacyService with full BehaviorSubject pattern.

### Step 2: Migrated Store
Create the equivalent SignalStore. Show the 1:1 mapping.

### Step 3: Side-by-Side Page
Build the comparison page with both implementations running simultaneously.

### Step 4: Anti-Patterns Gallery
Build the 8 anti-pattern expansion panels with code blocks and explanations.

### Step 5: Decision Tree
Build the interactive decision tree component.

### Step 6: Workshop Section
Wire routes and add workshop section to sidebar.

## TEACHING NOTES

```typescript
// CONCEPT: Migration Strategy - Migrate feature by feature, not all at once.
// 1. Identify the BehaviorSubject service
// 2. Create a parallel SignalStore with the same API surface
// 3. Update components to use the new store
// 4. Delete the old service
// Tip: You can run both side by side during migration.

// CONCEPT: BehaviorSubject to Signal mapping:
// BehaviorSubject<T>(init) -> signal<T>(init) via withState
// .pipe(map()) -> computed()
// combineLatest -> computed() reading multiple signals
// .next(value) -> patchState() or .set()
// .subscribe() in service -> rxMethod()
// .subscribe() in component -> just read the signal in template
// takeUntilDestroyed -> not needed (signals auto-cleanup)
// async pipe -> direct () call in template

// CONCEPT: Why migrate? - Signals are:
// 1. Synchronous (no timing bugs from async subscriptions)
// 2. Glitch-free (no intermediate invalid states during updates)
// 3. Auto-tracked (no manual dependency management)
// 4. No memory leaks (no forgotten unsubscribes)
// 5. Simpler mental model (read value = track dependency)

// CONCEPT: When NOT to migrate - Keep RxJS/BehaviorSubject for:
// 1. WebSocket streams (inherently async/event-based)
// 2. Complex async coordination (race conditions, retry with backoff)
// 3. Libraries that require Observables
// Don't migrate for the sake of migrating. Migrate when it simplifies.

// CONCEPT: Anti-patterns exist because - Each anti-pattern was someone's
// reasonable first attempt. Understanding WHY they're problematic
// (not just THAT they're wrong) builds better intuition.
// effect() for derived state "works" but creates unnecessary re-renders.
// Global state for form fields "works" but pollutes shared state.

// CONCEPT: The Decision Tree - There is no single "best" approach.
// The right tool depends on: scope (local vs shared), complexity (simple vs compound),
// lifetime (component vs app), and data source (local vs server).
// Defaulting to the simplest option and promoting when needed
// keeps your architecture lean.
```

## VERIFICATION
1. Legacy comparison page shows both approaches working identically
2. Code blocks clearly show the before/after
3. Badge callouts highlight pain points and improvements
4. Anti-patterns gallery has all 8 items with bad/good code
5. Decision tree is interactive (click to navigate)
6. Workshop section appears in sidebar with all links
7. All existing features still work (no regressions from this section)
8. The full app represents a complete state management architecture
