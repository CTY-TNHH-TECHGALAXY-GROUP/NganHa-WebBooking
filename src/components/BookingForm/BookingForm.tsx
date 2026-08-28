'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useBookingForm } from './BookingForm.logic';
import type { BookingResult, SelectedServiceItem, ServiceCustomOptions } from './BookingForm.logic';
import CustomForYouView from './Customization/CustomForYouView';
import { t } from './BookingForm.i18n';
import {
  stepSlideVariants,
  intentContainerVariants,
  intentItemVariants,
  categoryContainerVariants,
  categoryCardItemVariants,
  categoryCardVariants,
  accordionVariants,
  serviceRowContainerVariants,
  serviceRowVariants,
  durationPickerVariants,
  floatingBasketVariants,
  countBounceTransition,
  successCardVariants,
  confettiItemVariants,
  sectionFadeVariants,
  overlayVariants,
  sheetVariants,
  modalVariants,
} from './BookingForm.animation';
import { GroupedService, DurationVariant, getGroupedServiceName, getGroupedServiceDescription } from '@/lib/groupServices';
import { getCategoryDisplay, INTENT_DISPLAY, IntentKey } from '@/data/categoryImages';
import { BRANCH_LIST } from '@/data/branches';
import {
  CalendarDays, Clock, MapPin, Users, UserCircle,
  Check, ArrowRight, ArrowLeft, Sparkles, Plus, Minus,
  ShoppingBag, ChevronDown, ChevronUp, X, Star,
  Waves, Scissors, Zap, Wind, Footprints, Hand, PlusCircle,
} from 'lucide-react';
import { getServiceImage } from '@/data/serviceImages';

// ─── UI CONFIG ───
const GOLD = '#D4AF37';
const PHONE_REGEX = /^[+]?[0-9\s\-(). ]{7,20}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00',
];

// ════════════════════════════════════════
// SHARED SUB-COMPONENTS
// ════════════════════════════════════════

const GoldDivider = () => (
  <div className="h-px w-full bg-gradient-to-r from-transparent via-[#D4AF37]/20 to-transparent my-4" />
);

const StepProgress = ({
  current, total,
}: {
  current: number; total: number;
}) => {
  const labels = ["Chọn Dịch Vụ", "Thông Tin", "Xác Nhận"];
  return (
    <div className="flex items-center justify-center gap-1.5 mb-8 opacity-90 px-2 lg:px-0">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <React.Fragment key={step}>
            {i > 0 && <div className="h-px w-6 sm:w-16 border-t-[1.5px] border-dotted border-[#eab308]/40 mx-0.5" />}
            <div className={`flex items-center gap-2 ${isDone || isActive ? 'text-[#eab308]' : 'text-white/20'}`}>
              <div className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${isDone || isActive ? 'bg-[#eab308]/10 border border-[#eab308]' : 'border border-white/20'}`}>
                {isDone ? <Check className="w-3 h-3" strokeWidth={3} /> : step}
              </div>
              <span className={`text-[10px] tracking-wider uppercase font-semibold ${isActive ? 'text-[#eab308]' : isDone ? 'text-white/80' : 'text-white/40'} hidden sm:inline-block`}>
                {labels[i]}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ════════════════════════════════════════
// SERVICE DETAIL SHEET (Bottom Sheet / Modal)
// ════════════════════════════════════════

const ServiceDetailSheet = ({
  group,
  onClose,
  selections,
  onUpdate,
  onCustomSave,
}: {
  group: GroupedService;
  onClose: () => void;
  selections: SelectedServiceItem[];
  onUpdate: (group: GroupedService, variant: DurationVariant, quantity: number) => void;
  onCustomSave?: (groupKey: string, variantId: string, options: ServiceCustomOptions) => void;
}) => {
  const name = getGroupedServiceName(group, 'vi');
  const desc = getGroupedServiceDescription(group, 'vi');

  // 🔧 UI CONFIGURATION
  const PULSE_SCALE = 1.03;
  const PULSE_DURATION = 0.3;

  // viewMode: 'SELECT' (duration grid) or 'CUSTOM' (custom for you)
  const [viewMode, setViewMode] = React.useState<'SELECT' | 'CUSTOM'>('SELECT');

  // Default to the first selection or first variant
  const [activeVariantId, setActiveVariantId] = React.useState<string>(
    selections.length > 0 ? selections[0].variantId : group.variants[0].id
  );

  const activeVariant = group.variants.find(v => v.id === activeVariantId) || group.variants[0];
  const currentQty = selections.find(s => s.variantId === activeVariantId)?.quantity || 0;
  
  // Temporary qty for the variant being adjusted
  const [tempQty, setTempQty] = React.useState<number>(currentQty > 0 ? currentQty : 1);
  // Pulse key for button animation
  const [pulseKey, setPulseKey] = React.useState(0);
  
  // Trạng thái cho việc "Xem thêm" mốc thời gian
  const [showAllDurations, setShowAllDurations] = React.useState(false);

  // Sync tempQty when variant changes
  React.useEffect(() => {
    const existing = selections.find(s => s.variantId === activeVariantId);
    setTempQty(existing ? existing.quantity : 1);
  }, [activeVariantId, selections]);

  // Trigger pulse animation when qty or variant changes
  React.useEffect(() => {
    setPulseKey(prev => prev + 1);
  }, [tempQty, activeVariantId]);

  const handleUpdate = () => {
    onUpdate(group, activeVariant, tempQty);
    // After adding to cart, show Custom for You
    if (tempQty > 0) {
      setViewMode('CUSTOM');
    }
  };

  const handleCustomSave = (prefs: import('./Customization/types').CustomPreferences) => {
    if (onCustomSave) {
      onCustomSave(group.groupKey, activeVariantId, {
        bodyParts: prefs.bodyParts,
        strength: prefs.strength,
        therapist: prefs.therapist,
        notes: prefs.notes,
      });
    }
    onClose();
  };

  const handleSkipCustom = () => {
    onClose();
  };

  const totalForGroupVND = selections.reduce((sum, s) => sum + s.priceVND * s.quantity, 0);
  const totalForGroupUSD = selections.reduce((sum, s) => sum + s.priceUSD * s.quantity, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-center p-0 lg:p-4">
        {/* Overlay */}
        <motion.div
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Content Sheet / Modal */}
        <motion.div
          variants={typeof window !== 'undefined' && window.innerWidth >= 1024 ? modalVariants : sheetVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-h-[85dvh] lg:max-w-xl bg-[#0D0D0D] border-t lg:border border-white/10 rounded-t-[2.5rem] lg:rounded-[2rem] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col"
        >
          {/* Header Image with Close Button */}
          <div className="relative w-full h-48 sm:h-56 lg:h-64 flex-shrink-0">
            <Image
              src={getServiceImage(group.groupKey)}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 600px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-black/20 to-transparent" />
            
            {/* Close Button (All devices) */}
            <button 
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white transition-all active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Float Handle (Mobile) */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 lg:hidden">
              <div className="w-10 h-1 bg-white/30 rounded-full" />
            </div>
          </div>

          <div className="p-6 sm:p-8 pt-4 lg:pt-6 flex-1 overflow-y-auto custom-scrollbar">
            {/* Header */}
            <div className="mb-6 lg:pr-10">
              <h2 className="text-2xl sm:text-3xl font-serif text-[#F5E6B8] mb-2 leading-tight">
                {name}
              </h2>
              {desc && (
                <p className="text-white/40 text-sm font-light leading-relaxed line-clamp-3">
                  {desc}
                </p>
              )}
            </div>

            {/* Selected Summary (if any) */}
            {selections.length > 0 && (
              <div className="mb-8 p-4 rounded-2xl bg-[#D4AF37]/5 border border-[#D4AF37]/10">
                <p className="text-[#D4AF37]/60 text-[10px] tracking-[0.2em] uppercase font-medium mb-3">
                  {t.sheet.selectedVariants}
                </p>
                <div className="space-y-2">
                  {selections.map(s => (
                    <div key={s.variantId} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                        <span className="text-white/70 text-sm font-light">
                          {s.duration} phút ({s.quantity} suất)
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-white/40 text-xs block">{(s.priceVND * s.quantity).toLocaleString('vi-VN')}đ</span>
                        <span className="text-[#FF3B30]/60 text-[10px] font-bold">{(s.priceUSD * s.quantity)} USD</span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 mt-2 border-t border-[#D4AF37]/10 flex justify-between items-baseline">
                    <span className="text-[#D4AF37] text-xs font-medium uppercase tracking-wider">{t.sheet.total}</span>
                    <div className="text-right">
                      <span className="text-[#D4AF37] text-base font-semibold block">{totalForGroupVND.toLocaleString('vi-VN')}đ</span>
                      <span className="text-[#FF3B30] text-xs font-bold">{totalForGroupUSD} USD</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Duration Grid */}
            <div className="mb-8">
              <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-light mb-4">
                {t.sheet.duration}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {(showAllDurations ? group.variants : group.variants.slice(0, 4)).map((v) => {
                  const isActive = v.id === activeVariantId;
                  
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setActiveVariantId(v.id)}
                      className={`relative p-3 sm:p-4 rounded-2xl text-left transition-all duration-300 border flex flex-col gap-1 ${
                        isActive 
                          ? 'bg-[#D4AF37]/10 border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/20 shadow-[0_0_20px_rgba(212,175,55,0.1)]' 
                          : 'bg-white/[0.03] border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <p className={`text-base sm:text-lg font-medium tracking-tight transition-colors ${isActive ? 'text-[#F5E6B8]' : 'text-white/80'}`}>
                          {v.duration} <span className="text-[10px] sm:text-xs font-light opacity-60">PHÚT</span>
                        </p>
                        {isActive && <Check className="w-3.5 h-3.5 text-[#D4AF37]" strokeWidth={3} />}
                      </div>
                      <div className="flex flex-col">
                        <p className={`text-sm font-semibold transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-[#D4AF37]/60'}`}>
                          {v.priceVND.toLocaleString('vi-VN')}đ
                        </p>
                        <p className={`text-[10px] sm:text-xs font-bold transition-colors ${isActive ? 'text-[#FF3B30]' : 'text-[#FF3B30]/50'}`}>
                          {v.priceUSD} USD
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {group.variants.length > 4 && !showAllDurations && (
                <button
                  type="button"
                  onClick={() => setShowAllDurations(true)}
                  className="w-full mt-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-center gap-2 text-white/40 text-sm font-medium hover:text-white/70 hover:bg-white/[0.05] transition-all"
                >
                  <span className="uppercase tracking-widest text-[10px] pt-0.5">Xem thêm thời lượng</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ═══ STICKY FOOTER: Quantity + Add to Cart (outside scroll area) ═══ */}
          <div className="p-5 pt-3 bg-[#0D0D0D] border-t border-white/10 flex-shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {/* Quantity Tracker */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center gap-6 bg-white/[0.05] border border-white/10 rounded-full p-2 px-6">
                <button 
                  type="button" 
                  onClick={() => setTempQty(Math.max(0, tempQty - 1))}
                  className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <div className="min-w-[40px] text-center">
                  <motion.span 
                    key={tempQty} 
                    initial={{ scale: 1.2 }} 
                    animate={{ scale: 1 }} 
                    className="text-white text-2xl font-bold font-mono inline-block"
                  >
                    {tempQty}
                  </motion.span>
                </div>
                <button 
                  type="button" 
                  onClick={() => setTempQty(Math.min(10, tempQty + 1))}
                  className="w-11 h-11 rounded-full bg-[#D4AF37] flex items-center justify-center text-black hover:brightness-110 transition-colors"
                >
                  <Plus className="w-6 h-6" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Add to Cart / Update Button */}
            <motion.button
              key={pulseKey}
              type="button"
              onClick={handleUpdate}
              disabled={tempQty === currentQty}
              initial={{ scale: 1 }}
              animate={{ scale: [1, PULSE_SCALE, 1] }}
              transition={{ duration: PULSE_DURATION, ease: 'easeInOut' }}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#e4c25f] rounded-xl py-4 sm:py-4 transition-all duration-300 disabled:opacity-40 active:scale-[0.98] shadow-lg flex items-center justify-center gap-2"
            >
              <span className="text-black font-bold text-[17px] tracking-wide uppercase">
                {currentQty > 0 
                  ? (tempQty === 0 ? 'XÓA LUÔN' : t.sheet.update) 
                  : t.sheet.addToBasket
                }
              </span>
              <span className="text-black/40 mx-0.5">|</span>
              <span className="text-black/80 font-bold text-base">
                {(activeVariant.priceVND * tempQty).toLocaleString('vi-VN')}đ
              </span>
              <span className="text-black/40 mx-0.5">/</span>
              <span className="text-[#FF3B30] font-bold text-base">
                {(activeVariant.priceUSD * tempQty)} USD
              </span>
            </motion.button>
          </div>

          {/* Custom for You overlay (Step 2) */}
          <CustomForYouView
            serviceName={name}
            isOpen={viewMode === 'CUSTOM'}
            onClose={handleSkipCustom}
            onSave={handleCustomSave}
            onBack={() => setViewMode('SELECT')}
            showStrength={group.category === 'body' || group.category === 'foot'}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
const FormInput = ({
  label, type = 'text', name, value, onChange, placeholder, required = false, validate,
}: {
  label: string; type?: string; name: string; value: string;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
  placeholder: string; required?: boolean;
  validate?: (v: string) => string | null;
}) => {
  const [touched, setTouched] = React.useState(false);
  const error = touched && validate ? validate(value) : null;
  const isValid = touched && !error && value.length > 0;
  return (
    <div>
      <label className="text-[#D4AF37]/70 text-[10px] tracking-[0.2em] uppercase font-light mb-2 flex items-center gap-1.5">
        {label}
        {required && <span className="text-[#D4AF37]/50">*</span>}
        {isValid && <Check className="w-3 h-3 text-emerald-400/70 ml-auto" strokeWidth={2.5} />}
        {error && <span className="text-rose-400/70 text-[10px] ml-auto font-normal normal-case tracking-normal">{error}</span>}
      </label>
      <input
        type={type} name={name} value={value} onChange={onChange}
        onBlur={() => setTouched(true)} placeholder={placeholder} required={required}
        className={`w-full bg-white/[0.03] ring-1 rounded-xl px-4 py-3.5 text-white/85 text-sm font-light
          placeholder:text-white/15 focus:outline-none focus:bg-white/[0.05] transition-all duration-300
          ${error ? 'ring-rose-400/30 focus:ring-rose-400/50'
            : isValid ? 'ring-emerald-400/20 focus:ring-emerald-400/35'
              : 'ring-white/[0.07] focus:ring-[#D4AF37]/30'}`}
      />
    </div>
  );
};

// ════════════════════════════════════════
// INTENT QUIZ (Curator B — Step 0)
// ════════════════════════════════════════

const IntentQuizSection = ({
  onSelect, onSkip,
}: {
  onSelect: (key: IntentKey) => void;
  onSkip: () => void;
}) => {
  const intents = Object.entries(INTENT_DISPLAY) as [IntentKey, typeof INTENT_DISPLAY[IntentKey]][];
  return (
    <motion.div
      variants={sectionFadeVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center min-h-[60vh] py-12 px-4 text-center"
    >
      {/* Badge */}
      <motion.div custom={0} variants={sectionFadeVariants} className="mb-6">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/25 text-[#D4AF37]/70 text-[10px] tracking-[0.3em] uppercase font-light">
          <Sparkles className="w-3 h-3" />
          {t.badge}
        </span>
      </motion.div>

      <motion.h2
        custom={1}
        variants={sectionFadeVariants}
        className="text-3xl sm:text-4xl font-serif text-white/90 mb-3"
      >
        {t.intent.heading}
      </motion.h2>
      <motion.p custom={2} variants={sectionFadeVariants} className="text-white/35 font-light text-sm mb-10 max-w-sm">
        {t.intent.subheading}
      </motion.p>

      {/* Intent Pills Grid */}
      <motion.div
        variants={intentContainerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 w-full max-w-sm mb-8"
      >
        {intents.map(([key, info]) => (
          <motion.button
            key={key}
            variants={intentItemVariants}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(key)}
            className="group relative overflow-hidden rounded-2xl p-5 text-left transition-all duration-300
              bg-white/[0.03] ring-1 ring-white/[0.08] hover:ring-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.06]"
          >
            <span className="text-3xl mb-2 block">{info.emoji}</span>
            <p className="text-white/80 font-medium text-sm tracking-wide mb-1">{info.labelVi}</p>
            <p className="text-white/30 font-light text-[11px] leading-relaxed">{info.description}</p>
            <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#D4AF37]/0 ring-1 ring-white/15 flex items-center justify-center transition-all duration-300 group-hover:bg-[#D4AF37] group-hover:ring-[#D4AF37]">
              <ArrowRight className="w-2.5 h-2.5 text-white/0 group-hover:text-black transition-colors duration-300" />
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Skip */}
      <motion.button
        custom={3}
        variants={sectionFadeVariants}
        onClick={onSkip}
        className="text-white/30 text-sm font-light hover:text-white/60 transition-colors duration-300 flex items-center gap-2"
      >
        {t.intent.showAll}
        <ArrowRight className="w-3.5 h-3.5" />
      </motion.button>
    </motion.div>
  );
};

// ════════════════════════════════════════
// CATEGORY IMAGE CARD
// ════════════════════════════════════════

// Icon mapping for categories
const CategoryIcon = ({ name, className }: { name: string; className?: string }) => {
  switch (name) {
    case 'Sparkles': return <Sparkles className={className} />;
    case 'UserCircle': return <UserCircle className={className} />;
    case 'Waves': return <Waves className={className} />;
    case 'Scissors': return <Scissors className={className} />;
    case 'Zap': return <Zap className={className} />;
    case 'Wind': return <Wind className={className} />;
    case 'Footprints': return <Footprints className={className} />;
    case 'Hand': return <Hand className={className} />;
    case 'PlusCircle': return <PlusCircle className={className} />;
    default: return <Star className={className} />;
  }
};

const CategoryImageCard = ({
  category, count, isActive, onClick,
}: {
  category: string; count: number; isActive: boolean; onClick: () => void;
}) => {
  const info = getCategoryDisplay(category);
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`relative flex-shrink-0 w-[150px] h-[190px] rounded-2xl overflow-hidden transition-all duration-500 group 
        ${isActive 
          ? 'ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-black scale-95 shadow-[0_0_20px_rgba(212,175,55,0.25)]' 
          : 'ring-1 ring-white/10 hover:ring-white/20'
        }`}
    >
      <Image 
        src={info.image} 
        alt={info.labelVi} 
        fill 
        className={`object-cover transition-transform duration-700 ${isActive ? 'scale-110 blur-[1px]' : 'group-hover:scale-110'}`} 
        sizes="150px"
      />
      <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 ${isActive ? 'opacity-90' : 'opacity-70 group-hover:opacity-50'}`} />

      {/* Selected Indicator / Category Icon */}
      <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-500 
        ${isActive ? 'bg-[#D4AF37] text-black scale-100 rotate-0' : 'bg-black/40 text-[#D4AF37] scale-90 -rotate-12 opacity-0 group-hover:opacity-100'}`}>
        {isActive ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <CategoryIcon name={info.icon} className="w-3.5 h-3.5" />}
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-3.5 text-left trans">
        <div className="flex items-center gap-2 mb-0.5">
          {!isActive && <CategoryIcon name={info.icon} className="w-3 h-3 text-[#D4AF37]/60" />}
          <p className={`text-xs font-semibold tracking-wide uppercase transition-colors ${isActive ? 'text-[#F5E6B8]' : 'text-white/90'}`}>
            {info.labelVi}
          </p>
        </div>
        <p className="text-[10px] text-white/40 font-light tracking-wide">{count} dịch vụ</p>
      </div>
    </motion.button>
  );
};

// ════════════════════════════════════════
// DURATION PICKER
// ════════════════════════════════════════

const DurationPicker = ({
  variants, selectedVariantId, onSelect,
}: {
  variants: DurationVariant[]; selectedVariantId: string | null;
  onSelect: (v: DurationVariant) => void;
}) => {
  if (variants.length <= 1) return null;
  return (
    <motion.div
      variants={durationPickerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-[#D4AF37]/10"
    >
      {variants.map(v => {
        const sel = v.id === selectedVariantId;
        return (
          <button key={v.id} type="button" onClick={e => { e.stopPropagation(); onSelect(v); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-light tracking-wide transition-all duration-200 ${sel
                ? 'bg-[#D4AF37]/20 text-[#F5E6B8] ring-1 ring-[#D4AF37]/40'
                : 'bg-white/[0.03] text-white/35 ring-1 ring-white/[0.06] hover:ring-white/15 hover:text-white/55'
              }`}
          >
            <span className="font-medium">{v.duration}</span>
            <span className="opacity-60">ph</span>
            <span className="mx-1 opacity-20">·</span>
            {v.priceVND.toLocaleString('vi-VN')}đ
          </button>
        );
      })}
    </motion.div>
  );
};

// ════════════════════════════════════════
// SERVICE ROW (inside accordion)
// ════════════════════════════════════════

const ServiceRow = ({
  group, 
  isAnySelected, 
  totalQty, 
  onOpenSheet,
}: {
  group: GroupedService; 
  isAnySelected: boolean; 
  totalQty: number; 
  onOpenSheet: () => void;
}) => {
  const name = getGroupedServiceName(group, 'vi');
  const desc = getGroupedServiceDescription(group, 'vi');
  const minDur = group.variants[0].duration;
  const maxDur = group.variants[group.variants.length - 1].duration;
  const priceMin = group.variants[0].priceVND;
  const hasVariants = group.variants.length > 1;

  return (
    <motion.button
      type="button"
      variants={serviceRowVariants}
      onClick={onOpenSheet}
      className={`w-full group/row relative rounded-2xl overflow-hidden transition-all duration-500 border ${
        isAnySelected 
          ? 'bg-[#D4AF37]/[0.03] border-[#D4AF37]/30 shadow-[0_8px_25px_rgba(212,175,55,0.08)]' 
          : 'bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-4 p-4 text-left">
        {/* Left: Image */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden flex-shrink-0 ring-1 ring-white/10 group-hover/row:ring-[#D4AF37]/30 transition-all">
          <Image
            src={getServiceImage(group.groupKey)}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 group-hover/row:scale-110"
            sizes="(max-width: 640px) 80px, 96px"
          />
          <div className="absolute inset-0 bg-black/10 group-hover/row:bg-transparent transition-colors" />
        </div>

        {/* Center: Info */}
        <div className="flex-1 min-w-0 py-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className={`text-base sm:text-lg font-serif font-semibold tracking-tight transition-colors ${isAnySelected ? 'text-[#F5E6B8]' : 'text-white/90'}`}>
              {name}
            </p>
            {group.isBestSeller && (
              <span className="flex-shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] text-[8px] tracking-wide font-bold uppercase ring-1 ring-[#D4AF37]/30">
                HOT
              </span>
            )}
          </div>
          <div className="flex flex-col items-start gap-1">
            <p className="text-white/40 text-[11px] font-light flex items-center gap-1.5 italic">
              {desc && <span className="line-clamp-1">{desc}</span>}
            </p>
            <p className={`text-sm font-bold tracking-tight mt-1 ${isAnySelected ? 'text-[#D4AF37]' : 'text-[#D4AF37]/80'}`}>
              {priceMin.toLocaleString('vi-VN')}đ
              <span className="mx-1.5 opacity-20 whitespace-normal">|</span>
              <span className="text-[#FF3B30] text-xs">{group.variants[0].priceUSD} USD</span>
            </p>
          </div>
        </div>

        {/* Right: Plus Circle and Badge */}
        <div className="relative flex-shrink-0 ml-2">
          <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center transition-all duration-500 ${
            isAnySelected
              ? 'bg-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-white/[0.05] group-hover/row:bg-[#D4AF37]/20 group-hover/row:ring-1 group-hover/row:ring-[#D4AF37]/40 ring-1 ring-white/10'
          }`}>
            <PlusCircle className={`w-6 h-6 transition-all duration-300 ${isAnySelected ? 'text-black' : 'text-white/20 group-hover/row:text-[#D4AF37]'}`} />
          </div>
          
          {/* Quantity Badge */}
          <AnimatePresence>
            {totalQty > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#FF3B30] border-2 border-black flex items-center justify-center shadow-lg"
              >
                <span className="text-white text-[10px] font-bold">{totalQty}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.button>
  );
};

// ════════════════════════════════════════
// SERVICE ACCORDION
// ════════════════════════════════════════

const ServiceAccordionSection = ({
  category, services, isOpen, onToggle,
  getServiceQuantity, onOpenSheet,
}: {
  category: string; services: GroupedService[]; isOpen: boolean; onToggle: () => void;
  getServiceQuantity: (k: string) => number;
  onOpenSheet: (g: GroupedService) => void;
}) => {
  const info = getCategoryDisplay(category);
  const selectedInCat = services.filter(s => getServiceQuantity(s.groupKey) > 0).length;

  return (
    <div className={`rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'ring-1 ring-[#D4AF37]/25' : 'ring-1 ring-white/[0.06]'
      }`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between p-4 transition-all duration-300 ${isOpen ? 'bg-[#D4AF37]/[0.06]' : 'bg-white/[0.02] hover:bg-white/[0.04]'
          }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl overflow-hidden relative flex-shrink-0">
            <Image src={info.image} alt={info.label} fill className="object-cover" sizes="36px" />
            <div className="absolute inset-0 bg-black/30" />
          </div>
          <div className="text-left">
            <p className={`text-sm font-medium tracking-wide transition-colors ${isOpen ? 'text-[#F5E6B8]' : 'text-white/70'}`}>
              {info.labelVi}
            </p>
            <p className="text-white/30 text-[11px] font-light">{services.length} dịch vụ</p>
          </div>
          {selectedInCat > 0 && (
            <span className="ml-2 bg-[#D4AF37] text-black text-[9px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
              {selectedInCat}
            </span>
          )}
        </div>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${isOpen ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-white/[0.03] text-white/30'
          }`}>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Accordion Content */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            variants={accordionVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            style={{ overflow: 'hidden' }}
          >
            <motion.div
              variants={serviceRowContainerVariants}
              initial="hidden"
              animate="visible"
              className="p-3 sm:p-4 space-y-3 sm:space-y-4"
            >
              {services.map(group => (
                <ServiceRow
                  key={group.groupKey}
                  group={group}
                  isAnySelected={getServiceQuantity(group.groupKey) > 0}
                  totalQty={getServiceQuantity(group.groupKey)}
                  onOpenSheet={() => onOpenSheet(group)}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ════════════════════════════════════════
// FLOATING BASKET
// ════════════════════════════════════════

const FloatingBasket = ({
  serviceCount, totalDuration, totalPriceVND, totalPriceUSD, onContinue, canContinue,
}: {
  serviceCount: number; totalDuration: number; totalPriceVND: number; totalPriceUSD: number;
  onContinue: () => void; canContinue: boolean;
}) => (
  <AnimatePresence>
    {serviceCount > 0 && (
      <motion.div
        variants={floatingBasketVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      >
        <div className="bg-[#1A1A1A] border-t border-[#D4AF37]/30 px-4 py-3 flex items-center gap-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          {/* Count badge */}
          <motion.div
            key={serviceCount}
            initial={{ scale: 1.3 }}
            animate={{ scale: 1 }}
            transition={countBounceTransition}
            className="w-10 h-10 rounded-full bg-[#eab308] flex items-center justify-center flex-shrink-0"
          >
            <span className="text-black font-semibold text-base">{serviceCount}</span>
          </motion.div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-white/90 text-[15px] tracking-wide truncate mb-0.5">
              {serviceCount} {t.basket.services} {totalDuration} {t.basket.minutes}
            </p>
            <div className="flex items-center gap-2">
              <motion.p
                key={totalPriceVND}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-[#eab308] text-[15px] font-bold"
              >
                {totalPriceVND.toLocaleString('vi-VN')}đ
              </motion.p>
              <div className="w-[1px] h-3.5 bg-white/20" />
              <motion.p
                key={totalPriceUSD}
                initial={{ y: -4, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="text-[#FF3B30] text-[13px] font-bold"
              >
                {totalPriceUSD} USD
              </motion.p>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className="flex-shrink-0 rounded-full bg-[#eab308] px-5 py-2 transition-all duration-300 disabled:opacity-40 active:scale-[0.96] flex items-center gap-1.5"
          >
            <span className="text-black font-medium text-[15px]">
              {t.basket.continue}
            </span>
            <ArrowRight className="w-4 h-4 text-black" />
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

// ════════════════════════════════════════
// DESKTOP BOOKING SUMMARY PANEL
// ════════════════════════════════════════

const BookingSummaryPanel = ({
  summary, agreeTerms, onTermsChange, onSubmit, isSubmitting,
}: {
  summary: ReturnType<typeof useBookingForm>['bookingSummary'];
  agreeTerms: boolean;
  onTermsChange: React.ChangeEventHandler<HTMLInputElement>;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
}) => (
  <div className="relative rounded-2xl overflow-hidden">
    <div className="absolute -inset-px bg-gradient-to-b from-[#D4AF37]/20 via-[#D4AF37]/5 to-transparent rounded-2xl" />
    <div className="relative bg-[#0C0C0C]/90 backdrop-blur-xl rounded-2xl p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/15 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
        </div>
        <h3 className="text-white/80 font-serif text-base tracking-wide">{t.summary.title}</h3>
      </div>

      {/* Services List */}
      <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {summary.services.map((svc, idx) => (
          <motion.div
            key={`${svc.groupKey}-${idx}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex justify-between items-start group"
          >
            <div className="min-w-0 pr-4">
              <p className="text-white/80 text-sm font-light truncate group-hover:text-white transition-colors">{svc.name}</p>
              <p className="text-white/25 text-[10px] mt-0.5">{svc.duration} phút × {svc.quantity}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-[#D4AF37]/80 text-sm font-medium">{(svc.priceVND * svc.quantity).toLocaleString('vi-VN')}đ</p>
              <p className="text-[#FF3B30]/60 text-[10px] font-bold">{(svc.priceUSD * svc.quantity)} USD</p>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="space-y-3 pt-6 border-t border-white/[0.06]">
        <div className="flex justify-between text-sm font-light">
          <span className="text-white/30 lowercase tracking-wider">{t.sheet.duration}</span>
          <span className="text-white/70">{summary.totalDuration} {t.basket.minutes}</span>
        </div>
        <div className="flex justify-between items-baseline pt-2">
          <span className="text-[#D4AF37] text-xs font-medium uppercase tracking-[0.2em]">{t.sheet.total}</span>
          <div className="text-right">
            <p className="text-2xl font-serif text-[#D4AF37] leading-none mb-1">
              {summary.totalPriceVND.toLocaleString('vi-VN')}đ
            </p>
            <p className="text-base font-bold text-[#FF3B30]">
              {summary.totalPriceUSD} USD
            </p>
          </div>
        </div>
      </div>

      <GoldDivider />
      
      {/* Terms + Submit */}
      <div className="space-y-4 mt-6">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <div className={`w-4 h-4 rounded transition-all duration-300 flex items-center justify-center ${agreeTerms ? 'bg-[#D4AF37]' : 'ring-1 ring-white/20'}`}>
              <input type="checkbox" name="agreeTerms" checked={agreeTerms} onChange={onTermsChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <Check className={`w-2.5 h-2.5 text-black transition-transform ${agreeTerms ? 'scale-100' : 'scale-0'}`} />
            </div>
          </div>
          <span className="text-white/35 text-[11px] font-light group-hover:text-white/55 transition-colors">
            {t.terms.agree}{' '}
            <span className="text-[#D4AF37]/60 underline underline-offset-2">{t.terms.link}</span>
          </span>
        </label>

        <button type="submit" onClick={onSubmit}
          disabled={isSubmitting || !agreeTerms || summary.services.length === 0}
          className="w-full relative overflow-hidden rounded-xl py-3.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#B8860B] via-[#D4AF37] to-[#E7AA51]" />
          <span className="relative z-10 text-black font-medium text-sm tracking-[0.15em] uppercase">
            {isSubmitting ? t.buttons.processing : `${t.buttons.confirm}${summary.services.length > 0 ? ` (${summary.services.length})` : ''}`}
          </span>
        </button>
      </div>
    </div>
  </div>
);

// ════════════════════════════════════════
// SUCCESS SCREEN
// ════════════════════════════════════════

const SuccessScreen = ({ result }: { result: BookingResult }) => {
  const confettiCount = 12;
  return (
    <section id="booking" className="py-20 px-4 bg-[#080808] min-h-[80vh] flex items-center justify-center relative overflow-hidden">
      {/* Ambient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[radial-gradient(circle,rgba(212,175,55,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-[radial-gradient(circle,rgba(212,175,55,0.04),transparent_65%)] pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Confetti */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: confettiCount }).map((_, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={confettiItemVariants}
              initial="hidden"
              animate="animate"
              className="absolute top-1/4 left-1/2"
              style={{
                width: 8 + (i % 3) * 4,
                height: 8 + (i % 3) * 4,
                borderRadius: i % 2 === 0 ? '50%' : '2px',
                backgroundColor: i % 3 === 0 ? '#D4AF37' : i % 3 === 1 ? '#F5E6B8' : '#E7AA51',
                marginLeft: `${(i % 7 - 3) * 20}px`,
              }}
            />
          ))}
        </div>

        <motion.div variants={successCardVariants} initial="hidden" animate="visible" className="relative rounded-3xl overflow-hidden shadow-2xl shadow-[#D4AF37]/5">
          <div className="absolute -inset-px bg-gradient-to-b from-[#eab308]/20 via-[#eab308]/5 to-transparent rounded-3xl" />
          <div className="relative bg-[#0C0C0C]/95 backdrop-blur-2xl rounded-3xl p-8 border border-white/5">
            {/* Check icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-[#eab308] flex items-center justify-center shadow-[0_0_30px_rgba(234,179,8,0.3)]">
                  <Check className="w-8 h-8 text-black" strokeWidth={3} />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center ring-2 ring-[#0C0C0C]">
                  <Sparkles className="w-3.5 h-3.5 text-[#eab308]" />
                </div>
              </div>
            </div>

            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#eab308]/10 text-[#eab308] text-[10px] tracking-widest uppercase font-medium mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#eab308] animate-pulse" />
                ĐÃ XÁC NHẬN
              </span>
              <h2 className="text-2xl font-serif text-white/90 tracking-wide">{t.success.title}</h2>
              <p className="text-white/40 text-sm font-light mt-2.5 max-w-[280px] mx-auto leading-relaxed">{t.success.subtitle}</p>
            </div>

            {/* Booking Code */}
            <div className="mb-6 px-4 py-3 rounded-2xl border border-white/10 text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/[0.02]" />
              <p className="relative text-white/40 text-[10px] tracking-widest uppercase font-medium mb-1">MÃ ĐẶT LỊCH</p>
              <p className="relative text-[#eab308] text-xl font-mono tracking-widest font-semibold">{result.billCode}</p>
            </div>

            {/* Details */}
            <div className="space-y-1 mb-6 text-[13px] tracking-wide">
              {[
                { label: t.success.customerName, value: result.customerName },
                ...(result.customerPhone ? [{ label: t.success.phone, value: result.customerPhone }] : []),
                { label: t.success.dateTime, value: `${result.date}${result.time ? ` - ${result.time}` : ''}` },
                { label: t.success.branch, value: result.branchName },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2.5 border-b border-white/[0.05]">
                  <span className="text-white/40 font-light">{item.label}</span>
                  <span className="text-white/80 font-medium">{item.value}</span>
                </div>
              ))}
              <div className="flex justify-between py-4 items-center">
                <span className="text-white/40 text-[11px] tracking-widest uppercase font-medium">TỔNG CỘNG</span>
                <span className="text-[#eab308] text-xl font-bold">
                  {result.totalAmount.toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <p className="text-center text-white/30 text-[11px] font-light mb-6 leading-relaxed px-4">{t.success.note}</p>

            <a href="/" className="flex items-center justify-center w-full rounded-full bg-[#eab308] py-4 transition-all active:scale-[0.98]">
              <span className="text-black font-semibold text-[15px] tracking-[0.1em] uppercase">VỀ TRANG CHỦ</span>
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// ════════════════════════════════════════
// MAIN BOOKING FORM COMPONENT
// ════════════════════════════════════════

const BookingForm = () => {
  const {
    groupedByCategory, isLoadingServices, visibleCategories, categories,
    intentFilter, hasPassedIntentScreen, setIntent, skipIntent,
    openCategoryKey, toggleCategory,
    activeServiceForSheet, openServiceSheet, closeServiceSheet,
    formData, handleChange,
    toggleService, updateServiceSelection, changeVariant, updateServiceCustomOptions, isServiceSelected, getServiceQuantity, getSelectedVariantId,
    updateGuests, handleSubmit, isSubmitting, isSuccess, bookingResult,
    currentStep, stepDirection, totalSteps, nextStep, prevStep, goToStep,
    canProceedFromStep, bookingSummary,
  } = useBookingForm();

  const today = new Date().toISOString().split('T')[0];

  // ─ Handle body class for mobile footer overlap ─
  React.useEffect(() => {
    const serviceCount = bookingSummary.services.length;
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const shouldHideWidgets = hasPassedIntentScreen && currentStep === 1 && serviceCount > 0 && isMobile;

    if (shouldHideWidgets) {
      document.body.classList.add('has-floating-basket');
    } else {
      document.body.classList.remove('has-floating-basket');
    }

    if (activeServiceForSheet) {
      document.body.classList.add('has-booking-modal');
    } else {
      document.body.classList.remove('has-booking-modal');
    }

    return () => {
      document.body.classList.remove('has-floating-basket');
      document.body.classList.remove('has-booking-modal');
    };
  }, [bookingSummary.services.length, hasPassedIntentScreen, currentStep, activeServiceForSheet]);

  // ─ Success Screen ─
  if (isSuccess && bookingResult) return <SuccessScreen result={bookingResult} />;
  if (isSuccess) return (
    <section id="booking" className="py-20 px-4 bg-[#080808] min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <Check className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
        <h2 className="text-2xl font-serif text-white/90">{t.success.title}</h2>
        <a href="/" className="mt-4 inline-block text-[#D4AF37]/70 text-sm underline underline-offset-4">{t.success.backHome}</a>
      </div>
    </section>
  );

  // ─ Step 1: Service Selection ─
  const renderServiceSelection = () => (
    <div>
      {/* Category image cards */}
      <div className="mb-5">
        <p className="text-white/35 text-[10px] tracking-[0.2em] uppercase font-light mb-3">Danh mục dịch vụ</p>
        <motion.div
          variants={categoryContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-3 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none' }}
        >
          {visibleCategories.map(cat => (
            <motion.div key={cat} variants={categoryCardItemVariants} className="flex-shrink-0">
              <CategoryImageCard
                category={cat}
                count={groupedByCategory[cat]?.length ?? 0}
                isActive={openCategoryKey === cat}
                onClick={() => toggleCategory(cat)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Intent context badge */}
      {intentFilter && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex items-center mb-6">
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#D4AF37]/15 ring-1 ring-[#D4AF37]/30 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
            <span className="text-[#F5E6B8] text-sm sm:text-base font-medium tracking-wide">
              {INTENT_DISPLAY[intentFilter].emoji} Gợi ý cho "{INTENT_DISPLAY[intentFilter].labelVi}"
            </span>
            <div className="w-[1px] h-3.5 bg-[#D4AF37]/40 mx-0.5" />
            <button 
              type="button" 
              onClick={skipIntent} 
              className="text-[#D4AF37]/70 hover:text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all p-1 rounded-full flex items-center justify-center"
              aria-label="Xóa bộ lọc"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Service accordions OR direct list */}
      {isLoadingServices ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : openCategoryKey ? (
        /* Direct list for selected category */
        <motion.div
          key="selected-category-list"
          variants={serviceRowContainerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-4"
        >
          {(groupedByCategory[openCategoryKey] ?? []).map(group => (
            <ServiceRow
              key={group.groupKey}
              group={group}
              isAnySelected={getServiceQuantity(group.groupKey) > 0}
              totalQty={getServiceQuantity(group.groupKey)}
              onOpenSheet={() => openServiceSheet(group)}
            />
          ))}
        </motion.div>
      ) : (
        /* Accordion list for "Show All" or initial state */
        <div className="space-y-2.5">
          {visibleCategories.map(cat => (
            <ServiceAccordionSection
              key={cat}
              category={cat}
              services={groupedByCategory[cat] ?? []}
              isOpen={openCategoryKey === cat}
              onToggle={() => toggleCategory(cat)}
              getServiceQuantity={getServiceQuantity}
              onOpenSheet={openServiceSheet}
            />
          ))}
        </div>
      )}

      {/* Selected count badge */}
      <AnimatePresence>
        {formData.selectedServices.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-5 text-center pb-24 lg:pb-0"
          >
            <motion.span
              key={formData.selectedServices.length}
              initial={{ scale: 1.2 }} animate={{ scale: 1 }}
              transition={countBounceTransition}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/8 ring-1 ring-[#D4AF37]/20 text-[#D4AF37]/80 text-sm font-light"
            >
              <Check className="w-3 h-3" />
              {formData.selectedServices.length} dịch vụ đã chọn
              <span className="opacity-30">·</span>
              <span className="text-white/40">{bookingSummary.totalPriceVND.toLocaleString('vi-VN')}đ</span>
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // ─ Step 2: Personal Details ─
  const renderPersonalDetails = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center ring-1 ring-[#D4AF37]/30">
          <UserCircle className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-white/90 text-sm tracking-[0.2em] uppercase font-medium">THÔNG TIN</h3>
          <p className="text-white/40 text-[11px] font-light mt-0.5">Điền thông tin của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <FormInput label="HỌ VÀ TÊN" name="name" value={formData.name}
          onChange={handleChange} placeholder="Nhập họ và tên đầy đủ" required
          validate={v => v.trim().length < 2 ? t.validation.nameMin : null} />
        <FormInput label="SỐ ĐIỆN THOẠI" type="tel" name="phone" value={formData.phone}
          onChange={handleChange} placeholder="+84 90 123 4567" required
          validate={v => !PHONE_REGEX.test(v) ? t.validation.phoneInvalid : null} />
        <FormInput label="EMAIL" type="email" name="email" value={formData.email}
          onChange={handleChange} placeholder="example@email.com"
          validate={v => v.length > 0 && !EMAIL_REGEX.test(v) ? t.validation.emailInvalid : null} />
      </div>

      {/* Guests */}
      <div>
        <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-3 flex items-center gap-2">
          <Users className="w-3.5 h-3.5" /> SỐ KHÁCH
        </label>
        <div className="flex items-center gap-5 w-fit">
          <button type="button" onClick={() => updateGuests(-1)}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-white/50 hover:text-white/80 transition-all">
            <Minus className="w-3 h-3" />
          </button>
          <motion.span key={formData.guests} initial={{ scale: 1.2 }} animate={{ scale: 1 }} transition={countBounceTransition}
            className="text-white/90 text-lg font-medium w-6 text-center">{formData.guests}</motion.span>
          <button type="button" onClick={() => updateGuests(1)}
            className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-white/50 hover:border-white/50 hover:text-white/80 transition-all">
            <Plus className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Staff gender */}
      <div>
        <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-3 block">SỞ THÍCH KTV</label>
        <div className="flex gap-3">
          {(['any', 'male', 'female'] as const).map(g => (
            <button key={g} type="button"
              onClick={() => handleChange({ target: { name: 'staffGender', value: g, type: 'text' } } as any)}
              className={`px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${formData.staffGender === g
                  ? 'text-[#eab308] border border-[#eab308] bg-[#eab308]/5'
                  : 'text-white/40 bg-white/[0.03] hover:text-white/70'
                }`}
            >
              {g === 'any' ? 'Không có sở thích' : g === 'male' ? 'Nam' : 'Nữ'}
            </button>
          ))}
        </div>
      </div>

      {/* Note */}
      <div>
        <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-3 block">GHI CHÚ THÊM</label>
        <textarea name="note" value={formData.note}
          onChange={e => handleChange(e as any)} placeholder="Yêu cầu đặc biệt hoặc thông tin cần biết..." rows={3}
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white/80 text-sm font-light
            placeholder:text-white/20 focus:outline-none focus:border-[#D4AF37]/50 transition-all duration-300 resize-none" />
      </div>
    </div>
  );

  // ─ Step 3: Schedule + Confirm ─
  const renderScheduleConfirm = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center ring-1 ring-[#D4AF37]/30">
          <CalendarDays className="w-5 h-5 text-[#D4AF37]" />
        </div>
        <div>
          <h3 className="text-white/90 text-sm tracking-[0.2em] uppercase font-medium">XÁC NHẬN</h3>
          <p className="text-white/40 text-[11px] font-light mt-0.5">Chọn ngày giờ phù hợp</p>
        </div>
      </div>

      {/* Date */}
      <div>
        <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-3 flex items-center gap-2">
          <CalendarDays className="w-3.5 h-3.5" /> NGÀY *
        </label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} min={today} required
          className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3.5 text-white/90 text-[15px] font-medium
            focus:outline-none focus:border-[#D4AF37]/50 transition-all [color-scheme:dark]" />
      </div>

      {/* Time Slots */}
      <div>
        <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-3 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" /> GIỜ *
        </label>
        <div className="grid grid-cols-5 gap-2.5">
          {TIME_SLOTS.map(slot => (
            <button key={slot} type="button"
              onClick={() => handleChange({ target: { name: 'time', value: slot, type: 'text' } } as any)}
              className={`py-2.5 rounded-2xl text-[13px] font-medium tracking-wide transition-all duration-200 ${formData.time === slot
                  ? 'bg-[#eab308]/15 text-[#eab308] border border-[#eab308]/50'
                  : 'bg-white/[0.03] text-white/40 border border-white/5 hover:border-white/20 hover:text-white/70'
                }`}
            >{slot}</button>
          ))}
        </div>
      </div>

      {/* Branch */}
      <div>
        <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-3 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" /> CHI NHÁNH
        </label>
        <div className="space-y-3">
          {BRANCH_LIST.map(branch => (
            <button key={branch.id} type="button"
              onClick={() => handleChange({ target: { name: 'branchId', value: branch.id, type: 'text' } } as any)}
              className={`w-full flex items-start gap-4 p-5 rounded-2xl text-left transition-all duration-200 border relative overflow-hidden ${formData.branchId === branch.id
                  ? 'bg-[#eab308]/5 border-[#eab308]/40'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
                }`}
            >
              <MapPin className={`w-4 h-4 mt-0.5 flex-shrink-0 ${formData.branchId === branch.id ? 'text-[#eab308]' : 'text-white/30'}`} />
              <div className="pr-4">
                <p className={`text-[15px] font-medium ${formData.branchId === branch.id ? 'text-[#F5E6B8]' : 'text-white/70'}`}>{branch.name}</p>
                <p className="text-white/40 text-[13px] font-light mt-1 leading-relaxed">{branch.address}</p>
                <p className="text-white/30 text-[11px] font-medium mt-1 uppercase tracking-wider">{branch.hours}</p>
              </div>
              {formData.branchId === branch.id && (
                <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[#eab308] flex items-center justify-center shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                  <Check className="w-3 h-3 text-black" strokeWidth={3} />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Review summary on mobile */}
      {bookingSummary.services.length > 0 && (
        <div className="lg:hidden mt-2">
          <label className="text-[#D4AF37] text-[11px] tracking-widest uppercase font-medium mb-4 block">TÓM TẮT ĐƠN</label>
          <div className="space-y-4">
            {bookingSummary.services.map(svc => (
              <div key={`${svc.groupKey}-${svc.variantId}`} className="flex flex-col border-b border-white/[0.08] pb-3">
                <div className="flex justify-between items-start mb-0.5">
                  <span className="text-white/90 text-[15px] font-medium pr-4 line-clamp-2">{svc.name}</span>
                  <span className="text-[#eab308] text-[15px] font-semibold whitespace-nowrap">{(svc.priceVND * svc.quantity).toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-white/40 text-[13px] font-light">{svc.duration}m × {svc.quantity}</span>
                  <span className="text-[#FF3B30] text-[13px] font-bold">{(svc.priceUSD * svc.quantity)} USD</span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-5 items-baseline">
            <span className="text-white/80 text-[15px] font-medium">{bookingSummary.totalDuration} phút</span>
            <div className="text-right">
              <span className="text-[#eab308] font-bold text-[22px] block leading-none mb-1.5">{bookingSummary.totalPriceVND.toLocaleString('vi-VN')}đ</span>
              <span className="text-[#FF3B30] font-bold text-[13px]">{bookingSummary.totalPriceUSD} USD</span>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Terms + Submit */}
      <div className="space-y-5 lg:hidden pt-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <div className={`w-[22px] h-[22px] rounded-md transition-all flex items-center justify-center ${formData.agreeTerms ? 'bg-[#eab308]' : 'bg-white/[0.05] border border-white/20'}`}>
              <input type="checkbox" name="agreeTerms" checked={formData.agreeTerms} onChange={handleChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
              <Check className={`w-3.5 h-3.5 text-black transition-transform ${formData.agreeTerms ? 'scale-100' : 'scale-0'}`} strokeWidth={3} />
            </div>
          </div>
          <span className="text-white/50 text-[13px] font-light">
            {t.terms.agree}{' '}
            <span className="text-[#eab308]/80 hover:underline underline-offset-2">{t.terms.link}</span>
          </span>
        </label>

        <button type="submit" onClick={handleSubmit}
          disabled={isSubmitting || !formData.agreeTerms || bookingSummary.services.length === 0}
          className="w-full rounded-full bg-[#eab308] py-3.5 transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center"
        >
          <span className="text-black font-semibold text-[15px] tracking-[0.1em] uppercase">
            {isSubmitting ? t.buttons.processing : 'XÁC NHẬN ĐẶT LỊCH'}
          </span>
        </button>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════

  return (
    <section id="booking" className="py-20 px-4 sm:px-6 bg-[#080808] min-h-screen relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(212,175,55,0.06),transparent_60%)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(212,175,55,0.03),transparent_65%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* ─ INTENT QUIZ (Pre-step) ─ */}
        <AnimatePresence mode="wait">
          {!hasPassedIntentScreen && (
            <motion.div key="intent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
              <IntentQuizSection onSelect={setIntent} onSkip={skipIntent} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─ MAIN BOOKING FORM ─ */}
        <AnimatePresence>
          {hasPassedIntentScreen && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
              {/* Section heading */}
              <div className="text-center mb-8">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 ring-1 ring-[#D4AF37]/25 text-[#D4AF37]/70 text-[10px] tracking-[0.3em] uppercase font-light mb-4">
                  <Sparkles className="w-3 h-3" /> {t.badge}
                </span>
                <h2 className="text-3xl sm:text-4xl font-serif text-white/90 tracking-wide">
                  {t.heading} <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E7AA51] to-[#D4AF37]">{t.headingHighlight}</span>
                </h2>
              </div>

              {/* Step progress */}
              <StepProgress
                current={currentStep}
                total={totalSteps}
              />

              {/* Layout */}
              <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-8 xl:gap-12">
                {/* Left: Steps */}
                <div className="relative overflow-hidden">
                  <AnimatePresence mode="wait" custom={stepDirection}>
                    <motion.div
                      key={currentStep}
                      custom={stepDirection}
                      variants={stepSlideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                    >
                      {currentStep === 1 && renderServiceSelection()}
                      {currentStep === 2 && renderPersonalDetails()}
                      {currentStep === 3 && renderScheduleConfirm()}
                    </motion.div>
                  </AnimatePresence>

                  {/* Step navigation */}
                  <div className="flex items-center gap-3 mt-8 lg:block">
                    {currentStep > 1 && (
                      <button type="button" onClick={prevStep}
                        className="flex items-center gap-2 text-white/35 text-sm font-light hover:text-white/60 transition-colors py-2">
                        <ArrowLeft className="w-4 h-4" />
                        {t.buttons.back}
                      </button>
                    )}

                    {currentStep < totalSteps && (
                      <button type="button" onClick={nextStep}
                        disabled={!canProceedFromStep(currentStep)}
                        className="hidden lg:flex ml-auto items-center gap-2 relative overflow-hidden rounded-xl px-6 py-3 transition-all disabled:opacity-25 disabled:cursor-not-allowed active:scale-[0.98]"
                      >
                        <div className="absolute inset-0 bg-white/[0.06] hover:bg-white/[0.09] transition-colors" />
                        <span className="relative z-10 text-white/70 text-sm font-light flex items-center gap-2">
                          {t.buttons.next}
                          {currentStep === 1 && formData.selectedServices.length > 0 && (
                            <span className="text-[#D4AF37]">({formData.selectedServices.length})</span>
                          )}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Mobile Nav Button (Step 2 Only) */}
                  {currentStep === 2 && (
                    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#D4AF37]/30 px-4 py-3 flex items-center justify-between pb-[max(0.75rem,env(safe-area-inset-bottom))] z-40">
                      <button type="button" onClick={prevStep} className="text-white/60 text-[15px] font-medium flex items-center gap-1.5 px-2">
                        <ArrowLeft className="w-4 h-4" /> Quay lại
                      </button>
                      <button type="button" onClick={nextStep}
                        disabled={!canProceedFromStep(currentStep)}
                        className="rounded-full bg-[#eab308] px-6 py-2 transition-all disabled:opacity-40 active:scale-[0.96] flex items-center gap-1.5"
                      >
                        <span className="text-black font-semibold text-[15px]">Tiếp tục</span>
                        <ArrowRight className="w-4 h-4 text-black" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right: Desktop Booking Summary Panel */}
                <div className="hidden lg:block">
                  <div className="sticky top-8">
                    <BookingSummaryPanel
                      summary={bookingSummary}
                      agreeTerms={formData.agreeTerms}
                      onTermsChange={handleChange}
                      onSubmit={handleSubmit}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating Basket (mobile only) */}
      {hasPassedIntentScreen && currentStep === 1 && (
        <FloatingBasket
          serviceCount={bookingSummary.services.length}
          totalDuration={bookingSummary.totalDuration}
          totalPriceVND={bookingSummary.totalPriceVND}
          totalPriceUSD={bookingSummary.totalPriceUSD}
          onContinue={nextStep}
          canContinue={canProceedFromStep(1)}
        />
      )}

      {/* Service Detail Sheet */}
      <AnimatePresence>
        {activeServiceForSheet && (
          <ServiceDetailSheet
            group={activeServiceForSheet}
            onClose={closeServiceSheet}
            selections={formData.selectedServices.filter(s => s.groupKey === activeServiceForSheet.groupKey)}
            onUpdate={updateServiceSelection}
            onCustomSave={updateServiceCustomOptions}
          />
        )}
      </AnimatePresence>
    </section>
  );
};

export default BookingForm;

