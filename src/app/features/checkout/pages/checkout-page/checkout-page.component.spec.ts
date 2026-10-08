import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of } from 'rxjs';

import {
  Apartment,
  DeliverySlot,
  Order,
} from '../../../../core/models/checkout.model';
import { Salad } from '../../../../core/models/salad.model';
import { ApartmentService } from '../../../../core/services/apartment.service';
import { CartService } from '../../../../core/services/cart.service';
import { CheckoutService } from '../../../../core/services/checkout.service';
import { CheckoutPageComponent } from './checkout-page.component';

describe('CheckoutPageComponent', () => {
  const apartment: Apartment = {
    id: 'apt_sunshine',
    name: 'Sunshine Apartments',
    blocks: ['A', 'B', 'C'],
    active: true,
  };
  const slot: DeliverySlot = {
    id: 'slot_1230',
    startsAt: '2026-09-30T12:30:00+05:30',
    endsAt: '2026-09-30T13:00:00+05:30',
    available: true,
  };
  const salad: Salad = {
    id: 'protein-power-salad',
    name: 'Protein Power Salad',
    description: 'Fresh salad.',
    pricePaise: 14900,
    image: { url: '/images/protein-power-salad.jpg', alt: 'Salad' },
    ingredients: ['Paneer'],
    available: true,
  };

  let fixture: ComponentFixture<CheckoutPageComponent>;
  let checkout: jasmine.SpyObj<CheckoutService>;

  beforeEach(async () => {
    const apartmentService = {
      selectedApartmentId: signal<string | null>(null),
      getActiveApartments: jasmine
        .createSpy('getActiveApartments')
        .and.returnValue(of([apartment])),
      getDeliverySlots: jasmine
        .createSpy('getDeliverySlots')
        .and.returnValue(of([slot])),
      selectApartment: jasmine.createSpy('selectApartment'),
    };
    const cart = {
      items: signal([{ salad, quantity: 2 }]),
      totals: signal({
        itemCount: 2,
        subtotalPaise: 29800,
        deliveryChargePaise: 0,
        totalPaise: 29800,
      }),
    };
    checkout = jasmine.createSpyObj<CheckoutService>('CheckoutService', [
      'placeOrder',
    ]);
    checkout.placeOrder.and.returnValue(of({ id: 'SAL1024' } as Order));

    await TestBed.configureTestingModule({
      imports: [CheckoutPageComponent],
      providers: [
        provideRouter([]),
        { provide: ApartmentService, useValue: apartmentService },
        { provide: CartService, useValue: cart },
        { provide: CheckoutService, useValue: checkout },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutPageComponent);
    fixture.detectChanges();
  });

  it('should load apartments and current delivery slots', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(
      element.querySelector<HTMLSelectElement>('#apartment')?.value,
    ).toBe(apartment.id);
    expect(element.querySelectorAll('input[type="radio"]').length).toBe(3);
    expect(element.textContent).toContain('12:30 PM');
  });

  it('should show accessible validation without creating an order', () => {
    const submit = (fixture.nativeElement as HTMLElement).querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    submit.click();
    fixture.detectChanges();

    expect(checkout.placeOrder).not.toHaveBeenCalled();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        '.error-summary[role="alert"]',
      ),
    ).not.toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Select your block',
    );
  });

  it('should submit valid delivery and payment details once', () => {
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.resolveTo(true);
    const element = fixture.nativeElement as HTMLElement;

    setValue(
      element.querySelector('#block') as HTMLSelectElement,
      'B',
      'change',
    );
    setValue(
      element.querySelector('#flat-number') as HTMLInputElement,
      '504',
      'input',
    );
    (
      element.querySelector('.radio-group input') as HTMLInputElement
    ).click();
    (
      element.querySelector('input[value="CASH"]') as HTMLInputElement
    ).click();
    fixture.detectChanges();

    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();

    expect(checkout.placeOrder).toHaveBeenCalledOnceWith({
      apartmentId: apartment.id,
      block: 'B',
      flatNumber: '504',
      deliverySlotId: slot.id,
      paymentMethod: 'CASH',
    });
    expect(navigate).toHaveBeenCalledOnceWith([
      '/checkout',
      'confirmation',
      'SAL1024',
    ]);
  });

  function setValue(
    control: HTMLInputElement | HTMLSelectElement,
    value: string,
    eventName: 'input' | 'change',
  ): void {
    control.value = value;
    control.dispatchEvent(new Event(eventName));
  }
});
