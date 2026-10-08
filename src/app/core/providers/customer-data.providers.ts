import { makeEnvironmentProviders } from '@angular/core';

import { APARTMENT_REPOSITORY } from '../repositories/apartment.repository';
import { MockApartmentRepository } from '../repositories/mock-apartment.repository';
import { MockOrderRepository } from '../repositories/mock-order.repository';
import { ORDER_REPOSITORY } from '../repositories/order.repository';
import { ApartmentService } from '../services/apartment.service';
import { CartService } from '../services/cart.service';
import { CheckoutService } from '../services/checkout.service';
import { OrderService } from '../services/order.service';
import { provideSaladData } from './salad-data.providers';

export function provideCustomerData() {
  return makeEnvironmentProviders([
    provideSaladData(),
    MockApartmentRepository,
    {
      provide: APARTMENT_REPOSITORY,
      useExisting: MockApartmentRepository,
    },
    MockOrderRepository,
    { provide: ORDER_REPOSITORY, useExisting: MockOrderRepository },
    ApartmentService,
    CartService,
    CheckoutService,
    OrderService,
  ]);
}
