import { Routes } from '@angular/router';

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/analytics-dashboard/analytics-dashboard.component')
        .then(c => c.AnalyticsDashboardComponent)
  },
  {
    path: 'view',
    loadComponent: () =>
      import('./components/report-view/report-view.component')
        .then(c => c.ReportViewComponent)
  }
];
