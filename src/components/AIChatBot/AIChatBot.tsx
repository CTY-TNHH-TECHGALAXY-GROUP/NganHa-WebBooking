// AIChatBot.tsx - AI Chat popup with text + voice input
'use client';

import { Z } from '@/lib/zIndex';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Mic, MicOff, Bot, User, ArrowRight, Sparkles } from 'lucide-react';
import { useAIChatBot } from './AIChatBot.logic';
import {
  popupVariants,
  overlayVariants,
  messageVariants,
  TYPING_DOT_ANIMATION,
  TYPING_DOT_TRANSITION,
  triggerPulseVariants,
} from './AIChatBot.animation';
import { Locale } from '@/types';

// 🔧 UI CONFIGURATION
const TRIGGER_SIZE = 48;
const MAX_INPUT_LENGTH = 500;

interface AIChatBotProps {
  locale?: Locale;
  hideTrigger?: boolean;
  phone?: string;
}

const AIChatBot = ({ locale = 'vi', hideTrigger = false, phone }: AIChatBotProps) => {
  const {
    messages,
    inputText,
    setInputText,
    isOpen,
    isLoading,
    voiceStatus,
    isVoiceSupported,
    messagesEndRef,
    t,
    toggleChat,
    closeChat,
    handleSubmit,
    startVoice,
    stopVoice,
    scrollToBooking,
  } = useAIChatBot(locale);

  const isListening = voiceStatus === 'listening';

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Check if message contains booking suggestion keywords
  const hasBookingSuggestion = (content: string) => {
    const keywords = ['đặt lịch', 'book', '预约', '予約', '예약', 'booking'];
    return keywords.some((kw) => content.toLowerCase().includes(kw));
  };

  return (
    <>
      {/* ═══ TRIGGER BUTTON ═══ */}
      <motion.button
        className={`ai-chat-trigger floating-btn ${isOpen ? 'ai-chat-trigger--active opacity-0 pointer-events-none lg:opacity-100 lg:pointer-events-auto' : ''}`}
        onClick={toggleChat}
        variants={triggerPulseVariants}
        animate={isOpen ? 'idle' : 'pulse'}
        whileTap={{ scale: 0.9 }}
        style={{ width: TRIGGER_SIZE, height: TRIGGER_SIZE, display: hideTrigger ? 'none' : 'flex' }}
        aria-label="AI Chat"
        id="ai-chat-trigger"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* ═══ CHAT POPUP ═══ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile overlay */}
            <motion.div
              className="ai-chat-overlay" style={{ zIndex: Z.FLOATING_CHAT - 1 }}
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeChat}
            />

            {/* Chat window */}
            <motion.div
              className="ai-chat-popup " style={{ zIndex: Z.FLOATING_CHAT }}
              variants={popupVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              id="ai-chat-popup"
            >
              {/* ─── Header ─── */}
              <div className="ai-chat-header">
                <div className="ai-chat-header-info">
                  <div className="ai-chat-avatar">
                    <Sparkles size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="ai-chat-header-title">{t.title}</h3>
                    <div className="ai-chat-header-subtitle flex items-center gap-2 mt-1">
                      <span>{t.subtitle}</span>
                      {phone && (
                        <span className="text-[10px] bg-white/10 border border-white/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                          {phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  className="ai-chat-close-btn"
                  onClick={closeChat}
                  aria-label="Close chat"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              {/* ─── Messages ─── */}
              <div className="ai-chat-messages">
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    className={`ai-chat-bubble ${msg.role === 'user' ? 'ai-chat-bubble--user' : 'ai-chat-bubble--ai'}`}
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="ai-chat-bubble-icon">
                      {msg.role === 'assistant' ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
                    </div>
                    <div className="ai-chat-bubble-content">
                      <p>{msg.content}</p>
                      {/* Book Now button for AI messages with booking mention */}
                      {msg.role === 'assistant' && hasBookingSuggestion(msg.content) && (
                        <button
                          className="ai-chat-book-btn"
                          onClick={scrollToBooking}
                        >
                          <ArrowRight size={14} className="text-white" />
                          {t.bookNow}
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    className="ai-chat-bubble ai-chat-bubble--ai"
                    variants={messageVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="ai-chat-bubble-icon">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="ai-chat-typing">
                      {[0, 1, 2].map((i) => (
                        <motion.span
                          key={i}
                          className="ai-chat-typing-dot"
                          animate={TYPING_DOT_ANIMATION}
                          transition={{ ...TYPING_DOT_TRANSITION, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ─── Input Bar ─── */}
              <div className="ai-chat-input-bar pb-[env(safe-area-inset-bottom)]">
                {/* Voice button */}
                {isVoiceSupported && (
                  <button
                    className={`ai-chat-mic-btn ${isListening ? 'ai-chat-mic-btn--active' : ''}`}
                    onClick={isListening ? stopVoice : startVoice}
                    aria-label={isListening ? 'Stop voice' : 'Start voice'}
                    title={isListening ? t.voiceListening : t.voiceHint}
                  >
                    {isListening ? <MicOff size={18} className="text-white" /> : <Mic size={18} className="text-white" />}
                  </button>
                )}

                {/* Text input */}
                <input
                  type="text"
                  className="ai-chat-input"
                  placeholder={isListening ? t.voiceListening : t.placeholder}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={MAX_INPUT_LENGTH}
                  disabled={isListening}
                  id="ai-chat-input"
                />

                {/* Send button */}
                <button
                  className="ai-chat-send-btn"
                  onClick={handleSubmit}
                  disabled={!inputText.trim() || isLoading}
                  aria-label={t.send}
                >
                  <Send size={16} className="text-white" />
                </button>
              </div>

              {/* ─── Footer ─── */}
              <div className="ai-chat-footer">
                <span>{t.poweredBy}</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AIChatBot;
