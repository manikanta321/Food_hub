import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  CartItem,
  CartTotals,
  PersistedCart,
} from '../models/cart.model';
import { EntityId, Salad } from '../models/salad.model';
import { CART_STORAGE } from '../storage/cart-storage';
import { SaladService } from './salad.service';

@Injectable()
export class CartService {
  private readonly saladService = inject(SaladService);
  private readonly storage = inject(CART_STORAGE);
  private readonly destroyRef = inject(DestroyRef);
  private readonly mutableItems = signal<readonly CartItem[]>([]);
  private readonly mutableReady = signal(false);
  private readonly mutableRecoveryNotice = signal(false);
  private readonly mutableAnnouncement = signal('');

  readonly items = this.mutableItems.asReadonly();
  readonly ready = this.mutableReady.asReadonly();
  readonly recoveryNotice = this.mutableRecoveryNotice.asReadonly();
  readonly announcement = this.mutableAnnouncement.asReadonly();
  readonly totals = computed<CartTotals>(() => {
    const items = this.mutableItems();
    const subtotalPaise = items.reduce(
      (total, item) => total + item.salad.pricePaise * item.quantity,
      0,
    );
    const deliveryChargePaise = 0;

    return {
      itemCount: items.reduce((total, item) => total + item.quantity, 0),
      subtotalPaise,
      deliveryChargePaise,
      totalPaise: subtotalPaise + deliveryChargePaise,
    };
  });
  readonly itemCount = computed(() => this.totals().itemCount);
  readonly isEmpty = computed(() => this.mutableItems().length === 0);
  readonly hasUnavailableItems = computed(() =>
    this.mutableItems().some((item) => !item.salad.available),
  );
  readonly canCheckout = computed(
    () =>
      this.mutableReady() &&
      !this.isEmpty() &&
      !this.hasUnavailableItems(),
  );

  constructor() {
    this.hydrate();
  }

  addItem(salad: Salad, quantity = 1): boolean {
    if (!salad.available || !isValidQuantity(quantity)) {
      return false;
    }

    const existing = this.mutableItems().find(
      (item) => item.salad.id === salad.id,
    );
    const nextQuantity = Math.min(
      (existing?.quantity ?? 0) + quantity,
      20,
    );

    if (existing?.quantity === nextQuantity) {
      this.mutableAnnouncement.set(
        `${salad.name} is already at the maximum quantity of 20.`,
      );
      return false;
    }

    this.mutableItems.update((items) =>
      existing
        ? items.map((item) =>
            item.salad.id === salad.id
              ? { salad, quantity: nextQuantity }
              : item,
          )
        : [...items, { salad, quantity: nextQuantity }],
    );
    this.mutableAnnouncement.set(
      `${salad.name} quantity is now ${nextQuantity} in your cart.`,
    );
    this.persist();
    return true;
  }

  increaseQuantity(saladId: EntityId): void {
    const item = this.findItem(saladId);

    if (item?.salad.available) {
      this.setQuantity(saladId, Math.min(item.quantity + 1, 20));
    }
  }

  decreaseQuantity(saladId: EntityId): void {
    const item = this.findItem(saladId);

    if (item?.salad.available) {
      this.setQuantity(saladId, Math.max(item.quantity - 1, 1));
    }
  }

  setQuantity(saladId: EntityId, quantity: number): boolean {
    const item = this.findItem(saladId);

    if (
      !item?.salad.available ||
      !isValidQuantity(quantity) ||
      item.quantity === quantity
    ) {
      return false;
    }

    this.mutableItems.update((items) =>
      items.map((current) =>
        current.salad.id === saladId ? { ...current, quantity } : current,
      ),
    );
    this.mutableAnnouncement.set(
      `${item.salad.name} quantity changed to ${quantity}.`,
    );
    this.persist();
    return true;
  }

  removeItem(saladId: EntityId): void {
    const item = this.findItem(saladId);

    if (!item) {
      return;
    }

    this.mutableItems.update((items) =>
      items.filter((current) => current.salad.id !== saladId),
    );
    this.mutableAnnouncement.set(`${item.salad.name} removed from your cart.`);
    this.persist();
  }

  clear(): void {
    this.mutableItems.set([]);
    this.mutableAnnouncement.set('Your cart has been cleared.');
    this.persist();
  }

  dismissRecoveryNotice(): void {
    this.mutableRecoveryNotice.set(false);
  }

  private hydrate(): void {
    const result = this.storage.read();

    if (result.kind === 'error') {
      this.recoverFromStorageFailure();
      return;
    }

    if (result.cart === null || result.cart.items.length === 0) {
      this.mutableReady.set(true);
      return;
    }

    this.saladService
      .getCustomerCatalog()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (salads) => {
          const saladById = new Map(
            salads.map((salad) => [salad.id, salad] as const),
          );
          const hydrated = result.cart!.items.flatMap((persistedItem) => {
            const salad = saladById.get(persistedItem.saladId);

            return salad
              ? [{ salad, quantity: persistedItem.quantity }]
              : [];
          });

          this.mutableItems.set(
            mergeCartItems(hydrated, this.mutableItems()),
          );
          this.mutableReady.set(true);
          this.persist();
        },
        error: () => this.recoverFromStorageFailure(),
      });
  }

  private recoverFromStorageFailure(): void {
    this.storage.clear();
    this.mutableRecoveryNotice.set(true);
    this.mutableReady.set(true);
  }

  private findItem(saladId: EntityId): CartItem | undefined {
    return this.mutableItems().find((item) => item.salad.id === saladId);
  }

  private persist(): void {
    const cart: PersistedCart = {
      version: 1,
      items: this.mutableItems().map((item) => ({
        saladId: item.salad.id,
        quantity: item.quantity,
      })),
    };

    if (!this.storage.write(cart)) {
      this.mutableRecoveryNotice.set(true);
    }
  }
}

function isValidQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity >= 1 && quantity <= 20;
}

function mergeCartItems(
  first: readonly CartItem[],
  second: readonly CartItem[],
): readonly CartItem[] {
  const merged = new Map<EntityId, CartItem>();

  for (const item of [...first, ...second]) {
    const existing = merged.get(item.salad.id);
    merged.set(item.salad.id, {
      salad: item.salad,
      quantity: Math.min((existing?.quantity ?? 0) + item.quantity, 20),
    });
  }

  return [...merged.values()];
}
