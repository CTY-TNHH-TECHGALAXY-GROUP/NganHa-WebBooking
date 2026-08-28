// VoiceSearch.tsx - AI Voice Search Button with Suggestion Popup
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, X, Sparkles, Clock, ArrowRight } from 'lucide-react';
import { useVoiceSearch, VoiceStatus } from './VoiceSearch.logic';

// 🔧 UI CONFIGURATION
const BUTTON_SIZE = 52;
const PULSE_SCALE = 1.6;
const ANIMATION_DURATION = 0.3;

// Status messages (Vietnamese)
const STATUS_MESSAGES: Record<VoiceStatus, string> = {
  idle: 'Nhấn để nói',
  listening: 'Đang nghe...',
  processing: 'Đang xử lý...',
  success: 'Đã tìm thấy!',
  error: 'Không nhận diện được, thử lại nhé',
  unsupported: 'Trình duyệt không hỗ trợ',
};

const VoiceSearch = () => {
  const {
    status,
    transcript,
    suggestions,
    isPopupOpen,
    isSupported,
    startListening,
    stopListening,
    scrollToService,
    closePopup,
  } = useVoiceSearch();

  const isListening = status === 'listening';
  const isProcessing = status === 'processing';

  const handleClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) return null;

  return (
    <>
      {/* Voice Search FAB Button */}
      <div className="voice-search-wrapper">
        {/* Pulse rings when listening */}
        <AnimatePresence>
          {isListening && (
            <>
              <motion.div
                className="voice-pulse-ring"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: PULSE_SCALE, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
              />
              <motion.div
                className="voice-pulse-ring"
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: PULSE_SCALE * 0.8, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Main Mic Button */}
        <motion.button
          className={`voice-search-btn ${isListening ? 'voice-listening' : ''} ${status === 'error' ? 'voice-error' : ''}`}
          onClick={handleClick}
          whileTap={{ scale: 0.9 }}
          animate={isProcessing ? { rotate: [0, 5, -5, 0] } : {}}
          transition={isProcessing ? { duration: 0.5, repeat: Infinity } : {}}
          style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          aria-label="Voice Search"
          id="voice-search-button"
        >
          {isListening ? <MicOff size={22} /> : <Mic size={22} />}
        </motion.button>

        {/* Status Label */}
        <AnimatePresence>
          {status !== 'idle' && (
            <motion.div
              className="voice-status-label"
              initial={{ opacity: 0, x: 10, scale: 0.8 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 10, scale: 0.8 }}
              transition={{ duration: ANIMATION_DURATION }}
            >
              <span className="voice-status-text">{STATUS_MESSAGES[status]}</span>
              {transcript && (
                <span className="voice-transcript">&quot;{transcript}&quot;</span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion Popup Overlay */}
      <AnimatePresence>
        {isPopupOpen && suggestions.length > 0 && (
          <motion.div
            className="voice-popup-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePopup}
          >
            <motion.div
              className="voice-popup"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Popup Header */}
              <div className="voice-popup-header">
                <div className="voice-popup-title-group">
                  <Sparkles size={20} className="voice-popup-icon" />
                  <div>
                    <h3 className="voice-popup-title">Gợi ý cho bạn</h3>
                    <p className="voice-popup-subtitle">
                      Dựa trên: &quot;{transcript}&quot;
                    </p>
                  </div>
                </div>
                <button
                  className="voice-popup-close"
                  onClick={closePopup}
                  aria-label="Close suggestions"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Suggestion Cards */}
              <div className="voice-popup-list">
                {suggestions.map((suggestion, index) => (
                  <motion.button
                    key={suggestion.id}
                    className="voice-suggestion-card"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                    onClick={() => scrollToService(suggestion.id)}
                  >
                    <div className="suggestion-card-content">
                      <div className="suggestion-card-info">
                        <h4 className="suggestion-card-name">{suggestion.nameVi}</h4>
                        <p className="suggestion-card-name-en">{suggestion.name}</p>
                        <p className="suggestion-card-desc">{suggestion.description}</p>
                        <div className="suggestion-card-keywords">
                          {suggestion.matchedKeywords.slice(0, 3).map((kw) => (
                            <span key={kw} className="suggestion-keyword-tag">
                              {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="suggestion-card-action">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                    {/* Confidence bar */}
                    <div className="suggestion-confidence-bar">
                      <motion.div
                        className="suggestion-confidence-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${suggestion.confidence * 100}%` }}
                        transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceSearch;
