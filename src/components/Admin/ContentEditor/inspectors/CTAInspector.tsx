'use client';

import React from 'react';
import type { CTABlockProps, CTAVariant, SupportedLocale } from '@/types/content';

export interface CTAInspectorProps {
  props: CTABlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: CTABlockProps) => void;
}

export function CTAInspector({ props, activeLocale, onChange }: CTAInspectorProps) {
  const currentTitle = props.title?.[activeLocale] ?? '';
  const currentSubtitle = props.subtitle?.[activeLocale] ?? '';
  const currentButtonText = props.buttonText?.[activeLocale] ?? '';
  const variant: CTAVariant = props.variant || 'gold-solid';

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Kiểu dáng nút bấm (CTA Variant)
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(['gold-solid', 'gold-outline', 'dark-luxury'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...props, variant: v })}
              className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all ${
                variant === v
                  ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs font-bold'
                  : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
              }`}
            >
              {v === 'gold-solid' ? 'Vàng đặc' : v === 'gold-outline' ? 'Viền vàng' : 'Đen Luxury'}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Tiêu đề kêu gọi ({activeLocale.toUpperCase()})
        </label>
        <input
          type="text"
          value={currentTitle}
          onChange={(e) =>
            onChange({
              ...props,
              title: { ...props.title, [activeLocale]: e.target.value },
            })
          }
          placeholder="Tiêu đề chính của banner CTA..."
          className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
        />
      </div>

      {/* Subtitle */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Phụ đề ({activeLocale.toUpperCase()}) — Tùy chọn
        </label>
        <input
          type="text"
          value={currentSubtitle}
          onChange={(e) =>
            onChange({
              ...props,
              subtitle: { ...props.subtitle, [activeLocale]: e.target.value },
            })
          }
          placeholder="Dòng mô tả phụ khuyến khích hành động..."
          className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
        />
      </div>

      {/* Button Text & Button URL */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Chữ trên nút ({activeLocale.toUpperCase()})
          </label>
          <input
            type="text"
            value={currentButtonText}
            onChange={(e) =>
              onChange({
                ...props,
                buttonText: { ...props.buttonText, [activeLocale]: e.target.value },
              })
            }
            placeholder="Ví dụ: Đặt lịch ngay"
            className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold font-bold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Đích đến (URL)
          </label>
          <input
            type="text"
            value={props.buttonUrl}
            onChange={(e) => onChange({ ...props, buttonUrl: e.target.value })}
            placeholder="/booking hoặc https://..."
            className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold font-mono"
          />
        </div>
      </div>
    </div>
  );
}
