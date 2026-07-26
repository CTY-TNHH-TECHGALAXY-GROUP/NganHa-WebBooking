'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, Navigation } from 'lucide-react';
import { BRANCH_LIST } from '@/data/branches';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import { Locale } from '@/lib/constants';

const BranchInfo = () => {
  const { systemSettings, getLocalizedText } = useSystemSettings();
  const { currentLang } = useTranslation();

  // Mảng hiển thị
  const displayBranches = BRANCH_LIST.map((branch, index) => {
    if (index === 0) {
      return {
        ...branch,
        address: systemSettings?.address ? getLocalizedText(systemSettings.address, currentLang as Locale, branch.address) : branch.address,
        googleMaps: systemSettings?.googleMaps || branch.googleMaps,
        hours: systemSettings?.hours || branch.hours,
      };
    }
    return branch;
  });
  return (
    <section id="branches" className="py-24 px-6 bg-[#0E0E0E] relative border-t border-[#D4AF37]/10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.03),transparent_60%)] pointer-events-none" />
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center justify-center gap-3 px-5 py-1.5 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
            <span className="uppercase tracking-[0.2em] text-[#D4AF37] text-xs font-medium">Locations</span>
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-serif text-white tracking-wide"
          >
            Visit <span className="italic text-[#D4AF37]">ORIARETREAT</span>
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {displayBranches.map((branch, i) => (
            <motion.div 
              key={branch.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2, type: "spring", stiffness: 100 }}
              className="p-4 md:p-6 transition-all duration-500 group relative flex flex-col h-full"
            >
              {/* Removed background and border per user request */}
              
              <h3 className="text-2xl font-serif text-white mb-8 group-hover:text-[#D4AF37] transition-colors relative z-10">{branch.name}</h3>
              
              <div className="flex flex-col gap-5 text-white/70 mb-10 flex-1 relative z-10">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                    <MapPin className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span className="pt-2 leading-relaxed">{branch.address}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shrink-0 border border-[#D4AF37]/20">
                    <Clock className="w-4 h-4 text-[#D4AF37]" />
                  </div>
                  <span>Open {branch.hours}</span>
                </div>
              </div>

              <div className="relative z-10">
                <a 
                  href={branch.googleMaps} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent border border-[#D4AF37]/60 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black font-semibold uppercase tracking-widest text-sm px-8 py-3.5 rounded-full transition-all duration-300 shadow-[0_4px_15px_rgba(212,175,55,0.05)] hover:shadow-[0_6px_20px_rgba(212,175,55,0.3)]"
                >
                  <Navigation className="w-4 h-4" />
                  Google Maps
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BranchInfo;
