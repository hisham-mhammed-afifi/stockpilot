import { effect, untracked } from '@angular/core';
import { signalStoreFeature, withMethods, withHooks, patchState } from '@ngrx/signals';

// CONCEPT: Persistence feature - Automatically saves/restores state to localStorage.
// Combined with withHooks, it loads saved state on init and saves on every change.
// Usage: withLocalStorage('my-key', ['fieldA', 'fieldB']) persists those fields.
export function withLocalStorage<Key extends string>(
  storageKey: string,
  keys: Key[]
) {
  return signalStoreFeature(
    withMethods((store) => ({
      _saveToStorage() {
        const data: Record<string, unknown> = {};
        for (const key of keys) {
          data[key] = (store as Record<string, () => unknown>)[key]();
        }
        try {
          localStorage.setItem(storageKey, JSON.stringify(data));
        } catch { /* quota exceeded, silently fail */ }
      },
      _loadFromStorage(): Partial<Record<Key, unknown>> | null {
        try {
          const raw = localStorage.getItem(storageKey);
          return raw ? JSON.parse(raw) : null;
        } catch {
          return null;
        }
      },
    })),
    // CONCEPT: withHooks - onInit runs once when the store is first injected.
    // We restore persisted state here, then set up auto-save effects.
    withHooks({
      onInit(store: Record<string, unknown>) {
        const typedStore = store as Record<string, () => unknown> & {
          _loadFromStorage: () => Partial<Record<Key, unknown>> | null;
          _saveToStorage: () => void;
        };
        // Restore saved state on initialization
        const saved = typedStore._loadFromStorage();
        if (saved) {
          patchState(store as Parameters<typeof patchState>[0], saved);
        }
        // CONCEPT: effect() for persistence - Each tracked key gets an effect
        // that auto-saves whenever that signal changes. untracked() prevents
        // the save itself from creating circular dependency.
        for (const key of keys) {
          effect(() => {
            (store as Record<string, () => unknown>)[key](); // Track the signal
            untracked(() => typedStore._saveToStorage());
          });
        }
      },
    }),
  );
}
