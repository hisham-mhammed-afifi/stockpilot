# Section 2: Signals Foundation

## Duration: ~30 minutes

---

## Pre-Section Checklist

- [ ] App is running (`ng serve`)
- [ ] Browser open at http://localhost:4200/signals-playground
- [ ] VS Code open with the project
- [ ] Terminal visible for running Angular CLI
- [ ] Section 1 completed (attendees understand the pain points)

---

## Opening (2 min)

**Say:** "In Section 1 we saw the problems: prop drilling, event bubbling, duplicate HTTP calls, no shared state. The solution starts with the smallest reactive primitive in Angular: the signal. Before we touch stores, before we talk about global state, we need to master the five building blocks that everything else is built on: `signal()`, `computed()`, `effect()`, `linkedSignal()`, and `untracked()`."

**Context bridge:** Bridge from the anti-patterns in Section 1 to the foundation. Remind the audience that every store, every computed property, every piece of reactive UI they will build in later sections uses these primitives under the hood.

---

## Demo Flow

### Demo 1: Theme Toggle (~5 min)

Start in the browser. Click the theme toggle button in the toolbar (sun/moon icon). Watch the entire app switch between light and dark themes.

**Say:** "That one click just updated a signal, triggered a computed derivation, and fired an effect that toggled a CSS class on the document body. Three signal primitives working together. Let us look at how."

**Open:** `src/app/core/theme/theme.store.ts`

- **Lines 5-7** - CONCEPT comment on signalStoreFeature composition. This was previously an `@Injectable` class with raw signals; now it is a SignalStore that composes `withLocalStorage()` for automatic persistence. Zero manual localStorage code.
- **Lines 12-14** - `withState({ theme: 'system' })`. The initial state is a single property. Point out that `'system'` resolves to the OS preference.
- **Lines 16-19** - CONCEPT on `withLocalStorage`. This single line replaces all manual localStorage read/write logic. The theme preference is saved automatically on every change and restored when the app loads. Write once, reuse everywhere.
- **Lines 22-23** - CONCEPT on `isDark` computed. Pure derivation from the theme signal. When theme is `'system'`, it checks `window.matchMedia`. When `'light'` or `'dark'`, it maps directly.
- **Lines 24-30** - The `isDark` computed implementation. Walk through the conditional logic.
- **Lines 31-37** - The `icon` computed. Same pattern: derives the icon name from the current theme. The toolbar reads `themeStore.icon()` to show the right icon.
- **Lines 40-54** - `withMethods` for `setTheme()` and `toggleTheme()`. Point out `patchState()` as the way to update state in a SignalStore.
- **Lines 57-58** - CONCEPT on `withHooks`. Side effects like DOM manipulation go in `onInit`. The `effect()` tracks `isDark` and syncs the body class whenever it changes.
- **Lines 61-65** - The actual effect. It reads `store.isDark()`, then toggles `dark-theme` and `light-theme` classes on `document.body`.

**Say:** "Three primitives in action. A signal holds the theme. A computed derives whether it is dark. An effect syncs the DOM. No manual subscriptions, no cleanup, no lifecycle hooks in the component. The store owns the reactive chain end to end."

**Note for presenter:** You can click the theme toggle a few times while talking through the code. The instant visual feedback reinforces how signals propagate changes.

---

### Demo 2: Counter Playground (~5 min)

Navigate to http://localhost:4200/signals-playground. Scroll to the first card: "signal() - Writable Reactive Primitive."

**Open:** `src/app/features/home/signals-playground/signals-playground.component.ts`

- **Lines 595-597** - CONCEPT on signal creation. `signal<T>(initialValue)` creates a writable reactive container. Reading `count()` in the template auto-tracks it for change detection.
- **Line 597** - `count = signal(0)` - the simplest possible signal.

**In the browser:** Click Increment a few times. Click Decrement. Click "Set to 100." Click "Reset."

- **Lines 599-602** - `increment()` uses `.update(c => c + 1)`. Explain: "Use `.update()` when the new value depends on the current value."
- **Lines 609-612** - `resetCount()` uses `.set(0)`. Explain: "Use `.set()` when you have the new value and do not need the old one."

**Say:** "Two ways to write to a signal: `.set()` replaces, `.update()` transforms. That is the entire write API. No `.next()`, no `.emit()`, no dispatching actions."

**Pause and ask:** "For those coming from RxJS, notice what is missing. No BehaviorSubject, no `.getValue()`, no `.subscribe()`, no async pipe. The template reads `count()` directly."

---

### Demo 3: Shopping Cart Computed (~5 min)

Scroll to the second card: "computed() - Derived Read-Only State."

**Open:** `src/app/features/home/signals-playground/signals-playground.component.ts`

- **Lines 626-632** - The products array and the `_quantities` signals. Each product quantity is its own signal. This gives fine-grained reactivity: changing one quantity only recalculates the computeds that depend on it.
- **Lines 634-636** - CONCEPT on computed. `quantities()` returns a snapshot array of all quantity values. This is a computed that reads from multiple signals.
- **Lines 638-644** - `subtotals` computed. Each subtotal is derived from its specific quantity and price.
- **Lines 646-648** - `itemCount` computed. Reduces all quantities into a single sum.
- **Lines 650-654** - `cartTotal` computed. Sums price times quantity across all products.
- **Lines 656-658** - CONCEPT on derived booleans. `hasDiscount` is a computed that returns `true` when `itemCount() > 3`. It automatically updates when `itemCount` changes. No manual recalculation, no event wiring, no subscriptions.

**WOW MOMENT:** In the browser, change the quantity of "Wireless Mouse" from 1 to 4. Watch all four derived values update simultaneously: the subtotal for that row, the item count, the cart total, and the "Discount unlocked!" chip appears. Say: "One signal changed. Four computeds reacted. Zero manual wiring."

**Say:** "Computed signals are lazy and cached. If nothing reads them, they do not run. If the same computed is read twice with no changes to its dependencies, it returns the memoized value. This is fundamentally different from RxJS pipes, which re-execute on every subscription."

---

### Demo 4: Effect Logger (~3 min)

Scroll to the third card: "effect() - Side Effects."

**Open:** `src/app/features/home/signals-playground/signals-playground.component.ts`

- **Lines 669-673** - Two signals: `inputValue` holds the text, `logs` accumulates effect output for display.
- **Lines 676-689** - CONCEPT on effect. The effect runs inside the constructor. It auto-tracks `inputValue()` and fires on every change. Key teaching points:
  - **Line 680** - `effect(() => { ... })` - the effect callback.
  - **Line 681** - `const val = this.inputValue()` - reading a signal inside an effect registers it as a dependency.
  - **Line 686** - `untracked(() => this.logs())` - reading `logs` without tracking it, to avoid an infinite loop. This is a preview of the `untracked()` concept in Demo 6.

**In the browser:** Type a few characters in the input field. Watch the console panel below fill up with timestamped log entries in real time.

**Say:** "Effects are for side effects only: DOM manipulation, localStorage, logging, analytics. Never use an effect to update another signal. If you need derived state, use `computed()` instead."

**Point out the warning banner** in the UI (lines 167-169): "Never use effect() to set other signals. Use computed() instead." Emphasize that Angular enforces this as a best practice.

---

### Demo 5: linkedSignal (~5 min)

Scroll to the fourth card: "linkedSignal() - Resettable Derived State."

**Open:** `src/app/features/home/signals-playground/signals-playground.component.ts`

- **Lines 704-705** - `searchQuery` signal holds the current search text.
- **Lines 707-715** - CONCEPT on linkedSignal. `linkedSignal()` creates a writable signal that auto-resets when its source changes. When `searchQuery` changes, `currentPage` snaps back to 1. But you can still manually `.set()` or `.update()` it for next/prev page navigation.
- **Lines 712-715** - The implementation. Inside the callback, `this.searchQuery()` is tracked as the source. The return value `1` is the reset value.

**WOW MOMENT:** In the browser, follow this sequence:
1. Click "Next" twice. Page shows 3.
2. Type something in the search box. Page instantly resets to 1.
3. Click "Next" again. Page goes to 2.
4. Change the search text. Page resets to 1 again.

**Say:** "This is a pattern you see everywhere: pagination that resets on new search, form fields that reset when a parent dropdown changes, selected tab that resets when the data source changes. Before `linkedSignal()`, you had to wire this up manually with subscriptions or effect hacks. Now it is one function call."

**Ask the audience:** "Where in your current app do you have a value that should reset when something else changes? That is a linkedSignal."

---

### Demo 6: untracked (~3 min)

Scroll to the fifth card: "untracked() - Break Dependency Tracking."

**Open:** `src/app/features/home/signals-playground/signals-playground.component.ts`

- **Lines 733-735** - Two signals: `trackedSig` and `notTrackedSig`.
- **Lines 741-752** - CONCEPT on untracked. `untracked(() => someSignal())` reads a signal's value without registering it as a dependency. The computed only re-runs when `trackedSig` changes, not when `notTrackedSig` changes.
- **Line 745** - `const a = this.trackedSig()` - this dependency IS tracked.
- **Line 746** - `const b = untracked(() => this.notTrackedSig())` - value is read, but NOT tracked.

**In the browser:** Follow this sequence:
1. Click "Update tracked" a few times. Watch the computed result change and the recomputation counter increment.
2. Click "Update notTracked" a few times. The `notTrackedSig` value changes, but the computed result does NOT update. The recomputation counter stays the same.
3. Click "Update tracked" one more time. Now the computed picks up the latest value of both signals, because it reads `notTrackedSig` during recomputation.

**Say:** "This is a performance tool. You use it when a computed or effect needs a value for calculation but should not re-run when that particular signal changes. We already saw it in Demo 4, where the effect used `untracked(() => this.logs())` to avoid an infinite loop."

---

### Demo 7: Signals vs BehaviorSubject (~4 min)

Scroll to the sixth card: "Signals vs BehaviorSubject - Same Feature, Two Ways."

**Open:** `src/app/features/home/signals-playground/signals-playground.component.ts`

- **Lines 767-776** - The RxJS approach. CONCEPT: `BehaviorSubject` is the RxJS equivalent of a signal. It holds a current value and emits on change. But it requires `.pipe()`, `map()`, `async` pipe, and subscription management.
  - **Line 770** - `rxCounter$ = new BehaviorSubject(0)` - creates the subject.
  - **Lines 771-776** - `rxDoubled$` uses `.pipe(map(...))` and `takeUntilDestroyed()` for cleanup.
- **Lines 782-786** - The Signal approach. CONCEPT: Signals are synchronous, glitch-free, and automatically tracked. No subscriptions, no async pipe, no cleanup.
  - **Line 785** - `sigCounter = signal(0)` - creates the signal.
  - **Line 786** - `sigDoubled = computed(() => this.sigCounter() * 2)` - derives state.
- **Lines 788-789** - Signal increment/decrement: `.update(c => c + 1)`. Compare with lines 778-779 where BehaviorSubject needs `.next(this.rxCounter$.value + 1)`.

**In the browser:** Click the + and - buttons on both sides. Both work identically. Then compare:

**Say:** "Same feature. Same result. But look at the code. Signals: 4 lines, no subscriptions, no async pipe, no cleanup. BehaviorSubject: 8 lines, requires takeUntilDestroyed, requires async pipe in the template. And this is a trivial example. In a real component with 10 derived values, the difference is dramatic."

**Point out the chip summary** at the bottom of the card: "Signals: 4 lines / BehaviorSubject: 8 lines / Signals: no subscription management."

**Say:** "This does not mean RxJS is dead. Observables are still the right tool for event streams, HTTP calls, WebSocket messages, and complex async orchestration. But for holding and deriving state, signals are the better fit in Angular 19 and beyond."

---

## Audience Interaction Points

1. **After Demo 2 (Counter):** "Quick poll: who is currently using BehaviorSubject for component state? After this section, you will have a simpler alternative."
2. **After Demo 3 (Shopping Cart):** "How would you implement this discount logic with BehaviorSubject? How many `.pipe()` chains would you need?" Let them think about it for a moment.
3. **After Demo 5 (linkedSignal):** "Where in your current app do you have a value that should reset when something else changes? Pagination, filters, selected items?"
4. **After Demo 7 (Comparison):** "What are the cases where you would still reach for an Observable instead of a signal?" Guide them toward: HTTP calls, WebSocket streams, complex async orchestration, multi-event composition.

---

## Common Questions & Answers

**Q: "Are signals replacing RxJS entirely?"**
A: No. Signals replace BehaviorSubject for synchronous state. RxJS is still the right tool for event streams, HTTP calls, WebSocket connections, and complex async flows. The two work together: you can convert between them with `toSignal()` and `toObservable()`.

**Q: "What about OnPush change detection? Do signals work with it?"**
A: Signals work perfectly with OnPush. In fact, they are better than OnPush with Observables because there is no need for the async pipe or `markForCheck()`. When a signal changes, Angular knows exactly which views to update.

**Q: "Can I use signals outside of components?"**
A: Yes. Signals work in services, stores, utility functions, and anywhere in your application. They are not tied to the component lifecycle. The only caveat is that `effect()` needs an injection context (constructor or `runInInjectionContext`).

**Q: "What is the difference between linkedSignal and computed?"**
A: `computed()` is read-only. You cannot manually set its value. `linkedSignal()` is writable: it has an auto-reset behavior when its source changes, but you can still call `.set()` or `.update()` on it manually. Use `computed()` when the value is purely derived. Use `linkedSignal()` when you need a default that resets but can also be overridden by the user.

**Q: "When should I use untracked?"**
A: Use it when you need a signal's value inside a computed or effect but do not want that signal to trigger re-execution. Common cases: reading a configuration signal in a computed that should only react to data changes, or reading an accumulator signal inside an effect to avoid infinite loops.

**Q: "Is there a performance cost to having many signals?"**
A: Signals are extremely lightweight. Each signal is just a wrapper around a value with a version counter. Creating thousands of signals has negligible overhead. The reactive graph only does work when values actually change, and computed signals are lazy, so unused computeds cost nothing.

---

## Transition to Next Section

**Say:** "You now have the five building blocks: `signal()` for state, `computed()` for derivation, `effect()` for side effects, `linkedSignal()` for resettable derived state, and `untracked()` for selective dependency tracking. In the next section, we will put these to work inside components, using patterns like local component state, input-driven signals, and model signals for two-way binding."

**Action:** Keep the browser on the signals playground. Attendees may want to experiment with the interactive demos during the break.

---

## Section Cheat Sheet

| Concept | Where to See It | File | Lines |
|---|---|---|---|
| signal() creation | Counter playground | `src/app/features/home/signals-playground/signals-playground.component.ts` | 595-597 |
| .set() vs .update() | Counter increment/reset | `src/app/features/home/signals-playground/signals-playground.component.ts` | 600-612 |
| computed() derivation | Shopping cart totals | `src/app/features/home/signals-playground/signals-playground.component.ts` | 634-658 |
| Lazy + cached computed | Cart total and discount | `src/app/features/home/signals-playground/signals-playground.component.ts` | 650-658 |
| effect() side effects | Input logger | `src/app/features/home/signals-playground/signals-playground.component.ts` | 676-689 |
| linkedSignal() | Search + pagination reset | `src/app/features/home/signals-playground/signals-playground.component.ts` | 707-715 |
| untracked() | Selective recomputation | `src/app/features/home/signals-playground/signals-playground.component.ts` | 741-752 |
| Signals vs BehaviorSubject | Side-by-side comparison | `src/app/features/home/signals-playground/signals-playground.component.ts` | 767-789 |
| signal in a store | Theme state | `src/app/core/theme/theme.store.ts` | 5-7, 12-14 |
| computed in a store | isDark derivation | `src/app/core/theme/theme.store.ts` | 22-30 |
| effect in a store | DOM class sync | `src/app/core/theme/theme.store.ts` | 57-65 |
| withLocalStorage feature | Theme persistence | `src/app/core/theme/theme.store.ts` | 16-19 |
