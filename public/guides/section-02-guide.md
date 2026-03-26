# Section 02: Signals Foundation

**Duration:** ~30 minutes
**URL:** http://localhost:4200/signals-playground
**Goal:** Build hands-on familiarity with every core signal primitive (`signal`, `computed`, `effect`, `linkedSignal`, `untracked`) and show how signals compare to BehaviorSubject.

---

## Pre-Section Checklist

- [ ] `ng serve` running at http://localhost:4200/
- [ ] Browser on http://localhost:4200/signals-playground
- [ ] Editor open with `src/app/features/home/signals-playground/signals-playground.component.ts`
- [ ] Also have `src/app/core/theme/theme.store.ts` ready to open
- [ ] DevTools Console open (for the effect() demo)

---

## Opening (2 min)

> "In the last section we saw the problems. Now we learn the foundation that solves them. Signals are Angular's reactive primitive, available since Angular 16 and stable in Angular 19. Think of a signal as a box that holds a value and notifies Angular whenever that value changes."

Point at the Signals Playground page. There are six interactive cards (A through F), one per concept.

---

## Demo Flow

### Demo A: signal() - Writable Reactive Primitive (4 min)

**Browser:**

1. The counter starts at `0`.
2. Click **Increment** three times. The counter shows `3`.
3. Click **Set to 100**. The counter jumps to `100`.
4. Click **Decrement**. The counter shows `99`.
5. Click **Reset**. The counter returns to `0`.

**Editor:**

1. Open `src/app/features/home/signals-playground/signals-playground.component.ts`
   - **Line 604**: `count = signal(0);` -- creates a writable signal with initial value `0`.
   - **Line 609**: `this.count.update(c => c + 1);` -- `.update()` derives the new value from the current value.
   - **Line 619**: `this.count.set(0);` -- `.set()` replaces the value directly.
   - **Line 623**: `this.count.set(100);` -- another `.set()` example.

2. Point out the template at **line 60**: `{{ count() }}`. Reading a signal requires calling it as a function.

> **Key takeaway:** "`.set()` when you have the value. `.update()` when you need the current value to compute the next one. Reading always uses parentheses: `count()`."

### Demo B: computed() - Derived Read-Only State (5 min)

**Browser:**

1. The shopping cart has three products. Wireless Mouse starts at quantity 1.
2. Change Wireless Mouse quantity to `3`. Watch the subtotal update to `$89.97` and the total update.
3. Change Mechanical Keyboard quantity to `1`. The total recalculates again.
4. Keep adding items until the total item count exceeds 3. A green "Discount unlocked!" chip appears.
5. Reduce quantities below 3 total. The chip disappears.

> **Wow moment:** "Nobody told Angular to recalculate the total. Nobody subscribed to anything. The `computed()` tracks its dependencies automatically."

**Editor:**

1. Open `src/app/features/home/signals-playground/signals-playground.component.ts`
   - **Line 639**: `private readonly _quantities = [signal(1), signal(0), signal(0)];` -- each product has its own signal.
   - **Line 643**: `readonly quantities = computed(() => this._quantities.map(q => q()));` -- snapshot of all quantities.
   - **Lines 647-651**: `readonly subtotals = computed(...)` -- each subtotal derives from its quantity and price.
   - **Lines 657-661**: `readonly cartTotal = computed(...)` -- total derives from all quantities and prices.
   - **Line 665**: `readonly hasDiscount = computed(() => this.itemCount() > 3);` -- a derived boolean.

> **Key takeaway:** "Computed signals are lazy (they do not run until read), cached (multiple reads with unchanged deps return the same value), and read-only (you cannot `.set()` a computed)."

### Demo C: effect() - Side Effects (5 min)

**Browser:**

1. Look at the "Effect Console" panel (empty).
2. Type "hello" in the input field, one character at a time.
3. Watch the console panel fill with timestamped log entries: `[HH:MM:SS] Input changed to: "h"`, `"he"`, `"hel"`, etc.
4. Click the trash icon to clear the logs.
5. Type again to show the effect re-fires.

> **Wow moment:** "The effect tracked `inputValue()` automatically. We never told it which signal to watch. It figured that out by running the function once."

**Editor:**

1. Open `src/app/features/home/signals-playground/signals-playground.component.ts`
   - **Line 677**: `readonly inputValue = signal('');` -- the source signal.
   - **Lines 687-696**: The `effect()` implementation in the constructor:
     ```typescript
     effect(() => {
       const val = this.inputValue();
       if (val !== '') {
         const timestamp = new Date().toLocaleTimeString();
         const currentLogs = untracked(() => this.logs());
         this.logs.set([...currentLogs, `[${timestamp}] Input changed to: "${val}"`]);
       }
     });
     ```
   - **Line 693**: Point out `untracked(() => this.logs())`. Without `untracked`, reading `this.logs()` would register it as a dependency, causing the effect to re-fire when logs change, creating an infinite loop.

2. Point out the warning banner in the template at **lines 174-177**: "Never use effect() to set other signals. Use computed() instead."

> **Key takeaway:** "Use `effect()` only for side effects: DOM manipulation, localStorage writes, logging, analytics. If you need to derive a value from other signals, use `computed()`."

### Demo D: linkedSignal() - Resettable Derived State (4 min)

**Browser:**

1. The search input is empty and the page shows `1`.
2. Click **Next** three times. The page shows `4`.
3. Type anything in the search input. Watch the page snap back to `1` instantly.
4. Click **Next** to go to page `2`.
5. Change the search text. Page resets to `1` again.

> **Wow moment:** "The page number is writable (you can click Next) AND it auto-resets when the search changes. A `computed()` cannot do this because computed is read-only. A plain `signal()` cannot do this because it would not reset. `linkedSignal()` gives you both."

**Editor:**

1. Open `src/app/features/home/signals-playground/signals-playground.component.ts`
   - **Line 712**: `readonly searchQuery = signal('');` -- the source signal.
   - **Lines 714-722**: The `linkedSignal()` implementation:
     ```typescript
     readonly currentPage = linkedSignal(() => {
       this.searchQuery(); // track the source
       return 1;           // reset to page 1 whenever search changes
     });
     ```
   - **Line 729**: `this.currentPage.update(p => p + 1);` -- manual writes still work.

> **Key takeaway:** "`linkedSignal()` is the answer when you need a signal that is both writable and resets when a source signal changes. Common use cases: pagination reset on filter change, form field reset on parent selection change."

### Demo E: untracked() - Selective Dependency Tracking (4 min)

**Browser:**

1. Both "tracked" and "NOT tracked" signals start at `0`. The computed result shows `0`. The "Recalculated" chip shows `1`.
2. Click **Update tracked** three times. The result updates each time (now shows `3`). The recalculation count increases to `4`.
3. Click **Update notTracked** three times. The "NOT tracked" value changes to `3`, but the computed result stays at `3` and the recalculation count stays at `4`.
4. Now click **Update tracked** once more. The result jumps to `7` (3 + 4) and the recalculation count goes to `5`.

> **Wow moment:** "Updating `notTracked` changed the signal's value, but the computed did NOT re-run. Only when `tracked` changed did the computed re-run, and at that point it picked up the latest `notTracked` value too."

**Editor:**

1. Open `src/app/features/home/signals-playground/signals-playground.component.ts`
   - **Lines 751-758**: The computed implementation:
     ```typescript
     readonly untrackedResult = computed(() => {
       const a = this.trackedSig();                       // dependency IS tracked
       const b = untracked(() => this.notTrackedSig());   // value read, NOT tracked
       ...
       return a + b;
     });
     ```

> **Key takeaway:** "`untracked()` lets you read a signal's current value without creating a dependency. Use it inside `effect()` or `computed()` when you need a value for computation but do not want that signal to trigger re-execution."

### Demo F: Signals vs BehaviorSubject (3 min)

**Browser:**

1. Both counters start at `0` with "Doubled: 0".
2. Click `+` on the BehaviorSubject side. It shows `1`, Doubled: `2`.
3. Click `+` on the Signals side. It shows `1`, Doubled: `2`.
4. Both work identically from the user's perspective.

**Editor:**

1. Open `src/app/features/home/signals-playground/signals-playground.component.ts`
   - **Lines 777-783**: BehaviorSubject approach:
     ```typescript
     readonly rxCounter$ = new BehaviorSubject(0);
     readonly rxDoubled$ = this.rxCounter$.pipe(
       map(v => v * 2),
       takeUntilDestroyed(),
     );
     ```
   - **Lines 792-793**: Signal approach:
     ```typescript
     readonly sigCounter = signal(0);
     readonly sigDoubled = computed(() => this.sigCounter() * 2);
     ```
   - **Lines 340-344**: The comparison chips: "Signals: 4 lines", "BehaviorSubject: 8 lines", "Signals: no subscription management".

> **Key takeaway:** "Signals do the same job with less code, no subscription management, and no async pipe. Use Observables for event streams and HTTP. Use signals for state."

### Bonus Demo: Theme Store - Signals in Production (3 min)

**Browser:**

1. Click the theme toggle button in the toolbar (sun/moon icon at line 95-97 of `shell.component.ts`).
2. The entire app switches between light and dark mode.
3. Refresh the page. The theme persists (localStorage).

**Editor:**

1. Open `src/app/core/theme/theme.store.ts`
   - **Lines 5-7**: CONCEPT comment about composition.
   - **Line 9**: `signalStore` definition with `{ providedIn: 'root' }`.
   - **Lines 12-13**: `withState({ theme: 'system' })` -- initial state.
   - **Line 19**: `withLocalStorage('stockpilot-theme', ['theme'])` -- one line for persistence.
   - **Lines 21-37**: `withComputed` -- `isDark` and `icon` are derived from the theme signal.
   - **Lines 40-54**: `withMethods` -- `setTheme()` and `toggleTheme()` use `patchState()`.
   - **Lines 57-67**: `withHooks` -- `effect()` syncs the body class on every theme change.

2. Open `src/app/core/layout/shell.component.ts`
   - **Line 225**: `readonly themeStore = inject(ThemeStore);`
   - **Lines 95-97**: The toggle button reads `themeStore.icon()` and calls `themeStore.toggleTheme()`.

> "This is a preview of Section 04 and beyond. For now, notice how signals, computed, and effect work together in a real feature: state in, derived values out, side effects for DOM sync."

---

## Audience Interaction Points

| When | What to Ask |
|------|-------------|
| After Demo A | "What is the difference between `.set(0)` and `.update(c => 0)`? When would you use one over the other?" (Answer: functionally identical for constants, but `.update()` is necessary when the new value depends on the old value.) |
| After Demo B | "If we added a fourth product to the cart, which computeds would recalculate?" (Answer: `quantities`, `subtotals`, `itemCount`, `cartTotal`, and `hasDiscount` would all re-evaluate, but only the slices that changed would trigger template updates.) |
| After Demo C | "Why did we use `untracked(() => this.logs())` inside the effect?" (Answer: without it, reading `logs` creates a dependency, so updating `logs` re-triggers the effect, causing an infinite loop.) |
| After Demo E | "Can you think of a real-world case where `untracked()` would be useful?" (Answer: logging analytics events where you need a user ID but do not want the effect to re-fire on user change.) |

---

## Common Questions & Answers

| Question | Answer |
|----------|--------|
| "Are signals a replacement for RxJS?" | No. Signals handle synchronous state. RxJS handles asynchronous event streams, HTTP, WebSockets, and complex timing operators. They complement each other. Angular provides `toSignal()` and `toObservable()` to bridge them. |
| "When should I use `effect()` vs `computed()`?" | If you need a derived value, use `computed()`. If you need a side effect (write to localStorage, update the DOM, log analytics), use `effect()`. Never use `effect()` to set another signal when `computed()` would work. |
| "What about `toSignal()` and `toObservable()`?" | `toSignal()` converts an Observable to a Signal (we will see this in Section 03 with route params). `toObservable()` does the reverse. Both are in `@angular/core/rxjs-interop`. |
| "Does `computed()` run eagerly or lazily?" | Lazily. A `computed()` only evaluates when it is read. If nothing reads it, it never runs. And it caches: reading it twice with unchanged deps returns the same value without re-running the function. |
| "Is `linkedSignal()` stable?" | Yes, `linkedSignal()` is stable as of Angular 19. It was experimental in Angular 18. |

---

## Transition to Next Section

> "Now you know all the signal primitives: `signal()` for writable state, `computed()` for derived values, `effect()` for side effects, `linkedSignal()` for resettable derived state, and `untracked()` for selective tracking. In the next section, we will put them all together inside a real component: the Products page with search, filters, pagination, and data fetching."

Navigate to http://localhost:4200/products to preview the next page.

---

## Section Cheat Sheet

| Concept | File | Line(s) | What to Show |
|---------|------|---------|--------------|
| `signal()` creation | `signals-playground.component.ts` | 604 | `count = signal(0)` |
| `.update()` usage | `signals-playground.component.ts` | 609 | `this.count.update(c => c + 1)` |
| `.set()` usage | `signals-playground.component.ts` | 619 | `this.count.set(0)` |
| `computed()` - quantities snapshot | `signals-playground.component.ts` | 643 | `computed(() => this._quantities.map(q => q()))` |
| `computed()` - subtotals | `signals-playground.component.ts` | 647-651 | Derived from quantity * price |
| `computed()` - cart total | `signals-playground.component.ts` | 657-661 | Reduce across all products |
| `computed()` - boolean | `signals-playground.component.ts` | 665 | `hasDiscount` derived from `itemCount` |
| `effect()` implementation | `signals-playground.component.ts` | 687-696 | Auto-tracking + side effect logging |
| `untracked()` inside effect | `signals-playground.component.ts` | 693 | Prevents infinite loop on `logs` |
| `linkedSignal()` | `signals-playground.component.ts` | 719-722 | Page resets when search changes |
| `untracked()` in computed | `signals-playground.component.ts` | 751-758 | Selective dependency tracking |
| BehaviorSubject approach | `signals-playground.component.ts` | 777-783 | RxJS counter with pipe + async |
| Signal approach | `signals-playground.component.ts` | 792-793 | Signal counter with computed |
| Theme store (real-world signals) | `src/app/core/theme/theme.store.ts` | 9-68 | signalStore with state, computed, methods, hooks |
| Theme toggle in shell | `src/app/core/layout/shell.component.ts` | 95-97, 225 | `themeStore.toggleTheme()` injection and usage |

*Note:* All line numbers in this table reference `src/app/features/home/signals-playground/signals-playground.component.ts` unless a full path is given.

---

## Recovery Steps

| Problem | Fix |
|---------|-----|
| Signals Playground page is blank | Check that the route `/signals-playground` is configured in `src/app/app.routes.ts` (line 34). Verify `ng serve` has no compile errors. |
| Counter buttons do not respond | Hard refresh the browser. Check DevTools Console for errors. |
| Effect console does not show logs | Type slowly; the effect fires on every keystroke. If still blank, check that `effect()` is in the constructor (line 687). |
| linkedSignal page does not reset | Make sure you are typing in the search field, not the effect input field above. The two demos use separate signals. |
| Theme toggle does nothing | Check DevTools Console for errors. Verify `ThemeStore` is `providedIn: 'root'` at line 10 of `theme.store.ts`. |
| "Discount unlocked" chip never appears | You need more than 3 total items (line 665: `this.itemCount() > 3`). Try setting quantities to 2, 1, 1. |
