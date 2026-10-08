import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Order } from '../models/checkout.model';
import { EntityId } from '../models/salad.model';
import { ORDER_REPOSITORY } from '../repositories/order.repository';

@Injectable()
export class OrderService {
  private readonly repository = inject(ORDER_REPOSITORY);

  getOrder(id: EntityId): Observable<Order | null> {
    return this.repository.getMineById(id);
  }
}
