import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  // Auth layout - minimal layout without sidenav (for login page)
  // CONCEPT: Functional Guards + Store - guestGuard redirects to /dashboard if already logged in.
  {
    path: 'login',
    loadComponent: () => import('./core/layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    canActivate: [guestGuard],
    children: [
      { path: '', loadChildren: () => import('./features/login/login.routes').then(m => m.loginRoutes) },
    ],
  },

  // Guides - minimal layout without sidenav
  {
    path: 'guides',
    loadComponent: () => import('./core/layout/auth-layout.component').then(m => m.AuthLayoutComponent),
    children: [
      { path: '', loadChildren: () => import('./features/guides/guides.routes').then(m => m.guidesRoutes) },
    ],
  },

  // Shell layout - full layout with toolbar + sidenav (for all other routes)
  {
    path: '',
    loadComponent: () => import('./core/layout/shell.component').then(m => m.ShellComponent),
    children: [
      // Public routes - accessible without authentication
      { path: '', loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes) },
      { path: 'products', loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes) },
      { path: 'signals-playground', loadComponent: () => import('./features/home/signals-playground/signals-playground.component').then(m => m.SignalsPlaygroundComponent) },

      // CONCEPT: Functional Guards + Store - authGuard redirects to /login if not authenticated.
      // Protected routes require the user to be logged in.
      { path: 'inventory', loadChildren: () => import('./features/inventory/inventory.routes').then(m => m.inventoryRoutes), canActivate: [authGuard] },
      { path: 'orders', loadChildren: () => import('./features/orders/orders.routes').then(m => m.ordersRoutes), canActivate: [authGuard] },
      { path: 'order-builder', loadChildren: () => import('./features/order-builder/order-builder.routes').then(m => m.orderBuilderRoutes), canActivate: [authGuard] },
      { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.dashboardRoutes), canActivate: [authGuard] },

      { path: '**', redirectTo: '' },
    ],
  },
];
