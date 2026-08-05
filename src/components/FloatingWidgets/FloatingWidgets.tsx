// FloatingWidgets.tsx - Fixed contact buttons (right side) + AI ChatBot
'use client';

import { MapPin, Phone } from 'lucide-react';
import { SOCIAL_LINKS, BRANCHES } from '@/lib/constants';
import AIChatBot from '@/components/AIChatBot/AIChatBot';
import { useSystemSettings } from '@/components/SystemSettingsProvider';

// 🔧 UI CONFIGURATION
const WIDGET_SIZE = 44; // Touch target >= 44px (mobile-first)
const WIDGET_GAP = 12;

const FloatingWidgets = () => {
  const { systemSettings } = useSystemSettings();
  const mapsUrl = systemSettings?.googleMaps || BRANCHES.BARBERSHOP.googleMaps;
  const hotlineUrl = systemSettings?.phone ? `tel:${systemSettings.phone}` : SOCIAL_LINKS.HOTLINE;

  return (
    <div className="floating-widgets" suppressHydrationWarning={true}>
      {/* AI ChatBot - text + voice chat */}
      <AIChatBot />

      {/* Location - Google Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-btn floating-location"
        aria-label="View on Google Maps"
        style={{ width: WIDGET_SIZE, height: WIDGET_SIZE }}
        suppressHydrationWarning={true}
      >
        <MapPin size={20} />
      </a>

      {/* Hotline */}
      <a
        href={hotlineUrl}
        className="floating-btn floating-phone"
        aria-label="Call hotline"
        style={{ width: WIDGET_SIZE, height: WIDGET_SIZE }}
        suppressHydrationWarning={true}
      >
        <Phone size={20} />
      </a>
    </div>
  );
};

export default FloatingWidgets;
