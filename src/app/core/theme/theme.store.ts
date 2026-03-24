import { Injectable, signal, computed, effect } from '@angular/core';

// CONCEPT: Signal - This service uses raw signals (not SignalStore) to manage theme state.
// Signals are Angular's reactive primitive: synchronous, glitch-free, and automatically tracked.
// Any template or computed() that reads a signal is automatically re-evaluated when it changes.

@Injectable({ providedIn: 'root' })
export class ThemeService {
  // CONCEPT: Signal - signal<T>(initialValue) creates a writable reactive container.
  // Unlike BehaviorSubject, there's no .subscribe(). Reading _theme() in a
  // template or computed() auto-registers the consumer for change detection updates.
  // We keep it private so only this service can write to it.
  private readonly _theme = signal<'light' | 'dark' | 'system'>('system');

  // CONCEPT: Signal - .asReadonly() exposes a read-only view of the signal.
  // External consumers can read theme() but cannot call .set() or .update() on it.
  // This enforces a clear boundary: only the service controls state mutations.
  readonly theme = this._theme.asReadonly();

  // CONCEPT: Computed - computed() derives a read-only signal from other signals.
  // It is LAZY (won't run until someone reads it) and CACHED (multiple reads
  // with unchanged deps return the memoized value). If read 100 times with
  // the same _theme value, the computation runs only once.
  // NEVER put side effects inside computed() -- it's for pure derivation only.
  readonly isDark = computed(() => {
    const t = this._theme();
    if (t === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return t === 'dark';
  });

  readonly icon = computed(() => this.isDark() ? 'dark_mode' : 'light_mode');

  constructor() {
    // CONCEPT: Effect - effect() is the ONLY place for side effects in the signal world.
    // DOM manipulation, localStorage writes, analytics events, logging.
    // It runs in an injection context so it auto-cleans up when the service is destroyed.
    // Here we sync the signal value to the DOM (document.body class).
    // NEVER use effect() to update other signals -- use computed() instead.
    effect(() => {
      const dark = this.isDark();
      document.body.classList.toggle('dark-theme', dark);
      document.body.classList.toggle('light-theme', !dark);
    });
  }

  // CONCEPT: Signal - .set() replaces the current value directly.
  // Use .set() when you have the new value and don't need the old one.
  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this._theme.set(theme);
  }

  toggleTheme(): void {
    // CONCEPT: Signal - .update() takes the current value and returns a new one.
    // Use .update() when the new value depends on the current value.
    // Use .set() when you have the new value directly.
    this._theme.update(current => {
      if (current === 'system') {
        // When in system mode, toggle to the opposite of the resolved value.
        // Otherwise 'system' (dark) -> 'dark' would produce no visible change.
        return this.isDark() ? 'light' : 'dark';
      }
      return current === 'dark' ? 'light' : 'dark';
    });
  }
}
