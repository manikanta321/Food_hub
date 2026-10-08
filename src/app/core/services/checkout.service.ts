import { inject, Injectable } from '@angular/core';
import { Observable, tap, throwError } from 'rxjs';

import {
  CheckoutDetails,
  CreateOrderCommand,
  Order,
} from '../models/checkout.model';
import { ORDER_REPOSITORY } from '../repositories/order.repository';
import { ApartmentService, currentBusinessDate } from './apartment.service';
import { CartService } from './cart.service';

@Injectable()
export class CheckoutService {
  private readonly cart = inject(CartService);
  private readonly repository = inject(ORDER_REPOSITORY);
  private readonly apartmentService = inject(ApartmentService);

  placeOrder(details: CheckoutDetails): Observable<Order> {
    if (!this.cart.canCheckout()) {
      return throwError(() => new Error('Your cart is not ready for checkout.'));
    }

    const command: CreateOrderCommand = {
      items: this.cart.items().map((item) => ({
        saladId: item.salad.id,
        quantity: item.quantity,
      })),
      delivery: {
        apartmentId: details.apartmentId,
        block: details.block,
        flatNumber: details.flatNumber.trim(),
        deliverySlotId: details.deliverySlotId,
      },
      paymentMethod: details.paymentMethod,
    };

    return this.repository
      .create(command, { businessDate: currentBusinessDate() })
      .pipe(
        tap(() => {
          this.apartmentService.selectApartment(details.apartmentId);
          this.cart.clear();
        }),
      );
  }
}
