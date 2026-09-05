import type { Metadata } from 'next';
import LostAndFoundPage from '@/components/LostAndFound/LostAndFoundPage';

export const metadata: Metadata = {
  title: 'Lost & Found | Oria Spa',
  description: 'A thoughtful place to reconnect guests with belongings left at Oria Spa.',
};

export default function Page() {
  return <LostAndFoundPage />;
}
