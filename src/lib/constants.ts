// ═══════════════════════════════════════
// Application Constants (UPPER_SNAKE_CASE)
// ═══════════════════════════════════════

// Booking
export const MAX_BOOKING_SLOTS = 10;
export const BOOKING_TIME_START = 9; // 9:00 AM
export const BOOKING_TIME_END = 23; // 11:00 PM (last order 11:30 PM)
export const TIME_SLOT_INTERVAL_MINUTES = 30;

// Branch Info
export const BRANCHES = {
  BARBERSHOP: {
    name: 'ORIA SPA Barbershop',
    address: '11 Ngô Đức Kế, P. Sài Gòn, Quận 1, TP.HCM',
    website: 'https://nganhaspa.vn',
    googleMaps: 'https://www.google.com/maps/search/?api=1&query=Oria+Spa&query_place_id=ChIJ2ULTMCAvdTERA4I7Sei7vyY',
    hours: '9:00 AM - 12:00 AM',
  },
};

// Social Contact Links
export const SOCIAL_LINKS = {
  ZALO: 'https://zalo.me/',
  FACEBOOK: 'https://m.me/',
  WHATSAPP: 'https://wa.me/',
  LINE: 'https://line.me/',
  KAKAOTALK: 'https://pf.kakao.com/',
  WECHAT: 'weixin://',
  HOTLINE: 'tel:+84',
};

// i18n
export const SUPPORTED_LOCALES = ['vi', 'en', 'cn', 'jp', 'kr'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'vi';

// UI
export const HEADER_HEIGHT = 72;
export const MOBILE_BREAKPOINT = 768;
export const ANIMATION_DURATION = 0.5;
