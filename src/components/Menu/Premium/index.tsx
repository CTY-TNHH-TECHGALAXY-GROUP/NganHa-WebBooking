'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import IntentSelector from './IntentSelector';
import CategorySelector from './CategorySelector';
import StaffSelector from './StaffSelector';
import BookingConfig from './BookingConfig';
import ConfirmationScreen from './ConfirmationScreen';

// =============================================
// 👑 Premium Menu – CELESTIAL State Machine
// Root component for the VIP Booking Flow
// =============================================

interface PremiumMenuProps {
  lang: string;
  onBack: () => void;
  onCheckout: () => void;
}

type MenuStep = 'INTENT' | 'CATEGORY' | 'STAFF' | 'BOOKING_CONFIG' | 'CONFIRMATION';

const PremiumMenu = ({ lang, onBack, onCheckout }: PremiumMenuProps) => {
  const isVi = lang === 'vi';
  const [step, setStep] = useState<MenuStep>('INTENT');

  // Flow state
  const [intent, setIntent] = useState<'service_led' | 'staff_led' | null>(null);
  const [preferredCategory, setPreferredCategory] = useState<string | undefined>();
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [selectedSkillsMap, setSelectedSkillsMap] = useState<Record<string, string[]>>({});
  const [totalDuration, setTotalDuration] = useState<number>(0);
  const [timeSlot, setTimeSlot] = useState<string | null>(null);

  const handleBack = () => {
    switch (step) {
      case 'INTENT': onBack(); break;
      case 'CATEGORY': setStep('INTENT'); break;
      case 'STAFF': setStep(intent === 'service_led' ? 'CATEGORY' : 'INTENT'); break;
      case 'BOOKING_CONFIG': setStep('STAFF'); break;
      case 'CONFIRMATION': setStep('BOOKING_CONFIG'); break;
    }
  };

  // Progress percentage for the top bar
  const progressWidth = () => {
    switch (step) {
      case 'INTENT': return '10%';
      case 'CATEGORY': return '30%';
      case 'STAFF': return '50%';
      case 'BOOKING_CONFIG': return '75%';
      case 'CONFIRMATION': return '100%';
    }
  };

  return (
    <div className="w-full h-full bg-[#131315] text-[#e4e2e4] flex flex-col relative overflow-hidden">
      {/* Progress Bar (top edge) */}
      <div className="absolute top-0 left-0 h-[2px] bg-[#1b1b1d] w-full z-30">
        <motion.div
          className="h-full bg-[#e6c487]"
          initial={{ width: '0%' }}
          animate={{ width: progressWidth() }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-20 bg-[#0e0e10]/80 backdrop-blur-xl shadow-[0_0_40px_rgba(201,169,110,0.04)]">
        <div className="flex justify-between items-center px-6 py-3.5">
          <button
            onClick={handleBack}
            className="text-[#e6c487] p-1 hover:bg-white/5 rounded-full transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <h1 className="text-lg font-serif italic tracking-[0.2em] text-[#e6c487]">
            {step === 'CONFIRMATION'
              ? (isVi ? 'XÁC NHẬN DỊCH VỤ' : 'CONFIRM')
              : 'PREMIUM'
            }
          </h1>

          {/* Right spacer */}
          <div className="w-6" />
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {step === 'INTENT' && (
            <motion.div
              key="intent"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <IntentSelector
                lang={lang}
                onSelectIntent={(selectedIntent) => {
                  setIntent(selectedIntent);
                  if (selectedIntent === 'service_led') setStep('CATEGORY');
                  else setStep('STAFF');
                }}
              />
            </motion.div>
          )}

          {step === 'CATEGORY' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <CategorySelector
                lang={lang}
                onSelectCategory={(catId) => {
                  setPreferredCategory(catId);
                  setStep('STAFF');
                }}
              />
            </motion.div>
          )}

          {step === 'STAFF' && (
            <motion.div
              key="staff"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <StaffSelector
                lang={lang}
                preferredCategoryId={preferredCategory}
                onConfirmSelection={(ids) => {
                  setSelectedStaffIds(ids);
                  setStep('BOOKING_CONFIG');
                }}
              />
            </motion.div>
          )}

          {step === 'BOOKING_CONFIG' && (
            <motion.div
              key="booking"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <BookingConfig
                lang={lang}
                selectedStaffIds={selectedStaffIds}
                onConfirm={(data) => {
                  setSelectedSkillsMap(data.skillsMap);
                  setTotalDuration(data.totalDuration);
                  setTimeSlot(data.timeSlot);
                  setStep('CONFIRMATION');
                }}
              />
            </motion.div>
          )}

          {step === 'CONFIRMATION' && (
            <motion.div
              key="confirmation"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.3 }}
            >
              <ConfirmationScreen
                lang={lang}
                selectedStaffIds={selectedStaffIds}
                selectedSkillsMap={selectedSkillsMap}
                totalDuration={totalDuration}
                timeSlot={timeSlot}
                onConfirm={() => {
                  // TODO: Push data to MenuContext/localStorage then redirect
                  onCheckout();
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PremiumMenu;
