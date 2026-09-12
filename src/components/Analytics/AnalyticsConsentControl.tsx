'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslation } from '@/components/TranslationProvider';
import {
  analyticsConsentEventName,
  getAnalyticsConsent,
  setAnalyticsConsent,
} from '@/lib/analytics/client';
import type { AnalyticsConsent } from '@/lib/analytics/contract';

const COPY = {
  vi: {
    title: 'Quyền riêng tư',
    description: 'Cho phép Oria dùng dữ liệu ẩn danh để cải thiện trải nghiệm trên website. Bạn có thể thay đổi lựa chọn bất cứ lúc nào.',
    allow: 'Cho phép',
    deny: 'Từ chối',
    manage: 'Quyền riêng tư',
    revoke: 'Thu hồi đồng ý',
    enable: 'Cho phép phân tích',
    close: 'Đóng',
  },
  en: {
    title: 'Privacy choices',
    description: 'Allow Oria to use anonymous data to improve the website experience. You can change this choice at any time.',
    allow: 'Allow',
    deny: 'Decline',
    manage: 'Privacy choices',
    revoke: 'Withdraw consent',
    enable: 'Allow analytics',
    close: 'Close',
  },
  cn: {
    title: '隐私选择',
    description: '允许 Oria 使用匿名数据来改善网站体验。您可以随时更改此选择。',
    allow: '允许',
    deny: '拒绝',
    manage: '隐私选择',
    revoke: '撤回同意',
    enable: '允许分析',
    close: '关闭',
  },
  jp: {
    title: 'プライバシー設定',
    description: '匿名データの使用を許可して、ウェブサイトの体験改善にご協力ください。設定はいつでも変更できます。',
    allow: '許可する',
    deny: '拒否する',
    manage: 'プライバシー設定',
    revoke: '同意を撤回',
    enable: '分析を許可',
    close: '閉じる',
  },
  kr: {
    title: '개인정보 선택',
    description: '익명 데이터를 사용해 웹사이트 경험을 개선할 수 있도록 허용해 주세요. 언제든 선택을 변경할 수 있습니다.',
    allow: '허용',
    deny: '거부',
    manage: '개인정보 선택',
    revoke: '동의 철회',
    enable: '분석 허용',
    close: '닫기',
  },
} as const;

export default function AnalyticsConsentControl() {
  return null;
}

function _UnusedAnalyticsConsentControl() {
  const pathname = usePathname() || '/';
  const { currentLang } = useTranslation();
  const [consent, setConsent] = useState<AnalyticsConsent>('unknown');
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const sync = () => {
      const next = getAnalyticsConsent();
      setConsent(next);
      setOpen(next === 'unknown');
    };
    sync();
    window.addEventListener(analyticsConsentEventName, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(analyticsConsentEventName, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  if (pathname.startsWith('/admin')) return null;

  const copy = COPY[currentLang as keyof typeof COPY] || COPY.en;
  const choose = (next: Exclude<AnalyticsConsent, 'unknown'>) => {
    setAnalyticsConsent(next);
    setConsent(next);
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        aria-label={copy.manage}
        data-testid="analytics-consent-manage"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 z-[80] border border-[#c9a96e]/50 bg-[#201914]/95 px-3 py-2 text-xs text-[#f5e7c1] shadow-lg backdrop-blur-md transition-colors hover:border-[#f2d58d] hover:text-white"
      >
        {copy.manage}
      </button>
    );
  }

  return (
    <aside
      role="dialog"
      aria-label={copy.title}
      aria-live="polite"
      data-testid="analytics-consent-control"
      className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-xl border border-[#c9a96e]/55 bg-[#201914]/[.97] p-4 text-[#f5e7c1] shadow-2xl backdrop-blur-md sm:inset-x-auto sm:right-4 sm:left-auto"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold tracking-wide">{copy.title}</h2>
          <p className="mt-1 max-w-lg text-xs leading-5 text-[#eadfca]/85">{copy.description}</p>
        </div>
        {consent !== 'unknown' && (
          <button
            type="button"
            aria-label={copy.close}
            onClick={() => setOpen(false)}
            className="shrink-0 text-lg leading-none text-[#eadfca]/70 transition-colors hover:text-white"
          >
            x
          </button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        {consent === 'granted' ? (
          <button
            type="button"
            data-testid="analytics-consent-revoke"
            onClick={() => choose('denied')}
            className="border border-[#eadfca]/35 px-3 py-2 text-xs text-[#eadfca] transition-colors hover:border-[#f2d58d] hover:text-white"
          >
            {copy.revoke}
          </button>
        ) : (
          <button
            type="button"
            data-testid="analytics-consent-deny"
            onClick={() => choose('denied')}
            className="border border-[#eadfca]/35 px-3 py-2 text-xs text-[#eadfca] transition-colors hover:border-[#f2d58d] hover:text-white"
          >
            {copy.deny}
          </button>
        )}
        {consent !== 'granted' && (
          <button
            type="button"
            data-testid="analytics-consent-allow"
            onClick={() => choose('granted')}
            className="border border-[#f2d58d] bg-[#c9a96e] px-3 py-2 text-xs font-semibold text-[#201914] transition-colors hover:bg-[#f2d58d]"
          >
            {consent === 'denied' ? copy.enable : copy.allow}
          </button>
        )}
      </div>
    </aside>
  );
}
