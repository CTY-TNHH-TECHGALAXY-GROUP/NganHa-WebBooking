'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import { type BlogCard, resolveBlogContent } from './blogContent';
import styles from './BlogsPage.module.css';

type PublishedPost = {
  id: string;
  slug: string;
  title: Record<string, string>;
  excerpt: Record<string, string>;
  content: Record<string, string>;
  cover_image: string | null;
  cover_type?: 'image' | 'video' | null;
  category_i18n?: Record<string, string>;
  read_time_i18n?: Record<string, string>;
  cover_alt?: Record<string, string>;
};

const localized = (value: Record<string, string> | undefined, lang: string, fallback = '') =>
  value?.[lang] || value?.en || value?.vi || fallback;

const normalizeArticleText = (value: string) => value
  .replace(/\r\n?/g, '\n')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<li[^>]*>/gi, '\n• ')
  .replace(/<\/(p|div|h[1-6]|blockquote|ul|ol)>/gi, '\n\n')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#0?39;/gi, "'")
  .trim();

const ArticleBody = ({ body }: { body: string }) => {
  const paragraphs = normalizeArticleText(body).split(/\n\s*\n+/).filter(Boolean);
  return (
    <div className={styles.articleContent}>
      {paragraphs.map((paragraph, index) => <p key={`${index}-${paragraph.slice(0, 24)}`}>{paragraph}</p>)}
    </div>
  );
};

const BlogCardView = ({ card, className, onOpen }: { card: BlogCard; className: string; onOpen: (card: BlogCard) => void }) => (
  <article className={`${className} ${styles['open-story']}`} onClick={() => onOpen(card)}>
    {card.image && <img src={card.image} alt="" />}
    <div className={styles['media-watermark']} />
    <div className={styles.scrim} />
    <div className={styles['story-copy']}>
      <div className={styles.tag}>{card.eyebrow}</div>
      <h3>{card.title}</h3>
      <p>{card.body}</p>
    </div>
  </article>
);

const BlogsPage = () => {
  const { currentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const content = useMemo(() => resolveBlogContent(systemSettings?.blog_content, currentLang as any), [currentLang, systemSettings?.blog_content]);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState('');
  const [activeStory, setActiveStory] = useState<BlogCard | null>(null);
  const [posts, setPosts] = useState<PublishedPost[]>([]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      setScrollProgress(max > 0 ? (window.scrollY / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    fetch('/api/posts')
      .then((response) => response.ok ? response.json() : [])
      .then((data) => setPosts(Array.isArray(data) ? data : []))
      .catch(() => setPosts([]));
  }, []);

  const openStory = (card: BlogCard) => {
    setActiveStory(card);
    document.body.style.overflow = 'hidden';
  };
  const closeStory = () => {
    setActiveStory(null);
    document.body.style.overflow = '';
  };
  const ask = () => openStory({ id: 'ask', eyebrow: content.hero.askLabel, title: searchQuery.trim() || content.hero.quickPrompts[0], body: content.hero.body, meta: content.hero.askLabel });

  return (
    <div className={styles.blogContainer}>
      <div className={styles.progress} style={{ width: `${scrollProgress}%` }} />
      <header className={styles.hero}>
        <div>
          <div className={styles.kicker}>{content.hero.kicker}</div>
          <h1>{content.hero.title.split('\n').map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}</h1>
          <p className={styles['hero-copy']}>{content.hero.body}</p>
          <div className={styles.ask}>
            <span>{content.hero.askLabel}</span>
            <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder={content.hero.askPlaceholder} />
            <button aria-label={content.hero.askLabel} onClick={ask}>→</button>
          </div>
          <div className={styles.quick}>
            {content.hero.quickPrompts.map((prompt) => <button key={prompt} className={`${styles.chip} ${activeChip === prompt ? styles.active : ''}`} onClick={() => { setActiveChip(prompt); setSearchQuery(prompt); }}>{prompt}</button>)}
          </div>
        </div>
        <div className={styles['hero-media']}>
          <img src={content.hero.image} alt="Saigon" />
          <div className={styles['media-watermark']} />
          <div className={styles['media-label']}><strong>SGN</strong><small>{content.hero.mediaLabel}</small></div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles['section-head']}><div><div className={styles.eyebrow}>{content.discovery.eyebrow}</div><h2>{content.discovery.title}</h2></div><p className={styles['section-intro']}>{content.discovery.intro}</p></div>
        <div className={styles['intent-rail']}>
          {content.discovery.intents.map((intent) => <div key={intent.id} className={styles.intent} onClick={() => openStory(intent)}><div className={styles.num}>{intent.eyebrow}</div><strong>{intent.title}</strong></div>)}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles['section-head']}><div><div className={styles.eyebrow}>{content.featured.eyebrow}</div><h2>{content.featured.title}</h2></div></div>
        <div className={styles['feature-grid']}>
          {content.featured.cards.slice(0, 1).map((card) => <BlogCardView key={card.id} card={card} className={styles['story-main']} onOpen={openStory} />)}
          <div className={styles['side-stack']}>
            {content.featured.cards.slice(1).map((card) => <article key={card.id} className={`${styles['note-card']} ${styles['open-story']}`} onClick={() => openStory(card)}><div className={styles.top}><span>{card.eyebrow}</span><span>{card.meta}</span></div><strong>{card.title}</strong></article>)}
          </div>
        </div>
      </section>

      <section className={styles.insight}><div className={styles['insight-wrap']}><div><div className={styles.eyebrow} style={{ color: '#aaa' }}>{content.insight.eyebrow}</div><h2>{content.insight.title.split('\n').map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}</h2></div><div className={styles['insight-panel']}>
        {content.insight.cards.map((card) => <div key={card.id} className={`${styles['answer-row']} ${styles['open-story']}`} onClick={() => openStory(card)}><div className={styles.time}>{card.eyebrow}</div><div><strong>{card.title}</strong><p>{card.body}</p></div><div className={styles.arrow}>↗</div></div>)}
      </div></div></section>

      <section className={styles.section}><div className={styles['section-head']}><div><div className={styles.eyebrow}>{content.city.eyebrow}</div><h2>{content.city.title}</h2></div><p className={styles['section-intro']}>{content.city.intro}</p></div><div className={styles['city-grid']}>
        {content.city.cards.map((card, index) => <article key={card.id} className={`${index < 2 ? styles['city-card'] : styles.minicard} ${styles['open-story']} ${styles[`c${index + 1}`] || ''}`} onClick={() => openStory(card)}>{card.image && <img src={card.image} alt="" />}<div className={styles['media-watermark']} /><div className={styles.txt}><small>{card.eyebrow} · {card.meta}</small><strong>{card.title}</strong></div></article>)}
      </div></section>

      <section className={styles.section} aria-labelledby="latest-from-oria"><div className={styles['section-head']}><div><div className={styles.eyebrow}>{content.latest.eyebrow}</div><h2 id="latest-from-oria">{content.latest.title}</h2></div></div><div className={styles.latestGrid}>
        {posts.map((post) => { const category = localized(post.category_i18n, currentLang, content.latest.eyebrow); const readTime = localized(post.read_time_i18n, currentLang, content.latest.minutes); const title = localized(post.title, currentLang); const excerpt = localized(post.excerpt, currentLang); const imageAlt = localized(post.cover_alt, currentLang, title); return <article key={post.id} className={`${styles.latestCard} ${styles['open-story']}`} onClick={() => openStory({ id: post.id, eyebrow: category, title, body: localized(post.content, currentLang, excerpt), meta: readTime, image: post.cover_image || undefined })}><div className={styles.latestMedia}>{post.cover_image && (post.cover_type === 'video' ? <video src={post.cover_image} muted playsInline preload="metadata" aria-label={imageAlt} /> : <img src={post.cover_image} alt={imageAlt} />)}</div><div className={styles.latestScrim} /><div className={styles.latestCopy}><small>{category} · {readTime}</small><h3>{title}</h3>{excerpt && <p>{excerpt}</p>}</div></article>; })}
      </div>{posts.length === 0 && <p className={styles['section-intro']}>{content.latest.empty}</p>}</section>

      <footer className={styles.footer}><div><div className={styles.eyebrow}>{content.footer.eyebrow}</div><h2>{content.footer.title.split('\n').map((line) => <React.Fragment key={line}>{line}<br /></React.Fragment>)}</h2></div><div className={styles.right}><div>{content.footer.topics}</div><small>{content.footer.credit}</small></div></footer>

      {activeStory && <div className={`${styles.modal} ${styles.open}`} onClick={(event) => { if (event.target === event.currentTarget) closeStory(); }}><div className={styles['modal-card']}><button type="button" className={`${styles.close} ${activeStory.image ? styles.closeOnMedia : ''}`} onClick={closeStory} aria-label="Close">×</button>{activeStory.image ? <div className={styles.articleHero}><img src={activeStory.image} alt="" /><div className={styles.articleHeroScrim} /><div className={styles.articleHeroCopy}><div>{activeStory.eyebrow} · {activeStory.meta}</div><h3>{activeStory.title}</h3></div></div> : <><div className={styles.eyebrow}>{activeStory.eyebrow} · {activeStory.meta}</div><h3>{activeStory.title}</h3></>}<ArticleBody body={activeStory.body} /><button type="button" className={styles.chip} onClick={closeStory}>{content.latest.readMore} <ArrowUpRight size={14} /></button></div></div>}
    </div>
  );
};

export default BlogsPage;
