import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

// CONCEPT: Parameterized features - Accept configuration via function arguments.
// This makes the feature flexible: withPagination({ pageSize: 10 }) vs withPagination({ pageSize: 50 }).
export function withPagination(config?: { pageSize?: number }) {
  const pageSize = config?.pageSize ?? 20;

  return signalStoreFeature(
    withState({
      currentPage: 1,
      pageSize,
      totalItems: 0,
    }),
    withComputed((state) => ({
      // CONCEPT: Computed - All pagination math is derived from 3 base signals.
      // No manual recalculation needed -- change currentPage and everything updates.
      totalPages: computed(() => Math.ceil(state.totalItems() / state.pageSize())),
      skip: computed(() => (state.currentPage() - 1) * state.pageSize()),
      hasNextPage: computed(() => state.currentPage() < Math.ceil(state.totalItems() / state.pageSize())),
      hasPrevPage: computed(() => state.currentPage() > 1),
      paginationInfo: computed(() => ({
        page: state.currentPage(),
        pageSize: state.pageSize(),
        total: state.totalItems(),
        totalPages: Math.ceil(state.totalItems() / state.pageSize()),
        showing: {
          from: (state.currentPage() - 1) * state.pageSize() + 1,
          to: Math.min(state.currentPage() * state.pageSize(), state.totalItems()),
        },
      })),
    })),
    withMethods((store) => ({
      nextPage() {
        patchState(store, (s) => ({
          currentPage: Math.min(s.currentPage + 1, Math.ceil(s.totalItems / s.pageSize)),
        }));
      },
      prevPage() {
        patchState(store, (s) => ({
          currentPage: Math.max(s.currentPage - 1, 1),
        }));
      },
      goToPage(page: number) {
        patchState(store, { currentPage: page });
      },
      setTotalItems(total: number) {
        patchState(store, { totalItems: total });
      },
      resetPagination() {
        patchState(store, { currentPage: 1 });
      },
      setPageSize(size: number) {
        patchState(store, { pageSize: size, currentPage: 1 });
      },
    })),
  );
}
