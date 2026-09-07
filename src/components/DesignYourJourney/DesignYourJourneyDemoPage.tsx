'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { BRANCHES } from '@/lib/constants';
import styles from './DesignYourJourneyDemoPage.module.css';

export type JourneyCopy = {
  eyebrow: string;
  title: string;
  problemLabel: string;
  problem: string;
  reason: string;
  timeSectionLabel: string;
  timeLabel: string;
  shortTime: string;
  shortTitle: string;
  shortBody: string;
  longTime: string;
  longTitle: string;
  longBody: string;
  decisionLabel: string;
  decision: string;
  questions: string[];
  manifesto: string;
  availability: string;
  call: string;
  directions: string;
};

export const JOURNEY_COPY: Record<string, JourneyCopy> = {
  vi: {
    eyebrow: 'Chỉ có tại Oria Spa',
    title: 'Design Your Journey',
    problemLabel: 'Điều quen thuộc',
    problem: 'Đi spa mà cứ phải luôn chọn theo gói có sẵn, dù thích hay không thích cũng phải làm đủ các bước trong đó - nghe quen không? Chỉ tiện lợi cho người mới đến lần đầu, còn người đi nhiều thì chỉ muốn làm đúng thứ mình cần, trong khoảng thời gian mình có.',
    reason: 'Đó là lý do Oria Spa có Design Your Journey - không có gói cố định, mà để chính khách hàng tự thiết kế hành trình của mình.',
    timeSectionLabel: 'Thời gian là điểm khởi đầu',
    timeLabel: 'Hai khoảng thời gian. Hai hành trình khác nhau.',
    shortTime: 'Một tiếng rưỡi',
    shortTitle: 'Trước cuộc họp quan trọng',
    shortBody: 'Có một tiếng rưỡi trước cuộc họp quan trọng? Chọn cắt tóc và massage vai gáy, vừa đủ để tỉnh táo mà không trễ giờ.',
    longTime: 'Cả buổi chiều',
    longTitle: 'Tận hưởng trọn vẹn',
    longBody: 'Có cả buổi chiều rảnh rỗi, muốn tận hưởng trọn vẹn? Kết hợp gội đầu, massage toàn thân, chăm sóc da mặt, ráy tai - tất cả theo đúng thứ tự và thời lượng mình muốn.',
    decisionLabel: 'Theo nhịp riêng của bạn',
    decision: 'Không phải chọn giữa gói A hay gói B, mà là tự quyết định:',
    questions: ['hôm nay mình cần gì', 'có bao nhiêu thời gian', 'muốn kết thúc buổi đó với cảm giác như thế nào'],
    manifesto: 'Design Your Journey không phải là một thực đơn, mà là cách để mỗi buổi đến Oria Spa trở thành đúng những gì mình cần!',
    availability: 'Hiện tại, Design Your Journey chỉ có tại Oria Spa. Đến trực tiếp để tự thiết kế trải nghiệm theo cách của bạn.',
    call: 'Gọi hotline',
    directions: 'Google Maps',
  },
  en: {
    eyebrow: 'Only at Oria Spa',
    title: 'Design Your Journey',
    problemLabel: 'The familiar problem',
    problem: "Always choosing from a fixed package at the spa, doing every step in it whether you like it or not - sound familiar? That works fine for first-timers, but if you've been here before, you probably just want exactly what you need, in the time you actually have.",
    reason: "That's why Oria Spa created Design Your Journey - no fixed packages, just you designing your own experience.",
    timeSectionLabel: 'Time becomes the brief',
    timeLabel: 'Two windows of time. Two different journeys.',
    shortTime: 'An hour and a half',
    shortTitle: 'Before an important meeting',
    shortBody: 'Got an hour and a half before an important meeting? Choose a haircut and a shoulder massage - just enough to feel refreshed without running late.',
    longTime: 'A free afternoon',
    longTitle: 'The full experience',
    longBody: 'Have a free afternoon and want the full experience? Combine a hair wash, full body massage, facial care, and ear cleaning - in whatever order and duration you want.',
    decisionLabel: 'Your own measure',
    decision: "It's not about choosing Package A or Package B. It's about deciding for yourself:",
    questions: ['what do I need today', 'how much time do I have', 'how do I want to feel when it is done'],
    manifesto: "Design Your Journey isn't a menu - it's how every visit to Oria Spa becomes exactly what you need!",
    availability: 'For now, Design Your Journey is available only at Oria Spa. Visit us in person and design the experience your way.',
    call: 'Call hotline',
    directions: 'Google Maps',
  },
  cn: {
    eyebrow: '仅在 Oria Spa 提供',
    title: 'Design Your Journey',
    problemLabel: '熟悉的问题',
    problem: '去水疗馆总是要从固定套餐里选,不管喜不喜欢都得把里面每一步都做完——是不是很熟悉?这种方式对第一次来的客人挺方便,但如果你已经来过几次,你可能只想在自己有限的时间里,做真正需要的项目。',
    reason: '这就是Oria Spa推出Design Your Journey的原因——没有固定套餐,由你自己来设计专属体验。',
    timeSectionLabel: '让时间决定旅程',
    timeLabel: '两段时间，两种不同的旅程。',
    shortTime: '一个半小时',
    shortTitle: '重要会议之前',
    shortBody: '重要会议前只有一个半小时?选择剪发加肩颈按摩,刚好让你精神焕发又不会迟到。',
    longTime: '整个下午',
    longTitle: '尽情享受完整体验',
    longBody: '有一整个下午的空闲时间,想要尽情放松?可以组合洗发、全身按摩、面部护理和采耳——顺序和时长完全由你决定。',
    decisionLabel: '按照自己的节奏',
    decision: '这不是在A套餐和B套餐之间做选择,而是自己决定:',
    questions: ['今天我需要什么', '我有多少时间', '结束后我想要什么样的感觉'],
    manifesto: 'Design Your Journey不是一份菜单,而是让你每一次来Oria Spa,都恰好是你所需要的体验!',
    availability: '目前，Design Your Journey 仅在 Oria Spa 门店提供。欢迎亲临门店，以自己的方式设计专属体验。',
    call: '致电热线',
    directions: 'Google Maps',
  },
  jp: {
    eyebrow: 'Oria Spa限定',
    title: 'Design Your Journey',
    problemLabel: 'よくある悩み',
    problem: 'スパに行くたびに決まったパッケージから選び、好きでも嫌いでもその中の工程を全部こなさなければならない - そんな経験、ありませんか?これは初めて訪れる方には便利ですが、何度か来たことがある方なら、限られた時間の中で本当に必要なものだけを受けたいと思うはずです。',
    reason: 'だからこそOria Spaは、Design Your Journeyを作りました - 固定パッケージはなく、お客様自身が自分だけの旅をデザインするスタイルです。',
    timeSectionLabel: '時間から旅を描く',
    timeLabel: '二つの時間。二つの異なる旅。',
    shortTime: '1時間半',
    shortTitle: '大切な会議の前に',
    shortBody: '大事な会議の前に1時間半だけありますか?ヘアカットと肩マッサージを選べば、遅刻せずにすっきりリフレッシュできます。',
    longTime: '午後をまるごと',
    longTitle: '心ゆくまで楽しむ',
    longBody: '午後がまるまる空いていて、じっくり楽しみたいですか?ヘアウォッシュ、全身マッサージ、フェイシャルケア、耳掃除を、好きな順番と時間で組み合わせられます。',
    decisionLabel: '自分だけの基準で',
    decision: 'AパッケージかBパッケージかを選ぶのではなく、自分で決めるのです -',
    questions: ['今日の自分に必要なものは何か', 'どれくらい時間があるか', '終わったときにどんな気分でいたいか'],
    manifesto: 'Design Your Journeyはメニューではありません - Oria Spaを訪れるたびに、まさに自分に必要な体験になる、そのための仕組みです!',
    availability: '現在、Design Your Journey は Oria Spa 店舗でのみご利用いただけます。直接ご来店いただき、自分らしいスタイルで体験をデザインしてください。',
    call: '電話で問い合わせる',
    directions: 'Google Maps',
  },
  kr: {
    eyebrow: '오직 Oria Spa에서',
    title: 'Design Your Journey',
    problemLabel: '익숙한 고민',
    problem: '스파에 갈 때마다 정해진 패키지 안에서만 골라야 하고, 좋든 싫든 그 안의 모든 단계를 다 해야 하는 것 - 익숙하지 않으신가요? 이런 방식은 처음 오시는 분들에게는 편리하지만, 이미 여러 번 방문해 보신 분이라면 자신에게 주어진 시간 안에서 정말 필요한 것만 하고 싶으실 거예요.',
    reason: '그래서 Oria Spa는 Design Your Journey를 만들었습니다 - 정해진 패키지 없이, 고객님이 직접 자신만의 여정을 디자인하는 방식입니다.',
    timeSectionLabel: '시간에서 시작하는 여정',
    timeLabel: '두 개의 시간, 서로 다른 두 개의 여정.',
    shortTime: '한 시간 반',
    shortTitle: '중요한 미팅 전에',
    shortBody: '중요한 미팅 전 한 시간 반 정도 시간이 있으신가요? 헤어컷과 어깨 마사지를 선택하세요. 늦지 않으면서도 딱 개운해지는 정도로요.',
    longTime: '여유로운 오후',
    longTitle: '온전한 경험',
    longBody: '오후 시간이 여유롭고 온전히 즐기고 싶으신가요? 헤어 워시, 전신 마사지, 페이셜 케어, 귀 청소를 원하는 순서와 시간으로 자유롭게 조합해 보세요.',
    decisionLabel: '나만의 기준으로',
    decision: 'A 패키지와 B 패키지 중에서 고르는 게 아니라, 스스로 결정하는 겁니다:',
    questions: ['오늘 나에게 필요한 건 무엇인지', '시간은 얼마나 있는지', '끝났을 때 어떤 기분이고 싶은지'],
    manifesto: 'Design Your Journey는 메뉴가 아닙니다 - Oria Spa를 방문할 때마다 온전히 나에게 필요한 경험이 되도록 만드는 방식입니다!',
    availability: '현재 Design Your Journey는 Oria Spa 매장에서만 이용하실 수 있습니다. 직접 방문해 나만의 방식으로 경험을 디자인해 보세요.',
    call: '핫라인 전화',
    directions: 'Google Maps',
  },
};

export const JOURNEY_MEDIA_DEFAULTS = {
  hero: '/images/body-treatment-full.png',
  shortJourney: '/images/services/barber.JPG',
  longJourney: '/images/services/hairwash.png',
  closing: '/images/hero-spa-bg.png',
};

export default function DesignYourJourneyDemoPage() {
  const { currentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const [adminContent, setAdminContent] = useState<Record<string, any>>({});
  const defaults = JOURNEY_COPY[currentLang] || JOURNEY_COPY.en;
  const copy = useMemo(() => Object.keys(defaults).reduce<JourneyCopy>((result, key) => {
    const field = key as keyof JourneyCopy;
    const override = adminContent[field]?.[currentLang] || adminContent[field]?.en;
    (result as any)[field] = override || defaults[field];
    return result;
  }, { ...defaults }), [adminContent, currentLang, defaults]);
  const media = { ...JOURNEY_MEDIA_DEFAULTS, ...(adminContent.media || {}) };
  const locationUrl = systemSettings.googleMaps || BRANCHES.BARBERSHOP.googleMaps;
  const phone = systemSettings.phone || '+84964090277';
  const hotlineUrl = `tel:${phone.replace(/[^\d+]/g, '')}`;

  useEffect(() => {
    fetch('/api/public/site-content')
      .then((response) => response.json())
      .then((json) => setAdminContent(json.content?.design_journey_content || {}))
      .catch(() => setAdminContent({}));
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <img src={media.hero} alt="Oria Spa treatment" className={styles.heroImage} />
        <div className="media-watermark" aria-hidden="true" />
        <div className={styles.heroShade} />
        <div className={styles.heroCopy}>
          <p>{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <span>{copy.reason}</span>
        </div>
      </section>

      <section className={styles.opening}>
        <p className={styles.index}>01 / {copy.problemLabel}</p>
        <blockquote>{copy.problem}</blockquote>
      </section>

      <section className={styles.score}>
        <header>
          <p className={styles.index}>02 / {copy.timeSectionLabel}</p>
          <h2>{copy.timeLabel}</h2>
        </header>
        <div className={styles.scoreLine} aria-hidden="true"><span /><span /></div>
        <article className={styles.moment}>
          <figure>
            <img src={media.shortJourney} alt="Oria Spa haircut" loading="lazy" />
            <div className="media-watermark" aria-hidden="true" />
          </figure>
          <div className={styles.momentCopy}>
            <p><Clock3 size={16} /> {copy.shortTime}</p>
            <h3>{copy.shortTitle}</h3>
            <span>{copy.shortBody}</span>
          </div>
        </article>
        <article className={`${styles.moment} ${styles.reverse}`}>
          <figure>
            <img src={media.longJourney} alt="Oria Spa hair wash" loading="lazy" />
            <div className="media-watermark" aria-hidden="true" />
          </figure>
          <div className={styles.momentCopy}>
            <p><Clock3 size={16} /> {copy.longTime}</p>
            <h3>{copy.longTitle}</h3>
            <span>{copy.longBody}</span>
          </div>
        </article>
      </section>

      <section className={styles.decisions}>
        <p className={styles.index}>03 / {copy.decisionLabel}</p>
        <h2>{copy.decision}</h2>
        <ol>
          {copy.questions.map((question, index) => (
            <li key={question}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <strong>{question}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.manifesto}>
        <p>{copy.manifesto}</p>
      </section>

      <section className={styles.closing}>
        <img src={media.closing} alt="Oria Spa private treatment room" loading="lazy" />
        <div className="media-watermark" aria-hidden="true" />
        <div className={styles.closingShade} />
        <div className={styles.closingCopy}>
          <p>{copy.availability}</p>
          <div className={styles.closingActions}>
            <a href={hotlineUrl} aria-label={copy.call}>
              <Phone size={18} aria-hidden="true" />
              <span>{copy.call}</span>
            </a>
            <a href={locationUrl} target="_blank" rel="noopener noreferrer">
              <MapPin size={18} aria-hidden="true" />
              {copy.directions}
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
