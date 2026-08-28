/* eslint-disable */
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './BlogsPage.module.css';
import AskOriaAnswer from './AskOriaAnswer';
import SaigonCoffeeArticle from './SaigonCoffeeArticle';
import DiscoveryIntentPage from './DiscoveryIntentPage';
import { insightfulArticles } from '../../data/InsightfulArticles';

const BlogsPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', lead: '', meta: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('');
  const [showCoffeeArticle, setShowCoffeeArticle] = useState(false);
  const [activeDiscoveryIntent, setActiveDiscoveryIntent] = useState('');
  // Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const scrollPx = document.documentElement.scrollTop;
      const winHeightPx = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = `${(scrollPx / winHeightPx) * 100}%`;
      setScrollProgress((scrollPx / winHeightPx) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openStory = (title: string, lead: string, meta: string) => {
    if (title === 'Người Sài Gòn uống cafe thế nào?' || title === 'How Saigon drinks coffee.') {
      setShowCoffeeArticle(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setModalContent({
      title: title || 'Oria Knowledge',
      lead: lead || '',
      meta: (meta || 'Knowledge').split('|').join(' · '),
    });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = '';
  };

  const handleChipClick = (query: string) => {
    setActiveChip(query);
    setSearchQuery(query);
  };

  const handleSearch = () => {
    const q = searchQuery.trim() || 'Tối nay nên đi đâu?';
    setModalContent({
      title: q,
      lead: 'Demo AI-style knowledge response: câu trả lời bắt đầu từ nhu cầu của người dùng, sau đó dẫn tới bài viết, local guide và các knowledge cards liên quan.',
      meta: 'ASK ORIA · KNOWLEDGE RESPONSE',
    });
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  if (showCoffeeArticle) {
    return <SaigonCoffeeArticle onBack={() => setShowCoffeeArticle(false)} />;
  }

  return (
    <div className={styles.blogContainer}>

      <div className={styles.progress} style={{ width: `${scrollProgress}%` }}></div>

      <header className={styles.hero}>
        <div>
          <div className={styles.kicker}>Knowledge, not just content</div>
          <h1>Saigon,<br/>explained.</h1>
          <p className={styles['hero-copy']}>Không phải một trang blog để “đọc cho biết”. Đây là nơi biến những câu hỏi rất đời thường thành kiến thức có thể dùng ngay — ăn ở đâu, đi lúc nào, chọn khu vực nào, vì sao nơi đó đáng thử.</p>
          <div className={styles.ask}>
            <span>Ask Oria</span>
            <input 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Tối nay nên ăn gì ở Quận 1?"
            />
            <button aria-label="ask" onClick={handleSearch}>→</button>
          </div>
          <div className={styles.quick}>
            {['Quanh Oria Spa', 'Ăn tối ở Quận 1', 'Một buổi chiều yên tĩnh', 'Đi đâu sau 9PM', 'Local, không touristy'].map(q => (
              <button 
                key={q}
                className={`${styles.chip} ${activeChip === q ? styles.active : ''}`} 
                onClick={() => handleChipClick(q)}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className={styles['hero-media']}>
          <img src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2940&auto=format&fit=crop" alt="Saigon" />
          <div className={styles['media-watermark']}></div>
          <div className={styles['media-label']}>
            <strong>SGN</strong>
            <small>A curated guide by Oria Spa.</small>
          </div>
        </div>
      </header>

      {activeChip ? (
        <AskOriaAnswer 
          topic={activeChip} 
          onBack={() => {
            setActiveChip('');
            setSearchQuery('');
          }} 
        />
      ) : activeDiscoveryIntent ? (
        <DiscoveryIntentPage 
          topic={activeDiscoveryIntent}
          onBack={() => setActiveDiscoveryIntent('')}
        />
      ) : (
        <>
          <section className={styles.section} id="discover">
            <div className={styles['section-head']}>
              <div>
                <div className={styles.eyebrow}>Discovery</div>
                <h2>What are you looking for?</h2>
              </div>
              <p className={styles['section-intro']}>Không chia theo chuyên mục bài viết. Oria Knowledge được tổ chức theo ý định (intent) của bạn lúc này.</p>
            </div>
            <div className={styles['intent-rail']}>
              {[
                { n: '01', t: 'I need a place to eat.' },
                { n: '02', t: 'I want to sit somewhere quiet.' },
                { n: '03', t: 'I have 2 hours to kill.' },
                { n: '04', t: 'Take me somewhere local.' },
                { n: '05', t: 'I want to walk around.' },
                { n: '06', t: 'I need to buy something.' }
              ].map(i => (
                <div key={i.n} className={styles.intent} onClick={() => setActiveDiscoveryIntent(i.t)}>
                  <div className={styles.num}>{i.n}</div>
                  <strong>{i.t}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section} id="field">
            <div className={styles['section-head']}>
              <div><div className={styles.eyebrow}>Featured Notes</div><h2>How to read the city.</h2></div>
            </div>
            <div className={styles['feature-grid']}>
              <article 
                className={`${styles['story-main']} ${styles['open-story']}`}
                onClick={() => openStory('How Saigon Drinks Coffee', 'A practical guide to coffee culture: it\'s not about the bean or the machine, but who you sit with and how you watch the street.', 'Coffee Culture|Saigon')}
              >
                <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2787&auto=format&fit=crop" alt="Cafe" />
                <div className={styles['media-watermark']}></div>
                <div className={styles.scrim}></div>
                <div className={styles['story-copy']}>
                  <div className={styles.tag}>Culture lens</div>
                  <h3>How Saigon Drinks Coffee</h3>
                  <p>A practical guide to coffee culture: it's not about the bean or the machine, but who you sit with and how you watch the street.</p>
                </div>
              </article>
              <div className={styles['side-stack']}>
                <article 
                  className={`${styles['note-card']} ${styles['open-story']}`} 
                  onClick={() => openStory('How to tell if a café is actually good for a slow afternoon', 'Aesthetics are not enough. Look at the acoustics, ergonomics, lighting, and the pace of the staff to find true quiet.', '3 min read|Cafe|Quick Answer')}
                >
                  <div className={styles.top}><span>Quick answer</span><span>03 min</span></div>
                  <strong>How to tell if a café is actually good for a slow afternoon.</strong>
                </article>
                <article 
                  className={`${styles['note-card']} ${styles['open-story']}`}
                  onClick={() => openStory('After a massage: what feels better than a heavy meal?', 'Don\'t shock your system. Prioritize warm broths, fresh spring rolls, and light meals to maintain your relaxed state.', '4 min read|Wellness|Practical')}
                >
                  <div className={styles.top}><span>Wellness</span><span>04 min</span></div>
                  <strong>After a massage: what feels better than a heavy meal?</strong>
                </article>
                <article 
                  className={`${styles['note-card']} ${styles['open-story']}`}
                  onClick={() => openStory('District 1 is not a single neighbourhood', 'Breaking D1 into micro-areas helps you navigate the city better: the Financial strip, the Japanese Quarter, Da Kao, and more.', '6 min read|City Lens|District 1')}
                >
                  <div className={styles.top}><span>City lens</span><span>06 min</span></div>
                  <strong>District 1 is not one neighborhood.</strong>
                </article>
              </div>
            </div>
          </section>

          <section className={styles.insight}>
            <div className={styles['insight-wrap']}>
              <div>
                <div className={styles.eyebrow} style={{color: '#aaa'}}>Oria quick intelligence</div>
                <h2>Answers<br/>before<br/>articles.</h2>
              </div>
              <div className={styles['insight-panel']}>
                {[
                  { time: '90 MIN', title: 'Only 90 minutes in central Saigon?', lead: 'Don’t see more. Learn to read one part of the city.', meta: '90 MIN|Central HCMC|Quick Plan' },
                  { time: 'FOOD', title: 'Want to eat local but worried about choosing wrong?', lead: 'Authenticity is easier to recognize when you stop looking for how it should look.', meta: 'FOOD|Local Lens|Quick Answer' },
                  { time: 'AFTER SPA', title: 'Where next without breaking the relaxed mood?', lead: 'Let the city return gradually instead of rushing back into it.', meta: 'AFTER SPA|Mood|Nearby' },
                  { time: 'RAIN', title: 'It’s raining in Saigon. Change the plan?', lead: 'Make the city smaller, not the day shorter.', meta: 'RAIN|City Guide|Plan B' }
                ].map(item => (
                  <div 
                    key={item.title} 
                    className={`${styles['answer-row']} ${styles['open-story']}`} 
                    onClick={() => openStory(item.title, item.lead, item.meta)}
                  >
                    <div className={styles.time}>{item.time}</div>
                    <div><strong>{item.title}</strong><p>{item.lead}</p></div>
                    <div className={styles.arrow}>↗</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className={styles.section} id="city">
            <div className={styles['section-head']}>
              <div><div className={styles.eyebrow}>Explore the city by layers</div><h2>One city. Many lenses.</h2></div>
              <p className={styles['section-intro']}>Mỗi card là một “lens” để nhìn thành phố: theo thời gian, khu vực, ngân sách, nhịp sống hoặc mục đích.</p>
            </div>
            <div className={styles['city-grid']}>
              <article 
                className={`${styles['city-card']} ${styles.c1} ${styles['open-story']}`}
                onClick={() => openStory('HCMC after 6 PM', 'Saigon does not become a different city after 6 PM. It simply becomes more visible. In the evening, people begin using the streets for something else.', 'Night|How the city changes')}
              >
                <img src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2940&auto=format&fit=crop" alt="Night" />
                <div className={styles['media-watermark']}></div>
                <div className={styles.txt}><small>Night · 12 stories</small><strong>HCMC after 6 PM</strong></div>
              </article>
              <article 
                className={`${styles['city-card']} ${styles.c2} ${styles['open-story']}`}
                onClick={() => openStory('Spaces worth noticing', 'Saigon often hides its best spaces badly. That is part of the charm. A narrow staircase may lead to a carefully designed café.', 'Architecture|Coffee|Hidden City')}
              >
                <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2947&auto=format&fit=crop" alt="Architecture" />
                <div className={styles['media-watermark']}></div>
                <div className={styles.txt}><small>Architecture · Coffee</small><strong>Spaces worth noticing</strong></div>
              </article>
              <article 
                className={`${styles.minicard} ${styles.c3} ${styles['open-story']}`}
                onClick={() => openStory('100k / 300k / 1m: what actually changes?', 'One of the easiest ways to misunderstand Saigon is to treat price as a measure of authenticity. It is not.', 'Budget Lens|How to read price')}
              >
                <span>Budget lens</span><strong>100k / 300k / 1m: what changes?</strong>
              </article>
              <article 
                className={`${styles.minicard} ${styles.c4} ${styles['open-story']}`}
                onClick={() => openStory('Đồng Khởi in 4 layers', 'Visitors often treat Đồng Khởi as a road between landmarks. It is more useful to treat it as a compressed history of central Saigon.', 'Micro neighborhood|How to read one street')}
              >
                <span>Micro neighborhood</span><strong>Đồng Khởi in 4 layers.</strong>
              </article>
              <article 
                className={`${styles.minicard} ${styles.c5} ${styles['open-story']}`}
                onClick={() => openStory('Small things visitors usually learn too late', 'Most problems visitors have in Saigon are not caused by big cultural differences. They come from small misunderstandings.', 'Local intelligence|How the city actually works')}
              >
                <span>Local intelligence</span><strong>Small things visitors usually learn too late.</strong>
              </article>
              <article 
                className={`${styles.minicard} ${styles.c6} ${styles['open-story']}`}
                onClick={() => openStory('A calmer way to experience Saigon', 'Saigon can feel overwhelming if you try to experience it at the same speed that it moves. You do not need to.', 'Wellness lens|How not to get tired of the city')}
              >
                <span>Wellness lens</span><strong>A calmer way to experience Saigon.</strong>
              </article>
            </div>
          </section>
        </>
      )}

      <footer className={styles.footer}>
        <div><div className={styles.eyebrow}>Oria Knowledge</div><h2>Know more.<br/>Choose better.</h2></div>
        <div className={styles.right}>
          <div>Food · City · Wellness · Culture · Local Intelligence</div>
          <small>Concept demo — TECHGALAXY GROUP / ORIA</small>
        </div>
      </footer>

      {isModalOpen && (
        <div className={`${styles.modal} ${styles.open}`} id="modal" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles['modal-card']} style={{ overflowY: 'auto', maxHeight: '90vh' }}>
            <button className={styles.close} id="close" onClick={closeModal}>×</button>
            <div className={styles.eyebrow} id="modalMeta">{modalContent.meta}</div>
            <h3 id="modalTitle">{modalContent.title}</h3>
            
            {insightfulArticles[modalContent.title] ? (
              <div 
                className={styles.articleContent} 
                style={{ marginTop: '24px', lineHeight: '1.7', color: '#444' }}
                dangerouslySetInnerHTML={{ __html: insightfulArticles[modalContent.title] }} 
              />
            ) : (
              <>
                <p className={styles.lead} id="modalLead">{modalContent.lead}</p>
                <div className={styles.facts}>
                  <div className={styles.fact}><b>Short answer</b><br/>Đọc 20 giây vẫn lấy được giá trị.</div>
                  <div className={styles.fact}><b>Why it matters</b><br/>Giải thích logic, không chỉ liệt kê.</div>
                  <div className={styles.fact}><b>Go deeper</b><br/>Mở rộng khi người dùng muốn biết thêm.</div>
                </div>
                <h4>How this article is structured</h4>
                <p>Phần đầu luôn trả lời trực tiếp câu hỏi. Phần tiếp theo giải thích “vì sao”, sau đó mới đưa lựa chọn, bối cảnh và những lưu ý thực tế. Đây là cách biến blog thành một hệ thống kiến thức có thể tra cứu — không chỉ là nội dung để lướt.</p>
                <h4>Field note</h4>
                <p>Thông tin có thể được gắn theo khu vực, thời gian trong ngày, mức ngân sách, mood, khoảng cách từ Oria và đối tượng phù hợp. Khi dữ liệu đủ nhiều, cùng một bài có thể xuất hiện ở nhiều “lens” khác nhau mà không cần tạo menu category cứng.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
