import type { Metadata } from 'next';
import PureRelaxationPage from '@/components/PureRelaxation/PureRelaxationPage';

export const metadata: Metadata = {
  title: 'Pure Relaxation | Oria Spa',
  description: 'A compact, editorial service menu for Oria Spa relaxation rituals.',
};

const Page = () => <PureRelaxationPage />;

export default Page;
