import { computed } from '@angular/core';
import { signalStoreFeature, withState, withComputed, withMethods, patchState } from '@ngrx/signals';

// CONCEPT: Generic undo/redo - Works with any state shape.
// The feature maintains a history stack and a future stack.
// snapshot() saves current state, undo() pops from history, redo() pops from future.
// Usage: withUndoRedo<MyState>(['fieldA', 'fieldB']) tracks only those keys.
export function withUndoRedo<State extends Record<string, unknown>>(
  stateKeys: (keyof State)[]
) {
  return signalStoreFeature(
    withState({
      _undoHistory: [] as Partial<State>[],
      _redoFuture: [] as Partial<State>[],
    }),
    withComputed((state) => ({
      // CONCEPT: Computed - canUndo/canRedo drive button enabled/disabled state.
      // historyLength shows how many snapshots are saved (useful for badges).
      canUndo: computed(() => (state as any)._undoHistory().length > 0),
      canRedo: computed(() => (state as any)._redoFuture().length > 0),
      historyLength: computed(() => (state as any)._undoHistory().length),
    })),
    withMethods((store) => ({
      // CONCEPT: Undo/Redo architecture - Call snapshot() BEFORE making a change
      // to save the current state. The history stack grows with each snapshot.
      // undo() pops from history into redo. redo() does the inverse.
      snapshot() {
        const current: any = {};
        for (const key of stateKeys) {
          current[key] = (store as any)[key]();
        }
        patchState(store as any, (s: any) => ({
          _undoHistory: [...s._undoHistory, current].slice(-50), // Keep max 50 snapshots
          _redoFuture: [], // Clear redo stack on new action
        }));
      },
      undo() {
        const history = (store as any)._undoHistory();
        if (history.length === 0) return;
        // Save current state to redo stack before restoring
        const current: any = {};
        for (const key of stateKeys) {
          current[key] = (store as any)[key]();
        }
        const previous = history[history.length - 1];
        patchState(store as any, {
          ...previous,
          _undoHistory: history.slice(0, -1),
          _redoFuture: [...(store as any)._redoFuture(), current],
        });
      },
      redo() {
        const future = (store as any)._redoFuture();
        if (future.length === 0) return;
        // Save current state to undo stack before restoring
        const current: any = {};
        for (const key of stateKeys) {
          current[key] = (store as any)[key]();
        }
        const next = future[future.length - 1];
        patchState(store as any, {
          ...next,
          _redoFuture: future.slice(0, -1),
          _undoHistory: [...(store as any)._undoHistory(), current],
        });
      },
      clearHistory() {
        patchState(store as any, { _undoHistory: [], _redoFuture: [] });
      },
    })),
  );
}
