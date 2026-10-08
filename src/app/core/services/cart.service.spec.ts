import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Salad } from '../models/salad.model';
import { CartStorage, CART_STORAGE } from '../storage/cart-storage';
import { CartService } from './cart.service';
import { SaladService } from './salad.service';

describe('CartService', () => {
  const salad: Salad = {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description: 'A fresh test salad.',
    pricePaise: 14900,
    image: { url: '/images/protein-power-salad.jpg', alt: 'Test salad' },
    ingredients: ['Paneer', 'Lettuce'],
    available: true,
  };

  let storage: jasmine.SpyObj<CartStorage>;
  let saladService: jasmine.SpyObj<SaladService>;

  beforeEach(() => {
    storage = jasmine.createSpyObj<CartStorage>('CartStorage', [
      'read',
      'write',
      'clear',
    ]);
    storage.read.and.returnValue({ kind: 'success', cart: null });
    storage.write.and.returnValue(true);
    storage.clear.and.returnValue(true);

    saladService = jasmine.createSpyObj<SaladService>('SaladService', [
      'getCustomerCatalog',
      'getSalad',
    ]);
    saladService.getCustomerCatalog.and.returnValue(of([salad]));

    TestBed.configureTestingModule({
      providers: [
        CartService,
        { provide: SaladService, useValue: saladService },
        { provide: CART_STORAGE, useValue: storage },
      ],
    });
  });

  it('should add and merge a salad without duplicate lines', () => {
    const service = TestBed.inject(CartService);

    service.addItem(salad);
    service.addItem(salad, 2);

    expect(service.items().length).toBe(1);
    expect(service.items()[0].quantity).toBe(3);
    expect(service.itemCount()).toBe(3);
  });

  it('should cap merged quantities and calculate totals in paise', () => {
    const service = TestBed.inject(CartService);

    service.addItem(salad, 19);
    service.addItem(salad, 2);

    expect(service.items()[0].quantity).toBe(20);
    expect(service.totals()).toEqual({
      itemCount: 20,
      subtotalPaise: 298000,
      deliveryChargePaise: 0,
      totalPaise: 298000,
    });
  });

  it('should enforce quantity boundaries and remove items', () => {
    const service = TestBed.inject(CartService);
    service.addItem(salad);

    expect(service.setQuantity(salad.id, 0)).toBeFalse();
    expect(service.items()[0].quantity).toBe(1);

    service.increaseQuantity(salad.id);
    service.decreaseQuantity(salad.id);
    expect(service.items()[0].quantity).toBe(1);

    service.removeItem(salad.id);
    expect(service.isEmpty()).toBeTrue();
  });

  it('should reject an unavailable salad', () => {
    const service = TestBed.inject(CartService);

    expect(service.addItem({ ...salad, available: false })).toBeFalse();
    expect(service.isEmpty()).toBeTrue();
  });

  it('should rehydrate current salad data from a minimal snapshot', () => {
    const currentSalad = { ...salad, pricePaise: 15900, available: false };
    storage.read.and.returnValue({
      kind: 'success',
      cart: {
        version: 1,
        items: [{ saladId: salad.id, quantity: 2 }],
      },
    });
    saladService.getCustomerCatalog.and.returnValue(of([currentSalad]));

    const service = TestBed.inject(CartService);

    expect(service.ready()).toBeTrue();
    expect(service.items()).toEqual([{ salad: currentSalad, quantity: 2 }]);
    expect(service.hasUnavailableItems()).toBeTrue();
    expect(service.canCheckout()).toBeFalse();
  });

  it('should recover safely when hydration fails', () => {
    storage.read.and.returnValue({
      kind: 'success',
      cart: {
        version: 1,
        items: [{ saladId: salad.id, quantity: 2 }],
      },
    });
    saladService.getCustomerCatalog.and.returnValue(
      throwError(() => new Error('catalog failed')),
    );

    const service = TestBed.inject(CartService);

    expect(service.ready()).toBeTrue();
    expect(service.isEmpty()).toBeTrue();
    expect(service.recoveryNotice()).toBeTrue();
    expect(storage.clear).toHaveBeenCalled();
  });
});
