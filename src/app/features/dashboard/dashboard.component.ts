import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe, CurrencyPipe, KeyValuePipe, TitleCasePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { DashboardStore } from './store/dashboard.store';

// CONCEPT: Architecture - Components never call API services directly. They go through the store.
// DashboardComponent injects only DashboardStore. All data -- inventory stats, order metrics,
// activity logs, todos -- flows through the store's computed signals.
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    DatePipe,
    CurrencyPipe,
    KeyValuePipe,
    TitleCasePipe,
    MatCardModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatChipsModule,
    MatCheckboxModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="page-title">Dashboard</h1>

    @if (store.currentUser(); as user) {
      <p class="welcome">Welcome back, {{ user.firstName }}!</p>
    }

    <!-- Row 1: Summary Cards -->
    <div class="summary-grid">
      <mat-card class="summary-card">
        <mat-card-content>
          <div class="card-row">
            <mat-icon class="card-icon products">inventory_2</mat-icon>
            <div>
              <div class="card-value">{{ store.dashboardSummary().totalProducts }}</div>
              <div class="card-label">Total Products</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-content>
          <div class="card-row">
            <mat-icon class="card-icon orders">receipt_long</mat-icon>
            <div>
              <div class="card-value">{{ store.dashboardSummary().totalOrders }}</div>
              <div class="card-label">Total Orders</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-content>
          <div class="card-row">
            <mat-icon class="card-icon revenue">attach_money</mat-icon>
            <div>
              <div class="card-value">{{ store.dashboardSummary().totalRevenue | currency }}</div>
              <div class="card-label">Total Revenue</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>

      <mat-card class="summary-card">
        <mat-card-content>
          <div class="card-row">
            <mat-icon class="card-icon low-stock">warning</mat-icon>
            <div>
              <div class="card-value">{{ store.dashboardSummary().lowStockCount }}</div>
              <div class="card-label">Low Stock Alerts</div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Row 2: Orders by Status + Low Stock Products -->
    <div class="two-col-grid">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Orders by Status</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <mat-list>
            @for (entry of orderStatusEntries(); track entry.status) {
              <mat-list-item>
                <mat-icon matListItemIcon>
                  @switch (entry.status) {
                    @case ('new') { fiber_new }
                    @case ('processing') { sync }
                    @case ('shipped') { local_shipping }
                    @case ('delivered') { check_circle }
                  }
                </mat-icon>
                <span matListItemTitle class="status-label">{{ entry.status | titlecase }}</span>
                <span matListItemMeta>
                  <mat-chip-set>
                    <mat-chip>{{ entry.count }}</mat-chip>
                  </mat-chip-set>
                </span>
              </mat-list-item>
            }
          </mat-list>
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Low Stock Products</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (store.lowStockProducts().length === 0) {
            <p class="empty-text">No low stock products</p>
          } @else {
            <table mat-table [dataSource]="store.lowStockProducts()" class="low-stock-table">
              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let product">{{ product.title }}</td>
              </ng-container>
              <ng-container matColumnDef="stock">
                <th mat-header-cell *matHeaderCellDef>Stock</th>
                <td mat-cell *matCellDef="let product" class="stock-warn">{{ product.stock }}</td>
              </ng-container>
              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let product">{{ product.price | currency }}</td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="['title', 'stock', 'price']"></tr>
              <tr mat-row *matRowDef="let row; columns: ['title', 'stock', 'price']"></tr>
            </table>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Row 3: Recent Activity + Pending Todos -->
    <div class="two-col-grid">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Recent Activity</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (store.recentActivity().length === 0) {
            <p class="empty-text">No activity yet. Log in, add products, or move orders to see events here.</p>
          } @else {
            <mat-list class="activity-list">
              @for (entry of store.recentActivity().slice(0, 10); track entry.id) {
                <mat-list-item>
                  <mat-icon matListItemIcon>
                    @switch (entry.action) {
                      @case ('product_added') { add_circle }
                      @case ('product_updated') { edit }
                      @case ('product_deleted') { delete }
                      @case ('order_status_changed') { swap_horiz }
                      @case ('order_created') { shopping_cart }
                      @case ('order_deleted') { remove_shopping_cart }
                      @case ('user_login') { login }
                      @case ('user_logout') { logout }
                      @default { info }
                    }
                  </mat-icon>
                  <span matListItemTitle>{{ entry.description }}</span>
                  <span matListItemLine class="activity-time">{{ entry.timestamp | date:'short' }}</span>
                </mat-list-item>
              }
            </mat-list>
          }
        </mat-card-content>
      </mat-card>

      <mat-card>
        <mat-card-header>
          <mat-card-title>Pending Todos</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          @if (store.todosLoading()) {
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
          }
          @if (store.todos().length === 0 && !store.todosLoading()) {
            <p class="empty-text">No todos loaded</p>
          } @else {
            <mat-list class="todo-list">
              @for (todo of store.todos().slice(0, 10); track todo.id) {
                <mat-list-item>
                  <mat-checkbox
                    matListItemIcon
                    [checked]="todo.completed"
                    disabled
                  ></mat-checkbox>
                  <span matListItemTitle [class.completed-todo]="todo.completed">
                    {{ todo.todo }}
                  </span>
                </mat-list-item>
              }
            </mat-list>
          }
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Row 4: Activity Breakdown by Type -->
    <mat-card class="full-width-card">
      <mat-card-header>
        <mat-card-title>Activity Breakdown</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        @if (hasActivity()) {
          <mat-chip-set class="activity-chips">
            @for (entry of store.activityByAction() | keyvalue; track entry.key) {
              <mat-chip>
                <mat-icon matChipAvatar>{{ getActionIcon(entry.key) }}</mat-icon>
                {{ formatAction(entry.key) }}: {{ entry.value }}
              </mat-chip>
            }
          </mat-chip-set>
        } @else {
          <p class="empty-text">No activity data to display</p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .page-title {
      margin: 0 0 4px 0;
      font-size: 28px;
      font-weight: 500;
    }

    .welcome {
      margin: 0 0 24px 0;
      color: rgba(0, 0, 0, 0.6);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .summary-card {
      .card-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 8px 0;
      }

      .card-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;

        &.products { color: #1976d2; }
        &.orders { color: #7b1fa2; }
        &.revenue { color: #388e3c; }
        &.low-stock { color: #f57c00; }
      }

      .card-value {
        font-size: 24px;
        font-weight: 600;
        line-height: 1.2;
      }

      .card-label {
        font-size: 13px;
        color: rgba(0, 0, 0, 0.6);
      }
    }

    .two-col-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .full-width-card {
      margin-bottom: 24px;
    }

    .status-label {
      text-transform: capitalize;
    }

    .low-stock-table {
      width: 100%;
    }

    .stock-warn {
      color: #f57c00;
      font-weight: 600;
    }

    .empty-text {
      padding: 16px 0;
      color: rgba(0, 0, 0, 0.5);
      font-style: italic;
    }

    .activity-list, .todo-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .activity-time {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
    }

    .completed-todo {
      text-decoration: line-through;
      color: rgba(0, 0, 0, 0.4);
    }

    .activity-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      padding: 8px 0;
    }
  `,
})
export class DashboardComponent {
  readonly store = inject(DashboardStore);

  // Helper to transform ordersByStatus into an iterable for the template
  orderStatusEntries() {
    const byStatus = this.store.ordersByStatus();
    return [
      { status: 'new', count: byStatus.new.length },
      { status: 'processing', count: byStatus.processing.length },
      { status: 'shipped', count: byStatus.shipped.length },
      { status: 'delivered', count: byStatus.delivered.length },
    ];
  }

  hasActivity() {
    return Object.keys(this.store.activityByAction()).length > 0;
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      product_added: 'add_circle',
      product_updated: 'edit',
      product_deleted: 'delete',
      order_status_changed: 'swap_horiz',
      order_created: 'shopping_cart',
      order_deleted: 'remove_shopping_cart',
      user_login: 'login',
      user_logout: 'logout',
    };
    return icons[action] ?? 'info';
  }

  formatAction(action: string): string {
    return action
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
