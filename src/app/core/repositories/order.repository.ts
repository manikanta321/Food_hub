import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { CreateOrderCommand, Order } from '../models/checkout.model';
import { EntityId, LocalDate } from '../models/salad.model';

export interface OrderCreationContext {
  readonly businessDate: LocalDate;
}

export interface OrderRepository {
  create(
    command: CreateOrderCommand,
    context: OrderCreationContext,
  ): Observable<Order>;
  getMineById(id: EntityId): Observable<Order | null>;
}

export const ORDER_REPOSITORY =
  new InjectionToken<OrderRepository>('ORDER_REPOSITORY');
