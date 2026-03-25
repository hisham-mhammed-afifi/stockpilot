import { Injectable, effect, inject, untracked } from '@angular/core';
import { AuthStore } from '../auth/auth.store';
import { InventoryStore } from '../../features/inventory/store/inventory.store';
import { OrdersStore } from '../../features/orders/store/orders.store';
import { NotificationsStore } from '../notifications/notifications.store';
import { ActivityLogStore } from '../activity-log/activity-log.store';
import { User } from '../../shared/models/user.model';

// CONCEPT: Mediator Pattern - When multiple stores need to react to the same event,
// a coordinator prevents circular dependencies and centralizes the workflow.
// Without this, Store A injects Store B injects Store C injects Store A = circular.
// The coordinator is the ONLY place that knows about cross-store workflows.
@Injectable({ providedIn: 'root' })
export class StoreCoordinator {
  private authStore = inject(AuthStore);
  private inventoryStore = inject(InventoryStore);
  private ordersStore = inject(OrdersStore);
  private notificationsStore = inject(NotificationsStore);
  private activityLogStore = inject(ActivityLogStore);

  constructor() {
    // CONCEPT: effect() for cross-store coordination - React to auth changes
    // and trigger actions across multiple stores. This is a valid use of effect():
    // the reaction involves multiple external systems (other stores, notifications)
    // that cannot be expressed as a single computed().
    effect(() => {
      const user = this.authStore.user();
      const status = this.authStore.status();

      // CONCEPT: untracked() - Prevents the code inside from creating additional
      // signal dependencies. Without untracked(), reading signals inside onLogin()
      // would cause this effect to re-run when those signals change too.
      untracked(() => {
        if (status === 'authenticated' && user) {
          this.onLogin(user);
        }
      });
    });
  }

  // Called when a user successfully logs in
  onLogin(user: User) {
    // CONCEPT: Cross-store orchestration - A single event (login) triggers
    // actions across multiple independent stores. Each store stays focused
    // on its own domain. The coordinator knows the sequence.
    this.inventoryStore.loadProducts();
    this.ordersStore.loadOrders();
    this.notificationsStore.showSuccess(`Welcome back, ${user.firstName}!`);
    this.activityLogStore.log({
      action: 'user_login',
      description: `${user.firstName} ${user.lastName} logged in`,
      userId: user.id,
    });
  }

  // Called when user logs out
  onLogout() {
    this.activityLogStore.log({
      action: 'user_logout',
      description: 'User logged out',
      userId: this.authStore.user()?.id ?? null,
    });
    // Note: individual store cleanup happens in their own methods
    // The coordinator orchestrates the sequence
  }

  // Called when a product is added/updated/deleted in inventory
  onProductChange(
    action: 'product_added' | 'product_updated' | 'product_deleted',
    productTitle: string
  ) {
    this.activityLogStore.log({
      action,
      description: `Product "${productTitle}" was ${action.replace('product_', '')}`,
      userId: this.authStore.user()?.id ?? null,
    });
  }

  // Called when an order status changes
  onOrderStatusChange(orderId: number, newStatus: string) {
    this.activityLogStore.log({
      action: 'order_status_changed',
      description: `Order #${orderId} moved to "${newStatus}"`,
      userId: this.authStore.user()?.id ?? null,
    });
  }
}
