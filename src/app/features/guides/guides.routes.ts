import { Routes } from '@angular/router';
import { GuideListComponent } from './guide-list.component';
import { GuideViewerComponent } from './guide-viewer.component';

export const guidesRoutes: Routes = [
  { path: '', component: GuideListComponent },
  { path: ':filename', component: GuideViewerComponent },
];
