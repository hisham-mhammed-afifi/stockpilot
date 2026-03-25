// CONCEPT: Event-driven store models - ActivityEntry is a generic event record.
// It does not reference Product, Order, or User types directly.
// This keeps the activity log fully decoupled from feature stores.
export interface ActivityEntry {
  id: string;
  action:
    | 'product_added'
    | 'product_updated'
    | 'product_deleted'
    | 'order_status_changed'
    | 'order_created'
    | 'order_deleted'
    | 'user_login'
    | 'user_logout';
  description: string;
  timestamp: number;
  userId: number | null;
  metadata?: Record<string, unknown>;
}
