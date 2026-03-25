import { computed } from '@angular/core';
import { signalStore, withState, withComputed, withMethods, patchState } from '@ngrx/signals';
import { AppNotification } from './notifications.models';

// CONCEPT: Notification queue - A global state pattern. Any component or store
// can push notifications by injecting NotificationsStore and calling showSuccess(), etc.
// The notification component reads visibleNotifications() and renders them.
// This decouples "what happened" (store) from "how to show it" (component).
export const NotificationsStore = signalStore(
  { providedIn: 'root' },

  withState({
    notifications: [] as AppNotification[],
    maxVisible: 5,
  }),

  withComputed((store) => ({
    visibleNotifications: computed(() =>
      store.notifications().slice(0, store.maxVisible())
    ),
    unreadCount: computed(() => store.notifications().length),
    hasNotifications: computed(() => store.notifications().length > 0),
  })),

  withMethods((store) => {
    // CONCEPT: Private helper - _add is the internal method that creates a notification,
    // adds it to the queue, and sets up auto-dismiss. The public methods (showSuccess, etc.)
    // are convenience wrappers with preset type and duration.
    function _add(partial: Omit<AppNotification, 'id' | 'timestamp'>) {
      const notification: AppNotification = {
        ...partial,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };
      patchState(store, (s) => ({
        notifications: [notification, ...s.notifications],
      }));
      // Auto-dismiss after duration
      if (partial.duration && partial.duration > 0) {
        setTimeout(() => dismiss(notification.id), partial.duration);
      }
    }

    function dismiss(id: string) {
      patchState(store, (s) => ({
        notifications: s.notifications.filter(n => n.id !== id),
      }));
    }

    return {
      showSuccess(message: string) {
        _add({ message, type: 'success', duration: 3000 });
      },
      showError(message: string) {
        _add({ message, type: 'error', duration: 5000 });
      },
      showInfo(message: string) {
        _add({ message, type: 'info', duration: 3000 });
      },
      showWarning(message: string) {
        _add({ message, type: 'warning', duration: 4000 });
      },
      dismiss,
      clearAll() {
        patchState(store, { notifications: [] });
      },
    };
  }),
);
