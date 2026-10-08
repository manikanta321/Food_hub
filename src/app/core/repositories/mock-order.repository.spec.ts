import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of } from 'rxjs';

import { Apartment, DeliverySlot } from '../models/checkout.model';
import { Salad } from '../models/salad.model';
import {
  ApartmentRepository,
  APARTMENT_REPOSITORY,
} from './apartment.repository';
import { MockOrderRepository } from './mock-order.repository';
import {
  SaladRepository,
  SALAD_REPOSITORY,
} from './salad.repository';

describe('MockOrderRepository', () => {
  const storageKey = 'healthybowl.guest-orders';
  const salad: Salad = {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description: 'Fresh salad.',
    pricePaise: 14900,
    image: { url: '/images/protein-power-salad.jpg', alt: 'Salad' },
    ingredients: ['Paneer'],
    available: true,
  };
  const apartment: Apartment = {
    id: 'apt_sunshine',
    name: 'Sunshine Apartments',
    blocks: ['A', 'B'],
    active: true,
  };
  const slot: DeliverySlot = {
    id: 'slot_1230',
    startsAt: '2026-09-30T12:30:00+05:30',
    endsAt: '2026-09-30T13:00:00+05:30',
    available: true,
  };

  beforeEach(() => {
    sessionStorage.removeItem(storageKey);

    const salads = jasmine.createSpyObj<SaladRepository>('SaladRepository', [
      'listCustomerCatalog',
      'getById',
    ]);
    salads.listCustomerCatalog.and.returnValue(of([salad]));

    const apartments = jasmine.createSpyObj<ApartmentRepository>(
      'ApartmentRepository',
      ['listActive', 'listDeliverySlots'],
    );
    apartments.listActive.and.returnValue(of([apartment]));
    apartments.listDeliverySlots.and.returnValue(of([slot]));

    TestBed.configureTestingModule({
      providers: [
        MockOrderRepository,
        { provide: SALAD_REPOSITORY, useValue: salads },
        { provide: APARTMENT_REPOSITORY, useValue: apartments },
      ],
    });
  });

  afterEach(() => sessionStorage.removeItem(storageKey));

  it('should recalculate immutable order snapshots and reload by ID', async () => {
    const repository = TestBed.inject(MockOrderRepository);
    const order = await firstValueFrom(
      repository.create(
        {
          items: [{ saladId: salad.id, quantity: 2 }],
          delivery: {
            apartmentId: apartment.id,
            block: 'B',
            flatNumber: '504',
            deliverySlotId: slot.id,
          },
          paymentMethod: 'CASH',
        },
        { businessDate: '2026-09-30' },
      ),
    );

    expect(order.status).toBe('PLACED');
    expect(order.items[0].lineTotalPaise).toBe(29800);
    expect(order.totalPaise).toBe(29800);
    expect(order.deliveryAddress.apartmentName).toBe('Sunshine Apartments');

    const stored = await firstValueFrom(repository.getMineById(order.id));
    expect(stored).toEqual(order);
  });
});
