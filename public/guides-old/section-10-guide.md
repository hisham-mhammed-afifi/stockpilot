# Section 10: Migration, Anti-Patterns & Decision Making

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200
- [ ] VS Code open with the project
- [ ] All previous sections completed (attendees should be familiar with InventoryStore, OrdersStore, AuthStore, ThemeStore, and the coordinator pattern)

---

## Opening (2 min)

**Say:** "You now know how to build signal-based stores, coordinate them, and compose custom features. But most of you are not starting from scratch. You have existing apps with BehaviorSubjects, manual subscriptions, and patterns you have used for years. This section is about bridging that gap: how to migrate incrementally, what mistakes to avoid, and how to decide which pattern fits each situation."

**Context bridge:** Sections 1 through 9 focused on building new code with SignalStore. This section flips the perspective: how do you adopt these patterns in an existing codebase? We will cover a BehaviorSubject-to-SignalStore migration, walk through eight common anti-patterns, and use a decision tree to choose the right state approach.

**Note to presenter:** The legacy demo files (`src/app/features/legacy/`) are planned but may not yet be implemented in the codebase. If those files are not available, use the existing project stores as "after" examples and describe the "before" pattern verbally or on a whiteboard. The concepts are the same either way.

---

## Demo Flow

### Demo 1: BehaviorSubject vs SignalStore (~8 min)

This demo shows a side-by-side comparison of the old approach (BehaviorSubject-based service) versus the modern approach (SignalStore).

**If `src/app/features/legacy/product-legacy.service.ts` exists, open it.** Otherwise, describe the BehaviorSubject pattern verbally:

A traditional BehaviorSubject-based service looks like this:
- A private `BehaviorSubject<Theme>` with an initial value
- A public `theme$` observable exposed via `.asObservable()`
- Manual subscription management in every consuming component
- Manual `localStorage.getItem()` and `setItem()` calls scattered through methods
- `ngOnDestroy` with `subscription.unsubscribe()` in every component that subscribes

**Now show the real "after" example:**

**Open:** `src/app/core/theme/theme.store.ts`

- **Lines 5-7** - CONCEPT: previously this was an @Injectable class with raw signals. Now it is a SignalStore that composes withLocalStorage() for automatic theme persistence. Zero manual localStorage code in this file.
- **Lines 9-18** - The entire store: state, localStorage integration, computed signals, methods, and lifecycle hooks. All in one composable declaration.
- **Line 19** - `withLocalStorage('stockpilot-theme', ['theme'])` replaces all manual localStorage read/write logic. One line. Write once, reuse everywhere.
- **Lines 21-37** - Computed signals `isDark` and `icon`. In BehaviorSubject world, these would be separate observables with `pipe(map(...))` and a risk of multiple subscriptions causing duplicate work.
- **Lines 40-54** - Methods use `patchState()`. No `this.themeSubject.next()`, no spread operator boilerplate.
- **Lines 59-66** - The effect() in onInit syncs the body class. In BehaviorSubject world, this would be a subscription you must remember to unsubscribe.

**Say:** "Count what disappeared: no BehaviorSubject, no asObservable(), no subscribe(), no unsubscribe(), no manual localStorage calls, no pipe(map(...)). The signal-based version is shorter, safer, and composes better."

**Migration mapping table** (draw on screen or present as a slide):

| BehaviorSubject Pattern | SignalStore Equivalent |
|---|---|
| `private subject = new BehaviorSubject(init)` | `withState({ ... })` |
| `subject.asObservable()` | `store.mySignal()` (direct signal read) |
| `subject.pipe(map(...))` | `withComputed(() => computed(...))` |
| `subject.next(value)` | `patchState(store, { ... })` |
| `combineLatest([a$, b$]).pipe(map(...))` | `computed(() => f(a(), b()))` |
| `subscribe()` + `unsubscribe()` | Template reads signal directly, no cleanup |
| Manual localStorage read/write | `withLocalStorage(key, fields)` |
| `ngOnDestroy` cleanup | Not needed for root stores; automatic for scoped stores |

---

### Demo 2: Migration Cheat Sheet (~5 min)

Walk through the incremental migration strategy. The key principle is: you do not have to migrate everything at once. BehaviorSubject services and SignalStores can coexist.

**Step 1: Wrap existing observables with toSignal()**

Say: "If you have a BehaviorSubject service that works, do not rewrite it immediately. Wrap its observables with `toSignal()` in the consuming component. This gives you signal-based reads without changing the service."

**Step 2: Convert simple services first**

**Open:** `src/app/core/theme/theme.store.ts`

Say: "ThemeStore is the perfect first migration candidate. It has simple state (one field), one computed, two methods. No async. No entity management. Start with stores like this."

**Step 3: Migrate services with HTTP calls**

**Open:** `src/app/core/auth/auth.store.ts`

- **Lines 56-92** - Show the login rxMethod. Say: "BehaviorSubject services with HTTP calls typically have `subscribe()` inside methods. Replace those with `rxMethod()` and `tapResponse()`. The HTTP logic stays the same; only the wrapper changes."
- **Lines 178-188** - Show the effect() for token persistence. Say: "This replaces a pattern where you manually call `localStorage.setItem()` after every method that changes the token."

**Step 4: Add entity management last**

**Open:** `src/app/features/inventory/store/inventory.store.ts`

- **Lines 79-83** - `withEntities<Product>()`. Say: "Entity management is the most advanced step. Migrate to it only after your basic state and methods are working with SignalStore. The addEntity/updateEntity/removeEntity operations replace manual array manipulation."

**Say:** "The golden rule of migration: one service at a time, starting with the simplest. Run both patterns side by side. Do not try a big-bang rewrite."

---

### Demo 3: Anti-Patterns Gallery (~10 min)

Walk through eight common mistakes. For each one, show the wrong way and the right way using real code from the project.

**Anti-Pattern 1: Using effect() for derived state**

Wrong: Using `effect()` to watch a signal and write to another signal.
```typescript
// BAD: effect() to derive filtered products
effect(() => {
  this.filteredProducts.set(
    this.products().filter(p => p.stock > 0)
  );
});
```

Right: Use `computed()`.

**Open:** `src/app/features/inventory/store/inventory.store.ts`

- **Lines 89-107** - `filteredProducts` is a computed signal. It automatically recalculates when `entities()` or `filters()` change. No effect needed. No timing issues. No extra signal writes.
- **Lines 128-139** - `stats` is another computed. It aggregates entity data. Using effect() here would create an unnecessary write cycle: read entities, write stats, trigger change detection again.

**Say:** "If your effect() reads signal A and writes to signal B, replace it with a computed. Computed signals are synchronous, glitch-free, and lazy. Effects are for side effects: DOM manipulation, localStorage, logging, HTTP calls."

---

**Anti-Pattern 2: Forgetting untracked() in effects**

Wrong: Reading signals inside an effect that should not trigger re-runs.

**Open:** `src/app/core/coordination/store-coordinator.service.ts`

- **Lines 30-32** - CONCEPT: untracked(). Without it, reading signals inside `onLogin()` would register them as dependencies, causing the effect to re-run when inventory or orders data changes. That would trigger `onLogin()` again, creating an infinite loop.

**Say:** "When your effect needs to call methods that read other signals, wrap those calls in untracked(). Otherwise, every signal touched inside the effect becomes a trigger."

---

**Anti-Pattern 3: Mutating state directly**

Wrong: `store.filters().search = 'laptop'` or `store.entities().push(newProduct)`.

Right: Always use patchState().

**Open:** `src/app/features/inventory/store/inventory.store.ts`

- **Lines 156-161** - `setFilters()` uses `patchState()` with the function form. It spreads the existing filters and merges the partial update. The state is replaced immutably.

**Say:** "Signals hold references. If you mutate the object inside a signal, change detection will not see the change because the reference did not change. Always create new objects via patchState()."

---

**Anti-Pattern 4: Over-globalizing state**

Wrong: Making every store `providedIn: 'root'` even when only one route uses it.

Right: Use route-level providers for feature-scoped state.

**Say:** "In StockPilot, AuthStore and ThemeStore are root-scoped because they are needed everywhere. InventoryStore is also root-scoped because the dashboard aggregates its data. But if you had a store only used by one lazy-loaded route, provide it at the route level so it is created and destroyed with the route."

---

**Anti-Pattern 5: Calling APIs directly from components**

Wrong: Injecting HttpClient in a component and making API calls.

**Open:** `src/app/features/home/product-list-bad.component.ts`

- **Lines 10-12** - CONCEPT: fetching data directly in a component via HttpClient. No service, no store, no caching. Every mount triggers a new HTTP call.
- **Lines 66-68** - `HttpClient` injected directly into the component.
- **Lines 87-101** - The `fetchProducts()` method. Raw HTTP call, manual loading state, manual error handling. All inside a component.

Now show the correct approach:

**Open:** `src/app/features/inventory/components/inventory-list.component.ts`

- **Lines 18** - The component injects only `InventoryStore`. No HttpClient, no API service.
- **Lines 43-45** - CONCEPT: the entire template reads signals from the store. No business logic lives in the component. It is purely presentational.

**Say:** "Components should be thin. They read signals, call store methods, and render templates. All data fetching, caching, error handling, and business logic lives in the store or a service."

---

**Anti-Pattern 6: Not handling loading and error states**

Wrong: Calling an API and only handling the success case.

Right: Track loading, error, and data as separate state fields.

**Open:** `src/app/core/auth/auth.store.ts`

- **Lines 16-22** - AuthState includes `status` (idle, loading, authenticated, error) and `errorMessage`. Every state transition is explicit.
- **Lines 58-59** - Before the HTTP call: `patchState(store, { status: 'loading', errorMessage: null })`.
- **Lines 82-86** - On error: `patchState(store, { status: 'error', errorMessage: ... })`.

**Say:** "Every async operation needs three states: loading, success, error. If you skip loading, users see stale data. If you skip error, failures are silent. Make them explicit in your state shape."

---

**Anti-Pattern 7: One mega store for the entire app**

Wrong: A single `AppStore` with products, orders, auth, theme, notifications, and activity log all in one withState().

Right: Separate stores per domain with a coordinator for cross-cutting concerns.

**Say:** "StockPilot has six stores: AuthStore, ThemeStore, NotificationsStore, ActivityLogStore, InventoryStore, and OrdersStore. Plus a DashboardStore that aggregates. Each one owns exactly one domain. The StoreCoordinator handles cross-cutting workflows. If any store grows too large, you split it further."

Show the project structure:

- `src/app/core/auth/auth.store.ts` - Authentication
- `src/app/core/theme/theme.store.ts` - Theme preference
- `src/app/core/notifications/notifications.store.ts` - Notifications
- `src/app/core/activity-log/activity-log.store.ts` - Activity logging
- `src/app/features/inventory/store/inventory.store.ts` - Inventory management
- `src/app/features/orders/store/orders.store.ts` - Order management
- `src/app/features/dashboard/store/dashboard.store.ts` - Dashboard aggregation
- `src/app/core/coordination/store-coordinator.service.ts` - Cross-store orchestration

**Say:** "Eight files, each under 200 lines. Compare that to a single 1500-line AppStore. Which one would you rather debug at 2 AM?"

---

**Anti-Pattern 8: Circular store dependencies**

Wrong: InventoryStore injects OrdersStore which injects InventoryStore.

Right: Use the mediator pattern or lazy injection.

**Open:** `src/app/features/inventory/store/inventory.store.ts`

- **Lines 145-149** - InventoryStore uses `inject(Injector)` and resolves StoreCoordinator lazily via `injector.get(StoreCoordinator)` at call time. This breaks the circular chain.

**Open:** `src/app/core/coordination/store-coordinator.service.ts`

- **Lines 9-12** - The mediator pattern. Stores never import each other for workflow purposes. The coordinator is the only service that knows about all stores.

**Say:** "Two rules: stores should not import each other, and when a store needs to trigger a cross-cutting workflow, it calls the coordinator. If a store must reference the coordinator, use lazy injection via Injector."

---

### Demo 4: Decision Tree (~5 min)

Present the decision flowchart for choosing the right state approach. Walk through it with the audience.

**Decision tree:**

1. **Is the state used by only one component?**
   - Yes: Use a local `signal()` in the component. Example: `isMobile` in `src/app/core/layout/shell.component.ts` line 227.
   - No: Continue.

2. **Is it shared between a parent and its direct children?**
   - Yes: Use `@Input()` and `@Output()`. Keep it simple.
   - No: Continue.

3. **Is it shared across sibling components or unrelated routes?**
   - Yes: Use a SignalStore. Continue to step 4.
   - No: Re-evaluate. It might still be local state.

4. **Is it needed by the entire app (auth, theme, notifications)?**
   - Yes: Use `providedIn: 'root'`. Examples: AuthStore, ThemeStore, NotificationsStore.
   - No: Provide it at the route level for feature-scoped state.

5. **Does it manage a collection of entities?**
   - Yes: Use `withEntities()`. Example: InventoryStore.
   - No: Use plain `withState()`. Example: ThemeStore.

6. **Does it involve HTTP calls?**
   - Yes: Use `rxMethod()` with `tapResponse()`. Example: AuthStore login.
   - No: Use synchronous `patchState()`. Example: ThemeStore toggleTheme.

7. **Do multiple stores need to react to the same event?**
   - Yes: Use a StoreCoordinator (mediator pattern). Example: login triggers inventory + orders + notifications + activity log.
   - No: Keep the logic in the individual store.

**Say:** "Print this tree and tape it to your monitor for the first month. After that, it becomes second nature."

---

### Demo 5: Architecture Recap (~2 min)

Pull up the full project structure and connect the dots from all ten sections.

**Say:** "Let us trace a single user journey through the entire architecture."

1. User opens the app. **ShellComponent** (`src/app/core/layout/shell.component.ts`) injects ThemeStore, AuthStore, NotificationsStore, and StoreCoordinator (eager initialization, lines 218-222).
2. User clicks Login. **AuthStore** (`src/app/core/auth/auth.store.ts`) fires `login()` rxMethod with exhaustMap (line 56).
3. Login succeeds. AuthStore patches state to `authenticated` (line 75). The **StoreCoordinator** (`src/app/core/coordination/store-coordinator.service.ts`) effect detects the change (lines 26-38) and calls `onLogin()`.
4. `onLogin()` loads inventory, loads orders, shows a notification, and logs the event (lines 46-53).
5. User navigates to Dashboard. **DashboardStore** (`src/app/features/dashboard/store/dashboard.store.ts`) aggregates data from all four stores via computed signals (lines 45-78).
6. User adds a product in Inventory. **InventoryStore** (`src/app/features/inventory/store/inventory.store.ts`) calls `addEntity()` (line 248) and notifies the coordinator (line 255). The dashboard's computed signals update automatically.
7. User returns to Dashboard. The numbers are already updated. No refresh needed.

**Say:** "Signals, stores, computed aggregation, mediator coordination. That is the full picture. You have all the tools you need."

---

## Audience Interaction Points

1. **After Demo 1 (BehaviorSubject vs SignalStore):** "How many BehaviorSubject services do you have in your current project? Which one would be the easiest to migrate first?"
2. **After Demo 3 (Anti-Patterns):** "Which of these eight anti-patterns have you seen in your own codebase? Which one surprised you the most?"
3. **After Demo 4 (Decision Tree):** "Think about a feature you are building right now. Walk through the decision tree. Where does it land?"
4. **Final question:** "What is the first thing you will change in your codebase when you get back to work?"

---

## Common Questions & Answers

**Q: "Do I have to migrate all my BehaviorSubject services at once?"**
A: No. Migrate incrementally, one service at a time. BehaviorSubjects and SignalStores coexist happily. Use `toSignal()` to bridge existing observables into the signal world. Start with the simplest service and work up to complex ones.

**Q: "Is SignalStore stable enough for production?"**
A: Yes. SignalStore is part of the official @ngrx/signals package and has been stable since NgRx 17. It is actively maintained and used in production by many teams.

**Q: "What about server-side rendering (SSR)?"**
A: SignalStore works with SSR. Signals are synchronous, so there are no subscription timing issues. Be careful with `effect()` that touches browser APIs (localStorage, window) as those are unavailable on the server. Use `afterNextRender()` or `isPlatformBrowser()` guards.

**Q: "How do I test a SignalStore?"**
A: Inject the store in a test using `TestBed`. Call its methods and assert on its signals. For stores with rxMethod, use the `provideMockActions()` pattern or test the store in integration with a mock API service. Computed signals can be tested by setting up the initial state and asserting the derived values.

**Q: "Should I use NgRx Store (Redux-style) or SignalStore?"**
A: If your team already uses NgRx Store and has established patterns, keep using it. For new projects or teams that find Redux boilerplate excessive, SignalStore is lighter and more Angular-native. Both are maintained by the NgRx team. Choose based on team preference and existing investment.

---

## Transition / Workshop Closing

**Say:** "That is the complete StockPilot workshop. You have gone from understanding why state management matters, through Angular signals, SignalStore basics, entity management, async patterns, custom features, global state, store architecture at scale, and now migration strategies. The code is all in the repo. Clone it, experiment with it, break it, rebuild it. The best way to learn these patterns is to apply them to your own projects. Start small, migrate one service, and build from there."

---

## Section Cheat Sheet

| Topic | Where to See It | File | Lines |
|---|---|---|---|
| Signal-based store (simple) | ThemeStore "after" example | `src/app/core/theme/theme.store.ts` | 5-7, 19 |
| withLocalStorage composition | Replaces manual localStorage | `src/app/core/theme/theme.store.ts` | 19 |
| rxMethod migration | HTTP calls in stores | `src/app/core/auth/auth.store.ts` | 56-92 |
| effect() for persistence | Token saved to sessionStorage | `src/app/core/auth/auth.store.ts` | 178-188 |
| withEntities (advanced) | Normalized product collection | `src/app/features/inventory/store/inventory.store.ts` | 79-83 |
| Anti-pattern: effect for derivation | Correct: computed signals | `src/app/features/inventory/store/inventory.store.ts` | 89-107, 128-139 |
| Anti-pattern: untracked missing | Correct: untracked in coordinator | `src/app/core/coordination/store-coordinator.service.ts` | 30-32 |
| Anti-pattern: API in component | Bad example | `src/app/features/home/product-list-bad.component.ts` | 10-12, 66-68 |
| Anti-pattern: API in component | Good example | `src/app/features/inventory/components/inventory-list.component.ts` | 18 |
| Anti-pattern: no error states | Correct: explicit status field | `src/app/core/auth/auth.store.ts` | 16-22 |
| Anti-pattern: mega store | Correct: separate stores per domain | Project-wide (6 stores + 1 aggregation + 1 coordinator) | - |
| Anti-pattern: circular deps | Correct: lazy Injector resolution | `src/app/features/inventory/store/inventory.store.ts` | 145-149 |
| Eager initialization | Coordinator in shell | `src/app/core/layout/shell.component.ts` | 218-222 |
| Local signal (decision tree) | isMobile in ShellComponent | `src/app/core/layout/shell.component.ts` | 227 |
