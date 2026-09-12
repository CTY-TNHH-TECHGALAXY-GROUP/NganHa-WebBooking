'use client';

import React from 'react';

export const WATERMARK_OPACITY_PRESETS = [
  { label: '10%', value: 10 },
  { label: '15% Chuẩn', value: 15 },
  { label: '30%', value: 30 },
  { label: '50%', value: 50 },
  { label: '80%', value: 80 },
];

export interface WatermarkControlProps {
  checked: boolean;
  opacity?: number;
  onChangeChecked: (checked: boolean) => void;
  onChangeOpacity: (opacity: number) => void;
  title?: string;
  subtitle?: string;
}

export function WatermarkControl({
  checked,
  opacity = 15,
  onChangeChecked,
  onChangeOpacity,
  title = 'Watermark (Logo mờ)',
  subtitle,
}: WatermarkControlProps) {
  const currentOpacity = typeof opacity === 'number' ? Math.max(5, Math.min(100, opacity)) : 15;

  return (
    <div className="rounded-lg border border-admin-line bg-admin-card/70 p-3 space-y-2.5">
      {/* Toggle row */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold text-admin-text">{title}</p>
          <p className="mt-0.5 text-[10px] text-admin-text-faint">
            {checked
              ? subtitle || `Đang bật (Độ mờ: ${currentOpacity}%)`
              : 'Đang tắt'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChangeChecked(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            checked ? 'bg-admin-gold' : 'bg-admin-line'
          }`}
        >
          <span
            aria-hidden="true"
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
              checked ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Opacity slider & presets */}
      {checked && (
        <div className="pt-2 border-t border-admin-line/60 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-admin-text-faint font-medium">Độ mờ logo (Capacity / Opacity):</span>
            <span className="font-mono font-bold text-admin-gold bg-admin-gold/10 px-1.5 py-0.5 rounded text-[11px]">
              {currentOpacity}%
            </span>
          </div>

          <input
            type="range"
            min={5}
            max={100}
            step={5}
            value={currentOpacity}
            onChange={(e) => onChangeOpacity(Number(e.target.value))}
            className="w-full h-1.5 bg-admin-bg rounded-lg appearance-none cursor-pointer accent-admin-gold"
          />

          {/* Quick preset pills */}
          <div className="flex flex-wrap gap-1 pt-0.5">
            {WATERMARK_OPACITY_PRESETS.map((p) => {
              const isSelected = currentOpacity === p.value;
              return (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => onChangeOpacity(p.value)}
                  className={`px-2 py-0.5 text-[10px] rounded border transition-colors ${
                    isSelected
                      ? 'bg-admin-gold text-white font-bold border-admin-gold'
                      : 'bg-admin-bg text-admin-text-faint hover:text-admin-text border-admin-line hover:border-admin-gold/40'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
