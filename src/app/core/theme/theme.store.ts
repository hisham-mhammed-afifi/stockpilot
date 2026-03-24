import { computed, effect } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, withHooks, patchState } from '@ngrx/signals';
import { withLocalStorage } from '../../shared/store-features/with-local-storage';

// CONCEPT: signalStoreFeature composition - Previously this was an @Injectable class
// with raw signals. Now it is a SignalStore that composes withLocalStorage() for
// automatic theme persistence. Zero manual localStorage code in this file.

export const ThemeStore = signalStore(
  { providedIn: 'root' },

  withState({
    theme: 'system' as 'light' | 'dark' | 'system',
  }),

  // CONCEPT: withLocalStorage - This single line replaces all manual localStorage
  // read/write logic. The theme preference is saved automatically on every change
  // and restored when the app loads. Write once, reuse everywhere.
  withLocalStorage('stockpilot-theme', ['theme']),

  withComputed((state) => ({
    // CONCEPT: Computed - Pure derivation from the theme signal.
    // isDark resolves 'system' to the OS preference, 'light'/'dark' map directly.
    isDark: computed(() => {
      const t = state.theme();
      if (t === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      return t === 'dark';
    }),
    icon: computed(() => {
      const t = state.theme();
      if (t === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark_mode' : 'light_mode';
      }
      return t === 'dark' ? 'dark_mode' : 'light_mode';
    }),
  })),

  withMethods((store) => ({
    setTheme(theme: 'light' | 'dark' | 'system') {
      patchState(store, { theme });
    },
    toggleTheme() {
      patchState(store, (s) => {
        if (s.theme === 'system') {
          // When in system mode, toggle to the opposite of the resolved value
          const next: 'light' | 'dark' = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'dark';
          return { theme: next };
        }
        const next: 'light' | 'dark' = s.theme === 'dark' ? 'light' : 'dark';
        return { theme: next };
      });
    },
  })),

  // CONCEPT: withHooks - Side effects (DOM manipulation) go in onInit.
  // effect() tracks isDark and syncs the body class whenever it changes.
  withHooks((store) => ({
    onInit() {
      effect(() => {
        const dark = store.isDark();
        document.body.classList.toggle('dark-theme', dark);
        document.body.classList.toggle('light-theme', !dark);
      });
    },
  })),
);
