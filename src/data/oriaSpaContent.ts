import type { Locale } from '@/lib/constants';

const SERVICE_COPY = {
  vi: {
    intro: 'Chọn trải nghiệm phù hợp với nhu cầu và thời gian của bạn.',
    explore: 'Khám phá', soon: 'Sắp ra mắt',
    designJourney: 'Tự kết hợp các dịch vụ theo thời gian bạn có. Thiết kế trải nghiệm trực tiếp tại Oria Spa.',
    pureRelaxation: 'Khám phá từng dịch vụ thư giãn, xem thời lượng và chọn liệu trình phù hợp.',
    therapy: 'Trải nghiệm trị liệu đang được chuẩn bị tại Oria Spa.',
  },
  en: {
    intro: 'Find an experience that fits your needs and the time you have.',
    explore: 'Explore', soon: 'Coming soon',
    designJourney: 'Combine services around your own schedule. Create your experience in person at Oria Spa.',
    pureRelaxation: 'Explore individual relaxation services, compare durations and choose your treatment.',
    therapy: 'Our therapy experience is in preparation at Oria Spa.',
  },
  cn: {
    intro: '根据您的需求和时间，选择适合自己的体验。',
    explore: '探索体验', soon: '即将推出',
    designJourney: '根据您的时间自由组合服务。亲临 Oria Spa，设计专属体验。',
    pureRelaxation: '探索各项放松服务，查看时长，选择适合您的护理。',
    therapy: 'Oria Spa 的理疗体验正在筹备中。',
  },
  jp: {
    intro: 'ご希望とお時間に合った体験をお選びください。',
    explore: '詳しく見る', soon: '近日公開',
    designJourney: 'お時間に合わせてサービスを自由に組み合わせ。Oria Spa の店頭で体験をデザインできます。',
    pureRelaxation: 'リラクゼーションサービスと所要時間を見比べて、お好みの施術をお選びください。',
    therapy: 'Oria Spa のセラピー体験は現在準備中です。',
  },
  kr: {
    intro: '원하는 서비스와 여유 시간에 맞는 경험을 선택하세요.',
    explore: '자세히 보기', soon: '곧 공개',
    designJourney: '여유 시간에 맞춰 서비스를 자유롭게 조합하세요. Oria Spa 매장에서 나만의 경험을 설계할 수 있습니다.',
    pureRelaxation: '개별 휴식 서비스와 소요 시간을 살펴보고 원하는 관리를 선택하세요.',
    therapy: 'Oria Spa에서 테라피 경험을 준비하고 있습니다.',
  },
} satisfies Record<Locale, { intro: string; explore: string; soon: string; designJourney: string; pureRelaxation: string; therapy: string }>;

export const DEFAULT_SPA_SERVICE_CONTENT = Object.fromEntries(
  Object.keys(SERVICE_COPY.vi).map(key => [key, Object.fromEntries(
    Object.entries(SERVICE_COPY).map(([locale, copy]) => [locale, copy[key as keyof typeof copy]])
  )])
) as Record<keyof typeof SERVICE_COPY.vi, Record<string, string>>;

// Fill missing locales while retaining saved text, intentional blanks and additional fields.
export function fillLocalizedDefaults(defaults: Record<string, any>, saved: any): Record<string, any> {
  const source = saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
  const result = { ...defaults, ...source };
  for (const [key, value] of Object.entries(defaults)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = fillLocalizedDefaults(value, source[key]);
    }
  }
  return result;
}
