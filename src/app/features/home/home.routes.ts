import { Routes } from '@angular/router';

export const HOME_ROUTES: Routes = [
  {
    path: '',
    title: 'HealthyBowl',
    loadComponent: () =>
      import('./pages/home-page/home-page.component').then(
        (component) => component.HomePageComponent,
      ),
  },
];
