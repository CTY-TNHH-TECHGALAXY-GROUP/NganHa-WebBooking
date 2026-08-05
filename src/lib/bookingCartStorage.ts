'use client';

import { CartItem, Service, ServiceOptions } from '@/components/Menu/types';

const BOOKING_CART_STORAGE_KEY = 'nganha_booking_cart_v1';

const makeCartId = (serviceId: string) =>
  `${serviceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage);

export const readBookingCart = (): CartItem[] => {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(BOOKING_CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch (error) {
    console.warn('[bookingCartStorage] Unable to read cart:', error);
    return [];
  }
};

export const writeBookingCart = (cart: CartItem[]) => {
  if (!isBrowser()) return;

  try {
    window.localStorage.setItem(BOOKING_CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.warn('[bookingCartStorage] Unable to write cart:', error);
  }
};

export const serviceToCartItem = (
  service: Service,
  qty = 1,
  options?: ServiceOptions
): CartItem => ({
  ...service,
  cartId: makeCartId(service.id),
  qty,
  options: options || {},
});

export const appendBookingCartItem = (
  service: Service,
  qty = 1,
  options?: ServiceOptions
) => {
  const current = readBookingCart();
  const next = [...current, serviceToCartItem(service, qty, options)];
  writeBookingCart(next);
  return next;
};

export const removeOneBookingCartItem = (serviceId: string) => {
  const current = readBookingCart();
  const index = current.findIndex((item) => item.id === serviceId);
  if (index < 0) return current;

  const next = [...current.slice(0, index), ...current.slice(index + 1)];
  writeBookingCart(next);
  return next;
};

export const removeBookingCartItemByCartId = (cartId: string) => {
  const current = readBookingCart();
  const next = current.filter((item) => item.cartId !== cartId);
  writeBookingCart(next);
  return next;
};
