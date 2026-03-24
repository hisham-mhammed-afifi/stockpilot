import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

// CONCEPT: signalStoreFeature() - Creates a reusable plugin that can be added
// to ANY SignalStore via composition. Write once, use in every store.
// This eliminates the loading/error boilerplate from every store.
export function withLoading() {
  return signalStoreFeature(
    withState({
      loading: false,
      error: null as string | null,
    }),
    withComputed((state) => ({
      // CONCEPT: Computed - Derived boolean for template convenience.
      // Use hasError() in templates instead of error() !== null.
      hasError: computed(() => state.error() !== null),
    })),
    withMethods((store) => ({
      // CONCEPT: signalStoreFeature methods - These methods become part of
      // any store that composes withLoading(). Call store.setLoading() from
      // any rxMethod or method in the consuming store.
      setLoading() {
        patchState(store, { loading: true, error: null });
      },
      setLoaded() {
        patchState(store, { loading: false });
      },
      setError(error: string) {
        patchState(store, { loading: false, error });
      },
      clearError() {
        patchState(store, { error: null });
      },
    })),
  );
}
