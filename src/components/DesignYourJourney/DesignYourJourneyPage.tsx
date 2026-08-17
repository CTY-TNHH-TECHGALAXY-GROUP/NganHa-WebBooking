'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/components/TranslationProvider';
import styles from './DesignYourJourneyPage.module.css';

const T = {
  heroEyebrow: {
    vi: "Trải nghiệm OriaSpa cá nhân hoá",
    en: "A private OriaSpa experience",
    cn: "专属 OriaSpa 体验",
    jp: "プライベートな OriaSpa 体験",
    kr: "프라이빗 OriaSpa 경험"
  },
  heroTitle: {
    vi: "Thiết Kế<br>Hành Trình Của Bạn",
    en: "Design<br>Your Journey",
    cn: "定制<br>您的旅程",
    jp: "あなたの旅を<br>デザインする",
    kr: "당신의 여정을<br>디자인하세요"
  },
  heroSide: {
    vi: "Không phải một dịch vụ được chọn từ menu. Đây là một hành trình được thiết kế từ chính điều quý khách cần tại thời điểm đó.",
    en: "Not a service chosen from a menu. This is a journey designed from exactly what you need at that moment.",
    cn: "不是从菜单中选择的服务。这是一次根据您此时此刻的需求精心设计的旅程。",
    jp: "メニューから選ぶサービスではありません。その時々に必要なものからデザインされる旅です。",
    kr: "메뉴에서 선택하는 서비스가 아닙니다. 그 순간 당신에게 필요한 것들로 디자인된 여정입니다."
  },
  scrollCue: {
    vi: "Scroll to discover",
    en: "Scroll to discover",
    cn: "向下滚动以发现",
    jp: "スクロールして発見",
    kr: "스크롤하여 살펴보기"
  },
  statementLabel: {
    vi: "Ý tưởng",
    en: "The idea",
    cn: "核心理念",
    jp: "アイデア",
    kr: "아이디어"
  },
  statementTitle1: {
    vi: "Đôi khi trải nghiệm tuyệt vời nhất bắt đầu",
    en: "Sometimes the best experience begins",
    cn: "有时，最棒的体验始于",
    jp: "最高の体験は、時に",
    kr: "때로는 최고의 경험은"
  },
  statementTitle2: {
    vi: "từ trước cả khi chọn một liệu trình.",
    en: "before choosing a treatment.",
    cn: "在选择疗程之前就已经开始。",
    jp: "トリートメントを選ぶ前から始まります。",
    kr: "트리트먼트를 선택하기 전부터 시작됩니다."
  },
  mediaNoteSmall: {
    vi: "Mang tính cá nhân hoá, không giới hạn",
    en: "Personal, not predetermined",
    cn: "个性化，非预设",
    jp: "あらかじめ決められたものではない、パーソナルな体験",
    kr: "개인화된, 미리 정해지지 않은"
  },
  mediaNoteStrong: {
    vi: "Không có một hành trình nào giống nhau cho tất cả mọi người.",
    en: "No journey is exactly the same for everyone.",
    cn: "没有两个人的旅程是完全一样的。",
    jp: "誰一人として同じ旅はありません。",
    kr: "모든 사람에게 똑같은 여정은 없습니다."
  },
  splitSmall1: {
    vi: "Thiết kế hành trình",
    en: "Design Your Journey",
    cn: "定制您的旅程",
    jp: "旅をデザインする",
    kr: "당신의 여정을 디자인하세요"
  },
  splitTitle: {
    vi: "Hãy để chúng tôi lắng nghe bạn trước.",
    en: "Let us understand what you need first.",
    cn: "让我们先了解您的需求。",
    jp: "まずは、あなたが必要としていることを理解させてください。",
    kr: "먼저 당신에게 필요한 것이 무엇인지 이해하게 해주세요."
  },
  splitP1: {
    vi: "Có những ngày quý khách chỉ muốn thư giãn thật sâu. Có những ngày cơ thể cần được phục hồi nhiều hơn. Và cũng có những lúc quý khách đơn giản muốn dành trọn một khoảng thời gian cho chính mình.",
    en: "There are days when you just want to relax deeply. There are days when your body needs more recovery. And there are times when you simply want to dedicate time to yourself.",
    cn: "有些日子，您只想深度放松；有些日子，身体更需要恢复；也有时，您只是想把一段时间完全留给自己。",
    jp: "ただ深くリラックスしたい日もあれば、体の回復がより必要な日もあります。そして、単に自分のためだけの時間を過ごしたい時もあります。",
    kr: "깊게 휴식하고 싶은 날이 있고, 몸의 회복이 더 필요한 날이 있습니다. 그리고 단순히 오롯이 자신만을 위한 시간을 보내고 싶을 때도 있습니다."
  },
  splitP2: {
    vi: "Design Your Journey được tạo ra cho những khoảnh khắc như vậy. Thay vì chọn một liệu trình cố định, trải nghiệm sẽ được đề xuất dựa trên trạng thái, mong muốn và khoảng thời gian thực tế của quý khách.",
    en: "Design Your Journey is created for such moments. Instead of choosing a fixed treatment, the experience will be proposed based on your current state, desires, and available time.",
    cn: "“定制您的旅程”正是为这些时刻而诞生的。您无需选择固定的疗程，我们将根据您当前的状态、期望和实际时间来为您规划体验。",
    jp: "「Design Your Journey」はそのような瞬間のために作られました。固定のトリートメントを選ぶのではなく、あなたの状態、希望、実際の時間に基づいて体験が提案されます。",
    kr: "'Design Your Journey'는 바로 이런 순간을 위해 만들어졌습니다. 정해진 트리트먼트를 선택하는 대신, 귀하의 현재 상태, 원하는 바, 실제 시간에 맞춰 경험을 제안해 드립니다."
  },
  consultStrong: {
    vi: "Tham khảo trực tiếp tại OriaSpa",
    en: "Consult directly at OriaSpa",
    cn: "直接在 OriaSpa 咨询",
    jp: "OriaSpa で直接相談する",
    kr: "OriaSpa에서 직접 상담하세요"
  },
  consultSpan: {
    vi: "Vì đây là trải nghiệm mang tính cá nhân hóa, nội dung cụ thể sẽ được tư vấn trực tiếp tại cơ sở.",
    en: "Because this is a highly personalized experience, specific details will be discussed directly at the spa.",
    cn: "由于这是高度个性化的体验，具体内容将会在水疗中心直接为您咨询。",
    jp: "パーソナライズされた体験となるため、具体的な内容は店舗にて直接ご案内いたします。",
    kr: "이것은 고도로 개인화된 경험이기 때문에, 구체적인 내용은 스파에서 직접 상담을 통해 결정됩니다."
  },
  splitSmall2: {
    vi: "Hãy để chúng tôi hiểu bạn.",
    en: "Let us understand you.",
    cn: "让我们读懂您。",
    jp: "あなたを理解させてください。",
    kr: "우리가 당신을 이해하게 해주세요."
  },
  journeyTitle: {
    vi: "Hành trình bắt đầu thế nào.",
    en: "How the journey begins.",
    cn: "旅程如何开始。",
    jp: "旅の始まり方。",
    kr: "여정은 어떻게 시작되는가."
  },
  journeyDesc: {
    vi: "Không phải quy trình cứng. Chỉ là ba bước để OriaSpa hiểu quý khách rõ hơn trước khi đề xuất trải nghiệm.",
    en: "Not a rigid process. Just three steps for OriaSpa to understand you better before proposing an experience.",
    cn: "没有僵硬的流程。只需三个步骤，让 OriaSpa 在为您建议体验前更好地了解您。",
    jp: "堅苦しいプロセスはありません。OriaSpa が体験を提案する前に、あなたをより深く理解するための3つのステップです。",
    kr: "엄격한 절차가 아닙니다. OriaSpa가 경험을 제안하기 전에 당신을 더 잘 이해하기 위한 3단계일 뿐입니다."
  },
  step1Title: {
    vi: "Chia sẻ cảm nhận.",
    en: "Tell us how you feel.",
    cn: "告诉我们您的感受。",
    jp: "あなたの気持ちを教えてください。",
    kr: "당신의 기분을 말해주세요."
  },
  step1Desc: {
    vi: "Chia sẻ trạng thái cơ thể, mong muốn hoặc đơn giản là cảm giác quý khách muốn có sau khi rời spa.",
    en: "Share your body's condition, your desires, or simply the feeling you want to have when leaving the spa.",
    cn: "分享您的身体状态、期望，或者仅仅是您离开水疗中心时期望获得的感觉。",
    jp: "体の状態、希望、またはスパを出る時にどう感じていたいかを教えてください。",
    kr: "당신의 신체 상태, 바라는 점, 혹은 스파를 나설 때 느끼고 싶은 기분을 공유해 주세요."
  },
  step2Title: {
    vi: "Định hình trải nghiệm.",
    en: "We shape the experience.",
    cn: "我们塑造体验。",
    jp: "私たちが体験を形作ります。",
    kr: "우리가 경험을 구체화합니다."
  },
  step2Desc: {
    vi: "OriaSpa đề xuất cách kết hợp trải nghiệm, nhịp độ và thời lượng phù hợp hơn với quý khách.",
    en: "OriaSpa proposes an experience combination, pace, and duration that better suits you.",
    cn: "OriaSpa 将建议更适合您的体验组合、节奏和时长。",
    jp: "OriaSpa は、あなたにより適した体験の組み合わせ、ペース、時間をご提案します。",
    kr: "OriaSpa는 귀하에게 더 적합한 경험 조합, 속도, 시간을 제안합니다."
  },
  step3Title: {
    vi: "Hành trình của riêng bạn.",
    en: "Your journey becomes yours.",
    cn: "您的专属旅程。",
    jp: "あなただけの旅になります。",
    kr: "당신의 여정이 당신의 것이 됩니다."
  },
  step3Desc: {
    vi: "Không cần giống bất kỳ ai khác. Journey được tạo ra cho chính khoảng thời gian quý khách dành cho mình.",
    en: "No need to be like anyone else. The journey is created just for the time you dedicate to yourself.",
    cn: "无需与任何人相同。这段旅程只为您专属的时间而打造。",
    jp: "誰とも同じである必要はありません。この旅は、あなたがご自身のために使う時間のためだけに作られます。",
    kr: "다른 누구와 같을 필요가 없습니다. 이 여정은 귀하가 자신을 위해 할애한 시간만을 위해 만들어집니다."
  },
  finalLabel: {
    vi: "Only at OriaSpa",
    en: "Only at OriaSpa",
    cn: "OriaSpa 专属",
    jp: "OriaSpa だけの",
    kr: "오직 OriaSpa에서만"
  },
  finalTitle: {
    vi: "Come in with no plan.<br>Leave with the experience you needed.",
    en: "Come in with no plan.<br>Leave with the experience you needed.",
    cn: "无需计划而来。<br>带着所需的体验离开。",
    jp: "ノープランでご来店ください。<br>あなたが必要としていた体験とともにお帰りください。",
    kr: "계획 없이 오세요.<br>당신이 필요로 했던 경험과 함께 떠나세요."
  },
  finalDesc: {
    vi: "Design Your Journey được tư vấn trực tiếp tại cơ sở để trải nghiệm có thể linh hoạt theo từng khách hàng.",
    en: "Design Your Journey is consulted directly at our location so the experience can be flexible for each guest.",
    cn: "“定制您的旅程”在我们店面直接咨询，以便为每位宾客提供灵活的体验。",
    jp: "「Design Your Journey」は店舗にて直接ご相談を承り、お客様一人ひとりに合わせた柔軟な体験を提供します。",
    kr: "'Design Your Journey'는 각 고객에게 유연한 경험을 제공하기 위해 매장에서 직접 상담이 이루어집니다."
  },
  finalLink: {
    vi: "Ghé thăm OriaSpa →",
    en: "Visit OriaSpa →",
    cn: "访问 OriaSpa →",
    jp: "OriaSpa へ行く →",
    kr: "OriaSpa 방문하기 →"
  },
  ctaContact: {
    vi: "Liên hệ tư vấn thêm",
    en: "Contact for consultation",
    cn: "联系咨询更多",
    jp: "さらに相談する",
    kr: "추가 상담 문의"
  },
  backBtn: {
    vi: "Quay lại",
    en: "Back",
    cn: "返回",
    jp: "戻る",
    kr: "뒤로"
  }
};

export default function DesignYourJourneyPage() {
  const router = useRouter();
  const { currentLang, setLang } = useTranslation();
  
  const getLoc = (key: keyof typeof T) => {
    return T[key][currentLang as keyof typeof T[key]] || T[key]['en'];
  };

  const handleLangChange = (langCode: string) => {
    setLang(langCode);
  };

  return (
    <main className={styles.page}>


      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroInner}>
          <div>
            <div className={styles.eyebrow}>{getLoc('heroEyebrow')}</div>
            <h1 dangerouslySetInnerHTML={{ __html: getLoc('heroTitle') }} />
          </div>
          <div className={styles.heroSide}>
            <p>{getLoc('heroSide')}</p>
          </div>
        </div>
        <div className={styles.scrollCue}>{getLoc('scrollCue')}</div>
      </section>

      <section className={styles.statement}>
        <div className={styles.statementLabel}>{getLoc('statementLabel')}</div>
        <h2>
          {getLoc('statementTitle1')}<br/>
          <em>{getLoc('statementTitle2')}</em>
        </h2>
      </section>

      <section className={styles.split}>
        <div className={styles.splitMedia}>
          <div className={styles.mediaNote}>
            <span>{getLoc('mediaNoteSmall')}</span>
            <strong>{getLoc('mediaNoteStrong')}</strong>
          </div>
        </div>

        <div className={styles.splitCopy}>
          <div>
            <div className={styles.small}>{getLoc('splitSmall1')}</div>
            <h3>{getLoc('splitTitle')}</h3>
            <p>{getLoc('splitP1')}</p>
            <p>{getLoc('splitP2')}</p>

            <div className={styles.consultLine}>
              <strong>{getLoc('consultStrong')}</strong>
              <span>{getLoc('consultSpan')}</span>
            </div>
          </div>
          <div className={styles.small}>{getLoc('splitSmall2')}</div>
        </div>
      </section>

      <section className={styles.journey}>
        <div className={styles.journeyHead}>
          <h4>{getLoc('journeyTitle')}</h4>
          <p>{getLoc('journeyDesc')}</p>
        </div>

        <div className={styles.journeyList}>
          <div className={styles.journeyRow}>
            <div className={styles.num}>01</div>
            <div className={styles.title}>{getLoc('step1Title')}</div>
            <div className={styles.desc}>{getLoc('step1Desc')}</div>
          </div>

          <div className={styles.journeyRow}>
            <div className={styles.num}>02</div>
            <div className={styles.title}>{getLoc('step2Title')}</div>
            <div className={styles.desc}>{getLoc('step2Desc')}</div>
          </div>

          <div className={styles.journeyRow}>
            <div className={styles.num}>03</div>
            <div className={styles.title}>{getLoc('step3Title')}</div>
            <div className={styles.desc}>{getLoc('step3Desc')}</div>
          </div>
        </div>
      </section>

      <section className={styles.final}>
        <div className={styles.finalInner}>
          <div className={styles.finalLabel}>{getLoc('finalLabel')}</div>
          <h5 dangerouslySetInnerHTML={{ __html: getLoc('finalTitle') }} />
          <p>{getLoc('finalDesc')}</p>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link href={`/${currentLang || 'en'}/menu`} className={styles.finalLink}>
              {getLoc('finalLink')}
            </Link>
            <a href="tel:+84" className={styles.finalLink} style={{ color: '#d3c2a8', borderColor: '#d3c2a8' }}>
              {getLoc('ctaContact')} ↗
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 TECHGALAXY GROUP</span>
        <span>OriaSpa · Let us understand you.</span>
      </footer>
    </main>
  );
}
