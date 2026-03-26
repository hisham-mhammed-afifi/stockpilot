import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

// CONCEPT: Anti-pattern - Event bubbling. Chaining @Output() through 3+ levels.
// This creates fragile chains where any intermediate component must forward events.
// This is the DEEPEST level (level 3). The "Add to Cart" event must bubble up
// through product-item-bad -> product-list-bad -> home just to be handled.
@Component({
  selector: 'app-product-actions-bad',
  standalone: true,
  imports: [MatButton, MatIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="actions">
      <button mat-stroked-button color="primary" (click)="addToCart.emit(productId())">
        <mat-icon>add_shopping_cart</mat-icon>
        Add to Cart
      </button>
    </div>
  `,
  styles: `
    .actions {
      margin-top: 8px;
    }
  `,
})
export class ProductActionsBadComponent {
  // CONCEPT: Anti-pattern - Prop drilling. This component receives productId passed down
  // from 2 levels above. It doesn't even need the full product, just the ID,
  // but the parent chain must still thread it through.
  productId = input.required<number>();

  // CONCEPT: Anti-pattern - This output must be forwarded by product-item-bad,
  // then by product-list-bad, before finally reaching a component that handles it.
  addToCart = output<number>();
}
