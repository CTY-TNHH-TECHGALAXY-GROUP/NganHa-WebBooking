'use client';

import React from 'react';

interface SmartLogoProps {
  theme?: 'light' | 'dark';
  className?: string;
  alt?: string;
}

const SmartLogo: React.FC<SmartLogoProps> = ({ theme = 'dark', className = '', alt = 'Oria Spa Logo' }) => {
  return (
    <>
      <svg width="0" height="0" className="hidden absolute">
        <filter id="cream-filter">
          {/* Maps Black to deeper Cream (#e8d08b) and White to pale Cream (#f7ebc7).
              Deeper Cream RGB: 232/255 = 0.910, 208/255 = 0.816, 139/255 = 0.545
              Pale Cream RGB: 247/255 = 0.968, 235/255 = 0.921, 199/255 = 0.780
              R' = R * (0.968 - 0.910) + 0.910 = R * 0.058 + 0.910
              G' = G * (0.921 - 0.816) + 0.816 = G * 0.105 + 0.816
              B' = B * (0.780 - 0.545) + 0.545 = B * 0.235 + 0.545
          */}
          <feColorMatrix
            type="matrix"
            values="
              0.058 0 0 0 0.910
              0 0.105 0 0 0.816
              0 0 0.235 0 0.545
              0 0 0 1 0
            "
          />
        </filter>
      </svg>
      <img
        src="/images/logo_fixed_slogan.png"
        alt={alt}
        className={className}
        style={{ filter: theme === 'dark' ? 'url(#cream-filter)' : 'none' }}
      />
    </>
  );
};

export default SmartLogo;
