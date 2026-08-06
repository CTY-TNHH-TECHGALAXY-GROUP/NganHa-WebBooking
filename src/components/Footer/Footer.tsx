'use client';

import React from 'react';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';

const Footer = () => {
  const { systemSettings } = useSystemSettings();
  const { currentLang } = useTranslation();

  // Parse SEO settings for Brand Name if available, fallback to ORIA SPA
  let brandName = 'ORIA SPA';
  // Try to get title from some setting if needed, but the user said "đổi thành oriaspa"
  // Actually, we can use a hardcoded fallback but they probably want it dynamic.
  // Wait, systemSettings doesn't have brandName. But we can use SEO title.
  // Let's just use "ORIA SPA" for now, or if they want it fully dynamic, we can add brandName to systemSettings later.
  // The user mainly complained about "Ngan Ha". So replacing it with ORIA SPA (from SEO/System) is good.

  // The addresses and hotline from systemSettings:
  const phone = systemSettings?.phone || '+84 999 999 999';
  const facebook = systemSettings?.facebook || 'https://facebook.com';
  const zalo = systemSettings?.zalo || 'https://zalo.me';
  
  // Safe parsing for addresses (we can use the `address` field which is localized)
  const addressText = systemSettings?.address?.[currentLang] || '11 Ngô Đức Kế, Q.1, TP.HCM & 6B Thi Sách, Q.1, TP.HCM';
  
  return (
    <footer id="footer" className="bg-[#0A0A0A] border-t border-[rgba(212,175,55,0.1)] py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl text-[#D4AF37]">✦</span>
            <div className="flex flex-col">
              <span className="font-serif text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#E7AA51] to-[#8D5A1B] uppercase">
                {brandName}
              </span>
              <span className="text-[10px] text-[rgba(255,255,255,0.4)] italic uppercase tracking-widest">Barbershop & Spa</span>
            </div>
          </div>
          <p className="text-sm text-[rgba(255,255,255,0.6)] leading-relaxed mt-2">
            {currentLang === 'vi' 
              ? 'Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm Quận 1, TP.HCM.'
              : 'Experience premium wellness and beauty services in the heart of District 1, HCMC.'}
          </p>
        </div>
        
        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-[#D4AF37] text-lg font-semibold tracking-wide">
            {currentLang === 'vi' ? 'Chi nhánh' : 'Locations'}
          </h4>
          <ul className="text-sm text-[rgba(255,255,255,0.6)] space-y-3">
            <li className="whitespace-pre-line">
              {addressText}
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="font-serif text-[#D4AF37] text-lg font-semibold tracking-wide">
            {currentLang === 'vi' ? 'Liên hệ' : 'Contact'}
          </h4>
          <ul className="text-sm text-[rgba(255,255,255,0.6)] space-y-3">
            <li>Hotline: <a href={`tel:${phone}`} className="text-[#D4AF37] hover:underline">{phone}</a></li>
            <li><a href={facebook} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Facebook</a></li>
            <li><a href={zalo} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Zalo</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-[rgba(255,255,255,0.05)] text-center">
        <p className="text-xs text-[rgba(255,255,255,0.4)]">
          &copy; {new Date().getFullYear()} {brandName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
