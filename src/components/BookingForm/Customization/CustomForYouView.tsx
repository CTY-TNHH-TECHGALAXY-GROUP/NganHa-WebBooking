// ═══════════════════════════════════════
// CustomForYouView — "Custom for You" Modal/Sheet
// Appears after user clicks "Add to Cart"
// Adapted from wrb-noi-bo-dev/CustomForYou
// ═══════════════════════════════════════
'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Ban, Activity, User, ChevronLeft } from 'lucide-react';
import Image from 'next/image';
import {
  CustomPreferences,
  DEFAULT_CUSTOM_PREFERENCES,
  BODY_PARTS,
  BodyPartKey,
} from './types';

// 🔧 UI CONFIGURATION
const OVERLAY_BG = 'bg-black/60';
const MODAL_BG = 'bg-[#0D0D0D]';
const ACCENT_COLOR = '#D4AF37';
const FOCUS_COLOR = '#22c55e'; // green-500
const AVOID_COLOR = '#ef4444'; // red-500

// Strength options with dark-mode styling
const STRENGTH_OPTIONS = [
  { value: 'light' as const, label: 'Nhẹ', color: 'emerald' },
  { value: 'medium' as const, label: 'Vừa', color: 'amber' },
  { value: 'strong' as const, label: 'Mạnh', color: 'rose' },
];

// Therapist options
const THERAPIST_OPTIONS = [
  { value: 'male' as const, label: 'Nam' },
  { value: 'female' as const, label: 'Nữ' },
  { value: 'random' as const, label: 'Tùy ý' },
];

interface CustomForYouViewProps {
  serviceName: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (prefs: CustomPreferences) => void;
  onBack: () => void;
  showStrength?: boolean;
}

const CustomForYouView: React.FC<CustomForYouViewProps> = ({
  serviceName,
  isOpen,
  onClose,
  onSave,
  onBack,
  showStrength = true,
}) => {
  const [prefs, setPrefs] = useState<CustomPreferences>({ ...DEFAULT_CUSTOM_PREFERENCES });
  const [activeTab, setActiveTab] = useState<'area' | 'preferences'>('area');

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setPrefs({ ...DEFAULT_CUSTOM_PREFERENCES });
      setActiveTab('area');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Body part toggle handler
  const handleBodyToggle = (type: 'focus' | 'avoid', area: string) => {
    setPrefs(prev => {
      let newFocus = [...prev.bodyParts.focus];
      let newAvoid = [...prev.bodyParts.avoid];

      if (area === 'CLEAR_ALL') {
        return { ...prev, bodyParts: { focus: [], avoid: [] } };
      }

      if (area === 'FULL_BODY' && type === 'focus') {
        const allParts = BODY_PARTS.map(p => p.key);
        return { ...prev, bodyParts: { focus: allParts, avoid: [] } };
      }

      if (type === 'focus') {
        if (newFocus.includes(area)) {
          newFocus = newFocus.filter(k => k !== area);
        } else {
          newFocus.push(area);
          newAvoid = newAvoid.filter(k => k !== area);
        }
      } else {
        if (newAvoid.includes(area)) {
          newAvoid = newAvoid.filter(k => k !== area);
        } else {
          newAvoid.push(area);
          newFocus = newFocus.filter(k => k !== area);
        }
      }

      return { ...prev, bodyParts: { focus: newFocus, avoid: newAvoid } };
    });
  };

  const isFullBody = prefs.bodyParts.focus.length === BODY_PARTS.length;

  return (
    <div className="fixed inset-0 z-[110] flex items-end lg:items-center justify-center p-0 lg:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`absolute inset-0 ${OVERLAY_BG} backdrop-blur-sm`}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className={`relative w-full lg:max-w-2xl ${MODAL_BG} border-t lg:border border-white/10 rounded-t-[2.5rem] lg:rounded-[2rem] overflow-hidden shadow-2xl flex flex-col`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-lg font-serif text-[#F5E6B8]">Tùy chỉnh dịch vụ</h2>
              <p className="text-white/40 text-xs font-light">{serviceName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-white/10 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('area')}
            className={`flex-1 py-3.5 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'area'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-white/30 hover:text-white/50'
            }`}
          >
            Vùng tập trung
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex-1 py-3.5 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'preferences'
                ? 'border-[#D4AF37] text-[#D4AF37]'
                : 'border-transparent text-white/30 hover:text-white/50'
            }`}
          >
            KTV & Lực massage
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <AnimatePresence mode="wait">
            {activeTab === 'area' ? (
              <motion.div
                key="area"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {/* Full Body Toggle */}
                <div className="flex items-center justify-between mb-5">
                  <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-light">
                    Chọn vùng cần massage
                  </p>
                  <button
                    type="button"
                    onClick={() => handleBodyToggle('focus', isFullBody ? 'CLEAR_ALL' : 'FULL_BODY')}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      isFullBody
                        ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
                        : 'bg-white/5 text-white/40 ring-1 ring-white/10 hover:ring-white/20'
                    }`}
                  >
                    {isFullBody ? '✓ Toàn thân' : 'Chọn hết'}
                  </button>
                </div>

                {/* Body Parts List */}
                <div className="space-y-1">
                  {BODY_PARTS.map((part) => {
                    const isFocus = prefs.bodyParts.focus.includes(part.key);
                    const isAvoid = prefs.bodyParts.avoid.includes(part.key);

                    return (
                      <div
                        key={part.key}
                        className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                      >
                        <span className="text-white/70 text-sm font-light">{part.labelVi}</span>
                        <div className="flex items-center gap-3">
                          {/* Focus Button */}
                          <button
                            type="button"
                            onClick={() => handleBodyToggle('focus', part.key)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isFocus
                                ? 'bg-emerald-500 text-white shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                                : 'bg-white/5 text-white/20 ring-1 ring-white/10 hover:ring-emerald-500/30'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          {/* Avoid Button */}
                          <button
                            type="button"
                            onClick={() => handleBodyToggle('avoid', part.key)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                              isAvoid
                                ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                                : 'bg-white/5 text-white/20 ring-1 ring-white/10 hover:ring-red-500/30'
                            }`}
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="mt-4 flex items-center gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-500" />
                    <span className="text-white/30 text-[10px] uppercase tracking-wider">Tập trung</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-500" />
                    <span className="text-white/30 text-[10px] uppercase tracking-wider">Tránh</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="space-y-8"
              >
                {/* Strength Section */}
                {showStrength && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Activity className="w-3.5 h-3.5 text-white/30" />
                      <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-light">
                        Lực massage
                      </p>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      {STRENGTH_OPTIONS.map(opt => {
                        const isActive = prefs.strength === opt.value;
                        const colorMap = {
                          emerald: isActive ? 'bg-emerald-500/15 ring-emerald-500/40 text-emerald-400' : '',
                          amber: isActive ? 'bg-amber-500/15 ring-amber-500/40 text-amber-400' : '',
                          rose: isActive ? 'bg-rose-500/15 ring-rose-500/40 text-rose-400' : '',
                        };
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPrefs(prev => ({ ...prev, strength: opt.value }))}
                            className={`py-4 w-full rounded-[14px] text-base font-medium ring-1 transition-all ${
                              isActive
                                ? colorMap[opt.color as keyof typeof colorMap]
                                : 'bg-white/[0.03] ring-white/[0.07] text-white/40 hover:ring-white/15'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Therapist Section */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <User className="w-3.5 h-3.5 text-white/30" />
                    <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-light">
                      Kỹ thuật viên
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {THERAPIST_OPTIONS.map(opt => {
                      const isActive = prefs.therapist === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setPrefs(prev => ({ ...prev, therapist: opt.value }))}
                          className={`py-4 w-full rounded-[14px] text-base font-medium ring-1 transition-all ${
                            isActive
                              ? 'bg-[#D4AF37]/15 ring-[#D4AF37]/40 text-[#D4AF37]'
                              : 'bg-white/[0.03] ring-white/[0.07] text-white/40 hover:ring-white/15'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-light mb-3">
                    Ghi chú thêm
                  </p>
                  <textarea
                    value={prefs.notes}
                    onChange={(e) => setPrefs(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Yêu cầu đặc biệt..."
                    rows={3}
                    className="w-full bg-white/[0.03] ring-1 ring-white/[0.07] rounded-xl px-4 py-3 text-white/85 text-sm font-light placeholder:text-white/15 focus:outline-none focus:ring-[#D4AF37]/30 transition-all resize-none"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sticky Footer */}
        <div className="p-5 pt-3 border-t border-white/10 flex-shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => onSave(prefs)}
            className="w-full py-4 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#E7AA51] text-black font-bold rounded-2xl flex items-center justify-center gap-2 text-base uppercase tracking-wide shadow-[0_10px_30px_rgba(212,175,55,0.15)] active:scale-[0.98] transition-transform"
          >
            <Check className="w-5 h-5" />
            <span>Lưu tùy chỉnh</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomForYouView;
