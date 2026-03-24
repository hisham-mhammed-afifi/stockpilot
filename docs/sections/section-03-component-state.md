# Section 03: Component-Level State Patterns

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- `resource()` for declarative async data fetching
- `rxResource()` for Observable-based async data
- Loading, error, and value states from resource()
- Component-level state with signals + computed
- When to extract state to a service vs keep it in the component
- `toSignal()` to bridge Observables to Signals

## PREREQUISITES
- Section 01 (models, shell, routing, ApiService)
- Section 02 (signal/computed understanding)

## API ENDPOINTS USED
- `GET /products?limit=N&skip=N&sortBy=X&order=Y` - paginated product list
- `GET /products/search?q=TERM` - search products
- `GET /products/categories` - category list
- `GET /products/:id` - single product detail

## DELIVERABLES

### Files to Create

1. **`src/app/shared/ui/empty-state/empty-state.component.ts`**
   A reusable "no results" component with mat-icon and message.
   Inputs: `icon: string`, `title: string`, `subtitle: string`

2. **`src/app/features/products/services/products-api.service.ts`**
   API service for products:
   ```typescript
   @Injectable({ providedIn: 'root' })
   export class ProductsApiService {
     private api = inject(ApiService);

     getAll(params: { limit: number; skip: number; sortBy?: string; order?: string }): Observable<ProductsResponse> {
       return this.api.get<ProductsResponse>('/products', params);
     }

     search(query: string, limit = 10): Observable<ProductsResponse> {
       return this.api.get<ProductsResponse>('/products/search', { q: query, limit });
     }

     getById(id: number): Observable<Product> {
       return this.api.get<Product>(`/products/${id}`);
     }

     getCategories(): Observable<{ slug: string; name: string; url: string }[]> {
       return this.api.get('/products/categories');
     }

     getByCategory(category: string): Observable<ProductsResponse> {
       return this.api.get<ProductsResponse>(`/products/category/${category}`);
     }
   }
   ```

3. **`src/app/features/products/products.component.ts`**
   The main products catalog page. ALL state lives in the component using signals.

   **State signals:**
   ```typescript
   // CONCEPT: Component State - These signals are local to this component.
   // They die when the component is destroyed. No service, no store needed.
   searchTerm = signal('');
   selectedCategory = signal<string>('');
   sortBy = signal<'price' | 'title' | 'rating'>('title');
   sortOrder = signal<'asc' | 'desc'>('asc');
   pageSize = signal(12);
   currentPage = signal(1);

   // CONCEPT: linkedSignal - Resets page to 1 whenever search or category changes.
   // Without this, changing the search term while on page 3 would show empty results.
   currentPage = linkedSignal({
     source: () => ({ search: this.searchTerm(), category: this.selectedCategory() }),
     computation: () => 1,
   });
   ```

   **Derived signals:**
   ```typescript
   // CONCEPT: Computed - skip is derived from page and pageSize.
   // It recalculates only when currentPage or pageSize changes.
   skip = computed(() => (this.currentPage() - 1) * this.pageSize());

   requestParams = computed(() => ({
     limit: this.pageSize(),
     skip: this.skip(),
     sortBy: this.sortBy(),
     order: this.sortOrder(),
   }));
   ```

   **Data fetching with resource():**
   ```typescript
   // CONCEPT: resource() - Declarative async data fetching tied to reactive inputs.
   // When requestParams() changes, resource automatically re-fetches.
   // It provides .value(), .isLoading(), .error(), .status() out of the box.
   // No manual subscription. No takeUntilDestroyed. No loading flags to manage.
   products = resource({
     request: this.requestParams,
     loader: ({ request }) => {
       return firstValueFrom(this.productsApi.getAll(request));
     },
   });

   // CONCEPT: resource() for categories (static data, fetched once)
   categories = resource({
     loader: () => firstValueFrom(this.productsApi.getCategories()),
   });

   // Derived from resource value
   totalPages = computed(() => {
     const data = this.products.value();
     return data ? Math.ceil(data.total / this.pageSize()) : 0;
   });
   ```

   **Template features:**
   - Search bar with debounce (use a subject + toSignal, or just direct binding with manual debounce)
   - Category filter dropdown (mat-select) populated from categories resource
   - Sort controls (mat-button-toggle for sortBy, mat-icon-button for order)
   - Product grid (mat-card for each product showing thumbnail, title, price, rating, stock badge)
   - Pagination controls (Previous/Next buttons, page indicator)
   - Loading state: show mat-progress-bar when `products.isLoading()`
   - Error state: show error message with retry button
   - Empty state: show empty-state component when no results
   - Each product card links to `/products/:id`

   **Layout:**
   - Top: search bar + category dropdown + sort controls in a toolbar row
   - Middle: responsive grid of product cards (CSS grid, 1-4 columns based on viewport)
   - Bottom: pagination controls

4. **`src/app/features/products/product-detail.component.ts`**
   Single product detail page.

   ```typescript
   // CONCEPT: resource() with route params - The request signal comes from the route.
   // When the user navigates to a different product, resource auto-fetches the new one.
   private route = inject(ActivatedRoute);

   // CONCEPT: toSignal() - Converts an Observable (route params) to a Signal.
   // This bridges the Observable world (router) with the Signal world (resource).
   private productId = toSignal(
     this.route.paramMap.pipe(map(params => Number(params.get('id')))),
     { initialValue: 0 }
   );

   product = resource({
     request: this.productId,
     loader: ({ request: id }) => {
       if (id === 0) return Promise.resolve(null);
       return firstValueFrom(this.productsApi.getById(id));
     },
   });
   ```

   **Template:**
   - Loading skeleton while fetching
   - Product image gallery (thumbnails at bottom, main image on top)
   - Product details: title, price (with discount), rating (mat-icon stars), description
   - Stock indicator (mat-chip: "In Stock" green, "Low Stock" orange, "Out of Stock" red)
   - Reviews section (mat-list with reviewer name, rating, comment)
   - Back button to products list

5. **`src/app/features/products/products.routes.ts`**
   ```typescript
   export const productsRoutes: Routes = [
     { path: '', component: ProductsComponent },
     { path: ':id', component: ProductDetailComponent },
   ];
   ```

### Files to Modify

1. **`src/app/core/layout/shell.component.ts`**
   - Enable the Products nav link (remove disabled state)

## IMPLEMENTATION SPEC

### Step 1: API Service
Create ProductsApiService wrapping all product endpoints.

### Step 2: Products List Page
Build the main catalog page with all signals and resource() calls. Focus on:
- Showing how `resource()` eliminates manual loading/error flag management
- Showing how `linkedSignal` handles pagination reset
- Showing how `computed()` derives skip, totalPages, etc.

### Step 3: Product Detail Page
Build the detail page with `resource()` + `toSignal()` from route params.

### Step 4: Wire Everything
Update routes, enable nav link, add search debounce.

### Debounce Pattern for Search
Since resource() fires on every signal change, implement debounce:
```typescript
private searchInput = signal('');
// Use a computed with a manual debounce effect
searchTerm = signal('');

constructor() {
  // CONCEPT: effect() for debouncing - This is a valid use of effect()
  // because we're bridging user input timing to state updates.
  effect((onCleanup) => {
    const value = this.searchInput();
    const timeout = setTimeout(() => this.searchTerm.set(value), 300);
    onCleanup(() => clearTimeout(timeout));
  });
}
```

## TEACHING NOTES

```typescript
// CONCEPT: resource() - Think of it as a "reactive fetch".
// You declare WHAT to fetch (the request signal) and HOW to fetch it (the loader).
// resource() handles the WHEN (re-fetch on request change) and TRACKING (loading/error/value).

// CONCEPT: Component State Decision - All state here is LOCAL to this component.
// Search, filters, pagination - these all die when the user navigates away.
// This is intentional. There's no reason to persist catalog filters in a global store.

// CONCEPT: linkedSignal vs computed - computed() is read-only.
// linkedSignal() is writable AND resets on source change.
// currentPage needs BOTH: writable (user clicks "Next") and auto-reset (search changes).

// CONCEPT: toSignal() - Bridges the Observable world to the Signal world.
// Route params come as Observable<ParamMap>. resource() needs a Signal input.
// toSignal() creates that bridge. Always provide an initialValue to avoid undefined.

// CONCEPT: When to extract - Right now everything is in the component. That's fine!
// We'd extract to a service/store ONLY if:
// 1. Another unrelated component needs the same data
// 2. We need the state to survive navigation (persist filters)
// 3. The logic is complex enough to warrant separation
// Section 4 will show when extraction becomes necessary.
```

## VERIFICATION
1. Products page loads with grid of product cards
2. Search filters products with debounce
3. Category dropdown filters products
4. Sort toggles work (by price, title, rating + asc/desc)
5. Pagination works (next/prev, page indicator, resets on search)
6. Loading bar shows during fetches
7. Error state shows with retry
8. Product detail page loads via clicking a card
9. Back navigation works from detail
10. `resource()` statuses are visible in UI
