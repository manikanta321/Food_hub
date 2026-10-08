import { Routes } from '@angular/router';

import { nonEmptyCartGuard } from './core/guards/non-empty-cart.guard';
import { provideCustomerData } from './core/providers/customer-data.providers';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'home',
  },
  {
    path: '',
    providers: [provideCustomerData()],
    loadComponent: () =>
      import('./layout/customer-shell/customer-shell.component').then(
        (component) => component.CustomerShellComponent,
      ),
    children: [
      {
        path: 'home',
        loadChildren: () =>
          import('./features/home/home.routes').then(
            (routes) => routes.HOME_ROUTES,
          ),
      },
      {
        path: 'salads',
        loadChildren: () =>
          import('./features/salads/salad.routes').then(
            (routes) => routes.SALAD_ROUTES,
          ),
      },
      {
        path: 'cart',
        title: 'Your Cart · HealthyBowl',
        loadComponent: () =>
          import(
            './features/cart/pages/cart-page/cart-page.component'
          ).then(
            (component) => component.CartPageComponent,
          ),
      },
      {
        path: 'checkout/confirmation/:orderId',
        title: 'Order Confirmed · HealthyBowl',
        loadComponent: () =>
          import(
            './features/checkout/pages/order-confirmation/order-confirmation.component'
          ).then(
            (component) => component.OrderConfirmationComponent,
          ),
      },
      {
        path: 'checkout',
        title: 'Checkout · HealthyBowl',
        canActivate: [nonEmptyCartGuard],
        loadComponent: () =>
          import(
            './features/checkout/pages/checkout-page/checkout-page.component'
          ).then(
            (component) => component.CheckoutPageComponent,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'Page Not Found · HealthyBowl',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        (component) => component.NotFoundComponent,
      ),
  },
];
