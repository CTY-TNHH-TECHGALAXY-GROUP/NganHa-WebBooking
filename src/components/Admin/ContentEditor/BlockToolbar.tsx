'use client';

import React from 'react';
import {
  Heading,
  Type,
  Image as ImageIcon,
  Images,
  Quote,
  Video as VideoIcon,
  MousePointerClick,
  Minus,
  Plus,
} from 'lucide-react';
import type { ContentBlock } from '@/types/content';

export interface BlockTypeDescriptor {
  type: ContentBlock['type'];
  name: string;
  enName: string;
  description: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  colorClass: string;
  borderClass: string;
}

export const FROZEN_V1_BLOCK_TYPES: BlockTypeDescriptor[] = [
  {
    type: 'heading',
    name: 'Tiêu đề',
    enName: 'Heading',
    description: 'Tiêu đề phân cấp H2, H3, H4 có phụ đề tùy chọn',
    icon: Heading,
    colorClass: 'text-blue-600 bg-blue-50',
    borderClass: 'border-blue-200 hover:border-blue-400',
  },
  {
    type: 'richText',
    name: 'Văn bản định dạng',
    enName: 'Rich Text',
    description: 'Nội dung đoạn văn, danh sách có đánh số hoặc gạch đầu dòng',
    icon: Type,
    colorClass: 'text-emerald-600 bg-emerald-50',
    borderClass: 'border-emerald-200 hover:border-emerald-400',
  },
  {
    type: 'image',
    name: 'Hình ảnh đơn',
    enName: 'Image',
    description: 'Ảnh độc lập với tỷ lệ khung hình, tiêu điểm focal và zoom',
    icon: ImageIcon,
    colorClass: 'text-amber-600 bg-amber-50',
    borderClass: 'border-amber-200 hover:border-amber-400',
  },
  {
    type: 'gallery',
    name: 'Bộ sưu tập',
    enName: 'Gallery',
    description: 'Lưới ảnh 2, 3, 4 cột, masonry hoặc carousel',
    icon: Images,
    colorClass: 'text-cyan-600 bg-cyan-50',
    borderClass: 'border-cyan-200 hover:border-cyan-400',
  },
  {
    type: 'quote',
    name: 'Trích dẫn',
    enName: 'Quote',
    description: 'Trích dẫn danh ngôn, phát biểu có thông tin tác giả và vai trò',
    icon: Quote,
    colorClass: 'text-orange-600 bg-orange-50',
    borderClass: 'border-orange-200 hover:border-orange-400',
  },
  {
    type: 'video',
    name: 'Video',
    enName: 'Video',
    description: 'Phát video từ kho media nội bộ hoặc YouTube/Vimeo',
    icon: VideoIcon,
    colorClass: 'text-violet-600 bg-violet-50',
    borderClass: 'border-violet-200 hover:border-violet-400',
  },
  {
    type: 'cta',
    name: 'Kêu gọi hành động',
    enName: 'CTA Button',
    description: 'Khối nút bấm chuyển đổi nổi bật với phong cách Oria Gold',
    icon: MousePointerClick,
    colorClass: 'text-admin-gold bg-admin-gold-dim',
    borderClass: 'border-admin-gold/30 hover:border-admin-gold',
  },
  {
    type: 'divider',
    name: 'Đường phân cách',
    enName: 'Divider',
    description: 'Họa tiết trang trí kim cương, hoa văn hoặc vạch kẻ mảnh',
    icon: Minus,
    colorClass: 'text-stone-600 bg-stone-100',
    borderClass: 'border-stone-200 hover:border-stone-400',
  },
];

export interface BlockToolbarProps {
  onInsertBlock: (type: ContentBlock['type']) => void;
  className?: string;
}

export function BlockToolbar({ onInsertBlock, className = '' }: BlockToolbarProps) {
  return (
    <div className={`bg-admin-panel border border-admin-line rounded-2xl p-4 sm:p-5 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-admin-line">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-admin-text-dim flex items-center gap-1.5">
            <span className="text-admin-gold font-serif">✦</span> Thêm khối nội dung
          </h2>
          <p className="text-[11px] text-admin-text-faint mt-0.5">8 loại khối chuẩn theo Frozen Contract V1</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
        {FROZEN_V1_BLOCK_TYPES.map((blockDesc) => {
          const Icon = blockDesc.icon;
          return (
            <button
              key={blockDesc.type}
              type="button"
              onClick={() => onInsertBlock(blockDesc.type)}
              className={`group flex items-start gap-3 p-2.5 rounded-xl border bg-admin-panel transition-all text-left hover:bg-admin-panel-2 hover:shadow-xs cursor-pointer ${blockDesc.borderClass}`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 ${blockDesc.colorClass} group-hover:scale-110 transition-transform`}
              >
                <Icon size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-admin-text group-hover:text-admin-gold transition-colors">
                    {blockDesc.name}
                  </span>
                  <Plus
                    size={14}
                    className="text-admin-text-faint opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>
                <p className="text-[11px] text-admin-text-faint line-clamp-1 mt-0.5">{blockDesc.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
