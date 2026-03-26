# Section 04: NgRx SignalStore - Core Concepts

**Duration:** ~30 minutes
**URL:** http://localhost:4200/inventory
**Key Store File:** `src/app/features/inventory/store/inventory.store.ts` (331 lines)

---

## Pre-Section Checklist

- [ ] Browser open at http://localhost:4200/inventory with data loaded (table of products visible)
- [ ] Editor open to `src/app/features/inventory/store/inventory.store.ts`
- [ ] Editor split or second tab with `src/app/features/inventory/components/inventory-list.component.ts`
- [ ] Angular DevTools extension installed and open (Components tab)
- [ ] Network tab in DevTools cleared and ready
- [ ] Terminal running `ng serve` with no errors

---

## Opening (2 min)

> "We have seen Angular Signals for local state, and we have seen component-level patterns that start to break down at scale. Now we step into NgRx SignalStore, the recommended way to manage feature-level and global state in modern Angular apps. We will build up the mental model piece by piece: state, computed, methods, entities, and hooks. Everything lives in one file with a composable, functional API."

**Key talking point:** SignalStore is NOT classic NgRx with actions, reducers, and effects. It is a lightweight, signal-native store built from composable features. Each `with*()` call adds a specific capability.

---

## Demo Flow

### Part 1: The signalStore() Shell (5 min)

**Editor:** Open `src/app/features/inventory/store/inventory.store.ts`

1. **Show the import block (lines 1-18).** Point out that everything comes from `@ngrx/signals` and `@ngrx/signals/entities`. There is no `@ngrx/store` or `@ngrx/effects` involved.

2. **Scroll to line 68 -- the `signalStore()` call.** Explain the composition model:
   ```
   signalStore(
     { providedIn: 'root' },   // line 72 -- DI scope
     withState(initialState),   // line 77 -- base state
     withEntities<Product>(),   // line 83 -- entity collection
     withComputed(...),         // line 89 -- derived signals
     withMethods(...),          // line 150 -- actions
     withHooks(...)             // line 325 -- lifecycle
   )
   ```

3. **Highlight line 72: `{ providedIn: 'root' }`.**
   > "This makes the store a singleton, available anywhere via `inject(InventoryStore)`. For feature-scoped stores that should be destroyed when you leave a route, you would remove this and provide the store in route providers instead."

**Audience check:** "Who here has used classic NgRx with actions and reducers? Notice there is none of that ceremony. The entire store is one function call."

### Part 2: State Shape and Initial Values (5 min)

**Editor:** Stay in `inventory.store.ts`, scroll to lines 23-63.

1. **Show the `InventoryFilters` type (lines 23-29).** Point out the typed filter options: search, category, stockStatus, sortBy, sortOrder. These are not loose strings -- they are union types.

2. **Show the `InventoryState` type (lines 35-44).** Call out that `products: Product[]` is intentionally absent.
   > "Notice there is no `products` array in the state. That is because `withEntities<Product>()` on line 83 replaces it with normalized storage. We will cover that in Section 05."

3. **Show `initialState` (lines 54-63).** Every field gets a sensible default. `loading: false`, `error: null`, `selectedProductId: null`.

4. **Show line 77: `withState(initialState)`.** Explain:
   > "Each property in `initialState` becomes a Signal on the store. So `store.loading()` returns `false`, `store.categories()` returns `[]`, and so on. You never write `store.loading = true` -- state is immutable."

**Browser:** Open Angular DevTools, find `InventoryListComponent`, and show the injected `InventoryStore`. Point out the signal values.

### Part 3: withComputed -- Derived Signals (8 min)

**Editor:** Scroll to lines 89-140.

1. **Show `filteredProducts` (lines 93-107).** Walk through the logic:
   - Reads `store.entities()` and `store.filters().stockStatus`
   - Returns a filtered array based on stock thresholds
   - Only recalculates when those specific signals change

   > "This is client-side filtering. The stock status toggle in the UI does not trigger an API call. It just changes a filter signal, and `filteredProducts` recomputes instantly."

2. **Show `selectedProduct` (lines 112-115).** Highlight the `entityMap()` lookup:
   ```typescript
   return id ? store.entityMap()[id] ?? null : null;
   ```
   > "This is an O(1) dictionary lookup, not an O(n) array scan. For 1000 products, that matters."

3. **Show pagination computed signals (lines 120-123).** Four one-liner computeds that derive `totalPages`, `currentPage`, `hasNextPage`, `hasPrevPage` from `skip`, `limit`, and `total`.

4. **Show `stats` (lines 128-139).** Aggregated metrics derived from `store.entities()`.

**WOW MOMENT -- Browser demo:**
- Navigate to http://localhost:4200/inventory
- Click the "Low Stock" toggle in the Stock Status filter bar
- The table filters instantly with no loading spinner, no network request
- Open the Network tab to prove no HTTP call was made
- Click "All" to restore
- Now type a search term in the search field -- this one DOES hit the API (visible in Network tab)

> "See the difference? Stock status filtering is a computed signal. Search triggers `loadProducts()` which hits the API. The component does not know which is which -- it just calls `store.setFilters()` and lets the store decide."

### Part 4: withMethods -- Synchronous State Updates (5 min)

**Editor:** Scroll to lines 150-185.

1. **Show `setFilters` (lines 156-161).** Explain `patchState`:
   ```typescript
   patchState(store, (state) => ({
     filters: { ...state.filters, ...filters },
     skip: 0,
   }));
   ```
   > "patchState is the ONLY way to update state. It is immutable -- it merges your changes into a new state object. Notice the function form `(state) => ({...})` which gives you access to the current state for computed patches. And we reset `skip` to 0 whenever filters change."

2. **Show `selectProduct` (line 165-167).** Contrast with the function form:
   ```typescript
   patchState(store, { selectedProductId: id });
   ```
   > "When you do not need the current state, you can pass an object literal directly. Both forms are valid."

3. **Show pagination methods (lines 169-185).** `nextPage`, `prevPage`, `goToPage` -- all one-liner patchState calls with bounds checking.

**Browser demo:**
- Click the "Next" pagination button at the bottom of the inventory table
- Watch the page number update ("Page 2 of N")
- Click a product's "eye" icon to select it -- the detail panel appears at the bottom
- Click the X to close it

### Part 5: withHooks -- Lifecycle (3 min)

**Editor:** Scroll to lines 325-330.

```typescript
withHooks({
  onInit(store) {
    store.loadProducts();
    store.loadCategories();
  },
}),
```

> "onInit fires when the store is first injected. For a root-provided store, that is when the first component that uses it is created. Both data loads kick off automatically -- the component does not need to call them manually."

**Browser demo:**
- Hard-refresh the page (Ctrl+Shift+R)
- Watch the Network tab: two API calls fire immediately (`/products` and `/products/categories`)
- The table populates and the category dropdown fills in

### Part 6: Component Integration (5 min)

**Editor:** Open `src/app/features/inventory/components/inventory-list.component.ts`

1. **Show line 538:** `protected readonly store = inject(InventoryStore);`
   > "One line. The component now has access to every signal and method on the store."

2. **Show the template (lines 50-311).** Point out how signals are read directly:
   - `store.stats().totalProducts` (line 58)
   - `store.filters().search` (line 91)
   - `store.loading()` (line 159)
   - `store.filteredProducts()` (line 182) as the table data source
   - `store.selectedProduct()` (line 284) for the detail panel

3. **Show the handler methods (lines 553-592).** Each one is a one-liner that delegates to the store:
   ```typescript
   onSearchChange(term: string) {
     this.store.setFilters({ search: term });
     this.store.loadProducts();
   }
   ```
   > "The component is purely presentational. It reads signals and calls methods. Zero business logic."

4. **Show `displayedColumns` (line 548).** The only local state in the entire component is an array of column names.

---

## Audience Interaction Points

- **After Part 1:** "Quick poll -- has anyone tried managing complex state with just Angular Signals and services? What problems did you hit?" (Expected: synchronization issues, no standard patterns)
- **After Part 3:** "Can you think of other computed signals you might add to this store?" (Expected: total value of inventory, most expensive product, category counts)
- **After Part 6:** "What would break if the component tried to call patchState directly instead of going through store methods?" (Answer: it cannot -- patchState requires the internal store reference)

---

## Common Questions & Answers

**Q: How is this different from a plain service with signals?**
A: SignalStore gives you a standard composition model (`with*` features), built-in entity management, rxMethod for async flow control, and DevTools integration. A plain service works for small cases but becomes ad-hoc at scale.

**Q: Can I have multiple instances of the same store?**
A: Yes. Remove `providedIn: 'root'` and provide the store class in a component's or route's `providers` array. Each provider scope gets its own instance.

**Q: What happens if two components inject the same root store?**
A: They share the same instance. Both read the same signals and both see the same state updates. This is the point of a singleton store.

**Q: Is patchState synchronous?**
A: Yes. The signal updates synchronously, and any computed signals that depend on the changed values recompute immediately. Templates re-render in the next change detection cycle.

**Q: Where do async operations go?**
A: In `withMethods`, using either `async/await` with `firstValueFrom()` or `rxMethod` for RxJS pipelines. We will cover rxMethod in depth in Section 06.

---

## Recovery Steps

**If the inventory page shows no data:**
1. Check the terminal for `ng serve` errors
2. Open Network tab -- verify requests to `dummyjson.com/products` are succeeding
3. Check the console for CORS or API errors
4. Hard-refresh with Ctrl+Shift+R

**If Angular DevTools does not show store signals:**
1. Ensure you are running a development build (not production)
2. Try closing and reopening DevTools
3. The store itself is not a component -- look for the component that injects it (`InventoryListComponent`)

---

## Transition to Next Section

> "We have built the mental model: `withState` for base state, `withComputed` for derived signals, `withMethods` for updates, and `withHooks` for lifecycle. But we glossed over something important -- `withEntities`. That one line on line 83 replaces our entire product array with a normalized entity collection. In the next section, we will dig into what that means and how it powers full CRUD operations."

---

## Section Cheat Sheet

| Concept | Location | Line(s) |
|---|---|---|
| `signalStore()` composition | `inventory.store.ts` | 68 |
| `providedIn: 'root'` | `inventory.store.ts` | 72 |
| `withState(initialState)` | `inventory.store.ts` | 77 |
| `withEntities<Product>()` | `inventory.store.ts` | 83 |
| `withComputed` block | `inventory.store.ts` | 89-140 |
| `filteredProducts` computed | `inventory.store.ts` | 93-107 |
| `selectedProduct` via entityMap | `inventory.store.ts` | 112-115 |
| Pagination computeds | `inventory.store.ts` | 120-123 |
| `stats` computed | `inventory.store.ts` | 128-139 |
| `patchState` (function form) | `inventory.store.ts` | 157-160 |
| `patchState` (object form) | `inventory.store.ts` | 166 |
| Pagination methods | `inventory.store.ts` | 169-185 |
| `withHooks` onInit | `inventory.store.ts` | 325-330 |
| Component inject | `inventory-list.component.ts` | 538 |
| Template signal reads | `inventory-list.component.ts` | 58, 91, 159, 182, 284 |
| Handler delegation | `inventory-list.component.ts` | 553-592 |
