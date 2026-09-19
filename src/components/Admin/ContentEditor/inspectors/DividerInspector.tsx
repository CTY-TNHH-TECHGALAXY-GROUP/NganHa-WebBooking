'use client';

import React from 'react';
import type { DividerBlockProps, DividerStyle } from '@/types/content';

export interface DividerInspectorProps {
  props: DividerBlockProps;
  onChange: (newProps: DividerBlockProps) => void;
}

export function DividerInspector({ props, onChange }: DividerInspectorProps) {
  const style: DividerStyle = props.style || 'gold-flourish';

  return (
    <div className="space-y-4">
      <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
        Họa tiết phân cách (Divider Style)
      </label>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {(['subtle-line', 'gold-flourish', 'diamond-dots'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange({ ...props, style: s })}
            className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all text-center ${
              style === s
                ? 'bg-admin-gold text-[#241804] border-admin-gold font-bold shadow-xs'
                : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
            }`}
          >
            {s === 'subtle-line' ? 'Vạch kẻ mảnh' : s === 'gold-flourish' ? 'Họa tiết Oria' : 'Chấm kim cương'}
          </button>
        ))}
      </div>
    </div>
  );
}
