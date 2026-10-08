export const DEFAULT_NAVIGATION_BACKGROUND = 'https://adzfohfdindovfcpaizb.supabase.co/storage/v1/object/public/media-uploads/marketing/oil_drop.webp';

export const ORIA_BRANDS = [
  { id: 'oria-spa', name: 'Oria Spa', href: '/' },
  { id: 'oria-home-care', name: 'Oria Home Care', href: '/oriahome' },
  { id: 'oriafarm-store', name: 'OriaFarm Store', href: '/oriafarm-store' },
  { id: 'oriafarm-retreat', name: 'OriaFarm Retreat', href: '/oriafarm-retreat' },
  { id: 'oria-tour', name: 'Oria Tour', href: '/local-tour' },
  { id: 'oria-academy', name: 'Oria Academy', href: '/academy' },
] as const;

export const SPA_TABS = [
  { id: 'space', contentKey: 'spaces', labels: { vi: 'Không gian', en: 'Space', cn: '空间', jp: '空間', kr: '공간' } },
  { id: 'service', contentKey: 'services', labels: { vi: 'Dịch vụ', en: 'Service', cn: '服务', jp: 'サービス', kr: '서비스' } },
  { id: 'lost-and-found', contentKey: 'lostAndFound', labels: { vi: 'Thất lạc & Tìm kiếm', en: 'Lost & Found', cn: '失物招领', jp: '遺失物', kr: '분실물' } },
  { id: 'our-story', contentKey: 'ourStory', labels: { vi: 'Câu chuyện', en: 'Our Story', cn: '品牌故事', jp: '私たちの物語', kr: '브랜드 이야기' } },
  { id: 'history', contentKey: 'history', labels: { vi: 'Lịch sử', en: 'History', cn: '历史', jp: '歴史', kr: '역사' } },
  { id: 'blogs', contentKey: 'blogs', labels: { vi: 'Bài viết', en: 'Blogs', cn: '博客', jp: 'ブログ', kr: '블로그' } },
  { id: 'privileges', contentKey: 'privileges', labels: { vi: 'Đặc quyền', en: 'Privileges', cn: '专属特权', jp: '会員特典', kr: '회원 혜택' } },
] as const;

export type SpaTabId = (typeof SPA_TABS)[number]['id'];

export function spaTabFromHash(hash: string): SpaTabId | null {
  const id = hash.replace(/^#/, '');
  if (['welcome', 'floor1', 'floor2', 'spaces'].includes(id)) return 'space';
  if (id === 'services') return 'service';
  if (id.startsWith('history-')) return 'history';
  return SPA_TABS.find(tab => tab.id === id)?.id || null;
}

export function oriaBrandHref(path: string, locale: string): string {
  // Academy keeps its existing unprefixed routes and the shared language context.
  if (path === '/academy' || locale === 'vi') return path;
  return `/${locale}${path === '/' ? '' : path}`;
}

export function renamedTherapyLabel(label: string): string {
  return /^(Therapy|Trị liệu|理疗|治疗|セラピー|테라피|치료)$/i.test(label.trim())
    ? 'Deep Body Treament'
    : label;
}
