'use client';

import React from 'react';
import { Plus, Trash2, Images, Image as ImageIcon } from 'lucide-react';
import type {
  GalleryBlockProps,
  GalleryLayout,
  ImageAspectRatio,
  SupportedLocale,
} from '@/types/content';
import { getMockMediaAsset } from '../../MediaPicker/mockMedia';

export interface GalleryInspectorProps {
  props: GalleryBlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: GalleryBlockProps) => void;
  onOpenMediaPickerForGallery: () => void;
}

export function GalleryInspector({
  props,
  onChange,
  onOpenMediaPickerForGallery,
}: GalleryInspectorProps) {
  const layout: GalleryLayout = props.layout || 'grid-3';
  const aspectRatio: ImageAspectRatio = props.aspectRatio || '4:3';
  const items = props.items || [];

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange({ ...props, items: updated });
  };

  return (
    <div className="space-y-5">
      {/* Layout Selection */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Bố cục hiển thị (Layout)
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(['grid-2', 'grid-3', 'grid-4', 'masonry', 'carousel'] as const).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onChange({ ...props, layout: l })}
              className={`py-1.5 px-2 rounded-lg font-mono text-xs border transition-all ${
                layout === l
                  ? 'bg-admin-gold text-[#241804] border-admin-gold font-bold shadow-xs'
                  : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Tỷ lệ ảnh trong lưới
        </label>
        <select
          value={aspectRatio}
          onChange={(e) => onChange({ ...props, aspectRatio: e.target.value as ImageAspectRatio })}
          className="w-full bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text focus:outline-none focus:border-admin-gold"
        >
          <option value="original">Gốc (original)</option>
          <option value="16:9">16:9</option>
          <option value="4:3">4:3</option>
          <option value="3:2">3:2</option>
          <option value="1:1">1:1 (Vuông)</option>
          <option value="3:4">3:4 (Dọc)</option>
        </select>
      </div>

      {/* Items list */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-[11px] font-medium text-admin-text-faint">
            Danh sách hình ảnh ({items.length})
          </label>
          <button
            type="button"
            onClick={onOpenMediaPickerForGallery}
            className="text-xs font-bold text-admin-gold hover:underline flex items-center gap-1"
          >
            <Plus size={13} /> Thêm ảnh
          </button>
        </div>

        {items.length === 0 ? (
          <div className="p-4 border-2 border-dashed border-admin-line rounded-xl text-center text-admin-text-faint">
            <Images size={24} className="mx-auto mb-1 opacity-60" />
            <p className="text-xs">Chưa có ảnh nào trong bộ sưu tập</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => {
              const asset = getMockMediaAsset(item.mediaId);
              return (
                <div
                  key={item.id || idx}
                  className="flex items-center gap-2.5 p-2 bg-admin-panel border border-admin-line rounded-xl"
                >
                  <div className="w-12 h-9 rounded bg-black/5 overflow-hidden shrink-0">
                    {asset?.url ? (
                      <img src={asset.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-admin-text-faint">
                        <ImageIcon size={14} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-admin-text truncate">
                      {asset?.title || item.mediaId}
                    </p>
                    <code className="text-[10px] text-admin-text-faint font-mono block">
                      {item.mediaId}
                    </code>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1 rounded text-admin-text-faint hover:text-red-600 transition-colors"
                    title="Xóa khỏi gallery"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
