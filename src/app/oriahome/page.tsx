import type { Metadata } from 'next';
import HomeSpaPage from '@/components/HomeSpa/HomeSpaPage';

export const metadata: Metadata = {
  title: 'Oria Home Spa | Oria Spa',
  description: 'Dịch vụ Oria Spa cử kỹ thuật viên đến tận nơi bạn ở - nhà riêng, căn hộ hay khách sạn.',
};

export default function Page() {
  return <HomeSpaPage />;
}
