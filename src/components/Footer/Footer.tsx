'use client';

import React, { useEffect, useState } from 'react';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import SmartLogo from '@/components/SmartLogo';
import { HeartPulse, ShieldCheck, X, Check, Copy } from 'lucide-react';

const WeChatIcon = ({ size = 18, className = "" }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M8.691 2.188C3.891 2.188 0 5.478 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.294.295a.33.33 0 0 0 .166-.046l1.902-1.1c.14-.082.308-.108.468-.073.966.246 1.996.38 3.084.38.309 0 .614-.012.915-.034-.216-.62-.338-1.28-.338-1.967 0-3.662 3.493-6.63 7.8-6.63.262 0 .52.012.775.034C16.924 5.066 13.167 2.188 8.691 2.188zm-2.09 4.204a1.077 1.077 0 1 1 0 2.154 1.077 1.077 0 0 1 0-2.154zm5.18 0a1.077 1.077 0 1 1 0 2.154 1.077 1.077 0 0 1 0-2.154zm4.78 4.717c-3.993 0-7.23 2.74-7.23 6.12 0 1.844.975 3.504 2.503 4.626.115.084.188.217.177.359l-.325 1.234a.247.247 0 0 0 .343.279l1.585-.917a.64.64 0 0 1 .39-.061c.805.205 1.663.317 2.567.317 3.993 0 7.23-2.74 7.23-6.12 0-3.38-3.237-6.12-7.24-6.12zm-2.39 3.505a.898.898 0 1 1 0 1.795.898.898 0 0 1 0-1.795zm4.78 0a.898.898 0 1 1 0 1.795.898.898 0 0 1 0-1.795z" />
  </svg>
);

const CORE_VALUES_SECTION_TITLE: Record<string, string> = {
  vi: 'GIÁ TRỊ CỐT LÕI',
  en: 'OUR CORE VALUES',
  cn: '核心价值',
  jp: '私たちのコアバリュー',
  kr: '핵심 가치'
};

const CORE_VALUES = [
  {
    icon: null,
    imgSrc: '/images/core-values/guest-centric.png',
    title: {
      vi: 'TẬN TÂM PHỤNG SỰ',
      en: 'GUEST-CENTRIC EXCELLENCE',
      cn: '全心服务',
      jp: '真心のおもてなし',
      kr: '정성을 다하는 서비스'
    }
  },
  {
    icon: null,
    imgSrc: '/images/core-values/natural-authenticity.png',
    title: {
      vi: 'THUẦN THIÊN NHIÊN',
      en: 'NATURAL AUTHENTICITY',
      cn: '纯粹自然',
      jp: '純粋な自然の恵み',
      kr: '순수한 자연의 본질'
    }
  },
  {
    icon: HeartPulse,
    imgSrc: null,
    title: {
      vi: 'LẮNG NGHE & THẤU HIỂU',
      en: 'EMPATHETIC UNDERSTANDING',
      cn: '倾听与理解',
      jp: '傾聴と深い理解',
      kr: '경청과 깊은 공감'
    }
  },
  {
    icon: null,
    imgSrc: '/images/core-values/artisans-touch.png',
    title: {
      vi: 'BÀN TAY NGHỆ NHÂN',
      en: "ARTISAN'S TOUCH",
      cn: '匠人手法',
      jp: '匠の手技',
      kr: '장인의 손길'
    }
  },
  {
    icon: null,
    imgSrc: '/images/core-values/global-essence.png',
    title: {
      vi: 'HỘI NHẬP & SÁNG TẠO',
      en: 'GLOBAL ESSENCE & CREATIVE FUSION',
      cn: '融合与创新',
      jp: 'グローバルと創造の融合',
      kr: '융합과 창의적 감각'
    }
  },
  {
    icon: ShieldCheck,
    imgSrc: null,
    title: {
      vi: 'SẠCH KHỎE ĐỒNG HÀNH',
      en: 'HYGIENE & HEALTH PRIORITY',
      cn: '卫生与健康同行',
      jp: '衛生と健康の優先',
      kr: '청결과 건강의 동행'
    }
  },
];

const Footer = () => {
  const { systemSettings: initialSettings, footerContent: initialFooter, getLocalizedText } = useSystemSettings();
  const { currentLang } = useTranslation();

  const [footerData, setFooterData] = useState<any>(initialFooter || {});
  const [settingsData, setSettingsData] = useState<any>(initialSettings || {});

  useEffect(() => {
    if (initialFooter && Object.keys(initialFooter).length > 0) {
      setFooterData(initialFooter);
    }
  }, [initialFooter]);

  useEffect(() => {
    if (initialSettings && Object.keys(initialSettings).length > 0) {
      setSettingsData(initialSettings);
    }
  }, [initialSettings]);

  // Client-side fetch on mount to guarantee fresh real-time data from admin
  useEffect(() => {
    fetch('/api/public/site-content')
      .then(res => res.json())
      .then(data => {
        if (data?.footer_content && Object.keys(data.footer_content).length > 0) {
          setFooterData(data.footer_content);
        }
        if (data?.system_settings && Object.keys(data.system_settings).length > 0) {
          setSettingsData(data.system_settings);
        }
      })
      .catch(() => {});
  }, []);

  const isOnlyPhoneNumber = (val?: string) => {
    if (!val) return false;
    const trimmed = val.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
    const digitsOnly = trimmed.replace(/\D/g, '');
    return digitsOnly.length >= 7 && /^[\s\d+().-]{7,}$/.test(trimmed);
  };

  const phone = footerData?.phone || settingsData?.phone || '+84964090277';
  const cleanPhone = phone.replace(/\D/g, '');
  const phoneDisplay = isOnlyPhoneNumber(phone) ? phone : 'Oria Spa';

  const rawFacebook = footerData?.facebook || settingsData?.facebook;
  let facebookUrl: string = 'https://www.facebook.com/oriaspa.sg';
  if (rawFacebook && typeof rawFacebook === 'string' && rawFacebook.trim()) {
    const trimmed = rawFacebook.trim();
    facebookUrl = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
  }

  const rawInstagram = footerData?.instagram || settingsData?.instagram;
  let instagramUrl: string = 'https://www.instagram.com/oriaspa.sg';
  if (rawInstagram && typeof rawInstagram === 'string' && rawInstagram.trim()) {
    const trimmed = rawInstagram.trim();
    instagramUrl = trimmed.startsWith('http') ? trimmed : (trimmed.startsWith('@') ? `https://instagram.com/${trimmed.slice(1)}` : `https://instagram.com/${trimmed}`);
  }

  const rawTiktok = footerData?.tiktok || settingsData?.tiktok;
  let tiktokUrl: string = 'https://www.tiktok.com/@oriaspa.sg';
  if (rawTiktok && typeof rawTiktok === 'string' && rawTiktok.trim()) {
    const trimmed = rawTiktok.trim();
    tiktokUrl = trimmed.startsWith('http') ? trimmed : (trimmed.startsWith('@') ? `https://tiktok.com/${trimmed}` : `https://tiktok.com/@${trimmed}`);
  }

  const zalo = footerData?.zalo || settingsData?.zalo;
  let zaloUrl: string | undefined = undefined;
  let zaloDisplay = 'Oria Spa';
  if (zalo && typeof zalo === 'string' && zalo.trim()) {
    const trimmed = zalo.trim();
    const cleanZalo = trimmed.replace(/\D/g, '');
    zaloUrl = trimmed.startsWith('http') ? trimmed : (cleanZalo ? `https://zalo.me/${cleanZalo}` : undefined);
    zaloDisplay = isOnlyPhoneNumber(trimmed) ? trimmed : 'Oria Spa';
  }

  const rawWhatsapp = footerData?.whatsapp || settingsData?.whatsapp;
  let whatsappUrl: string | undefined = undefined;
  let whatsappDisplay = 'Oria Spa';
  if (rawWhatsapp && typeof rawWhatsapp === 'string' && rawWhatsapp.trim()) {
    const trimmed = rawWhatsapp.trim();
    if (trimmed.startsWith('http')) {
      if (trimmed.includes('phone=') && !/phone=\d+/.test(trimmed)) {
        whatsappUrl = trimmed.replace('phone=', `phone=${cleanPhone || '84964090277'}`);
      } else {
        whatsappUrl = trimmed;
      }
      whatsappDisplay = 'Oria Spa';
    } else {
      const waDigits = trimmed.replace(/\D/g, '');
      whatsappUrl = waDigits ? `https://wa.me/${waDigits}` : undefined;
      whatsappDisplay = isOnlyPhoneNumber(trimmed) ? trimmed : 'Oria Spa';
    }
  }

  const wechat = footerData?.wechat || settingsData?.wechat || 'oriaspasg';
  const wechatId = (typeof wechat === 'string' && !wechat.startsWith('http') ? wechat.trim() : '') || 'oriaspasg';
  const wechatQr = footerData?.wechatQr || settingsData?.wechatQr || 'https://adzfohfdindovfcpaizb.supabase.co/storage/v1/object/public/media-uploads/marketing/wechat.webp';
  const [isWechatModalOpen, setIsWechatModalOpen] = useState(false);
  const [copiedWechat, setCopiedWechat] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isWechatModalOpen) {
        setIsWechatModalOpen(false);
      }
    };
    if (isWechatModalOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isWechatModalOpen]);

  const rawKakao = footerData?.kakaotalk || settingsData?.kakaotalk;
  let kakaotalkUrl: string | undefined = undefined;
  let kakaotalkDisplay = 'Oria Spa';
  if (rawKakao && typeof rawKakao === 'string' && rawKakao.trim()) {
    const trimmed = rawKakao.trim();
    kakaotalkUrl = trimmed.startsWith('http') ? trimmed : `https://pf.kakao.com/${trimmed}`;
    kakaotalkDisplay = isOnlyPhoneNumber(trimmed) ? trimmed : 'Oria Spa';
  }

  const rawLine = footerData?.line || settingsData?.line;
  let lineUrl: string | undefined = undefined;
  let lineDisplay = 'Oria Spa';
  if (rawLine && typeof rawLine === 'string' && rawLine.trim()) {
    const trimmed = rawLine.trim();
    lineUrl = trimmed.startsWith('http') ? trimmed : `https://line.me/ti/p/~${trimmed}`;
    lineDisplay = isOnlyPhoneNumber(trimmed) ? trimmed : 'Oria Spa';
  }

  // Smart detect: if user entered address in locationsTitle, use it for address
  const isLocationsTitleAnAddress = footerData?.locationsTitle && 
    (typeof footerData.locationsTitle === 'string' 
      ? footerData.locationsTitle.includes('Ngô Đức Kế') || footerData.locationsTitle.includes('HCM') || footerData.locationsTitle.includes('Vietnam')
      : footerData.locationsTitle.vi?.includes('Ngô Đức Kế') || footerData.locationsTitle.en?.includes('Ngo Duc Ke'));

  const rawAddress = footerData?.address || (isLocationsTitleAnAddress ? footerData.locationsTitle : undefined) || settingsData?.address;

  const addressText = getLocalizedText(
    rawAddress,
    currentLang as any,
    typeof rawAddress === 'string' ? rawAddress : (rawAddress?.vi || '11 Ngô Đức Kế, Sài Gòn, Hồ Chí Minh 700000, Vietnam')
  );

  const DEFAULT_DESC: Record<string, string> = {
    vi: 'Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm Quận 1, TP.HCM.',
    en: 'Experience premium wellness and beauty services in the heart of District 1, HCMC.',
    cn: '在胡志明市第一郡中心体验顶级健康与美容护理服务。',
    jp: 'ホーチミン市1区の中心で、最高峰のウェルネス＆ビューティーケアをご体験ください。',
    kr: '호치민 1군 중심에서 프리미엄 웰니스 & 뷰티 케어 서비스를 경험해보세요.',
  };

  const DEFAULT_LOCATIONS: Record<string, string> = {
    vi: 'Chi nhánh',
    en: 'Locations',
    cn: '分店',
    jp: '店舗情報',
    kr: '지점 안내',
  };

  const DEFAULT_CONTACT: Record<string, string> = {
    vi: 'Liên hệ',
    en: 'Contact',
    cn: '联系我们',
    jp: 'お問い合わせ',
    kr: '문의하기',
  };

  const descText = getLocalizedText(
    footerData?.description,
    currentLang as any,
    DEFAULT_DESC[currentLang] || DEFAULT_DESC.en
  );

  const locationsTitle = isLocationsTitleAnAddress
    ? (DEFAULT_LOCATIONS[currentLang] || DEFAULT_LOCATIONS.en)
    : getLocalizedText(footerData?.locationsTitle, currentLang as any, DEFAULT_LOCATIONS[currentLang] || DEFAULT_LOCATIONS.en);

  const contactTitle = getLocalizedText(
    footerData?.contactTitle,
    currentLang as any,
    DEFAULT_CONTACT[currentLang] || DEFAULT_CONTACT.en
  );

  const copyrightText = footerData?.copyright || `© ${new Date().getFullYear()} TECHGALAXY GROUP. All rights reserved.`;

  return (
    <footer id="footer" className="bg-[rgba(40,27,21,1)] text-[#f7ebc7] relative z-10 overflow-x-hidden">
      {/* Core Values Section */}
      <div className="py-12 md:py-24 px-6 border-b border-[rgba(247,235,199,0.15)] bg-transparent">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <h2 className="font-serif text-3xl md:text-4xl text-center text-[#f7ebc7] mb-16 tracking-wide uppercase">
            {CORE_VALUES_SECTION_TITLE[currentLang] || CORE_VALUES_SECTION_TITLE.en}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-8 md:gap-y-16 gap-x-8 text-center w-full">
            {CORE_VALUES.map((value, index) => {
              const Icon = value.icon;
              const itemTitle = (value.title as any)[currentLang] || (value.title as any)['en'] || (value.title as any)['vi'];
              return (
                <div key={index} className="flex flex-col items-center gap-5">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center transition-transform hover:scale-105 duration-300">
                    {value.imgSrc ? (
                      <img 
                        src={value.imgSrc} 
                        alt={itemTitle} 
                        className="w-16 h-16 md:w-20 md:h-20 object-contain"
                        style={{
                          filter: 'brightness(0) saturate(100%) invert(92%) sepia(16%) saturate(444%) hue-rotate(350deg) brightness(101%) contrast(94%)',
                          WebkitFilter: 'brightness(0) saturate(100%) invert(92%) sepia(16%) saturate(444%) hue-rotate(350deg) brightness(101%) contrast(94%)',
                        }}
                      />
                    ) : (
                      Icon && <Icon size={56} className="text-[#f7ebc7]" strokeWidth={1.2} />
                    )}
                  </div>
                  <h3 className="font-sans text-lg md:text-xl font-medium tracking-wide text-[#f7ebc7] uppercase">
                    {itemTitle}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="py-12 md:py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          {/* Logo & Description */}
          <div className="flex flex-col gap-8 items-start">
            <SmartLogo theme="dark" className="w-[220px] h-auto object-contain" />
            <p className="text-[15px] text-[#f7ebc7]/60 leading-relaxed font-light whitespace-pre-line break-words">
              {descText}
            </p>
          </div>
          
          {/* Locations */}
          <div className="flex flex-col gap-6">
            <h4 className="font-serif text-[#D4AF37] text-xl tracking-wider uppercase">
              {locationsTitle}
            </h4>
            <div className="w-12 h-[1px] bg-[rgba(212,175,55,0.3)] mb-2"></div>
            <ul className="text-[15px] text-[#f7ebc7]/70 space-y-4 leading-relaxed font-light">
              <li className="whitespace-pre-line break-words">
                {addressText}
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-6">
            <h4 className="font-serif text-[#D4AF37] text-xl tracking-wider uppercase">
              {contactTitle}
            </h4>
            <div className="w-12 h-[1px] bg-[rgba(212,175,55,0.3)] mb-2"></div>
            <ul className="text-[15px] text-[#f7ebc7]/70 space-y-3 font-light">
              {phone && (
                <li>
                  Hotline: <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">{phoneDisplay}</a>
                </li>
              )}
              {whatsappUrl && (
                <li>
                  WhatsApp: <a href={whatsappUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">{whatsappDisplay}</a>
                </li>
              )}
              {zaloUrl && (
                <li>
                  Zalo: <a href={zaloUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">{zaloDisplay}</a>
                </li>
              )}
              {wechat && (
                <li>
                  WeChat ID: <button
                    type="button"
                    onClick={() => setIsWechatModalOpen(true)}
                    className="text-[#D4AF37] hover:text-[#f7ebc7] hover:underline transition-colors font-medium cursor-pointer"
                    title="Bấm để xem mã QR"
                  >
                    {wechatId}
                  </button>
                </li>
              )}
              {kakaotalkUrl && (
                <li>
                  KakaoTalk: <a href={kakaotalkUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">{kakaotalkDisplay}</a>
                </li>
              )}
              {lineUrl && (
                <li>
                  LINE: <a href={lineUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">{lineDisplay}</a>
                </li>
              )}
              {facebookUrl && (
                <li>
                  Facebook: <a href={facebookUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">Oria Spa</a>
                </li>
              )}
              {instagramUrl && (
                <li>
                  Instagram: <a href={instagramUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">@oriaspa.sg</a>
                </li>
              )}
              {tiktokUrl && (
                <li>
                  TikTok: <a href={tiktokUrl} target="_blank" rel="noreferrer" className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors font-medium">@oriaspa.sg</a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="max-w-6xl mx-auto mt-20 pt-8 border-t border-[rgba(212,175,55,0.15)] text-center">
          <p className="text-xs text-[#f7ebc7]/40 tracking-[0.2em] uppercase">
            {copyrightText}
          </p>
        </div>
      </div>

      {/* WeChat QR Modal */}
      {isWechatModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={(e) => { if (e.target === e.currentTarget) setIsWechatModalOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="WeChat QR Code Modal"
        >
          <div className="relative w-full max-w-sm rounded-3xl bg-[#1e1511] border border-[rgba(212,175,55,0.35)] shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center animate-scale-up">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsWechatModalOpen(false)}
              aria-label="Đóng"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-[#f7ebc7]/60 hover:text-[#f7ebc7] hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* WeChat Header */}
            <div className="w-12 h-12 rounded-2xl bg-[#07C160]/10 border border-[#07C160]/30 flex items-center justify-center text-[#07C160] mb-3">
              <WeChatIcon size={28} />
            </div>
            <h3 className="font-serif text-2xl text-[#f7ebc7] tracking-wide">
              {currentLang === 'vi' ? 'Quét Mã QR WeChat' : currentLang === 'cn' ? '微信扫码' : currentLang === 'jp' ? 'WeChat QRコード' : currentLang === 'kr' ? 'WeChat QR 코드' : 'WeChat QR Code'}
            </h3>
            <p className="text-xs text-[#f7ebc7]/60 mt-1 max-w-xs leading-relaxed">
              {currentLang === 'vi' ? 'Mở WeChat và quét mã này để liên hệ trực tiếp với Oria Spa.' : currentLang === 'cn' ? '打开微信扫描下方二维码与 Oria Spa 取得联系。' : currentLang === 'jp' ? 'WeChatを開き、このQRコードをスキャンしてお問い合わせください。' : currentLang === 'kr' ? 'WeChat을 열고 이 QR 코드를 스캔하여 Oria Spa에 문의하세요.' : 'Open WeChat and scan this QR code to connect with Oria Spa.'}
            </p>

            {/* QR Image Box */}
            <div className="mt-5 p-3 rounded-2xl bg-white shadow-inner flex items-center justify-center">
              <img
                src={wechatQr}
                alt="WeChat QR Code - Oria Spa"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>

            {/* WeChat ID and Copy Button */}
            <div className="mt-5 w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl bg-[rgba(247,235,199,0.05)] border border-[rgba(212,175,55,0.2)]">
              <div className="text-left">
                <span className="block text-[10px] uppercase tracking-wider text-[#f7ebc7]/40">WeChat ID</span>
                <span className="font-mono text-sm font-semibold text-[#D4AF37] select-all">{wechatId}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(wechatId);
                  setCopiedWechat(true);
                  setTimeout(() => setCopiedWechat(false), 2500);
                }}
                className="px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#D4AF37] hover:text-[#281b15] border border-[#D4AF37]/30 text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedWechat ? (
                  <>
                    <Check size={13} />
                    <span>Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Sao chép ID</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

export default Footer;
