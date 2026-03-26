# Section 09: Store Architecture at Scale

**Duration:** ~35 minutes
**URL:** http://localhost:4200/dashboard
**Goal:** Show how multiple SignalStores communicate through a mediator, how an event-driven activity log stays decoupled, and how an aggregation store pulls it all together on a dashboard.

---

## Pre-Section Checklist

- [ ] `ng serve` running at http://localhost:4200/
- [ ] Browser open and logged in (the dashboard is behind auth)
- [ ] DevTools Console open and free of errors
- [ ] Editor open with three folders expanded:
  - `src/app/core/activity-log/`
  - `src/app/core/coordination/`
  - `src/app/features/dashboard/store/`
- [ ] Products and orders already loaded (navigate to Inventory and Orders once before returning to Dashboard)

---

## Opening (2 min)

Navigate to http://localhost:4200/dashboard. Point at the four summary cards, the order breakdown, the activity feed, and the todo list.

> "Everything on this page comes from a different store. Inventory data, order data, auth data, activity logs, and even external API data for todos. No single store owns this view. So how does data flow between them, and who coordinates the workflows? That is what this section answers."

---

## Demo Flow

### Demo 1: The Event-Driven Activity Log Store (8 min)

**Editor:**

1. Open `src/app/core/activity-log/activity-log.models.ts`
   - **Lines 1-3**: Read the CONCEPT comment. The `ActivityEntry` interface does not import Product, Order, or User types. It is fully decoupled from feature domains.
   - **Lines 6-14**: The `action` union type uses generic string literals like `'product_added'` and `'order_status_changed'` rather than referencing domain enums.
   - **Lines 15-18**: The rest of the interface is generic: description, timestamp, userId, optional metadata.

2. Open `src/app/core/activity-log/activity-log.store.ts`
   - **Lines 5-7**: Read the CONCEPT comment about event-driven stores. The log does not know about products or orders. The producer decides what to log.
   - **Line 8**: `signalStore` with `providedIn: 'root'` on line 9. This store lives for the entire app lifetime.
   - **Lines 11-13**: `withState` holds just two fields: `entries` (an array) and `maxEntries` (a cap of 100).
   - **Lines 16-19**: `recentEntries` is a `computed()` that slices the first 20 entries. Consumers get a quick view without processing the full list.
   - **Lines 23-30**: `entriesByAction` is a `computed()` that groups entries by action type into a `Record<string, number>`. The dashboard uses this for the Activity Breakdown chips.
   - **Lines 37-45**: The `log()` method accepts a partial entry (without `id` or `timestamp`), stamps it with `crypto.randomUUID()` and `Date.now()`, then prepends it to the array while enforcing the `maxEntries` cap via `.slice(0, s.maxEntries)`.
   - **Lines 48-50**: `clear()` resets the entries to an empty array.

> **Wow moment:** "This store has 53 lines of code. It handles logging, capping, recent entries, and grouping by action type. And it has zero imports from any feature module. That is what decoupling looks like."

**Browser:**

1. On the Dashboard, look at the "Recent Activity" section. If you just logged in, you should see a "user_login" entry.
2. Navigate to Inventory, add or edit a product, then come back to the Dashboard. A new activity entry appears automatically.

### Demo 2: The Mediator Pattern with StoreCoordinator (10 min)

**Editor:**

1. Open `src/app/core/coordination/store-coordinator.service.ts`
   - **Lines 9-12**: Read the CONCEPT comment aloud. Without a coordinator, Store A injects Store B which injects Store C which injects Store A, creating a circular dependency. The coordinator is the only place that knows about cross-store workflows.
   - **Lines 14-19**: Five store injections in one place: `AuthStore`, `InventoryStore`, `OrdersStore`, `NotificationsStore`, `ActivityLogStore`. No feature store imports any other feature store.

2. Stay in the same file, focus on the constructor:
   - **Lines 21-38**: An `effect()` watches `this.authStore.user()` and `this.authStore.status()`. When the status becomes `'authenticated'` and the user exists, it calls `this.onLogin(user)`.
   - **Lines 30-32**: Read the CONCEPT comment about `untracked()`. Without it, reading signals inside `onLogin()` would register additional dependencies, causing the effect to re-run when those signals change.
   - **Line 33**: `untracked(() => { ... })` wraps the conditional logic. Only `user()` and `status()` drive re-execution.

3. Walk through the `onLogin` method:
   - **Lines 42-53**: A single event (login) triggers four actions across four stores:
     - `this.inventoryStore.loadProducts()` (line 46)
     - `this.ordersStore.loadOrders()` (line 47)
     - `this.notificationsStore.showSuccess(...)` (line 48)
     - `this.activityLogStore.log(...)` (lines 49-53)

4. Walk through `onLogout`, `onProductChange`, and `onOrderStatusChange`:
   - **Lines 57-65**: `onLogout()` logs the event before auth state is cleared.
   - **Lines 68-77**: `onProductChange()` receives a generic action string and a product title, then logs it.
   - **Lines 80-86**: `onOrderStatusChange()` logs when an order moves between statuses.

5. Show the eager initialization in the shell:
   - Open `src/app/core/layout/shell.component.ts`
   - **Lines 228-232**: Read the CONCEPT comment. The coordinator is injected in the shell component so its constructor runs early. Without this, the `effect()` for login detection would not activate until some other component happened to inject it.

> **Wow moment:** "Delete this one line (line 232), and the entire cross-store workflow stops working. No products load on login, no activity gets logged, no welcome notification appears. That is how critical eager initialization is for mediator services."

**Browser:**

1. Log out (if logged in), then log back in.
2. Watch the Dashboard populate: summary cards fill in, the activity feed shows "user_login", and the welcome notification appears.
3. Navigate to Orders, drag an order to a different status column, then return to the Dashboard. The activity feed shows the status change.

6. Show how auth.store.ts calls the coordinator on logout:
   - Open `src/app/core/auth/auth.store.ts`
   - **Lines 95-97**: The CONCEPT comment explains why the coordinator is called BEFORE clearing state: so it can still read the current user for logging.
   - **Line 97**: `injector.get(StoreCoordinator).onLogout()` is called, then `patchState` clears auth data on lines 98-103.

### Demo 3: The Aggregation Store (12 min)

**Editor:**

1. Open `src/app/features/dashboard/store/dashboard.store.ts`
   - **Lines 21-23**: Read the CONCEPT comment. DashboardStore has almost no domain data of its own. It derives everything from other stores. This is the aggregation pattern for summary/reporting views.
   - **Lines 27-32**: `withState` holds only `todosLoading`, `todos`, `usersLoading`, and `users`. These are the only pieces of data the dashboard "owns." Everything else is derived.

2. Focus on the `withComputed` block:
   - **Lines 34-78**: This is where the magic happens. Four stores are injected at lines 40-43:
     - `inject(InventoryStore)` (line 40)
     - `inject(OrdersStore)` (line 41)
     - `inject(AuthStore)` (line 42)
     - `inject(ActivityLogStore)` (line 43)
   - **Line 47**: `inventoryStats` reads from `inventoryStore.stats()`.
   - **Lines 48-53**: `lowStockProducts` filters inventory entities where stock is between 1 and 10.
   - **Lines 56-58**: `ordersByStatus`, `totalRevenue`, `totalOrders` all read from `ordersStore`.
   - **Lines 61-62**: `recentActivity` and `activityByAction` read from `activityLogStore`.
   - **Line 65**: `currentUser` reads from `authStore`.
   - **Lines 68-77**: `dashboardSummary` is the "super-computed" that combines data from all four stores into one object. When any upstream store changes, this signal recalculates automatically.

> **Wow moment:** "Look at line 68-77. This single computed signal aggregates data from four different stores. No subscriptions, no manual refresh, no event listeners. Change an order status in the Orders page, and when you come back to the Dashboard, the numbers are already correct."

3. Walk through the `withMethods` block:
   - **Lines 81-117**: `loadTodos` and `loadUsers` are `rxMethod<void>` calls that fetch from external APIs (`/todos` and `/users`). These are the only pieces of state the dashboard owns outright.

4. Show the lifecycle hook:
   - **Lines 123-128**: `withHooks` with `onInit` calls both `loadTodos()` and `loadUsers()`. Since this store is `providedIn: 'root'`, `onInit` fires once on first injection and never again.

5. Open `src/app/features/dashboard/dashboard.component.ts`
   - **Line 348**: `store = inject(DashboardStore)`. The component injects exactly one store.
   - **Lines 36-91**: The summary cards row reads `store.dashboardSummary().totalProducts`, `totalOrders`, `totalRevenue`, and `lowStockCount`.
   - **Lines 94-151**: Two-column grid shows "Orders by Status" (using a helper at lines 351-358) and "Low Stock Products" table.
   - **Lines 154-216**: The second two-column grid shows "Recent Activity" feed and "Pending Todos."
   - **Lines 219-237**: Activity Breakdown chips render `store.activityByAction()` with icons for each action type.

> "The component is 386 lines, but almost all of it is template and styling. The actual logic is a single store injection and a few helper methods. The component does not know about InventoryStore, OrdersStore, or ActivityLogStore. It only talks to DashboardStore."

**Browser:**

1. On the Dashboard, verify all four summary cards show data.
2. Check the "Orders by Status" section: it should show counts for new, processing, shipped, and delivered.
3. Check the "Low Stock Products" table: products with stock between 1 and 10 appear here.
4. Check "Recent Activity": it should show login events and any product/order changes you made during the demos.
5. Check "Activity Breakdown": the chips should show counts per action type (e.g., "User Login: 1", "Product Added: 2").

---

## Audience Interaction Points

| When | What to Ask |
|------|-------------|
| After Demo 1 | "Why is it better for the activity log to not import Product or Order models? What happens when you rename a field on the Product type?" |
| After Demo 2 | "What would happen if InventoryStore imported OrdersStore directly, and OrdersStore imported InventoryStore? How would you solve that without a mediator?" |
| After Demo 2 (untracked) | "Can someone explain what would go wrong if we removed the `untracked()` wrapper on line 33?" (Answer: reading signals inside `onLogin` would register extra dependencies, causing the effect to re-run on those signals too.) |
| After Demo 3 | "If the product team asks for a new dashboard widget showing 'orders created this week,' which store would you modify and which would you leave untouched?" |

---

## Common Questions & Answers

| Question | Answer |
|----------|--------|
| "Why not just inject all the stores directly into the component?" | You could, and for a small app it works. But the DashboardStore acts as a stable API. If OrdersStore changes its internal shape, you update DashboardStore once, not every component that consumes order data. |
| "Does the coordinator create tight coupling?" | It centralizes knowledge of cross-store workflows, which is a form of coupling. But the alternative (stores importing each other) creates circular dependencies. The coordinator is a controlled coupling point with clear boundaries. |
| "Why use `effect()` in the coordinator instead of calling `onLogin` directly from AuthStore?" | AuthStore should not know about inventory, orders, or notifications. If it did, adding a new post-login action would require editing AuthStore. The coordinator isolates that concern. |
| "What if the activity log grows to thousands of entries?" | The `maxEntries: 100` cap on line 13 of the activity log store prevents that. The `log()` method enforces the cap on every write (line 44). For production, you would also persist to a backend and paginate. |
| "Is `providedIn: 'root'` on the DashboardStore wasteful if the user never visits the dashboard?" | The store is tree-shakable. It only gets instantiated when something first injects it. If the user never navigates to the dashboard route, the store never initializes and its `onInit` hook never fires. |

---

## Transition to Next Section

> "We have now built a complete store architecture: feature stores for inventory and orders, a global auth store, a reusable notification store, an event-driven activity log, a mediator for cross-store workflows, and an aggregation store for the dashboard. In the final section, we will step back and ask: how do you migrate existing code to this architecture, what are the common anti-patterns to avoid, and how do you decide which approach to use for any given piece of state?"

Navigate to the section 10 content or open the spec document.

---

## Section Cheat Sheet

| Concept | File | Line(s) | What to Show |
|---------|------|---------|--------------|
| Event-driven store (CONCEPT) | `src/app/core/activity-log/activity-log.store.ts` | 5-7 | CONCEPT comment about decoupling |
| ActivityEntry interface | `src/app/core/activity-log/activity-log.models.ts` | 4-19 | Generic action union type, no domain imports |
| Activity log state | `src/app/core/activity-log/activity-log.store.ts` | 11-13 | `entries` array and `maxEntries` cap |
| recentEntries computed | `src/app/core/activity-log/activity-log.store.ts` | 19 | `.slice(0, 20)` for quick view |
| entriesByAction computed | `src/app/core/activity-log/activity-log.store.ts` | 23-30 | Grouping by action type into Record |
| log() method with capping | `src/app/core/activity-log/activity-log.store.ts` | 37-45 | UUID stamping and maxEntries enforcement |
| Mediator Pattern (CONCEPT) | `src/app/core/coordination/store-coordinator.service.ts` | 9-12 | CONCEPT comment about preventing circular deps |
| All store injections | `src/app/core/coordination/store-coordinator.service.ts` | 14-19 | Five stores injected in one place |
| effect() for auth watching | `src/app/core/coordination/store-coordinator.service.ts` | 21-38 | Cross-store effect with untracked() |
| untracked() usage | `src/app/core/coordination/store-coordinator.service.ts` | 33 | Prevents extra signal dependencies |
| onLogin orchestration | `src/app/core/coordination/store-coordinator.service.ts` | 42-53 | Four stores triggered by one event |
| onLogout flow | `src/app/core/coordination/store-coordinator.service.ts` | 57-65 | Logging before state cleanup |
| onProductChange | `src/app/core/coordination/store-coordinator.service.ts` | 68-77 | Generic action + product title logging |
| onOrderStatusChange | `src/app/core/coordination/store-coordinator.service.ts` | 80-86 | Order status change logging |
| Eager initialization | `src/app/core/layout/shell.component.ts` | 228-232 | Coordinator injected in shell for early activation |
| Coordinator call before cleanup | `src/app/core/auth/auth.store.ts` | 95-97 | onLogout() before patchState clears user |
| Aggregation Store (CONCEPT) | `src/app/features/dashboard/store/dashboard.store.ts` | 21-23 | CONCEPT comment about derived-only store |
| DashboardStore own state | `src/app/features/dashboard/store/dashboard.store.ts` | 27-32 | Only todos and users are owned |
| Four store injections | `src/app/features/dashboard/store/dashboard.store.ts` | 40-43 | inject() calls inside withComputed |
| dashboardSummary super-computed | `src/app/features/dashboard/store/dashboard.store.ts` | 68-77 | Combines four stores into one signal |
| rxMethod for external APIs | `src/app/features/dashboard/store/dashboard.store.ts` | 81-117 | loadTodos and loadUsers |
| withHooks onInit | `src/app/features/dashboard/store/dashboard.store.ts` | 123-128 | Auto-load on first injection |
| Component single injection | `src/app/features/dashboard/dashboard.component.ts` | 348 | `store = inject(DashboardStore)` |
| Summary cards template | `src/app/features/dashboard/dashboard.component.ts` | 36-91 | Four summary cards reading dashboardSummary |
| Activity feed template | `src/app/features/dashboard/dashboard.component.ts` | 154-216 | Recent activity and todos columns |
| Activity breakdown chips | `src/app/features/dashboard/dashboard.component.ts` | 219-237 | Chips from activityByAction |

---

## Recovery Steps

| Problem | Fix |
|---------|-----|
| Dashboard shows all zeros | Make sure you are logged in. The coordinator loads products and orders on login. Navigate to Inventory and Orders first, then return to Dashboard. |
| "Recent Activity" is empty | Log out and log back in. The login event should appear. Then add a product or move an order to generate more entries. |
| Activity Breakdown chips do not appear | Perform a few actions (add a product, change an order status) to populate the activity log. The chips only render when `activityByAction()` has entries. |
| Dashboard is blank / route not found | Verify the route is configured in `src/app/app.routes.ts`. The dashboard route requires authentication. |
| Products/orders not loading on login | Check that `src/app/core/layout/shell.component.ts` line 232 still has the coordinator injection. Without it, the effect in the coordinator constructor never activates. |
| "Low Stock Products" table is empty | This depends on the mock data. If no products have stock between 1 and 10, the table will show "No low stock products." This is expected behavior. |
| Console error about circular dependency | If you accidentally imported a feature store into another feature store, revert the change. All cross-store communication must go through the coordinator at `src/app/core/coordination/store-coordinator.service.ts`. |
