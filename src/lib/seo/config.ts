import type { SupabaseClient } from '@supabase/supabase-js';
import { BRANCHES, DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import { validateConfigUrl } from '@/lib/config/urlSettings';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import type {
  AeoFaq,
  AeoLocaleFields,
  ContentStatus,
  LocalizedAeo,
  SeoConfig,
  SeoLocaleFields,
  VersionedLocale,
} from './types';

const SEO_CONFIG_KEY = 'seo_config';

const LEGACY_SEO_DEFAULT = {
  title: 'Ngân Hà Barbershop & Spa | Premium Spa in District 1, HCMC',
  description:
    'Experience premium spa, barbershop, and wellness services at Ngan Ha. Located at 11 Ngo Duc Ke, District 1, Ho Chi Minh City. Book online now!',
  keywords: ['spa district 1', 'barbershop HCMC', 'Ngan Ha Spa', 'massage Saigon', 'ear cleaning spa', 'đặt lịch spa', 'spa Quận 1'],
  ogImage: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg',
  ogImageAlt: 'Oria Spa service space',
  twitterCard: 'summary_large_image' as const,
  canonicalPath: '',
  indexable: true,
};

const EMPTY_AEO: AeoLocaleFields = {
  serviceName: '',
  answer: '',
  audience: '',
  duration: '',
  price: '',
  inclusions: [],
  location: '',
  hours: '',
  bookingProcess: '',
  faqs: [],
  sourceLabel: '',
  sourceUrl: '',
};

const HOME_AEO_COPY: Record<Locale, AeoLocaleFields> = {
  vi: {
    ...EMPTY_AEO,
    answer: 'Oria Spa là không gian spa và barbershop tại Quận 1, Thành phố Hồ Chí Minh. Website hiện có thông tin cơ sở tại 11 Ngô Đức Kế và hỗ trợ khách chọn dịch vụ trước khi gửi yêu cầu đặt lịch.',
    location: BRANCHES.BARBERSHOP.address,
    hours: BRANCHES.BARBERSHOP.hours,
    bookingProcess: 'Chọn dịch vụ, chọn thời gian và gửi thông tin liên hệ trong luồng đặt lịch. Website xác nhận đã tiếp nhận yêu cầu; bộ phận điều phối xác nhận lịch hẹn cuối cùng riêng.',
    faqs: [
      { question: 'Oria Spa ở đâu?', answer: `Địa chỉ đang hiển thị trên website là ${BRANCHES.BARBERSHOP.address}.` },
      { question: 'Giờ hoạt động được hiển thị là gì?', answer: `Thông tin cơ sở hiện hiển thị ${BRANCHES.BARBERSHOP.hours}.` },
      { question: 'Đặt lịch online có phải là xác nhận lịch hẹn cuối cùng không?', answer: 'Chưa. Website xác nhận đã tiếp nhận yêu cầu; bộ phận điều phối sẽ xác nhận lịch hẹn cuối cùng.' },
    ],
    sourceLabel: 'Thông tin cơ sở và luồng đặt lịch trên website',
  },
  en: {
    ...EMPTY_AEO,
    answer: 'Oria Spa is a spa and barbershop in District 1, Ho Chi Minh City. The website currently lists the Ngô Đức Kế location and lets guests choose services before sending a booking request.',
    location: BRANCHES.BARBERSHOP.address,
    hours: BRANCHES.BARBERSHOP.hours,
    bookingProcess: 'Choose a service, choose a time, and submit contact details in the booking flow. The website acknowledges receipt; the dispatch team confirms the final appointment separately.',
    faqs: [
      { question: 'Where is Oria Spa?', answer: `The website currently lists ${BRANCHES.BARBERSHOP.address}.` },
      { question: 'What hours are shown?', answer: `The current branch information shows ${BRANCHES.BARBERSHOP.hours}.` },
      { question: 'Is an online booking request the final appointment confirmation?', answer: 'No. The website acknowledges receipt of the request; the dispatch team confirms the final appointment.' },
    ],
    sourceLabel: 'Business and booking information visible on this website',
  },
  cn: {
    ...EMPTY_AEO,
    answer: 'Oria Spa 是位于胡志明市第一郡的 spa 和理发店。网站目前列出 Ngô Đức Kế 地址，并支持客人在提交预约请求前选择服务。',
    location: BRANCHES.BARBERSHOP.address,
    hours: BRANCHES.BARBERSHOP.hours,
    bookingProcess: '选择服务和时间并提交联系方式。网站先确认已收到请求，最终预约由调度团队另行确认。',
    faqs: [
      { question: 'Oria Spa 在哪里？', answer: `网站目前列出的地址是 ${BRANCHES.BARBERSHOP.address}。` },
      { question: '网站显示的营业时间是什么？', answer: `目前显示的营业时间为 ${BRANCHES.BARBERSHOP.hours}。` },
      { question: '在线预约请求是否等于最终确认？', answer: '不是。网站确认收到请求，最终预约由调度团队另行确认。' },
    ],
    sourceLabel: '网站可见的门店和预约信息',
  },
  jp: {
    ...EMPTY_AEO,
    answer: 'Oria Spaはホーチミン市1区にあるスパ・バーバーショップです。サイトでは現在、Ngô Đức Kếの店舗情報を案内し、予約リクエストの前にサービスを選べます。',
    location: BRANCHES.BARBERSHOP.address,
    hours: BRANCHES.BARBERSHOP.hours,
    bookingProcess: 'サービスと時間を選び、連絡先を送信します。サイトは受付を知らせ、最終的な予約はディスパッチ担当が別途確認します。',
    faqs: [
      { question: 'Oria Spaはどこにありますか？', answer: `サイトに表示されている住所は ${BRANCHES.BARBERSHOP.address} です。` },
      { question: '表示されている営業時間は？', answer: `現在の店舗情報では ${BRANCHES.BARBERSHOP.hours} と表示されています。` },
      { question: 'オンライン予約リクエストは最終確定ですか？', answer: 'いいえ。サイトは受付を知らせ、最終的な予約はディスパッチ担当が確認します。' },
    ],
    sourceLabel: 'サイトに表示されている店舗・予約情報',
  },
  kr: {
    ...EMPTY_AEO,
    answer: 'Oria Spa는 호치민시 1군에 있는 스파 및 바버숍입니다. 웹사이트에는 현재 Ngô Đức Kế 지점 정보가 표시되며, 예약 요청을 보내기 전에 서비스를 선택할 수 있습니다.',
    location: BRANCHES.BARBERSHOP.address,
    hours: BRANCHES.BARBERSHOP.hours,
    bookingProcess: '서비스와 시간을 선택하고 연락처를 제출합니다. 웹사이트는 접수를 확인하고, 최종 예약은 배차 담당자가 별도로 확인합니다.',
    faqs: [
      { question: 'Oria Spa는 어디에 있나요?', answer: `웹사이트에 표시된 주소는 ${BRANCHES.BARBERSHOP.address}입니다.` },
      { question: '표시된 영업시간은 어떻게 되나요?', answer: `현재 지점 정보에는 ${BRANCHES.BARBERSHOP.hours}로 표시되어 있습니다.` },
      { question: '온라인 예약 요청이 최종 예약 확정인가요?', answer: '아니요. 웹사이트는 접수를 확인하며, 최종 예약은 배차 담당자가 확인합니다.' },
    ],
    sourceLabel: '웹사이트에 표시된 지점 및 예약 정보',
  },
};

export const DEFAULT_LOCALE_SEO: Record<Locale, SeoLocaleFields> = {
  vi: {
    ...LEGACY_SEO_DEFAULT,
    title: 'Oria Spa | Spa và Barbershop tại Quận 1',
    description: 'Thông tin spa và barbershop Oria Spa tại Quận 1, Thành phố Hồ Chí Minh cùng luồng chọn dịch vụ và gửi yêu cầu đặt lịch online.',
  },
  en: {
    ...LEGACY_SEO_DEFAULT,
    title: 'Oria Spa | Spa and Barbershop in District 1',
    description: 'Explore Oria Spa and barbershop information in District 1, Ho Chi Minh City, then choose a service and send a booking request online.',
  },
  cn: {
    ...LEGACY_SEO_DEFAULT,
    title: 'Oria Spa | 胡志明市第一郡 Spa 与理发店',
    description: '了解 Oria Spa 在胡志明市第一郡的 spa 与理发店信息，并在线选择服务、提交预约请求。',
  },
  jp: {
    ...LEGACY_SEO_DEFAULT,
    title: 'Oria Spa | ホーチミン1区のスパ・バーバーショップ',
    description: 'ホーチミン市1区のOria Spaについて確認し、サービスを選んでオンラインで予約リクエストを送信できます。',
  },
  kr: {
    ...LEGACY_SEO_DEFAULT,
    title: 'Oria Spa | 호치민 1군 스파 및 바버숍',
    description: '호치민 1군 Oria Spa의 스파 및 바버숍 정보를 확인하고 온라인으로 서비스를 선택해 예약 요청을 보낼 수 있습니다.',
  },
};

export const DEFAULT_SEO_CONFIG: SeoConfig = {
  version: 2,
  global: {},
  pages: {},
  aeo: {},
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isLocale(value: string): value is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function stringList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
  if (typeof value === 'string') return value.split(',').map((item) => item.trim()).filter(Boolean);
  return [];
}

function safePublicUrl(value: unknown, fallback = ''): string {
  const candidate = stringValue(value);
  if (!candidate) return fallback;
  const result = validateConfigUrl(candidate);
  return result.isValid && (candidate.startsWith('/') || candidate.startsWith('https://')) ? candidate : fallback;
}

function safeInternalPath(value: unknown, fallback = ''): string {
  const candidate = stringValue(value);
  const looksLikeHostnamePath = /^\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?=\/|$)/i.test(candidate);
  return candidate.startsWith('/') && !candidate.startsWith('//') && !looksLikeHostnamePath && !/[?#\\\u0000-\u001f\u007f]/.test(candidate) ? candidate : fallback;
}

function normalizeSeoFields(value: unknown, fallback: SeoLocaleFields): SeoLocaleFields {
  const raw = isRecord(value) ? value : {};
  const twitterCard = raw.twitterCard === 'summary' ? 'summary' : 'summary_large_image';
  return {
    title: stringValue(raw.title, fallback.title),
    description: stringValue(raw.description, fallback.description),
    keywords: stringList(raw.keywords).length ? stringList(raw.keywords) : fallback.keywords,
    ogImage: safePublicUrl(raw.ogImage, fallback.ogImage),
    ogImageAlt: stringValue(raw.ogImageAlt, fallback.ogImageAlt),
    twitterCard,
    canonicalPath: safeInternalPath(raw.canonicalPath, fallback.canonicalPath),
    indexable: typeof raw.indexable === 'boolean' ? raw.indexable : fallback.indexable,
  };
}

function normalizeFaqs(value: unknown): AeoFaq[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .map((item) => ({ question: stringValue(item.question), answer: stringValue(item.answer) }))
    .filter((item) => item.question && item.answer);
}

function normalizeAeoFields(value: unknown): AeoLocaleFields {
  const raw = isRecord(value) ? value : {};
  return {
    serviceName: stringValue(raw.serviceName),
    answer: stringValue(raw.answer),
    audience: stringValue(raw.audience),
    duration: stringValue(raw.duration),
    price: stringValue(raw.price),
    inclusions: stringList(raw.inclusions),
    location: stringValue(raw.location),
    hours: stringValue(raw.hours),
    bookingProcess: stringValue(raw.bookingProcess),
    faqs: normalizeFaqs(raw.faqs),
    sourceLabel: stringValue(raw.sourceLabel),
    sourceUrl: safePublicUrl(raw.sourceUrl),
  };
}

function normalizeLocalizedSeo(value: unknown): Record<string, VersionedLocale<SeoLocaleFields>> {
  if (!isRecord(value)) return {};
  const result: Record<string, VersionedLocale<SeoLocaleFields>> = {};
  for (const [locale, entry] of Object.entries(value)) {
    if (!isLocale(locale) || !isRecord(entry)) continue;
    result[locale] = {
      draft: isRecord(entry.draft) ? normalizeSeoFields(entry.draft, DEFAULT_LOCALE_SEO[locale]) : undefined,
      published: isRecord(entry.published) ? normalizeSeoFields(entry.published, DEFAULT_LOCALE_SEO[locale]) : undefined,
      updatedAt: stringValue(entry.updatedAt) || undefined,
    };
  }
  return result;
}

function normalizeLocalizedAeo(value: unknown): LocalizedAeo {
  if (!isRecord(value)) return {};
  const result: LocalizedAeo = {};
  for (const [locale, entry] of Object.entries(value)) {
    if (!isLocale(locale) || !isRecord(entry)) continue;
    result[locale] = {
      draft: isRecord(entry.draft) ? normalizeAeoFields(entry.draft) : undefined,
      published: isRecord(entry.published) ? normalizeAeoFields(entry.published) : undefined,
      updatedAt: stringValue(entry.updatedAt) || undefined,
    };
  }
  return result;
}

export function normalizeSeoConfig(value: unknown): SeoConfig {
  if (!isRecord(value) || value.version !== 2) {
    const legacy = normalizeSeoFields(value, LEGACY_SEO_DEFAULT);
    return {
      ...DEFAULT_SEO_CONFIG,
      global: { [DEFAULT_LOCALE]: { draft: legacy, published: legacy } },
    };
  }

  const pages: SeoConfig['pages'] = {};
  if (isRecord(value.pages)) {
    for (const [routeKey, page] of Object.entries(value.pages)) {
      if (!isRecord(page)) continue;
      pages[routeKey] = { locales: normalizeLocalizedSeo(page.locales) };
    }
  }

  const aeo: SeoConfig['aeo'] = {};
  if (isRecord(value.aeo)) {
    for (const [routeKey, page] of Object.entries(value.aeo)) {
      if (!isRecord(page)) continue;
      aeo[routeKey] = { locales: normalizeLocalizedAeo(page.locales) };
    }
  }

  return {
    version: 2,
    global: normalizeLocalizedSeo(value.global),
    pages,
    aeo,
  };
}

export type SeoConfigSnapshot = {
  config: SeoConfig;
  rawValue: unknown | null;
  exists: boolean;
};

export async function getSeoConfigSnapshot(supabase?: SupabaseClient): Promise<SeoConfigSnapshot> {
  try {
    const client = supabase || getSupabaseAdmin();
    const { data, error } = await client.from('SystemConfigs').select('value').eq('key', SEO_CONFIG_KEY).maybeSingle();
    if (!error && data) return { config: normalizeSeoConfig(data.value), rawValue: data.value ?? null, exists: true };
    if (error && error.code !== 'PGRST116') console.error('[seo] Error reading seo_config:', error.message);
  } catch (error) {
    if (!(error instanceof Error && error.message.includes('Missing Supabase env vars'))) {
      console.error('[seo] Error reading seo_config:', error);
    }
  }
  return { config: DEFAULT_SEO_CONFIG, rawValue: null, exists: false };
}

export async function getSeoConfig(supabase?: SupabaseClient): Promise<SeoConfig> {
  return (await getSeoConfigSnapshot(supabase)).config;
}

export async function saveSeoConfigIfCurrent(
  supabase: SupabaseClient,
  config: SeoConfig,
  expectedRawValue: unknown | null,
  expectedRowExists: boolean,
) {
  if (!expectedRowExists) {
    const { data, error } = await supabase.from('SystemConfigs').insert({
      key: SEO_CONFIG_KEY,
      value: config,
      description: 'Cấu hình SEO/AEO đã kiểm soát bản nháp và xuất bản',
    }).select('value').maybeSingle();
    if (error) {
      return { ok: false as const, conflict: error.code === '23505', error };
    }
    return data ? { ok: true as const, conflict: false as const } : { ok: false as const, conflict: true as const };
  }

  const expectedFilterValue = JSON.stringify(expectedRawValue);
  if (!expectedFilterValue) {
    return { ok: false as const, conflict: true as const };
  }

  const { data, error } = await supabase.from('SystemConfigs').update({
    value: config,
    description: 'Cấu hình SEO/AEO đã kiểm soát bản nháp và xuất bản',
  }).eq('key', SEO_CONFIG_KEY).eq('value', expectedFilterValue).select('value').maybeSingle();
  if (error) return { ok: false as const, conflict: false as const, error };
  return data ? { ok: true as const, conflict: false as const } : { ok: false as const, conflict: true as const };
}

function getVersioned<T>(entry: VersionedLocale<T> | undefined, status: ContentStatus): T | undefined {
  return entry?.[status];
}

export function resolvePublicSeoFields(
  config: SeoConfig,
  routeKey: string,
  locale: Locale,
  fallback: Partial<SeoLocaleFields> = {},
): SeoLocaleFields {
  const global = getVersioned(config.global[locale], 'published') || getVersioned(config.global[DEFAULT_LOCALE], 'published');
  const page = getVersioned(config.pages[routeKey]?.locales[locale], 'published');
  const { canonicalPath: _globalCanonicalPath, ...globalDefaults } = global || {};
  return {
    ...DEFAULT_LOCALE_SEO[locale],
    ...globalDefaults,
    ...fallback,
    ...(page || {}),
  };
}

export function resolvePublicAeoContent(config: SeoConfig, routeKey: string, locale: Locale) {
  const published = getVersioned(config.aeo[routeKey]?.locales[locale], 'published')
    || getVersioned(config.aeo[routeKey]?.locales[DEFAULT_LOCALE], 'published');
  const fallback = routeKey === 'home' ? HOME_AEO_COPY[locale] : EMPTY_AEO;
  const content = { ...fallback, ...(published || {}) };
  if (!content.answer && !content.faqs.length) return null;
  return { ...content, routeKey, locale };
}

export function getDraftSeo(config: SeoConfig, routeKey: string, locale: Locale): SeoLocaleFields {
  return config.pages[routeKey]?.locales[locale]?.draft
    || config.global[locale]?.draft
    || resolvePublicSeoFields(config, routeKey, locale);
}

export function getDraftAeo(config: SeoConfig, routeKey: string, locale: Locale): AeoLocaleFields {
  return config.aeo[routeKey]?.locales[locale]?.draft
    || config.aeo[routeKey]?.locales[DEFAULT_LOCALE]?.draft
    || resolvePublicAeoContent(config, routeKey, locale)
    || EMPTY_AEO;
}

export function getHomeAeoCopy(locale: Locale) {
  return HOME_AEO_COPY[locale];
}
