import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { Order, OrderStatus } from '../models/order.model';

// CONCEPT: Architecture - This is a presentational (dumb) component.
// It receives data via inputs and emits events via outputs.
// It has no knowledge of the store or API -- the parent component handles that.

@Component({
  selector: 'app-order-card',
  standalone: true,
  imports: [
    CurrencyPipe,
    TitleCasePipe,
    MatCard,
    MatCardContent,
    MatChipsModule,
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .order-card {
      margin-bottom: 8px;
      cursor: grab;

      &:active {
        cursor: grabbing;
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .order-id {
      font-weight: 500;
      font-size: 14px;
    }

    .user-badge {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
    }

    .products-preview {
      display: flex;
      gap: 6px;
      margin: 8px 0;
      flex-wrap: wrap;
    }

    .product-thumb {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      object-fit: cover;
      border: 1px solid var(--mat-sys-outline-variant);
    }

    .more-products {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      background: var(--mat-sys-surface-variant);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: var(--mat-sys-on-surface-variant);
    }

    .price-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .discounted-price {
      font-weight: 600;
      font-size: 15px;
      color: var(--mat-sys-primary);
    }

    .original-price {
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      text-decoration: line-through;
      margin-left: 6px;
    }

    .meta-row {
      display: flex;
      gap: 12px;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .status-new {
      --mat-chip-elevated-container-color: var(--status-new-bg);
      --mat-chip-label-text-color: var(--status-new-text);
    }
    .status-processing {
      --mat-chip-elevated-container-color: var(--status-processing-bg);
      --mat-chip-label-text-color: var(--status-processing-text);
    }
    .status-shipped {
      --mat-chip-elevated-container-color: var(--status-shipped-bg);
      --mat-chip-label-text-color: var(--status-shipped-text);
    }
    .status-delivered {
      --mat-chip-elevated-container-color: var(--status-delivered-bg);
      --mat-chip-label-text-color: var(--status-delivered-text);
    }
  `,
  template: `
    <mat-card class="order-card" appearance="outlined">
      <mat-card-content>
        <div class="card-header">
          <span class="order-id">Order #{{ order().id }}</span>
          <button mat-icon-button [matMenuTriggerFor]="actionMenu" (click)="$event.stopPropagation()">
            <mat-icon>more_vert</mat-icon>
          </button>
        </div>

        <span class="user-badge">User #{{ order().userId }}</span>

        <mat-chip [class]="'status-' + order().status">
          {{ order().status | titlecase }}
        </mat-chip>

        <div class="products-preview">
          @for (product of order().products.slice(0, 3); track product.id) {
            <img
              class="product-thumb"
              [src]="product.thumbnail"
              [alt]="product.title"
              [matTooltip]="product.title"
            />
          }
          @if (order().products.length > 3) {
            <div class="more-products">+{{ order().products.length - 3 }}</div>
          }
        </div>

        <div class="price-row">
          <div>
            <span class="discounted-price">{{ order().discountedTotal | currency }}</span>
            @if (order().total !== order().discountedTotal) {
              <span class="original-price">{{ order().total | currency }}</span>
            }
          </div>
        </div>

        <div class="meta-row">
          <span>{{ order().totalProducts }} products</span>
          <span>{{ order().totalQuantity }} items</span>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-menu #actionMenu="matMenu">
      <button mat-menu-item [matMenuTriggerFor]="statusMenu">
        <mat-icon>swap_horiz</mat-icon>
        <span>Change Status</span>
      </button>
      <button mat-menu-item (click)="delete.emit(order().id)" class="delete-action">
        <mat-icon color="warn">delete</mat-icon>
        <span>Delete Order</span>
      </button>
    </mat-menu>

    <mat-menu #statusMenu="matMenu">
      @for (s of statuses; track s) {
        @if (s !== order().status) {
          <button mat-menu-item (click)="statusChange.emit({ id: order().id, status: s })">
            {{ s | titlecase }}
          </button>
        }
      }
    </mat-menu>
  `,
})
export class OrderCardComponent {
  // CONCEPT: Signal inputs - Angular 19 signal-based inputs.
  // These are read with order() in the template, and are reactive.
  order = input.required<Order>();

  // CONCEPT: Output - Event emitters for parent communication.
  // The card does not know how to update status or delete -- it just emits events.
  statusChange = output<{ id: number; status: OrderStatus }>();
  delete = output<number>();

  readonly statuses: OrderStatus[] = ['new', 'processing', 'shipped', 'delivered'];
}
