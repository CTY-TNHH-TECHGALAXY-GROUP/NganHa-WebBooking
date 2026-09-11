export type SitemapRoute = { routeKey: string; pathname: string; localized?: boolean; defaultPathname?: string };

export const PUBLIC_SITEMAP_ROUTES: SitemapRoute[] = [
  { routeKey: 'home', pathname: '/', localized: true, defaultPathname: '/' },
  { routeKey: 'blogs', pathname: '/blogs' },
  { routeKey: 'history', pathname: '/history' },
  { routeKey: 'space', pathname: '/space' },
  { routeKey: 'pure-relaxation', pathname: '/pure-relaxation' },
  { routeKey: 'design-your-journey', pathname: '/design-your-journey' },
  { routeKey: 'showcase', pathname: '/showcase' },
  { routeKey: 'oriahome', pathname: '/oriahome' },
  { routeKey: 'oriafarm-retreat', pathname: '/oriafarm-retreat' },
];

export const PUBLIC_LOCALIZED_SITEMAP_ROUTES: SitemapRoute[] = [
  { routeKey: 'home', pathname: '/', localized: true, defaultPathname: '/' },
  { routeKey: 'oriahome', pathname: '/oriahome', localized: true },
  { routeKey: 'oriafarm-retreat', pathname: '/oriafarm-retreat', localized: true },
  { routeKey: 'pure-relaxation', pathname: '/pure-relaxation', localized: true },
];

export const ROBOTS_DISALLOW = [
  '/admin',
  '/admin/',
  '/api',
  '/api/',
  '/booking',
  '/booking/',
  '/checkout',
  '/checkout/',
  '/vi/new-user/',
  '/en/new-user/',
  '/cn/new-user/',
  '/jp/new-user/',
  '/kr/new-user/',
  '/order',
  '/order/',
] as const;
