import { Injectable } from '@angular/core';
import { delay, Observable, of, throwError } from 'rxjs';

import { Apartment, DeliverySlot } from '../models/checkout.model';
import { EntityId, LocalDate } from '../models/salad.model';
import { ApartmentRepository } from './apartment.repository';

export const MOCK_APARTMENTS: readonly Apartment[] = [
  {
    id: 'apt_sunshine',
    name: 'Sunshine Apartments',
    blocks: ['A', 'B', 'C'],
    active: true,
  },
  {
    id: 'apt_green_heights',
    name: 'Green Heights',
    blocks: ['North', 'South'],
    active: true,
  },
] as const;

@Injectable()
export class MockApartmentRepository implements ApartmentRepository {
  private readonly responseDelayMs = 250;

  listActive(): Observable<readonly Apartment[]> {
    return of(MOCK_APARTMENTS.filter((apartment) => apartment.active)).pipe(
      delay(this.responseDelayMs),
    );
  }

  listDeliverySlots(
    apartmentId: EntityId,
    date: LocalDate,
  ): Observable<readonly DeliverySlot[]> {
    const apartment = MOCK_APARTMENTS.find(
      (candidate) => candidate.id === apartmentId && candidate.active,
    );

    if (!apartment || !isLocalDate(date)) {
      return throwError(() => new Error('Delivery slots are unavailable.'));
    }

    return of(createSlots(apartmentId, date)).pipe(
      delay(this.responseDelayMs),
    );
  }
}

function createSlots(
  apartmentId: EntityId,
  date: LocalDate,
): readonly DeliverySlot[] {
  return [
    {
      id: `${apartmentId}_${date}_1230`,
      startsAt: `${date}T12:30:00+05:30`,
      endsAt: `${date}T13:00:00+05:30`,
      available: true,
    },
    {
      id: `${apartmentId}_${date}_1300`,
      startsAt: `${date}T13:00:00+05:30`,
      endsAt: `${date}T13:30:00+05:30`,
      available: true,
    },
    {
      id: `${apartmentId}_${date}_1330`,
      startsAt: `${date}T13:30:00+05:30`,
      endsAt: `${date}T14:00:00+05:30`,
      available: true,
    },
  ];
}

function isLocalDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
