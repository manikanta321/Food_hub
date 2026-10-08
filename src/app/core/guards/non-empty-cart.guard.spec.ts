import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { firstValueFrom, Observable } from 'rxjs';

import { CartService } from '../services/cart.service';
import { nonEmptyCartGuard } from './non-empty-cart.guard';

describe('nonEmptyCartGuard', () => {
  it('should allow a hydrated checkout-ready cart', async () => {
    const result = await runGuard(true);

    expect(result).toBeTrue();
  });

  it('should redirect an empty cart to Cart', async () => {
    const result = await runGuard(false);

    expect(result instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe(
      '/cart',
    );
  });

  async function runGuard(canCheckout: boolean): Promise<boolean | UrlTree> {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        {
          provide: CartService,
          useValue: {
            ready: signal(true),
            canCheckout: signal(canCheckout),
          },
        },
      ],
    });

    return TestBed.runInInjectionContext(() =>
      firstValueFrom(
        nonEmptyCartGuard(
          {} as never,
          {} as never,
        ) as Observable<boolean | UrlTree>,
      ),
    );
  }
});
