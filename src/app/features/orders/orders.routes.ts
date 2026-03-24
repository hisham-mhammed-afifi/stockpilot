import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-orders-placeholder',
  standalone: true,
  template: `<h2>Section 6 - Orders</h2><p>Coming Soon</p>`,
})
class OrdersPlaceholderComponent {}

export const ordersRoutes: Routes = [
  { path: '', component: OrdersPlaceholderComponent },
];
