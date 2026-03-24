import { Routes } from '@angular/router';
import { ProductsComponent } from './products.component';
import { ProductDetailComponent } from './product-detail.component';

export const productsRoutes: Routes = [
  { path: '', component: ProductsComponent },
  { path: ':id', component: ProductDetailComponent },
];
