import BlogsPage from '@/components/Blogs/BlogsPage';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'blogs', pathname: '/blogs', localized: false }, {
    title: 'Oria Knowledge | Saigon, explained.',
    description: 'Stories and local knowledge from Oria Spa in Saigon.',
  });
}

export default function Page() {
  return <BlogsPage />;
}
