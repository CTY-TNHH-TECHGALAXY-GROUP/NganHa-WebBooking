'use client';

import { ReactNode, useEffect, useState } from 'react';
import SmartLogo from '@/components/SmartLogo/SmartLogo';
import styles from './MenuIntroGate.module.css';

type IntroPhase = 'visible' | 'leaving' | 'hidden';

interface MenuIntroGateProps {
  children: ReactNode;
  className?: string;
  durationMs?: number;
}

const DEFAULT_DURATION_MS = 1450;
const EXIT_DURATION_MS = 640;

const MenuIntroGate = ({
  children,
  className = '',
  durationMs = DEFAULT_DURATION_MS,
}: MenuIntroGateProps) => {
  const [phase, setPhase] = useState<IntroPhase>('visible');

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const introDelay = reduceMotion ? 260 : durationMs;
    const exitDelay = reduceMotion ? 20 : EXIT_DURATION_MS;

    const leaveTimer = window.setTimeout(() => setPhase('leaving'), introDelay);
    const hideTimer = window.setTimeout(() => setPhase('hidden'), introDelay + exitDelay);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(hideTimer);
    };
  }, [durationMs]);

  return (
    <div className={`${styles.shell} ${className}`}>
      {children}
      {phase !== 'hidden' && (
        <div
          className={`${styles.overlay} ${phase === 'leaving' ? styles.leaving : ''}`}
          aria-hidden="true"
        >
          <div className={styles.logoWrap}>
            <SmartLogo theme="dark" className={styles.logo} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuIntroGate;
