import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, Subject } from 'rxjs';

import { Order } from '../../../../core/models/checkout.model';
import { OrderService } from '../../../../core/services/order.service';
import { OrderConfirmationComponent } from './order-confirmation.component';

describe('OrderConfirmationComponent', () => {
  const order: Order = {
    id: 'SAL1024',
    customerId: null,
    status: 'PLACED',
    items: [
      {
        saladId: 'protein-power-salad',
        name: 'Protein Power Salad',
        image: { url: '/images/protein-power-salad.jpg', alt: 'Salad' },
        unitPricePaise: 14900,
        quantity: 2,
        lineTotalPaise: 29800,
      },
    ],
    deliveryAddress: {
      apartmentId: 'apt_sunshine',
      apartmentName: 'Sunshine Apartments',
      block: 'B',
      flatNumber: '504',
    },
    deliverySlot: {
      id: 'slot_1230',
      startsAt: '2026-09-30T12:30:00+05:30',
      endsAt: '2026-09-30T13:00:00+05:30',
      available: true,
    },
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    subtotalPaise: 29800,
    deliveryChargePaise: 0,
    totalPaise: 29800,
    createdAt: '2026-09-30T07:00:00Z',
    updatedAt: '2026-09-30T07:00:00Z',
  };

  let fixture: ComponentFixture<OrderConfirmationComponent>;
  let order$: Subject<Order | null>;
  let service: jasmine.SpyObj<OrderService>;

  beforeEach(async () => {
    order$ = new Subject<Order | null>();
    service = jasmine.createSpyObj<OrderService>('OrderService', ['getOrder']);
    service.getOrder.and.returnValue(order$);

    await TestBed.configureTestingModule({
      imports: [OrderConfirmationComponent],
      providers: [
        provideRouter([]),
        { provide: OrderService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ orderId: order.id })),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderConfirmationComponent);
    fixture.detectChanges();
  });

  it('should request the route order and show a loading state', () => {
    expect(service.getOrder).toHaveBeenCalledOnceWith(order.id);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="status"]'),
    ).not.toBeNull();
  });

  it('should render refresh-safe confirmation details', () => {
    order$.next(order);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('h1')?.textContent).toContain(
      'Order Placed Successfully',
    );
    expect(element.textContent).toContain('#SAL1024');
    expect(element.textContent).toContain('12:30 PM');
    expect(element.textContent).toContain('₹298');
  });

  it('should render not found for an unknown session order', () => {
    order$.next(null);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Order not found',
    );
  });
});
