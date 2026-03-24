import { Component } from '@angular/core';
import { Routes } from '@angular/router';

@Component({
  selector: 'app-dashboard-placeholder',
  standalone: true,
  template: `<h2>Section 9 - Dashboard</h2><p>Coming Soon</p>`,
})
class DashboardPlaceholderComponent {}

export const dashboardRoutes: Routes = [
  { path: '', component: DashboardPlaceholderComponent },
];
