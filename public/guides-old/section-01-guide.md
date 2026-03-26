# Section 1: The Problem - Why State Management Matters

## Duration: ~20 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200
- [ ] VS Code open with the project
- [ ] Terminal visible for running Angular CLI

---

## Opening (2 min)

**Say:** "Before we write a single line of state management code, we need to feel the pain of not having it. This section is about understanding why tools like SignalStore exist, by looking at what goes wrong without them."

**Context bridge:** This is the first section of the workshop. Set the stage: every Angular app starts simple, but as it grows, unmanaged state becomes the number one source of bugs, duplicated logic, and wasted network calls. By the end of this section, attendees will recognize these anti-patterns in their own codebases.

---

## Demo Flow

### Demo 1: The App Shell (~3 min)

**Open:** `src/app/core/layout/shell.component.ts`

Walk through the overall application structure:

- **Lines 41-120** - The toolbar template with sidenav, theme toggle, notifications badge, and user menu. Point out that all of these depend on shared state (theme, auth, notifications) that multiple components need access to.
- **Lines 229-237** - The `navItems` array. Note that some items have `requiresAuth: true`, which means the sidebar itself needs to know the current auth state.
- **Lines 215-222** - Three stores are injected directly: `ThemeStore`, `AuthStore`, `NotificationsStore`. Tell the audience: "By the end of this workshop, you will understand how each of these stores works and why they are structured this way."

**Open:** `src/app/app.routes.ts`

- **Lines 5-9** - Public lazy-loaded routes (home, products, signals-playground).
- **Lines 14-19** - Protected routes guarded by `authGuard`. Point out that route guards also read from the auth store.

**Say:** "This is a real-world layout. A toolbar, a sidenav, lazy-loaded routes with guards. All of these need shared state. Now let us look at what happens when you try to build features without proper state management."

---

### Demo 2: The "Bad" Component Hierarchy (~8 min)

This is the main demo. Navigate to http://localhost:4200 in the browser.

**Open:** `src/app/features/home/home.component.ts`

- **Lines 35-44** - The chip set showing the component hierarchy: `home > product-list-bad > product-item-bad > product-actions-bad`. Point at each chip and say: "Four levels deep. Data flows down through @Input, events bubble up through @Output."
- **Lines 47-49** - Read the CONCEPT comment aloud. This is the anti-pattern summary: the "Add to Cart" event from `product-actions-bad` must bubble through three levels of `@Output()` chaining just to handle a button click.
- **Lines 157-160** - The `onAddToCart` method and its CONCEPT comment. After three levels of event bubbling, this is where the event finally arrives. In a real app, you would still need to update cart state somewhere, triggering yet another chain of problems.

**Open:** `src/app/features/home/product-list-bad.component.ts`

- **Lines 10-12** - CONCEPT comment: fetching data directly in a component via HttpClient. No service, no store, no caching. Every mount triggers a new HTTP call.
- **Lines 66-68** - `HttpClient` injected directly into the component. Ask the audience: "How many of you have seen this in production code?"
- **Lines 24-25** - CONCEPT on duplicate HTTP calls. Without shared state, each reload fetches its own copy. No caching or deduplication.
- **Lines 74-75** - The `addToCart` output. This component does not handle the event at all. It just forwards it upward. Pure boilerplate.
- **Lines 82-84** - The `reload()` method and its CONCEPT. Five components showing the same product would mean five separate HTTP calls.
- **Line 89** - `this.httpCallCount.update(c => c + 1)` tracks how many HTTP calls have been made. This powers the badge in the UI.

**WOW MOMENT:** In the browser, click the "Reload" button on the left card. Watch the HTTP call counter badge increment each time. Say: "Every click fires a brand new HTTP request. There is no caching, no deduplication. In a real dashboard with 10 widgets showing the same data, that is 10 identical network requests."

**Open:** `src/app/features/home/product-item-bad.component.ts`

- **Lines 7-10** - CONCEPT comment on prop drilling. This is level 2 in the hierarchy. It receives the full product object and passes `productId` down to `product-actions-bad`. The intermediate component does not even use the ID itself.
- **Lines 28-29** - CONCEPT on forwarding an output. `product-actions-bad` emits `addToCart`, and this component just re-emits it upward. This is pure boilerplate.
- **Lines 58-60** - The output declaration. This component does not handle the event; it just forwards it to its parent. Pure boilerplate.

**Open:** `src/app/features/home/product-actions-bad.component.ts`

- **Lines 5-8** - CONCEPT on event bubbling. This is the deepest level (level 3). The "Add to Cart" event must bubble up through `product-item-bad`, then `product-list-bad`, then `home` just to be handled.
- **Lines 29-31** - CONCEPT on prop drilling. This component receives `productId` passed down from two levels above. It does not need the full product, just the ID, but the parent chain must still thread it through.
- **Lines 34-35** - This output must be forwarded by `product-item-bad`, then by `product-list-bad`, before finally reaching a component that handles it.

**Say:** "Count the boilerplate. Three `@Output()` declarations. Three `.emit()` calls. Three template bindings. All for one button click. Now imagine adding a 'Remove from Cart' button. You have to wire up the entire chain again."

---

### Demo 3: State Classification (~5 min)

Back in the browser, direct attention to the right card: "The State Management Approach."

**Open:** `src/app/features/home/home.component.ts`

- **Lines 62-64** - Read the CONCEPT comment on state classification. Before choosing a tool, classify your state into five layers. Keep state as local as possible.
- **Lines 65-91** - Walk through each of the five state layers listed in the mat-list:
  1. **UI State** (line 68-69) - "Is this dropdown open?" Lives as a signal in the component. Never leaves the component.
  2. **Component State** (line 73-74) - "Current search and filters." Signals plus computed values shared with child components.
  3. **Feature State** (line 78-79) - "All inventory items." Managed by a SignalStore scoped to a feature module.
  4. **Global State** (line 83-84) - "Who is logged in?" A global SignalStore provided in root.
  5. **Server State** (line 88-89) - "Cached API responses." Handled by `resource()` or `rxMethod` with caching.

**Say:** "This is the mental model for the entire workshop. Every piece of state in your app fits into one of these five layers. The mistake most teams make is jumping straight to a global store for everything. By the end of today, you will know exactly which tool to reach for based on where the state lives."

**Reference:** `src/app/shared/services/api.service.ts` lines 6-7 for the CONCEPT on centralizing HTTP access. Point out that even a thin wrapper like `ApiService` is better than raw `HttpClient` in components. The bad components on the left skip this entirely.

**Reference:** `src/app/shared/models/product.model.ts` for the `Product` interface (lines 1-24) and `ProductsResponse` (lines 34-39). Mention that strong typing is the foundation: every store, every computed signal, every API call benefits from well-defined interfaces.

---

## Audience Interaction Points

1. **After Demo 1 (Shell):** "How many of you have components that need to read auth state? Show of hands. Now, how are you sharing that state today?"
2. **After Demo 2 (Bad Hierarchy):** "Who has seen @Output() chains longer than two levels in their codebase? What was the longest chain you have encountered?"
3. **After the WOW MOMENT:** "If your app has 10 dashboard widgets showing the same data, how many HTTP calls does it make on page load?"
4. **After Demo 3 (State Classification):** "Think about one feature you are working on right now. Which of these five layers does most of your state fall into?"

---

## Common Questions & Answers

**Q: "Is prop drilling always bad?"**
A: No. One level of @Input/@Output is fine and actually preferred for simple parent-child communication. The problem starts at three or more levels, or when intermediate components just forward data they do not use.

**Q: "Can't we just use a shared service with BehaviorSubject?"**
A: Yes, and that is exactly where many teams start. It works, but you end up writing a lot of boilerplate: subscription management, manual caching, unsubscribe logic. Signals and SignalStore give you the same result with less code and no subscription leaks.

**Q: "What about NgRx ComponentStore? Is SignalStore replacing it?"**
A: SignalStore is the evolution of ComponentStore. It is built on signals instead of RxJS, which means less boilerplate, no subscription management, and better integration with Angular's change detection. ComponentStore still works, but new projects should prefer SignalStore.

**Q: "Why not just use a global store for everything?"**
A: Over-globalizing state leads to bloated stores, naming collisions, and unnecessary re-renders. The state classification model helps you keep state as local as possible and only promote it when multiple unrelated components need it.

---

## Transition to Next Section

**Say:** "Now you have seen the pain. Prop drilling, event bubbling, duplicate HTTP calls, no caching. The fix starts with the smallest building block in Angular's reactive system: signals. In Section 2, we will build a solid foundation with `signal()`, `computed()`, `effect()`, `linkedSignal()`, and `untracked()`. Everything else in this workshop builds on top of those five primitives."

**Action:** Navigate to http://localhost:4200/signals-playground to preview the next section.

---

## Section Cheat Sheet

| Anti-Pattern | Where to See It | File | Lines |
|---|---|---|---|
| Direct HttpClient in component | `ProductListBadComponent` | `src/app/features/home/product-list-bad.component.ts` | 10-12, 66-68 |
| No caching / duplicate calls | Reload button + badge | `src/app/features/home/product-list-bad.component.ts` | 24-25, 82-84 |
| Prop drilling (3 levels) | productId passed down | `src/app/features/home/product-item-bad.component.ts` | 7-10 |
| Event bubbling (3 levels) | addToCart @Output chain | `src/app/features/home/product-actions-bad.component.ts` | 5-8, 34-35 |
| Boilerplate forwarding | Re-emitting events | `src/app/features/home/product-item-bad.component.ts` | 28-29, 58-60 |
| State classification | 5 state layers | `src/app/features/home/home.component.ts` | 62-64 |
| Centralized API wrapper | ApiService | `src/app/shared/services/api.service.ts` | 6-7 |
| Product model | Interface definition | `src/app/shared/models/product.model.ts` | 1-24 |
| Lazy routes with guards | Route config | `src/app/app.routes.ts` | 5-21 |
