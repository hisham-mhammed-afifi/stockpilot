# Section 04: NgRx SignalStore - Core Concepts

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- `signalStore()` function and its composable architecture
- `withState()` to define the state shape
- `withComputed()` for derived store signals
- `withMethods()` for synchronous state updates
- `patchState()` for immutable partial updates
- `withHooks()` for lifecycle (onInit, onDestroy)
- Difference between raw signal services and SignalStore
- Feature-scoped stores via route providers

## PREREQUISITES
- Section 01 (models, ApiService)
- Section 02 (signals understanding)
- Section 03 (ProductsApiService)

## API ENDPOINTS USED
- `GET /products?limit=N&skip=N&sortBy=X&order=Y` - paginated products
- `GET /products/search?q=TERM` - search
- `GET /products/categories` - categories
- `GET /products/category/:name` - filter by category

## DELIVERABLES

### Files to Create

1. **`src/app/features/inventory/store/inventory.store.ts`**
   The first real SignalStore in the project.

   ```typescript
   import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';

   // CONCEPT: State Shape - Define the state interface separately.
   // This makes it clear what the store manages and helps with typing.
   type InventoryFilters = {
     search: string;
     category: string;
     stockStatus: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
     sortBy: 'title' | 'price' | 'stock' | 'rating';
     sortOrder: 'asc' | 'desc';
   };

   type InventoryState = {
     products: Product[];
     categories: { slug: string; name: string }[];
     filters: InventoryFilters;
     total: number;
     skip: number;
     limit: number;
     loading: boolean;
     error: string | null;
     selectedProductId: number | null;
   };

   const initialFilters: InventoryFilters = {
     search: '',
     category: '',
     stockStatus: 'all',
     sortBy: 'title',
     sortOrder: 'asc',
   };

   const initialState: InventoryState = {
     products: [],
     categories: [],
     filters: initialFilters,
     total: 0,
     skip: 0,
     limit: 20,
     loading: false,
     error: null,
     selectedProductId: null,
   };

   // CONCEPT: signalStore() - Creates a reactive store composed of features.
   // Each with*() adds capabilities. The order matters: later features can
   // access signals from earlier ones.
   export const InventoryStore = signalStore(
     // CONCEPT: providedIn - Makes this store a singleton at root level.
     // For feature-scoped stores, remove this and provide via route providers.
     // We use root here because inventory data may be needed by orders/dashboard later.
     { providedIn: 'root' },

     // CONCEPT: withState() - Defines the state shape and initial values.
     // Each property becomes a Signal: store.loading(), store.products(), etc.
     // The state is immutable. You cannot do store.loading = true.
     withState(initialState),

     // CONCEPT: withComputed() - Adds derived signals to the store.
     // These are read-only computed signals that react to state changes.
     withComputed((store) => ({
       // Client-side filtering for stock status (API doesn't support this filter)
       filteredProducts: computed(() => {
         const products = store.products();
         const stockStatus = store.filters().stockStatus;

         if (stockStatus === 'all') return products;

         return products.filter(p => {
           switch (stockStatus) {
             case 'in-stock': return p.stock > 10;
             case 'low-stock': return p.stock > 0 && p.stock <= 10;
             case 'out-of-stock': return p.stock === 0;
             default: return true;
           }
         });
       }),

       selectedProduct: computed(() => {
         const id = store.selectedProductId();
         return id ? store.products().find(p => p.id === id) ?? null : null;
       }),

       totalPages: computed(() => Math.ceil(store.total() / store.limit())),
       currentPage: computed(() => Math.floor(store.skip() / store.limit()) + 1),
       hasNextPage: computed(() => store.skip() + store.limit() < store.total()),
       hasPrevPage: computed(() => store.skip() > 0),

       // Summary stats for the inventory header
       stats: computed(() => {
         const products = store.products();
         return {
           totalProducts: store.total(),
           inStock: products.filter(p => p.stock > 10).length,
           lowStock: products.filter(p => p.stock > 0 && p.stock <= 10).length,
           outOfStock: products.filter(p => p.stock === 0).length,
           averagePrice: products.length
             ? products.reduce((sum, p) => sum + p.price, 0) / products.length
             : 0,
         };
       }),
     })),

     // CONCEPT: withMethods() - Adds methods to the store.
     // Methods can be synchronous (patchState) or async (rxMethod, covered in Section 6).
     // The store instance and injected services are available via the factory function.
     withMethods((store, productsApi = inject(ProductsApiService)) => ({

       // CONCEPT: patchState() - Immutably updates part of the state.
       // Only the specified properties are updated. The rest remain unchanged.
       // Think of it as: state = { ...currentState, ...patch }
       setFilters(filters: Partial<InventoryFilters>) {
         patchState(store, (state) => ({
           filters: { ...state.filters, ...filters },
           skip: 0, // Reset pagination when filters change
         }));
       },

       selectProduct(id: number | null) {
         patchState(store, { selectedProductId: id });
       },

       nextPage() {
         patchState(store, (state) => ({
           skip: Math.min(state.skip + state.limit, state.total - state.limit),
         }));
       },

       prevPage() {
         patchState(store, (state) => ({
           skip: Math.max(state.skip - state.limit, 0),
         }));
       },

       goToPage(page: number) {
         patchState(store, (state) => ({
           skip: (page - 1) * state.limit,
         }));
       },

       // Async methods (simple Promise-based for now, rxMethod in Section 6)
       async loadProducts() {
         patchState(store, { loading: true, error: null });
         try {
           const filters = store.filters();
           let response: ProductsResponse;

           if (filters.search) {
             response = await firstValueFrom(
               productsApi.search(filters.search, store.limit())
             );
           } else if (filters.category) {
             response = await firstValueFrom(
               productsApi.getByCategory(filters.category)
             );
           } else {
             response = await firstValueFrom(
               productsApi.getAll({
                 limit: store.limit(),
                 skip: store.skip(),
                 sortBy: filters.sortBy,
                 order: filters.sortOrder,
               })
             );
           }

           patchState(store, {
             products: response.products,
             total: response.total,
             loading: false,
           });
         } catch (err) {
           patchState(store, {
             loading: false,
             error: err instanceof Error ? err.message : 'Failed to load products',
           });
         }
       },

       async loadCategories() {
         try {
           const categories = await firstValueFrom(productsApi.getCategories());
           patchState(store, { categories });
         } catch {
           // Non-critical, silently fail
         }
       },

       clearError() {
         patchState(store, { error: null });
       },
     })),

     // CONCEPT: withHooks() - Lifecycle hooks for the store.
     // onInit runs when the store is first injected/created.
     // onDestroy runs when the store is destroyed (relevant for feature-scoped stores).
     withHooks({
       onInit(store) {
         store.loadProducts();
         store.loadCategories();
       },
     }),
   );
   ```

2. **`src/app/features/inventory/components/inventory-list.component.ts`**
   The inventory list page that consumes the store.

   **Layout:**
   - **Stats bar** at top (4 mat-cards in a row): Total Products, In Stock, Low Stock, Out of Stock
   - **Filters toolbar**: search input, category dropdown, stock status toggle (mat-button-toggle-group), sort controls
   - **Data table** (mat-table) with columns: Thumbnail, Title, Category, Price, Stock, Rating, Actions
     - Stock column: color-coded chip (green >10, orange 1-10, red 0)
     - Price column: formatted with currency pipe
     - Rating column: star icons
     - Actions column: "View" button that selects the product
   - **Pagination bar**: Previous, page numbers, Next
   - **Loading**: mat-progress-bar above the table
   - **Error**: mat-card with error message and retry button
   - **Selected product panel**: When a product is selected, show a side panel (or bottom drawer) with details

   ```typescript
   @Component({
     // ...
   })
   export class InventoryListComponent {
     // CONCEPT: inject(SignalStore) - Components consume stores via injection.
     // The component doesn't know HOW data is fetched or WHERE state lives.
     // It just reads signals and calls methods. This is the "dumb component" pattern.
     protected store = inject(InventoryStore);

     // CONCEPT: Architecture - The component has ZERO business logic.
     // All filtering, pagination, and data fetching is in the store.
     // The component is purely presentational + user interaction dispatch.

     onSearchChange(term: string) {
       this.store.setFilters({ search: term });
       this.store.loadProducts();
     }

     onCategoryChange(category: string) {
       this.store.setFilters({ category });
       this.store.loadProducts();
     }

     onStockStatusChange(status: InventoryFilters['stockStatus']) {
       this.store.setFilters({ stockStatus: status });
     }

     onSortChange(sortBy: InventoryFilters['sortBy']) {
       this.store.setFilters({ sortBy });
       this.store.loadProducts();
     }

     onPageChange(page: number) {
       this.store.goToPage(page);
       this.store.loadProducts();
     }
   }
   ```

3. **`src/app/features/inventory/inventory.routes.ts`**
   ```typescript
   export const inventoryRoutes: Routes = [
     { path: '', component: InventoryListComponent },
   ];
   ```

### Files to Modify

1. **`src/app/core/layout/shell.component.ts`**
   - Enable Inventory nav link

## IMPLEMENTATION SPEC

### Step 1: Create InventoryStore
Build the full store with withState, withComputed, withMethods, withHooks.
Use async/await methods (not rxMethod yet - that's Section 6).

### Step 2: Build Inventory List Component
Create the table-based inventory view that reads from the store.
All user interactions dispatch to store methods.

### Step 3: Wire Routing
Connect routes, enable nav link.

### Step 4: Add Reactivity Demo
When the presenter changes filters in the UI, everything updates automatically because the component reads store signals directly in the template.

## TEACHING NOTES

```typescript
// CONCEPT: signalStore vs signal service - A raw signal service (like ThemeService
// in Section 2) works fine for simple state. SignalStore adds:
// 1. Structured composition via with*() features
// 2. Built-in patterns for entities, loading, pagination (Section 7)
// 3. Lifecycle hooks (onInit/onDestroy)
// 4. Clear separation of state shape, derived state, and methods
// Use raw signals for simple cases. Use SignalStore for feature-level state.

// CONCEPT: patchState() vs .set() / .update() -
// patchState(store, { loading: true }) is like setState in React.
// It creates a new immutable state with only the specified fields changed.
// The function form patchState(store, (state) => ({...})) gives you access
// to the current state for computed patches.

// CONCEPT: withComputed dependencies - The store parameter in withComputed
// gives you access to all state signals from withState. Each computed signal
// only re-evaluates when its specific dependencies change. store.stats()
// only recalculates when store.products() changes, not when store.loading() changes.

// CONCEPT: withHooks onInit - Runs once when the store is first created.
// For root-provided stores, that's when the first component injects it.
// For feature-scoped stores, that's when the route loads.
// Perfect for initial data loading.

// CONCEPT: Dumb Components - The component has zero awareness of HTTP, caching,
// or state management internals. It injects the store, reads signals in the template,
// and calls methods on user interaction. This makes it trivially testable and reusable.
```

## VERIFICATION
1. Inventory page loads with product table
2. Stats bar shows counts (total, in-stock, low-stock, out-of-stock)
3. Search filters products (triggers API call)
4. Category dropdown filters products
5. Stock status toggle filters client-side
6. Sort changes trigger re-fetch
7. Pagination works (next/prev/go-to-page)
8. Loading bar shows during fetches
9. Error state shows with retry
10. Product selection shows detail panel
