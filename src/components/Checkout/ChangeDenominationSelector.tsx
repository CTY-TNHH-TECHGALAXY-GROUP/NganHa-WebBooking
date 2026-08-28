'use client';

import React, { useState, useMemo, useCallback } from 'react';

// 🔧 UI CONFIGURATION
const ANIMATION_DURATION = 300;
const BUTTON_MIN_WIDTH = '80px';
const BUTTON_TOUCH_TARGET = '44px'; // Mobile-first: touch target >= 44px

// Denomination options
const VND_DENOMINATIONS = [500000, 200000, 100000, 50000];
const USD_DENOMINATIONS = [50, 20, 10, 5, 1];

interface ChangeDenominationSelectorProps {
  changeAmount: number;
  currency: 'VND' | 'USD';
  dict: any;
  onSelect?: (denominations: number[]) => void;
}

const ChangeDenominationSelector = ({
  changeAmount,
  currency,
  dict,
  onSelect,
}: ChangeDenominationSelectorProps) => {
  const [selectedDenominations, setSelectedDenominations] = useState<number[]>([]);

  const denominations = currency === 'USD' ? USD_DENOMINATIONS : VND_DENOMINATIONS;

  // Calculate total selected and remaining
  const totalSelected = useMemo(
    () => selectedDenominations.reduce((sum, d) => sum + d, 0),
    [selectedDenominations]
  );

  const remaining = useMemo(
    () => changeAmount - totalSelected,
    [changeAmount, totalSelected]
  );

  // Format currency display
  const formatAmount = useCallback(
    (amount: number) => {
      if (currency === 'USD') return `$${amount}`;
      return `${amount.toLocaleString('vi-VN')}`;
    },
    [currency]
  );

  // Add denomination
  const handleAdd = useCallback(
    (denom: number) => {
      if (remaining >= denom) {
        const updated = [...selectedDenominations, denom];
        setSelectedDenominations(updated);
        onSelect?.(updated);
      }
    },
    [remaining, selectedDenominations, onSelect]
  );

  // Remove last occurrence of a denomination
  const handleRemove = useCallback(
    (index: number) => {
      const updated = selectedDenominations.filter((_, i) => i !== index);
      setSelectedDenominations(updated);
      onSelect?.(updated);
    },
    [selectedDenominations, onSelect]
  );

  // Reset all
  const handleReset = useCallback(() => {
    setSelectedDenominations([]);
    onSelect?.([]);
  }, [onSelect]);

  // Group selected denominations for display
  const groupedDenominations = useMemo(() => {
    const groups: Record<number, number> = {};
    selectedDenominations.forEach((d) => {
      groups[d] = (groups[d] || 0) + 1;
    });
    return Object.entries(groups)
      .map(([denom, count]) => ({ denom: Number(denom), count }))
      .sort((a, b) => b.denom - a.denom);
  }, [selectedDenominations]);

  // Don't render if no change
  if (changeAmount <= 0) return null;

  const t = dict?.checkout;

  return (
    <div
      className="bg-gradient-to-br from-[#1c1c1e] to-[#0d0d0d] rounded-2xl p-4 border border-[#C9A96E]/20 space-y-3 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDuration: `${ANIMATION_DURATION}ms` }}
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#C9A96E]">
          💰 {t?.change_denomination_title || 'Preferred Change'}
        </h3>
        {selectedDenominations.length > 0 && (
          <button
            onClick={handleReset}
            className="text-red-500 text-xs font-bold border border-red-100 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
          >
            {t?.change_denomination_reset || 'Reset'}
          </button>
        )}
      </div>

      {/* Denomination Buttons */}
      <div className="flex gap-2 flex-wrap justify-center">
        {denominations.map((denom) => {
          const isDisabled = remaining < denom;
          return (
            <button
              key={denom}
              onClick={() => handleAdd(denom)}
              disabled={isDisabled}
              className={`
                px-4 rounded-xl font-bold text-sm border transition-all duration-200
                ${isDisabled
                  ? 'bg-[#0d0d0d] border-white/5 text-[#3f3f46] cursor-not-allowed'
                  : 'bg-[#1c1c1e] border-[#C9A96E]/50 text-[#C9A96E] hover:bg-[#C9A96E]/10 hover:border-[#C9A96E] active:scale-95 shadow-sm'
                }
              `}
              style={{ minWidth: BUTTON_MIN_WIDTH, minHeight: BUTTON_TOUCH_TARGET }}
            >
              {formatAmount(denom)}
            </button>
          );
        })}
      </div>

      {/* Selected Denominations Display */}
      {selectedDenominations.length > 0 && (
        <div className="space-y-2 animate-in fade-in duration-200">
          {/* Grouped display */}
          <div className="flex flex-wrap gap-2 justify-center">
            {groupedDenominations.map(({ denom, count }) => (
              <div
                key={denom}
                className="flex items-center gap-1 bg-[#0d0d0d] rounded-lg px-3 py-1.5 border border-[#C9A96E]/40 shadow-sm"
              >
                <span className="text-sm font-bold text-[#C9A96E]">
                  {count > 1 && `${count}×`}{formatAmount(denom)}
                </span>
                <button
                  onClick={() => {
                    const idx = selectedDenominations.lastIndexOf(denom);
                    if (idx !== -1) handleRemove(idx);
                  }}
                  className="ml-1 text-red-400 hover:text-red-600 text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Remaining display */}
          <div className="flex justify-between items-center bg-[#0d0d0d]/60 rounded-xl px-3 py-2">
            <span className="text-xs text-gray-400 font-medium">
              {t?.change_denomination_remaining || 'Remaining'}
            </span>
            <span className={`text-sm font-bold ${remaining === 0 ? 'text-green-500' : 'text-[#C9A96E]'}`}>
              {remaining === 0
                ? '✓ ' + (currency === 'VND' ? 'Đủ' : 'Complete')
                : formatAmount(remaining) + ` ${currency}`
              }
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangeDenominationSelector;
