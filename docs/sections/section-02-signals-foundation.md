# Section 02: Signals Foundation

## Duration: ~30 minutes

## CONCEPTS TAUGHT
- `signal()` - reactive primitive, read via `()`, write via `.set()` / `.update()`
- `computed()` - derived read-only signal, auto-tracks dependencies, lazy evaluation
- `effect()` - side effects that react to signal changes, cleanup function, injection context
- `linkedSignal()` - derived signal that resets when source changes but can be overridden
- `untracked()` - read a signal without tracking it as a dependency
- Signals vs BehaviorSubject comparison

## PREREQUISITES
- Section 01 completed (shell, routing, models)

## API ENDPOINTS USED
- None (this section is about raw signals, no HTTP)

## DELIVERABLES

### Files to Create

1. **`src/app/core/theme/theme.store.ts`**
   A simple signal-based theme service (NOT a SignalStore yet, raw signals only):

   ```typescript
   @Injectable({ providedIn: 'root' })
   export class ThemeService {
     // CONCEPT: signal() - Creates a writable reactive primitive.
     // Reading theme() in a template or computed() auto-tracks it as a dependency.
     // Writing via .set() or .update() notifies all consumers.
     private _theme = signal<'light' | 'dark' | 'system'>('system');

     // CONCEPT: computed() - Derives a read-only signal from other signals.
     // This only recalculates when _theme changes. If read 100 times with
     // the same _theme value, the computation runs only once (lazy + cached).
     readonly theme = this._theme.asReadonly();

     readonly isDark = computed(() => {
       const t = this._theme();
       if (t === 'system') {
         return window.matchMedia('(prefers-color-scheme: dark)').matches;
       }
       return t === 'dark';
     });

     readonly icon = computed(() => this.isDark() ? 'dark_mode' : 'light_mode');

     // CONCEPT: effect() - Runs a side effect whenever tracked signals change.
     // Here we sync the signal value to the DOM (document.body class).
     // Effects should ONLY be used for side effects (DOM, localStorage, logging).
     // NEVER use effect() to update other signals - use computed() instead.
     constructor() {
       effect(() => {
         const dark = this.isDark();
         document.body.classList.toggle('dark-theme', dark);
         document.body.classList.toggle('light-theme', !dark);
       });
     }

     setTheme(theme: 'light' | 'dark' | 'system') {
       this._theme.set(theme);
     }

     toggleTheme() {
       // CONCEPT: .update() - Takes the current value and returns a new one.
       // Use .set() when you have the new value directly.
       // Use .update() when the new value depends on the current value.
       this._theme.update(current => current === 'dark' ? 'light' : 'dark');
     }
   }
   ```

2. **`src/app/features/home/signals-playground/signals-playground.component.ts`**
   An interactive playground page that demonstrates every signal concept.
   This component is the core teaching tool for Section 2.

   **Part A: Basic Signal (Counter)**
   ```
   [mat-card] "signal() - Writable Reactive Primitive"
   - A counter display showing the current value
   - Buttons: Increment, Decrement, Reset, Set to 100
   - Code snippet shown below the demo (use <pre><code>)
   - Show: signal(), .set(), .update(), reading via ()
   ```

   **Part B: Computed Signal (Shopping Cart)**
   ```
   [mat-card] "computed() - Derived Read-Only State"
   - 3 product rows with quantity inputs (each quantity is a signal)
   - Computed signals: subtotal per row, cart total, item count, has discount (>3 items)
   - Show how changing one quantity auto-updates all derived values
   - Code snippet below
   ```

   **Part C: Effect (Logger)**
   ```
   [mat-card] "effect() - Side Effects"
   - A text input bound to a signal
   - An effect that logs every change to a visible "Console" panel (mat-list)
   - Show the effect running on each change
   - Show a WARNING: "Never use effect() to set other signals. Use computed() instead."
   - Code snippet below
   ```

   **Part D: linkedSignal (Search + Pagination)**
   ```
   [mat-card] "linkedSignal() - Resettable Derived State"
   - A search input (signal)
   - A page number display (linkedSignal that resets to 1 when search changes)
   - Buttons: Next Page, Previous Page
   - Demo: type in search -> page resets to 1. Click next -> page goes to 2. Type again -> back to 1.
   - Code snippet below
   ```

   **Part E: untracked()**
   ```
   [mat-card] "untracked() - Break Dependency Tracking"
   - Two signals: `tracked` and `notTracked`
   - A computed that reads `tracked()` normally and `untracked(() => notTracked())`
   - Buttons to update each signal
   - Visual indicator showing: "Computed recalculated N times"
   - Demo: updating `tracked` causes recomputation. Updating `notTracked` does NOT.
   - Code snippet below
   ```

   **Part F: Signals vs BehaviorSubject (Side by Side)**
   ```
   [mat-card] "Signals vs BehaviorSubject - Same Feature, Two Ways"
   Two columns:
   LEFT: BehaviorSubject version
   - BehaviorSubject<number>(0)
   - .pipe(map(...)) for derived
   - subscription management with takeUntilDestroyed
   - async pipe in template

   RIGHT: Signal version
   - signal(0)
   - computed() for derived
   - No subscription needed
   - Direct () call in template

   Both implement the same counter with derived "doubled" value.
   Show line count comparison at the bottom.
   ```

3. **`src/app/features/home/signals-playground/signals-playground.routes.ts`**

### Files to Modify

1. **`src/app/core/layout/header.component.ts`** (or toolbar area in shell)
   - Add theme toggle button using ThemeService
   - Show current theme icon via `themeService.icon()`
   - On click, call `themeService.toggleTheme()`

2. **`src/app/core/layout/shell.component.ts`**
   - Add "Signals Playground" link to sidebar nav under a "Workshop" section header

3. **`src/app/app.routes.ts`**
   - Add route: `{ path: 'signals-playground', loadComponent: () => import('...').then(m => m.SignalsPlaygroundComponent) }`

4. **`src/styles.scss`** (or global styles)
   - Add dark theme CSS variables:
   ```scss
   body.light-theme {
     --bg-primary: #fafafa;
     --bg-card: #ffffff;
     --text-primary: #212121;
   }
   body.dark-theme {
     --bg-primary: #303030;
     --bg-card: #424242;
     --text-primary: #ffffff;
   }
   ```
   - Wire Material theming if not already done

## IMPLEMENTATION SPEC

### Step 1: Theme Service
Create ThemeService with raw signals. Wire effect() to sync with document.body. Add toggle to header toolbar.

### Step 2: Signals Playground Component
Build the playground as a single scrollable page with 6 mat-cards (Parts A through F). Each card contains:
1. A title explaining the concept
2. An interactive demo
3. A `<pre><code>` block showing the relevant code

Use `ViewEncapsulation.None` or component styles to make the code blocks look good.

### Step 3: Wire Routing
Add the playground route and sidebar link.

## TEACHING NOTES

Key comments to include:

```typescript
// CONCEPT: Signal - signal<T>(initialValue) creates a reactive container.
// Unlike BehaviorSubject, there's no .subscribe(). Reading theme() in a
// template auto-registers the component for change detection updates.

// CONCEPT: Computed - computed() is LAZY. It won't run until someone reads it.
// It's also CACHED. Multiple reads with unchanged deps return the memoized value.
// NEVER put side effects inside computed() - it's for pure derivation only.

// CONCEPT: Effect - effect() is the ONLY place for side effects in the signal world.
// DOM manipulation, localStorage writes, analytics events, logging.
// It runs in an injection context so it auto-cleans up when the component/service is destroyed.

// CONCEPT: LinkedSignal - linkedSignal() creates a writable signal that auto-resets
// when its source changes. Perfect for pagination that resets on new search,
// or form fields that reset when a parent selection changes.

// CONCEPT: Untracked - untracked(() => someSignal()) reads a signal's value
// WITHOUT registering it as a dependency. Use this when you need a value
// for computation but don't want to re-run when that specific signal changes.

// CONCEPT: Signals vs Observables - Signals are synchronous, glitch-free, and
// automatically tracked. Observables are async-first and require explicit subscription.
// Angular 19+ favors signals for state. Use Observables for events and HTTP.
```

## VERIFICATION
After implementation:
1. Theme toggle in toolbar switches between light/dark
2. Body class changes trigger CSS variable switch
3. Signals Playground page loads with all 6 interactive demos
4. Counter works with set/update
5. Computed shopping cart totals update reactively
6. Effect logger shows entries on every signal change
7. linkedSignal resets page on search change
8. untracked demo shows selective recomputation
