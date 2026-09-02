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
): CartItem => {
  const mergedOptions = options || {};
  let newPriceVND = service.priceVND;
  let newPriceUSD = service.priceUSD;
  
  if (mergedOptions.addons?.privateRoom) {
    newPriceVND += 105000;
    newPriceUSD += 5;
  }

  return {
    ...service,
    cartId: makeCartId(service.id),
    qty,
    options: mergedOptions,
    basePriceVND: service.priceVND,
    basePriceUSD: service.priceUSD,
    priceVND: newPriceVND,
    priceUSD: newPriceUSD,
  };
};

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

export const updateBookingCartItemQuantity = (cartId: string, delta: number) => {
  const current = readBookingCart();
  const index = current.findIndex((item) => item.cartId === cartId);
  if (index < 0) return current;

  const nextQty = (current[index].qty || 1) + delta;
  if (nextQty <= 0) {
    return removeBookingCartItemByCartId(cartId);
  }

  const next = [...current];
  next[index] = { ...next[index], qty: nextQty };
  writeBookingCart(next);
  return next;
};

export const updateBookingCartItemNote = (cartId: string, content: string) => {
  const current = readBookingCart();
  const index = current.findIndex((item) => item.cartId === cartId);
  if (index < 0) return current;

  const next = [...current];
  const item = next[index];
  next[index] = {
    ...item,
    options: {
      ...item.options,
      notes: {
        ...(item.options?.notes || { tag0: false, tag1: false, content: '' }),
        content,
      },
    },
  };
  writeBookingCart(next);
  return next;
};

export const updateBookingCartItemOptions = (cartId: string, options: Partial<ServiceOptions>) => {
  const current = readBookingCart();
  const index = current.findIndex((item) => item.cartId === cartId);
  if (index < 0) return current;

  const next = [...current];
  const item = next[index];
  const nextOptions = {
    ...item.options,
    ...options,
  };
  
  let newPriceVND = item.basePriceVND ?? item.priceVND;
  let newPriceUSD = item.basePriceUSD ?? item.priceUSD;
  
  if (nextOptions.addons?.privateRoom) {
    newPriceVND += 105000;
    newPriceUSD += 5; // Assuming ~5 USD
  }

  next[index] = {
    ...item,
    options: nextOptions,
    priceVND: newPriceVND,
    priceUSD: newPriceUSD,
  };
  writeBookingCart(next);
  return next;
};

export const clearBookingCart = () => {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(BOOKING_CART_STORAGE_KEY);
    window.localStorage.removeItem('BOOKING_CART');
    window.localStorage.removeItem('booking_cart');
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
  } catch (error) {
    console.warn('[bookingCartStorage] Unable to clear cart:', error);
  }
};
