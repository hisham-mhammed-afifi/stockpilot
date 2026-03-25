import { Component, ChangeDetectionStrategy } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { inject } from '@angular/core';
import { ProductListBadComponent } from './product-list-bad.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule,
    MatListModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule,
    ProductListBadComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Section 01: The Problem</h1>
    <p class="subtitle">Why state management matters - see the pain points firsthand</p>

    <div class="demo-grid">
      <!-- Left card: Bad patterns demo -->
      <mat-card class="demo-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="bad-icon">warning</mat-icon>
          <mat-card-title>Without State Management</mat-card-title>
          <mat-card-subtitle>This component drills props 3 levels deep</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <div class="hierarchy-diagram">
            <mat-chip-set>
              <mat-chip>home</mat-chip>
              <mat-icon>arrow_forward</mat-icon>
              <mat-chip>product-list-bad</mat-chip>
              <mat-icon>arrow_forward</mat-icon>
              <mat-chip>product-item-bad</mat-chip>
              <mat-icon>arrow_forward</mat-icon>
              <mat-chip>product-actions-bad</mat-chip>
            </mat-chip-set>
          </div>

          <!-- CONCEPT: Anti-pattern - The event from "Add to Cart" in product-actions-bad
               bubbles through product-item-bad, then product-list-bad, then finally arrives here.
               That is 3 levels of @Output() chaining just to handle a button click. -->
          <app-product-list-bad (addToCart)="onAddToCart($event)" />
        </mat-card-content>
      </mat-card>

      <!-- Right card: State management teaser -->
      <mat-card class="demo-card teaser-card">
        <mat-card-header>
          <mat-icon mat-card-avatar class="good-icon">lightbulb</mat-icon>
          <mat-card-title>The State Management Approach</mat-card-title>
          <mat-card-subtitle>After this workshop, you'll build this the right way</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <!-- CONCEPT: State Classification - Before choosing a tool, classify your state into:
               UI (component-local), Component (shared with children), Feature (lazy module scope),
               Global (app-wide), Server (cached remote data). Keep state as local as possible. -->
          <mat-list>
            <mat-list-item>
              <mat-icon matListItemIcon>toggle_on</mat-icon>
              <span matListItemTitle>UI State</span>
              <span matListItemLine>"Is this dropdown open?" -- signal in component</span>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>tune</mat-icon>
              <span matListItemTitle>Component State</span>
              <span matListItemLine>"Current search + filters" -- signals + computed</span>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>inventory_2</mat-icon>
              <span matListItemTitle>Feature State</span>
              <span matListItemLine>"All inventory items" -- SignalStore</span>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>public</mat-icon>
              <span matListItemTitle>Global State</span>
              <span matListItemLine>"Who is logged in?" -- Global SignalStore</span>
            </mat-list-item>
            <mat-list-item>
              <mat-icon matListItemIcon>cloud</mat-icon>
              <span matListItemTitle>Server State</span>
              <span matListItemLine>"Cached API responses" -- resource / rxMethod</span>
            </mat-list-item>
          </mat-list>

          <div class="teaser-message">
            <p>In the following sections, you will learn how to replace every anti-pattern
            on the left with a clean, scalable state management approach.</p>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: `
    h1 {
      margin-bottom: 4px;
    }
    .subtitle {
      color: rgba(0, 0, 0, 0.6);
      margin-bottom: 24px;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (max-width: 960px) {
      .demo-grid {
        grid-template-columns: 1fr;
      }
    }
    .demo-card {
      min-height: 400px;
    }
    .bad-icon {
      color: #f44336;
    }
    .good-icon {
      color: #4caf50;
    }
    .hierarchy-diagram {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .hierarchy-diagram mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      color: rgba(0, 0, 0, 0.4);
    }
    .teaser-message {
      margin-top: 16px;
      padding: 16px;
      background: rgba(76, 175, 80, 0.08);
      border-radius: 8px;
    }
    .teaser-message p {
      margin: 0;
      color: rgba(0, 0, 0, 0.7);
    }
  `,
})
export class HomeComponent {
  private snackBar = inject(MatSnackBar);

  onAddToCart(productId: number): void {
    // CONCEPT: Anti-pattern - After 3 levels of event bubbling, the event finally
    // arrives here. In a real app, this would need to update cart state somewhere,
    // triggering yet another chain of problems.
    this.snackBar.open(
      `Added product #${productId} to cart (event bubbled through 3 levels!)`,
      'Close',
      { duration: 5000 },
    );
  }
}
