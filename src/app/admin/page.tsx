'use client';

import React from 'react';
import Link from 'next/link';
import { Film, BookOpen, FileText, Wrench, ArrowRight, Globe, Settings, ArchiveRestore } from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'Video Trang Chủ',
    description: 'Thay đổi video nền hiển thị khi khách truy cập website.',
    href: '/admin/hero-videos',
    icon: Film,
    color: 'from-admin-purple-a to-admin-purple-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-purple',
  },
  {
    title: 'Lịch Sử Thương Hiệu',
    description: 'Quản lý dòng thời gian và các cột mốc lịch sử của Spa.',
    href: '/admin/history',
    icon: BookOpen,
    color: 'from-amber-600 to-amber-700',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-amber-600',
  },
  {
    title: 'Lost & Found',
    description: 'Cập nhật từng món đồ khách để quên và trạng thái trả lại.',
    href: '/admin/lost-and-found',
    icon: ArchiveRestore,
    color: 'from-admin-copper-a to-admin-copper-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-copper',
  },
  {
    title: 'Ảnh / Video & Giá Dịch Vụ',
    description: 'Cập nhật giá, thời lượng, đa ngôn ngữ và media cho dịch vụ.',
    href: '/admin/services',
    icon: Wrench,
    color: 'from-admin-blue-a to-admin-blue-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-blue',
  },
  {
    title: 'Sách Lật (Flipbook)',
    description: 'Thêm hoặc xóa trang ảnh/video trong cuốn sách dịch vụ.',
    href: '/admin/flipbook-pages',
    icon: BookOpen,
    color: 'from-admin-purple-a to-admin-purple-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-purple',
  },
  {
    title: 'Bài Viết Blog',
    description: 'Viết bài giới thiệu, chia sẻ kinh nghiệm spa cho khách đọc.',
    href: '/admin/posts',
    icon: FileText,
    color: 'from-admin-green-a to-admin-green-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-green',
  },
  {
    title: 'Nội Dung Đa Ngôn Ngữ',
    description: 'Chỉnh sửa văn bản và nội dung 5 ngôn ngữ hiển thị trên trang chủ.',
    href: '/admin/content',
    icon: Globe,
    color: 'from-admin-green-a to-admin-green-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-green',
  },
  {
    title: 'Cấu Hình Hệ Thống',
    description: 'Chỉnh sửa thông tin liên hệ, bản đồ, và nội dung phần Our Story.',
    href: '/admin/system-settings',
    icon: Settings,
    color: 'from-admin-gray-a to-admin-gray-b',
    borderColor: 'border-admin-line-strong',
    iconBg: 'bg-admin-text',
  },
];

const AdminDashboard = () => {
  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Welcome */}
      <div className="mb-10">
        <h1 className="text-3xl lg:text-4xl font-bold text-admin-text mb-2">
          Xin chào! 👋
        </h1>
        <p className="text-admin-text-dim text-lg">
          Chọn mục bên dưới để bắt đầu chỉnh sửa nội dung website Ngân Hà Spa.
        </p>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`
                group relative block rounded-2xl border ${action.borderColor}
                bg-gradient-to-br ${action.color}
                p-6 lg:p-8
                transition-all duration-300
                hover:scale-[1.02] shadow-[var(--shadow)] hover:shadow-lg
                active:scale-[0.98]
              `}
            >
              <div className="flex items-start gap-4">
                <div className={`
                  w-12 h-12 lg:w-14 lg:h-14 rounded-xl
                  ${action.iconBg}
                  flex items-center justify-center flex-shrink-0 shadow-sm
                `}>
                  <Icon size={24} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg lg:text-xl font-semibold text-admin-text mb-1 flex items-center gap-2">
                    {action.title}
                    <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-admin-text-dim" />
                  </h3>
                  <p className="text-sm lg:text-base text-admin-text-dim leading-relaxed">
                    {action.description}
                  </p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Help Section */}
      <div className="mt-10 bg-admin-panel border border-admin-line rounded-2xl p-6 lg:p-8 shadow-[var(--shadow)]">
        <h2 className="text-xl font-bold text-admin-text mb-4">
          Cần hỗ trợ?
        </h2>
        <p className="text-admin-text-dim mb-4 leading-relaxed">
          Nếu anh/chị gặp khó khăn trong quá trình cập nhật nội dung, hoặc cần thay đổi các tính năng phức tạp hơn, vui lòng liên hệ đội ngũ hỗ trợ kỹ thuật.
        </p>
        <button className="px-5 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-lg font-semibold transition-colors shadow-sm">
          Xem hướng dẫn sử dụng
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
