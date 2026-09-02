// FloatingWidgets.tsx - Fixed contact buttons (right side) + AI ChatBot
'use client';

import { useState } from 'react';
import { Phone, MessageCircle, Bot, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOCIAL_LINKS, BRANCHES } from '@/lib/constants';
import AIChatBot from '@/components/AIChatBot/AIChatBot';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import GoogleReviewWidget from '@/components/GoogleReviewWidget/GoogleReviewWidget';
import { useTranslation } from '@/components/TranslationProvider';

const WIDGET_SIZE = 50; 

const GREETING_TEXT: Record<string, string> = {
  vi: 'Oria Xin Chào. Đội ngũ của chúng\ntôi sẵn sàng trả lời bạn ngay bây giờ ✨',
  en: 'Hello from Oria. Our team is available to answer you now ✨',
  cn: 'Oria 您好。我们的团队随时为您解答 ✨',
  jp: 'Oriaからこんにちは。スタッフがすぐにお答えします ✨',
  kr: 'Oria 안녕하세요. 저희 팀이 지금 답변해 드릴 수 있습니다 ✨'
};

const FloatingWidgets = () => {
  const { currentLang } = useTranslation();
  const lang = currentLang || 'vi';
  const { systemSettings, getLocalizedText } = useSystemSettings();
  
  const chatGreeting = getLocalizedText(systemSettings?.homepage_content?.chat?.greeting, lang as any, GREETING_TEXT[lang] || GREETING_TEXT.vi);
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

      <div className="fixed bottom-24 md:bottom-6 right-4 md:right-6 z-[990] flex flex-col items-end justify-end pointer-events-none" suppressHydrationWarning={true}>
        {/* Hidden original ChatBot trigger */}
        <div className="pointer-events-auto">
          <AIChatBot hideTrigger={true} phone={systemSettings?.phone} />
        </div>

        {/* Floating Greeting Bubble (Visible when menu is closed) */}
        <AnimatePresence>
          {!isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ delay: 1, duration: 0.4 }}
              className="relative mb-3 mr-1 bg-[#f7ebc7] text-[#1a1a1a] p-4 rounded-2xl shadow-xl max-w-[350px] cursor-pointer pointer-events-auto after:absolute after:content-[''] after:-bottom-3 after:right-8 after:border-[7px] after:border-transparent after:border-t-[#f7ebc7]"
              onClick={() => setIsMenuOpen(true)}
            >
              <p className="text-[14px] leading-relaxed font-medium whitespace-pre-line">{chatGreeting}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95, transformOrigin: 'bottom right' }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, type: "spring", bounce: 0.3 }}
              className="flex flex-col gap-4 mb-4 items-end pointer-events-auto"
            >
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
          className={`rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-transform mt-2 overflow-hidden border-[3px] border-white pointer-events-auto ${isMenuOpen ? 'bg-black text-white' : 'bg-white'}`}
          style={{ width: WIDGET_SIZE + 10, height: WIDGET_SIZE + 10 }}
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
                className="flex items-center justify-center w-full h-full"
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
                className="flex items-center justify-center w-full h-full"
              >
                <img src="/images/chatbot-icon.png" alt="AI Chatbot" className="w-full h-full object-cover" />
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
