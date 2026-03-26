# Section 03: Component-Level State Patterns

**Duration:** ~30 minutes
**URL:** http://localhost:4200/products
**Goal:** Show how `signal()`, `computed()`, `linkedSignal()`, `effect()`, and `resource()` work together inside a single component to handle search, filtering, sorting, pagination, and async data fetching with zero boilerplate.

---

## Pre-Section Checklist

- [ ] `ng serve` running at http://localhost:4200/
- [ ] Browser on http://localhost:4200/products
- [ ] Editor open with `src/app/features/products/products.component.ts`
- [ ] Also have `src/app/features/products/product-detail.component.ts` ready to open
- [ ] Also have `src/app/features/products/services/products-api.service.ts` ready to open
- [ ] DevTools Network tab visible (to observe fetches triggered by `resource()`)

---

## Opening (2 min)

> "In Section 02 we learned the signal primitives one at a time. Now we combine them in a real feature: the Products page. This single component has search with debounce, category filtering, sorting, pagination, and async data fetching. All of it is built with signals. No NgRx. No BehaviorSubject. No manual subscriptions."

Load http://localhost:4200/products. Products should appear in a grid.

---

## Demo Flow

### Demo 1: The API Service Layer (3 min)

**Editor:**

1. Open `src/app/features/products/services/products-api.service.ts`
   - **Lines 6-9**: CONCEPT comment. Feature-specific API services wrap the generic `ApiService`. They return `Observable<T>` because `HttpClient` is Observable-based.
   - **Lines 14-16**: `getAll()` takes params for pagination and sorting.
   - **Lines 18-19**: `search()` takes a query string and limit.
   - **Lines 22-24**: `getById()` fetches a single product.
   - **Lines 26-28**: `getCategories()` fetches the category list.
   - **Lines 30-32**: `getByCategory()` fetches products for one category.

> "This is a thin layer. It maps REST endpoints to typed methods. The component never touches URLs or HttpClient directly. Compare this to Section 01 where `product-list-bad` called `HttpClient` inline."

### Demo 2: Component State Signals (5 min)

**Editor:**

1. Open `src/app/features/products/products.component.ts`
   - **Lines 296-310**: Six signals that define the component's entire state:
     ```
     searchInput = signal('');           // raw keystrokes
     searchTerm = signal('');            // debounced search
     selectedCategory = signal('');      // active category filter
     sortBy = signal('title');           // sort field
     sortOrder = signal('asc');          // ascending or descending
     pageSize = signal(12);             // items per page
     ```
   - **Lines 297-299**: CONCEPT comment. These signals are local to this component. They die when the component is destroyed. No service, no store needed for ephemeral UI state.

**Browser:**

1. Type "phone" in the search box. Products filter after a short debounce delay.
2. Clear the search. Select a category from the dropdown (e.g., "smartphones"). Products change.
3. Toggle the sort: click "Price", then the arrow button to switch between ascending and descending.
4. Point out that all of these actions are just calling `.set()` on individual signals.

> "Six signals, zero subscriptions, zero manual change detection. Each signal holds one piece of UI state."

### Demo 3: linkedSignal for Pagination Reset (5 min)

**Editor:**

1. Open `src/app/features/products/products.component.ts`
   - **Lines 312-319**: `linkedSignal` for `currentPage`:
     ```typescript
     currentPage = linkedSignal({
       source: () => ({ search: this.searchTerm(), category: this.selectedCategory() }),
       computation: () => 1,
     });
     ```
   - **Lines 312-314**: CONCEPT comment. Without `linkedSignal`, changing the search term while on page 3 would show empty results because the API would try to skip 24 items in a small result set.

**Browser:**

1. Navigate to page 2 or 3 using the pagination buttons at the bottom.
2. The page indicator shows "Page 2 of X" or "Page 3 of X".
3. Now type something in the search box. Watch the page indicator snap back to "Page 1 of X".
4. Clear the search, go to page 2 again, then select a category. Page resets to 1 again.

> **Wow moment:** "This is the same `linkedSignal()` pattern from the Signals Playground, but now it is solving a real UX problem. The `source` function tracks both `searchTerm` and `selectedCategory`. When either changes, the page resets to 1."

### Demo 4: computed() for Request Parameters (3 min)

**Editor:**

1. Open `src/app/features/products/products.component.ts`
   - **Line 323**: `skip = computed(() => (this.currentPage() - 1) * this.pageSize());` -- derived pagination offset.
   - **Lines 327-334**: `requestParams` bundles everything into one computed signal:
     ```typescript
     private requestParams = computed(() => ({
       limit: this.pageSize(),
       skip: this.skip(),
       sortBy: this.sortBy(),
       order: this.sortOrder(),
       search: this.searchTerm(),
       category: this.selectedCategory(),
     }));
     ```

> "Instead of `resource()` tracking six separate signals, it watches one `requestParams` computed. When any upstream signal changes, `requestParams` recalculates, and `resource()` re-fetches. This is the funnel pattern: many signals feed into one computed that feeds into one resource."

### Demo 5: resource() for Declarative Data Fetching (5 min)

**Editor:**

1. Open `src/app/features/products/products.component.ts`
   - **Lines 336-365**: The `resource()` declaration:
     ```typescript
     products = resource({
       params: this.requestParams,
       loader: ({ params }) => {
         if (params.search) {
           return firstValueFrom(this.productsApi.search(params.search, params.limit));
         }
         if (params.category) {
           return firstValueFrom(this.productsApi.getByCategory(params.category));
         }
         return firstValueFrom(this.productsApi.getAll({ ... }));
       },
     });
     ```
   - **Lines 337-345**: CONCEPT comment. `resource()` provides `.value()`, `.isLoading()`, `.error()`, `.status()` out of the box. No manual loading flags. No `takeUntilDestroyed`. No subscription cleanup.
   - **Lines 369-371**: Categories resource (no params, fetched once):
     ```typescript
     categories = resource({
       loader: () => firstValueFrom(this.productsApi.getCategories()),
     });
     ```

**Browser:**

1. Open DevTools Network tab.
2. Type "laptop" in the search box. After the debounce delay, a single network request fires.
3. Clear the search. Another request fires for the default product list.
4. Select a category. Another request fires.
5. Click "Price" sort toggle. Another request fires.
6. Point out that each action triggers exactly one request, and the old request's data is replaced.

**Editor (template integration):**

1. **Lines 55-57**: `@if (products.isLoading()) { <mat-progress-bar /> }` -- loading state from `resource()`.
2. **Lines 98-106**: `@if (products.error(); as err) { ... }` -- error state with retry button calling `products.reload()`.
3. **Lines 109-143**: `@if (products.value(); as data) { ... }` -- product grid from `resource()` value.

> **Wow moment:** "Compare this to Section 01. There we had `loading = signal(false)` and manual `.set(true)` / `.set(false)` around every HTTP call. Here, `resource()` gives us `isLoading()`, `error()`, and `value()` for free."

### Demo 6: effect() for Debouncing (3 min)

**Editor:**

1. Open `src/app/features/products/products.component.ts`
   - **Lines 380-396**: The debounce effect in the constructor:
     ```typescript
     effect((onCleanup) => {
       const value = this.searchInput();
       if (value === '') {
         this.searchTerm.set('');
         return;
       }
       const timeout = setTimeout(() => this.searchTerm.set(value), 300);
       onCleanup(() => clearTimeout(timeout));
     });
     ```
   - **Lines 381-386**: CONCEPT comment. This is a valid use of `effect()` because it bridges user input timing to state updates. The `onCleanup` callback cancels the previous timeout if the user keeps typing.

**Browser:**

1. Open DevTools Network tab and clear it.
2. Type "phone" quickly (4 characters in rapid succession). Only one network request fires (after 300ms of inactivity).
3. Type one character at a time with pauses longer than 300ms. A request fires after each pause.

> "The `effect()` tracks `searchInput`. Every keystroke fires the effect. But `onCleanup` cancels the previous timeout, so only the last keystroke (after 300ms of silence) actually updates `searchTerm`, which triggers the `resource()` re-fetch."

### Demo 7: Product Detail - toSignal() and resource() with Route Params (4 min)

**Browser:**

1. Click on any product card. The app navigates to `/products/:id`.
2. The detail page shows product images, price, rating, description, reviews.
3. Click a thumbnail image in the gallery. The main image changes.
4. Click "Back to Products". Navigate to a different product.

**Editor:**

1. Open `src/app/features/products/product-detail.component.ts`
   - **Lines 372-379**: `toSignal()` bridges the route Observable to a Signal:
     ```typescript
     private productId = toSignal(
       this.route.paramMap.pipe(map(params => Number(params.get('id')))),
       { initialValue: 0 },
     );
     ```
   - **Lines 384-390**: `resource()` fetches the product using the route-derived signal:
     ```typescript
     product = resource<Product | null, number>({
       params: () => this.productId(),
       loader: ({ params: id }) => {
         if (id === 0) return Promise.resolve(null);
         return firstValueFrom(this.productsApi.getById(id));
       },
     });
     ```
   - **Line 394**: `selectedImageIndex = signal(0);` -- local UI state for the image gallery.
   - **Lines 398-402**: `selectedImage` computed derives the current image URL:
     ```typescript
     selectedImage = computed(() => {
       const p = this.product.value();
       if (!p) return '';
       return p.images[this.selectedImageIndex()] ?? p.thumbnail;
     });
     ```

> **Key takeaway:** "`toSignal()` is the bridge from Observable-land (router, HTTP) to Signal-land (resource, computed, template). The `initialValue` option avoids `undefined` types."

### Demo 8: When NOT to Extract (2 min)

**Editor:**

1. Open `src/app/features/products/products.component.ts`
   - **Lines 435-441**: CONCEPT comment at the bottom of the file:
     ```
     // When to extract - Right now everything is in the component. That is fine!
     // We would extract to a service/store ONLY if:
     // 1. Another unrelated component needs the same data
     // 2. We need the state to survive navigation (persist filters)
     // 3. The logic is complex enough to warrant separation
     // Section 4 will show when extraction becomes necessary.
     ```

> "Do not reach for a store until you need one. Keep state as local as possible. This component has 6 signals, 3 computeds, 2 resources, and 1 effect. It works perfectly without any external state management. Extraction happens when sharing or persistence is required."

---

## Audience Interaction Points

| When | What to Ask |
|------|-------------|
| After Demo 2 | "Which of these six signals would you classify as UI state vs component state? Does it matter?" (Answer: they are all component state; UI state would be something like `isDropdownOpen` that only matters to one template element.) |
| After Demo 3 | "What would happen without `linkedSignal`? How would you solve the pagination reset problem with plain signals?" (Answer: you would need an `effect()` that watches search/category and calls `currentPage.set(1)`, which is the "effect to set signals" anti-pattern.) |
| After Demo 5 | "How does `resource()` compare to a `switchMap` pipe in RxJS?" (Answer: similar concept. When new params arrive, the old request is conceptually replaced. `resource()` handles loading/error states automatically. For true Observable cancellation, use `rxResource()`.) |
| After Demo 6 | "Is there a simpler way to debounce?" (Answer: you could use `toSignal(fromEvent(...).pipe(debounceTime(300)))`, but the `effect` + `onCleanup` approach keeps everything in signal-land without mixing Observable operators.) |

---

## Common Questions & Answers

| Question | Answer |
|----------|--------|
| "Why `firstValueFrom()` instead of returning the Observable directly?" | `resource()` expects a `Promise` from its loader function. `HttpClient.get()` returns an `Observable`. `firstValueFrom()` converts the first emission to a Promise. For native Observable support, use `rxResource()` instead. |
| "Does `resource()` cancel in-flight requests?" | The Promise-based `resource()` does not cancel HTTP requests because Promises are not cancellable. If you need cancellation (e.g., fast typing in search), use `rxResource()` which works with Observables and supports cancellation via unsubscribe. |
| "Why two separate signals for `searchInput` and `searchTerm`?" | `searchInput` updates on every keystroke (for the input field binding). `searchTerm` updates after the 300ms debounce (for triggering the fetch). Separating them means the input stays responsive while the API is not hammered. |
| "Can I use `resource()` outside a component?" | Yes. `resource()` can be used in a service or a `signalStore`. It needs an injection context (constructor or `runInInjectionContext`). |
| "What happens to the resource when the component is destroyed?" | The resource is tied to the component's injector. When the component is destroyed, the resource's reactive context is cleaned up. No manual teardown needed. |

---

## Transition to Next Section

> "We have now seen how to build a fully reactive component using only signal primitives and `resource()`. But what happens when two unrelated components need the same data? Or when you need state to survive navigation? That is where we graduate from component-level state to feature-level state with SignalStore. Let's move to Section 04."

---

## Section Cheat Sheet

| Concept | File | Line(s) | What to Show |
|---------|------|---------|--------------|
| API service layer | `services/products-api.service.ts` | 6-9 | CONCEPT comment about architecture |
| API methods (typed) | `services/products-api.service.ts` | 14-32 | `getAll`, `search`, `getById`, `getCategories`, `getByCategory` |
| Component state signals | `products.component.ts` | 296-310 | Six local signals for search, filters, sort, pagination |
| `linkedSignal` for page reset | `products.component.ts` | 316-319 | `currentPage` resets when search/category changes |
| `computed` for skip offset | `products.component.ts` | 323 | `skip = computed(() => ...)` |
| `computed` for request params | `products.component.ts` | 327-334 | Bundles all params into one signal |
| `resource()` for products | `products.component.ts` | 347-365 | Declarative async fetch with auto loading/error |
| `resource()` for categories | `products.component.ts` | 369-371 | One-shot fetch, no params |
| `computed` for totalPages | `products.component.ts` | 375-378 | Derived from resource value |
| `effect()` for debounce | `products.component.ts` | 387-395 | `onCleanup` cancels previous timeout |
| `isLoading()` in template | `products.component.ts` | 55-57 | `@if (products.isLoading())` |
| Error state with retry | `products.component.ts` | 98-106 | `products.error()` and `products.reload()` |
| `toSignal()` from route params | `product-detail.component.ts` | 376-379 | Bridges Observable to Signal |
| `resource()` with route param | `product-detail.component.ts` | 384-390 | Auto-fetches when route changes |
| Local UI state (image gallery) | `product-detail.component.ts` | 394 | `selectedImageIndex = signal(0)` |
| `computed` for selected image | `product-detail.component.ts` | 398-402 | Derives URL from product + index |
| When NOT to extract | `products.component.ts` | 435-441 | CONCEPT comment about extraction criteria |

*Note:* All line numbers reference files under `src/app/features/products/` unless a full path is given.

---

## Recovery Steps

| Problem | Fix |
|---------|-----|
| Products page shows "Failed to load" | Check network access to `https://dummyjson.com`. Click the Retry button. Check DevTools Console for CORS or network errors. |
| Search does not trigger after typing | The debounce is 300ms. Wait at least 300ms after the last keystroke. If still broken, check that the `effect()` at line 387 is present in the constructor. |
| Pagination buttons are missing | Pagination only appears when `totalPages > 1` (line 146). With the default page size of 12 and a small result set, there may only be one page. Try clearing all filters. |
| Category dropdown is empty | The `categories` resource (line 369) fetches from `/products/categories`. Check DevTools Network for that request. If it failed, the dropdown will be empty but the page still works. |
| Product detail page shows skeleton forever | Check that the route `/products/:id` is configured. The `productId` signal has `initialValue: 0`, and the loader guards against `id === 0` (line 387 of `product-detail.component.ts`). If the route param never emits, the loader returns `null`. |
| Image gallery thumbnails do not switch the main image | Click directly on a thumbnail. The `(click)="selectedImageIndex.set($index)"` handler is at line 81 of `product-detail.component.ts`. Verify the product has multiple images (some products have only one). |
