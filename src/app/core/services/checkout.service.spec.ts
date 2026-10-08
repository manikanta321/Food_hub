import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';

import {
  CheckoutDetails,
  Order,
} from '../models/checkout.model';
import { Salad } from '../models/salad.model';
import {
  OrderRepository,
  ORDER_REPOSITORY,
} from '../repositories/order.repository';
import { ApartmentService } from './apartment.service';
import { CartService } from './cart.service';
import { CheckoutService } from './checkout.service';

describe('CheckoutService', () => {
  const salad: Salad = {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description: 'Fresh salad.',
    pricePaise: 14900,
    image: { url: '/images/protein-power-salad.jpg', alt: 'Salad' },
    ingredients: ['Paneer'],
    available: true,
  };
  const details: CheckoutDetails = {
    apartmentId: 'apt_sunshine',
    block: 'B',
    flatNumber: ' 504 ',
    deliverySlotId: 'slot_1230',
    paymentMethod: 'CASH',
  };
  const order = { id: 'SAL1024' } as Order;

  let repository: jasmine.SpyObj<OrderRepository>;
  let cart: {
    canCheckout: ReturnType<typeof signal<boolean>>;
    items: ReturnType<typeof signal<readonly { salad: Salad; quantity: number }[]>>;
    clear: jasmine.Spy;
  };
  let apartmentService: jasmine.SpyObj<ApartmentService>;

  beforeEach(() => {
    repository = jasmine.createSpyObj<OrderRepository>('OrderRepository', [
      'create',
      'getMineById',
    ]);
    repository.create.and.returnValue(of(order));
    cart = {
      canCheckout: signal(true),
      items: signal([{ salad, quantity: 2 }]),
      clear: jasmine.createSpy('clear'),
    };
    apartmentService = jasmine.createSpyObj<ApartmentService>(
      'ApartmentService',
      ['selectApartment'],
    );

    TestBed.configureTestingModule({
      providers: [
        CheckoutService,
        { provide: ORDER_REPOSITORY, useValue: repository },
        { provide: CartService, useValue: cart },
        { provide: ApartmentService, useValue: apartmentService },
      ],
    });
  });

  it('should map cart and delivery details without sending client totals', async () => {
    const result = await firstValueFrom(
      TestBed.inject(CheckoutService).placeOrder(details),
    );

    expect(result).toBe(order);
    expect(repository.create).toHaveBeenCalled();
    const command = repository.create.calls.mostRecent().args[0];
    expect(command).toEqual({
      items: [{ saladId: salad.id, quantity: 2 }],
      delivery: {
        apartmentId: 'apt_sunshine',
        block: 'B',
        flatNumber: '504',
        deliverySlotId: 'slot_1230',
      },
      paymentMethod: 'CASH',
    });
    expect(cart.clear).toHaveBeenCalled();
    expect(apartmentService.selectApartment).toHaveBeenCalledOnceWith(
      'apt_sunshine',
    );
  });

  it('should preserve the cart when order creation fails', async () => {
    repository.create.and.returnValue(
      throwError(() => new Error('failed')),
    );

    await expectAsync(
      firstValueFrom(TestBed.inject(CheckoutService).placeOrder(details)),
    ).toBeRejected();

    expect(cart.clear).not.toHaveBeenCalled();
  });
});
