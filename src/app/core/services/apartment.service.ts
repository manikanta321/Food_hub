import { inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

import { Apartment, DeliverySlot } from '../models/checkout.model';
import { EntityId, LocalDate } from '../models/salad.model';
import { APARTMENT_REPOSITORY } from '../repositories/apartment.repository';

const SELECTED_APARTMENT_KEY = 'healthybowl.selected-apartment';

@Injectable()
export class ApartmentService {
  private readonly repository = inject(APARTMENT_REPOSITORY);
  private readonly mutableSelectedApartmentId = signal<EntityId | null>(
    readSelectedApartmentId(),
  );

  readonly selectedApartmentId =
    this.mutableSelectedApartmentId.asReadonly();

  getActiveApartments(): Observable<readonly Apartment[]> {
    return this.repository.listActive();
  }

  getDeliverySlots(
    apartmentId: EntityId,
    date: LocalDate,
  ): Observable<readonly DeliverySlot[]> {
    return this.repository.listDeliverySlots(apartmentId, date);
  }

  selectApartment(apartmentId: EntityId | null): void {
    this.mutableSelectedApartmentId.set(apartmentId);

    try {
      if (apartmentId) {
        sessionStorage.setItem(SELECTED_APARTMENT_KEY, apartmentId);
      } else {
        sessionStorage.removeItem(SELECTED_APARTMENT_KEY);
      }
    } catch {
      // Selection remains usable in memory when browser storage is unavailable.
    }
  }
}

export function currentBusinessDate(): LocalDate {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}`;
}

function readSelectedApartmentId(): EntityId | null {
  try {
    const value = sessionStorage.getItem(SELECTED_APARTMENT_KEY);
    return value?.trim() ? value : null;
  } catch {
    return null;
  }
}
