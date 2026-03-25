# Section 9: Store Architecture at Scale

## Duration: ~35 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/dashboard (must be logged in)
- [ ] VS Code open with the project
- [ ] User is authenticated (login first so the coordinator effect fires)

---

## Opening (2 min)

**Say:** "We have built individual stores for auth, inventory, orders, and notifications. Each one works well in isolation. But real apps have cross-cutting concerns. When a user logs in, we need to load inventory, load orders, push a notification, and log the event. How do we wire that up without turning our stores into spaghetti? This section is about architecture patterns that keep multi-store apps maintainable."

**Context bridge:** Section 8 covered global state with AuthStore and NotificationsStore. Now we zoom out and look at how stores talk to each other. The three patterns in this section (event-driven stores, mediator coordination, and aggregation stores) are the foundation of scalable signal-based architecture.

---

## Demo Flow

### Demo 1: Activity Log Store (~5 min)

**Open:** `src/app/core/activity-log/activity-log.models.ts`

- **Lines 1-3** - Read the CONCEPT comment aloud. ActivityEntry is a generic event record. It does not reference Product, Order, or User types directly. This keeps the activity log fully decoupled from feature stores.
- **Lines 4-19** - Walk through the interface. The `action` union type covers products, orders, and auth events, but the type itself is just a string union. There is no import of Product or Order models.

**Open:** `src/app/core/activity-log/activity-log.store.ts`

- **Lines 5-7** - CONCEPT comment: event-driven store. ActivityLogStore receives generic activity entries from other stores and services. It does not know about products, orders, or users. The producer decides what to log; the log just stores it.
- **Lines 11-13** - State is simple: an array of entries and a max cap. No domain knowledge here.
- **Lines 17-18** - CONCEPT: recentEntries is a computed slice. Consumers get a quick view without processing the full list.
- **Lines 21-22** - CONCEPT: entriesByAction groups entries by action type. The dashboard uses this to show activity breakdown counts.
- **Lines 34-36** - CONCEPT: the generic `log()` method. Other stores and services call `log()` to record events. The ActivityLogStore does not know about products or orders. It just receives generic activity entries. Full decoupling.
- **Lines 37-46** - Walk through the method body. It generates a UUID, stamps a timestamp, prepends to the array, and caps at maxEntries. Simple, focused, and domain-agnostic.

**Say:** "This store is intentionally dumb. It does not know what a product is or what an order is. It just records timestamped events with a description. The stores that produce events own the translation from their domain to an activity entry. That is the key to decoupling."

---

### Demo 2: Store Coordinator (~10 min)

This is the WOW MOMENT of the section.

**Open:** `src/app/core/coordination/store-coordinator.service.ts`

- **Lines 9-12** - Read the CONCEPT comment on the mediator pattern. When multiple stores need to react to the same event, a coordinator prevents circular dependencies and centralizes the workflow. Without this, Store A injects Store B injects Store C injects Store A, creating a circular dependency. The coordinator is the ONLY place that knows about cross-store workflows.
- **Lines 14-19** - Point out the five injected stores: AuthStore, InventoryStore, OrdersStore, NotificationsStore, ActivityLogStore. Say: "The coordinator is the one service allowed to know about all stores. Individual stores should NOT inject each other for workflow purposes."
- **Lines 22-25** - CONCEPT: effect() for cross-store coordination. This effect reacts to auth changes and triggers actions across multiple stores. This is a valid use of effect() because the reaction involves multiple external systems (other stores, notifications) that cannot be expressed as a single computed().
- **Lines 26-38** - Walk through the effect. It reads `user()` and `status()` from AuthStore. When the status becomes `authenticated` and a user exists, it calls `onLogin()`.
- **Lines 30-32** - CONCEPT: untracked(). Without untracked(), reading signals inside onLogin() would cause this effect to re-run when those signals change too. untracked() prevents additional signal dependencies from being created.

**Now show the payoff:**

- **Lines 43-45** - CONCEPT: cross-store orchestration. A single event (login) triggers actions across multiple independent stores. Each store stays focused on its own domain. The coordinator knows the sequence.
- **Lines 46-53** - Walk through onLogin() line by line:
  1. `this.inventoryStore.loadProducts()` - loads inventory
  2. `this.ordersStore.loadOrders()` - loads orders
  3. `this.notificationsStore.showSuccess(...)` - shows a welcome notification
  4. `this.activityLogStore.log(...)` - logs the login event

**WOW MOMENT:** In the browser, log out and log back in. Watch four things happen simultaneously: the inventory table populates, orders load, a notification toast appears, and the activity log gets an entry. Say: "One user action, four store reactions, zero circular dependencies. The coordinator makes this possible."

- **Lines 68-77** - Show `onProductChange()`. When a product is added, updated, or deleted, the coordinator logs it to the activity store. The InventoryStore calls this method but never imports ActivityLogStore directly.
- **Lines 80-86** - Show `onOrderStatusChange()`. Same pattern for orders.

**Say:** "The coordinator is the traffic cop. It listens for events and dispatches actions. No store needs to know about any other store's internal implementation. If tomorrow you add a new store that needs to react to login, you add one line here. Zero changes to existing stores."

---

### Demo 3: Dashboard Aggregation (~8 min)

**Open:** `src/app/features/dashboard/store/dashboard.store.ts`

- **Lines 21-23** - CONCEPT: aggregation store. DashboardStore has no domain data of its own (except todos and users). It derives everything from other stores. This is a common pattern for summary and reporting views. The store acts as a computed aggregation layer over existing data.
- **Lines 27-32** - The only state DashboardStore owns is `todosLoading`, `todos`, `usersLoading`, and `users`. Everything else is computed from injected stores.
- **Lines 35-39** - CONCEPT: store reads another store. Inject other stores directly in the withComputed factory. The computed signals track changes from both this store AND the injected stores. When an order status changes in OrdersStore, the dashboard's ordersByStatus computed signal updates automatically.
- **Lines 40-43** - Four stores injected: InventoryStore, OrdersStore, AuthStore, ActivityLogStore. The dashboard is a read-only aggregator over all of them.
- **Lines 45-78** - Walk through each computed signal:
  - `inventoryStats` (line 47) reads from InventoryStore
  - `lowStockProducts` (lines 48-53) filters InventoryStore entities
  - `ordersByStatus` (line 56) reads from OrdersStore
  - `totalRevenue` (line 57) reads from OrdersStore
  - `recentActivity` (line 61) reads from ActivityLogStore
  - `activityByAction` (line 62) reads from ActivityLogStore
  - `currentUser` (line 65) reads from AuthStore
  - `dashboardSummary` (lines 68-77) combines ALL of the above into one summary object

**Open:** `src/app/features/dashboard/dashboard.component.ts`

- **Lines 12-14** - CONCEPT: components never call API services directly. DashboardComponent injects only DashboardStore. All data (inventory stats, order metrics, activity logs, todos) flows through the store's computed signals.
- **Line 340** - The component has a single injection: `inject(DashboardStore)`. No API services, no other stores. One dependency.

**Say:** "The dashboard component has no idea where its data comes from. It reads signals from DashboardStore. The store aggregates from four other stores. Everything is reactive. If inventory changes, the dashboard updates. If an order moves to 'shipped', the status breakdown updates. No manual refresh needed."

---

### Demo 4: Cross-Store Reactivity (~5 min)

**Live demo in the browser:**

1. Start at http://localhost:4200/dashboard. Note the "Total Products" count and the activity log.
2. Navigate to http://localhost:4200/inventory.
3. Add a new product using the form.
4. Navigate back to http://localhost:4200/dashboard.
5. Observe: the "Total Products" count increased by one, the low stock table may have changed, and the activity log shows "Product [name] was added."

**Say:** "We did not write any code to connect inventory changes to the dashboard. DashboardStore reads from InventoryStore via computed signals. When InventoryStore.entities() changes, every computed that depends on it recalculates. This is the power of reactive signal composition."

**Open:** `src/app/features/dashboard/store/dashboard.store.ts`

- **Lines 119-122** - CONCEPT: store lifetime. DashboardStore is providedIn: 'root', so it lives forever. onInit fires once when the store is first injected. When the user navigates away from the dashboard, the store stays alive but its computed signals only recalculate when something reads them (lazy evaluation).

---

### Demo 5: Circular Dependency Prevention (~3 min)

**Open:** `src/app/features/inventory/store/inventory.store.ts`

- **Lines 145-149** - CONCEPT: circular dependency prevention. InventoryStore injects `Injector` instead of `StoreCoordinator` directly. StoreCoordinator injects InventoryStore, and if InventoryStore also injected StoreCoordinator at construction time, Angular would throw a circular dependency error. By using `injector.get(StoreCoordinator)` lazily inside method bodies, the resolution happens at call time when all stores are already constructed.
- **Line 255** - Show the actual lazy resolution: `injector.get(StoreCoordinator).onProductChange('product_added', created.title)`.

**Open:** `src/app/core/auth/auth.store.ts`

- **Lines 50-51** - Same pattern in AuthStore. StoreCoordinator injects AuthStore, so AuthStore uses Injector for lazy resolution.
- **Line 97** - `injector.get(StoreCoordinator).onLogout()` called before clearing state so the coordinator can still read the current user for logging.

**Say:** "There are two ways to break circular dependencies. First, use a mediator (the coordinator) so stores do not import each other. Second, when a store does need to call the coordinator, use lazy injection via Angular's Injector instead of direct constructor injection. Both techniques work together."

---

### Demo 6: Eager Initialization (~4 min)

**Open:** `src/app/core/layout/shell.component.ts`

- **Lines 218-222** - CONCEPT: eager initialization. The coordinator uses effect() in its constructor. We inject it in the shell to ensure it is created early, even if no component directly depends on it. Without this, the coordinator's effect() for login detection would not activate until some component happened to inject it.
- **Line 222** - `private coordinator = inject(StoreCoordinator)`. The variable is never read. The injection itself is the point: it forces Angular to instantiate the coordinator and start its effects.

**Say:** "This is a subtle but critical pattern. Services with effects in their constructors must be eagerly injected somewhere. The shell component is the perfect place because it loads on every page. Without this line, logging in would not trigger the coordinator, and nothing would load."

---

## Audience Interaction Points

1. **After Demo 1 (Activity Log):** "In your current apps, how do you handle cross-cutting logging? Is it scattered across components, or centralized?"
2. **After Demo 2 (Coordinator WOW MOMENT):** "How many stores or services currently react to your login event? How are they wired together?"
3. **After Demo 3 (Dashboard):** "Have you built dashboard views that aggregate data from multiple sources? How do you keep them in sync today?"
4. **After Demo 5 (Circular Dependencies):** "Has anyone hit a circular dependency error in Angular? What was your solution?"

---

## Common Questions & Answers

**Q: "Why not have InventoryStore directly inject ActivityLogStore?"**
A: You could, and it would work for simple cases. But as the number of cross-store interactions grows, you end up with a web of dependencies. The coordinator centralizes these workflows so you can see all cross-store logic in one file. It also prevents circular dependency chains.

**Q: "Does the coordinator become a god object?"**
A: If it grows too large, split it by domain. You could have an `InventoryCoordinator` and an `OrdersCoordinator`. The pattern stays the same; you just organize by feature. The key rule is: stores should not import each other for workflow orchestration.

**Q: "Why is DashboardStore providedIn: 'root' instead of scoped to the dashboard route?"**
A: Because other stores it reads from are also root-scoped. If DashboardStore were route-scoped, it would be destroyed and recreated on every navigation, losing its computed state. For aggregation stores over root-scoped data, root scope is the right choice.

**Q: "Does the coordinator pattern work with NgRx Store (the Redux-style one)?"**
A: Yes. In Redux-style NgRx, the equivalent is Effects that listen for actions from different feature slices. The mediator concept is the same; only the implementation differs.

**Q: "What if I need the coordinator to do async work?"**
A: The coordinator methods can be async, use rxMethod, or call store methods that are async. The coordinator itself is just an orchestrator. It delegates the actual work to each store.

---

## Transition to Next Section

**Say:** "We have covered the three architectural patterns for scaling signal-based apps: event-driven stores for decoupled logging, a mediator coordinator for cross-store workflows, and aggregation stores for read-only dashboards. In Section 10, we will look at migration strategies, anti-patterns to avoid, and a decision tree for choosing the right state approach for any situation."

**Action:** Stay on the dashboard page or navigate to the appropriate section 10 page.

---

## Section Cheat Sheet

| Pattern | Where to See It | File | Lines |
|---|---|---|---|
| Event-driven store (decoupled) | ActivityLogStore | `src/app/core/activity-log/activity-log.store.ts` | 5-7 |
| Generic event model | ActivityEntry interface | `src/app/core/activity-log/activity-log.models.ts` | 1-3 |
| Generic log method | log() accepts any entry | `src/app/core/activity-log/activity-log.store.ts` | 34-36 |
| Computed aggregation | recentEntries, entriesByAction | `src/app/core/activity-log/activity-log.store.ts` | 17-18, 21-22 |
| Mediator pattern | StoreCoordinator | `src/app/core/coordination/store-coordinator.service.ts` | 9-12 |
| Cross-store effect() | Login detection effect | `src/app/core/coordination/store-coordinator.service.ts` | 22-25 |
| untracked() usage | Prevent extra dependencies | `src/app/core/coordination/store-coordinator.service.ts` | 30-32 |
| Cross-store orchestration | onLogin triggers 4 stores | `src/app/core/coordination/store-coordinator.service.ts` | 43-45 |
| Aggregation store | DashboardStore | `src/app/features/dashboard/store/dashboard.store.ts` | 21-23 |
| Store reads another store | inject() in withComputed | `src/app/features/dashboard/store/dashboard.store.ts` | 35-39 |
| Lazy evaluation / lifetime | providedIn root + onInit | `src/app/features/dashboard/store/dashboard.store.ts` | 119-122 |
| Component reads only store | DashboardComponent | `src/app/features/dashboard/dashboard.component.ts` | 12-14 |
| Circular dep prevention | Injector for lazy resolution | `src/app/features/inventory/store/inventory.store.ts` | 145-149 |
| Eager initialization | Inject coordinator in shell | `src/app/core/layout/shell.component.ts` | 218-222 |
