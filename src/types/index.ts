// ═══════════════════════════════════════
// Application Type Definitions
// ═══════════════════════════════════════

/**
 * Service type matching Supabase "Services" table schema.
 * Supports multilingual names and rich configuration.
 */
export interface Service {
  id: string;
  code: string;
  nameVN: string | null;
  nameEN: string | null;
  nameCN: string | null;
  nameJP: string | null;
  nameKR: string | null;
  description: Record<string, string> | null; // JSONB - multilingual descriptions
  hint: Record<string, string> | null; // JSONB - multilingual hints
  priceVND: number;
  priceUSD: number;
  duration: number; // minutes
  category: string | null;
  imageUrl: string | null;
  isActive: boolean;
  isBestChoice: boolean;
  isBestSeller: boolean;
  focusConfig: Record<string, unknown> | null; // JSONB
  tags: string[] | null; // JSONB
  procedure: string | null;
  service_description: string | null;
}

/**
 * Backward-compatible helper: get display name based on locale
 */
export const getServiceName = (service: Service, locale: Locale = 'vi'): string => {
  const nameMap: Record<Locale, string | null> = {
    vi: service.nameVN,
    en: service.nameEN,
    cn: service.nameCN,
    jp: service.nameJP,
    kr: service.nameKR,
  };
  return nameMap[locale] || service.nameEN || service.nameVN || service.code;
};

/**
 * Get service description based on locale
 */
export const getServiceDescription = (service: Service, locale: Locale = 'en'): string => {
  if (!service.description) return service.service_description || '';
  return service.description[locale] || service.description['en'] || service.service_description || '';
};

export interface Branch {
  id: string;
  name: string;
  address: string;
  googleMaps: string;
  hours: string;
  phone: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  serviceId: string;
  branchId: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  totalAmount: number;
  bookingCode: string;
  createdAt: string;
}

export type BookingStatus = 'PENDING_PAYMENT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  discountPercent?: number;
  validUntil: string;
  isActive: boolean;
}

export type Locale = 'vi' | 'en' | 'cn' | 'jp' | 'kr';

export interface Dictionary {
  [key: string]: string | Dictionary;
}
