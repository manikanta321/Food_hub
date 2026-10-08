import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

import { Apartment, DeliverySlot } from '../models/checkout.model';
import { EntityId, LocalDate } from '../models/salad.model';

export interface ApartmentRepository {
  listActive(): Observable<readonly Apartment[]>;
  listDeliverySlots(
    apartmentId: EntityId,
    date: LocalDate,
  ): Observable<readonly DeliverySlot[]>;
}

export const APARTMENT_REPOSITORY =
  new InjectionToken<ApartmentRepository>('APARTMENT_REPOSITORY');
