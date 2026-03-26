# Quick Reference - StockPilot Workshop

> Single-page cheat sheet for the presenter. Print this or keep it open during delivery.

---

## Signal & Store API Reference

### Core Signals API

| API | Purpose | Example |
|-----|---------|---------|
| `signal(value)` | Create a writable reactive container | `count = signal(0)` |
| `signal.set(value)` | Replace the value directly | `count.set(100)` |
| `signal.update(fn)` | Derive new value from current | `count.update(c => c + 1)` |
| `signal.asReadonly()` | Expose as read-only signal | `public count = this._count.asReadonly()` |
| `computed(fn)` | Create a derived read-only signal (lazy + cached) | `total = computed(() => a() + b())` |
| `effect(fn)` | Run side effects on signal changes (DOM, storage, logging) | `effect(() => { console.log(count()); })` |
| `linkedSignal(opts)` | Writable signal that resets when source changes | `page = linkedSignal(() => { search(); return 1; })` |
| `untracked(fn)` | Read signal value without tracking as dependency | `untracked(() => someSignal())` |
| `toSignal(obs$)` | Convert Observable to Signal | `data = toSignal(obs$, { initialValue: null })` |
| `resource(opts)` | Declarative async fetch tied to reactive inputs | `resource({ request: params, loader: ... })` |

### NgRx SignalStore API

| API | Purpose | Example |
|-----|---------|---------|
| `signalStore(...)` | Create a reactive store from composed features | `signalStore({ providedIn: 'root' }, ...)` |
| `withState(state)` | Define the state shape and initial values | `withState({ loading: false, error: null })` |
| `withComputed(fn)` | Add derived signals | `withComputed(store => ({ total: computed(() => ...) }))` |
| `withMethods(fn)` | Add synchronous/async methods | `withMethods(store => ({ load() { ... } }))` |
| `withHooks(hooks)` | Add lifecycle hooks (onInit, onDestroy) | `withHooks({ onInit(store) { store.load(); } })` |
| `patchState(store, ...)` | Immutably update part of state | `patchState(store, { loading: true })` |
| `signalStoreFeature(...)` | Create reusable store plugins | `signalStoreFeature(withState(...), withMethods(...))` |

### Entity API (`@ngrx/signals/entities`)

| API | Purpose | Example |
|-----|---------|---------|
| `withEntities<T>()` | Add normalized entity management | `withEntities<Product>()` |
| `store.entities()` | Get all entities as array | `store.entities()` |
| `store.entityMap()` | Get entities as `Record<id, entity>` (O(1) lookup) | `store.entityMap()[id]` |
| `store.ids()` | Get array of all entity IDs | `store.ids()` |
| `setAllEntities(arr)` | Replace all entities | `patchState(store, setAllEntities(products))` |
| `addEntity(entity)` | Add one entity | `patchState(store, addEntity(product))` |
| `updateEntity({id, changes})` | Partial update one entity | `patchState(store, updateEntity({ id, changes }))` |
| `removeEntity(id)` | Remove one entity by ID | `patchState(store, removeEntity(id))` |

### rxMethod API (`@ngrx/signals/rxjs-interop`)

| API | Purpose | Example |
|-----|---------|---------|
| `rxMethod<T>(pipe(...))` | Create Observable-based side effect method | `loadData: rxMethod<void>(pipe(switchMap(...)))` |
| `tapResponse({next, error})` | Error-safe handler (keeps stream alive) | `tapResponse({ next: ..., error: ... })` |

### Flattening Operators

| Operator | Behavior | Use For |
|----------|----------|---------|
| `switchMap` | Cancels previous, runs latest only | Search, navigation, data loading |
| `concatMap` | Queues all, processes in order | Status updates, sequential mutations |
| `exhaustMap` | Ignores new while one is in-flight | Submit buttons, delete, prevent double-click |

---

## All `// CONCEPT:` Tags and Locations

### Section 01: The Problem

| Tag | File | Line |
|-----|------|------|
| Anti-pattern - Fetching data directly | `src/app/features/home/product-list-bad.component.ts` | 10 |
| Anti-pattern - Prop drilling | `src/app/features/home/product-item-bad.component.ts` | 7 |
| Anti-pattern - Event bubbling | `src/app/features/home/product-actions-bad.component.ts` | 5 |
| Anti-pattern - Duplicate HTTP calls | `src/app/features/home/product-list-bad.component.ts` | 89 |
| State Classification | `src/app/features/home/home.component.ts` | 63 |

### Section 02: Signals Foundation

| Tag | File | Line |
|-----|------|------|
| Signal - writable reactive container | `src/app/features/home/signals-playground/signals-playground.component.ts` | 602 |
| Signal - .update() usage | `src/app/features/home/signals-playground/signals-playground.component.ts` | 607 |
| Signal - .set() usage | `src/app/features/home/signals-playground/signals-playground.component.ts` | 617 |
| Computed - derived read-only | `src/app/features/home/signals-playground/signals-playground.component.ts` | 641 |
| Effect - side effects | `src/app/features/home/signals-playground/signals-playground.component.ts` | 683 |
| LinkedSignal - resettable derived | `src/app/features/home/signals-playground/signals-playground.component.ts` | 714 |
| Computed (theme) | `src/app/core/theme/theme.store.ts` | 22 |
| withHooks effect for DOM sync | `src/app/core/theme/theme.store.ts` | 57 |
| withLocalStorage composition | `src/app/core/theme/theme.store.ts` | 16 |

### Section 03: Component State

| Tag | File | Line |
|-----|------|------|
| Component State - local signals | `src/app/features/products/products.component.ts` | 297 |
| linkedSignal - page reset | `src/app/features/products/products.component.ts` | 312 |
| resource() - declarative fetch | `src/app/features/products/products.component.ts` | 337 |
| resource() for categories | `src/app/features/products/products.component.ts` | 367 |
| effect() for debouncing | `src/app/features/products/products.component.ts` | 381 |
| toSignal() - Observable bridge | `src/app/features/products/product-detail.component.ts` | 372 |
| resource() with route params | `src/app/features/products/product-detail.component.ts` | 381 |
| When to extract | `src/app/features/products/products.component.ts` | 435 |

### Section 04: SignalStore Core

| Tag | File | Line |
|-----|------|------|
| signalStore() - composed features | `src/app/features/inventory/store/inventory.store.ts` | 65 |
| providedIn - root singleton | `src/app/features/inventory/store/inventory.store.ts` | 69 |
| withState() - state shape | `src/app/features/inventory/store/inventory.store.ts` | 74 |
| withComputed() - derived signals | `src/app/features/inventory/store/inventory.store.ts` | 85 |
| withMethods() - store methods | `src/app/features/inventory/store/inventory.store.ts` | 142 |
| patchState() - immutable updates | `src/app/features/inventory/store/inventory.store.ts` | 152 |
| withHooks() - lifecycle | `src/app/features/inventory/store/inventory.store.ts` | 320 |
| inject(SignalStore) | `src/app/features/inventory/components/inventory-list.component.ts` | 535 |
| Dumb Components | `src/app/features/inventory/components/inventory-list.component.ts` | 550 |

### Section 05: Entities & CRUD

| Tag | File | Line |
|-----|------|------|
| withEntities<Product>() | `src/app/features/inventory/store/inventory.store.ts` | 79 |
| Normalization | `src/app/features/inventory/store/inventory.store.ts` | 31 |
| entityMap() for O(1) lookups | `src/app/features/inventory/store/inventory.store.ts` | 109 |
| setAllEntities() | `src/app/features/inventory/store/inventory.store.ts` | 211 |
| addEntity() | `src/app/features/inventory/store/inventory.store.ts` | 241 |
| updateEntity() | `src/app/features/inventory/store/inventory.store.ts` | 266 |
| removeEntity() | `src/app/features/inventory/store/inventory.store.ts` | 288 |

### Section 06: Async & Side Effects

| Tag | File | Line |
|-----|------|------|
| rxMethod vs async/await | `src/app/features/orders/store/orders.store.ts` | 23 |
| switchMap - latest wins | `src/app/features/orders/store/orders.store.ts` | ~67 |
| concatMap - queue in order | `src/app/features/orders/store/orders.store.ts` | ~100 |
| exhaustMap - ignore while busy | `src/app/features/orders/store/orders.store.ts` | ~140 |
| tapResponse - error-safe handler | `src/app/features/orders/store/orders.store.ts` | ~80 |
| Optimistic Updates | `src/app/features/orders/store/orders.store.ts` | ~105 |

### Section 07: Custom Features

| Tag | File | Line |
|-----|------|------|
| signalStoreFeature() - reusable plugin | `src/app/shared/store-features/with-loading.ts` | 4 |
| Parameterized features | `src/app/shared/store-features/with-pagination.ts` | 4 |
| Generic undo/redo | `src/app/shared/store-features/with-undo-redo.ts` | 4 |
| Persistence feature | `src/app/shared/store-features/with-local-storage.ts` | 4 |
| Feature-scoped store | `src/app/features/order-builder/store/order-builder.store.ts` | (top) |
| snapshot() before mutation | `src/app/features/order-builder/store/order-builder.store.ts` | (addToOrder) |

### Section 08: Global State

| Tag | File | Line |
|-----|------|------|
| Global State - AuthStore | `src/app/core/auth/auth.store.ts` | 13 |
| Global computed signals | `src/app/core/auth/auth.store.ts` | 37 |
| Login flow with exhaustMap | `src/app/core/auth/auth.store.ts` | 53 |
| Interceptor + Store | `src/app/core/auth/auth.interceptor.ts` | 5 |
| Functional Guards + Store | `src/app/core/auth/auth.guard.ts` | 5 |
| effect() for persistence | `src/app/core/auth/auth.store.ts` | 178 |
| Notification queue | `src/app/core/notifications/notifications.store.ts` | 5 |

### Section 09: Store Architecture

| Tag | File | Line |
|-----|------|------|
| Event-driven store | `src/app/core/activity-log/activity-log.store.ts` | 5 |
| Mediator Pattern | `src/app/core/coordination/store-coordinator.service.ts` | 9 |
| effect() for cross-store coordination | `src/app/core/coordination/store-coordinator.service.ts` | 22 |
| Aggregation Store | `src/app/features/dashboard/store/dashboard.store.ts` | 21 |
| Store reads another store | `src/app/features/dashboard/store/dashboard.store.ts` | 35 |
| Eager initialization | `src/app/core/layout/shell.component.ts` | 228 |
| Circular dependency prevention | `src/app/core/auth/auth.store.ts` | 50 |

---

## DummyJSON Endpoints Used

| Endpoint | Method | Section | Used By |
|----------|--------|---------|---------|
| `/products?limit=5` | GET | 01 | product-list-bad.component.ts |
| `/products?limit=N&skip=N&sortBy=X&order=Y` | GET | 03, 04, 07 | products.component.ts, inventory.store.ts |
| `/products/search?q=TERM` | GET | 03, 04 | products.component.ts, inventory.store.ts |
| `/products/categories` | GET | 03, 04 | products.component.ts, inventory.store.ts |
| `/products/category/:name` | GET | 04 | inventory.store.ts |
| `/products/:id` | GET | 03 | product-detail.component.ts |
| `/products/add` | POST | 05 | inventory.store.ts |
| `/products/:id` | PUT | 05 | inventory.store.ts |
| `/products/:id` | DELETE | 05 | inventory.store.ts |
| `/carts?limit=30` | GET | 06 | orders.store.ts |
| `/carts/:id` | PUT | 06 | orders.store.ts |
| `/carts/:id` | DELETE | 06 | orders.store.ts |
| `/carts/add` | POST | 07 | order-builder.store.ts |
| `/auth/login` | POST | 08 | auth.store.ts |
| `/auth/me` | GET | 08 | auth.store.ts |
| `/auth/refresh` | POST | 08 | auth.store.ts |
| `/todos?limit=20` | GET | 09 | dashboard.store.ts |
| `/users?limit=10` | GET | 09 | dashboard.store.ts |

**Base URL:** `https://dummyjson.com`
**Auth credentials:** `emilys` / `emilyspass`

---

## All Store Files and What They Manage

| Store | File | Scope | Manages |
|-------|------|-------|---------|
| ThemeStore | `src/app/core/theme/theme.store.ts` | Root | Light/dark theme preference |
| AuthStore | `src/app/core/auth/auth.store.ts` | Root | User session, tokens, auth status |
| NotificationsStore | `src/app/core/notifications/notifications.store.ts` | Root | Toast notification queue |
| ActivityLogStore | `src/app/core/activity-log/activity-log.store.ts` | Root | Event-driven activity entries |
| InventoryStore | `src/app/features/inventory/store/inventory.store.ts` | Root | Products with entities, filters, CRUD |
| OrdersStore | `src/app/features/orders/store/orders.store.ts` | Root | Orders with kanban status |
| OrderBuilderStore | `src/app/features/order-builder/store/order-builder.store.ts` | Feature | Multi-step order wizard |
| DashboardStore | `src/app/features/dashboard/store/dashboard.store.ts` | Root | Aggregation from other stores + todos/users |

---

## Reusable Store Features

| Feature | File | API Surface |
|---------|------|-------------|
| `withLoading()` | `src/app/shared/store-features/with-loading.ts` | `loading()`, `error()`, `hasError()`, `setLoading()`, `setLoaded()`, `setError(msg)`, `clearError()` |
| `withPagination(config?)` | `src/app/shared/store-features/with-pagination.ts` | `currentPage()`, `pageSize()`, `totalItems()`, `totalPages()`, `skip()`, `hasNextPage()`, `hasPrevPage()`, `paginationInfo()`, `nextPage()`, `prevPage()`, `goToPage(n)`, `setTotalItems(n)`, `resetPagination()`, `setPageSize(n)` |
| `withUndoRedo(keys)` | `src/app/shared/store-features/with-undo-redo.ts` | `canUndo()`, `canRedo()`, `historyLength()`, `snapshot()`, `undo()`, `redo()`, `clearHistory()` |
| `withLocalStorage(key, keys)` | `src/app/shared/store-features/with-local-storage.ts` | Auto-save/restore specified state keys to localStorage |

---

## VS Code Shortcuts for Live Demo

| Action | Windows | Mac |
|--------|---------|-----|
| Go to File | `Ctrl+P` | `Cmd+P` |
| Go to Symbol in File | `Ctrl+Shift+O` | `Cmd+Shift+O` |
| Go to Line | `Ctrl+G` | `Ctrl+G` |
| Find in Files | `Ctrl+Shift+F` | `Cmd+Shift+F` |
| Toggle Sidebar | `Ctrl+B` | `Cmd+B` |
| Toggle Terminal | `` Ctrl+` `` | `` Cmd+` `` |
| Fold Code Block | `Ctrl+Shift+[` | `Cmd+Option+[` |
| Unfold Code Block | `Ctrl+Shift+]` | `Cmd+Option+]` |
| Quick Fix | `Ctrl+.` | `Cmd+.` |
| Rename Symbol | `F2` | `F2` |
| Peek Definition | `Alt+F12` | `Option+F12` |

---

## State Management Decision Tree (Quick Version)

```
Is state used by only 1 component?
  YES --> signal() in the component
  NO  --> Is it shared within a single feature?
    YES --> Simple (< 3 signals, no async)?
      YES --> Signal service (@Injectable)
      NO  --> SignalStore scoped to feature route
    NO  --> Is it app-wide?
      YES --> Global SignalStore (providedIn: 'root')
      NO  --> Pass via Input/Output
```

**For async data:**
- Simple GET, no mutations --> `resource()` in component
- Complex with CRUD --> SignalStore + `rxMethod` + `withEntities`
