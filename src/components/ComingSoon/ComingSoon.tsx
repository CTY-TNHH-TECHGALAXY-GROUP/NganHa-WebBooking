'use client';

import React, { useState, useEffect } from 'react';
import styles from './ComingSoon.module.css';
import { useTranslation } from '@/components/TranslationProvider';

const COMING_SOON_COPY = {
  launching: { vi: 'WE ARE LAUNCHING SOON', en: 'WE ARE LAUNCHING SOON', kr: '곧 출시됩니다' },
  comingSoon: { vi: 'COMING SOON', en: 'COMING SOON', kr: 'COMING SOON' },
  desc: { 
    vi: 'OriaSpa đang chuẩn bị ra mắt. Một trải nghiệm thư giãn và chăm sóc tuyệt vời đang đến gần! Hãy cùng đón chờ! 🤍',
    en: 'OriaSpa is preparing to launch. A wonderful relaxation and care experience is approaching! Stay tuned! 🤍',
    kr: 'OriaSpa가 출시를 준비하고 있습니다. 놀라운 휴식과 힐링 경험이 다가오고 있습니다! 기대해 주세요! 🤍'
  },
  days: { vi: 'NGÀY', en: 'DAYS', kr: '일' },
  hours: { vi: 'GIỜ', en: 'HOURS', kr: '시간' },
  mins: { vi: 'PHÚT', en: 'MINS', kr: '분' },
  secs: { vi: 'GIÂY', en: 'SECS', kr: '초' },
  notify: { 
    vi: 'Đăng ký để nhận thông báo khi OriaSpa chính thức ra mắt!',
    en: 'Subscribe to get notified when OriaSpa officially launches!',
    kr: 'OriaSpa가 공식적으로 출시될 때 알림을 받으려면 구독하세요!'
  },
  placeholder: { vi: 'Nhập email của bạn', en: 'Enter your email', kr: '이메일을 입력하세요' },
  subscribe: { vi: 'ĐĂNG KÝ', en: 'SUBSCRIBE', kr: '구독하기' }
};

const leafIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 12 11 19 11C19 11 12 11 12 20C12 20 12 11 5 11C5 11 12 11 12 2Z" fill="transparent" stroke="#D4AF37" strokeWidth="1.5"/>
    <path d="M12 2C12 2 15 5 15 11C15 11 12 11 12 2Z" fill="#D4AF37"/>
  </svg>
);

const ComingSoon = () => {
  const { currentLang } = useTranslation();
  const lang = (currentLang?.code as 'vi' | 'en' | 'kr') || 'vi';
  
  const [timeLeft, setTimeLeft] = useState({ days: 28, hours: 14, minutes: 36, seconds: 52 });
  const [email, setEmail] = useState('');

  useEffect(() => {
    // Set target date 30 days from now
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);

    const interval = setInterval(() => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(lang === 'vi' ? 'Cảm ơn bạn đã đăng ký!' : 'Thank you for subscribing!');
      setEmail('');
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.overlay}></div>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>{leafIcon}</div>
        <p className={styles.launching}>{COMING_SOON_COPY.launching[lang]}</p>
        <h1 className={styles.title}>{COMING_SOON_COPY.comingSoon[lang]}</h1>
        <div className={styles.divider}>
           <span className={styles.dividerIcon}>{leafIcon}</span>
        </div>
        <p className={styles.desc}>{COMING_SOON_COPY.desc[lang]}</p>

        <div className={styles.countdown}>
          <div className={styles.timeBox}>
            <span className={styles.number}>{String(timeLeft.days).padStart(2, '0')}</span>
            <span className={styles.label}>{COMING_SOON_COPY.days[lang]}</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.timeBox}>
            <span className={styles.number}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className={styles.label}>{COMING_SOON_COPY.hours[lang]}</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.timeBox}>
            <span className={styles.number}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className={styles.label}>{COMING_SOON_COPY.mins[lang]}</span>
          </div>
          <span className={styles.colon}>:</span>
          <div className={styles.timeBox}>
            <span className={styles.number}>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className={styles.label}>{COMING_SOON_COPY.secs[lang]}</span>
          </div>
        </div>

        <div className={styles.subscribeSection}>
          <p className={styles.notify}>{COMING_SOON_COPY.notify[lang]}</p>
          <form className={styles.form} onSubmit={handleSubscribe}>
            <div className={styles.inputWrapper}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.emailIcon}>
                <path d="M4 7.00005L10.2 11.65C11.2667 12.45 12.7333 12.45 13.8 11.65L20 7" stroke="#827C72" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="5" width="18" height="14" rx="2" stroke="#827C72" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <input 
                type="email" 
                placeholder={COMING_SOON_COPY.placeholder[lang]}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit">{COMING_SOON_COPY.subscribe[lang]}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
