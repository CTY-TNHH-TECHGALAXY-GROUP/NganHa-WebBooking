import type { MetadataRoute } from 'next';
import { getSiteOrigin } from '@/lib/seo/metadata';
import { ROBOTS_DISALLOW } from '@/lib/seo/routes';

export default function robots(): MetadataRoute.Robots {
  const origin = getSiteOrigin().toString().replace(/\/$/, '');
  return {
    rules: {
      userAgent: '*',
      disallow: [...ROBOTS_DISALLOW],
    },
    sitemap: `${origin}/sitemap.xml`,
  };
}
