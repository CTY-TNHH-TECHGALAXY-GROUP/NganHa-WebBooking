import assert from 'node:assert/strict';
import type { AdminAccess } from '@/lib/auth/adminAuth';
import { hasSeoAeoCapability } from '../capabilities';
import { buildPageMetadata, localizedPath } from '../metadata';
import { createFaqJsonLd, createWebSiteJsonLd, serializeJsonLd } from '../jsonLd';
import { validateAeoFields, validateSeoFields } from '../validation';
import type { PublicAeoContent, SeoConfig } from '../types';
import { PUBLIC_LOCALIZED_SITEMAP_ROUTES, PUBLIC_SITEMAP_ROUTES, ROBOTS_DISALLOW } from '../routes';

const publishedSeo = {
  title: 'Trang chủ Oria Spa',
  description: 'Thông tin Oria Spa tại Quận 1.',
  keywords: ['spa'],
  ogImage: '/images/oria.png',
  ogImageAlt: 'Oria Spa',
  twitterCard: 'summary_large_image' as const,
  canonicalPath: '',
  indexable: true,
};

const testConfig: SeoConfig = {
  version: 2,
  global: {},
  pages: {
    home: {
      locales: {
        vi: { published: publishedSeo },
        en: { published: { ...publishedSeo, title: 'Oria Spa homepage', indexable: false } },
      },
    },
  },
  aeo: {},
};

function access(role: AdminAccess['role'], capabilities?: string[]): AdminAccess {
  return {
    role,
    user: { id: 'test-user' },
    membership: { user_id: 'test-user', role, is_active: true },
    supabase: {} as AdminAccess['supabase'],
    ...(capabilities ? { capabilities } : {}),
  } as AdminAccess;
}

export async function runSeoTests() {
  assert.equal(localizedPath('/en/oriahome', 'vi'), '/vi/oriahome');
  assert.equal(localizedPath('/', 'jp'), '/jp');

  const metadata = buildPageMetadata(testConfig, {
    routeKey: 'home',
    pathname: '/en',
    locale: 'en',
    localized: true,
    defaultPathname: '/',
  });
  assert.equal(String(metadata.alternates?.canonical).endsWith('/en'), true);
  assert.equal(String(metadata.alternates?.languages?.vi).endsWith('/vi'), true);
  assert.equal(String(metadata.alternates?.languages?.['x-default']).endsWith('/'), true);
  assert.deepEqual(metadata.robots, { index: false, follow: false });

  const canonicalConfig: SeoConfig = {
    ...testConfig,
    global: { vi: { published: { ...publishedSeo, canonicalPath: '/vi' } } },
    pages: {
      home: {
        locales: {
          vi: { published: { ...publishedSeo, canonicalPath: '/vi' } },
          en: { published: { ...publishedSeo, canonicalPath: '/en' } },
        },
      },
    },
  };
  const canonicalMetadata = buildPageMetadata(canonicalConfig, {
    routeKey: 'home',
    pathname: '/en',
    locale: 'en',
    localized: true,
    defaultPathname: '/',
  });
  assert.equal(String(canonicalMetadata.alternates?.languages?.vi).endsWith('/vi'), true);
  assert.equal(String(canonicalMetadata.alternates?.languages?.en).endsWith('/en'), true);

  const noDefaultConfig: SeoConfig = {
    ...canonicalConfig,
    pages: {
      home: {
        locales: {
          vi: { published: { ...publishedSeo, indexable: false } },
          en: { published: { ...publishedSeo, canonicalPath: '/en' } },
        },
      },
    },
  };
  const noDefaultMetadata = buildPageMetadata(noDefaultConfig, {
    routeKey: 'home',
    pathname: '/en',
    locale: 'en',
    localized: true,
    defaultPathname: '/',
  });
  assert.equal(noDefaultMetadata.alternates?.languages?.['x-default'], undefined);

  const invalidSeo = validateSeoFields({ ...publishedSeo, title: '<script>alert(1)</script>', indexable: true });
  assert.equal(invalidSeo.ok, false);
  const invalidCanonical = validateSeoFields({ ...publishedSeo, canonicalPath: 'https://evil.example', indexable: true });
  assert.equal(invalidCanonical.ok, false);
  const invalidKeyword = validateSeoFields({ ...publishedSeo, keywords: ['<script>'], indexable: true });
  assert.equal(invalidKeyword.ok, false);

  const validAeo = validateAeoFields({ answer: 'A visible answer.', faqs: [{ question: 'Q?', answer: 'A.' }] });
  assert.equal(validAeo.ok, true);
  const invalidAeo = validateAeoFields({ serviceName: 'Service without visible answer' });
  assert.equal(invalidAeo.ok, false);

  const aeo: PublicAeoContent = {
    routeKey: 'home',
    locale: 'en',
    serviceName: '',
    answer: 'Answer',
    audience: '',
    duration: '',
    price: '',
    inclusions: [],
    location: '',
    hours: '',
    bookingProcess: '',
    faqs: [{ question: 'What is <safe>?', answer: '</script><script>alert(1)</script>' }],
    sourceLabel: '',
    sourceUrl: '',
  };
  const serialized = serializeJsonLd({ answer: aeo.answer, faq: createFaqJsonLd(aeo) });
  assert.equal(serialized.includes('<script>'), false);
  assert.equal(serialized.includes('\\u003c/script\\u003e'), true);
  assert.equal(createWebSiteJsonLd('https://example.test/en').publisher['@id'], 'https://example.test#local-business');

  assert.equal(await hasSeoAeoCapability(access('editor'), 'seo.read'), false);
  assert.equal(await hasSeoAeoCapability(access('editor', ['seo.read']), 'seo.read'), true);
  assert.equal(await hasSeoAeoCapability(access('admin'), 'aeo.publish'), true);

  const sitemapPaths = [...PUBLIC_SITEMAP_ROUTES, ...PUBLIC_LOCALIZED_SITEMAP_ROUTES].map((route) => route.pathname);
  assert.equal(sitemapPaths.some((path) => /admin|api|checkout|new-user|order/.test(path)), false);
  assert.equal(ROBOTS_DISALLOW.some((path) => path.startsWith('/admin')), true);
  assert.equal(ROBOTS_DISALLOW.some((path) => path.startsWith('/api')), true);
  assert.equal(ROBOTS_DISALLOW.some((path) => path.includes('new-user')), true);
  return true;
}
