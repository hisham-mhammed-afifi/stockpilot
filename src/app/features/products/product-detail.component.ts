import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  resource,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { map } from 'rxjs';
import { firstValueFrom } from 'rxjs';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ProductsApiService } from './services/products-api.service';
import { Product } from '../../shared/models/product.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    RouterLink,
    CurrencyPipe,
    DatePipe,
    DecimalPipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatListModule,
    MatProgressBarModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (product.isLoading()) {
      <mat-progress-bar mode="indeterminate" />
      <div class="skeleton-container">
        <div class="skeleton-image"></div>
        <div class="skeleton-info">
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line narrow"></div>
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line wide"></div>
        </div>
      </div>
    }

    @if (product.error()) {
      <div class="error-state">
        <mat-icon class="error-icon">error_outline</mat-icon>
        <p>Failed to load product details</p>
        <button mat-raised-button (click)="product.reload()">
          <mat-icon>refresh</mat-icon> Retry
        </button>
      </div>
    }

    @if (product.value(); as p) {
      <button mat-button routerLink="/products" class="back-button">
        <mat-icon>arrow_back</mat-icon> Back to Products
      </button>

      <div class="product-detail-layout">
        <!-- Left: Image gallery -->
        <div class="image-gallery">
          <img class="main-image" [src]="selectedImage()" [alt]="p.title" />
          @if (p.images.length > 1) {
            <div class="thumbnail-row">
              @for (img of p.images; track $index) {
                <img
                  class="thumbnail"
                  [src]="img"
                  [alt]="p.title + ' image ' + ($index + 1)"
                  [class.selected]="$index === selectedImageIndex()"
                  (click)="selectedImageIndex.set($index)"
                />
              }
            </div>
          }
        </div>

        <!-- Right: Product info -->
        <div class="product-info">
          <h1>{{ p.title }}</h1>
          @if (p.brand) {
            <p class="brand">{{ p.brand }}</p>
          }

          <div class="price-section">
            <span class="price">{{ p.price | currency }}</span>
            @if (p.discountPercentage > 0) {
              <span class="discount">-{{ p.discountPercentage | number:'1.0-0' }}%</span>
            }
          </div>

          <div class="rating">
            @for (star of stars; track star) {
              <mat-icon class="star-icon" [class.filled]="star <= p.rating">
                {{ star <= p.rating ? 'star' : 'star_border' }}
              </mat-icon>
            }
            <span class="rating-value">{{ p.rating | number:'1.1-1' }}</span>
          </div>

          <p class="description">{{ p.description }}</p>

          <mat-chip [class]="getStockClass(p.stock)">
            {{ p.availabilityStatus }}
          </mat-chip>

          <div class="meta-info">
            <p><mat-icon>local_shipping</mat-icon> {{ p.shippingInformation }}</p>
            <p><mat-icon>assignment_return</mat-icon> {{ p.returnPolicy }}</p>
            <p><mat-icon>verified_user</mat-icon> {{ p.warrantyInformation }}</p>
          </div>
        </div>
      </div>

      <!-- Reviews section -->
      @if (p.reviews.length > 0) {
        <h2 class="reviews-heading">Reviews ({{ p.reviews.length }})</h2>
        <mat-list class="reviews-list">
          @for (review of p.reviews; track $index) {
            <mat-list-item class="review-item">
              <mat-icon matListItemIcon>person</mat-icon>
              <span matListItemTitle>
                {{ review.reviewerName }}
                <span class="review-rating">
                  @for (s of stars; track s) {
                    <mat-icon class="review-star">{{ s <= review.rating ? 'star' : 'star_border' }}</mat-icon>
                  }
                </span>
              </span>
              <span matListItemLine>{{ review.comment }}</span>
              <span matListItemMeta>{{ review.date | date }}</span>
            </mat-list-item>
          }
        </mat-list>
      }
    }
  `,
  styles: `
    :host {
      display: block;
    }

    .back-button {
      margin-bottom: 16px;
    }

    .product-detail-layout {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    @media (max-width: 960px) {
      .product-detail-layout {
        grid-template-columns: 1fr;
      }
    }

    .main-image {
      width: 100%;
      border-radius: 8px;
      object-fit: contain;
      max-height: 400px;
      background: #f5f5f5;
    }

    .thumbnail-row {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      overflow-x: auto;
    }

    .thumbnail {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s;
    }

    .thumbnail:hover {
      border-color: rgba(0, 0, 0, 0.2);
    }

    .thumbnail.selected {
      border-color: var(--mat-sys-primary);
    }

    h1 {
      margin: 0 0 4px;
      font-size: 24px;
    }

    .brand {
      margin: 0 0 16px;
      opacity: 0.6;
      font-size: 14px;
    }

    .price-section {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .price {
      font-size: 28px;
      font-weight: 600;
      color: var(--mat-sys-primary);
    }

    .discount {
      background: #ef4444;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-bottom: 16px;
    }

    .star-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      color: #d1d5db;
    }

    .star-icon.filled {
      color: #f59e0b;
    }

    .rating-value {
      margin-left: 8px;
      font-size: 14px;
      opacity: 0.7;
    }

    .description {
      line-height: 1.6;
      margin-bottom: 16px;
    }

    .in-stock { --mdc-chip-label-text-color: #4caf50; }
    .low-stock { --mdc-chip-label-text-color: #ff9800; }
    .out-of-stock { --mdc-chip-label-text-color: #f44336; }

    .meta-info {
      margin-top: 24px;
    }

    .meta-info p {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 8px 0;
      font-size: 14px;
      opacity: 0.7;
    }

    .meta-info mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .reviews-heading {
      margin-top: 40px;
    }

    .review-item {
      margin-bottom: 8px;
    }

    .review-rating {
      margin-left: 8px;
    }

    .review-star {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #f59e0b;
    }

    /* Skeleton loading */
    .skeleton-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 16px;
    }

    @media (max-width: 960px) {
      .skeleton-container { grid-template-columns: 1fr; }
    }

    .skeleton-image {
      height: 300px;
      border-radius: 8px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-info {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .skeleton-line {
      height: 20px;
      border-radius: 4px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-line.wide { width: 100%; }
    .skeleton-line.medium { width: 60%; }
    .skeleton-line.narrow { width: 30%; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
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
export class ProductDetailComponent {
  private route = inject(ActivatedRoute);
  private productsApi = inject(ProductsApiService);

  stars = [1, 2, 3, 4, 5];

  // CONCEPT: toSignal() - Converts an Observable (route params) to a Signal.
  // This bridges the Observable world (Angular Router) with the Signal world (resource).
  // Route params come as Observable<ParamMap>. resource() needs a Signal input.
  // toSignal() creates that bridge. Always provide an initialValue to avoid undefined.
  private productId = toSignal(
    this.route.paramMap.pipe(map(params => Number(params.get('id')))),
    { initialValue: 0 },
  );

  // CONCEPT: resource() with route params - The params signal comes from the route.
  // When the user navigates to a different product, resource auto-fetches the new one.
  // Guard against id === 0 (the initialValue before route params emit).
  product = resource<Product | null, number>({
    params: () => this.productId(),
    loader: ({ params: id }) => {
      if (id === 0) return Promise.resolve(null);
      return firstValueFrom(this.productsApi.getById(id));
    },
  });

  // CONCEPT: Component State - selectedImageIndex is local UI state for the gallery.
  // It only matters while viewing this product. No reason to persist it anywhere.
  selectedImageIndex = signal(0);

  // CONCEPT: Computed - selectedImage derives the current image URL from the product
  // data and the selected index. It recalculates when either dependency changes.
  selectedImage = computed(() => {
    const p = this.product.value();
    if (!p) return '';
    return p.images[this.selectedImageIndex()] ?? p.thumbnail;
  });

  getStockClass(stock: number): string {
    if (stock > 10) return 'in-stock';
    if (stock > 0) return 'low-stock';
    return 'out-of-stock';
  }
}
