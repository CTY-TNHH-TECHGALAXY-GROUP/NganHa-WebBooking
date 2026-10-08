'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { readWallet, subscribeWallet, type WebVoucherStatus } from '@/lib/voucherWallet';

// 🔧 CONFIGURATION
const REPREVIEW_DEBOUNCE_MS = 600;

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
export const useCheckoutVoucher = (cart: CheckoutCartLine[]) => {
  const [enabled, setEnabled] = useState(false);
  const [candidate, setCandidate] = useState<SavedCandidate | null>(null);
  const [applied, setApplied] = useState<AppliedVoucher | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [unmet, setUnmet] = useState<{ conditions: WebVoucherStatus['campaign']['conditions'] } | null>(null);
  const cartRef = useRef(cart);
  cartRef.current = cart;
  const cartKey = useMemo(() => JSON.stringify(previewItems(cart)), [cart]);

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
    setBusy(true);
    setErrorCode(null);
    setUnmet(null);
    try {
      const [preview, status] = await Promise.all([
        getJson<PreviewData>('/api/bookings/voucher-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voucherCode: code, items: previewItems(cartRef.current) }),
        }),
        getJson<WebVoucherStatus>(`/api/vouchers/${encodeURIComponent(code)}`).catch(() => null),
      ]);
      if (!preview.success || !preview.data) {
        setApplied(null);
        setErrorCode(preview.error?.code ?? 'UNKNOWN');
        return;
      }
      if (!preview.data.eligible) {
        setApplied(null);
        setUnmet({ conditions: status?.data?.campaign.conditions ?? null });
        return;
      }
      const { discountAmount, subtotalAmount, totalAmount } = preview.data;
      setApplied({ code: code.trim().toUpperCase(), discountAmount, subtotalAmount, totalAmount });
    } catch {
      setApplied(null);
      setErrorCode(typeof navigator !== 'undefined' && navigator.onLine === false ? 'NETWORK' : 'UNKNOWN');
    } finally {
      setBusy(false);
    }
  }, []);

  // Cart changed after Apply: preview again, never keep a stale discount.
  const appliedCode = applied?.code ?? null;
  useEffect(() => {
    if (!appliedCode || !cartRef.current.length) return;
    const timer = window.setTimeout(() => void runPreview(appliedCode), REPREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // Only the cart content triggers a refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartKey]);

  const remove = useCallback(() => {
    setApplied(null);
    setErrorCode(null);
    setUnmet(null);
  }, []);

  return { visible: enabled || Boolean(candidate), candidate, applied, busy, errorCode, unmet, apply: runPreview, remove };
};
