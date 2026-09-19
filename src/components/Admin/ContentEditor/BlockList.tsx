'use client';

import React from 'react';
import { LayoutGrid, Heading, Image as ImageIcon, Type } from 'lucide-react';
import type { ContentBlock, SupportedLocale } from '@/types/content';
import { BlockCard } from './BlockCard';
import { FROZEN_V1_BLOCK_TYPES } from './BlockToolbar';

export interface BlockListProps {
  blocks: ContentBlock[];
  selectedBlockId?: string;
  activeLocale: SupportedLocale;
  onSelectBlock: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onInsertAt: (index: number, type: ContentBlock['type']) => void;
}

export function BlockList({
  blocks,
  selectedBlockId,
  activeLocale,
  onSelectBlock,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onToggleVisibility,
  onInsertAt,
}: BlockListProps) {
  if (blocks.length === 0) {
    return (
      <div className="border-2 border-dashed border-admin-line rounded-3xl p-10 sm:p-14 text-center bg-admin-panel/60 flex flex-col items-center justify-center min-h-[420px]">
        <div className="w-16 h-16 rounded-2xl bg-admin-panel border border-admin-line flex items-center justify-center text-admin-gold mb-4 shadow-sm">
          <LayoutGrid size={32} />
        </div>
        <h3 className="text-base font-bold text-admin-text">Tài liệu chưa có khối nội dung nào</h3>
        <p className="text-xs text-admin-text-dim max-w-md mt-1 mb-6 leading-relaxed">
          Tạo cấu trúc bài viết linh hoạt bằng cách thêm các khối từ thanh công cụ bên trái, hoặc nhấp chọn loại khối khởi đầu nhanh bên dưới.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onInsertAt(0, 'heading')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-admin-panel border border-admin-line text-admin-text hover:border-admin-gold hover:text-admin-gold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Heading size={14} className="text-blue-600" /> Thêm Tiêu đề
          </button>
          <button
            type="button"
            onClick={() => onInsertAt(0, 'image')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-admin-panel border border-admin-line text-admin-text hover:border-admin-gold hover:text-admin-gold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <ImageIcon size={14} className="text-amber-600" /> Thêm Hình ảnh
          </button>
          <button
            type="button"
            onClick={() => onInsertAt(0, 'richText')}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-admin-panel border border-admin-line text-admin-text hover:border-admin-gold hover:text-admin-gold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Type size={14} className="text-emerald-600" /> Thêm Văn bản
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {blocks.map((block, index) => {
        const isSelected = block.id === selectedBlockId;

        return (
          <React.Fragment key={block.id}>
            {/* Quick Inserter Button between items */}
            {index > 0 && (
              <div className="relative group/insert min-h-11 flex items-center justify-center">
                <div className="w-full border-t border-admin-line group-hover/insert:border-admin-gold/40 transition-colors" />
                <select
                  value=""
                  aria-label={`Chèn khối tại vị trí ${index + 1}`}
                  onChange={(event) => onInsertAt(index, event.target.value as ContentBlock['type'])}
                  className="absolute opacity-100 lg:opacity-0 lg:group-hover/insert:opacity-100 focus:opacity-100 transition-all scale-100 lg:scale-90 lg:group-hover/insert:scale-100 px-3 min-h-11 text-[11px] font-semibold rounded-full bg-admin-panel border border-admin-line text-admin-text-dim hover:text-admin-gold hover:border-admin-gold shadow-sm"
                >
                  <option value="" disabled>+ Chèn khối tại đây</option>
                  {FROZEN_V1_BLOCK_TYPES.map(({ type, name }) => (
                    <option key={type} value={type}>{name}</option>
                  ))}
                </select>
              </div>
            )}

            <BlockCard
              block={block}
              index={index}
              totalBlocks={blocks.length}
              isSelected={isSelected}
              activeLocale={activeLocale}
              onSelect={onSelectBlock}
              onMoveUp={onMoveUp}
              onMoveDown={onMoveDown}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
            />
          </React.Fragment>
        );
      })}

      {/* Insert at Bottom Button */}
      <div className="pt-2">
        <select
          value=""
          aria-label="Thêm khối mới ở cuối trang"
          onChange={(event) => onInsertAt(blocks.length, event.target.value as ContentBlock['type'])}
          className="w-full min-h-11 px-4 rounded-2xl border-2 border-dashed border-admin-line hover:border-admin-gold/60 bg-admin-panel hover:bg-admin-panel text-xs font-semibold text-admin-text-dim hover:text-admin-gold text-center cursor-pointer"
        >
          <option value="" disabled>+ Thêm khối mới ở cuối trang</option>
          {FROZEN_V1_BLOCK_TYPES.map(({ type, name }) => (
            <option key={type} value={type}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
