'use client';

import React from 'react';
import { Film, Image as ImageIcon } from 'lucide-react';
import type { VideoBlockProps, SupportedLocale } from '@/types/content';
import { getMockMediaAsset } from '../../MediaPicker/mockMedia';

export interface VideoInspectorProps {
  props: VideoBlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: VideoBlockProps) => void;
  onOpenMediaPickerForVideo: () => void;
  onOpenMediaPickerForPoster: () => void;
}

export function VideoInspector({
  props,
  activeLocale,
  onChange,
  onOpenMediaPickerForVideo,
  onOpenMediaPickerForPoster,
}: VideoInspectorProps) {
  const currentCaption = props.caption?.[activeLocale] ?? '';
  const source = props.source;
  const isInternal = source.type === 'internal';
  const posterAsset = props.posterMediaId ? getMockMediaAsset(props.posterMediaId) : null;
  const internalVideoAsset = isInternal && source.mediaId ? getMockMediaAsset(source.mediaId) : null;

  return (
    <div className="space-y-4">
      {/* Source Type Toggle */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Nguồn Video (Source)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              onChange({
                ...props,
                source: { type: 'internal', mediaId: 'media-oria-video-intro-07' },
              })
            }
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
              isInternal
                ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs'
                : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
            }`}
          >
            Kho nội bộ (mediaId)
          </button>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...props,
                source: {
                  type: 'external',
                  provider: 'youtube',
                  url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                },
              })
            }
            className={`py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
              !isInternal
                ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs'
                : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
            }`}
          >
            Ngoại tuyến (YouTube/Vimeo)
          </button>
        </div>
      </div>

      {/* Source details */}
      {source.type === 'internal' ? (
        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Tệp video nội bộ
          </label>
          <div className="flex items-center gap-2 p-2.5 bg-admin-panel border border-admin-line rounded-xl">
            <Film size={18} className="text-admin-gold shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-admin-text truncate">
                {internalVideoAsset?.title || 'Tệp Video'}
              </p>
              <code className="text-[10px] text-admin-text-faint font-mono block truncate">
                {source.mediaId || '(chưa chọn)'}
              </code>
            </div>
            <button
              type="button"
              onClick={onOpenMediaPickerForVideo}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-admin-panel-2 border border-admin-line hover:border-admin-gold text-admin-text transition-colors"
            >
              Chọn video
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
              Nhà cung cấp
            </label>
            <select
              value={source.provider}
              onChange={(e) =>
                onChange({
                  ...props,
                  source: {
                    type: 'external',
                    provider: e.target.value as 'youtube' | 'vimeo',
                    url: source.url,
                  },
                })
              }
              className="w-full bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text focus:outline-none focus:border-admin-gold"
            >
              <option value="youtube">YouTube</option>
              <option value="vimeo">Vimeo</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
              Đường dẫn video (URL)
            </label>
            <input
              type="url"
              value={source.url}
              onChange={(e) =>
                onChange({
                  ...props,
                  source: {
                    type: 'external',
                    provider: source.provider,
                    url: e.target.value,
                  },
                })
              }
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold font-mono"
            />
          </div>
        </div>
      )}

      {/* Poster Media */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Ảnh bìa video (Poster Media) — Tùy chọn
        </label>
        <div className="flex items-center gap-2 p-2 bg-admin-panel border border-admin-line rounded-xl">
          <div className="w-10 h-8 rounded bg-black/5 overflow-hidden flex items-center justify-center shrink-0">
            {posterAsset?.url ? (
              <img src={posterAsset.url} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={14} className="text-admin-text-faint" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-admin-text truncate block">
              {props.posterMediaId ? props.posterMediaId : 'Chưa chọn ảnh bìa'}
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenMediaPickerForPoster}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-admin-panel-2 border border-admin-line hover:border-admin-gold text-admin-text transition-colors"
          >
            {props.posterMediaId ? 'Đổi ảnh' : 'Chọn ảnh'}
          </button>
        </div>
      </div>

      {/* Autoplay toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-admin-panel-2 border border-admin-line">
        <div>
          <span className="text-xs font-semibold text-admin-text block">Tự động phát (Autoplay)</span>
          <span className="text-[10px] text-admin-text-faint">Video tự động phát ở chế độ tắt tiếng</span>
        </div>
        <input
          type="checkbox"
          checked={Boolean(props.autoplay)}
          onChange={(e) => onChange({ ...props, autoplay: e.target.checked })}
          className="accent-admin-gold w-4 h-4 cursor-pointer"
        />
      </div>

      {/* Localized Caption */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Chú thích video ({activeLocale.toUpperCase()})
        </label>
        <input
          type="text"
          value={currentCaption}
          onChange={(e) =>
            onChange({
              ...props,
              caption: { ...props.caption, [activeLocale]: e.target.value },
            })
          }
          placeholder="Chú thích hiển thị dưới khung video..."
          className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
        />
      </div>
    </div>
  );
}
