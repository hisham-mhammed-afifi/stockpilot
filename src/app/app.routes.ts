import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes) },
  { path: 'products', loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes) },
  { path: 'inventory', loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.inventoryRoutes) },
  { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.ordersRoutes) },
  { path: 'order-builder', loadChildren: () => import('./features/order-builder/order-builder.routes').then(m => m.orderBuilderRoutes) },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes) },
  { path: '**', redirectTo: '' },
];
