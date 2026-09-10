import type { Metadata } from 'next';
import FarmStorePage from '@/components/FarmStore/FarmStorePage';

export const metadata: Metadata = {
  title: 'Oria Farm Store | Dinh dưỡng xanh từ chính khu vườn Oria Farm',
  description: 'Trái cây vườn và nguyên liệu tự nhiên 100% thiên nhiên, không chất bảo quản, mang đến nguồn dinh dưỡng thật cho cuộc sống mỗi ngày.',
};

export default function Page() {
  return <FarmStorePage />;
}
