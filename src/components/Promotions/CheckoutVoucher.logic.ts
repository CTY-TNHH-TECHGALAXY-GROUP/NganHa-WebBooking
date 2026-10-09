'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readWallet, subscribeWallet, type WebVoucherStatus } from '@/lib/voucherWallet';

// 🔧 CONFIGURATION
const REPREVIEW_DEBOUNCE_MS = 600;
/** Errors that say nothing about the voucher itself: keep the code, the writer decides at booking. */
const TRANSIENT_PREVIEW_ERRORS = new Set(['RATE_LIMITED', 'INTERNAL_ERROR', 'NETWORK', 'UNKNOWN', 'BOT_DETECTED']);

export interface CheckoutCartLine {
  id: string;
  qty?: number;
  options?: unknown;
}

/** Shown under the invoice total and sent with the booking (display only; the writer decides). */
export interface AppliedVoucher {
  code: string;
  discountAmount: number;
  subtotalAmount: number;
  totalAmount: number;
  /** Amounts belong to an older cart (refresh pending or failed): do not display them. */
  stale?: boolean;
}

export interface SavedCandidate {
  code: string;
  expiresAt: string | null;
}

type PreviewData = {
  eligible: boolean;
  unmetReasons?: string[];
  discountAmount: number;
  subtotalAmount: number;
  totalAmount: number;
};
type ApiBody<T> = { success: boolean; data?: T; error?: { code: string } };

const getJson = async <T>(url: string, init?: RequestInit) => {
  const res = await fetch(url, { cache: 'no-store', ...init });
  return (await res.json()) as ApiBody<T>;
};

const previewItems = (cart: CheckoutCartLine[]) => cart.map((item) => ({ id: item.id, quantity: item.qty || 1, options: item.options || {} }));

/**
 * Checkout voucher state. Never blocks booking: every failure leaves the
 * checkout without a voucher. `applied` is non-null only for an eligible code.
 */
/** `bookingAt`: `${date}T${time}:00` (VN wall time) once a slot is picked, else null. */
export const useCheckoutVoucher = (cart: CheckoutCartLine[], bookingAt: string | null = null) => {
  const [enabled, setEnabled] = useState(false);
  const [candidate, setCandidate] = useState<SavedCandidate | null>(null);
  const [applied, setApplied] = useState<AppliedVoucher | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [unmet, setUnmet] = useState<{ conditions: WebVoucherStatus['campaign']['conditions'] } | null>(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;
  // Everything the preview depends on: cart lines and the appointment slot (D2).
  const cartKey = useMemo(() => JSON.stringify({ items: previewItems(cart), bookingAt }), [cart, bookingAt]);
  const bookingAtRef = useRef(bookingAt);
  bookingAtRef.current = bookingAt;
  const cartKeyRef = useRef(cartKey);
  cartKeyRef.current = cartKey;
  const appliedRef = useRef<AppliedVoucher | null>(null);
  appliedRef.current = applied;
  // Only the latest preview may write state (responses can arrive out of order).
  const requestSeq = useRef(0);
  const runPreviewRef = useRef<(code: string) => Promise<void>>(async () => undefined);

  // Show the block only when the programme runs or this browser holds a code.
  useEffect(() => {
    getJson<unknown[]>('/api/promotions/web-claim')
      .then((body) => setEnabled(Boolean(body.success && Array.isArray(body.data) && body.data.length)))
      .catch(() => undefined);
  }, []);

  // Saved code from the wallet, kept only while the server says it is on hold.
  useEffect(() => {
    let alive = true;
    const sync = async () => {
      for (const entry of readWallet()) {
        try {
          const body = await getJson<WebVoucherStatus>(`/api/vouchers/${encodeURIComponent(entry.code)}`);
          if (body.success && body.data?.status === 'RESERVED') {
            if (alive) setCandidate({ code: body.data.voucherCode, expiresAt: body.data.expiresAt });
            return;
          }
        } catch {
          // offline: try the next one / next sync
        }
      }
      if (alive) setCandidate(null);
    };
    void sync();
    const unsubscribe = subscribeWallet(() => void sync());
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const runPreview = useCallback(async (code: string) => {
    const requestId = ++requestSeq.current;
    const requestCartKey = cartKeyRef.current;
    const isCurrent = () => requestId === requestSeq.current && requestCartKey === cartKeyRef.current;
    const normalized = code.trim().toUpperCase();
    // Transient failure while this code is applied: keep it (marked stale) instead of silently dropping it.
    const keepOrDrop = (failure: string) => {
      if (TRANSIENT_PREVIEW_ERRORS.has(failure) && appliedRef.current?.code === normalized) {
        setApplied({ ...appliedRef.current, stale: true });
        setErrorCode('PREVIEW_STALE');
        return;
      }
      setApplied(null);
      setErrorCode(failure);
    };
    setBusy(true);
    setErrorCode(null);
    setUnmet(null);
    try {
      const [preview, status] = await Promise.all([
        getJson<PreviewData>('/api/bookings/voucher-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            voucherCode: code,
            items: previewItems(cartRef.current),
            ...(bookingAtRef.current ? { bookingAt: bookingAtRef.current } : {}),
          }),
        }),
        getJson<WebVoucherStatus>(`/api/vouchers/${encodeURIComponent(code)}`).catch(() => null),
      ]);
      if (!isCurrent()) {
        // Cart changed while this was the latest request: price the current cart instead.
        if (requestId === requestSeq.current) void runPreviewRef.current(normalized);
        return;
      }
      if (!preview.success || !preview.data) {
        keepOrDrop(preview.error?.code ?? 'UNKNOWN');
        return;
      }
      if (!preview.data.eligible) {
        setApplied(null);
        setUnmet({ conditions: status?.data?.campaign.conditions ?? null });
        return;
      }
      const { discountAmount, subtotalAmount, totalAmount } = preview.data;
      setApplied({ code: normalized, discountAmount, subtotalAmount, totalAmount });
    } catch {
      if (!isCurrent()) {
        if (requestId === requestSeq.current) void runPreviewRef.current(normalized);
        return;
      }
      keepOrDrop(typeof navigator !== 'undefined' && navigator.onLine === false ? 'NETWORK' : 'UNKNOWN');
    } finally {
      if (requestId === requestSeq.current) setBusy(false);
    }
  }, []);
  runPreviewRef.current = runPreview;

  // Cart changed after Apply: preview again, never keep a stale discount.
  const appliedCode = applied?.code ?? null;
  useEffect(() => {
    if (!appliedCode || !cartRef.current.length) return;
    // Amounts on screen belong to the previous cart until the new preview lands.
    setApplied((current) => (current ? { ...current, stale: true } : current));
    const timer = window.setTimeout(() => void runPreview(appliedCode), REPREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // Only the cart content triggers a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  const remove = useCallback(() => {
    requestSeq.current += 1; // ignore any preview still in flight
    setApplied(null);
    setErrorCode(null);
    setUnmet(null);
  }, []);

  return { visible: enabled || Boolean(candidate), candidate, applied, busy, errorCode, unmet, apply: runPreview, remove };
};
