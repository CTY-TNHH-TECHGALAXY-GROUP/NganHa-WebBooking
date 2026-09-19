'use client';

import React from 'react';
import type { BaseBlockSettings, SupportedLocale, BlockSpacing } from '@/types/content';
import { SUPPORTED_LOCALES } from '@/types/content';

export interface BaseSettingsInspectorProps {
  settings?: BaseBlockSettings;
  activeLocale: SupportedLocale;
  onChange: (newSettings: BaseBlockSettings) => void;
}

export function BaseSettingsInspector({
  settings = {},
  activeLocale,
  onChange,
}: BaseSettingsInspectorProps) {
  const width = settings.width || 'content';
  const spacingTop = settings.spacingTop || 'md';
  const spacingBottom = settings.spacingBottom || 'md';
  const visibility = settings.visibility || {};

  const handleUpdate = (patch: Partial<BaseBlockSettings>) => {
    onChange({
      ...settings,
      ...patch,
    });
  };

  const handleToggleLocale = (loc: SupportedLocale) => {
    const current = visibility[loc] !== false; // default true
    handleUpdate({
      visibility: {
        ...visibility,
        [loc]: !current,
      },
    });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-admin-line">
      <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text-dim">
        Cài đặt bố cục chung
      </h3>

      {/* Block Width */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Chiều rộng hiển thị (Width)
        </label>
        <div className="grid grid-cols-4 gap-1.5 text-xs">
          {(['narrow', 'content', 'wide', 'full'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => handleUpdate({ width: w })}
              className={`py-1.5 px-2 rounded-lg font-medium capitalize border transition-all ${
                width === w
                  ? 'bg-admin-gold text-[#241804] border-admin-gold font-bold shadow-xs'
                  : 'bg-admin-panel border-admin-line text-admin-text-dim hover:text-admin-text'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Spacing Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
            Khoảng cách trên (Top)
          </label>
          <select
            value={spacingTop}
            onChange={(e) => handleUpdate({ spacingTop: e.target.value as BlockSpacing })}
            className="w-full bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text focus:outline-none focus:border-admin-gold"
          >
            <option value="none">Không có (none)</option>
            <option value="sm">Nhỏ (sm)</option>
            <option value="md">Vừa (md)</option>
            <option value="lg">Lớn (lg)</option>
            <option value="xl">Rất lớn (xl)</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
            Khoảng cách dưới (Bottom)
          </label>
          <select
            value={spacingBottom}
            onChange={(e) => handleUpdate({ spacingBottom: e.target.value as BlockSpacing })}
            className="w-full bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text focus:outline-none focus:border-admin-gold"
          >
            <option value="none">Không có (none)</option>
            <option value="sm">Nhỏ (sm)</option>
            <option value="md">Vừa (md)</option>
            <option value="lg">Lớn (lg)</option>
            <option value="xl">Rất lớn (xl)</option>
          </select>
        </div>
      </div>

      {/* Multilingual Visibility Toggles */}
      <div>
        <label className="block text-[11px] font-medium text-admin-text-faint mb-1.5">
          Hiển thị theo ngôn ngữ
        </label>
        <div className="flex flex-wrap gap-1.5">
          {SUPPORTED_LOCALES.map((loc) => {
            const isVisible = visibility[loc] !== false;
            const isCurrent = loc === activeLocale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleToggleLocale(loc)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold border transition-all ${
                  isVisible
                    ? isCurrent
                      ? 'bg-admin-gold/20 text-admin-gold border-admin-gold'
                      : 'bg-admin-panel text-admin-text border-admin-line'
                    : 'bg-admin-panel-2 text-admin-text-faint line-through border-dashed border-admin-line opacity-60'
                }`}
                title={`Bật/tắt hiển thị cho ${loc.toUpperCase()}`}
              >
                {loc.toUpperCase()}
              </button>
            );
          })}
        </div>
        <p className="text-[10px] text-admin-text-faint mt-1">
          Cây khối là duy nhất. Tắt ngôn ngữ chỉ ẩn khối này khi xem trang ở ngôn ngữ đó.
        </p>
      </div>
    </div>
  );
}
