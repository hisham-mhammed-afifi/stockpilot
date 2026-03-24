import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { InventoryStore, InventoryFilters } from '../store/inventory.store';

@Component({
  selector: 'app-inventory-list',
  standalone: true,
  imports: [
    CurrencyPipe,
    FormsModule,
    MatTableModule,
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressBarModule,
    MatButtonToggleModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- CONCEPT: Architecture - The entire template reads signals from the store.
         No business logic lives here. The component is purely presentational. -->

    <!-- Stats Bar -->
    <div class="stats-bar">
      <mat-card class="stat-card">
        <mat-card-content>
          <div class="stat-value">{{ store.stats().totalProducts }}</div>
          <div class="stat-label">Total Products</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card in-stock">
        <mat-card-content>
          <div class="stat-value">{{ store.stats().inStock }}</div>
          <div class="stat-label">In Stock</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card low-stock">
        <mat-card-content>
          <div class="stat-value">{{ store.stats().lowStock }}</div>
          <div class="stat-label">Low Stock</div>
        </mat-card-content>
      </mat-card>
      <mat-card class="stat-card out-of-stock">
        <mat-card-content>
          <div class="stat-value">{{ store.stats().outOfStock }}</div>
          <div class="stat-label">Out of Stock</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- Filters Toolbar -->
    <mat-card class="filters-card">
      <mat-card-content>
        <div class="filters-row">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search products</mat-label>
            <mat-icon matPrefix>search</mat-icon>
            <input
              matInput
              [value]="store.filters().search"
              (input)="onSearchChange(searchInput.value)"
              #searchInput
              placeholder="Search by name..."
            />
          </mat-form-field>

          <mat-form-field appearance="outline" class="category-field">
            <mat-label>Category</mat-label>
            <mat-select
              [value]="store.filters().category"
              (selectionChange)="onCategoryChange($event.value)"
            >
              <mat-option value="">All Categories</mat-option>
              @for (cat of store.categories(); track cat.slug) {
                <mat-option [value]="cat.slug">{{ cat.name }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="sort-field">
            <mat-label>Sort by</mat-label>
            <mat-select
              [value]="store.filters().sortBy"
              (selectionChange)="onSortChange($event.value)"
            >
              <mat-option value="title">Title</mat-option>
              <mat-option value="price">Price</mat-option>
              <mat-option value="stock">Stock</mat-option>
              <mat-option value="rating">Rating</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            mat-icon-button
            (click)="onToggleSortOrder()"
            [matTooltip]="store.filters().sortOrder === 'asc' ? 'Ascending' : 'Descending'"
          >
            <mat-icon>{{ store.filters().sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
          </button>
        </div>

        <div class="stock-filter-row">
          <span class="filter-label">Stock Status:</span>
          <!-- CONCEPT: Signal - The template reads store.filters().stockStatus directly.
               When the user clicks a toggle, we call store.setFilters() which updates the signal,
               and Angular automatically re-renders only the affected parts. -->
          <mat-button-toggle-group
            [value]="store.filters().stockStatus"
            (change)="onStockStatusChange($event.value)"
          >
            <mat-button-toggle value="all">All</mat-button-toggle>
            <mat-button-toggle value="in-stock">In Stock</mat-button-toggle>
            <mat-button-toggle value="low-stock">Low Stock</mat-button-toggle>
            <mat-button-toggle value="out-of-stock">Out of Stock</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Loading Bar -->
    @if (store.loading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    <!-- Error State -->
    @if (store.error(); as error) {
      <mat-card class="error-card">
        <mat-card-content>
          <div class="error-content">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <span>{{ error }}</span>
            <button mat-stroked-button (click)="onRetry()">
              <mat-icon>refresh</mat-icon>
              Retry
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    }

    <!-- Data Table -->
    @if (!store.error()) {
      <div class="table-container">
        <table mat-table [dataSource]="store.filteredProducts()" class="inventory-table">

          <!-- Thumbnail Column -->
          <ng-container matColumnDef="thumbnail">
            <th mat-header-cell *matHeaderCellDef>Image</th>
            <td mat-cell *matCellDef="let product">
              <img [src]="product.thumbnail" [alt]="product.title" class="product-thumb" />
            </td>
          </ng-container>

          <!-- Title Column -->
          <ng-container matColumnDef="title">
            <th mat-header-cell *matHeaderCellDef>Title</th>
            <td mat-cell *matCellDef="let product">{{ product.title }}</td>
          </ng-container>

          <!-- Category Column -->
          <ng-container matColumnDef="category">
            <th mat-header-cell *matHeaderCellDef>Category</th>
            <td mat-cell *matCellDef="let product">{{ product.category }}</td>
          </ng-container>

          <!-- Price Column -->
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef>Price</th>
            <td mat-cell *matCellDef="let product">{{ product.price | currency }}</td>
          </ng-container>

          <!-- Stock Column -->
          <ng-container matColumnDef="stock">
            <th mat-header-cell *matHeaderCellDef>Stock</th>
            <td mat-cell *matCellDef="let product">
              <mat-chip [class]="getStockClass(product.stock)" highlighted>
                {{ product.stock }}
              </mat-chip>
            </td>
          </ng-container>

          <!-- Rating Column -->
          <ng-container matColumnDef="rating">
            <th mat-header-cell *matHeaderCellDef>Rating</th>
            <td mat-cell *matCellDef="let product">
              <div class="rating-cell">
                <mat-icon class="star-icon">star</mat-icon>
                <span>{{ product.rating.toFixed(1) }}</span>
              </div>
            </td>
          </ng-container>

          <!-- Actions Column -->
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef>Actions</th>
            <td mat-cell *matCellDef="let product">
              <button mat-stroked-button (click)="onSelectProduct(product.id)">
                <mat-icon>visibility</mat-icon>
                View
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination-bar">
        <button
          mat-stroked-button
          [disabled]="!store.hasPrevPage()"
          (click)="onPageChange(store.currentPage() - 1)"
        >
          <mat-icon>chevron_left</mat-icon>
          Previous
        </button>

        <span class="page-info">
          Page {{ store.currentPage() }} of {{ store.totalPages() }}
        </span>

        <button
          mat-stroked-button
          [disabled]="!store.hasNextPage()"
          (click)="onPageChange(store.currentPage() + 1)"
        >
          Next
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    }

    <!-- Selected Product Detail Panel -->
    @if (store.selectedProduct(); as product) {
      <mat-card class="detail-panel">
        <mat-card-header>
          <mat-card-title>{{ product.title }}</mat-card-title>
          <mat-card-subtitle>{{ product.brand }} - {{ product.category }}</mat-card-subtitle>
          <span class="spacer"></span>
          <button mat-icon-button (click)="onSelectProduct(null)">
            <mat-icon>close</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="detail-grid">
            <img [src]="product.thumbnail" [alt]="product.title" class="detail-image" />
            <div class="detail-info">
              <p>{{ product.description }}</p>
              <div class="detail-meta">
                <div><strong>Price:</strong> {{ product.price | currency }}</div>
                <div><strong>Stock:</strong> {{ product.stock }} units</div>
                <div><strong>Rating:</strong> {{ product.rating.toFixed(1) }} / 5</div>
                <div><strong>SKU:</strong> {{ product.sku }}</div>
                <div><strong>Availability:</strong> {{ product.availabilityStatus }}</div>
                <div><strong>Shipping:</strong> {{ product.shippingInformation }}</div>
              </div>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .stats-bar {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 16px;
    }

    .stat-card {
      text-align: center;
    }

    .stat-value {
      font-size: 28px;
      font-weight: 600;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 13px;
      color: var(--mat-sys-on-surface-variant);
      margin-top: 4px;
    }

    .stat-card.in-stock .stat-value { color: #2e7d32; }
    .stat-card.low-stock .stat-value { color: #ef6c00; }
    .stat-card.out-of-stock .stat-value { color: #c62828; }

    .filters-card {
      margin-bottom: 16px;
    }

    .filters-row {
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .category-field,
    .sort-field {
      min-width: 160px;
    }

    .stock-filter-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .filter-label {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .table-container {
      overflow-x: auto;
      margin-bottom: 16px;
    }

    .inventory-table {
      width: 100%;
    }

    .product-thumb {
      width: 48px;
      height: 48px;
      object-fit: cover;
      border-radius: 8px;
    }

    .stock-in {
      --mat-chip-label-text-color: #2e7d32;
      --mdc-chip-elevated-container-color: #e8f5e9;
    }

    .stock-low {
      --mat-chip-label-text-color: #ef6c00;
      --mdc-chip-elevated-container-color: #fff3e0;
    }

    .stock-out {
      --mat-chip-label-text-color: #c62828;
      --mdc-chip-elevated-container-color: #ffebee;
    }

    .rating-cell {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .star-icon {
      color: #ffa000;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .pagination-bar {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 16px 0;
    }

    .page-info {
      font-size: 14px;
      color: var(--mat-sys-on-surface-variant);
    }

    .error-card {
      margin-bottom: 16px;
    }

    .error-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .error-icon {
      color: #c62828;
    }

    .detail-panel {
      margin-top: 16px;
    }

    mat-card-header {
      display: flex;
      align-items: center;
    }

    mat-card-header .spacer {
      flex: 1;
    }

    .detail-grid {
      display: flex;
      gap: 24px;
      margin-top: 16px;
    }

    .detail-image {
      width: 200px;
      height: 200px;
      object-fit: cover;
      border-radius: 12px;
    }

    .detail-info p {
      margin: 0 0 16px 0;
      color: var(--mat-sys-on-surface-variant);
    }

    .detail-meta {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    @media (max-width: 768px) {
      .stats-bar {
        grid-template-columns: repeat(2, 1fr);
      }

      .detail-grid {
        flex-direction: column;
      }

      .detail-image {
        width: 100%;
        height: auto;
      }
    }
  `,
})
export class InventoryListComponent {
  // CONCEPT: inject(SignalStore) - Components consume stores via injection.
  // The component does not know HOW data is fetched or WHERE state lives.
  // It just reads signals and calls methods. This is the "dumb component" pattern.
  protected readonly store = inject(InventoryStore);

  // CONCEPT: Architecture - The component has ZERO business logic.
  // All filtering, pagination, and data fetching is in the store.
  // The component is purely presentational + user interaction dispatch.
  displayedColumns = ['thumbnail', 'title', 'category', 'price', 'stock', 'rating', 'actions'];

  // CONCEPT: Dumb Components - Each handler below is a one-liner that delegates
  // to the store. The component never manipulates data directly.

  onSearchChange(term: string) {
    this.store.setFilters({ search: term });
    this.store.loadProducts();
  }

  onCategoryChange(category: string) {
    this.store.setFilters({ category });
    this.store.loadProducts();
  }

  onStockStatusChange(status: InventoryFilters['stockStatus']) {
    // CONCEPT: Client-side filtering - Stock status filtering happens in
    // the store's computed signal (filteredProducts). No API call needed.
    this.store.setFilters({ stockStatus: status });
  }

  onSortChange(sortBy: InventoryFilters['sortBy']) {
    this.store.setFilters({ sortBy });
    this.store.loadProducts();
  }

  onToggleSortOrder() {
    const current = this.store.filters().sortOrder;
    this.store.setFilters({ sortOrder: current === 'asc' ? 'desc' : 'asc' });
    this.store.loadProducts();
  }

  onPageChange(page: number) {
    this.store.goToPage(page);
    this.store.loadProducts();
  }

  onSelectProduct(id: number | null) {
    this.store.selectProduct(id);
  }

  onRetry() {
    this.store.clearError();
    this.store.loadProducts();
  }

  getStockClass(stock: number): string {
    if (stock === 0) return 'stock-out';
    if (stock <= 10) return 'stock-low';
    return 'stock-in';
  }
}
