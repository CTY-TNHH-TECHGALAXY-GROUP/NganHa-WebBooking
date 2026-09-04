'use client';

import { CartItem, Service, ServiceOptions } from '@/components/Menu/types';

export const CART_STORAGE_VERSION = 2;
export const CART_TTL_DAYS = 7;
export const CART_TTL_MS = CART_TTL_DAYS * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export const BOOKING_CART_STORAGE_KEY_V2 = 'nganha_booking_cart_v2';
export const BOOKING_CART_STORAGE_KEY_V1 = 'nganha_booking_cart_v1';
const LEGACY_FALLBACK_KEYS = ['BOOKING_CART', 'booking_cart'];

export interface CartStorageSchemaV2 {
  version: 2;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
  items: CartItem[];
}

const makeCartId = (serviceId: string) =>
  `${serviceId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage);

/**
 * Migrate legacy v1 cart array to structured v2 cart schema with TTL
 */
const migrateV1CartToV2 = (legacyRaw: string): CartItem[] => {
  try {
    const parsed = JSON.parse(legacyRaw);
    if (!Array.isArray(parsed)) return [];

    const validItems: CartItem[] = parsed.filter(
      (item) => item && typeof item === 'object' && item.id
    );

    if (validItems.length > 0) {
      const now = Date.now();
      const v2Payload: CartStorageSchemaV2 = {
        version: 2,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + CART_TTL_MS,
        items: validItems,
      };
      window.localStorage.setItem(BOOKING_CART_STORAGE_KEY_V2, JSON.stringify(v2Payload));
      // Cleanup legacy keys
      window.localStorage.removeItem(BOOKING_CART_STORAGE_KEY_V1);
      LEGACY_FALLBACK_KEYS.forEach((k) => window.localStorage.removeItem(k));
      console.log(`[bookingCartStorage] Successfully migrated ${validItems.length} items from cart v1 to v2`);
    }
    return validItems;
  } catch (err) {
    console.warn('[bookingCartStorage] Failed to migrate legacy cart:', err);
    return [];
  }
};

/**
 * Đọc danh sách CartItem từ storage (tự động validate TTL, corrupt JSON, migrate v1)
 */
export const readBookingCart = (): CartItem[] => {
  if (!isBrowser()) return [];

  try {
    // 1. Thử đọc v2
    const rawV2 = window.localStorage.getItem(BOOKING_CART_STORAGE_KEY_V2);
    if (rawV2) {
      try {
        const parsed = JSON.parse(rawV2);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.items)) {
          // Check TTL expiration
          if (parsed.expiresAt && Date.now() > Number(parsed.expiresAt)) {
            console.log('[bookingCartStorage] Cart expired based on TTL. Clearing cart.');
            clearBookingCart();
            return [];
          }
          // Filter valid items
          return parsed.items.filter(
            (item: any) => item && typeof item === 'object' && item.id && (item.qty || 1) > 0
          );
        }
      } catch (jsonErr) {
        console.warn('[bookingCartStorage] Corrupted v2 JSON in storage. Purging corrupted cart:', jsonErr);
        window.localStorage.removeItem(BOOKING_CART_STORAGE_KEY_V2);
      }
    }

    // 2. Thử đọc v1 legacy nếu v2 chưa có
    const rawV1 = window.localStorage.getItem(BOOKING_CART_STORAGE_KEY_V1);
    if (rawV1) {
      return migrateV1CartToV2(rawV1);
    }

    // 3. Fallback kiểm tra các key cũ
    for (const key of LEGACY_FALLBACK_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy) {
        return migrateV1CartToV2(legacy);
      }
    }

    return [];
  } catch (error) {
    console.warn('[bookingCartStorage] Unable to read cart:', error);
    return [];
  }
};

/**
 * Ghi danh sách CartItem vào storage với v2 metadata (TTL 7 ngày)
 */
export const writeBookingCart = (cart: CartItem[]) => {
  if (!isBrowser()) return;

  try {
    const now = Date.now();
    // Đọc createdAt cũ nếu có để giữ nguyên lịch sử tạo
    let createdAt = now;
    try {
      const existingRaw = window.localStorage.getItem(BOOKING_CART_STORAGE_KEY_V2);
      if (existingRaw) {
        const parsed = JSON.parse(existingRaw);
        if (parsed?.createdAt) createdAt = parsed.createdAt;
      }
    } catch {
      // ignore
    }

    const payload: CartStorageSchemaV2 = {
      version: 2,
      createdAt,
      updatedAt: now,
      expiresAt: now + CART_TTL_MS,
      items: cart,
    };

    window.localStorage.setItem(BOOKING_CART_STORAGE_KEY_V2, JSON.stringify(payload));
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

export const updateBookingCartItemOptions = (
  cartId: string,
  options: Partial<ServiceOptions>
) => {
  const current = readBookingCart();
  const index = current.findIndex((item) => item.cartId === cartId);
  if (index < 0) return current;

  const next = [...current];
  const item = next[index];
  const nextOptions = {
    ...item.options,
    ...options,
  };

  const basePriceVND = item.basePriceVND ?? item.priceVND;
  const basePriceUSD = item.basePriceUSD ?? item.priceUSD;

  let newPriceVND = basePriceVND;
  let newPriceUSD = basePriceUSD;

  if (nextOptions.addons?.privateRoom) {
    newPriceVND += 105000;
    newPriceUSD += 5;
  }

  next[index] = {
    ...item,
    basePriceVND,
    basePriceUSD,
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
    window.localStorage.removeItem(BOOKING_CART_STORAGE_KEY_V2);
    window.localStorage.removeItem(BOOKING_CART_STORAGE_KEY_V1);
    LEGACY_FALLBACK_KEYS.forEach((k) => window.localStorage.removeItem(k));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: [] }));
  } catch (error) {
    console.warn('[bookingCartStorage] Unable to clear cart:', error);
  }
};

/**
 * Đồng bộ & kiểm định lại giỏ hàng với Server Canonical Pricing (/api/bookings/reprice)
 */
export const revalidateCartWithServer = async (): Promise<{
  valid: boolean;
  hasPriceChanged: boolean;
  unavailableItems: { id: string; cartId?: string; reason: string }[];
  updatedCart: CartItem[];
}> => {
  const currentCart = readBookingCart();
  if (currentCart.length === 0) {
    return { valid: true, hasPriceChanged: false, unavailableItems: [], updatedCart: [] };
  }

  try {
    const res = await fetch('/api/bookings/reprice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: currentCart.map((i) => ({
          id: i.id,
          cartId: i.cartId,
          qty: i.qty,
          priceVND: i.priceVND,
          priceUSD: i.priceUSD,
          options: i.options,
        })),
      }),
    });

    if (!res.ok) {
      return { valid: true, hasPriceChanged: false, unavailableItems: [], updatedCart: currentCart };
    }

    const data = await res.json();
    const unavailableSet = new Set(
      (data.unavailableItems || []).map((u: any) => u.cartId || u.id)
    );

    // Cập nhật giá canonical từ server vào cart
    const repricedMap = new Map<string, any>();
    (data.items || []).forEach((ri: any) => {
      if (ri.cartId) repricedMap.set(ri.cartId, ri);
      else repricedMap.set(ri.id, ri);
    });

    let modified = false;
    const nextCart: CartItem[] = [];

    for (const item of currentCart) {
      if (unavailableSet.has(item.cartId) || unavailableSet.has(item.id)) {
        modified = true;
        continue; // Loại bỏ món không còn khả dụng
      }

      const fresh = repricedMap.get(item.cartId) || repricedMap.get(item.id);
      if (fresh) {
        if (
          item.priceVND !== fresh.priceVND ||
          item.basePriceVND !== fresh.basePriceVND
        ) {
          modified = true;
        }
        nextCart.push({
          ...item,
          basePriceVND: fresh.basePriceVND,
          basePriceUSD: fresh.basePriceUSD,
          priceVND: fresh.priceVND,
          priceUSD: fresh.priceUSD,
          timeValue: fresh.duration || item.timeValue,
        });
      } else {
        nextCart.push(item);
      }
    }

    if (modified) {
      writeBookingCart(nextCart);
      window.dispatchEvent(new CustomEvent('cartUpdated', { detail: nextCart }));
    }

    return {
      valid: data.valid,
      hasPriceChanged: data.hasPriceChanged || modified,
      unavailableItems: data.unavailableItems || [],
      updatedCart: nextCart,
    };
  } catch (err) {
    console.warn('[bookingCartStorage] Server reprice request failed:', err);
    return { valid: true, hasPriceChanged: false, unavailableItems: [], updatedCart: currentCart };
  }
};
