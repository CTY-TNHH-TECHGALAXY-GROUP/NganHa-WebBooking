"use client";
import React, { useState, useEffect } from 'react';
import styles from './SplashScreen.module.css';

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

    // Minimum display time for the splash screen
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      sessionStorage.setItem('hasSeenSplash', 'true');
      
      // Remove from DOM after fade animation completes
      setTimeout(() => {
        setIsVisible(false);
      }, 600); // Matches the CSS transition duration
    }, 2000); // 2 seconds display time

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className={`${styles.splashContainer} ${isFadingOut ? styles.fadeOut : ''}`}>
      <div className={styles.logoWrapper}>
        {/* We'll use the existing logo in images directory */}
        <img 
          src="/images/logo_fixed_slogan.png" 
          alt="Oria Spa Logo" 
          className={styles.logo}
        />
      </div>
    </div>
  );
};

export default SplashScreen;
