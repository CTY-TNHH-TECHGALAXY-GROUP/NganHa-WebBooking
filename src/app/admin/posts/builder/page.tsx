import React from 'react';
import { ContentEditor } from '@/components/Admin/ContentEditor';

export const metadata = {
  title: 'Content Builder V1 (Preparation) | Admin Oria Spa',
  description: 'Trình soạn thảo khối nội dung động (Dynamic Content Block Builder V1)',
};

export default function ContentBuilderAdminPage() {
  return <ContentEditor documentTitle="Bài viết: Hành Trình Nuôi Dưỡng Thân & Tâm Tại Oria" backHref="/admin/posts" />;
}
