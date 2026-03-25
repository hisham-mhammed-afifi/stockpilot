# Section 7: Custom Store Features (Composability)

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/order-builder
- [ ] VS Code open with the project
- [ ] Logged in (features behind authGuard require authentication)

---

## Opening (2 min)

**Say:** "So far we have been building stores that own all their state, computed signals, and methods from scratch. But what happens when you need the same loading/error pattern in five different stores? Or the same pagination logic in three list views? You copy-paste. In this section, we stop copy-pasting and start composing."

**Context bridge:** In Sections 3 through 6, attendees built stores with `withState`, `withComputed`, `withMethods`, and `rxMethod`. They have seen the boilerplate repeat across stores: loading flags, error handling, pagination math. This section introduces `signalStoreFeature()` to extract that boilerplate into reusable building blocks, then composes them all together in a real multi-step order builder.

---

## Demo Flow

### Demo 1: withLoading() Feature (~5 min)

**Open:** `src/app/shared/store-features/with-loading.ts`

Walk through the reusable loading feature:

- **Lines 4-6** - CONCEPT comment on `signalStoreFeature()`. Read it aloud: "Creates a reusable plugin that can be added to ANY SignalStore via composition. Write once, use in every store." Stress that this is the key insight of the section.
- **Lines 9-12** - The state added by this feature: `loading: false` and `error: null`. Every store that composes `withLoading()` gets these two signals automatically.
- **Lines 14-15** - CONCEPT on computed signals. `hasError` is a convenience boolean derived from `error`. Templates can use `store.hasError()` instead of `store.error() !== null`.
- **Lines 19-21** - CONCEPT on feature methods. `setLoading()`, `setLoaded()`, `setError()`, and `clearError()` become part of any consuming store. Any `rxMethod` in the consuming store can call `store.setLoading()` directly.

**Say:** "This is 36 lines of code. Without it, every store would have its own loading boolean, its own error string, its own setLoading method. That is boilerplate that adds up fast. Now let us see a parameterized version."

---

### Demo 2: withPagination() Feature (~5 min)

**Open:** `src/app/shared/store-features/with-pagination.ts`

- **Lines 4-5** - CONCEPT on parameterized features. `withPagination({ pageSize: 10 })` vs `withPagination({ pageSize: 50 })`. The feature accepts a configuration object, making it flexible across different list views.
- **Lines 6-7** - The config parameter with a default: `config?.pageSize ?? 20`. If no config is provided, the default page size is 20.
- **Lines 10-14** - Three base state signals: `currentPage`, `pageSize`, `totalItems`. Everything else is derived.
- **Lines 17-18** - CONCEPT on computed derived values. All pagination math (`totalPages`, `skip`, `hasNextPage`, `hasPrevPage`, `paginationInfo`) is derived from just three base signals. Change `currentPage` and everything recalculates automatically.
- **Lines 33-56** - Methods: `nextPage()`, `prevPage()`, `goToPage()`, `setTotalItems()`, `resetPagination()`, `setPageSize()`. Any store that composes `withPagination()` gets all six methods for free.

**Say:** "Three signals in, six computed values and six methods out. Any store that needs pagination just adds `withPagination()` and gets the full pagination toolkit. No copy-paste, no reimplementation."

---

### Demo 3: withUndoRedo() Feature (~8 min)

**Open:** `src/app/shared/store-features/with-undo-redo.ts`

- **Lines 4-7** - CONCEPT on generic undo/redo. Read aloud: "Works with any state shape. The feature maintains a history stack and a future stack." Point out the generic type parameter: `withUndoRedo<MyState>(['fieldA', 'fieldB'])` tracks only the specified keys.
- **Lines 8-9** - The function signature: `withUndoRedo<State extends Record<string, unknown>>(stateKeys: (keyof State)[])`. The caller decides which keys to track.
- **Lines 12-14** - Internal state: `_undoHistory` and `_redoFuture` arrays. The underscore prefix signals these are internal. They hold partial snapshots of the tracked state keys.
- **Lines 17-18** - CONCEPT on computed: `canUndo` and `canRedo` drive button enabled/disabled state in the template. `historyLength` can be used for badges.
- **Lines 24-26** - CONCEPT on the snapshot architecture. Call `snapshot()` BEFORE making a change. The history stack grows. `undo()` pops from history into redo. `redo()` does the inverse.
- **Line 33** - The history is capped at 50 snapshots (`.slice(-50)`) to prevent memory leaks.
- **Line 34** - New actions clear the redo stack (`_redoFuture: []`). This is standard undo/redo behavior.
- **Lines 67-69** - `clearHistory()` resets both stacks. Used after submitting an order to start fresh.

**WOW MOMENT:** In the browser at http://localhost:4200/order-builder, add two or three products to the order. Then click the Undo button in the toolbar. Watch the products disappear one by one. Click Redo and they come back. Say: "This is a generic feature. It works with any state shape. You could add it to an inventory editor, a form builder, a drawing tool. Write once, undo everywhere."

---

### Demo 4: withLocalStorage() Feature (~4 min)

**Open:** `src/app/shared/store-features/with-local-storage.ts`

- **Lines 4-6** - CONCEPT on the persistence pattern. Read aloud: "Automatically saves/restores state to localStorage. Combined with withHooks, it loads saved state on init and saves on every change."
- **Lines 7-9** - The function signature: `withLocalStorage(storageKey, keys)`. The caller specifies the localStorage key and which state fields to persist.
- **Lines 12-29** - Two private methods: `_saveToStorage()` iterates over tracked keys and writes to localStorage. `_loadFromStorage()` reads and parses from localStorage. Both have try/catch for safety.
- **Lines 31-32** - CONCEPT on `withHooks`. `onInit` runs once when the store is first injected. This is where we restore persisted state.
- **Lines 36-38** - On init, load saved state and patch it into the store.
- **Lines 40-42** - CONCEPT on `effect()` for auto-save. Each tracked key gets its own `effect()`. When the signal changes, `untracked()` prevents circular dependency while saving.

**Open:** `src/app/core/theme/theme.store.ts`

- **Lines 5-7** - CONCEPT comment: this was previously an `@Injectable` class with manual localStorage code. Now it composes `withLocalStorage()` and has zero manual persistence logic.
- **Lines 16-18** - CONCEPT: this single line (`withLocalStorage('stockpilot-theme', ['theme'])`) replaces all manual read/write logic.
- **Lines 22-23** - CONCEPT on computed: `isDark` resolves the `'system'` value to the OS preference.
- **Lines 57-58** - CONCEPT on `withHooks`: `effect()` syncs the `dark-theme` / `light-theme` CSS class on the body element.

**Say:** "Toggle the theme in the toolbar, then refresh the page. The theme persists. All of that behavior comes from one line: `withLocalStorage('stockpilot-theme', ['theme'])`."

---

### Demo 5: Feature Composition (~5 min)

**Open:** `src/app/features/order-builder/store/order-builder.store.ts`

This is the payoff. Show how one store composes all four features together:

- **Lines 22-24** - CONCEPT on feature-scoped store. This store is NOT `providedIn: 'root'`. It is provided at the route level and destroyed when the user navigates away.
- **Lines 47-50** - CONCEPT on composing features. Read aloud: "This store uses 3 reusable features. Each adds state, computed signals, and methods without any duplication. Feature composition order matters."
- **Lines 51-53** - The three feature calls in sequence: `withLoading()`, `withPagination({ pageSize: 10 })`, `withUndoRedo<OrderBuilderState>(['selectedProducts', 'notes'])`. Point out the parameterization and the generic type.
- **Lines 55-57** - CONCEPT on `withEntities`. Normalized storage for the products the user can browse and add to their order.
- **Lines 72-73** - CONCEPT on `rxMethod` with `switchMap`. The `loadAvailableProducts` method uses `store.setLoading()` from `withLoading` and `store.pageSize()` / `store.skip()` from `withPagination`. Features compose seamlessly.
- **Lines 93-94** - CONCEPT on `snapshot()` before mutations. Before adding a product to the order, the store saves a snapshot for undo.
- **Lines 134-135** - CONCEPT on `exhaustMap` for submit. Prevents double-ordering on rapid clicks.
- **Line 149** - After successful submit: `store.clearHistory()` from `withUndoRedo`.

**Say:** "This one store has loading indicators, pagination, undo/redo, entities, and complex async flows. But the store file itself is clean and readable because all the boilerplate lives in reusable features."

---

### Demo 6: Feature-Scoped Store Lifecycle (~3 min)

**Open:** `src/app/features/order-builder/order-builder.routes.ts`

- **Lines 9-12** - The CONCEPT comment and `providers: [OrderBuilderStore]`. The store is provided at the route level. Angular creates a fresh instance on each navigation and destroys it when the user leaves.

**Open:** `src/app/features/order-builder/components/order-builder.component.ts`

- **Lines 44-45** - CONCEPT on feature-scoped store injection. The component injects `OrderBuilderStore` which is provided by the route, not by root.
- **Lines 110-111** - CONCEPT on `@switch` control flow. Angular 19's `@switch` replaces `ngSwitch` directive for rendering different wizard steps.
- **Lines 152-153** - CONCEPT on pagination controls. `nextPage()`, `prevPage()`, `hasNextPage()`, `hasPrevPage()` all come from the `withPagination()` feature.
- **Lines 502-504** - CONCEPT on architecture. The component delegates all state management to the store. No local state for business logic.

**In the browser:** Add a few products to an order at http://localhost:4200/order-builder. Then navigate away (click any other link in the sidenav). Navigate back to /order-builder. The order is empty, the store is fresh. Say: "This is the feature-scoped lifecycle. The store was destroyed when you left and recreated when you came back. Compare this with the inventory store, which persists for the entire app session."

---

## Audience Interaction Points

1. **After Demo 1 (withLoading):** "How many stores in your current project have their own loading boolean and error string? How much copy-paste would a withLoading() feature eliminate?"
2. **After Demo 3 (withUndoRedo):** "Which features in your app would benefit from undo/redo? Form editors? Data tables? Drawing tools?"
3. **After Demo 5 (Composition):** "Look at the OrderBuilderStore. Can you identify which methods come from which feature? How would you test each feature in isolation?"
4. **After Demo 6 (Lifecycle):** "When should you use feature-scoped stores vs. root-provided stores? What are the trade-offs?"

---

## Common Questions & Answers

**Q: "Can features depend on each other?"**
A: Yes, but composition order matters. Later features can access state and methods from earlier features. For example, `withMethods` can call `store.setLoading()` only if `withLoading()` appears earlier in the composition chain. If you reverse the order, TypeScript will report a compile error.

**Q: "Can I unit test a feature in isolation?"**
A: Yes. Create a minimal test store that composes only the feature under test: `const TestStore = signalStore(withState({ ... }), withLoading())`. Then inject it in a test and call its methods directly.

**Q: "What if two features define the same state key?"**
A: TypeScript catches this at compile time. If `withLoading()` adds `loading` and another feature also adds `loading`, you get a type error. This is one of the advantages of the strongly typed composition model.

**Q: "Why not just use inheritance or mixins?"**
A: Features compose horizontally, not vertically. There is no diamond problem, no `super()` chains, no fragile base class issues. Each feature is a pure function that returns a store fragment. The composition is explicit and visible in the store definition.

**Q: "Is feature-scoped vs. root-provided a per-feature decision?"**
A: Yes. Ask yourself: does this state need to survive navigation? If yes, use `providedIn: 'root'`. If the state should reset on each visit (like a wizard or form), provide it at the route level.

---

## Transition to Next Section

**Say:** "We have built reusable features and composed them into a feature-scoped store. But some state must live longer than a single route. Auth tokens, user profiles, permissions, notification queues. In Section 8, we tackle global state: stores that live for the entire app lifetime and are consumed by guards, interceptors, and components across every route."

**Action:** Navigate to http://localhost:4200/login to set up the next section's demo.

---

## Section Cheat Sheet

| Concept | Where to See It | File | Lines |
|---|---|---|---|
| signalStoreFeature composition | withLoading reusable plugin | `src/app/shared/store-features/with-loading.ts` | 4-6 |
| Computed in features | hasError derived boolean | `src/app/shared/store-features/with-loading.ts` | 14-15 |
| Feature methods | setLoading/setLoaded/setError | `src/app/shared/store-features/with-loading.ts` | 19-21 |
| Parameterized features | withPagination config | `src/app/shared/store-features/with-pagination.ts` | 4-5 |
| Computed derived values | totalPages, skip, hasNextPage | `src/app/shared/store-features/with-pagination.ts` | 17-18 |
| Generic undo/redo | History and future stacks | `src/app/shared/store-features/with-undo-redo.ts` | 4-7 |
| canUndo/canRedo computed | Button enabled/disabled | `src/app/shared/store-features/with-undo-redo.ts` | 17-18 |
| Snapshot architecture | snapshot() before mutations | `src/app/shared/store-features/with-undo-redo.ts` | 24-26 |
| Persistence pattern | withLocalStorage feature | `src/app/shared/store-features/with-local-storage.ts` | 4-6 |
| withHooks onInit | Restore persisted state | `src/app/shared/store-features/with-local-storage.ts` | 31-32 |
| effect() auto-save | Signal-driven persistence | `src/app/shared/store-features/with-local-storage.ts` | 40-42 |
| Feature-scoped store | Route-level provider | `src/app/features/order-builder/store/order-builder.store.ts` | 22-24 |
| Composing 3 features | withLoading + withPagination + withUndoRedo | `src/app/features/order-builder/store/order-builder.store.ts` | 47-50 |
| withEntities for products | Normalized entity storage | `src/app/features/order-builder/store/order-builder.store.ts` | 55-57 |
| rxMethod with exhaustMap | Prevent double-submit | `src/app/features/order-builder/store/order-builder.store.ts` | 134-135 |
| snapshot() before mutation | Save state for undo | `src/app/features/order-builder/store/order-builder.store.ts` | 93-94 |
| withLocalStorage in ThemeStore | Zero manual persistence | `src/app/core/theme/theme.store.ts` | 5-7, 16-18 |
| Route-level providers | Feature-scoped lifecycle | `src/app/features/order-builder/order-builder.routes.ts` | 9-12 |
| @switch control flow | Multi-step wizard | `src/app/features/order-builder/components/order-builder.component.ts` | 110-111 |
| Component delegates to store | No direct API calls | `src/app/features/order-builder/components/order-builder.component.ts` | 502-504 |
