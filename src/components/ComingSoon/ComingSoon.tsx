'use client';

import React, { useState } from 'react';
import styles from './ComingSoon.module.css';
import { useTranslation } from '@/components/TranslationProvider';

type SupportedLang = 'vi' | 'en' | 'cn' | 'jp' | 'kr';

const COMING_SOON_COPY: Record<string, Record<SupportedLang, string>> = {
  launching: { 
    vi: 'CHÚNG TÔI SẮP RA MẮT', 
    en: 'WE ARE LAUNCHING SOON', 
    cn: '即将盛大启幕',
    jp: 'まもなくオープン',
    kr: '곧 출시됩니다' 
  },
  comingSoon: { 
    vi: 'COMING SOON', 
    en: 'COMING SOON', 
    cn: '敬请期待',
    jp: 'COMING SOON',
    kr: 'COMING SOON' 
  },
  desc: { 
    vi: 'OriaSpa đang chuẩn bị ra mắt. Một trải nghiệm thư giãn và chăm sóc tuyệt vời đang đến gần! Hãy cùng đón chờ! 🤍',
    en: 'OriaSpa is preparing to launch. A wonderful relaxation and care experience is approaching! Stay tuned! 🤍',
    cn: 'OriaSpa 正在精心筹备中。一段尊享身心放松与悉心呵护的非凡体验即将开启，敬请期待！🤍',
    jp: 'OriaSpa は現在オープンの準備を進めております。極上の癒やしと贅沢なケア体験をお届けします。どうぞご期待ください！🤍',
    kr: 'OriaSpa가 출시를 준비하고 있습니다. 놀라운 휴식과 힐링 경험이 다가오고 있습니다! 기대해 주세요! 🤍'
  },
  notify: { 
    vi: 'Đăng ký để nhận thông báo khi OriaSpa chính thức ra mắt!',
    en: 'Subscribe to get notified when OriaSpa officially launches!',
    cn: '订阅我们，第一时间获取 OriaSpa 正式上线的通知！',
    jp: '事前登録して、OriaSpa の正式オープン情報をいち早く受け取りましょう！',
    kr: 'OriaSpa가 공식적으로 출시될 때 알림을 받으려면 구독하세요!'
  },
  placeholder: { 
    vi: 'Nhập email của bạn', 
    en: 'Enter your email', 
    cn: '请输入您的电子邮箱',
    jp: 'メールアドレスを入力',
    kr: '이메일을 입력하세요' 
  },
  subscribe: { 
    vi: 'ĐĂNG KÝ', 
    en: 'SUBSCRIBE', 
    cn: '立即订阅',
    jp: '登録する',
    kr: '구독하기' 
  },
  subscribedSuccess: {
    vi: 'Cảm ơn bạn đã đăng ký!',
    en: 'Thank you for subscribing!',
    cn: '感谢您的订阅！',
    jp: 'ご登録ありがとうございます！',
    kr: '구독해 주셔서 감사합니다!'
  }
};

const leafIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 12 11 19 11C19 11 12 11 12 20C12 20 12 11 5 11C5 11 12 11 12 2Z" fill="transparent" stroke="#C5A880" strokeWidth="1.5"/>
    <path d="M12 2C12 2 15 5 15 11C15 11 12 11 12 2Z" fill="#C5A880"/>
  </svg>
);

const ComingSoon = () => {
  const { currentLang } = useTranslation();
  const lang: SupportedLang = (['vi', 'en', 'cn', 'jp', 'kr'].includes(currentLang) ? currentLang : 'vi') as SupportedLang;
  const [email, setEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(COMING_SOON_COPY.subscribedSuccess[lang] || COMING_SOON_COPY.subscribedSuccess.vi);
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
