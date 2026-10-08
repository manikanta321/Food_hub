import { MoneyPaise, Salad } from './salad.model';

export interface CartItem {
  readonly salad: Salad;
  readonly quantity: number;
}

export interface Cart {
  readonly items: readonly CartItem[];
  readonly deliveryChargePaise: MoneyPaise;
}

export interface CartTotals {
  readonly itemCount: number;
  readonly subtotalPaise: MoneyPaise;
  readonly deliveryChargePaise: MoneyPaise;
  readonly totalPaise: MoneyPaise;
}

export interface PersistedCartItem {
  readonly saladId: string;
  readonly quantity: number;
}

export interface PersistedCart {
  readonly version: 1;
  readonly items: readonly PersistedCartItem[];
}
