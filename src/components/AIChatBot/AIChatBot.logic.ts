// AIChatBot.logic.ts - Chat state management, send/receive messages, voice input
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Locale } from '@/types';
import { chatTexts, VOICE_LANG_MAP } from './AIChatBot.i18n';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error' | 'unsupported';

// ═══════════════════════════════════════
// Constants
// ═══════════════════════════════════════

const MAX_HISTORY_MESSAGES = 20;
const GENERATE_ID = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

// ═══════════════════════════════════════
// Custom Hook: useAIChatBot
// ═══════════════════════════════════════

export const useAIChatBot = (locale: Locale = 'vi') => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle');
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const hasGreeted = useRef(false);

  const t = chatTexts[locale];

  // Check voice support on mount
  useEffect(() => {
    const supported =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsVoiceSupported(supported);
  }, []);

  // Auto-scroll to bottom when new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Send greeting when chat opens for the first time
  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      hasGreeted.current = true;
      setMessages([
        {
          id: GENERATE_ID(),
          role: 'assistant',
          content: t.greeting,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [isOpen, t.greeting]);

  // Toggle chat popup
  const toggleChat = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Send message to AI
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      // Add user message
      const userMsg: ChatMessage = {
        id: GENERATE_ID(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputText('');
      setIsLoading(true);

      try {
        // Prepare history for API (last N messages)
        const recentHistory = [...messages, userMsg]
          .slice(-MAX_HISTORY_MESSAGES)
          .map((m) => ({ role: m.role, content: m.content }));

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: trimmed,
            locale,
            history: recentHistory,
          }),
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();

        const aiMsg: ChatMessage = {
          id: GENERATE_ID(),
          role: 'assistant',
          content: data.reply || t.errorMessage,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errorMsg: ChatMessage = {
          id: GENERATE_ID(),
          role: 'assistant',
          content: t.errorMessage,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, locale, isLoading, t.errorMessage],
  );

  // Handle text input submit
  const handleSubmit = useCallback(() => {
    sendMessage(inputText);
  }, [inputText, sendMessage]);

  // Voice input - start listening
  const startVoice = useCallback(() => {
    if (!isVoiceSupported) {
      setVoiceStatus('unsupported');
      return;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionAPI();

    recognition.lang = VOICE_LANG_MAP[locale] || 'vi-VN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognitionRef.current = recognition;
    setVoiceStatus('listening');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      setVoiceStatus('processing');
      // Auto-send the voice transcript
      sendMessage(result);
      setTimeout(() => setVoiceStatus('idle'), 500);
    };

    recognition.onerror = () => {
      setVoiceStatus('error');
      setTimeout(() => setVoiceStatus('idle'), 3000);
    };

    recognition.onend = () => {
      if (voiceStatus === 'listening') {
        setVoiceStatus('idle');
      }
    };

    recognition.start();
  }, [isVoiceSupported, locale, sendMessage, voiceStatus]);

  // Voice input - stop listening
  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceStatus('idle');
  }, []);

  // Scroll to booking section
  const scrollToBooking = useCallback(() => {
    const bookingSection = document.getElementById('booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsOpen(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
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
  };
};
