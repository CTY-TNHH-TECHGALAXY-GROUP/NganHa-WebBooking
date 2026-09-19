'use client';

import React from 'react';
import type { QuoteBlockProps, QuoteVariant, SupportedLocale } from '@/types/content';

export interface QuoteInspectorProps {
  props: QuoteBlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: QuoteBlockProps) => void;
}

export function QuoteInspector({ props, activeLocale, onChange }: QuoteInspectorProps) {
  const currentQuote = props.quote?.[activeLocale] ?? '';
  const currentAuthor = props.author?.[activeLocale] ?? '';
  const currentRole = props.role?.[activeLocale] ?? '';
  const variant: QuoteVariant = props.variant || 'bordered';

  return (
    <div className="space-y-4">
      {/* Variant Selector */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Kiểu dáng trích dẫn (Variant)
        </label>
        <div className="grid grid-cols-3 gap-1.5 text-xs">
          {(['bordered', 'centered-serif', 'ornate-gold'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => onChange({ ...props, variant: v })}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
                variant === v
                  ? 'bg-admin-gold text-[#241804] border-admin-gold font-bold shadow-xs'
                  : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
              }`}
            >
              {v === 'bordered' ? 'Đường viền' : v === 'centered-serif' ? 'Serif giữa' : 'Viền vàng Oria'}
            </button>
          ))}
        </div>
      </div>

      {/* Quote text */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
          Nội dung trích dẫn ({activeLocale.toUpperCase()})
        </label>
        <textarea
          rows={3}
          value={currentQuote}
          onChange={(e) =>
            onChange({
              ...props,
              quote: { ...props.quote, [activeLocale]: e.target.value },
            })
          }
          placeholder="Nhập nội dung trích dẫn hoặc thông điệp..."
          className="w-full px-3 py-2 text-xs bg-admin-panel border border-admin-line rounded-xl text-admin-text focus:outline-none focus:border-admin-gold"
        />
      </div>

      {/* Author & Role */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Tác giả ({activeLocale.toUpperCase()})
          </label>
          <input
            type="text"
            value={currentAuthor}
            onChange={(e) =>
              onChange({
                ...props,
                author: { ...props.author, [activeLocale]: e.target.value },
              })
            }
            placeholder="Tên người phát biểu..."
            className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1">
            Chức danh / Vai trò ({activeLocale.toUpperCase()})
          </label>
          <input
            type="text"
            value={currentRole}
            onChange={(e) =>
              onChange({
                ...props,
                role: { ...props.role, [activeLocale]: e.target.value },
              })
            }
            placeholder="Ví dụ: Bác sĩ trưởng..."
            className="w-full px-3 py-1.5 text-xs bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
          />
        </div>
      </div>
    </div>
  );
}
