'use client';

import React from 'react';

interface SmartLogoProps {
  theme?: 'light' | 'dark';
  className?: string;
  alt?: string;
}

const SmartLogo: React.FC<SmartLogoProps> = ({ theme = 'dark', className = '', alt = 'Oria Spa Logo' }) => {
  return (
    <img
      src="/images/logo_fixed_slogan.png"
      alt={alt}
      className={className}
      style={{
        // For dark theme:
        // 1. invert(1): Black logo -> White, White background -> Black
        // 2. brightness(0.6) + sepia(1): Tint the white logo to brown, black background stays black
        // 3. saturate(1.5) + hue-rotate(-5deg) + brightness(1.25): Adjust brown to cream
        // 4. mixBlendMode: 'screen': Black background becomes transparent
        // For light theme:
        // mixBlendMode: 'multiply': White background becomes transparent, Black logo stays black
        filter: theme === 'dark' 
          ? 'invert(1) brightness(0.6) sepia(1) saturate(1.5) hue-rotate(-5deg) brightness(1.25)' 
          : 'none',
        mixBlendMode: theme === 'dark' ? 'screen' : 'multiply',
        clipPath: 'inset(2px)', // Crops any faint borders in the original image
        pointerEvents: 'none'
      }}
    />
  );
};

export default SmartLogo;
