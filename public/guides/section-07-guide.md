# Section 07: Custom Store Features (Composability)

**Duration:** ~30 minutes
**URL:** http://localhost:4200/order-builder
**Goal:** Show how `signalStoreFeature()` enables write-once, reuse-everywhere plugins and how the Order Builder composes four of them into a single store.

---

## Pre-Section Checklist

- [ ] App running at http://localhost:4200
- [ ] Logged in (username: `emilys`, password: `emilyspass`) so the Order Builder nav item is visible
- [ ] Editor open with these files ready in tabs:
  - `src/app/shared/store-features/with-loading.ts`
  - `src/app/shared/store-features/with-pagination.ts`
  - `src/app/shared/store-features/with-undo-redo.ts`
  - `src/app/shared/store-features/with-local-storage.ts`
  - `src/app/features/order-builder/store/order-builder.store.ts`
  - `src/app/features/order-builder/components/order-builder.component.ts`
  - `src/app/features/order-builder/order-builder.routes.ts`
  - `src/app/core/theme/theme.store.ts`
- [ ] Browser DevTools console open
- [ ] DevTools > Application > Local Storage visible (for the withLocalStorage demo)

---

## Opening (2 min)

**Say:** "So far every store we have built repeats the same loading, error, and pagination boilerplate. What if we could extract that into reusable plugins and snap them together like Lego bricks? That is exactly what `signalStoreFeature()` gives us. In this section we will build four custom features and then compose them all inside the Order Builder store."

**Quick audience poll:** "Raise your hand if you have ever copy-pasted loading/error state into more than two stores." (Most hands should go up.)

---

## Demo Flow

### Part 1: The Simplest Feature -- withLoading (5 min)

1. **Editor:** Open `src/app/shared/store-features/with-loading.ts`.
2. **Walk through the full file (37 lines).**
   - **Line 7:** `withLoading()` is a plain function that returns `signalStoreFeature(...)`.
   - **Lines 9-12:** `withState` adds `loading: false` and `error: null` to any store that composes this feature.
   - **Lines 13-17:** `withComputed` adds `hasError`, a convenience boolean derived from `error`.
   - **Lines 18-33:** `withMethods` adds `setLoading()`, `setLoaded()`, `setError(msg)`, and `clearError()`.
3. **Key teaching point:** "This is 37 lines total. Every store that composes `withLoading()` gets loading state, error state, computed flags, and mutation methods for free. Zero duplication."

### Part 2: Parameterized Feature -- withPagination (5 min)

1. **Editor:** Open `src/app/shared/store-features/with-pagination.ts`.
2. **Line 6:** Highlight the config parameter: `withPagination(config?: { pageSize?: number })`.
   - **Line 7:** Default page size is 20 when no config is passed.
3. **Lines 10-14:** `withState` adds `currentPage`, `pageSize`, and `totalItems`.
4. **Lines 15-31:** `withComputed` derives `totalPages`, `skip`, `hasNextPage`, `hasPrevPage`, and `paginationInfo`.
   - **Line 19:** Point out `skip` -- computed from `(currentPage - 1) * pageSize`. The store consumer never calculates this manually.
   - **Lines 22-31:** `paginationInfo` is a convenience computed that bundles page, pageSize, total, totalPages, and showing range into one object.
5. **Lines 33-56:** `withMethods` adds `nextPage()`, `prevPage()`, `goToPage()`, `setTotalItems()`, `resetPagination()`, and `setPageSize()`.
   - **Line 36:** `nextPage` uses `Math.min` to clamp, preventing navigation past the last page.
6. **Key teaching point:** "Parameterized features let you configure behavior per store. The Order Builder passes `{ pageSize: 10 }`, but another store could use `{ pageSize: 50 }`. Same feature, different tuning."

### Part 3: Generic Feature -- withUndoRedo (7 min)

1. **Editor:** Open `src/app/shared/store-features/with-undo-redo.ts`.
2. **Lines 8-9:** Highlight the generic signature: `withUndoRedo<State>(stateKeys)`. The caller specifies which state keys to track.
3. **Lines 15-17:** `withState` adds `_undoHistory` and `_redoFuture` as typed arrays. The underscore prefix signals "internal/private".
4. **Lines 19-24:** `withComputed` provides `canUndo`, `canRedo`, and `historyLength`.
5. **Lines 30-38:** `snapshot()` -- captures current values of tracked keys and pushes them onto `_undoHistory`. **Line 36:** History is capped at 50 entries with `.slice(-50)`. **Line 37:** Redo stack is cleared on any new action.
6. **Lines 40-53:** `undo()` -- pops the last entry from history, saves current state to redo, then patches the restored state.
7. **Lines 55-68:** `redo()` -- mirrors undo, popping from `_redoFuture` and pushing current state to `_undoHistory`.
8. **Lines 70-72:** `clearHistory()` resets both stacks.
9. **Key teaching point:** "The beauty is that `withUndoRedo` works with any state shape. You pass in the keys you care about and it handles the rest. The Order Builder tracks `selectedProducts` and `notes` but ignores `currentStep`."

### Part 4: Persistence Feature -- withLocalStorage (5 min)

1. **Editor:** Open `src/app/shared/store-features/with-local-storage.ts`.
2. **Lines 7-9:** `withLocalStorage(storageKey, keys)` takes a storage key string and an array of state keys to persist.
3. **Lines 13-20:** `_saveToStorage()` reads the specified signal values and writes them to `localStorage` as JSON. Errors (e.g., quota exceeded) are silently caught.
4. **Lines 22-29:** `_loadFromStorage()` reads and parses from `localStorage`, returning null on failure.
5. **Lines 33-52:** `withHooks` `onInit`:
   - **Lines 40-43:** Restores saved state immediately on store creation.
   - **Lines 47-51:** Sets up an `effect()` for each tracked key. When a tracked signal changes, `_saveToStorage()` runs automatically. `untracked()` on line 50 prevents the save from re-triggering the effect.
6. **Browser:** Open DevTools > Application > Local Storage. Look for `stockpilot-theme`.
7. **Editor:** Open `src/app/core/theme/theme.store.ts`, **line 19:** `withLocalStorage('stockpilot-theme', ['theme'])`.
8. **Browser:** Toggle the theme (sun/moon icon in toolbar). Watch the `stockpilot-theme` key update in Local Storage in real time.

> **Wow moment:** Refresh the page. The theme persists. "One line of code gave us full persistence with auto-save and auto-restore."

**Recovery:** If localStorage is not updating, hard-refresh (Ctrl+Shift+R) and check that the browser is not in incognito mode.

### Part 5: Composing Everything -- OrderBuilderStore (8 min)

1. **Editor:** Open `src/app/features/order-builder/store/order-builder.store.ts`.
2. **Lines 40-45:** `signalStore` with initial state: `currentStep: 0`, `selectedProducts: []`, `notes: ''`.
3. **Lines 51-53:** The composition lines:
   - `withLoading()` -- adds loading/error state and methods.
   - `withPagination({ pageSize: 10 })` -- adds pagination state tuned to 10 items per page.
   - `withUndoRedo<OrderBuilderState>(['selectedProducts', 'notes'])` -- tracks only order-related state for undo.
4. **Line 57:** `withEntities<Product>()` -- normalized entity storage for browseable products.
5. **Lines 59-69:** Custom `withComputed` adds `orderTotal`, `itemCount`, `canSubmit`, `steps`, and `isLastStep`.
6. **Lines 74-90:** `loadAvailableProducts` is an `rxMethod<void>` that uses `store.setLoading()` (from withLoading), `store.pageSize()` and `store.skip()` (from withPagination), and `store.setTotalItems()` (from withPagination). All from composed features.
7. **Lines 92-102:** `addToOrder` calls `store.snapshot()` (from withUndoRedo) before mutating. This is the key integration point.
8. **Lines 136-156:** `submitOrder` uses `exhaustMap` to prevent double-submit. On success, line 149 calls `store.clearHistory()` (from withUndoRedo).
9. **Editor:** Open `src/app/features/order-builder/order-builder.routes.ts`.
   - **Line 12:** `providers: [OrderBuilderStore]` -- feature-scoped, not `providedIn: 'root'`. Created on navigate, destroyed on leave.
10. **Browser:** Navigate to http://localhost:4200/order-builder.
    - Products load (withLoading shows progress bar, withPagination fetches page 1 of 10).
    - Click "Next" in pagination. New products load. Page indicator updates.
    - Add 2-3 products to the order. Notice the badge count on product cards.
    - Click the **Undo** button in the toolbar. The last product disappears from the order.

> **Wow moment:** Click Undo several times. Then click Redo. The products come back. "All of this undo/redo behavior came from composing a 75-line feature. Zero custom code in the component."

11. **Browser:** Click "Next: Review Order". Adjust a quantity. Click Undo. The quantity reverts.
12. **Browser:** Navigate away from Order Builder (click "Home" in sidenav), then navigate back. The order is gone.
    - "That is the feature-scoped store at work. A fresh instance every time you visit this route."

**Recovery:** If products do not load, check the browser console for API errors. The dummyjson.com API may be rate-limited. Wait a few seconds and refresh.

---

## Audience Interaction Points

1. **(After withLoading):** "What other cross-cutting concerns could you extract into a feature?" Expected answers: logging, optimistic updates, caching, analytics.
2. **(After withUndoRedo):** "Why do we cap the history at 50 snapshots on line 36 of with-undo-redo.ts?" Answer: memory management. Each snapshot is a copy of tracked state.
3. **(After composition demo):** "What would happen if we moved `withLoading()` below `withMethods()` in the store? Would `store.setLoading()` still work inside `loadAvailableProducts`?" Answer: No. Feature composition order matters. Later features can access earlier features, but not the reverse. This is noted in the comment on lines 49-50 of order-builder.store.ts.

---

## Common Questions & Answers

**Q: Can a feature depend on another feature?**
A: Yes, but the dependent feature must be composed after the one it depends on. For example, if a custom feature needs `setLoading()`, it must appear after `withLoading()` in the composition chain.

**Q: Can I test a feature in isolation?**
A: Yes. Create a minimal `signalStore(withState({...}), withLoading())` in a test file and exercise the methods directly. No component needed.

**Q: Why use `_` prefix for `_undoHistory` and `_redoFuture`?**
A: Convention to signal "internal state". These signals exist on the store but consumers should not read or mutate them directly. TypeScript does not enforce this, but the naming makes the intent clear.

**Q: Why is OrderBuilderStore feature-scoped instead of root?**
A: The order builder is a wizard with temporary state. When the user navigates away, the order-in-progress should be discarded. A root-scoped store would retain stale state across navigations. See `order-builder.routes.ts` line 12 where it is provided at the route level.

**Q: Does `withLocalStorage` work with SSR?**
A: Not out of the box. `localStorage` is a browser API. For SSR you would need to wrap the calls in an `isPlatformBrowser()` check or use a storage abstraction.

---

## Transition to Next Section

**Say:** "We have seen how to build reusable features and compose them into feature-scoped stores. But some state needs to live for the entire app lifetime and be accessible everywhere: authentication, permissions, notifications. In the next section we will look at global state with `providedIn: 'root'` and see how guards, interceptors, and the shell component all read from the same AuthStore."

---

## Section Cheat Sheet

| Concept | File | Line(s) | What to Show |
|---|---|---|---|
| `signalStoreFeature()` | `src/app/shared/store-features/with-loading.ts` | 7-36 | Reusable plugin pattern |
| Parameterized feature | `src/app/shared/store-features/with-pagination.ts` | 6-7 | `config?: { pageSize?: number }` |
| Computed derivations | `src/app/shared/store-features/with-pagination.ts` | 15-31 | `totalPages`, `skip`, `paginationInfo` |
| Generic feature | `src/app/shared/store-features/with-undo-redo.ts` | 8-9 | `<State>(stateKeys)` signature |
| History stacks | `src/app/shared/store-features/with-undo-redo.ts` | 15-17 | `_undoHistory`, `_redoFuture` |
| Snapshot before mutate | `src/app/features/order-builder/store/order-builder.store.ts` | 95 | `store.snapshot()` call |
| `withLocalStorage` | `src/app/shared/store-features/with-local-storage.ts` | 7-56 | Auto-save with `effect()` |
| `withLocalStorage` usage | `src/app/core/theme/theme.store.ts` | 19 | One-line persistence |
| Feature composition | `src/app/features/order-builder/store/order-builder.store.ts` | 51-53 | Three features composed |
| Cross-feature method calls | `src/app/features/order-builder/store/order-builder.store.ts` | 76-83 | `setLoading`, `pageSize`, `skip`, `setTotalItems` |
| Feature-scoped provider | `src/app/features/order-builder/order-builder.routes.ts` | 12 | `providers: [OrderBuilderStore]` |
| `exhaustMap` for submit | `src/app/features/order-builder/store/order-builder.store.ts` | 136-156 | Prevents double-submit |
| Undo/Redo in template | `src/app/features/order-builder/components/order-builder.component.ts` | 55-77 | Toolbar with undo/redo buttons |
| Pagination in template | `src/app/features/order-builder/components/order-builder.component.ts` | 161-172 | Page controls from withPagination |
