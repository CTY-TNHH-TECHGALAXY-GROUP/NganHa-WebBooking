'use client';

import React from 'react';
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import type { HeadingBlockProps, SupportedLocale } from '@/types/content';

export interface HeadingInspectorProps {
  props: HeadingBlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: HeadingBlockProps) => void;
}

export function HeadingInspector({ props, activeLocale, onChange }: HeadingInspectorProps) {
  const currentText = props.text?.[activeLocale] ?? '';
  const currentSubtitle = props.subtitle?.[activeLocale] ?? '';
  const level = props.level || 2;
  const align = props.align || 'left';

  const handleTextChange = (val: string) => {
    onChange({
      ...props,
      text: {
        ...props.text,
        [activeLocale]: val,
      },
    });
  };

  const handleSubtitleChange = (val: string) => {
    onChange({
      ...props,
      subtitle: {
        ...props.subtitle,
        [activeLocale]: val,
      },
    });
  };

  return (
    <div className="space-y-4">
      {/* Level Selector */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Cấp độ tiêu đề (Level)
        </label>
        <div className="grid grid-cols-3 gap-2">
          {([2, 3, 4] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => onChange({ ...props, level: lvl })}
              className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                level === lvl
                  ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs'
                  : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
              }`}
            >
              H{lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Alignment */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Căn lề (Alignment)
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => onChange({ ...props, align: 'left' })}
            className={`py-1.5 flex items-center justify-center rounded-lg border transition-all ${
              align === 'left'
                ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs'
                : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
            }`}
            title="Căn trái"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...props, align: 'center' })}
            className={`py-1.5 flex items-center justify-center rounded-lg border transition-all ${
              align === 'center'
                ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs'
                : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
            }`}
            title="Căn giữa"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...props, align: 'right' })}
            className={`py-1.5 flex items-center justify-center rounded-lg border transition-all ${
              align === 'right'
                ? 'bg-admin-gold text-[#241804] border-admin-gold shadow-xs'
                : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
            }`}
            title="Căn phải"
          >
            <AlignRight size={16} />
          </button>
        </div>
      </div>

      {/* Localized Text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-[11px] font-medium text-admin-text-faint">
            Nội dung tiêu đề ({activeLocale.toUpperCase()})
          </label>
          {!currentText && props.text?.vi && activeLocale !== 'vi' && (
            <span className="text-[10px] text-amber-600 font-mono">
              Fallback từ VI: &ldquo;{props.text.vi}&rdquo;
            </span>
          )}
        </div>
        <textarea
          rows={2}
          value={currentText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={`Nhập tiêu đề bằng tiếng ${activeLocale.toUpperCase()}...`}
          className="w-full px-3 py-2 text-xs bg-admin-panel border border-admin-line rounded-xl text-admin-text focus:outline-none focus:border-admin-gold focus:ring-1 focus:ring-admin-gold/30"
        />
      </div>

      {/* Localized Subtitle */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Phụ đề tiêu đề ({activeLocale.toUpperCase()}) — Tùy chọn
        </label>
        <textarea
          rows={2}
          value={currentSubtitle}
          onChange={(e) => handleSubtitleChange(e.target.value)}
          placeholder="Nhập phụ đề dẫn dắt..."
          className="w-full px-3 py-2 text-xs bg-admin-panel border border-admin-line rounded-xl text-admin-text focus:outline-none focus:border-admin-gold focus:ring-1 focus:ring-admin-gold/30"
        />
      </div>
    </div>
  );
}
