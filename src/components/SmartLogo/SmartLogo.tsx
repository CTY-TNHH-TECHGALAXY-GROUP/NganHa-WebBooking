'use client';

import React from 'react';

interface SmartLogoProps {
  theme?: 'light' | 'dark';
  className?: string;
  alt?: string;
}

const SmartLogo: React.FC<SmartLogoProps> = ({ theme = 'dark', className = '', alt = 'Oria Spa Logo' }) => {
  return (
    <div className={className} style={{ display: 'inline-block', position: 'relative' }} aria-label={alt}>
      <svg 
        viewBox="0 0 1248 832" 
        width="100%" 
        height="100%" 
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', clipPath: 'inset(2px)' }}
      >
        <defs>
          <filter id="invert-logo-mask">
            {/* Invert colors: White background becomes Black (transparent in mask), Black logo becomes White (opaque in mask) */}
            <feColorMatrix type="matrix" values="
              -1  0  0  0  1
               0 -1  0  0  1
               0  0 -1  0  1
               0  0  0  1  0" />
          </filter>
          <mask id="logo-mask">
            <image 
              href="/images/logo.png?v=3" 
              width="1248" 
              height="832" 
              filter="url(#invert-logo-mask)" 
            />
          </mask>
        </defs>
        {/* Draw a solid rectangle filled with the desired logo color, and apply the mask to cut out the background */}
        <rect 
          width="1248" 
          height="832" 
          fill={theme === 'dark' ? '#f7ebc7' : '#281b15'} 
          mask="url(#logo-mask)" 
        />
      </svg>
    </div>
  );
};

export default SmartLogo;
