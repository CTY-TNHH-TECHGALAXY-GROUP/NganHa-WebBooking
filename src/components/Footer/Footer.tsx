'use client';

import React from 'react';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import SmartLogo from '@/components/SmartLogo';
import { HeartHandshake, Leaf, HeartPulse, Sparkles, Globe, ShieldCheck } from 'lucide-react';

const CORE_VALUES = [
  { icon: HeartHandshake, titleVi: 'TẬN TÂM PHỤNG SỰ', titleEn: 'Guest-Centric Excellence' },
  { icon: Leaf, titleVi: 'THUẦN THIÊN NHIÊN', titleEn: 'Natural Authenticity' },
  { icon: HeartPulse, titleVi: 'LẮNG NGHE & THẤU HIỂU', titleEn: 'Empathetic Understanding' },
  { icon: Sparkles, titleVi: 'BÀN TAY NGHỆ NHÂN', titleEn: "Artisan's Touch" },
  { icon: Globe, titleVi: 'HỘI NHẬP & SÁNG TẠO', titleEn: 'Global Essence & Creative Fusion' },
  { icon: ShieldCheck, titleVi: 'SẠCH KHỎE ĐỒNG HÀNH', titleEn: 'Hygiene & Health Priority' },
];

const Footer = () => {
  const { systemSettings, footerContent, getLocalizedText } = useSystemSettings();
  const { currentLang } = useTranslation();

  const phone = systemSettings?.phone || '+84964090277';
  const facebook = systemSettings?.facebook || 'https://facebook.com';
  const zalo = systemSettings?.zalo || 'https://zalo.me';
  const addressText = systemSettings?.address?.[currentLang] || '11 Ngô Đức Kế, Q.1, TP.HCM & 6B Thi Sách, Q.1, TP.HCM';

  const descText = getLocalizedText(footerContent?.description, currentLang as any, currentLang === 'vi' 
    ? 'Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm Quận 1, TP.HCM.'
    : 'Experience premium wellness and beauty services in the heart of District 1, HCMC.');
  
  const locationsTitle = getLocalizedText(footerContent?.locationsTitle, currentLang as any, currentLang === 'vi' ? 'Chi nhánh' : 'Locations');
  const contactTitle = getLocalizedText(footerContent?.contactTitle, currentLang as any, currentLang === 'vi' ? 'Liên hệ' : 'Contact');
  const copyrightText = footerContent?.copyright || `© ${new Date().getFullYear()} TECHGALAXY GROUP. All rights reserved.`;

  return (
    <footer id="footer" className="bg-[rgba(40,27,21,1)] text-[#f7ebc7] relative z-10">
      {/* Core Values Section */}
      <div className="py-24 px-6 border-b border-[rgba(247,235,199,0.15)] bg-[#4A3B32]">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          <SmartLogo theme="dark" className="w-[160px] md:w-[180px] h-auto object-contain mb-4" />
          <h2 className="font-serif text-3xl md:text-4xl text-center text-[#f7ebc7] mb-16 tracking-wide">
            Giá Trị Cốt Lõi Của Oria Spa | Oria Spa Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 text-center w-full">
            {CORE_VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="flex flex-col items-center gap-5">
                  <div className="w-24 h-24 rounded-full flex items-center justify-center transition-transform hover:scale-105 duration-300">
                    <Icon size={56} className="text-[#f7ebc7]" strokeWidth={1.2} />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="font-sans text-lg md:text-xl font-medium tracking-wide text-[#f7ebc7] uppercase">
                      {value.titleVi}
                    </h3>
                    <p className="font-serif text-base text-[#f7ebc7] italic opacity-80">
                      {value.titleEn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Footer Section */}
      <div className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12">
          {/* Logo & Description */}
          <div className="flex flex-col gap-8 items-start">
            <SmartLogo theme="dark" className="w-[220px] h-auto object-contain" />
            <p className="text-[15px] text-[#f7ebc7]/60 leading-relaxed font-light whitespace-pre-line">
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
              <li className="whitespace-pre-line">
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
            <ul className="text-[15px] text-[#f7ebc7]/70 space-y-4 font-light">
              <li>Hotline: <a href={`tel:${phone}`} className="text-[#D4AF37] hover:text-[#f7ebc7] transition-colors">{phone}</a></li>
              <li><a href={facebook} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37] transition-colors">Facebook</a></li>
              <li><a href={zalo} target="_blank" rel="noreferrer" className="hover:text-[#D4AF37] transition-colors">Zalo</a></li>
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
    </footer>
  );
};

export default Footer;
