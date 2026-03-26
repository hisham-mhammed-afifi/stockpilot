# Section 10: Migration, Anti-Patterns & Decision Making

**Duration:** ~30 minutes
**URL:** N/A (conceptual section, no dedicated route)
**Goal:** Teach the audience how to migrate BehaviorSubject services to SignalStore, recognize the eight most common anti-patterns, and use a decision tree to pick the right state management approach for any given scenario.

**Important:** This section is conceptual. The legacy/ folder does not exist in this project. Code examples come from the section spec at `docs/sections/section-10-migration-patterns.md`. The presenter walks through those snippets and contrasts them with the real SignalStore implementations built in previous sections.

---

## Pre-Section Checklist

- [ ] `ng serve` running at http://localhost:4200/
- [ ] Editor open with the spec document: `docs/sections/section-10-migration-patterns.md`
- [ ] Editor tabs ready for the "good pattern" files:
  - `src/app/features/inventory/store/inventory.store.ts`
  - `src/app/features/orders/store/orders.store.ts`
  - `src/app/features/order-builder/store/order-builder.store.ts`
  - `src/app/core/auth/auth.store.ts`
  - `src/app/shared/store-features/with-loading.ts`
  - `src/app/features/dashboard/store/dashboard.store.ts`
  - `src/app/core/coordination/store-coordinator.service.ts`
- [ ] Browser on the Dashboard (http://localhost:4200/dashboard) to use as a visual reference of the finished architecture
- [ ] Whiteboard or screen-share drawing tool ready for the decision tree

---

## Opening (2 min)

Stay on the Dashboard or switch to the editor showing the full project tree.

> "Over the last eight sections, we built a full state management architecture from scratch: signals, SignalStore, entities, async methods, custom features, global state, and cross-store coordination. Now the question every team faces: how do you get here from where you are today? Most Angular apps have BehaviorSubject services, some have classic NgRx, and many have a mix of both. This section gives you a concrete migration playbook, a gallery of mistakes to avoid, and a decision tree for choosing the right approach."

---

## Demo Flow

### Demo 1: BehaviorSubject to SignalStore Migration (10 min)

**Editor - show the "before" code from the spec:**

1. Open `docs/sections/section-10-migration-patterns.md`
   - Scroll to the `ProductLegacyService` code block (spec lines 25-98).
   - Walk through the pain points:
     - **Spec lines 31-33**: Three separate `BehaviorSubject` instances for products, loading, and error. Each one needs its own `.asObservable()` exposure.
     - **Spec lines 37-39**: Exposing as Observables with `this.productsSubject.asObservable()`. This is boilerplate.
     - **Spec lines 42-47**: `combineLatest` for derived state (`selectedProduct$`). Manually combining two subjects and piping through `map`.
     - **Spec lines 56-72**: `loadProducts()` sets loading, subscribes to HTTP, calls `.next()` in both success and error callbacks, and needs `takeUntilDestroyed` for cleanup.
     - **Spec line 96**: Deleting a product requires `this.productsSubject.next(this.productsSubject.value.filter(...))`. Manual array manipulation with imperative `.next()`.

> "Count the moving parts: four BehaviorSubjects, three Observable exposures, one combineLatest, manual takeUntilDestroyed, and imperative .next() calls everywhere. This is 98 lines for basic CRUD state."

**Editor - show the "after" code from the spec, then the real project files:**

2. Scroll to `ProductMigratedStore` in the spec (spec lines 106-170).
   - **Spec lines 107-112**: `withState` replaces all four BehaviorSubjects with a single state declaration.
   - **Spec lines 114-120**: `withComputed` replaces `combineLatest` + `map` with a `computed()` for `selectedProduct` and `productCount`.
   - **Spec lines 127-139**: `rxMethod<void>` replaces manual HTTP subscription with `tapResponse`. No `takeUntilDestroyed` needed.
   - **Spec lines 158-162**: `deleteProduct` uses `patchState` with a filter. No `.next()`, no `.value` access.

3. Now show a real example from the project. Open `src/app/features/inventory/store/inventory.store.ts`
   - Point out that this is the production version of the same pattern: `withEntities`, `withComputed`, `withMethods` using `rxMethod`, and `withHooks`.
   - This file is the "after" that the migration produces.

4. Show the migration cheat sheet (from spec lines 201-208). Read through the mapping table:

   | BehaviorSubject Pattern | SignalStore Equivalent |
   |---|---|
   | `new BehaviorSubject(value)` | `withState({ key: value })` |
   | `.asObservable()` | `store.key()` (auto-exposed as signal) |
   | `.pipe(map(...))` / `combineLatest` | `withComputed(() => computed(...))` |
   | `.next(value)` | `patchState(store, { key: value })` |
   | `.subscribe()` + `takeUntilDestroyed` | `rxMethod(pipe(...))` |
   | Manual loading/error flags | `withLoading()` custom feature |

5. Open `src/app/shared/store-features/with-loading.ts` as the real example of that last row.
   - **Lines 7-36**: The entire `withLoading()` feature is 36 lines. It provides `loading`, `error`, `hasError`, `setLoading`, `setLoaded`, `setError`, and `clearError`. Any store composes it with a single function call.

> **Wow moment:** "The migration strategy is not 'rewrite everything on a weekend.' It is: pick one BehaviorSubject service, create a parallel SignalStore with the same API, update the components, delete the old service. Feature by feature, at your own pace."

### Demo 2: Anti-Patterns Gallery (10 min)

Walk through the eight anti-patterns from the spec (spec lines 219-275). For each one, show the bad code from the spec and then point to the real project file that demonstrates the correct approach.

**Anti-pattern 1: "effect() for state derivation"**

- Bad (spec lines 222-224): Using `effect()` to set a signal based on other signals.
- Good: Use `computed()`. Show `src/app/core/activity-log/activity-log.store.ts` lines 16-30 as a real example of computed signals deriving state.
- Explain: `effect()` creates an unnecessary write cycle. `computed()` is synchronous and glitch-free.

**Anti-pattern 2: "Everything in global state"**

- Bad (spec lines 231-232): Storing form validation state in a global store.
- Good: Keep UI state in the component. Show `src/app/features/inventory/components/inventory-form.component.ts` as an example where form state stays local to the component while inventory data lives in the store.

**Anti-pattern 3: "Subscribing to set signals"**

- Bad (spec lines 238-239): `this.service.data$.subscribe(data => this.data.set(data))`.
- Good: Use `toSignal()`. The project uses `rxMethod` instead of manual subscriptions throughout. Show `src/app/features/orders/store/orders.store.ts` as an example of `rxMethod` handling the Observable-to-state bridge cleanly.

**Anti-pattern 4: "Mutating signal values"**

- Bad (spec lines 246-247): `this.items().push(newItem)` mutates the array in place.
- Good: Use immutable updates. Show `src/app/core/activity-log/activity-log.store.ts` line 43-44: `patchState(store, (s) => ({ entries: [fullEntry, ...s.entries].slice(0, s.maxEntries) }))`. Always create a new array.

**Anti-pattern 5: "Calling APIs from components"**

- Bad (spec lines 253-254): Component injects `HttpClient` directly.
- Good: Component calls store, store calls API. Show `src/app/features/dashboard/dashboard.component.ts` line 348: the component injects only `DashboardStore`, never `HttpClient` or `ApiService`.

**Anti-pattern 6: "Storing derived data in state"**

- Bad (spec lines 260-261): `patchState(store, { filteredProducts: products.filter(...) })`.
- Good: Use `computed()`. Show `src/app/features/dashboard/store/dashboard.store.ts` lines 48-53: `lowStockProducts` is a computed signal that filters inventory entities. It is never stored in state.

**Anti-pattern 7: "One mega store"**

- Bad (spec lines 267-268): A single `AppStore` with auth, products, orders, theme, and notifications all in one place.
- Good: Separate stores per feature, coordinate via mediator. Show `src/app/core/coordination/store-coordinator.service.ts` lines 14-19 as the coordination point between five independent stores.

**Anti-pattern 8: "Nested objects in entity state"**

- Bad (spec lines 272-273): Orders containing deeply nested product arrays.
- Good: Normalize with separate entity collections. Show `src/app/features/order-builder/store/order-builder.store.ts` which uses `withEntities` for a flat entity collection rather than deeply nesting related data.

> **Wow moment:** "Every one of these anti-patterns was someone's reasonable first attempt. The difference between a 'works but fragile' app and a 'works and scales' app is recognizing these patterns early."

### Demo 3: The Decision Tree (8 min)

Draw or display the decision tree from the spec (spec lines 282-294). Walk through each branch with real examples from the project:

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

Map each leaf to a real file in the project:

| Decision | Example from this project |
|---|---|
| signal() in component | Form fields in `src/app/features/inventory/components/inventory-form.component.ts` |
| SignalStore scoped to feature | `src/app/features/order-builder/store/order-builder.store.ts` |
| Global SignalStore | `src/app/core/auth/auth.store.ts` (providedIn: 'root') |
| SignalStore with rxMethod + withEntities | `src/app/features/inventory/store/inventory.store.ts` |
| Aggregation store | `src/app/features/dashboard/store/dashboard.store.ts` |
| Mediator for cross-store | `src/app/core/coordination/store-coordinator.service.ts` |

> "The default should always be the simplest option. Start with a signal in the component. Promote to a store only when you need sharing, persistence, or complex async. Do not reach for a global store until the data truly is global."

Walk through the "Why migrate?" and "When NOT to migrate" concepts from the spec (spec lines 360-371):

- **Why migrate:** Signals are synchronous (no timing bugs), glitch-free (no intermediate invalid states), auto-tracked, and leak-proof.
- **When NOT to migrate:** Keep RxJS for WebSocket streams, complex async coordination with retry/backoff, and libraries that require Observables. Do not migrate for the sake of migrating.

---

## Audience Interaction Points

| When | What to Ask |
|------|-------------|
| After the migration mapping table | "Who has a BehaviorSubject service in their current project? Can you estimate how many subjects it has?" |
| After Anti-pattern 1 | "Has anyone used effect() to sync derived state? What happened when the dependency graph got complicated?" |
| After Anti-pattern 7 | "What is the largest single store or service you have worked with? How many responsibilities did it have?" |
| After the decision tree | "Pick one piece of state from your current project. Walk through the decision tree. Where does it land?" |
| Closing | "What is the first thing you will change in your codebase on Monday?" |

---

## Common Questions & Answers

| Question | Answer |
|----------|--------|
| "Can I use SignalStore and BehaviorSubject services side by side during migration?" | Yes. That is the recommended approach. Create the SignalStore in parallel, migrate components one at a time, and delete the old service when nothing references it. The two can coexist indefinitely. |
| "What about classic NgRx Store (actions/reducers/effects)?" | The migration path is similar. Replace reducers with `withState` + `patchState`, replace selectors with `withComputed`, replace effects with `rxMethod`, and replace actions with direct method calls. The NgRx team considers SignalStore the future direction. |
| "Is computed() really glitch-free? What if I read two signals that update at different times?" | Computed signals use a push/pull algorithm. When a dependency changes, the computed is marked dirty but not recalculated until something reads it. By the time the template reads it, all upstream signals have settled. There are no intermediate states. |
| "When would I still use full NgRx Store instead of SignalStore?" | For apps that need action replay (time-travel debugging), strict action logging for audit trails, or complex undo/redo based on action history. For most apps, SignalStore covers the use cases with less ceremony. |
| "How do I handle optimistic updates during migration?" | The same way as in SignalStore: update state first, send the HTTP request, and roll back on error. The `tapResponse` operator in `rxMethod` makes the error path explicit. |
| "Should I migrate all at once or feature by feature?" | Feature by feature, always. Pick the simplest service first to build confidence, then tackle the complex ones. Never attempt a "big bang" rewrite. |

---

## Workshop Closing (5 min)

> "Let's recap what we built over these ten sections."

Walk through the architecture by opening each key file:

1. **The problem** (Section 01): Prop drilling, event bubbling, duplicate HTTP calls.
2. **Signals foundation** (Section 02): `signal()`, `computed()`, `effect()`.
3. **Component state** (Section 03): Signals in components for local UI state.
4. **SignalStore core** (Section 04): `withState`, `withComputed`, `withMethods`, `patchState`.
5. **Entities and CRUD** (Section 05): `withEntities` for normalized collections -- `src/app/features/inventory/store/inventory.store.ts`.
6. **Async side effects** (Section 06): `rxMethod` with `tapResponse` -- `src/app/features/orders/store/orders.store.ts`.
7. **Custom features** (Section 07): `signalStoreFeature()` for reuse -- `src/app/shared/store-features/with-loading.ts`.
8. **Global state** (Section 08): `providedIn: 'root'` for auth and notifications -- `src/app/core/auth/auth.store.ts`.
9. **Store architecture** (Section 09): Mediator, event-driven log, aggregation store -- `src/app/core/coordination/store-coordinator.service.ts` and `src/app/features/dashboard/store/dashboard.store.ts`.
10. **Migration and decisions** (Section 10): Migration playbook, anti-patterns, decision tree.

> "The architecture we built is not theoretical. It runs right here at localhost:4200. Every pattern we discussed has a working implementation you can reference. Take the decision tree back to your team, pick one BehaviorSubject service, and start migrating. That is the best next step."

---

## Section Cheat Sheet

| Concept | Reference | What to Show |
|---------|-----------|--------------|
| BehaviorSubject legacy pattern | `docs/sections/section-10-migration-patterns.md` lines 25-98 | ProductLegacyService code block |
| SignalStore migrated equivalent | `docs/sections/section-10-migration-patterns.md` lines 106-170 | ProductMigratedStore code block |
| Migration mapping table | `docs/sections/section-10-migration-patterns.md` lines 201-208 | BehaviorSubject to SignalStore row-by-row |
| Real inventory store (migration "after") | `src/app/features/inventory/store/inventory.store.ts` | Full SignalStore with entities and rxMethod |
| Real orders store (rxMethod patterns) | `src/app/features/orders/store/orders.store.ts` | rxMethod with tapResponse |
| Real order builder (composed features) | `src/app/features/order-builder/store/order-builder.store.ts` | withEntities for flat entity collections |
| Real auth store (global state) | `src/app/core/auth/auth.store.ts` | providedIn: 'root' pattern |
| Reusable withLoading feature | `src/app/shared/store-features/with-loading.ts` lines 7-36 | signalStoreFeature replacing manual loading flags |
| Real aggregation store | `src/app/features/dashboard/store/dashboard.store.ts` lines 34-78 | Four stores injected in withComputed |
| Real mediator | `src/app/core/coordination/store-coordinator.service.ts` lines 14-19 | Five stores coordinated from one service |
| Anti-pattern 1: effect for derivation | `docs/sections/section-10-migration-patterns.md` lines 222-227 | Bad effect() vs good computed() |
| Anti-pattern 4: mutating signals | `src/app/core/activity-log/activity-log.store.ts` lines 43-44 | Immutable array update with spread + slice |
| Anti-pattern 5: API calls in components | `src/app/features/dashboard/dashboard.component.ts` line 348 | Component injects only the store |
| Anti-pattern 6: derived data in state | `src/app/features/dashboard/store/dashboard.store.ts` lines 48-53 | lowStockProducts as computed, not state |
| Anti-pattern 7: one mega store | `src/app/core/coordination/store-coordinator.service.ts` lines 9-12 | Mediator pattern CONCEPT comment |
| Decision tree | `docs/sections/section-10-migration-patterns.md` lines 282-294 | Interactive flowchart for state approach |
| Migration strategy | `docs/sections/section-10-migration-patterns.md` lines 343-348 | Feature-by-feature migration steps |
| When to migrate / when not to | `docs/sections/section-10-migration-patterns.md` lines 360-371 | Keep RxJS for WebSockets, complex async |

---

## Recovery Steps

| Problem | Fix |
|---------|-----|
| Spec file not found | Verify `docs/sections/section-10-migration-patterns.md` exists. If deleted, restore from git: `git checkout -- docs/sections/section-10-migration-patterns.md`. |
| Cannot show "good pattern" files | All referenced files are in the main project. If inventory store is missing, check `src/app/features/inventory/store/inventory.store.ts`. If any store file is missing, run `git status` to check for uncommitted deletions. |
| Audience asks for a live migration demo | You can live-code it by creating a temporary BehaviorSubject service and converting it step by step. Use the mapping table from the spec as your guide. Delete the temporary files after the demo. |
| Audience asks about NgRx Store (classic) migration | Refer to the spec's teaching notes (spec lines 342-384). The mapping is: reducers to withState + patchState, selectors to withComputed, effects to rxMethod, actions to direct method calls. |
| Dashboard not loading for architecture recap | Ensure you are logged in. The dashboard route requires authentication. If data is stale, log out and back in to trigger the coordinator's onLogin flow. |
| Questions about performance of computed across stores | Explain that computed signals are lazy: they only recalculate when read. If the dashboard is not on screen, its computed signals do not recalculate even when upstream stores change. |
