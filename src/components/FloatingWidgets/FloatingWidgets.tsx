// FloatingWidgets.tsx - Fixed contact buttons (right side) + WhatsApp, WeChat, KakaoTalk + AI ChatBot Coming Soon
'use client';

import { Z } from '@/lib/zIndex';
import { useEffect, useState } from 'react';
import { Phone, Bot, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SOCIAL_LINKS } from '@/lib/constants';
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

const LABELS: Record<string, {
  call: string;
  whatsapp: string;
  zalo: string;
  wechat: string;
  kakaotalk: string;
  aiChat: string;
  comingSoon: string;
}> = {
  vi: { call: 'Gọi Hotline', whatsapp: 'WhatsApp', zalo: 'Zalo', wechat: 'WeChat', kakaotalk: 'KakaoTalk', aiChat: 'Chat với AI', comingSoon: 'Sắp ra mắt' },
  en: { call: 'Call Hotline', whatsapp: 'WhatsApp', zalo: 'Zalo', wechat: 'WeChat', kakaotalk: 'KakaoTalk', aiChat: 'Chat with AI', comingSoon: 'Coming Soon' },
  cn: { call: '拨打热线', whatsapp: 'WhatsApp', zalo: 'Zalo', wechat: '微信 WeChat', kakaotalk: 'KakaoTalk', aiChat: 'AI 客服', comingSoon: '敬请期待' },
  jp: { call: '電話する', whatsapp: 'WhatsApp', zalo: 'Zalo', wechat: 'WeChat', kakaotalk: 'KakaoTalk', aiChat: 'AI チャット', comingSoon: '近日公開' },
  kr: { call: '전화 걸기', whatsapp: 'WhatsApp', zalo: 'Zalo', wechat: 'WeChat', kakaotalk: '카카오톡', aiChat: 'AI 챗봇', comingSoon: '출시 예정' },
};

const WhatsAppIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0012.04 2m.01 1.67c2.2 0 4.26.86 5.82 2.42a8.23 8.23 0 012.41 5.83c0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 01-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24m4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.01-1.24-.74-.66-1.25-1.48-1.39-1.73-.14-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.3-.23.25-.87.85-.87 2.08s.89 2.42 1.01 2.59c.13.17 1.75 2.68 4.25 3.75.59.26 1.06.41 1.42.52.6.19 1.15.16 1.58.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.17-.47-.29z"/>
  </svg>
);

const WeChatIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8.69 2C4.44 2 1 4.96 1 8.62c0 2.09 1.12 3.96 2.89 5.23L3 17.5l4.02-1.41c.54.12 1.1.18 1.67.18.2 0 .4 0 .6-.02-.32-.82-.5-1.71-.5-2.63 0-4.05 3.75-7.34 8.38-7.34.49 0 .97.04 1.44.11C17.65 3.86 13.52 2 8.69 2zM6.16 5.85a1.18 1.18 0 110 2.36 1.18 1.18 0 010-2.36zm5.06 0a1.18 1.18 0 110 2.36 1.18 1.18 0 010-2.36zm5.4 3.03c-3.79 0-6.86 2.64-6.86 5.9 0 3.26 3.07 5.9 6.86 5.9.52 0 1.02-.05 1.5-.16L21.5 22l-.76-2.93c1.37-1.05 2.26-2.55 2.26-4.25 0-3.26-3.07-5.9-6.86-5.9zm-2.48 2.76a.98.98 0 110 1.96.98.98 0 010-1.96zm4.96 0a.98.98 0 110 1.96.98.98 0 010-1.96z"/>
  </svg>
);

const KakaoTalkIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 3c-5.52 0-10 3.49-10 7.8 0 2.76 1.83 5.19 4.62 6.54l-1.18 4.34c-.1.38.33.68.66.46l5.12-3.38c.26.02.52.04.78.04 5.52 0 10-3.49 10-7.8S17.52 3 12 3z"/>
  </svg>
);

const ZaloIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.48 2 2 6.22 2 11.44c0 3.03 1.51 5.73 3.87 7.43l-.97 3.56c-.08.31.27.56.54.38l4.2-2.77c.76.22 1.55.34 2.36.34 5.52 0 10-4.22 10-9.44C22 6.22 17.52 2 12 2zm1.6 12.8h-4.2a.6.6 0 01-.6-.6v-.3c0-.18.08-.34.22-.45l3.24-2.55H9.4a.6.6 0 01-.6-.6v-.3c0-.33.27-.6.6-.6h3.9c.33 0 .6.27.6.6v.3c0 .18-.08.34-.22.45l-3.24 2.55h2.86c.33 0 .6.27.6.6v.3c0 .33-.27.6-.6.6z"/>
  </svg>
);

const FloatingWidgets = () => {
  const { currentLang } = useTranslation();
  const lang = currentLang || 'vi';
  const labels = LABELS[lang] || LABELS.vi;
  const { systemSettings, getLocalizedText } = useSystemSettings();
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const phone = systemSettings?.phone || '+84964090277';
  const cleanPhone = phone.replace(/\D/g, '');
  const hotlineUrl = phone ? `tel:${phone}` : SOCIAL_LINKS.HOTLINE;
  
  const whatsapp = systemSettings?.whatsapp;
  let whatsappUrl = `https://wa.me/${cleanPhone || '84964090277'}`;
  if (whatsapp && typeof whatsapp === 'string' && whatsapp.trim()) {
    const trimmed = whatsapp.trim();
    if (trimmed.startsWith('http')) {
      if (trimmed.includes('phone=') && !/phone=\d+/.test(trimmed)) {
        whatsappUrl = trimmed.replace('phone=', `phone=${cleanPhone || '84964090277'}`);
      } else {
        whatsappUrl = trimmed;
      }
    } else {
      const digits = trimmed.replace(/\D/g, '');
      whatsappUrl = digits ? `https://wa.me/${digits}` : `https://wa.me/${cleanPhone || '84964090277'}`;
    }
  }

  const zalo = systemSettings?.zalo;
  const cleanZalo = zalo ? zalo.replace(/\D/g, '') : '';
  const zaloUrl = zalo
    ? (zalo.startsWith('http') ? zalo : (cleanZalo ? `https://zalo.me/${cleanZalo}` : `https://zalo.me/${cleanPhone || '0964090277'}`))
    : `https://zalo.me/${cleanPhone || '0964090277'}`;

  const wechat = systemSettings?.wechat;
  const kakaotalk = systemSettings?.kakaotalk;

  const chatGreeting = getLocalizedText(
    systemSettings?.homepage_content?.chat?.greeting,
    lang as any,
    GREETING_TEXT[lang] || GREETING_TEXT.vi
  );

  useEffect(() => {
    const footer = document.getElementById('footer');
    if (!footer || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsFooterVisible(entry.isIntersecting),
      { threshold: 0.02 }
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  const handleAiChatClick = () => {
    const aiComingSoonText: Record<string, string> = {
      vi: '✨ Tính năng Chat với AI đang được nâng cấp và sẽ sớm ra mắt! Quý khách vui lòng liên hệ qua Hotline, WhatsApp hoặc Zalo.',
      en: '✨ AI Assistant is currently under development and coming soon! Please reach us via Hotline, WhatsApp or Zalo.',
      cn: '✨ AI 客服功能正在升级中，敬请期待！如有急事请通过热线、WhatsApp 或微信联系。',
      jp: '✨ AI チャット機能は近日公開予定です！お急ぎの際は電話、WhatsApp、または WeChat にてご連絡ください。',
      kr: '✨ AI 챗봇 기능은 곧 출시될 예정입니다! 문의 사항은 핫라인, WhatsApp 또는 카카오톡으로 연락해 주세요.',
    };
    showToast(aiComingSoonText[lang] || aiComingSoonText.vi);
  };

  const handleWechatClick = () => {
    if (wechat && (wechat.startsWith('http') || wechat.startsWith('weixin'))) {
      window.open(wechat, '_blank');
      return;
    }
    const wechatId = wechat || 'OriaSpa_VN';
    navigator.clipboard?.writeText(wechatId);
    showToast(lang === 'vi' ? `Đã sao chép WeChat ID: ${wechatId}` : `Copied WeChat ID: ${wechatId}`);
  };

  const handleKakaoClick = () => {
    if (kakaotalk && kakaotalk.startsWith('http')) {
      window.open(kakaotalk, '_blank');
      return;
    }
    const kakaoId = kakaotalk || 'OriaSpa';
    navigator.clipboard?.writeText(kakaoId);
    showToast(lang === 'vi' ? `Đã sao chép KakaoTalk ID: ${kakaoId}` : `Copied KakaoTalk ID: ${kakaoId}`);
  };

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-4 md:right-8 bg-[#281b15]/95 border border-[#D4AF37]/50 text-[#f7ebc7] px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md max-w-[320px] pointer-events-auto z-[100] text-sm leading-snug flex items-center gap-3"
          >
            <Sparkles className="text-[#D4AF37] shrink-0" size={18} />
            <div className="flex-1 font-medium">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-[#f7ebc7]/60 hover:text-white shrink-0">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            style={{ zIndex: Z.FLOATING - 5 }}
            onClick={() => setIsMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      <div
        className="fixed bottom-4 md:bottom-6 right-4 md:right-6 floating-widgets flex flex-col items-end justify-end pointer-events-none"
        style={{ zIndex: Z.FLOATING }}
        suppressHydrationWarning={true}
      >
        {/* Hidden original ChatBot trigger */}
        <div className="pointer-events-auto">
          <AIChatBot hideTrigger={true} phone={systemSettings?.phone} />
        </div>

        {/* Floating Greeting Bubble (Visible when menu is closed) */}
        <AnimatePresence>
          {!isMenuOpen && !isFooterVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="relative mb-3 mr-1 bg-[#f7ebc7] text-[#1a1a1a] p-3 sm:p-4 rounded-2xl shadow-xl max-w-[280px] sm:max-w-[350px] cursor-pointer pointer-events-auto after:absolute after:content-[''] after:-bottom-3 after:right-8 after:border-[7px] after:border-transparent after:border-t-[#f7ebc7]"
              onClick={() => setIsMenuOpen(true)}
            >
              <p className="text-[12px] sm:text-[14px] leading-relaxed font-medium whitespace-normal">
                {chatGreeting}
              </p>
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
              className="flex flex-col gap-2.5 mb-3 items-end pointer-events-auto"
            >
              <div className="flex flex-col gap-2 items-end w-full mr-1">
                {/* 1. Gọi Hotline */}
                <a
                  href={hotlineUrl}
                  className="bg-gradient-to-r from-[#D4AF37] to-[#B89628] text-[#1a1510] font-bold px-4 py-2.5 rounded-2xl rounded-br-sm flex items-center justify-between gap-3 shadow-lg hover:brightness-110 hover:-translate-y-0.5 transition-all w-full min-w-[200px] max-w-[225px]"
                  aria-label="Call hotline"
                >
                  <span className="text-[14px] tracking-wide">{labels.call}</span>
                  <Phone size={17} />
                </a>

                {/* 2. WhatsApp */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1c1815] text-white border border-[#25D366]/40 hover:border-[#25D366] hover:bg-[#25D366]/10 px-4 py-2.5 rounded-2xl rounded-br-sm flex items-center justify-between gap-3 shadow-lg hover:-translate-y-0.5 transition-all w-full min-w-[200px] max-w-[225px]"
                  aria-label="WhatsApp"
                >
                  <span className="text-[14px] font-medium tracking-wide">{labels.whatsapp}</span>
                  <WhatsAppIcon size={18} className="text-[#25D366]" />
                </a>

                {/* 3. Zalo */}
                <a
                  href={zaloUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#1c1815] text-white border border-[#0068FF]/40 hover:border-[#0068FF] hover:bg-[#0068FF]/10 px-4 py-2.5 rounded-2xl rounded-br-sm flex items-center justify-between gap-3 shadow-lg hover:-translate-y-0.5 transition-all w-full min-w-[200px] max-w-[225px]"
                  aria-label="Zalo"
                >
                  <span className="text-[14px] font-medium tracking-wide">{labels.zalo}</span>
                  <ZaloIcon size={18} className="text-[#0068FF]" />
                </a>

                {/* 4. WeChat */}
                <button
                  onClick={handleWechatClick}
                  className="bg-[#1c1815] text-white border border-[#07C160]/40 hover:border-[#07C160] hover:bg-[#07C160]/10 px-4 py-2.5 rounded-2xl rounded-br-sm flex items-center justify-between gap-3 shadow-lg hover:-translate-y-0.5 transition-all w-full min-w-[200px] max-w-[225px]"
                  aria-label="WeChat"
                >
                  <span className="text-[14px] font-medium tracking-wide">{labels.wechat}</span>
                  <WeChatIcon size={18} className="text-[#07C160]" />
                </button>

                {/* 5. KakaoTalk */}
                <button
                  onClick={handleKakaoClick}
                  className="bg-[#1c1815] text-white border border-[#FEE500]/40 hover:border-[#FEE500] hover:bg-[#FEE500]/10 px-4 py-2.5 rounded-2xl rounded-br-sm flex items-center justify-between gap-3 shadow-lg hover:-translate-y-0.5 transition-all w-full min-w-[200px] max-w-[225px]"
                  aria-label="KakaoTalk"
                >
                  <span className="text-[14px] font-medium tracking-wide">{labels.kakaotalk}</span>
                  <KakaoTalkIcon size={18} className="text-[#FEE500]" />
                </button>
                
                {/* 6. Chat với AI - COMING SOON */}
                <button
                  onClick={handleAiChatClick}
                  className="bg-[#14100e] text-[#f7ebc7]/80 px-4 py-2.5 rounded-2xl rounded-br-sm flex items-center justify-between gap-2 shadow-lg border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 hover:-translate-y-0.5 transition-all w-full min-w-[200px] max-w-[225px]"
                  aria-label="Open chat"
                >
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span className="text-[14px] font-medium tracking-wide truncate">{labels.aiChat}</span>
                    <span className="text-[9px] bg-[#D4AF37]/20 text-[#f2d58d] border border-[#D4AF37]/50 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider whitespace-nowrap">
                      {labels.comingSoon}
                    </span>
                  </div>
                  <Bot size={17} className="text-[#D4AF37] shrink-0" />
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
                <img src="/images/chatbot-icon.png" alt="Contact & AI Chatbot" className="w-full h-full object-cover" />
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
