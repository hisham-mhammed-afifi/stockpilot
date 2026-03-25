# StockPilot Workshop -- Quick Reference Card

> Single-page cheat sheet for presenters. Print this or keep it on a second monitor.

---

## Signal and Store APIs

| API | Purpose | Example |
|-----|---------|---------|
| `signal()` | Writable reactive value | `signal<number>(0)` |
| `computed()` | Derived read-only value | `computed(() => a() + b())` |
| `effect()` | Side effects on signal change | `effect(() => console.log(val()))` |
| `linkedSignal()` | Resettable derived signal | `linkedSignal({ source: () => search(), computation: () => 1 })` |
| `untracked()` | Read without tracking | `untracked(() => someSignal())` |
| `toSignal()` | Observable to Signal bridge | `toSignal(obs$, { initialValue: 0 })` |
| `resource()` | Declarative async fetch | `resource({ request: sig, loader: fn })` |
| `signalStore()` | Create composed store | `signalStore(withState(...), ...)` |
| `withState()` | Define state shape | `withState({ loading: false })` |
| `withComputed()` | Derived store signals | `withComputed(store => ({ ... }))` |
| `withMethods()` | Store methods | `withMethods(store => ({ ... }))` |
| `withHooks()` | Lifecycle hooks | `withHooks({ onInit(store) { ... } })` |
| `withEntities()` | Normalized entity storage | `withEntities<Product>()` |
| `patchState()` | Immutable state update | `patchState(store, { loading: true })` |
| `rxMethod()` | Observable-based side effects | `rxMethod<void>(pipe(...))` |
| `tapResponse()` | Error-safe response handler | `tapResponse({ next: ..., error: ... })` |
| `signalStoreFeature()` | Reusable store plugin | `signalStoreFeature(withState(...))` |
| Entity operations | Bulk and single entity ops | `setAllEntities()`, `addEntity()`, `updateEntity()`, `removeEntity()` |

---

## All CONCEPT Tags and Locations

### Section 1 -- The Problem (Anti-patterns)

| File | Line | Concept |
|------|------|---------|
| `src/app/features/home/product-list-bad.component.ts` | 10 | Anti-pattern: Direct HttpClient in component |
| `src/app/features/home/product-list-bad.component.ts` | 24 | Anti-pattern: Duplicate HTTP calls |
| `src/app/features/home/product-list-bad.component.ts` | 37 | Anti-pattern: Forwarding events |
| `src/app/features/home/product-list-bad.component.ts` | 66 | Anti-pattern: Injecting HttpClient directly |
| `src/app/features/home/product-list-bad.component.ts` | 74 | Anti-pattern: Output forwarding |
| `src/app/features/home/product-list-bad.component.ts` | 82 | Anti-pattern: Duplicate HTTP calls |
| `src/app/features/home/product-item-bad.component.ts` | 7 | Anti-pattern: Prop drilling (3+ levels of @Input) |
| `src/app/features/home/product-item-bad.component.ts` | 28 | Anti-pattern: Forwarding an output |
| `src/app/features/home/product-item-bad.component.ts` | 58 | Anti-pattern: Component does not handle the event |
| `src/app/features/home/product-actions-bad.component.ts` | 5 | Anti-pattern: Event bubbling through 3+ levels |
| `src/app/features/home/product-actions-bad.component.ts` | 29 | Anti-pattern: Prop drilling |
| `src/app/features/home/product-actions-bad.component.ts` | 34 | Anti-pattern: Output forwarding |
| `src/app/features/home/home.component.ts` | 47 | Anti-pattern: Event from "Add to Cart" bubbles through layers |
| `src/app/features/home/home.component.ts` | 62 | State Classification: local, shared, global, server |
| `src/app/features/home/home.component.ts` | 158 | Anti-pattern: 3 levels of event bubbling |

### Section 2 -- Signals Foundation

| File | Line | Concept |
|------|------|---------|
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 595 | signal() -- writable reactive container |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 600 | signal .update() -- transform current value |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 610 | signal .set() -- replace value directly |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 634 | computed() -- derived read-only signal |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 656 | computed -- derived boolean |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 676 | effect() -- side effect on signal change |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 707 | linkedSignal() -- writable signal that auto-resets |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 741 | untracked() -- read without tracking |
| `src/app/features/home/signals-playground/signals-playground.component.ts` | 767 | Signals vs Observables -- BehaviorSubject comparison |

### Section 3 -- Component State

| File | Line | Concept |
|------|------|---------|
| `src/app/features/products/products.component.ts` | 291 | Component State -- signals local to this component |
| `src/app/features/products/products.component.ts` | 296 | signal -- searchInput holds raw user keystrokes |
| `src/app/features/products/products.component.ts` | 306 | linkedSignal -- resets page to 1 on search/category change |
| `src/app/features/products/products.component.ts` | 315 | computed -- skip derived from page and pageSize |
| `src/app/features/products/products.component.ts` | 319 | computed -- requestParams bundles all parameters |
| `src/app/features/products/products.component.ts` | 331 | resource() -- declarative async data fetching |
| `src/app/features/products/products.component.ts` | 361 | resource() for categories (static data) |
| `src/app/features/products/products.component.ts` | 367 | computed -- totalPages from resource value |
| `src/app/features/products/products.component.ts` | 375 | effect() for debouncing |
| `src/app/features/products/products.component.ts` | 429 | When to extract -- discussion prompt |
| `src/app/features/products/product-detail.component.ts` | 374 | toSignal() -- Observable (route params) to Signal |
| `src/app/features/products/product-detail.component.ts` | 383 | resource() with route params |
| `src/app/features/products/product-detail.component.ts` | 394 | Component State -- selectedImageIndex (local UI state) |
| `src/app/features/products/product-detail.component.ts` | 398 | computed -- selectedImage derives from product + index |

### Section 4 -- SignalStore Core

| File | Line | Concept |
|------|------|---------|
| `src/app/features/inventory/store/inventory.store.ts` | 20 | State Shape -- define state interface separately |
| `src/app/features/inventory/store/inventory.store.ts` | 31 | Normalization -- products array is gone from state |
| `src/app/features/inventory/store/inventory.store.ts` | 65 | signalStore() -- creates a reactive store |
| `src/app/features/inventory/store/inventory.store.ts` | 69 | providedIn -- singleton at root level |
| `src/app/features/inventory/store/inventory.store.ts` | 74 | withState() -- defines state shape and initial values |
| `src/app/features/inventory/store/inventory.store.ts` | 79 | withEntities<Product>() -- normalized entity management |
| `src/app/features/inventory/store/inventory.store.ts` | 85 | withComputed() -- derived signals |
| `src/app/features/inventory/store/inventory.store.ts` | 109 | entityMap() for O(1) lookups |
| `src/app/features/inventory/store/inventory.store.ts` | 117 | computed -- pagination helpers |
| `src/app/features/inventory/store/inventory.store.ts` | 125 | computed -- summary stats aggregated from entities |
| `src/app/features/inventory/store/inventory.store.ts` | 142 | withMethods() -- adds methods to the store |
| `src/app/features/inventory/store/inventory.store.ts` | 152 | patchState() -- immutable partial state update |

### Section 5 -- Entity CRUD

| File | Line | Concept |
|------|------|---------|
| `src/app/features/inventory/store/inventory.store.ts` | 3 | withEntities -- import entity management |
| `src/app/features/inventory/store/inventory.store.ts` | 211 | setAllEntities() -- replace all entities |
| `src/app/features/inventory/store/inventory.store.ts` | 241 | addEntity() -- add a single entity |
| `src/app/features/inventory/store/inventory.store.ts` | 266 | updateEntity() -- update a single entity by ID |
| `src/app/features/inventory/store/inventory.store.ts` | 288 | removeEntity() -- remove an entity by ID |
| `src/app/features/inventory/store/inventory.store.ts` | 320 | withHooks() -- lifecycle hooks |
| `src/app/features/inventory/components/inventory-list.component.ts` | 501 | inject(SignalStore) -- consuming stores via injection |
| `src/app/features/inventory/components/inventory-list.component.ts` | 566 | Dialog-based CRUD pattern |
| `src/app/features/inventory/components/inventory-list.component.ts` | 590 | entityMap() for passing product to dialog |

### Section 6 -- Async & Side Effects

| File | Line | Concept |
|------|------|---------|
| `src/app/features/orders/store/orders.store.ts` | 23 | rxMethod vs async/await |
| `src/app/features/orders/store/orders.store.ts` | 40 | withEntities -- normalized entity storage |
| `src/app/features/orders/store/orders.store.ts` | 45 | computed -- groups orders by status |
| `src/app/features/orders/store/orders.store.ts` | 72 | rxMethod<void> -- Observable pipeline triggered imperatively |
| `src/app/features/orders/store/orders.store.ts` | 79 | switchMap -- "only the latest request matters" |
| `src/app/features/orders/store/orders.store.ts` | 96 | tapResponse -- error-safe handler |
| `src/app/features/orders/store/orders.store.ts` | 114 | rxMethod with concatMap -- processes requests in order |
| `src/app/features/orders/store/orders.store.ts` | 119 | Optimistic Update -- update UI before API call |
| `src/app/features/orders/store/orders.store.ts` | 127 | concatMap -- "every request matters, process in order" |
| `src/app/features/orders/store/orders.store.ts` | 139 | Rollback -- revert optimistic update on failure |
| `src/app/features/orders/store/orders.store.ts` | 156 | rxMethod with exhaustMap -- ignores new requests while busy |
| `src/app/features/orders/store/orders.store.ts` | 184 | withHooks -- lifecycle hooks |

### Section 7 -- Custom Features

| File | Line | Concept |
|------|------|---------|
| `src/app/shared/store-features/with-loading.ts` | 4 | signalStoreFeature() -- reusable plugin |
| `src/app/shared/store-features/with-loading.ts` | 14 | computed -- derived boolean for template |
| `src/app/shared/store-features/with-pagination.ts` | 4 | Parameterized features -- accept config via arguments |
| `src/app/shared/store-features/with-pagination.ts` | 16 | computed -- all pagination math derived from 3 signals |
| `src/app/shared/store-features/with-undo-redo.ts` | 4 | Generic undo/redo -- works with any state shape |
| `src/app/shared/store-features/with-undo-redo.ts` | 17 | computed -- canUndo/canRedo drive button state |
| `src/app/shared/store-features/with-undo-redo.ts` | 24 | Undo/Redo architecture -- call snapshot() before changes |
| `src/app/shared/store-features/with-local-storage.ts` | 4 | Persistence feature -- auto save/restore to localStorage |
| `src/app/shared/store-features/with-local-storage.ts` | 31 | withHooks -- onInit runs once on first injection |
| `src/app/shared/store-features/with-local-storage.ts` | 40 | effect() for persistence -- each key gets an effect |
| `src/app/core/theme/theme.store.ts` | 5 | signalStoreFeature composition |
| `src/app/core/theme/theme.store.ts` | 16 | withLocalStorage -- replaces manual localStorage code |
| `src/app/core/theme/theme.store.ts` | 22 | computed -- pure derivation from theme signal |
| `src/app/core/theme/theme.store.ts` | 57 | withHooks -- side effects (DOM manipulation) in onInit |

### Section 8 -- Global State

| File | Line | Concept |
|------|------|---------|
| `src/app/core/auth/auth.store.ts` | 13 | Global State -- providedIn: 'root', lives for entire app |
| `src/app/core/auth/auth.store.ts` | 37 | Global computed signals -- available anywhere |
| `src/app/core/auth/auth.store.ts` | 53 | Login flow with exhaustMap |
| `src/app/core/auth/auth.store.ts` | 78 | Global store coordination -- store owns navigation logic |
| `src/app/core/auth/auth.store.ts` | 95 | Coordinator call before state cleanup |
| `src/app/core/auth/auth.store.ts` | 108 | Session restoration -- check token in sessionStorage |
| `src/app/core/auth/auth.store.ts` | 130 | Token refresh -- switchMap for latest |
| `src/app/core/auth/auth.store.ts` | 166 | withHooks -- store lifecycle |
| `src/app/core/auth/auth.store.ts` | 178 | effect() for persistence |
| `src/app/core/auth/auth.interceptor.ts` | 5 | Interceptor + Store -- reads token from store |
| `src/app/core/auth/auth.guard.ts` | 5 | Functional guard -- reads authStore.isAuthenticated() |
| `src/app/core/auth/auth.guard.ts` | 20 | Reverse guard -- prevents authenticated users seeing login |
| `src/app/core/notifications/notifications.store.ts` | 5 | Notification queue -- global state pattern |
| `src/app/core/notifications/notifications.store.ts` | 26 | Private helper -- internal notification creation |
| `src/app/app.config.ts` | 15 | Interceptor + Store -- wire auth interceptor into HTTP pipeline |
| `src/app/app.routes.ts` | 11 | Functional Guards + Store -- guestGuard |
| `src/app/app.routes.ts` | 14 | Functional Guards + Store -- authGuard |

### Section 9 -- Store Architecture

| File | Line | Concept |
|------|------|---------|
| `src/app/features/order-builder/store/order-builder.store.ts` | 22 | Feature-scoped store -- provided at route level |
| `src/app/features/order-builder/store/order-builder.store.ts` | 47 | Composing features -- uses 3 reusable features |
| `src/app/features/order-builder/store/order-builder.store.ts` | 55 | withEntities -- normalized storage for available products |
| `src/app/features/order-builder/store/order-builder.store.ts` | 72 | rxMethod -- switchMap cancels on quick pagination |
| `src/app/features/order-builder/store/order-builder.store.ts` | 93 | snapshot() before mutation -- save state for undo |
| `src/app/features/order-builder/store/order-builder.store.ts` | 134 | rxMethod with exhaustMap -- ignores duplicate submit clicks |
| `src/app/features/order-builder/store/order-builder.store.ts` | 161 | withHooks onInit -- load products automatically |
| `src/app/features/order-builder/order-builder.routes.ts` | 9 | Feature-scoped store -- provided at route level |
| `src/app/core/coordination/store-coordinator.service.ts` | 9 | Mediator Pattern -- central event handler |
| `src/app/core/coordination/store-coordinator.service.ts` | 22 | effect() for cross-store coordination |
| `src/app/core/coordination/store-coordinator.service.ts` | 30 | untracked() -- prevents additional tracking |
| `src/app/core/coordination/store-coordinator.service.ts` | 43 | Cross-store orchestration -- single event triggers multiple stores |
| `src/app/features/dashboard/store/dashboard.store.ts` | 21 | Aggregation Store -- no domain data of its own |
| `src/app/features/dashboard/store/dashboard.store.ts` | 35 | Store reads another store -- inject other stores directly |
| `src/app/features/dashboard/store/dashboard.store.ts` | 119 | Store lifetime -- providedIn: 'root', lives forever |
| `src/app/core/activity-log/activity-log.store.ts` | 5 | Event-driven store -- receives generic activity entries |
| `src/app/core/activity-log/activity-log.store.ts` | 17 | computed -- derived slices of activity log |
| `src/app/core/activity-log/activity-log.store.ts` | 21 | computed -- aggregation by action type |
| `src/app/core/activity-log/activity-log.store.ts` | 34 | Event-driven store -- other stores call log() |

### Architecture & Shared

| File | Line | Concept |
|------|------|---------|
| `src/app/shared/services/api.service.ts` | 6 | Architecture -- thin HttpClient wrapper for base URL |
| `src/app/shared/ui/empty-state/empty-state.component.ts` | 4 | Architecture -- reusable shared UI in shared/ui/ |
| `src/app/shared/ui/empty-state/empty-state.component.ts` | 52 | Signal Inputs -- input() creates signal-based input |
| `src/app/shared/ui/confirm-dialog/confirm-dialog.component.ts` | 5 | Architecture -- reusable confirmation dialog |
| `src/app/features/products/services/products-api.service.ts` | 6 | Architecture -- feature-specific API service |
| `src/app/core/layout/shell.component.ts` | 48 | Global State -- reading NotificationsStore in toolbar |
| `src/app/core/layout/shell.component.ts` | 95 | Global State -- AuthStore drives toolbar UI |
| `src/app/core/layout/shell.component.ts` | 131 | Global State -- conditional nav based on auth |
| `src/app/core/layout/shell.component.ts` | 218 | Eager initialization -- coordinator uses effect() in constructor |

---

## DummyJSON Endpoints Used

| Endpoint | Method | Section(s) | Purpose |
|----------|--------|------------|---------|
| `/auth/login` | POST | 8 | Login with credentials |
| `/auth/me` | GET | 8 | Restore session from token |
| `/auth/refresh` | POST | 8 | Refresh access token |
| `/products` | GET | 3, 4, 5 | Product list with pagination |
| `/products/:id` | GET | 3 | Single product detail |
| `/products/search?q=` | GET | 3, 4 | Search products by query |
| `/products/categories` | GET | 3, 4 | Category list |
| `/products/category/:name` | GET | 4 | Filter products by category |
| `/products/add` | POST | 5 | Create a new product (simulated) |
| `/products/:id` | PUT | 5 | Update a product (simulated) |
| `/products/:id` | DELETE | 5 | Delete a product (simulated) |
| `/carts` | GET | 6 | Fetch all orders/carts |
| `/carts/add` | POST | 7 | Create a new order (simulated) |
| `/todos` | GET | 9 | Dashboard tasks |
| `/users` | GET | 9 | Dashboard users |

**Base URL:** `https://dummyjson.com`

**Test credentials:** username `emilys`, password `emilyspass`

---

## All Store Files

| Store | File | Scope | Manages |
|-------|------|-------|---------|
| ThemeStore | `src/app/core/theme/theme.store.ts` | Root | Light/dark/system theme |
| AuthStore | `src/app/core/auth/auth.store.ts` | Root | User, tokens, auth status |
| NotificationsStore | `src/app/core/notifications/notifications.store.ts` | Root | Toast notification queue |
| ActivityLogStore | `src/app/core/activity-log/activity-log.store.ts` | Root | Event log for dashboard |
| InventoryStore | `src/app/features/inventory/store/inventory.store.ts` | Root | Products with entities + CRUD |
| OrdersStore | `src/app/features/orders/store/orders.store.ts` | Root | Orders kanban + status transitions |
| OrderBuilderStore | `src/app/features/order-builder/store/order-builder.store.ts` | Route | Multi-step order wizard |
| DashboardStore | `src/app/features/dashboard/store/dashboard.store.ts` | Root | Aggregated cross-store data |

---

## Reusable Store Features

| Feature | File | API | Used By |
|---------|------|-----|---------|
| `withLoading()` | `src/app/shared/store-features/with-loading.ts` | `setLoading()`, `setLoaded()`, `setError()`, `clearError()`, `hasError()` | OrderBuilderStore |
| `withPagination()` | `src/app/shared/store-features/with-pagination.ts` | `nextPage()`, `prevPage()`, `goToPage()`, `skip()`, `totalPages()`, `hasNextPage()`, `hasPrevPage()` | OrderBuilderStore |
| `withUndoRedo()` | `src/app/shared/store-features/with-undo-redo.ts` | `snapshot()`, `undo()`, `redo()`, `canUndo()`, `canRedo()`, `historyLength()` | OrderBuilderStore |
| `withLocalStorage()` | `src/app/shared/store-features/with-local-storage.ts` | Auto-save/restore via `effect()` | ThemeStore |

---

## VS Code Shortcuts for Live Demo

| Action | Shortcut |
|--------|----------|
| Go to File | `Ctrl+P` |
| Go to Symbol in File | `Ctrl+Shift+O` |
| Go to Line | `Ctrl+G` |
| Find in Files | `Ctrl+Shift+F` |
| Toggle Terminal | `` Ctrl+` `` |
| Split Editor | `Ctrl+\` |
| Zen Mode | `Ctrl+K Z` |
| Fold All | `Ctrl+K Ctrl+0` |
| Unfold All | `Ctrl+K Ctrl+J` |
| Quick Fix | `Ctrl+.` |

---

## RxJS Operator Quick Guide (Section 6)

| Operator | Behavior | Use When |
|----------|----------|----------|
| `switchMap` | Cancels previous request | Fetching data, search-as-you-type |
| `concatMap` | Queues requests in order | Mutations that must preserve order |
| `exhaustMap` | Ignores new while busy | Form submission, login |
| `mergeMap` | Runs all in parallel | Independent parallel requests (rare in stores) |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ng serve` fails | Delete `node_modules` and run `npm install` again |
| API returns 429 | DummyJSON rate limit -- wait 60 seconds |
| Login fails | Use `emilys` / `emilyspass` (not `emily` or other variations) |
| Store not updating UI | Check that you are reading the signal with `()` in the template |
| Entity not found | Check that the entity has an `id` property (required by `withEntities`) |
| Circular dependency error | Use `Injector` + `runInInjectionContext` pattern (see `src/app/features/inventory/store/inventory.store.ts:145`) |
