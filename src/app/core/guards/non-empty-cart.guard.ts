import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';

import { CartService } from '../services/cart.service';

export const nonEmptyCartGuard: CanActivateFn = () => {
  const cart = inject(CartService);
  const router = inject(Router);

  return toObservable(cart.ready).pipe(
    filter((ready) => ready),
    take(1),
    map(() =>
      cart.canCheckout() ? true : router.createUrlTree(['/cart']),
    ),
  );
};
