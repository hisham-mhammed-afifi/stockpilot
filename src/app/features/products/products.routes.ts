import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-products-placeholder',
  standalone: true,
  template: `<h2>Section 3 - Products</h2><p>Coming Soon</p>`,
})
class ProductsPlaceholderComponent {}

export const productsRoutes: Routes = [
  { path: '', component: ProductsPlaceholderComponent },
];
