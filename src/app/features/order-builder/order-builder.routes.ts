import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-order-builder-placeholder',
  standalone: true,
  template: `<h2>Section 7 - Order Builder</h2><p>Coming Soon</p>`,
})
class OrderBuilderPlaceholderComponent {}

export const orderBuilderRoutes: Routes = [
  { path: '', component: OrderBuilderPlaceholderComponent },
];
