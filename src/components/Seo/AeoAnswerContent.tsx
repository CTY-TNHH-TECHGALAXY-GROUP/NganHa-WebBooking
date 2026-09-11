import { getSeoConfig, resolvePublicAeoContent } from '@/lib/seo/config';
import type { Locale } from '@/lib/constants';
import type { PublicAeoContent } from '@/lib/seo/types';

const LABELS: Record<Locale, { heading: string; source: string; audience: string; duration: string; price: string; inclusions: string; location: string; hours: string; process: string }> = {
  vi: { heading: 'Thông tin nhanh', source: 'Nguồn', audience: 'Phù hợp với', duration: 'Thời lượng', price: 'Mức giá', inclusions: 'Bao gồm', location: 'Địa điểm', hours: 'Giờ hoạt động', process: 'Cách đặt lịch' },
  en: { heading: 'Quick answers', source: 'Source', audience: 'Good for', duration: 'Duration', price: 'Price', inclusions: 'Includes', location: 'Location', hours: 'Hours', process: 'How to book' },
  cn: { heading: '快速信息', source: '来源', audience: '适合', duration: '时长', price: '价格', inclusions: '包含', location: '地点', hours: '营业时间', process: '预约方式' },
  jp: { heading: '基本情報', source: '情報源', audience: 'おすすめの方', duration: '所要時間', price: '料金', inclusions: '内容', location: '場所', hours: '営業時間', process: '予約方法' },
  kr: { heading: '빠른 안내', source: '출처', audience: '추천 대상', duration: '소요 시간', price: '가격', inclusions: '포함 내용', location: '위치', hours: '영업시간', process: '예약 방법' },
};

export async function getVisibleAeoContent(routeKey: string, locale: Locale): Promise<PublicAeoContent | null> {
  return resolvePublicAeoContent(await getSeoConfig(), routeKey, locale);
}

export default async function AeoAnswerContent({ routeKey, locale }: { routeKey: string; locale: Locale }) {
  const content = await getVisibleAeoContent(routeKey, locale);
  if (!content) return null;
  const labels = LABELS[locale];
  const fields = [
    [labels.audience, content.audience],
    [labels.duration, content.duration],
    [labels.price, content.price],
    [labels.location, content.location],
    [labels.hours, content.hours],
    [labels.process, content.bookingProcess],
  ].filter(([, value]) => value);

  return (
    <section aria-labelledby={`aeo-${routeKey}`} data-aeo-content className="mx-auto w-full max-w-5xl border-t border-white/15 px-6 py-12 text-white/85 md:px-10">
      <h2 id={`aeo-${routeKey}`} className="text-xl font-semibold text-white">{labels.heading}</h2>
      {content.serviceName && <h3 className="mt-4 text-lg text-white">{content.serviceName}</h3>}
      {content.answer && <p className="mt-3 max-w-3xl leading-7">{content.answer}</p>}
      {fields.length > 0 && (
        <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {fields.map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-[0.12em] text-white/50">{label}</dt><dd className="mt-1 leading-6">{value}</dd></div>)}
        </dl>
      )}
      {content.inclusions.length > 0 && <div className="mt-6"><h3 className="text-sm font-semibold text-white">{labels.inclusions}</h3><ul className="mt-2 list-disc space-y-1 pl-5">{content.inclusions.map((item) => <li key={item}>{item}</li>)}</ul></div>}
      {content.faqs.length > 0 && <div className="mt-8 space-y-5">{content.faqs.map((faq) => <div key={faq.question}><h3 className="font-semibold text-white">{faq.question}</h3><p className="mt-1 leading-7">{faq.answer}</p></div>)}</div>}
      {content.sourceLabel && <p className="mt-8 text-xs text-white/45">{labels.source}: {content.sourceUrl ? <a href={content.sourceUrl} className="underline underline-offset-2">{content.sourceLabel}</a> : content.sourceLabel}</p>}
    </section>
  );
}
