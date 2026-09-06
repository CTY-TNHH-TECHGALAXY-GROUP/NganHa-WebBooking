'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Eye, FileText, ImageIcon, Plus, Save, Trash2 } from 'lucide-react';
import { DEFAULT_BLOG_CONTENT, type BlogCard, type BlogLocaleContent } from '@/components/Blogs/blogContent';
import type { Locale } from '@/lib/constants';

const LANGUAGES: Array<{ code: Locale; label: string; flag: string }> = [
  { code: 'vi', label: 'Tieng Viet', flag: 'VN' },
  { code: 'en', label: 'English', flag: 'EN' },
  { code: 'cn', label: 'Zhongwen', flag: 'ZH' },
  { code: 'jp', label: 'Nihongo', flag: 'JP' },
  { code: 'kr', label: 'Hangugeo', flag: 'KR' },
];

const SECTIONS = [
  { id: 'hero', label: 'Hero' },
  { id: 'discovery', label: 'Kham pha' },
  { id: 'featured', label: 'Featured' },
  { id: 'insight', label: 'Quick intelligence' },
  { id: 'city', label: 'City lenses' },
  { id: 'latest', label: 'Bai viet moi' },
  { id: 'footer', label: 'Footer' },
] as const;

type SectionId = (typeof SECTIONS)[number]['id'];
type CardSection = Extract<SectionId, 'discovery' | 'featured' | 'insight' | 'city'>;
type LocaleMap = Record<Locale, BlogLocaleContent>;

const cloneLocale = (locale: Locale) => structuredClone(DEFAULT_BLOG_CONTENT[locale]);

function mergeLocale(source: unknown, locale: Locale): BlogLocaleContent {
  const fallback = cloneLocale(locale);
  if (!source || typeof source !== 'object') return fallback;
  const next = source as Partial<BlogLocaleContent>;
  return {
    ...fallback,
    ...next,
    hero: { ...fallback.hero, ...next.hero, quickPrompts: next.hero?.quickPrompts || fallback.hero.quickPrompts },
    discovery: { ...fallback.discovery, ...next.discovery, intents: next.discovery?.intents || fallback.discovery.intents },
    featured: { ...fallback.featured, ...next.featured, cards: next.featured?.cards || fallback.featured.cards },
    insight: { ...fallback.insight, ...next.insight, cards: next.insight?.cards || fallback.insight.cards },
    city: { ...fallback.city, ...next.city, cards: next.city?.cards || fallback.city.cards },
    latest: { ...fallback.latest, ...next.latest },
    footer: { ...fallback.footer, ...next.footer },
  };
}

function mergeContent(source: unknown): LocaleMap {
  const stored = source && typeof source === 'object' ? source as Partial<Record<Locale, unknown>> : {};
  return Object.fromEntries(LANGUAGES.map(({ code }) => [code, mergeLocale(stored[code], code)])) as LocaleMap;
}

function TextField({ label, value, onChange, placeholder = '', type = 'text' }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: 'text' | 'url' }) {
  return <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-admin-text-dim">{label}</span><input type={type} value={value || ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-admin-line-strong bg-admin-bg px-3.5 py-3 text-sm text-admin-text outline-none transition focus:border-admin-gold" /></label>;
}

function TextArea({ label, value, onChange, rows = 3, placeholder = '' }: { label: string; value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }) {
  return <label className="block space-y-2"><span className="text-xs font-bold uppercase tracking-[0.16em] text-admin-text-dim">{label}</span><textarea rows={rows} value={value || ''} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} className="w-full resize-y rounded-xl border border-admin-line-strong bg-admin-bg px-3.5 py-3 text-sm leading-6 text-admin-text outline-none transition focus:border-admin-gold" /></label>;
}

function ImagePreview({ url, alt, className = 'h-28' }: { url?: string; alt: string; className?: string }) {
  if (!url) return <div className={`flex ${className} items-center justify-center rounded-xl border border-dashed border-admin-line-strong bg-admin-bg text-admin-text-dim`}><ImageIcon size={20} /></div>;
  return <img src={url} alt={alt} className={`${className} w-full rounded-xl border border-admin-line object-cover`} />;
}

export default function BlogContentAdminPage() {
  const [content, setContent] = useState<LocaleMap>(() => mergeContent(DEFAULT_BLOG_CONTENT));
  const [activeLang, setActiveLang] = useState<Locale>('vi');
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Load failed')))
      .then((data) => setContent(mergeContent(data.blog_content)))
      .catch(() => setMessage({ type: 'error', text: 'Khong the tai noi dung Blog.' }))
      .finally(() => setLoading(false));
  }, []);

  const active = content[activeLang];
  const activeLanguage = useMemo(() => LANGUAGES.find((language) => language.code === activeLang), [activeLang]);
  const updateActive = (updater: (previous: BlogLocaleContent) => BlogLocaleContent) => {
    setContent((previous) => ({ ...previous, [activeLang]: updater(previous[activeLang]) }));
    setMessage({ type: '', text: '' });
  };
  const updateSection = <K extends SectionId>(section: K, patch: Partial<BlogLocaleContent[K]>) => {
    updateActive((previous) => ({ ...previous, [section]: { ...previous[section], ...patch } } as BlogLocaleContent));
  };

  const cardsFor = (section: CardSection): BlogCard[] => section === 'discovery' ? active.discovery.intents : active[section].cards;
  const updateCards = (section: CardSection, cards: BlogCard[]) => {
    if (section === 'discovery') {
      updateSection('discovery', { intents: cards });
      return;
    }
    updateSection(section, { cards } as Partial<BlogLocaleContent[typeof section]>);
  };
  const updateCard = (section: CardSection, index: number, patch: Partial<BlogCard>) => updateCards(section, cardsFor(section).map((card, cardIndex) => cardIndex === index ? { ...card, ...patch } : card));
  const addCard = (section: CardSection) => updateCards(section, [...cardsFor(section), { id: `card-${Date.now()}`, eyebrow: 'New note', title: 'New title', body: 'Add a short description here.', meta: 'New' }]);
  const removeCard = (section: CardSection, index: number) => updateCards(section, cardsFor(section).filter((_, cardIndex) => cardIndex !== index));
  const updatePrompt = (index: number, value: string) => updateSection('hero', { quickPrompts: active.hero.quickPrompts.map((prompt, promptIndex) => promptIndex === index ? value : prompt) });
  const removePrompt = (index: number) => updateSection('hero', { quickPrompts: active.hero.quickPrompts.filter((_, promptIndex) => promptIndex !== index) });

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blog_content: content }) });
      if (!response.ok) throw new Error('Save failed');
      setMessage({ type: 'success', text: 'Da luu noi dung Blog.' });
    } catch {
      setMessage({ type: 'error', text: 'Khong the luu noi dung Blog.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-admin-text-dim">Dang tai noi dung Blog...</div>;

  const renderCardEditor = (section: CardSection) => <div className="space-y-4">
    <div className="flex items-center justify-between gap-4"><p className="text-sm text-admin-text-dim">Moi the la mot noi dung rieng tren trang Blog.</p><button type="button" onClick={() => addCard(section)} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-admin-gold px-3.5 py-2.5 text-sm font-bold text-admin-gold"><Plus size={16} /> Them the</button></div>
    {cardsFor(section).map((card, index) => <article key={card.id} className="space-y-4 rounded-2xl border border-admin-line bg-admin-bg p-4"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.16em] text-admin-gold">The {index + 1}</span><button type="button" onClick={() => removeCard(section, index)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-admin-text-dim transition hover:bg-red-900/20 hover:text-red-400" aria-label="Xoa the"><Trash2 size={16} /></button></div><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={card.eyebrow} onChange={(value) => updateCard(section, index, { eyebrow: value })} /><TextField label="Thong tin nho" value={card.meta} onChange={(value) => updateCard(section, index, { meta: value })} /></div><TextField label="Tieu de" value={card.title} onChange={(value) => updateCard(section, index, { title: value })} /><TextArea label="Noi dung ngan" value={card.body} onChange={(value) => updateCard(section, index, { body: value })} /><div className="grid gap-4 sm:grid-cols-[1fr_180px]"><TextField label="Anh (URL, tuy chon)" type="url" value={card.image || ''} onChange={(value) => updateCard(section, index, { image: value })} placeholder="https://..." /><ImagePreview url={card.image} alt={card.title || 'Preview'} /></div></article>)}
  </div>;

  const editor: Record<SectionId, ReactNode> = {
    hero: <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={active.hero.kicker} onChange={(value) => updateSection('hero', { kicker: value })} /><TextField label="Nhan nut hoi" value={active.hero.askLabel} onChange={(value) => updateSection('hero', { askLabel: value })} /></div><TextArea label="Tieu de" value={active.hero.title} onChange={(value) => updateSection('hero', { title: value })} rows={3} /><TextArea label="Mo ta" value={active.hero.body} onChange={(value) => updateSection('hero', { body: value })} /><div className="grid gap-4 sm:grid-cols-2"><TextField label="Goi y trong o tim kiem" value={active.hero.askPlaceholder} onChange={(value) => updateSection('hero', { askPlaceholder: value })} /><TextField label="Chu thich hinh" value={active.hero.mediaLabel} onChange={(value) => updateSection('hero', { mediaLabel: value })} /></div><div className="grid gap-4 sm:grid-cols-[1fr_180px]"><TextField label="Anh Hero (URL)" type="url" value={active.hero.image} onChange={(value) => updateSection('hero', { image: value })} placeholder="https://..." /><ImagePreview url={active.hero.image} alt="Hero preview" /></div><div className="space-y-3 rounded-2xl border border-admin-line bg-admin-bg p-4"><div className="flex items-center justify-between"><span className="text-sm font-bold text-admin-text">Cau hoi goi y</span><button type="button" onClick={() => updateSection('hero', { quickPrompts: [...active.hero.quickPrompts, 'New prompt'] })} className="inline-flex items-center gap-1 text-sm font-bold text-admin-gold"><Plus size={15} /> Them</button></div>{active.hero.quickPrompts.map((prompt, index) => <div key={`${prompt}-${index}`} className="flex gap-2"><input value={prompt} onChange={(event) => updatePrompt(index, event.target.value)} className="min-w-0 flex-1 rounded-xl border border-admin-line-strong bg-admin-panel px-3 py-2.5 text-sm text-admin-text outline-none focus:border-admin-gold" /><button type="button" onClick={() => removePrompt(index)} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-admin-text-dim hover:bg-red-900/20 hover:text-red-400" aria-label="Xoa goi y"><Trash2 size={16} /></button></div>)}</div></div>,
    discovery: <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={active.discovery.eyebrow} onChange={(value) => updateSection('discovery', { eyebrow: value })} /><TextField label="Tieu de" value={active.discovery.title} onChange={(value) => updateSection('discovery', { title: value })} /></div><TextArea label="Mo dau" value={active.discovery.intro} onChange={(value) => updateSection('discovery', { intro: value })} />{renderCardEditor('discovery')}</div>,
    featured: <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={active.featured.eyebrow} onChange={(value) => updateSection('featured', { eyebrow: value })} /><TextField label="Tieu de" value={active.featured.title} onChange={(value) => updateSection('featured', { title: value })} /></div>{renderCardEditor('featured')}</div>,
    insight: <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={active.insight.eyebrow} onChange={(value) => updateSection('insight', { eyebrow: value })} /><TextField label="Tieu de" value={active.insight.title} onChange={(value) => updateSection('insight', { title: value })} /></div>{renderCardEditor('insight')}</div>,
    city: <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={active.city.eyebrow} onChange={(value) => updateSection('city', { eyebrow: value })} /><TextField label="Tieu de" value={active.city.title} onChange={(value) => updateSection('city', { title: value })} /></div><TextArea label="Mo dau" value={active.city.intro} onChange={(value) => updateSection('city', { intro: value })} />{renderCardEditor('city')}</div>,
    latest: <div className="grid gap-5 sm:grid-cols-2"><TextField label="Nhan nho" value={active.latest.eyebrow} onChange={(value) => updateSection('latest', { eyebrow: value })} /><TextField label="Tieu de" value={active.latest.title} onChange={(value) => updateSection('latest', { title: value })} /><TextField label="Nut doc bai" value={active.latest.readMore} onChange={(value) => updateSection('latest', { readMore: value })} /><TextField label="Don vi thoi gian doc" value={active.latest.minutes} onChange={(value) => updateSection('latest', { minutes: value })} /><div className="sm:col-span-2"><TextArea label="Trang thai chua co bai viet" value={active.latest.empty} onChange={(value) => updateSection('latest', { empty: value })} /></div></div>,
    footer: <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2"><TextField label="Nhan nho" value={active.footer.eyebrow} onChange={(value) => updateSection('footer', { eyebrow: value })} /><TextField label="Credit" value={active.footer.credit} onChange={(value) => updateSection('footer', { credit: value })} /></div><TextArea label="Tieu de" value={active.footer.title} onChange={(value) => updateSection('footer', { title: value })} rows={3} /><TextArea label="Chu de" value={active.footer.topics} onChange={(value) => updateSection('footer', { topics: value })} /></div>,
  };

  const previewCards = activeSection === 'discovery' ? active.discovery.intents : activeSection === 'featured' ? active.featured.cards : activeSection === 'insight' ? active.insight.cards : activeSection === 'city' ? active.city.cards : [];
  const previewTitle = activeSection === 'hero' ? active.hero.title : activeSection === 'discovery' ? active.discovery.title : activeSection === 'featured' ? active.featured.title : activeSection === 'insight' ? active.insight.title : activeSection === 'city' ? active.city.title : activeSection === 'latest' ? active.latest.title : active.footer.title;
  const previewEyebrow = activeSection === 'hero' ? active.hero.kicker : activeSection === 'discovery' ? active.discovery.eyebrow : activeSection === 'featured' ? active.featured.eyebrow : activeSection === 'insight' ? active.insight.eyebrow : activeSection === 'city' ? active.city.eyebrow : activeSection === 'latest' ? active.latest.eyebrow : active.footer.eyebrow;

  return <div className="mx-auto max-w-[1500px] space-y-6 p-6 lg:p-10"><header className="flex flex-col gap-5 rounded-2xl border border-admin-line bg-admin-panel p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><h1 className="flex items-center gap-2 text-2xl font-bold text-admin-text"><FileText className="text-admin-gold" /> Noi dung Blog</h1><p className="mt-2 text-admin-text-dim">Chinh sua tung phan cua trang Blog va xem truoc ngay ben canh, khong can dung JSON.</p></div><button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-admin-gold px-5 py-3 font-bold text-[#241804] disabled:opacity-60"><Save size={17} />{saving ? 'Dang luu...' : 'Luu thay doi'}</button></header>
    {message.text && <div className={`flex items-center gap-2 rounded-xl border p-4 ${message.type === 'success' ? 'border-admin-green-b bg-admin-green-a text-admin-green' : 'border-red-900/40 bg-red-900/20 text-red-400'}`}>{message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{message.text}</div>}
    <div className="flex flex-wrap gap-2 rounded-2xl border border-admin-line bg-admin-panel p-2">{LANGUAGES.map((language) => <button key={language.code} onClick={() => { setActiveLang(language.code); setMessage({ type: '', text: '' }); }} className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${activeLang === language.code ? 'bg-admin-gold text-[#241804]' : 'text-admin-text-dim hover:bg-admin-line'}`}><span className="mr-2 text-xs font-bold">{language.flag}</span>{language.label}</button>)}</div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]"><section className="rounded-2xl border border-admin-line bg-admin-panel shadow-sm"><div className="border-b border-admin-line p-3"><div className="flex gap-2 overflow-x-auto pb-1">{SECTIONS.map((section) => <button key={section.id} onClick={() => setActiveSection(section.id)} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold ${activeSection === section.id ? 'bg-admin-gold text-[#241804]' : 'text-admin-text-dim hover:bg-admin-line'}`}>{section.label}</button>)}</div></div><div className="space-y-5 p-5 sm:p-6"><div><h2 className="text-lg font-bold text-admin-text">{SECTIONS.find((section) => section.id === activeSection)?.label}: {activeLanguage?.label}</h2><p className="mt-1 text-sm text-admin-text-dim">Nhap noi dung truc tiep. Xuong dong trong tieu de se duoc giu tren trang web.</p></div>{editor[activeSection]}</div></section>
      <aside className="xl:sticky xl:top-6 xl:self-start"><div className="overflow-hidden rounded-2xl border border-admin-line bg-[#171411] shadow-sm"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-[#f7efd9]"><span className="inline-flex items-center gap-2 text-sm font-bold"><Eye size={16} /> Xem truoc</span><span className="text-xs text-[#c9aa70]">{activeLanguage?.label}</span></div><div className="min-h-[440px] p-5 text-[#f7efd9]">{activeSection === 'hero' ? <><div className="relative h-48 overflow-hidden rounded-xl"><ImagePreview url={active.hero.image} alt="Hero" className="h-full rounded-none border-0" /><div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" /><div className="absolute bottom-3 left-3 text-xs font-bold uppercase tracking-[0.16em] text-[#f1c976]">{active.hero.mediaLabel}</div></div><p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#d6b36d]">{active.hero.kicker}</p><h3 className="mt-3 whitespace-pre-line font-serif text-4xl leading-tight">{active.hero.title}</h3><p className="mt-4 leading-6 text-[#d4cec1]">{active.hero.body}</p><div className="mt-5 rounded-lg border border-white/15 px-3 py-3 text-sm text-[#b9b1a3]">{active.hero.askLabel}: {active.hero.askPlaceholder}</div></> : <><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d6b36d]">{previewEyebrow}</p><h3 className="mt-3 whitespace-pre-line font-serif text-4xl leading-tight">{previewTitle}</h3>{activeSection === 'discovery' && <p className="mt-3 leading-6 text-[#d4cec1]">{active.discovery.intro}</p>}{activeSection === 'city' && <p className="mt-3 leading-6 text-[#d4cec1]">{active.city.intro}</p>}{activeSection === 'latest' && <p className="mt-6 rounded-xl border border-white/10 p-4 text-sm text-[#d4cec1]">{active.latest.empty}</p>}{activeSection === 'footer' && <p className="mt-5 text-sm leading-6 text-[#d4cec1]">{active.footer.topics}</p>}<div className="mt-6 space-y-3">{previewCards.slice(0, 3).map((card) => <article key={card.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">{card.image && <img src={card.image} alt="" className="h-24 w-full object-cover" />}<div className="p-3"><div className="flex justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#d6b36d]"><span>{card.eyebrow}</span><span>{card.meta}</span></div><strong className="mt-2 block text-base">{card.title}</strong><p className="mt-1 text-sm leading-5 text-[#c7c0b4]">{card.body}</p></div></article>)}</div></>}</div></div></aside></div>
  </div>;
}
