// FloatingWidgets.tsx - Fixed contact buttons (right side) + AI ChatBot
'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOCIAL_LINKS, BRANCHES } from '@/lib/constants';
import AIChatBot from '@/components/AIChatBot/AIChatBot';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import GoogleReviewWidget from '@/components/GoogleReviewWidget/GoogleReviewWidget';

const WIDGET_SIZE = 50; 

const FloatingWidgets = () => {
  const { systemSettings } = useSystemSettings();
  const hotlineUrl = systemSettings?.phone ? `tel:${systemSettings.phone}` : SOCIAL_LINKS.HOTLINE;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleChatClick = () => {
    document.getElementById('ai-chat-trigger')?.click();
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[985]"
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[990] flex flex-col items-end justify-end" suppressHydrationWarning={true}>
        {/* Hidden original ChatBot trigger */}
        <AIChatBot hideTrigger={true} />

        {/* Conversation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
              className="flex flex-col gap-4 mb-4 items-end"
            >
              {/* AI Greeting Bubble */}
              <div className="bg-white text-black p-4 rounded-2xl rounded-br-sm shadow-xl max-w-[260px] border border-gray-100 mr-1">
                <p className="text-[15px] leading-relaxed font-medium">Xin chào! Oria Spa có thể giúp gì cho bạn hôm nay? ✨</p>
              </div>

              {/* User Choices */}
              <div className="flex flex-col gap-3 items-end w-full mr-1">
                <a
                  href={hotlineUrl}
                  className="bg-[#D4AF37] text-white px-5 py-3 rounded-2xl rounded-br-sm flex items-center justify-between gap-4 shadow-lg hover:bg-[#c4a133] hover:-translate-y-1 transition-all w-full max-w-[200px]"
                  aria-label="Call hotline"
                >
                  <span className="text-[15px] font-bold tracking-wide">Gọi Hotline</span>
                  <Phone size={18} />
                </a>
                
                <button
                  onClick={handleChatClick}
                  className="bg-black text-white px-5 py-3 rounded-2xl rounded-br-sm flex items-center justify-between gap-4 shadow-lg border border-[#D4AF37]/50 hover:border-[#D4AF37] hover:-translate-y-1 transition-all w-full max-w-[200px]"
                  aria-label="Open chat"
                >
                  <span className="text-[15px] font-bold tracking-wide">Chat với AI</span>
                  <Bot size={18} className="text-[#D4AF37]" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Trigger Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="bg-black text-white border-[3px] border-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform mt-2"
          style={{ width: WIDGET_SIZE, height: WIDGET_SIZE }}
          aria-label="Contact Us"
        >
          <AnimatePresence mode="wait">
            {isMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <MessageCircle size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Google Review Widget on Bottom Left */}
      <GoogleReviewWidget />
    </>
  );
};

export default FloatingWidgets;
