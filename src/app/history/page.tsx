import History from '@/components/History/History';
import type { Metadata } from 'next';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata({ routeKey: 'history', pathname: '/history', localized: false }, {
    title: 'Oria Spa History | Our Story',
    description: 'Discover the story, people, and care behind Oria Spa.',
  });
}

const HistoryPage = () => {
  return (
    <main>
      <History aboveFold />
    </main>
  );
};

export default HistoryPage;
