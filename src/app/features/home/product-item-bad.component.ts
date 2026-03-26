import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatCardImage } from '@angular/material/card';
import { CurrencyPipe } from '@angular/common';
import { Product } from '../../shared/models/product.model';
import { ProductActionsBadComponent } from './product-actions-bad.component';

// CONCEPT: Anti-pattern - Prop drilling. Passing data through 3+ levels of @Input().
// When the intermediate components don't use the data, this is a code smell.
// This component is level 2 in the hierarchy. It receives the full product and
// passes the productId down to product-actions-bad.
@Component({
  selector: 'app-product-item-bad',
  standalone: true,
  imports: [MatCard, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardContent, MatCardActions, MatCardImage, CurrencyPipe, ProductActionsBadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="product-card">
      <mat-card-header>
        <mat-card-title>{{ product().title }}</mat-card-title>
        <mat-card-subtitle>{{ product().category }}</mat-card-subtitle>
      </mat-card-header>
      <img mat-card-image [src]="product().thumbnail" [alt]="product().title" />
      <mat-card-content>
        <p class="price">{{ product().price | currency }}</p>
        <p class="stock">Stock: {{ product().stock }}</p>
      </mat-card-content>
      <mat-card-actions>
        <!-- CONCEPT: Anti-pattern - Forwarding an output. product-actions-bad emits addToCart,
             and this component just re-emits it upward. This is pure boilerplate. -->
        <app-product-actions-bad
          [productId]="product().id"
          (addToCart)="addToCart.emit($event)"
        />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    :host {
      flex: 1 1 220px;
      min-width: 200px;
    }
    .product-card {
      height: 100%;
    }
    .price {
      font-size: 18px;
      font-weight: 500;
      color: var(--mat-sys-primary);
    }
    .stock {
      color: var(--mat-sys-on-surface-variant);
    }
    img {
      max-height: 140px;
      object-fit: cover;
    }
  `,
})
export class ProductItemBadComponent {
  product = input.required<Product>();

  // CONCEPT: Anti-pattern - This component doesn't handle the event.
  // It just forwards it to its parent. Pure boilerplate.
  addToCart = output<number>();
}
