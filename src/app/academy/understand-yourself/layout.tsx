import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'academy/understand-yourself', pathname: '/academy/understand-yourself', localized: false }, {
    title: 'Understand Yourself | Oria Spa Academy',
    description: 'Explore your strengths and find a learning path with Oria Spa Academy.',
  });
}

export default function UnderstandYourselfLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
