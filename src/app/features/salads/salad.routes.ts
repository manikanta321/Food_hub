import { Routes } from '@angular/router';

export const SALAD_ROUTES: Routes = [
  {
    path: ':saladId',
    title: 'Salad Details · HealthyBowl',
    loadComponent: () =>
      import('./pages/salad-details/salad-details.component').then(
        (component) => component.SaladDetailsComponent,
      ),
  },
];
