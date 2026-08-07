'use client';

import React from 'react';

const GoogleReviewWidget = () => {
  return (
    <a
      href="https://maps.app.goo.gl/voeAkUdz5PL97arp6"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-[990] flex items-center gap-3 px-4 py-2 rounded-md shadow-lg transition-transform hover:-translate-y-1 hover:shadow-xl"
      style={{ backgroundColor: '#FDF8E7', border: '1px solid #E8D399' }}
      aria-label="View our Google Reviews"
    >
      {/* Score */}
      <div className="flex items-baseline gap-1 text-black">
        <span className="text-2xl font-bold leading-none">4.9</span>
        <span className="text-sm font-semibold leading-none">/5</span>
      </div>

      {/* Text Info */}
      <div className="flex flex-col text-black">
        <span className="text-sm font-bold leading-tight">Excellent</span>
        <span className="text-xs text-gray-700 leading-tight">720 reviews</span>
      </div>

    </a>
  );
};

export default GoogleReviewWidget;
