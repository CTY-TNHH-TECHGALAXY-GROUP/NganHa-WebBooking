'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './BlogsPage.module.css';

const BlogsPage = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', lead: '', meta: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('');

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

  return (
    <div className={styles.blogContainer}>
      <div className={styles.progress} style={{ width: `${scrollProgress}%` }}></div>
      <nav className={styles.nav}>
        <div className={styles.brand}><b>ORIA</b><span>Knowledge</span></div>
        <div className={styles.navlinks}>
          <a className={styles.active} href="#discover">Discover</a>
          <a href="#field">Field Notes</a>
          <a href="#city">City Guide</a>
          <a href="#">VI / EN</a>
          <a className={styles.book} href="#">Book</a>
        </div>
      </nav>

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
            {['Ăn tối ở Quận 1', 'Một buổi chiều yên tĩnh', 'Đi đâu sau 9PM', 'Local, không touristy'].map(q => (
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
          <div className={styles['media-label']}>
            <strong>SGN</strong>
            <small>A curated guide by Oria Spa.</small>
          </div>
        </div>
      </header>

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
            <div key={i.n} className={styles.intent} onClick={() => openStory(i.t, 'Quick intent filtering in progress...', 'Discovery')}>
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
            onClick={() => openStory('Người Sài Gòn uống cafe thế nào?', 'Sài Gòn có 3 kiểu uống cafe: để bắt đầu ngày, để bàn việc và để trốn việc. Biết mình muốn gì sẽ giúp bạn chọn đúng quán.', 'Coffee Culture|Saigon')}
          >
            <img src="https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=2787&auto=format&fit=crop" alt="Cafe" />
            <div className={styles.scrim}></div>
            <div className={styles['story-copy']}>
              <div className={styles.tag}>Culture lens</div>
              <h3>Người Sài Gòn uống cafe thế nào?</h3>
              <p>Một chỉ dẫn thực tế về văn hoá cà phê không nằm ở hạt gì hay pha bằng máy nào, mà là bạn ngồi với ai và vào lúc mấy giờ.</p>
            </div>
          </article>
          <div className={styles['side-stack']}>
            <article 
              className={`${styles['note-card']} ${styles['open-story']}`} 
              onClick={() => openStory('5 dấu hiệu một quán cafe phù hợp để ngồi lâu', 'Không gian đẹp chưa chắc ngồi lâu được. Hãy nhìn vào ánh sáng, âm học, khoảng cách bàn, ổ cắm và nhịp phục vụ.', '3 min read|Cafe|Quick Answer')}
            >
              <div className={styles.top}><span>Quick answer</span><span>03 min</span></div>
              <strong>How to tell if a café is actually good for a slow afternoon.</strong>
            </article>
            <article 
              className={`${styles['note-card']} ${styles['open-story']}`}
              onClick={() => openStory('Sau massage nên ăn gì?', 'Không cần một danh sách cứng nhắc. Hãy ưu tiên cảm giác nhẹ, đủ nước và bữa ăn phù hợp với thời điểm trong ngày.', '4 min read|Wellness|Practical')}
            >
              <div className={styles.top}><span>Wellness</span><span>04 min</span></div>
              <strong>After a massage: what feels better than a heavy meal?</strong>
            </article>
            <article 
              className={`${styles['note-card']} ${styles['open-story']}`}
              onClick={() => openStory('Quận 1 không chỉ có phố đi bộ', 'Tách Quận 1 thành những micro-area nhỏ sẽ giúp người mới hiểu trung tâm dễ hơn: Đồng Khởi, Nguyễn Huệ, Bến Thành, Đa Kao…', '6 min read|City Lens|District 1')}
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
              { time: '90 min', title: 'Nếu chỉ có 90 phút ở trung tâm?', lead: 'Một route ngắn, dễ đi bộ, không cần chạy theo checklist.', meta: '90 min|Central HCMC|Quick Plan' },
              { time: 'Food', title: 'Muốn ăn local nhưng ngại chọn nhầm?', lead: '3 tín hiệu thực tế để nhìn quán trước khi bước vào.', meta: 'Food|Local Lens|Quick Answer' },
              { time: 'After spa', title: 'Đi đâu tiếp mà không phá mood thư giãn?', lead: 'Từ spa → dinner → drink theo cùng một nhịp.', meta: 'After Spa|Mood|Nearby' },
              { time: 'Rain', title: 'Sài Gòn mưa thì nên đổi plan thế nào?', lead: 'Plan B không phải là “ở khách sạn”.', meta: 'Rain|City Guide|Plan B' }
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
            onClick={() => openStory('Sài Gòn về đêm không chỉ là nightlife', 'Sau 6PM, thành phố đổi nhịp theo từng khu: nơi ăn, nơi đi bộ, nơi ngồi lâu và nơi chỉ nên ghé nhanh.', 'Night|City Guide|12 stories')}
          >
            <img src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?q=80&w=2940&auto=format&fit=crop" alt="Night" />
            <div className={styles.txt}><small>Night · 12 stories</small><strong>HCMC after 6 PM</strong></div>
          </article>
          <article 
            className={`${styles['city-card']} ${styles.c2} ${styles['open-story']}`}
            onClick={() => openStory('Không gian cafe: đọc kiến trúc để chọn trải nghiệm', 'Kiến trúc, ánh sáng và mật độ chỗ ngồi thường tiết lộ quán phù hợp để trò chuyện, làm việc hay ngồi một mình.', 'Architecture|Coffee|Visual Guide')}
          >
            <img src="https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2947&auto=format&fit=crop" alt="Architecture" />
            <div className={styles.txt}><small>Architecture · Coffee</small><strong>Spaces worth noticing</strong></div>
          </article>
          <article 
            className={`${styles.minicard} ${styles.c3} ${styles['open-story']}`}
            onClick={() => openStory('Budget lens: 100k / 300k / 1m', "Thay vì chia theo 'cheap' hay 'luxury', Oria Knowledge cho người dùng một khung ngân sách thực tế theo từng kiểu trải nghiệm.", 'Budget|Food|City Lens')}
          >
            <span>Budget lens</span><strong>100k / 300k / 1m — what changes?</strong>
          </article>
          <article 
            className={`${styles.minicard} ${styles.c4} ${styles['open-story']}`}
            onClick={() => openStory('Micro-neighborhood: Đồng Khởi', 'Một khu phố có thể được hiểu qua 4 lớp: ăn uống, kiến trúc, nhịp đi bộ và những khoảng nghỉ.', 'Đồng Khởi|District 1|Neighborhood')}
          >
            <span>Micro neighborhood</span><strong>Đồng Khởi in 4 layers.</strong>
          </article>
          <article 
            className={`${styles.minicard} ${styles.c5} ${styles['open-story']}`}
            onClick={() => openStory('Local etiquette', 'Những quy tắc nhỏ giúp trải nghiệm tự nhiên hơn: gọi món, tip, giờ cao điểm, cách hỏi và cách tránh những hiểu lầm phổ biến.', 'Etiquette|Vietnam|Essentials')}
          >
            <span>Local intelligence</span><strong>Small things visitors usually learn too late.</strong>
          </article>
          <article 
            className={`${styles.minicard} ${styles.c6} ${styles['open-story']}`}
            onClick={() => openStory('Wellness in the city', 'Wellness không chỉ là spa. Đó còn là cách bạn sắp xếp nhịp di chuyển, bữa ăn, caffeine, thời gian nghỉ và giấc ngủ trong chuyến đi.', 'Wellness|City|Oria')}
          >
            <span>Wellness lens</span><strong>A calmer way to experience Saigon.</strong>
          </article>
        </div>
      </section>

      <footer className={styles.footer}>
        <div><div className={styles.eyebrow}>Oria Knowledge</div><h2>Know more.<br/>Choose better.</h2></div>
        <div className={styles.right}>
          <div>Food · City · Wellness · Culture · Local Intelligence</div>
          <small>Concept demo — TECHGALAXY GROUP / ORIA</small>
        </div>
      </footer>

      {isModalOpen && (
        <div className={`${styles.modal} ${styles.open}`} id="modal" onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}>
          <div className={styles['modal-card']}>
            <button className={styles.close} id="close" onClick={closeModal}>×</button>
            <div className={styles.eyebrow} id="modalMeta">{modalContent.meta}</div>
            <h3 id="modalTitle">{modalContent.title}</h3>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsPage;
