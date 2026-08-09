'use client';

import React from 'react';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import SmartLogo from '@/components/SmartLogo';
import { Lightbulb, Star, Rocket, ThumbsUp, Handshake, Users } from 'lucide-react';

const CORE_VALUES = [
  { icon: Lightbulb, title: 'Innovation And Creativity' },
  { icon: Star, title: 'Guest-Centric Excellence' },
  { icon: Rocket, title: 'Adaptability And Flexibility' },
  { icon: ThumbsUp, title: 'Authenticity And Transparency' },
  { icon: Handshake, title: 'Collaborative Family Spirit' },
  { icon: Users, title: 'Inclusivity And Diversity' },
];

const Footer = () => {
  const { systemSettings } = useSystemSettings();
  const { currentLang } = useTranslation();

  const phone = systemSettings?.phone || '+84964090277';
  const facebook = systemSettings?.facebook || 'https://facebook.com';
  const zalo = systemSettings?.zalo || 'https://zalo.me';
  const addressText = systemSettings?.address?.[currentLang] || '11 Ngô Đức Kế, Q.1, TP.HCM & 6B Thi Sách, Q.1, TP.HCM';
  
  return (
    <footer id="footer" className="bg-[rgba(40,27,21,1)] text-[#f7ebc7] relative z-10">
      {/* Core Values Section */}
      <div className="py-24 px-6 border-b border-[rgba(212,175,55,0.15)] bg-[#1e140f]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl md:text-4xl text-center text-[#D4AF37] mb-16 tracking-widest uppercase">
            Our Core Values
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 text-center">
            {CORE_VALUES.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="flex flex-col items-center gap-6">
                  <div className="w-24 h-24 rounded-full border border-[rgba(212,175,55,0.3)] flex items-center justify-center bg-[rgba(212,175,55,0.02)] hover:bg-[rgba(212,175,55,0.1)] transition-colors duration-300">
                    <Icon size={44} className="text-[#D4AF37]" strokeWidth={1.2} />
                  </div>
                  <h3 className="font-sans text-lg tracking-wider text-[#f7ebc7] font-light uppercase max-w-[200px]">
                    {value.title}
                  </h3>
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
            <p className="text-[15px] text-[#f7ebc7]/60 leading-relaxed font-light">
              {currentLang === 'vi' 
                ? 'Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm Quận 1, TP.HCM.'
                : 'Experience premium wellness and beauty services in the heart of District 1, HCMC.'}
            </p>
          </div>
          
          {/* Locations */}
          <div className="flex flex-col gap-6">
            <h4 className="font-serif text-[#D4AF37] text-xl tracking-wider uppercase">
              {currentLang === 'vi' ? 'Chi nhánh' : 'Locations'}
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
              {currentLang === 'vi' ? 'Liên hệ' : 'Contact'}
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
            &copy; {new Date().getFullYear()} TECHGALAXY GROUP. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
