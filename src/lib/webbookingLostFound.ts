import type { Locale } from '@/lib/constants';
import type { LostAndFoundItem, LostAndFoundStatus } from '@/lib/lostAndFound';

export type LostFoundClaimStatus = 'none' | 'new' | 'contacted' | 'resolved' | 'archived';

export type WebbookingLostFoundItem = LostAndFoundItem & {
  sortOrder?: number;
  claimStatus: LostFoundClaimStatus;
  claimantName?: string;
  claimantPhone?: string;
  claimantEmail?: string;
  claimNote?: string;
  claimLocale?: Locale;
};

const defaultLocaleValue = (): Record<Locale, string> => ({ vi: '', en: '', cn: '', jp: '', kr: '' });

export const toWebbookingLostFoundItem = (row: any): WebbookingLostFoundItem => ({
  id: row.id,
  type: row.item_type || 'other',
  sortOrder: row.sort_order ?? 0,
  title: { ...defaultLocaleValue(), ...(row.title || {}) },
  detail: { ...defaultLocaleValue(), ...(row.detail || {}) },
  foundAt: { ...defaultLocaleValue(), ...(row.found_at || {}) },
  foundOn: row.found_on || new Date().toISOString().slice(0, 10),
  status: (row.status || 'available') as LostAndFoundStatus,
  image: row.image_url || '',
  claimStatus: (row.claim_status || 'none') as LostFoundClaimStatus,
  claimantName: row.claimant_name || undefined,
  claimantPhone: row.claimant_phone || undefined,
  claimantEmail: row.claimant_email || undefined,
  claimNote: row.claim_note || undefined,
  claimLocale: row.claim_locale || undefined,
});

export const toWebbookingLostFoundPayload = (item: Partial<WebbookingLostFoundItem>) => {
  const isNone = (item.claimStatus || 'none') === 'none';
  return {
    item_type: item.type || 'other',
    sort_order: item.sortOrder ?? 0,
    title: item.title || defaultLocaleValue(),
    detail: item.detail || defaultLocaleValue(),
    found_at: item.foundAt || defaultLocaleValue(),
    found_on: item.foundOn || new Date().toISOString().slice(0, 10),
    image_url: item.image || null,
    status: item.status || 'available',
    claim_status: item.claimStatus || 'none',
    claimant_name: isNone ? null : (item.claimantName?.trim() || null),
    claimant_phone: isNone ? null : (item.claimantPhone?.trim() || null),
    claimant_email: isNone ? null : (item.claimantEmail?.trim() || null),
    claim_note: isNone ? null : (item.claimNote?.trim() || null),
    claim_locale: isNone ? null : (item.claimLocale || null),
  };
};
