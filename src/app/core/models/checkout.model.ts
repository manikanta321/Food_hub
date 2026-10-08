import {
  EntityId,
  IsoDateTime,
  MoneyPaise,
  ProductImage,
} from './salad.model';

export interface Apartment {
  readonly id: EntityId;
  readonly name: string;
  readonly blocks: readonly string[];
  readonly active: boolean;
}

export interface DeliveryAddress {
  readonly apartmentId: EntityId;
  readonly apartmentName: string;
  readonly block: string;
  readonly flatNumber: string;
}

export interface DeliverySlot {
  readonly id: EntityId;
  readonly startsAt: IsoDateTime;
  readonly endsAt: IsoDateTime;
  readonly available: boolean;
}

export type PaymentMethod = 'CASH' | 'UPI';
export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED';

export type OrderStatus =
  | 'PLACED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  readonly saladId: EntityId;
  readonly name: string;
  readonly image: ProductImage;
  readonly unitPricePaise: MoneyPaise;
  readonly quantity: number;
  readonly lineTotalPaise: MoneyPaise;
}

export interface Order {
  readonly id: EntityId;
  readonly customerId: EntityId | null;
  readonly status: OrderStatus;
  readonly items: readonly OrderItem[];
  readonly deliveryAddress: DeliveryAddress;
  readonly deliverySlot: DeliverySlot;
  readonly paymentMethod: PaymentMethod;
  readonly paymentStatus: PaymentStatus;
  readonly subtotalPaise: MoneyPaise;
  readonly deliveryChargePaise: MoneyPaise;
  readonly totalPaise: MoneyPaise;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
}

export interface CheckoutDetails {
  readonly apartmentId: EntityId;
  readonly block: string;
  readonly flatNumber: string;
  readonly deliverySlotId: EntityId;
  readonly paymentMethod: PaymentMethod;
}

export interface CreateOrderCommand {
  readonly items: readonly {
    readonly saladId: EntityId;
    readonly quantity: number;
  }[];
  readonly delivery: {
    readonly apartmentId: EntityId;
    readonly block: string;
    readonly flatNumber: string;
    readonly deliverySlotId: EntityId;
  };
  readonly paymentMethod: PaymentMethod;
}
