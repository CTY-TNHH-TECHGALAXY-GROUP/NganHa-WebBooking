import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/components/TranslationProvider';
import styles from './SaigonCoffeeArticle.module.css';

interface SaigonCoffeeArticleProps {
  onBack: () => void;
}

const contentData = {
  vi: {
    kicker: 'Góc Văn Hóa',
    title: 'Người Sài Gòn uống cà phê như thế nào.',
    subtitle:
      'Một góc nhìn địa phương đơn giản về cà phê đậm, nhiều đá, những cuộc trò chuyện dài, và vì sao những quán cà phê lại như một phần tất yếu của cuộc sống hàng ngày tại Sài Gòn.',
    metaAuthor: 'Bởi Oria Editorial',
    metaTag1: 'Văn hóa Sài Gòn',
    metaTag2: 'Chiều chậm',
    readTime: '04 phút đọc',
    crumbs: ['Blogs', 'Góc Văn Hóa', 'Người Sài Gòn uống cf...'],
    heroSideLabel: 'Vì sao bài viết này hữu ích',
    heroSideTitle: 'Cà phê ở đây là nhịp sống mỗi ngày.',
    heroSideP:
      'Người ta dừng lại uống cà phê để chuyện trò, làm việc, chờ đợi, ngắm đường phố, hay đơn giản chỉ để ngồi một lát.',
    singleNoteText1: 'Phù hợp nhất cho ',
    singleNoteText2: 'người lần đầu ghé thăm',
    lede: 'Để hiểu văn hóa cà phê Sài Gòn, hãy quên đi khái niệm cà phê mua mang đi vội vã. Ở đây, một ly cà phê có thể thật đậm đà, ngọt ngào, mát lạnh, và được thưởng thức thật chậm rãi trong khi thành phố vẫn không ngừng chuyển động xung quanh bạn.',
    summaryMini: 'Điểm nhìn nhanh',
    summaryItems: [
      'Cà phê đậm vị, thường phục vụ kèm rất nhiều đá.',
      'Những chiếc ghế đẩu vỉa hè và những quán cà phê sang trọng đều thuộc chung một văn hóa cà phê.',
      'Mọi người thường nán lại, chuyện trò và ngắm nhìn thành phố thay vì chỉ uống rồi vội vã rời đi.',
    ],
    featureCaption:
      'Một khung cảnh Sài Gòn quen thuộc: cà phê, những câu chuyện và thời gian để nán lại.',
    s1Index: '01 · Ly cà phê',
    s1Title: 'Hãy bắt đầu với những gì người ta thực sự uống.',
    s1P1: 'Trải nghiệm kinh điển nhất là một ly cà phê đậm đặc với đá. "Cà phê sữa đá" có thêm sữa đặc; "cà phê đen đá" giữ nguyên vị đắng và trực diện. "Bạc xỉu" thì nhiều sữa và êm dịu hơn.',
    s1P2: 'Hương vị thường đậm hơn so với tưởng tượng của nhiều du khách, nhất là khi được pha qua một chiếc "phin" kim loại nhỏ.',
    s1Quote: '"Ở Sài Gòn, cà phê hiếm khi chỉ đơn thuần là cà phê."',
    s1Source: 'Góc nhìn Oria',
    s1SideNoteMini: 'Điểm lưu ý',
    s1SideNoteText:
      'Nếu bạn muốn một lựa chọn địa phương dễ nhận biết nhất, hãy bắt đầu với cà phê sữa đá.',
    s2Index: '02 · Cách người ta thưởng thức',
    s2Title: 'Người ta ngồi. Chuyện trò. Và ngắm phố phường.',
    s2P1: 'Cà phê có thể là một điểm dừng nhanh bên đường trên chiếc ghế đẩu nhỏ, một cuộc trò chuyện dài cùng bạn bè, hay một giờ làm việc một mình với laptop. Dù không gian có thay đổi, việc nán lại một lúc lâu vẫn là điều hoàn toàn bình thường.',
    s2P2: 'Đối với du khách, đây là điều đáng chú ý: mọi người thường sử dụng quán cà phê như một phần mở rộng của đường phố, văn phòng và cả phòng khách cùng một lúc.',
    pullHighlightMini: 'Góc nhìn Oria',
    pullHighlightText:
      'Từ một chiếc ghế đẩu vỉa hè nhỏ bé đến một quán cà phê mang đậm tính thiết kế, nghi thức này trôi qua một cách đồng điệu đến bất ngờ: gọi món, ngồi xuống, chuyện trò, và nán lại.',
    s3Index: '03 · Điều người nước ngoài thường chú ý',
    s3Title: 'Sự tương phản là điều làm nên sự thú vị của văn hóa cà phê Sài Gòn.',
    s3P1: 'Mới khoảnh khắc trước bạn còn đang uống từ một chiếc ly thủy tinh ngay cạnh vỉa hè; ngay khoảnh khắc sau, bạn đã bước vào một quán cà phê với thiết kế tuyệt đẹp phục vụ những hạt cà phê đặc sản. Cả hai trải nghiệm này đều mang một tinh thần Sài Gòn trọn vẹn.',
    s3P2: 'Điểm chung ở đây không nằm ở sự xa xỉ, mà nằm ở thói quen luôn dành một không gian cho cà phê trong cuộc sống hàng ngày.',
    askCardMini: 'Hỏi Oria',
    askCardTitle: 'Muốn trải nghiệm cà phê Sài Gòn như người bản địa?',
    askCardP:
      'Hãy nói cho Oria biết bạn muốn trải nghiệm như thế nào: cà phê vỉa hè, một góc quán khuất nẻo, quán cà phê thiết kế hay một nơi nào đó thư giãn để ngồi và ngắm nhìn thành phố.',
    askCardAction: 'Tìm quán cà phê Sài Gòn của bạn →',
    relatedContinue: 'Đọc tiếp',
    relatedTitle: 'Tiếp tục khám phá Sài Gòn.',
    relatedP: 'Những cẩm nang nhỏ để ngắm nhìn thành phố vượt ra khỏi những gì thường thấy.',
    r1Tag: 'Sức khỏe',
    r1Title: '3 phong cách cà phê nên thử tại Sài Gòn.',
    r1Time: '04 phút',
    r2Tag: 'Góc nhìn thành phố',
    r2Title: 'Người địa phương ăn gì sau một buổi chiều nhẹ nhàng.',
    r2Time: '06 phút',
    r3Tag: 'Cẩm nang Quận',
    r3Title: 'Quận 1 bên ngoài những tuyến đường du lịch.',
    r3Time: '05 phút',
    backBtn: 'Quay lại',
  },
  en: {
    kicker: 'Culture Lens',
    title: 'How Saigon drinks coffee.',
    subtitle:
      'A simple local guide to strong coffee, lots of ice, long conversations — and why cafés feel like part of everyday life in Saigon.',
    metaAuthor: 'By Oria Editorial',
    metaTag1: 'Saigon culture',
    metaTag2: 'Slow afternoon',
    readTime: '04 min read',
    crumbs: ['Blogs', 'Culture Lens', 'How Saigon drinks coffee.'],
    heroSideLabel: 'Why this article matters',
    heroSideTitle: 'Coffee here is part of daily life.',
    heroSideP:
      'People stop for coffee to talk, work, wait, watch the street — or simply sit for a while.',
    singleNoteText1: 'Best for ',
    singleNoteText2: 'first-time visitors',
    lede: 'To understand Saigon coffee culture, forget the idea of coffee as a quick takeaway. Here, a cup can be strong, sweet, iced — and enjoyed slowly while the city keeps moving around you.',
    summaryMini: 'In one glance',
    summaryItems: [
      'Strong coffee, often served over plenty of ice.',
      'Street stools and polished cafés can belong to the same coffee culture.',
      'People often stay, talk and watch the city rather than drink and leave.',
    ],
    featureCaption: 'A familiar Saigon scene: coffee, conversation and time to sit.',
    s1Index: '01 · The cup',
    s1Title: 'Start with what people actually drink.',
    s1P1: 'The classic experience is bold coffee with ice. Cà phê sữa đá adds condensed milk; cà phê đen đá keeps it dark and direct. Bạc xỉu is milkier and gentler.',
    s1P2: 'The flavour is usually stronger than many visitors expect — especially when brewed through a small metal phin.',
    s1Quote: '“In Saigon, coffee is rarely only about the coffee.”',
    s1Source: 'Oria take',
    s1SideNoteMini: 'What to notice',
    s1SideNoteText:
      'If you want the most recognisable local order, start with cà phê sữa đá.',
    s2Index: '02 · How people drink it',
    s2Title: 'People sit. They talk. They watch the street.',
    s2P1: 'Coffee can mean a quick roadside stop on a small stool, a long conversation with friends, or an hour alone with a laptop. The setting changes, but staying for a while feels completely normal.',
    s2P2: 'For visitors, this is the part worth noticing: people are often using the café as an extension of the street, the office and the living room at the same time.',
    pullHighlightMini: 'Oria perspective',
    pullHighlightText:
      'From a tiny sidewalk stool to a design-led café, the ritual is surprisingly similar: order, sit, talk, stay.',
    s3Index: '03 · What foreigners usually notice',
    s3Title: 'The contrast is what makes Saigon coffee culture interesting.',
    s3P1: 'One moment you are drinking from a glass beside the pavement; the next, you are in a beautifully designed café serving specialty beans. Both can feel completely Saigon.',
    s3P2: 'The common thread is less about luxury and more about the habit of making space for coffee in everyday life.',
    askCardMini: 'Ask Oria',
    askCardTitle: 'Want to experience Saigon coffee like a local?',
    askCardP:
      'Tell Oria what kind of experience you want — sidewalk, hidden local spot, design café or somewhere easy to sit and watch the city.',
    askCardAction: 'Find your Saigon café →',
    relatedContinue: 'Continue reading',
    relatedTitle: 'Keep exploring Saigon.',
    relatedP: 'Short local guides for seeing the city beyond the obvious.',
    r1Tag: 'Wellness',
    r1Title: '3 coffee styles to try in Saigon.',
    r1Time: '04 min',
    r2Tag: 'City Lens',
    r2Title: 'What locals eat after a light afternoon.',
    r2Time: '06 min',
    r3Tag: 'District Guide',
    r3Title: 'District 1 beyond the tourist route.',
    r3Time: '05 min',
    backBtn: 'Back to Blogs',
  },
};

export default function SaigonCoffeeArticle({ onBack }: SaigonCoffeeArticleProps) {
  const { currentLang } = useTranslation();
  const lang = currentLang === 'en' ? 'en' : 'vi';
  const c = contentData[lang];

  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      setScrollPct(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className={styles.wrapper}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '999px',
                cursor: 'pointer',
                marginBottom: '24px',
                backdropFilter: 'blur(4px)',
                fontSize: '14px',
              }}
            >
              <span>←</span> {c.backBtn}
            </button>
            <div className={styles.kicker}>{c.kicker}</div>
            <h1 className={styles.heroTitle}>{c.title}</h1>
            <p className={styles.subtitle}>{c.subtitle}</p>
            <div className={styles.metaRow}>
              <div className={styles.metaChip}>{c.metaAuthor}</div>
              <div className={styles.metaChip}>{c.metaTag1}</div>
              <div className={styles.metaChip}>{c.metaTag2}</div>
            </div>
          </div>

          <aside className={styles.heroSide}>
            <div className={styles.label}>{c.heroSideLabel}</div>
            <h3 className={styles.heroSideTitle}>{c.heroSideTitle}</h3>
            <p className={styles.heroSideP}>{c.heroSideP}</p>
            <div className={styles.singleNote}>
              {c.singleNoteText1} <strong>{c.singleNoteText2}</strong>
            </div>
          </aside>
        </div>
      </section>

      <main className={styles.page}>
        <article className={styles.article}>
          <section className={styles.introGrid}>
            <p className={styles.lede}>{c.lede}</p>

            <div className={styles.summaryCard}>
              <div className={styles.mini}>{c.summaryMini}</div>
              <ul className={styles.summaryList}>
                {c.summaryItems.map((item, idx) => (
                  <li key={idx} className={styles.summaryItem}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <div className={styles.featureImage}>
            <img
              src="https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&q=80&w=1200"
              alt="Saigon coffee"
              className={styles.featureImgElement}
            />
            <div className={styles.featureCaption}>{c.featureCaption}</div>
          </div>

          <section className={styles.contentSection} id="s1">
            <div className={styles.sectionIndex}>{c.s1Index}</div>
            <h2 className={styles.sectionTitle}>{c.s1Title}</h2>

            <div className={styles.twocol}>
              <div>
                <p className={styles.contentP}>{c.s1P1}</p>
                <p className={styles.contentP}>{c.s1P2}</p>

                <div className={styles.quoteBlock}>
                  <p className={styles.quote}>"{c.s1Quote}"</p>
                  <div className={styles.source}>{c.s1Source}</div>
                </div>
              </div>

              <aside className={styles.sideNote}>
                <div className={styles.mini}>{c.s1SideNoteMini}</div>
                {c.s1SideNoteText}
              </aside>
            </div>
          </section>

          <section className={styles.contentSection} id="s2">
            <div className={styles.sectionIndex}>{c.s2Index}</div>
            <h2 className={styles.sectionTitle}>{c.s2Title}</h2>
            <p className={styles.contentP}>{c.s2P1}</p>
            <p className={styles.contentP}>{c.s2P2}</p>
          </section>

          <div className={styles.pullHighlight}>
            <div className={styles.mini}>{c.pullHighlightMini}</div>
            <p className={styles.big}>{c.pullHighlightText}</p>
          </div>

          <section className={styles.contentSection} id="s3">
            <div className={styles.sectionIndex}>{c.s3Index}</div>
            <h2 className={styles.sectionTitle}>{c.s3Title}</h2>
            <p className={styles.contentP}>{c.s3P1}</p>
            <p className={styles.contentP}>{c.s3P2}</p>

            <div className={styles.askCard}>
              <div>
                <div className={styles.mini}>{c.askCardMini}</div>
                <h3 className={styles.askCardTitle}>{c.askCardTitle}</h3>
                <p className={styles.askCardP}>{c.askCardP}</p>
              </div>
              <div className={styles.action}>{c.askCardAction}</div>
            </div>
          </section>

          <section className={styles.related}>
            <div className={styles.relatedTop}>
              <div>
                <div className={styles.sectionIndex} style={{ marginBottom: '10px' }}>
                  {c.relatedContinue}
                </div>
                <h2 className={styles.sectionTitle}>{c.relatedTitle}</h2>
              </div>
              <p className={styles.contentP}>{c.relatedP}</p>
            </div>

            <div className={styles.relatedGrid}>
              <a className={styles.relatedCard} href="#">
                <div className={styles.tag}>{c.r1Tag}</div>
                <h3 className={styles.relatedCardTitle}>{c.r1Title}</h3>
                <div className={styles.time}>{c.r1Time}</div>
              </a>

              <a className={styles.relatedCard} href="#">
                <div className={styles.tag}>{c.r2Tag}</div>
                <h3 className={styles.relatedCardTitle}>{c.r2Title}</h3>
                <div className={styles.time}>{c.r2Time}</div>
              </a>

              <a className={styles.relatedCard} href="#">
                <div className={styles.tag}>{c.r3Tag}</div>
                <h3 className={styles.relatedCardTitle}>{c.r3Title}</h3>
                <div className={styles.time}>{c.r3Time}</div>
              </a>
            </div>
          </section>
        </article>
      </main>
    </div>
  );
}
