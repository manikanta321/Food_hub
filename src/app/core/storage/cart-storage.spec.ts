import { TestBed } from '@angular/core/testing';

import { CART_STORAGE } from './cart-storage';

describe('CartStorage', () => {
  const key = 'healthybowl.cart';

  beforeEach(() => {
    sessionStorage.removeItem(key);
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    sessionStorage.removeItem(key);
  });

  it('should round-trip a valid versioned snapshot', () => {
    const storage = TestBed.inject(CART_STORAGE);
    const cart = {
      version: 1 as const,
      items: [{ saladId: 'protein-power-salad', quantity: 2 }],
    };

    expect(storage.write(cart)).toBeTrue();
    expect(storage.read()).toEqual({ kind: 'success', cart });
  });

  it('should reject and remove malformed snapshots', () => {
    sessionStorage.setItem(
      key,
      JSON.stringify({
        version: 1,
        items: [{ saladId: 'protein-power-salad', quantity: 0 }],
      }),
    );

    expect(TestBed.inject(CART_STORAGE).read()).toEqual({ kind: 'error' });
    expect(sessionStorage.getItem(key)).toBeNull();
  });
});
