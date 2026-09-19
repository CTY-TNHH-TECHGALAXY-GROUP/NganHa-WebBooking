'use client';

import React from 'react';
import {
  Image as ImageIcon,
  Crosshair,
} from 'lucide-react';
import type {
  ImageBlockProps,
  ImageAspectRatio,
  ImageFit,
  ImagePresentation,
  SupportedLocale,
} from '@/types/content';
import { getMockMediaAsset } from '../../MediaPicker/mockMedia';

export interface ImageInspectorProps {
  props: ImageBlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: ImageBlockProps) => void;
  onOpenMediaPicker: () => void;
  onOpenPositionEditor: () => void;
}

export function ImageInspector({
  props,
  activeLocale,
  onChange,
  onOpenMediaPicker,
  onOpenPositionEditor,
}: ImageInspectorProps) {
  const currentAlt = props.alt?.[activeLocale] ?? '';
  const currentCaption = props.caption?.[activeLocale] ?? '';
  const resolvedAsset = props.mediaId ? getMockMediaAsset(props.mediaId) : null;

  const aspectRatio: ImageAspectRatio = props.aspectRatio || '16:9';
  const fit: ImageFit = props.fit || 'cover';
  const presentation: ImagePresentation = props.presentation || 'contained';
  const focalPoint = props.focalPoint || { x: 50, y: 50 };
  const zoom = props.zoom ?? 1.0;

  const handleAltChange = (val: string) => {
    onChange({
      ...props,
      alt: {
        ...props.alt,
        [activeLocale]: val,
      },
    });
  };

  const handleCaptionChange = (val: string) => {
    onChange({
      ...props,
      caption: {
        ...props.caption,
        [activeLocale]: val,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Media Selection Panel */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Tệp Media (Canonical mediaId)
        </label>

        {props.mediaId ? (
          <div className="border border-admin-line rounded-xl overflow-hidden bg-admin-panel p-3 flex items-center gap-3">
            <div className="w-16 h-12 rounded-lg bg-black/5 overflow-hidden relative shrink-0 border border-admin-line">
              {resolvedAsset ? (
                <img
                  src={resolvedAsset.url}
                  alt={resolvedAsset.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-admin-text-faint">
                  <ImageIcon size={18} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-admin-text truncate">
                {resolvedAsset?.title || 'Tệp Media đã chọn'}
              </p>
              <code className="text-[10px] font-mono text-admin-gold block truncate">
                {props.mediaId}
              </code>
            </div>

            <button
              type="button"
              onClick={onOpenMediaPicker}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-admin-panel-2 border border-admin-line hover:border-admin-gold text-admin-text transition-colors shrink-0"
            >
              Đổi tệp
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onOpenMediaPicker}
            className="w-full py-4 px-4 border-2 border-dashed border-admin-line hover:border-admin-gold/60 rounded-xl bg-admin-panel flex flex-col items-center justify-center gap-1.5 text-admin-text-dim hover:text-admin-gold transition-colors cursor-pointer"
          >
            <ImageIcon size={22} className="text-admin-text-faint" />
            <span className="text-xs font-semibold">Chọn hình ảnh từ Thư viện Media</span>
            <span className="text-[10px] text-admin-text-faint">Hỗ trợ JPG, PNG, WebP (tối đa 100MB)</span>
          </button>
        )}
      </div>

      {/* Focal Point & Zoom Adjustment Affordance */}
      {props.mediaId && (
        <div className="p-3.5 rounded-xl bg-admin-panel-2 border border-admin-line space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-admin-text flex items-center gap-1.5">
              <Crosshair size={14} className="text-admin-gold" /> Tiêu cự & Thu phóng
            </span>
            <button
              type="button"
              onClick={onOpenPositionEditor}
              className="text-xs font-semibold text-admin-gold hover:underline flex items-center gap-1"
            >
              Căn chỉnh trực quan →
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-admin-panel p-2 rounded-lg border border-admin-line">
              <span className="text-[10px] text-admin-text-faint block">Điểm tiêu cự (Focal):</span>
              <span className="font-mono font-bold text-admin-text">
                X: {focalPoint.x}% / Y: {focalPoint.y}%
              </span>
            </div>
            <div className="bg-admin-panel p-2 rounded-lg border border-admin-line">
              <span className="text-[10px] text-admin-text-faint block">Độ thu phóng (Zoom):</span>
              <span className="font-mono font-bold text-admin-text">
                {zoom.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Aspect Ratio */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Tỷ lệ khung hình (Aspect Ratio)
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(['original', '16:9', '4:3', '3:2', '1:1', '3:4'] as const).map((ar) => (
            <button
              key={ar}
              type="button"
              onClick={() => onChange({ ...props, aspectRatio: ar })}
              className={`py-1.5 px-2 rounded-lg font-mono text-xs border transition-all ${
                aspectRatio === ar
                  ? 'bg-admin-gold text-[#241804] border-admin-gold font-bold shadow-xs'
                  : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
              }`}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>

      {/* Object Fit & Presentation */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Cách hiển thị (Fit)
          </label>
          <select
            value={fit}
            onChange={(e) => onChange({ ...props, fit: e.target.value as ImageFit })}
            className="w-full bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text focus:outline-none focus:border-admin-gold"
          >
            <option value="cover">Phủ đầy (cover)</option>
            <option value="contain">Vừa khung (contain)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Quy cách viền (Presentation)
          </label>
          <select
            value={presentation}
            onChange={(e) => onChange({ ...props, presentation: e.target.value as ImagePresentation })}
            className="w-full bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text focus:outline-none focus:border-admin-gold"
          >
            <option value="contained">Trong cột (contained)</option>
            <option value="wide">Rộng (wide)</option>
            <option value="full">Toàn màn hình (full)</option>
            <option value="framed">Khung viền vàng Oria (framed)</option>
          </select>
        </div>
      </div>

      {/* Localized Alt Text */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Mô tả trợ năng Alt ({activeLocale.toUpperCase()})
        </label>
        <input
          type="text"
          value={currentAlt}
          onChange={(e) => handleAltChange(e.target.value)}
          placeholder="Mô tả hình ảnh cho trình đọc màn hình và SEO..."
          className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
        />
      </div>

      {/* Localized Caption */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Chú thích ảnh ({activeLocale.toUpperCase()})
        </label>
        <input
          type="text"
          value={currentCaption}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="Chú thích hiển thị dưới ảnh..."
          className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
        />
      </div>
    </div>
  );
}
