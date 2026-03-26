import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardActions } from '@angular/material/card';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatBadge } from '@angular/material/badge';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltip } from '@angular/material/tooltip';
import { MatToolbar } from '@angular/material/toolbar';
import { MatDivider } from '@angular/material/divider';

import { OrderBuilderStore } from '../store/order-builder.store';
import { Product } from '../../../shared/models/product.model';

// CONCEPT: Architecture - Components never call API services directly.
// They inject the store and call store methods. The store handles all async logic.

@Component({
  selector: 'app-order-builder',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatCardSubtitle,
    MatCardActions,
    MatButton,
    MatIconButton,
    MatIcon,
    MatTableModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatBadge,
    MatProgressBar,
    MatChipsModule,
    MatTooltip,
    MatToolbar,
    MatDivider,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- CONCEPT: Feature-scoped store - OrderBuilderStore is injected here
         and provided at the route level. Fresh instance on every navigation. -->

    <!-- Undo/Redo Toolbar -->
    <mat-toolbar class="undo-toolbar">
      <div class="toolbar-left">
        <button
          mat-icon-button
          (click)="store.undo()"
          [disabled]="!store.canUndo()"
          matTooltip="Undo last action"
        >
          <mat-icon>undo</mat-icon>
        </button>
        <button
          mat-icon-button
          (click)="store.redo()"
          [disabled]="!store.canRedo()"
          matTooltip="Redo last action"
        >
          <mat-icon>redo</mat-icon>
        </button>
        @if (store.historyLength() > 0) {
          <mat-chip-set>
            <mat-chip>{{ store.historyLength() }} action(s) to undo</mat-chip>
          </mat-chip-set>
        }
      </div>
      <div class="toolbar-right">
        <!-- Step indicator -->
        @for (step of store.steps(); track step; let i = $index) {
          <button
            mat-button
            [class.active-step]="store.currentStep() === i"
            [class.completed-step]="store.currentStep() > i"
            (click)="store.goToStep(i)"
          >
            <mat-icon>
              @if (store.currentStep() > i) {
                check_circle
              } @else {
                {{ stepIcons[i] }}
              }
            </mat-icon>
            <span class="step-label">{{ step }}</span>
          </button>
        }
      </div>
    </mat-toolbar>

    <!-- Error display -->
    @if (store.hasError()) {
      <mat-card class="error-card">
        <mat-card-content>
          <mat-icon>error</mat-icon>
          <span>{{ store.error() }}</span>
          <button mat-button (click)="store.clearError()">Dismiss</button>
        </mat-card-content>
      </mat-card>
    }

    <!-- Loading bar -->
    @if (store.loading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <!-- CONCEPT: @switch - Angular 19 control flow replaces ngSwitch directive.
         Each case renders a different wizard step. -->
    @switch (store.currentStep()) {
      @case (0) {
        <!-- Step 1: Product Selection -->
        <div class="step-container">
          <h2>Select Products</h2>
          <p class="step-subtitle">
            Browse products and add them to your order.
            @if (store.itemCount() > 0) {
              <mat-chip-set>
                <mat-chip highlighted>{{ store.itemCount() }} item(s) in order</mat-chip>
              </mat-chip-set>
            }
          </p>

          <div class="product-grid">
            @for (product of store.entities(); track product.id) {
              <mat-card class="product-card">
                <img mat-card-image [src]="product.thumbnail" [alt]="product.title" class="product-thumb" />
                <mat-card-content>
                  <h3 [matBadge]="getQuantityInOrder(product.id)" [matBadgeHidden]="!isInOrder(product.id)" matBadgeColor="accent">
                    {{ product.title }}
                  </h3>
                  <p class="product-price">{{ product.price | currency }}</p>
                  <p class="product-stock">Stock: {{ product.stock }}</p>
                </mat-card-content>
                <mat-card-actions>
                  @if (isInOrder(product.id)) {
                    <button mat-button color="warn" (click)="store.removeFromOrder(product.id)">
                      <mat-icon>remove_shopping_cart</mat-icon> Remove
                    </button>
                  } @else {
                    <button mat-raised-button color="primary" (click)="store.addToOrder(product)" [disabled]="product.stock === 0">
                      <mat-icon>add_shopping_cart</mat-icon> Add to Order
                    </button>
                  }
                </mat-card-actions>
              </mat-card>
            }
          </div>

          <!-- CONCEPT: Pagination controls - Powered by withPagination() feature.
               nextPage/prevPage/hasNextPage/hasPrevPage are all provided by the feature. -->
          <div class="pagination-controls">
            <button mat-button (click)="onPrevPage()" [disabled]="!store.hasPrevPage()">
              <mat-icon>chevron_left</mat-icon> Previous
            </button>
            <span class="pagination-info">
              Page {{ store.paginationInfo().page }} of {{ store.paginationInfo().totalPages }}
              ({{ store.paginationInfo().total }} products)
            </span>
            <button mat-button (click)="onNextPage()" [disabled]="!store.hasNextPage()">
              Next <mat-icon iconPositionEnd>chevron_right</mat-icon>
            </button>
          </div>

          <div class="step-actions">
            <button mat-raised-button color="primary" (click)="store.nextStep()" [disabled]="store.itemCount() === 0">
              Next: Review Order <mat-icon iconPositionEnd>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
      }

      @case (1) {
        <!-- Step 2: Review & Notes -->
        <div class="step-container">
          <h2>Review Your Order</h2>

          <div class="order-table-wrapper">
            <table mat-table [dataSource]="store.selectedProducts()" class="order-table">
              <ng-container matColumnDef="thumbnail">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let item">
                  <img [src]="item.thumbnail" [alt]="item.title" class="table-thumb" />
                </td>
              </ng-container>

              <ng-container matColumnDef="title">
                <th mat-header-cell *matHeaderCellDef>Product</th>
                <td mat-cell *matCellDef="let item">{{ item.title }}</td>
              </ng-container>

              <ng-container matColumnDef="price">
                <th mat-header-cell *matHeaderCellDef>Price</th>
                <td mat-cell *matCellDef="let item">{{ item.price | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let item">
                  <mat-form-field class="quantity-field" appearance="outline">
                    <input
                      matInput
                      type="number"
                      [ngModel]="item.quantity"
                      (ngModelChange)="store.updateQuantity(item.productId, $event)"
                      min="1"
                      max="99"
                    />
                  </mat-form-field>
                </td>
              </ng-container>

              <ng-container matColumnDef="subtotal">
                <th mat-header-cell *matHeaderCellDef>Subtotal</th>
                <td mat-cell *matCellDef="let item">{{ item.price * item.quantity | currency }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef></th>
                <td mat-cell *matCellDef="let item">
                  <button mat-icon-button color="warn" (click)="store.removeFromOrder(item.productId)" matTooltip="Remove item">
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="reviewColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: reviewColumns"></tr>
            </table>
          </div>

          <div class="order-summary">
            <h3>Order Total: {{ store.orderTotal() | currency }}</h3>
          </div>

          <mat-form-field class="notes-field" appearance="outline">
            <mat-label>Order Notes</mat-label>
            <textarea
              matInput
              [ngModel]="store.notes()"
              (ngModelChange)="store.setNotes($event)"
              rows="3"
              placeholder="Add any special instructions for this order..."
            ></textarea>
          </mat-form-field>

          <div class="step-actions">
            <button mat-button (click)="store.prevStep()">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <button mat-raised-button color="primary" (click)="store.nextStep()">
              Next: Confirm <mat-icon iconPositionEnd>arrow_forward</mat-icon>
            </button>
          </div>
        </div>
      }

      @case (2) {
        <!-- Step 3: Confirmation -->
        <div class="step-container">
          <h2>Confirm Your Order</h2>

          <mat-card class="confirmation-card">
            <mat-card-header>
              <mat-icon mat-card-avatar>shopping_cart</mat-icon>
              <mat-card-title>Order Summary</mat-card-title>
              <mat-card-subtitle>{{ store.itemCount() }} item(s)</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <div class="confirmation-items">
                @for (item of store.selectedProducts(); track item.productId) {
                  <div class="confirmation-item">
                    <img [src]="item.thumbnail" [alt]="item.title" class="confirm-thumb" />
                    <span class="item-title">{{ item.title }}</span>
                    <span class="item-qty">x{{ item.quantity }}</span>
                    <span class="item-subtotal">{{ item.price * item.quantity | currency }}</span>
                  </div>
                }
              </div>

              <mat-divider></mat-divider>

              @if (store.notes()) {
                <div class="confirmation-notes">
                  <strong>Notes:</strong> {{ store.notes() }}
                </div>
                <mat-divider></mat-divider>
              }

              <div class="confirmation-total">
                <h2>Total: {{ store.orderTotal() | currency }}</h2>
              </div>
            </mat-card-content>
          </mat-card>

          <div class="step-actions">
            <button mat-button (click)="store.prevStep()">
              <mat-icon>arrow_back</mat-icon> Back
            </button>
            <button
              mat-raised-button
              color="primary"
              (click)="store.submitOrder()"
              [disabled]="!store.canSubmit()"
            >
              <mat-icon>send</mat-icon> Submit Order
            </button>
          </div>
        </div>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .undo-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: transparent;
      padding: 8px 0;
      margin-bottom: 16px;
      height: auto;
      flex-wrap: wrap;
      gap: 8px;
    }

    .toolbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .active-step {
      font-weight: bold;
      color: var(--mat-primary);
    }

    .completed-step {
      color: var(--mat-primary);
      opacity: 0.7;
    }

    .step-label {
      margin-left: 4px;
    }

    .error-card {
      background-color: var(--mat-sys-error-container, #fdecea);
      margin-bottom: 16px;
    }

    .error-card mat-card-content {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--mat-sys-error, #d32f2f);
    }

    .step-container {
      max-width: 1200px;
    }

    .step-subtitle {
      color: var(--mat-sys-on-surface-variant);
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .product-card {
      display: flex;
      flex-direction: column;
    }

    .product-thumb {
      height: 140px;
      object-fit: cover;
    }

    .product-price {
      font-size: 18px;
      font-weight: 500;
      color: var(--mat-primary);
    }

    .product-stock {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
    }

    .pagination-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
    }

    .pagination-info {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .step-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid var(--mat-sys-outline-variant);
    }

    .order-table {
      width: 100%;
      margin-bottom: 16px;
    }

    .table-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 4px;
    }

    .quantity-field {
      width: 80px;
    }

    .order-summary {
      text-align: right;
      margin: 16px 0;
    }

    .notes-field {
      width: 100%;
    }

    .confirmation-card {
      margin-bottom: 24px;
    }

    .confirmation-items {
      margin: 16px 0;
    }

    .confirmation-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 0;
    }

    .confirm-thumb {
      width: 40px;
      height: 40px;
      object-fit: cover;
      border-radius: 4px;
    }

    .item-title {
      flex: 1;
    }

    .item-qty {
      color: var(--mat-sys-on-surface-variant);
      min-width: 40px;
    }

    .item-subtotal {
      font-weight: 500;
      min-width: 80px;
      text-align: right;
    }

    .confirmation-notes {
      padding: 12px 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .confirmation-total {
      text-align: right;
      padding: 16px 0 0;
    }

    .order-table-wrapper {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    @media (max-width: 599px) {
      .toolbar-right {
        flex-wrap: wrap;
      }

      .step-label {
        display: none;
      }

      .step-container {
        max-width: 100%;
      }

      .step-actions {
        flex-direction: column;
      }

      .step-actions button {
        width: 100%;
      }

      .step-subtitle {
        flex-wrap: wrap;
      }

      .confirmation-item {
        font-size: 14px;
      }

      .confirm-thumb {
        width: 32px;
        height: 32px;
      }
    }
  `,
})
export class OrderBuilderComponent {
  // CONCEPT: Architecture - The component injects the store and delegates
  // all state management to it. No local state for business logic.
  readonly store = inject(OrderBuilderStore);

  readonly reviewColumns = ['thumbnail', 'title', 'price', 'quantity', 'subtotal', 'actions'];
  readonly stepIcons = ['shopping_bag', 'rate_review', 'check_circle_outline'];

  isInOrder(productId: number): boolean {
    return this.store.selectedProducts().some(p => p.productId === productId);
  }

  getQuantityInOrder(productId: number): string {
    const item = this.store.selectedProducts().find(p => p.productId === productId);
    return item ? String(item.quantity) : '';
  }

  // CONCEPT: Pagination with data reload - When the user navigates pages,
  // we update pagination state AND reload products from the API.
  // The store's loadAvailableProducts uses withPagination's skip() and pageSize().
  onNextPage(): void {
    this.store.nextPage();
    this.store.loadAvailableProducts();
  }

  onPrevPage(): void {
    this.store.prevPage();
    this.store.loadAvailableProducts();
  }
}
