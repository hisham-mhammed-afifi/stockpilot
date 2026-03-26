import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  linkedSignal,
  effect,
  resource,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatOption } from '@angular/material/select';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatChipsModule } from '@angular/material/chips';

import { ProductsApiService } from './services/products-api.service';
import { EmptyStateComponent } from '../../shared/ui/empty-state/empty-state.component';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DecimalPipe,
    MatFormField,
    MatLabel,
    MatPrefix,
    MatSuffix,
    MatInput,
    MatSelect,
    MatOption,
    MatButtonToggleModule,
    MatButton,
    MatIconButton,
    MatIcon,
    MatCard,
    MatCardContent,
    MatProgressBar,
    MatChipsModule,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- CONCEPT: resource() - isLoading() is provided automatically. No manual loading flags needed. -->
    @if (products.isLoading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    <div class="toolbar-row">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search products</mat-label>
        <mat-icon matPrefix>search</mat-icon>
        <input
          matInput
          [value]="searchInput()"
          (input)="onSearch(searchInputEl.value)"
          #searchInputEl
        />
        @if (searchInput()) {
          <button matSuffix mat-icon-button (click)="onSearch('')">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="category-field">
        <mat-label>Category</mat-label>
        <mat-select [value]="selectedCategory()" (selectionChange)="onCategoryChange($event.value)">
          <mat-option value="">All Categories</mat-option>
          @for (cat of categories.value(); track cat.slug) {
            <mat-option [value]="cat.slug">{{ cat.name }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-button-toggle-group [value]="sortBy()" (change)="sortBy.set($event.value)" class="sort-toggles">
        <mat-button-toggle value="title">Name</mat-button-toggle>
        <mat-button-toggle value="price">Price</mat-button-toggle>
        <mat-button-toggle value="rating">Rating</mat-button-toggle>
      </mat-button-toggle-group>

      <button mat-icon-button (click)="toggleSortOrder()" [attr.aria-label]="'Sort ' + sortOrder()">
        <mat-icon>{{ sortOrder() === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
      </button>
    </div>

    <!-- Error state with retry -->
    @if (products.error(); as err) {
      <div class="error-state">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <p>Failed to load products</p>
        <button mat-raised-button (click)="products.reload()">
          <mat-icon>refresh</mat-icon> Retry
        </button>
      </div>
    }

    <!-- Product grid -->
    @if (products.value(); as data) {
      @if (data.products.length === 0) {
        <app-empty-state
          icon="search_off"
          title="No products found"
          subtitle="Try adjusting your search or filters"
        />
      } @else {
        <div class="product-grid">
          @for (product of data.products; track product.id) {
            <mat-card class="product-card" [routerLink]="['/products', product.id]">
              <img
                mat-card-image
                [src]="product.thumbnail"
                [alt]="product.title"
                class="product-image"
              />
              <mat-card-content>
                <h3 class="product-title">{{ product.title }}</h3>
                <div class="product-meta">
                  <span class="price">{{ product.price | currency }}</span>
                  <span class="rating">
                    <mat-icon class="star-icon">star</mat-icon>
                    {{ product.rating | number:'1.1-1' }}
                  </span>
                </div>
                <mat-chip [class]="getStockClass(product.stock)" class="stock-chip">
                  {{ product.availabilityStatus }}
                </mat-chip>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    }

    <!-- Pagination -->
    @if (totalPages() > 1) {
      <div class="pagination">
        <button mat-button [disabled]="currentPage() <= 1" (click)="prevPage()">
          <mat-icon>chevron_left</mat-icon> Previous
        </button>
        <span class="page-indicator">Page {{ currentPage() }} of {{ totalPages() }}</span>
        <button mat-button [disabled]="currentPage() >= totalPages()" (click)="nextPage()">
          Next <mat-icon iconPositionEnd>chevron_right</mat-icon>
        </button>
      </div>
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      margin-bottom: 24px;
    }

    .search-field {
      flex: 1;
      min-width: 200px;
    }

    .category-field {
      min-width: 180px;
    }

    .sort-toggles {
      height: 40px;
    }

    .product-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    @media (max-width: 1200px) {
      .product-grid { grid-template-columns: repeat(3, 1fr); }
    }

    @media (max-width: 960px) {
      .product-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 599px) {
      .product-grid { grid-template-columns: 1fr; }
      .toolbar-row { flex-direction: column; align-items: stretch; }
      .sort-toggles { align-self: flex-start; }
    }

    .product-card {
      cursor: pointer;
      transition: box-shadow 0.2s;
    }

    .product-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .product-image {
      height: 180px;
      object-fit: cover;
    }

    .product-title {
      margin: 8px 0 4px;
      font-size: 15px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .product-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .price {
      font-size: 16px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 13px;
      opacity: 0.8;
    }

    .star-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #f59e0b;
    }

    .stock-chip {
      font-size: 11px;
    }

    .in-stock { --mdc-chip-label-text-color: #4caf50; }
    .low-stock { --mdc-chip-label-text-color: #ff9800; }
    .out-of-stock { --mdc-chip-label-text-color: #f44336; }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      padding: 24px 0;
    }

    .page-indicator {
      font-size: 14px;
      opacity: 0.7;
    }

    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px;
      text-align: center;
    }

    .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #f44336;
      margin-bottom: 16px;
    }
  `,
})
export class ProductsComponent {
  private productsApi = inject(ProductsApiService);

  // ---------------------------------------------------------------------------
  // CONCEPT: Component State - These signals are local to this component.
  // They die when the component is destroyed. No service, no store needed.
  // Search, filters, pagination -- these are ephemeral UI state.
  // ---------------------------------------------------------------------------

  // CONCEPT: Signal - searchInput holds the raw user keystrokes (unprocessed).
  // A separate searchTerm signal holds the debounced value that triggers fetching.
  searchInput = signal('');
  searchTerm = signal('');

  selectedCategory = signal<string>('');
  sortBy = signal<'price' | 'title' | 'rating'>('title');
  sortOrder = signal<'asc' | 'desc'>('asc');
  pageSize = signal(12);

  // CONCEPT: linkedSignal - Resets page to 1 whenever search or category changes.
  // Without this, changing the search term while on page 3 would show empty results.
  // linkedSignal is writable (user clicks "Next") AND auto-resets (filter changes).
  // computed() cannot do this because computed is read-only.
  currentPage = linkedSignal({
    source: () => ({ search: this.searchTerm(), category: this.selectedCategory() }),
    computation: () => 1,
  });

  // CONCEPT: Computed - skip is derived from page and pageSize.
  // It recalculates only when currentPage or pageSize changes.
  skip = computed(() => (this.currentPage() - 1) * this.pageSize());

  // CONCEPT: Computed - requestParams bundles all parameters into one signal.
  // resource() watches this single params signal instead of tracking many individual ones.
  private requestParams = computed(() => ({
    limit: this.pageSize(),
    skip: this.skip(),
    sortBy: this.sortBy(),
    order: this.sortOrder(),
    search: this.searchTerm(),
    category: this.selectedCategory(),
  }));

  // ---------------------------------------------------------------------------
  // CONCEPT: resource() - Declarative async data fetching tied to reactive inputs.
  // When requestParams() changes, resource automatically re-fetches.
  // It provides .value(), .isLoading(), .error(), .status() out of the box.
  // No manual subscription. No takeUntilDestroyed. No loading flags to manage.
  //
  // The loader receives the current params value and returns a Promise.
  // We use firstValueFrom() to bridge from Observable (HttpClient) to Promise.
  // Trade-off: firstValueFrom does not auto-cancel on new requests. In production,
  // consider rxResource() which handles Observable cancellation natively.
  // ---------------------------------------------------------------------------
  products = resource({
    params: this.requestParams,
    loader: ({ params }) => {
      if (params.search) {
        return firstValueFrom(this.productsApi.search(params.search, params.limit));
      }
      if (params.category) {
        return firstValueFrom(this.productsApi.getByCategory(params.category));
      }
      return firstValueFrom(
        this.productsApi.getAll({
          limit: params.limit,
          skip: params.skip,
          sortBy: params.sortBy,
          order: params.order,
        }),
      );
    },
  });

  // CONCEPT: resource() for categories (static data, fetched once).
  // No params function means the loader runs once when the component initializes.
  categories = resource({
    loader: () => firstValueFrom(this.productsApi.getCategories()),
  });

  // CONCEPT: Computed - totalPages derives from the resource value.
  // It automatically updates whenever products.value() changes.
  totalPages = computed(() => {
    const data = this.products.value();
    return data ? Math.ceil(data.total / this.pageSize()) : 0;
  });

  constructor() {
    // CONCEPT: effect() for debouncing - This is a valid use of effect()
    // because we are bridging user input timing to state updates.
    // The effect tracks searchInput. On each change it sets a 300ms timeout.
    // onCleanup cancels the previous timeout if the user keeps typing.
    // After 300ms of inactivity, searchTerm is updated, which triggers resource re-fetch.
    // Clearing the input (empty string) updates immediately with no delay.
    effect((onCleanup) => {
      const value = this.searchInput();
      if (value === '') {
        this.searchTerm.set('');
        return;
      }
      const timeout = setTimeout(() => this.searchTerm.set(value), 300);
      onCleanup(() => clearTimeout(timeout));
    });
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  onSearch(value: string): void {
    this.searchInput.set(value);
    // Search and category are mutually exclusive for DummyJSON API
    if (value) {
      this.selectedCategory.set('');
    }
  }

  onCategoryChange(category: string): void {
    this.selectedCategory.set(category);
    this.searchInput.set('');
    this.searchTerm.set('');
  }

  toggleSortOrder(): void {
    this.sortOrder.update(o => (o === 'asc' ? 'desc' : 'asc'));
  }

  nextPage(): void {
    this.currentPage.update(p => p + 1);
  }

  prevPage(): void {
    this.currentPage.update(p => Math.max(1, p - 1));
  }

  getStockClass(stock: number): string {
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
  }
}

// CONCEPT: When to extract - Right now everything is in the component. That is fine!
// We would extract to a service/store ONLY if:
// 1. Another unrelated component needs the same data
// 2. We need the state to survive navigation (persist filters)
// 3. The logic is complex enough to warrant separation
// Section 4 will show when extraction becomes necessary.
