import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-inventory-placeholder',
  standalone: true,
  template: `<h2>Section 4 - Inventory</h2><p>Coming Soon</p>`,
})
class InventoryPlaceholderComponent {}

export const inventoryRoutes: Routes = [
  { path: '', component: InventoryPlaceholderComponent },
];
