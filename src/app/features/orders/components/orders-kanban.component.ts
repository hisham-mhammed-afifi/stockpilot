import { Component, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import {
  CdkDragDrop,
  CdkDrag,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatIcon } from '@angular/material/icon';
import { MatButton } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { OrdersStore } from '../store/orders.store';
import { OrderCardComponent } from './order-card.component';
import { Order, OrderStatus } from '../models/order.model';

// CONCEPT: Architecture - This is a container (smart) component.
// It injects the store and wires up the UI to store methods.
// It delegates rendering to presentational components like OrderCardComponent.

@Component({
  selector: 'app-orders-kanban',
  standalone: true,
  imports: [
    CurrencyPipe,
    CdkDropList,
    CdkDrag,
    MatCard,
    MatCardContent,
    MatIcon,
    MatButton,
    MatButtonToggleModule,
    MatTabsModule,
    MatProgressBar,
    MatChipsModule,
    OrderCardComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      padding: 16px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 24px;
    }

    /* Stats row */
    .stats-row {
      display: flex;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }

    .stat-card {
      flex: 1;
      min-width: 160px;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .stat-label {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    /* Operator demo */
    .operator-demo {
      margin-bottom: 20px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-variant);
    }

    .operator-demo h3 {
      margin: 0 0 12px;
      font-size: 15px;
    }

    .operator-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 12px;
    }

    .operator-card {
      padding: 12px;
      border-radius: 8px;
      background: var(--mat-sys-surface);
    }

    .operator-card h4 {
      margin: 0 0 4px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .operator-card p {
      margin: 0;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .operator-card .used-by {
      margin-top: 6px;
      font-size: 11px;
      font-weight: 500;
      color: var(--mat-sys-primary);
    }

    /* Kanban board */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      min-height: 400px;
    }

    .kanban-column {
      background: var(--mat-sys-surface-variant);
      border-radius: 12px;
      padding: 12px;
      display: flex;
      flex-direction: column;
    }

    .column-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--mat-sys-outline-variant);
    }

    .column-title {
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .column-count {
      background: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 600;
    }

    .column-new .column-header { border-bottom-color: var(--status-new-text); }
    .column-processing .column-header { border-bottom-color: var(--status-processing-text); }
    .column-shipped .column-header { border-bottom-color: var(--status-shipped-text); }
    .column-delivered .column-header { border-bottom-color: var(--status-delivered-text); }

    .drop-list {
      flex: 1;
      min-height: 100px;
    }

    /* CDK drag-drop styles */
    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 8px;
      box-shadow: 0 5px 5px -3px rgba(0,0,0,.2),
                  0 8px 10px 1px rgba(0,0,0,.14),
                  0 3px 14px 2px rgba(0,0,0,.12);
    }

    .cdk-drag-placeholder {
      opacity: 0.3;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .drop-list.cdk-drop-list-dragging .order-card-wrapper:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .empty-column {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 80px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 13px;
      font-style: italic;
    }

    /* Filter tabs */
    .filter-section {
      margin-bottom: 16px;
    }

    @media (max-width: 960px) {
      .kanban-board {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .kanban-board {
        grid-template-columns: 1fr;
      }
    }
  `,
  template: `
    <div class="page-header">
      <h1>Orders Kanban</h1>
      <button mat-flat-button (click)="store.loadOrders()">
        <mat-icon>refresh</mat-icon>
        Reload
      </button>
    </div>

    @if (store.loading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <!-- Stats Row -->
    <div class="stats-row">
      <mat-card class="stat-card" appearance="outlined">
        <mat-card-content>
          <div class="stat-value">{{ store.totalOrders() }}</div>
          <div class="stat-label">Total Orders</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card" appearance="outlined">
        <mat-card-content>
          <div class="stat-value">{{ store.totalRevenue() | currency }}</div>
          <div class="stat-label">Total Revenue</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card" appearance="outlined">
        <mat-card-content>
          <div class="stat-value">
            {{ store.ordersByStatus().new.length }} /
            {{ store.ordersByStatus().processing.length }} /
            {{ store.ordersByStatus().shipped.length }} /
            {{ store.ordersByStatus().delivered.length }}
          </div>
          <div class="stat-label">New / Processing / Shipped / Delivered</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Operator Demo Panel -->
    <div class="operator-demo">
      <h3>Async Strategy Guide -- RxJS Flattening Operators</h3>
      <div class="operator-cards">
        <div class="operator-card">
          <h4>
            <mat-icon>swap_horiz</mat-icon>
            switchMap
          </h4>
          <p>
            "Latest wins." Cancels the previous request when a new one arrives.
            If you trigger loadOrders twice, the first HTTP call is cancelled.
          </p>
          <div class="used-by">Used by: Load Orders</div>
        </div>
        <div class="operator-card">
          <h4>
            <mat-icon>queue</mat-icon>
            concatMap
          </h4>
          <p>
            "Queue in order." Processes requests one by one, sequentially.
            Moving order A then order B ensures A's API call finishes first.
          </p>
          <div class="used-by">Used by: Update Status (+ optimistic update)</div>
        </div>
        <div class="operator-card">
          <h4>
            <mat-icon>block</mat-icon>
            exhaustMap
          </h4>
          <p>
            "Ignore while busy." Drops new requests while one is in-flight.
            Double-clicking delete only fires once.
          </p>
          <div class="used-by">Used by: Delete Order</div>
        </div>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-section">
      <mat-button-toggle-group
        [value]="store.statusFilter()"
        (change)="store.setStatusFilter($event.value)"
      >
        <mat-button-toggle value="all">All</mat-button-toggle>
        <mat-button-toggle value="new">New</mat-button-toggle>
        <mat-button-toggle value="processing">Processing</mat-button-toggle>
        <mat-button-toggle value="shipped">Shipped</mat-button-toggle>
        <mat-button-toggle value="delivered">Delivered</mat-button-toggle>
      </mat-button-toggle-group>
    </div>

    <!-- Kanban Board -->
    <div class="kanban-board">
      @for (column of columns; track column.status) {
        <div class="kanban-column" [class]="'column-' + column.status">
          <div class="column-header">
            <span class="column-title">{{ column.label }}</span>
            <span class="column-count">{{ getColumnOrders(column.status).length }}</span>
          </div>

          <div
            cdkDropList
            [id]="column.status"
            [cdkDropListData]="column.status"
            [cdkDropListConnectedTo]="connectedColumns(column.status)"
            (cdkDropListDropped)="onDrop($event)"
            class="drop-list"
          >
            @for (order of getColumnOrders(column.status); track order.id) {
              <div cdkDrag [cdkDragData]="order" class="order-card-wrapper">
                <app-order-card
                  [order]="order"
                  (statusChange)="store.updateOrderStatus($event)"
                  (delete)="store.deleteOrder($event)"
                />
              </div>
            } @empty {
              <div class="empty-column">No orders</div>
            }
          </div>
        </div>
      }
    </div>
  `,
})
export class OrdersKanbanComponent {
  // CONCEPT: Architecture - The container component injects the store directly.
  // All data flows through the store's signals, and all actions call store methods.
  protected readonly store = inject(OrdersStore);
  private readonly snackBar = inject(MatSnackBar);

  readonly columns: { status: OrderStatus; label: string }[] = [
    { status: 'new', label: 'New' },
    { status: 'processing', label: 'Processing' },
    { status: 'shipped', label: 'Shipped' },
    { status: 'delivered', label: 'Delivered' },
  ];

  private readonly allStatuses: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered'];

  constructor() {
    // CONCEPT: effect() - Reactive side effect that runs when signals change.
    // When the store's error signal changes to a non-null value,
    // we show a snackbar notification and then clear the error.
    effect(() => {
      const error = this.store.error();
      if (error) {
        this.snackBar.open(error, 'Dismiss', { duration: 5000 });
        this.store.clearError();
      }
    });
  }

  connectedColumns(status: OrderStatus): string[] {
    return this.allStatuses.filter((s) => s !== status);
  }

  getColumnOrders(status: OrderStatus): Order[] {
    const filter = this.store.statusFilter();
    if (filter !== 'all' && filter !== status) {
      return [];
    }
    return this.store.ordersByStatus()[status];
  }

  // CONCEPT: CDK DragDrop - When a card is dropped into a new column,
  // we extract the order and the target column's status, then call
  // store.updateOrderStatus(). The optimistic update in the store moves
  // the card instantly while the API call happens in the background.
  onDrop(event: CdkDragDrop<OrderStatus>) {
    if (event.previousContainer === event.container) {
      return; // Dropped in the same column -- nothing to do
    }

    const order = event.item.data as Order;
    const newStatus = event.container.data;

    this.store.updateOrderStatus({ id: order.id, status: newStatus });
  }
}
