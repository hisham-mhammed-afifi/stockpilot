import { Routes } from '@angular/router';
import { OrderBuilderComponent } from './components/order-builder.component';
import { OrderBuilderStore } from './store/order-builder.store';

export const orderBuilderRoutes: Routes = [
  {
    path: '',
    component: OrderBuilderComponent,
    // CONCEPT: Feature-scoped store - The store is provided here, not at root.
    // Angular creates a new instance when this route activates and destroys it
    // when the user navigates away. This means fresh state every visit.
    providers: [OrderBuilderStore],
  },
];
