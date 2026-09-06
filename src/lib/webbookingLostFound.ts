import type { Locale } from '@/lib/constants';
import type { LostAndFoundItem, LostAndFoundStatus } from '@/lib/lostAndFound';

export type LostFoundClaimStatus = 'none' | 'new' | 'contacted' | 'resolved' | 'archived';

export type WebbookingLostFoundItem = LostAndFoundItem & {
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

export const toWebbookingLostFoundPayload = (item: Partial<WebbookingLostFoundItem>) => ({
  item_type: item.type || 'other',
  title: item.title || defaultLocaleValue(),
  detail: item.detail || defaultLocaleValue(),
  found_at: item.foundAt || defaultLocaleValue(),
  found_on: item.foundOn || new Date().toISOString().slice(0, 10),
  image_url: item.image || null,
  status: item.status || 'available',
  claim_status: item.claimStatus || 'none',
  claimant_name: item.claimantName || null,
  claimant_phone: item.claimantPhone || null,
  claimant_email: item.claimantEmail || null,
  claim_note: item.claimNote || null,
  claim_locale: item.claimLocale || null,
});
