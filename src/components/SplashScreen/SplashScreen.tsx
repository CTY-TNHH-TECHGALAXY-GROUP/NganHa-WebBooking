"use client";
import { Z } from '@/lib/zIndex';
import React, { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';
import SmartLogo from '@/components/SmartLogo';

const SplashScreen = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Only show once per session to avoid annoying the user on every navigation
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    
    if (hasSeenSplash) {
      setIsVisible(false);
      return;
    }

    // Keep the welcome moment brief, then always release the page.
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      sessionStorage.setItem('hasSeenSplash', 'true');
      
      // Remove from DOM after fade animation completes
      setTimeout(() => {
        setIsVisible(false);
      }, 450);
    }, 900);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${styles.splashContainer} ${isFadingOut ? styles.fadeOut : ''}`}>
      <div className={styles.logoWrapper}>
        <SmartLogo 
          theme="dark" 
          className={styles.logo}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
