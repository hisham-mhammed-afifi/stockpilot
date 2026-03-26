import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  effect,
  linkedSignal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardHeader, MatCardContent, MatCardTitle, MatCardSubtitle } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatFormField, MatLabel, MatPrefix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatChipsModule } from '@angular/material/chips';
import { MatDivider } from '@angular/material/divider';
import { BehaviorSubject, map } from 'rxjs';
import { AsyncPipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-signals-playground',
  standalone: true,
  imports: [
    FormsModule,
    MatCard,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCardSubtitle,
    MatButton,
    MatIconButton,
    MatIcon,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatInput,
    MatListModule,
    MatChipsModule,
    MatDivider,
    AsyncPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Signals Playground</h1>
    <p class="page-subtitle">Interactive demos for every Angular signal concept</p>

    <!-- ====== PART A: signal() - Counter ====== -->
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>tag</mat-icon>
        <mat-card-title>signal() - Writable Reactive Primitive</mat-card-title>
        <mat-card-subtitle>Create, read, and write reactive state</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="demo-area">
          <div class="counter-display">
            <span class="counter-value">{{ count() }}</span>
          </div>
          <div class="button-row">
            <button mat-raised-button (click)="decrement()">
              <mat-icon>remove</mat-icon> Decrement
            </button>
            <button mat-raised-button (click)="increment()">
              <mat-icon>add</mat-icon> Increment
            </button>
            <button mat-flat-button (click)="resetCount()">
              Reset
            </button>
            <button mat-flat-button (click)="setTo100()">
              Set to 100
            </button>
          </div>
        </div>
        <pre class="code-block"><code>// CONCEPT: signal() creates a writable reactive container
const count = signal(0);

// Reading: call the signal as a function
template: \`{{ '{{' }} count() {{ '}}' }}\`

// Writing with .set() - replace the value directly
count.set(100);

// Writing with .update() - derive from current value
count.update(c => c + 1);</code></pre>
      </mat-card-content>
    </mat-card>

    <!-- ====== PART B: computed() - Shopping Cart ====== -->
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>functions</mat-icon>
        <mat-card-title>computed() - Derived Read-Only State</mat-card-title>
        <mat-card-subtitle>Automatically derived values that update when dependencies change</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="demo-area">
          <div class="cart-table">
            <div class="cart-header">
              <span>Product</span><span>Price</span><span>Qty</span><span>Subtotal</span>
            </div>
            @for (product of products; track product.name; let i = $index) {
              <div class="cart-row">
                <span>{{ product.name }}</span>
                <span>\${{ product.price }}</span>
                <span>
                  <mat-form-field class="qty-field">
                    <input matInput type="number" min="0" max="99"
                      [value]="quantities()[i]"
                      (input)="updateQuantity(i, $event)" />
                  </mat-form-field>
                </span>
                <span class="subtotal">\${{ subtotals()[i] }}</span>
              </div>
            }
            <mat-divider />
            <div class="cart-summary">
              <div>Items: <strong>{{ itemCount() }}</strong></div>
              <div>Total: <strong>\${{ cartTotal() }}</strong></div>
              @if (hasDiscount()) {
                <mat-chip class="discount-chip" highlighted>
                  <mat-icon matChipAvatar>local_offer</mat-icon>
                  Discount unlocked! (more than 3 items)
                </mat-chip>
              }
            </div>
          </div>
        </div>
        <pre class="code-block"><code>// CONCEPT: computed() derives state from other signals.
// It is LAZY (won't run until read) and CACHED
// (multiple reads with same deps return memoized value).
const quantity1 = signal(1);
const quantity2 = signal(0);

const cartTotal = computed(() =>
  quantity1() * 29.99 + quantity2() * 49.99
);

// cartTotal() auto-updates when any quantity changes.
// No subscriptions. No manual recalculation.</code></pre>
      </mat-card-content>
    </mat-card>

    <!-- ====== PART C: effect() - Logger ====== -->
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>bolt</mat-icon>
        <mat-card-title>effect() - Side Effects</mat-card-title>
        <mat-card-subtitle>React to signal changes with side effects (DOM, logging, localStorage)</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="demo-area">
          <mat-form-field class="full-width">
            <mat-label>Type something...</mat-label>
            <input matInput [value]="inputValue()" (input)="onInputChange($event)" />
          </mat-form-field>
          <div class="console-panel">
            <div class="console-header">
              <mat-icon>terminal</mat-icon> Effect Console
              <button mat-icon-button class="clear-btn" (click)="clearLogs()">
                <mat-icon>delete_sweep</mat-icon>
              </button>
            </div>
            <div class="console-body">
              @for (log of logs(); track $index) {
                <div class="console-line">{{ log }}</div>
              } @empty {
                <div class="console-line console-empty">Waiting for input changes...</div>
              }
            </div>
          </div>
          <div class="warning-banner">
            <mat-icon>warning</mat-icon>
            <span>Never use effect() to set other signals. Use computed() instead.</span>
          </div>
        </div>
        <pre class="code-block"><code>// CONCEPT: effect() runs a side effect whenever tracked signals change.
// It runs in an injection context -- auto-cleans up on destroy.
// Use ONLY for: DOM manipulation, localStorage, logging, analytics.
const inputValue = signal('');

effect(() => {{ '{' }}
  console.log('Input changed to:', inputValue());
  // This runs every time inputValue changes.
  // The dependency is tracked automatically.
{{ '}' }});</code></pre>
      </mat-card-content>
    </mat-card>

    <!-- ====== PART D: linkedSignal() - Search + Pagination ====== -->
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>link</mat-icon>
        <mat-card-title>linkedSignal() - Resettable Derived State</mat-card-title>
        <mat-card-subtitle>A writable signal that auto-resets when its source changes</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="demo-area">
          <mat-form-field class="full-width">
            <mat-label>Search query</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input matInput [value]="searchQuery()" (input)="onSearchChange($event)" />
          </mat-form-field>
          <div class="pagination-display">
            <span>Page: <strong>{{ currentPage() }}</strong></span>
            <div class="button-row">
              <button mat-raised-button [disabled]="currentPage() <= 1" (click)="prevPage()">
                <mat-icon>chevron_left</mat-icon> Previous
              </button>
              <button mat-raised-button (click)="nextPage()">
                Next <mat-icon iconPositionEnd>chevron_right</mat-icon>
              </button>
            </div>
          </div>
          <div class="hint-text">
            Try: type in search (page resets to 1), click Next (page goes to 2), type again (back to 1).
          </div>
        </div>
        <pre class="code-block"><code>// CONCEPT: linkedSignal() creates a writable signal that auto-resets
// when its source changes. Perfect for pagination that resets on
// new search, or form fields that reset when a parent changes.
const searchQuery = signal('');

const currentPage = linkedSignal(() => {{ '{' }}
  searchQuery(); // track the source
  return 1;      // reset to page 1 whenever search changes
{{ '}' }});

// You can still write to it manually:
currentPage.set(5);
// But it snaps back to 1 when searchQuery changes.</code></pre>
      </mat-card-content>
    </mat-card>

    <!-- ====== PART E: untracked() ====== -->
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>visibility_off</mat-icon>
        <mat-card-title>untracked() - Break Dependency Tracking</mat-card-title>
        <mat-card-subtitle>Read a signal's value without registering it as a dependency</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="demo-area">
          <div class="tracking-grid">
            <div class="tracking-col">
              <div class="tracking-label">tracked signal</div>
              <div class="tracking-value">{{ trackedSig() }}</div>
              <button mat-raised-button (click)="incrementTracked()">
                Update tracked
              </button>
            </div>
            <div class="tracking-col">
              <div class="tracking-label">NOT tracked signal</div>
              <div class="tracking-value">{{ notTrackedSig() }}</div>
              <button mat-raised-button (click)="incrementNotTracked()">
                Update notTracked
              </button>
            </div>
            <div class="tracking-col result-col">
              <div class="tracking-label">computed result</div>
              <div class="tracking-value">{{ untrackedResult() }}</div>
              <mat-chip highlighted>
                Recalculated {{ computeCount() }} times
              </mat-chip>
            </div>
          </div>
          <div class="hint-text">
            Updating "tracked" causes recomputation. Updating "notTracked" does NOT.
          </div>
        </div>
        <pre class="code-block"><code>// CONCEPT: untracked() reads a signal's value WITHOUT registering
// it as a dependency. Use when you need a value for computation
// but don't want to re-run when that specific signal changes.
const tracked = signal(0);
const notTracked = signal(0);

const result = computed(() => {{ '{' }}
  const a = tracked();                        // dependency tracked
  const b = untracked(() => notTracked());    // value read, NOT tracked
  return a + b;
{{ '}' }});
// result recalculates when tracked changes, but NOT when notTracked changes.</code></pre>
      </mat-card-content>
    </mat-card>

    <!-- ====== PART F: Signals vs BehaviorSubject ====== -->
    <mat-card class="demo-card">
      <mat-card-header>
        <mat-icon mat-card-avatar>compare_arrows</mat-icon>
        <mat-card-title>Signals vs BehaviorSubject - Same Feature, Two Ways</mat-card-title>
        <mat-card-subtitle>Compare the reactive approaches side by side</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="demo-area">
          <div class="comparison-grid">
            <div class="comparison-col">
              <h3>BehaviorSubject (RxJS)</h3>
              <div class="comparison-demo">
                <div class="counter-display small">{{ rxCounter$ | async }}</div>
                <div>Doubled: {{ rxDoubled$ | async }}</div>
                <div class="button-row">
                  <button mat-raised-button (click)="rxDecrement()">-</button>
                  <button mat-raised-button (click)="rxIncrement()">+</button>
                </div>
              </div>
              <pre class="code-block"><code>// RxJS approach (8 lines)
counter$ = new BehaviorSubject(0);
doubled$ = this.counter$.pipe(
  map(v => v * 2)
);

// Template needs async pipe:
// {{ '{{' }} counter$ | async {{ '}}' }}
// Must manage subscriptions!</code></pre>
            </div>
            <div class="comparison-col">
              <h3>Signals (Angular)</h3>
              <div class="comparison-demo">
                <div class="counter-display small">{{ sigCounter() }}</div>
                <div>Doubled: {{ sigDoubled() }}</div>
                <div class="button-row">
                  <button mat-raised-button (click)="sigDecrement()">-</button>
                  <button mat-raised-button (click)="sigIncrement()">+</button>
                </div>
              </div>
              <pre class="code-block"><code>// Signals approach (4 lines)
counter = signal(0);
doubled = computed(
  () => this.counter() * 2
);

// Template reads directly:
// {{ '{{' }} counter() {{ '}}' }}
// No subscriptions needed!</code></pre>
            </div>
          </div>
          <div class="comparison-summary">
            <mat-chip-set>
              <mat-chip>Signals: 4 lines</mat-chip>
              <mat-chip>BehaviorSubject: 8 lines</mat-chip>
              <mat-chip highlighted>Signals: no subscription management</mat-chip>
            </mat-chip-set>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    :host {
      display: block;
      max-width: 960px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 28px;
      font-weight: 500;
      margin: 0 0 4px;
    }

    .page-subtitle {
      color: var(--text-secondary, rgba(0, 0, 0, 0.54));
      margin: 0 0 24px;
    }

    .demo-card {
      margin-bottom: 24px;
    }

    .demo-area {
      padding: 16px 0;
    }

    .button-row {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      align-items: center;
    }

    /* Part A: Counter */
    .counter-display {
      font-size: 48px;
      font-weight: 700;
      text-align: center;
      padding: 16px;
      font-family: 'Roboto Mono', monospace;
    }

    .counter-display.small {
      font-size: 32px;
      padding: 8px;
    }

    .counter-value {
      display: inline-block;
      min-width: 80px;
    }

    /* Part B: Shopping Cart */
    .cart-table {
      width: 100%;
    }

    .cart-header, .cart-row {
      display: grid;
      grid-template-columns: 2fr 1fr 100px 1fr;
      align-items: center;
      padding: 8px 0;
      gap: 8px;
    }

    .cart-header {
      font-weight: 500;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .qty-field {
      width: 70px;
    }

    .subtotal {
      font-weight: 500;
    }

    .cart-summary {
      display: flex;
      gap: 16px;
      align-items: center;
      padding: 12px 0;
      flex-wrap: wrap;
    }

    .discount-chip {
      --mat-chip-label-text-color: var(--mat-sys-on-primary);
    }

    /* Part C: Effect Logger */
    .full-width {
      width: 100%;
    }

    .console-panel {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 8px;
      overflow: hidden;
      margin: 8px 0;
    }

    .console-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface);
      font-family: 'Roboto Mono', monospace;
      font-size: 13px;
    }

    .clear-btn {
      margin-left: auto;
      color: var(--mat-sys-on-surface-variant);
    }

    .console-body {
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-primary);
      font-family: 'Roboto Mono', monospace;
      font-size: 13px;
      padding: 12px;
      max-height: 160px;
      overflow-y: auto;
    }

    .console-line {
      padding: 2px 0;
    }

    .console-empty {
      color: rgba(255, 255, 255, 0.3);
    }

    .warning-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: var(--warning-bg, #fff3e0);
      color: var(--warning-text, #e65100);
      border-radius: 8px;
      margin-top: 8px;
      font-size: 14px;
    }

    /* Part D: Pagination */
    .pagination-display {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 18px;
    }

    .hint-text {
      color: var(--text-secondary, rgba(0, 0, 0, 0.54));
      font-size: 13px;
      font-style: italic;
      padding: 4px 0;
    }

    /* Part E: Untracked */
    .tracking-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 16px;
      text-align: center;
    }

    .tracking-label {
      font-weight: 500;
      margin-bottom: 8px;
      font-size: 14px;
    }

    .tracking-value {
      font-size: 36px;
      font-weight: 700;
      font-family: 'Roboto Mono', monospace;
      margin-bottom: 12px;
    }

    .result-col {
      background: var(--mat-sys-surface-variant, rgba(0, 0, 0, 0.04));
      border-radius: 8px;
      padding: 12px;
    }

    /* Part F: Comparison */
    .comparison-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .comparison-col h3 {
      text-align: center;
      margin: 0 0 12px;
    }

    .comparison-demo {
      text-align: center;
      padding: 8px;
    }

    .comparison-demo .button-row {
      justify-content: center;
      margin-top: 8px;
    }

    .comparison-summary {
      display: flex;
      justify-content: center;
      padding: 16px 0 0;
    }

    /* Code blocks */
    .code-block {
      background: var(--bg-card, #f5f5f5);
      border: 1px solid var(--mat-sys-outline-variant, rgba(0, 0, 0, 0.08));
      color: var(--text-primary, #212121);
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      font-family: 'Roboto Mono', monospace;
      font-size: 13px;
      line-height: 1.5;
      margin: 12px 0 0;
    }

    @media (max-width: 599px) {
      .tracking-grid {
        grid-template-columns: 1fr;
      }
      .comparison-grid {
        grid-template-columns: 1fr;
      }
      .cart-header, .cart-row {
        grid-template-columns: 1fr 1fr;
      }
    }
  `,
})
export class SignalsPlaygroundComponent {

  // ============================================================
  // PART A: signal() - Counter
  // ============================================================

  // CONCEPT: Signal - signal<T>(initialValue) creates a writable reactive container.
  // Reading count() in the template auto-tracks it for change detection.
  count = signal(0);

  increment(): void {
    // CONCEPT: Signal - .update() takes the current value and returns a new one.
    // Use when the new value depends on the current value.
    this.count.update(c => c + 1);
  }

  decrement(): void {
    this.count.update(c => c - 1);
  }

  resetCount(): void {
    // CONCEPT: Signal - .set() replaces the value directly.
    // Use when you have the new value and don't need the old one.
    this.count.set(0);
  }

  setTo100(): void {
    this.count.set(100);
  }

  // ============================================================
  // PART B: computed() - Shopping Cart
  // ============================================================

  // CONCEPT: Signal - Each product quantity is its own signal.
  // This gives fine-grained reactivity: changing one quantity only
  // recalculates the computeds that depend on it.
  readonly products = [
    { name: 'Wireless Mouse', price: 29.99 },
    { name: 'Mechanical Keyboard', price: 79.99 },
    { name: 'USB-C Hub', price: 49.99 },
  ];

  private readonly _quantities = [signal(1), signal(0), signal(0)];

  // CONCEPT: Computed - computed() derives a read-only signal from other signals.
  // quantities() returns a snapshot array of all quantity values.
  readonly quantities = computed(() => this._quantities.map(q => q()));

  // CONCEPT: Computed - Each subtotal is derived from its quantity and price.
  // These only recalculate when their specific quantity changes.
  readonly subtotals = computed(() =>
    this.products.map((p, i) =>
      (this._quantities[i]() * p.price).toFixed(2)
    )
  );

  readonly itemCount = computed(() =>
    this._quantities.reduce((sum, q) => sum + q(), 0)
  );

  readonly cartTotal = computed(() =>
    this.products
      .reduce((sum, p, i) => sum + this._quantities[i]() * p.price, 0)
      .toFixed(2)
  );

  // CONCEPT: Computed - Derived boolean. Automatically updates when itemCount changes.
  // No manual recalculation, no event wiring, no subscriptions.
  readonly hasDiscount = computed(() => this.itemCount() > 3);

  updateQuantity(index: number, event: Event): void {
    const value = Math.max(0, +(event.target as HTMLInputElement).value || 0);
    this._quantities[index].set(value);
  }

  // ============================================================
  // PART C: effect() - Logger
  // ============================================================

  // CONCEPT: Signal - inputValue holds the current text input value.
  readonly inputValue = signal('');

  // CONCEPT: Signal - logs accumulates effect output for display.
  readonly logs = signal<string[]>([]);

  constructor() {
    // CONCEPT: Effect - effect() runs a side effect whenever tracked signals change.
    // It auto-tracks inputValue() and fires on every change.
    // Effects should ONLY be used for side effects (DOM, localStorage, logging).
    // NEVER use effect() to update other signals -- use computed() instead.
    effect(() => {
      const val = this.inputValue();
      if (val !== '') {
        const timestamp = new Date().toLocaleTimeString();
        // We use untracked here to avoid tracking logs as a dependency,
        // which would create an infinite loop.
        const currentLogs = untracked(() => this.logs());
        this.logs.set([...currentLogs, `[${timestamp}] Input changed to: "${val}"`]);
      }
    });
  }

  onInputChange(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
  }

  clearLogs(): void {
    this.logs.set([]);
  }

  // ============================================================
  // PART D: linkedSignal() - Search + Pagination
  // ============================================================

  // CONCEPT: Signal - searchQuery holds the current search text.
  readonly searchQuery = signal('');

  // CONCEPT: LinkedSignal - linkedSignal() creates a writable signal that auto-resets
  // when its source changes. Perfect for pagination that resets on new search,
  // or form fields that reset when a parent selection changes.
  // When searchQuery changes, currentPage snaps back to 1.
  // But you can still manually .set() or .update() it (e.g., next/prev page).
  readonly currentPage = linkedSignal(() => {
    this.searchQuery(); // track the source
    return 1;           // reset to page 1 whenever search changes
  });

  onSearchChange(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  nextPage(): void {
    this.currentPage.update(p => p + 1);
  }

  prevPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  // ============================================================
  // PART E: untracked() - Selective Tracking
  // ============================================================

  // CONCEPT: Signal - Two signals to demonstrate tracked vs untracked reads.
  readonly trackedSig = signal(0);
  readonly notTrackedSig = signal(0);

  // We use a separate signal to count recomputations because computed is pure.
  private _computeCount = 0;
  readonly computeCount = signal(0);

  // CONCEPT: Untracked - untracked(() => someSignal()) reads a signal's value
  // WITHOUT registering it as a dependency. The computed only re-runs
  // when trackedSig changes, not when notTrackedSig changes.
  readonly untrackedResult = computed(() => {
    const a = this.trackedSig();                       // dependency IS tracked
    const b = untracked(() => this.notTrackedSig());   // value read, NOT tracked
    this._computeCount++;
    // We update computeCount outside the computed to avoid signal-in-computed writes.
    // This is a teaching compromise to show the count visually.
    queueMicrotask(() => this.computeCount.set(this._computeCount));
    return a + b;
  });

  incrementTracked(): void {
    this.trackedSig.update(v => v + 1);
  }

  incrementNotTracked(): void {
    this.notTrackedSig.update(v => v + 1);
  }

  // ============================================================
  // PART F: Signals vs BehaviorSubject
  // ============================================================

  // --- RxJS BehaviorSubject approach ---
  // CONCEPT: Signals vs Observables - BehaviorSubject is the RxJS equivalent
  // of a signal: it holds a current value and emits on change.
  // But it requires .pipe(), map(), async pipe, and subscription management.
  readonly rxCounter$ = new BehaviorSubject(0);
  readonly rxDoubled$ = this.rxCounter$.pipe(
    // CONCEPT: Signals vs Observables - .pipe(map(...)) derives state in RxJS.
    // Every derived value needs its own pipe chain.
    map(v => v * 2),
    takeUntilDestroyed(),
  );

  rxIncrement(): void { this.rxCounter$.next(this.rxCounter$.value + 1); }
  rxDecrement(): void { this.rxCounter$.next(this.rxCounter$.value - 1); }

  // --- Signal approach ---
  // CONCEPT: Signals vs Observables - Signals are synchronous, glitch-free,
  // and automatically tracked. No subscriptions, no async pipe, no cleanup.
  // Angular 19+ favors signals for state. Use Observables for events and HTTP.
  readonly sigCounter = signal(0);
  readonly sigDoubled = computed(() => this.sigCounter() * 2);

  sigIncrement(): void { this.sigCounter.update(c => c + 1); }
  sigDecrement(): void { this.sigCounter.update(c => c - 1); }
}
