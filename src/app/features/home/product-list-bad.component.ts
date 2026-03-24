import { Component, ChangeDetectionStrategy, inject, signal, output, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { Product, ProductsResponse } from '../../shared/models/product.model';
import { ProductItemBadComponent } from './product-item-bad.component';

// CONCEPT: Anti-pattern - Fetching data directly in a component via HttpClient.
// This creates tight coupling and makes it impossible to share data between components.
// There is no service, no store, no caching. Every mount = a new HTTP call.
@Component({
  selector: 'app-product-list-bad',
  standalone: true,
  imports: [MatProgressBarModule, MatButtonModule, MatIconModule, MatBadgeModule, ProductItemBadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="list-header">
      <h3>Products</h3>
      <span class="call-counter" [matBadge]="httpCallCount()" matBadgeColor="warn">
        HTTP Calls
      </span>
      <!-- CONCEPT: Anti-pattern - Duplicate HTTP calls. Without shared state, each reload
           fetches its own copy. There is no caching or deduplication. -->
      <button mat-stroked-button (click)="reload()">
        <mat-icon>refresh</mat-icon>
        Reload
      </button>
    </div>

    @if (loading()) {
      <mat-progress-bar mode="indeterminate" />
    }

    @for (product of products(); track product.id) {
      <!-- CONCEPT: Anti-pattern - Forwarding events. This component re-emits addToCart
           from product-item-bad up to its parent (home). Three levels of event bubbling. -->
      <app-product-item-bad
        [product]="product"
        (addToCart)="addToCart.emit($event)"
      />
    }

    @if (!loading() && products().length === 0) {
      <p>No products loaded.</p>
    }
  `,
  styles: `
    .list-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    .list-header h3 {
      margin: 0;
    }
    .call-counter {
      font-size: 13px;
      margin-right: 8px;
    }
  `,
})
export class ProductListBadComponent implements OnInit {
  // CONCEPT: Anti-pattern - Injecting HttpClient directly in a component.
  // This should go through a service at minimum, or better yet, a store.
  private http = inject(HttpClient);

  products = signal<Product[]>([]);
  loading = signal(false);
  httpCallCount = signal(0);

  // CONCEPT: Anti-pattern - This output forwards the addToCart event from 2 levels deep.
  addToCart = output<number>();

  ngOnInit(): void {
    this.fetchProducts();
  }

  reload(): void {
    // CONCEPT: Anti-pattern - Duplicate HTTP calls. Without shared state, each component
    // fetches its own copy. 5 components showing the same product = 5 HTTP calls.
    this.fetchProducts();
  }

  private fetchProducts(): void {
    this.loading.set(true);
    this.httpCallCount.update(c => c + 1);

    this.http.get<ProductsResponse>('https://dummyjson.com/products?limit=5')
      .subscribe({
        next: (response) => {
          this.products.set(response.products);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }
}
