import { inject, Injectable } from '@angular/core';
import { delay, defer, forkJoin, map, Observable, of } from 'rxjs';

import {
  CreateOrderCommand,
  Order,
  OrderItem,
  PaymentMethod,
} from '../models/checkout.model';
import { EntityId } from '../models/salad.model';
import { APARTMENT_REPOSITORY } from './apartment.repository';
import { OrderCreationContext, OrderRepository } from './order.repository';
import { SALAD_REPOSITORY } from './salad.repository';

interface PersistedGuestOrders {
  readonly version: 1;
  readonly guestId: string;
  readonly orders: readonly Order[];
}

const ORDERS_STORAGE_KEY = 'healthybowl.guest-orders';

@Injectable()
export class MockOrderRepository implements OrderRepository {
  private readonly saladRepository = inject(SALAD_REPOSITORY);
  private readonly apartmentRepository = inject(APARTMENT_REPOSITORY);
  private readonly responseDelayMs = 350;

  create(
    command: CreateOrderCommand,
    context: OrderCreationContext,
  ): Observable<Order> {
    return forkJoin({
      salads: this.saladRepository.listCustomerCatalog(),
      apartments: this.apartmentRepository.listActive(),
      slots: this.apartmentRepository.listDeliverySlots(
        command.delivery.apartmentId,
        context.businessDate,
      ),
    }).pipe(
      delay(this.responseDelayMs),
      map(({ salads, apartments, slots }) => {
        validateCommand(command);

        const apartment = apartments.find(
          (candidate) =>
            candidate.id === command.delivery.apartmentId &&
            candidate.active,
        );
        if (
          !apartment ||
          !apartment.blocks.includes(command.delivery.block)
        ) {
          throw new Error('The selected delivery address is no longer valid.');
        }

        const slot = slots.find(
          (candidate) =>
            candidate.id === command.delivery.deliverySlotId &&
            candidate.available,
        );
        if (!slot) {
          throw new Error('The selected delivery slot is no longer available.');
        }

        const saladById = new Map(
          salads.map((salad) => [salad.id, salad] as const),
        );
        const orderItems: OrderItem[] = command.items.map((item) => {
          const salad = saladById.get(item.saladId);

          if (!salad?.available) {
            throw new Error(
              'One or more salads are no longer available today.',
            );
          }

          return {
            saladId: salad.id,
            name: salad.name,
            image: salad.image,
            unitPricePaise: salad.pricePaise,
            quantity: item.quantity,
            lineTotalPaise: salad.pricePaise * item.quantity,
          };
        });
        const subtotalPaise = orderItems.reduce(
          (total, item) => total + item.lineTotalPaise,
          0,
        );
        const now = new Date().toISOString();
        const order: Order = {
          id: createOrderId(),
          customerId: null,
          status: 'PLACED',
          items: orderItems,
          deliveryAddress: {
            apartmentId: apartment.id,
            apartmentName: apartment.name,
            block: command.delivery.block,
            flatNumber: command.delivery.flatNumber.trim(),
          },
          deliverySlot: slot,
          paymentMethod: command.paymentMethod,
          paymentStatus: 'PENDING',
          subtotalPaise,
          deliveryChargePaise: 0,
          totalPaise: subtotalPaise,
          createdAt: now,
          updatedAt: now,
        };

        const session = this.readOrCreateSession();
        this.writeSession({
          ...session,
          orders: [order, ...session.orders],
        });

        return order;
      }),
    );
  }

  getMineById(id: EntityId): Observable<Order | null> {
    return defer(() => {
      const session = this.readOrCreateSession();
      return of(session.orders.find((order) => order.id === id) ?? null);
    }).pipe(delay(this.responseDelayMs));
  }

  private readOrCreateSession(): PersistedGuestOrders {
    try {
      const stored = sessionStorage.getItem(ORDERS_STORAGE_KEY);
      if (stored !== null) {
        const parsed: unknown = JSON.parse(stored);
        if (isPersistedGuestOrders(parsed)) {
          return parsed;
        }

        sessionStorage.removeItem(ORDERS_STORAGE_KEY);
      }

      const session: PersistedGuestOrders = {
        version: 1,
        guestId: createGuestId(),
        orders: [],
      };
      this.writeSession(session);
      return session;
    } catch {
      throw new Error('Order storage is unavailable.');
    }
  }

  private writeSession(session: PersistedGuestOrders): void {
    try {
      sessionStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(session));
    } catch {
      throw new Error('Order storage is unavailable.');
    }
  }
}

function validateCommand(command: CreateOrderCommand): void {
  const seenSaladIds = new Set<string>();
  if (
    command.items.length === 0 ||
    !isPaymentMethod(command.paymentMethod) ||
    !/^[A-Za-z0-9][A-Za-z0-9 /_-]{0,19}$/.test(
      command.delivery.flatNumber.trim(),
    )
  ) {
    throw new Error('The order details are invalid.');
  }

  for (const item of command.items) {
    if (
      !item.saladId ||
      seenSaladIds.has(item.saladId) ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 20
    ) {
      throw new Error('The cart contains invalid items.');
    }
    seenSaladIds.add(item.saladId);
  }
}

function isPaymentMethod(value: unknown): value is PaymentMethod {
  return value === 'CASH' || value === 'UPI';
}

function createOrderId(): string {
  const timePart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
  return `SAL${timePart}${randomPart}`;
}

function createGuestId(): string {
  return `guest_${crypto.randomUUID()}`;
}

function isPersistedGuestOrders(value: unknown): value is PersistedGuestOrders {
  if (
    !isRecord(value) ||
    value['version'] !== 1 ||
    typeof value['guestId'] !== 'string' ||
    value['guestId'].length === 0 ||
    !Array.isArray(value['orders'])
  ) {
    return false;
  }

  return value['orders'].every(isOrder);
}

function isOrder(value: unknown): value is Order {
  return (
    isRecord(value) &&
    isNonEmptyString(value['id']) &&
    value['customerId'] === null &&
    isOrderStatus(value['status']) &&
    Array.isArray(value['items']) &&
    value['items'].length > 0 &&
    value['items'].every(isOrderItem) &&
    isRecord(value['deliveryAddress']) &&
    isNonEmptyString(value['deliveryAddress']['apartmentId']) &&
    isNonEmptyString(value['deliveryAddress']['apartmentName']) &&
    isNonEmptyString(value['deliveryAddress']['block']) &&
    isNonEmptyString(value['deliveryAddress']['flatNumber']) &&
    isRecord(value['deliverySlot']) &&
    isNonEmptyString(value['deliverySlot']['id']) &&
    isNonEmptyString(value['deliverySlot']['startsAt']) &&
    isNonEmptyString(value['deliverySlot']['endsAt']) &&
    typeof value['deliverySlot']['available'] === 'boolean' &&
    isPaymentMethod(value['paymentMethod']) &&
    isPaymentStatus(value['paymentStatus']) &&
    isMoney(value['subtotalPaise']) &&
    isMoney(value['deliveryChargePaise']) &&
    isMoney(value['totalPaise']) &&
    isNonEmptyString(value['createdAt']) &&
    isNonEmptyString(value['updatedAt'])
  );
}

function isOrderItem(value: unknown): boolean {
  return (
    isRecord(value) &&
    isNonEmptyString(value['saladId']) &&
    isNonEmptyString(value['name']) &&
    isRecord(value['image']) &&
    isNonEmptyString(value['image']['url']) &&
    isNonEmptyString(value['image']['alt']) &&
    isMoney(value['unitPricePaise']) &&
    Number.isInteger(value['quantity']) &&
    (value['quantity'] as number) >= 1 &&
    (value['quantity'] as number) <= 20 &&
    isMoney(value['lineTotalPaise'])
  );
}

function isOrderStatus(value: unknown): boolean {
  return [
    'PLACED',
    'CONFIRMED',
    'PREPARING',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
  ].includes(value as string);
}

function isPaymentStatus(value: unknown): boolean {
  return [
    'PENDING',
    'AUTHORIZED',
    'PAID',
    'FAILED',
    'REFUNDED',
  ].includes(value as string);
}

function isMoney(value: unknown): boolean {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= 0
  );
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
