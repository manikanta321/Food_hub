import { InjectionToken } from '@angular/core';

import { PersistedCart } from '../models/cart.model';

export type CartStorageReadResult =
  | { readonly kind: 'success'; readonly cart: PersistedCart | null }
  | { readonly kind: 'error' };

export interface CartStorage {
  read(): CartStorageReadResult;
  write(cart: PersistedCart): boolean;
  clear(): boolean;
}

const CART_STORAGE_KEY = 'healthybowl.cart';

export const CART_STORAGE = new InjectionToken<CartStorage>('CART_STORAGE', {
  factory: () => new SessionCartStorage(),
});

class SessionCartStorage implements CartStorage {
  read(): CartStorageReadResult {
    try {
      const value = sessionStorage.getItem(CART_STORAGE_KEY);

      if (value === null) {
        return { kind: 'success', cart: null };
      }

      const parsed: unknown = JSON.parse(value);
      if (!isPersistedCart(parsed)) {
        sessionStorage.removeItem(CART_STORAGE_KEY);
        return { kind: 'error' };
      }

      return { kind: 'success', cart: parsed };
    } catch {
      return { kind: 'error' };
    }
  }

  write(cart: PersistedCart): boolean {
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
      return true;
    } catch {
      return false;
    }
  }

  clear(): boolean {
    try {
      sessionStorage.removeItem(CART_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }
}

function isPersistedCart(value: unknown): value is PersistedCart {
  if (!isRecord(value) || value['version'] !== 1) {
    return false;
  }

  const items = value['items'];
  if (!Array.isArray(items)) {
    return false;
  }

  const saladIds = new Set<string>();

  return items.every((item) => {
    if (
      !isRecord(item) ||
      typeof item['saladId'] !== 'string' ||
      item['saladId'].trim() !== item['saladId'] ||
      item['saladId'].length === 0 ||
      !Number.isInteger(item['quantity']) ||
      (item['quantity'] as number) < 1 ||
      (item['quantity'] as number) > 20 ||
      saladIds.has(item['saladId'])
    ) {
      return false;
    }

    saladIds.add(item['saladId']);
    return true;
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
