'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase';
import {
  findSavedForSlug,
  getDeviceId,
  isNewerStock,
  removeFromWallet,
  saveToWallet,
  subscribeWallet,
  type SavedVoucher,
  type WebClaimCampaign,
  type WebClaimStock,
  type WebVoucherStatus,
} from '@/lib/voucherWallet';

// 🔧 CONFIGURATION
const STOCK_POLL_MS = 60_000;
const STOCK_TABLE = 'PromotionCampaignStock';

export type CardState = 'OPEN' | 'PAUSED' | 'SOLD_OUT' | 'ENDED' | 'NOT_STARTED';

export interface SavedSheet {
  code: string;
  expiresAt: string | null;
  reused: boolean;
}

type ApiBody<T> = { success: boolean; data?: T; error?: { code: string; message: string } };

const getJson = async <T>(url: string, init?: RequestInit): Promise<{ status: number; body: ApiBody<T> }> => {
  const res = await fetch(url, { cache: 'no-store', ...init });
  return { status: res.status, body: (await res.json()) as ApiBody<T> };
};

const stockFromRow = (row: Record<string, unknown>): WebClaimStock => ({
  status: row.status as WebClaimStock['status'],
  available: Number(row.available),
  total: Number(row.total),
  version: Number(row.version),
  validFrom: String(row.valid_from ?? row.validFrom),
  validUntil: String(row.valid_until ?? row.validUntil),
});

/** Server status → what the card shows. INACTIVE (campaign switched off) reads as paused. */
export const cardStateOf = (stock: WebClaimStock, now = Date.now()): CardState => {
  if (stock.status === 'ENDED') return 'ENDED';
  if (stock.status === 'PAUSED' || stock.status === 'INACTIVE') return 'PAUSED';
  if (stock.status === 'SOLD_OUT' || stock.available <= 0) return 'SOLD_OUT';
  return now < new Date(stock.validFrom).getTime() ? 'NOT_STARTED' : 'OPEN';
};

/** Campaigns to show; [] on any error (the card simply does not render). */
export const useWebClaimCampaigns = () => {
  const [campaigns, setCampaigns] = useState<WebClaimCampaign[]>([]);
  useEffect(() => {
    let alive = true;
    getJson<WebClaimCampaign[]>('/api/promotions/web-claim')
      .then(({ body }) => alive && setCampaigns(body.success && Array.isArray(body.data) ? body.data : []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  return campaigns;
};

/**
 * Live stock of one campaign. Sources, newest `version` wins:
 * realtime (unordered), reload on focus / visibility / back online, 60 s poll.
 * `hidden` = switch off or campaign gone → the card disappears.
 */
export const useCampaignStock = (slug: string, initial: WebClaimStock) => {
  const [stock, setStock] = useState<WebClaimStock>(initial);
  const [hidden, setHidden] = useState(false);
  const stockRef = useRef<WebClaimStock>(initial);

  const apply = useCallback((incoming: WebClaimStock) => {
    if (!isNewerStock(incoming, stockRef.current)) return;
    stockRef.current = incoming;
    setStock(incoming);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const { status, body } = await getJson<WebClaimStock | null>(`/api/promotions/web-claim/${encodeURIComponent(slug)}`);
      if (status !== 200 || !body.success) return; // transient: keep what we show, the DB re-checks on save
      if (!body.data) {
        setHidden(true);
        return;
      }
      setHidden(false);
      apply(body.data);
    } catch {
      // offline: next focus / online / poll retries
    }
  }, [slug, apply]);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`web-claim-stock:${slug}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: STOCK_TABLE, filter: `public_slug=eq.${slug}` },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          if (payload.eventType === 'DELETE') {
            void refresh();
            return;
          }
          apply(stockFromRow(payload.new as Record<string, unknown>));
        },
      )
      .subscribe((status: string) => {
        // (Re)subscribed after a drop: events may have been missed.
        if (status === 'SUBSCRIBED') void refresh();
      });

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);
    const timer = window.setInterval(onVisible, STOCK_POLL_MS);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
      window.clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [slug, apply, refresh]);

  return { stock, hidden, apply, refresh, hide: () => setHidden(true) };
};

/**
 * Code this browser saved for `slug`, synced across tabs (`storage`).
 * The server decides whether it is still on hold; anything else is dropped (B16).
 */
export const useSavedVoucher = (slug: string) => {
  const [saved, setSaved] = useState<SavedVoucher | null>(null);

  useEffect(() => {
    let alive = true;
    const sync = () => {
      const entry = findSavedForSlug(slug);
      setSaved(entry);
      if (!entry) return;
      getJson<WebVoucherStatus>(`/api/vouchers/${encodeURIComponent(entry.code)}`)
        .then(({ status, body }) => {
          if (!alive) return;
          if (body.success && body.data) {
            if (body.data.status === 'RESERVED') {
              setSaved({ ...entry, expiresAt: body.data.expiresAt });
            } else {
              removeFromWallet(entry.code);
            }
          } else if (status === 404) {
            removeFromWallet(entry.code);
          }
        })
        .catch(() => undefined); // offline: keep showing the local code
    };
    sync();
    const unsubscribe = subscribeWallet(sync);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, [slug]);

  return saved;
};

type ReserveData = { reused: boolean; voucherCode: string; expiresAt: string; stock: Record<string, unknown> | null };

/** "Lưu voucher": one request at a time, result kept in the wallet. */
export const useReserve = (slug: string, stockApi: ReturnType<typeof useCampaignStock>) => {
  const [saving, setSaving] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SavedSheet | null>(null);
  const inFlight = useRef(false);

  const reserve = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setSaving(true);
    setErrorCode(null);
    try {
      const res = await fetch(`/api/promotions/web-claim/${encodeURIComponent(slug)}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId() }),
        cache: 'no-store',
      });
      const body = (await res.json()) as ApiBody<ReserveData> & { data?: { stock?: Record<string, unknown> } };
      if (body.data?.stock) stockApi.apply(stockFromRow(body.data.stock));

      if (body.success && body.data?.voucherCode) {
        const { voucherCode, expiresAt, reused } = body.data;
        saveToWallet({ code: voucherCode, slug, savedAt: new Date().toISOString(), expiresAt });
        setSheet({ code: voucherCode, expiresAt, reused: Boolean(reused) });
        return;
      }
      const code = body.error?.code ?? 'UNKNOWN';
      if (code === 'FEATURE_DISABLED' || code === 'CAMPAIGN_NOT_FOUND') {
        stockApi.hide();
        return;
      }
      setErrorCode(code);
      if (code !== 'RATE_LIMITED') void stockApi.refresh();
    } catch {
      setErrorCode(typeof navigator !== 'undefined' && navigator.onLine === false ? 'NETWORK' : 'UNKNOWN');
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }, [slug, stockApi]);

  return { reserve, saving, errorCode, sheet, openSheet: setSheet, closeSheet: () => setSheet(null) };
};
