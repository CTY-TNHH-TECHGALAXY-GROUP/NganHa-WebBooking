import BlogsPage from '@/components/Blogs/BlogsPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oria Knowledge | Saigon, explained.',
};

export default function Page() {
  return <BlogsPage />;
}
