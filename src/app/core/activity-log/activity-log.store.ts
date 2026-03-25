import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { ActivityEntry } from './activity-log.models';

// CONCEPT: Event-driven store - ActivityLogStore receives generic activity entries
// from other stores and services. It does not know about products, orders, or users.
// This is full decoupling: the producer decides what to log, the log just stores it.
export const ActivityLogStore = signalStore(
  { providedIn: 'root' },

  withState({
    entries: [] as ActivityEntry[],
    maxEntries: 100,
  }),

  withComputed((store) => ({
    // CONCEPT: Computed - Derived slices of the activity log.
    // recentEntries gives consumers a quick view without processing the full list.
    recentEntries: computed(() => store.entries().slice(0, 20)),

    // CONCEPT: Computed - Aggregation by action type.
    // The dashboard uses this to show activity breakdown counts.
    entriesByAction: computed(() => {
      const entries = store.entries();
      const grouped: Record<string, number> = {};
      for (const entry of entries) {
        grouped[entry.action] = (grouped[entry.action] ?? 0) + 1;
      }
      return grouped;
    }),
  })),

  withMethods((store) => ({
    // CONCEPT: Event-driven store - Other stores/services call log() to record events.
    // The ActivityLogStore doesn't know about products or orders.
    // It just receives generic activity entries. Full decoupling.
    log(entry: Omit<ActivityEntry, 'id' | 'timestamp'>) {
      const fullEntry: ActivityEntry = {
        ...entry,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      patchState(store, (s) => ({
        entries: [fullEntry, ...s.entries].slice(0, s.maxEntries),
      }));
    },

    clear() {
      patchState(store, { entries: [] });
    },
  })),
);
