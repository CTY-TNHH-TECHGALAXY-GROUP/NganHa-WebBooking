// VoiceSearch.logic.ts - Voice recognition + intelligent service mapping
'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// ═══════════════════════════════════════
// Types
// ═══════════════════════════════════════

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error' | 'unsupported';

export interface ServiceSuggestion {
  id: number;
  name: string;
  nameVi: string;
  description: string;
  matchedKeywords: string[];
  confidence: number; // 0-1
}

// ═══════════════════════════════════════
// Keyword-to-Service Mapping Dictionary
// ═══════════════════════════════════════

interface KeywordMap {
  keywords: string[];
  serviceId: number;
  serviceName: string;
  serviceNameVi: string;
  description: string;
}

const SERVICE_KEYWORD_MAP: KeywordMap[] = [
  {
    serviceId: 1,
    serviceName: 'Ear Clean Package',
    serviceNameVi: 'Gói Lấy Ráy Tai',
    description: 'Ear Cleaning / Head Neck Shoulder / Foot Massage with Herbal Wash',
    keywords: [
      'ear', 'tai', 'ráy', 'ráy tai', 'lấy ráy', 'ear clean', 'ear wax',
      'nghe', 'lỗ tai', 'vệ sinh tai',
    ],
  },
  {
    serviceId: 2,
    serviceName: 'Heel Skin Shave Package',
    serviceNameVi: 'Gói Cạo Da Gót Chân',
    description: 'Heel Skin Shave / Foot Massage with Herbal Wash',
    keywords: [
      'heel', 'gót', 'gót chân', 'cạo da', 'cạo gót', 'da chân', 'nứt gót',
      'heel shave', 'foot skin', 'da gót',
    ],
  },
  {
    serviceId: 3,
    serviceName: 'Hair Wash Package',
    serviceNameVi: 'Gói Gội Đầu Dưỡng Sinh',
    description: 'Hair Wash / Head Neck Shoulder / Body & Foot Massage',
    keywords: [
      'hair', 'tóc', 'gội', 'gội đầu', 'dưỡng sinh', 'đầu', 'hair wash',
      'shampoo', 'head', 'body', 'toàn thân', 'massage toàn thân',
      'vai', 'vai gáy', 'cổ', 'cổ vai', 'mỏi vai', 'đau cổ', 'đau vai',
      'mỏi lưng', 'lưng', 'shoulder', 'neck', 'foot', 'chân', 'massage chân',
      'mỏi chân', 'đau chân',
    ],
  },
  {
    serviceId: 4,
    serviceName: 'Facial Package',
    serviceNameVi: 'Gói Chăm Sóc Da Mặt',
    description: 'Facial / Shave / Head Neck Shoulder / Quick Hair Wash / Body & Foot Massage',
    keywords: [
      'facial', 'face', 'mặt', 'da mặt', 'chăm sóc da', 'skincare', 'skin',
      'da', 'mụn', 'trị mụn', 'dưỡng da', 'làm đẹp', 'beauty',
      'cạo mặt', 'shave', 'mặt nạ', 'mask',
    ],
  },
  {
    serviceId: 5,
    serviceName: 'Barbershop Package',
    serviceNameVi: 'Gói Barbershop',
    description: 'Beard Shave / Nail Cut / Body Massage / Ear Clean / Heel Shave / Hair Wash / Face Mask',
    keywords: [
      'barbershop', 'barber', 'râu', 'cạo râu', 'beard', 'móng', 'cắt móng',
      'nail', 'đắp mặt nạ', 'full', 'trọn gói', 'combo', 'tất cả',
      'all', 'package', 'vip', 'premium', 'full service',
    ],
  },
];

// ═══════════════════════════════════════
// Intelligent Matching Logic
// ═══════════════════════════════════════

const findMatchingServices = (transcript: string): ServiceSuggestion[] => {
  const normalizedText = transcript.toLowerCase().trim();
  const results: ServiceSuggestion[] = [];

  for (const service of SERVICE_KEYWORD_MAP) {
    const matchedKeywords: string[] = [];
    let totalScore = 0;

    for (const keyword of service.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        // Longer keyword matches get higher scores
        totalScore += keyword.length;
      }
    }

    if (matchedKeywords.length > 0) {
      // Normalize confidence: more matched keywords = higher confidence
      const confidence = Math.min(totalScore / 20, 1);

      results.push({
        id: service.serviceId,
        name: service.serviceName,
        nameVi: service.serviceNameVi,
        description: service.description,
        matchedKeywords,
        confidence,
      });
    }
  }

  // Sort by confidence (highest first)
  return results.sort((a, b) => b.confidence - a.confidence);
};

// ═══════════════════════════════════════
// Custom Hook: useVoiceSearch
// ═══════════════════════════════════════

export const useVoiceSearch = () => {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [suggestions, setSuggestions] = useState<ServiceSuggestion[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Check browser support on client only (avoid hydration mismatch)
  useEffect(() => {
    const supported =
      'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    setIsSupported(supported);
  }, []);

  // Initialize SpeechRecognition
  const getRecognition = useCallback(() => {
    if (!isSupported) return null;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = 'vi-VN'; // Default Vietnamese
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    return recognition;
  }, [isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setStatus('unsupported');
      return;
    }

    const recognition = getRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setTranscript('');
    setSuggestions([]);
    setStatus('listening');

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setStatus('processing');

      // Find matching services
      const matched = findMatchingServices(result);
      setSuggestions(matched);

      if (matched.length > 0) {
        setStatus('success');
        setIsPopupOpen(true);

        // If only 1 match with high confidence, auto-navigate
        if (matched.length === 1 && matched[0].confidence > 0.5) {
          scrollToService(matched[0].id);
        }
      } else {
        setStatus('error');
        // Auto-reset after showing error
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      }
    };

    recognition.onerror = () => {
      setStatus('error');
      setTimeout(() => {
        setStatus('idle');
      }, 3000);
    };

    recognition.onend = () => {
      if (status === 'listening') {
        setStatus('idle');
      }
    };

    recognition.start();
  }, [isSupported, getRecognition, status]);

  // Stop listening
  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setStatus('idle');
  }, []);

  // Navigate to service section
  const scrollToService = useCallback((serviceId: number) => {
    const servicesSection = document.getElementById('services');
    if (servicesSection) {
      servicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setIsPopupOpen(false);
  }, []);

  // Close popup
  const closePopup = useCallback(() => {
    setIsPopupOpen(false);
    setStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  return {
    status,
    transcript,
    suggestions,
    isPopupOpen,
    isSupported,
    startListening,
    stopListening,
    scrollToService,
    closePopup,
  };
};
