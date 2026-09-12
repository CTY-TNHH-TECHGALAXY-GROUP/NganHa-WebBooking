'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Globe2, Save, Search } from 'lucide-react';
import { SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import type { AeoFaq, AeoLocaleFields, SeoConfig, SeoLocaleFields } from '@/lib/seo/types';

type Section = 'seo' | 'aeo';
type Toast = { message: string; type: 'success' | 'error' } | null;
type SectionResponse = { version: 2; global?: SeoConfig['global']; pages: SeoConfig['pages'] | SeoConfig['aeo']; revision: string };

const ROUTES = [
  { key: 'global', label: 'Global defaults' },
  { key: 'home', label: 'Homepage' },
  { key: 'pure-relaxation', label: 'Pure Relaxation' },
  { key: 'oriahome', label: 'Oria Home Spa' },
  { key: 'oriafarm-retreat', label: 'Oria Farm Retreat' },
  { key: 'local-tour-detail', label: 'Local Tour detail' },
  { key: 'blogs', label: 'Blogs' },
  { key: 'design-your-journey', label: 'Design Your Journey' },
] as const;

const EMPTY_SEO: SeoLocaleFields = {
  title: '',
  description: '',
  keywords: [],
  ogImage: '',
  ogImageAlt: '',
  twitterCard: 'summary_large_image',
  canonicalPath: '',
  indexable: true,
};

const EMPTY_AEO: AeoLocaleFields = {
  serviceName: '',
  answer: '',
  audience: '',
  duration: '',
  price: '',
  inclusions: [],
  location: '',
  hours: '',
  bookingProcess: '',
  faqs: [],
  sourceLabel: '',
  sourceUrl: '',
};

const EMPTY_CONFIG: SeoConfig = { version: 2, global: {}, pages: {}, aeo: {} };

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function getLocaleSeo(config: SeoConfig, routeKey: string, locale: Locale): SeoLocaleFields {
  const entry = routeKey === 'global' ? config.global[locale] : config.pages[routeKey]?.locales[locale];
  const value = clone(entry?.draft || entry?.published || EMPTY_SEO);
  return routeKey === 'global' ? { ...value, canonicalPath: '' } : value;
}

function getLocaleAeo(config: SeoConfig, routeKey: string, locale: Locale): AeoLocaleFields {
  return clone(config.aeo[routeKey]?.locales[locale]?.draft || config.aeo[routeKey]?.locales[locale]?.published || EMPTY_AEO);
}

function routePreview(routeKey: string, locale: Locale) {
  if (routeKey === 'global' || routeKey === 'home') return `/${locale}`;
  if (routeKey === 'local-tour-detail') return `/${locale}/local-tour/saigon-xua`;
  return `/${locale}/${routeKey}`;
}

export default function SeoAdminPage() {
  const [section, setSection] = useState<Section>('seo');
  const [locale, setLocale] = useState<Locale>('vi');
  const [routeKey, setRouteKey] = useState<string>('global');
  const [seoConfig, setSeoConfig] = useState<SeoConfig>(EMPTY_CONFIG);
  const [aeoConfig, setAeoConfig] = useState<SeoConfig>(EMPTY_CONFIG);
  const [seoForm, setSeoForm] = useState<SeoLocaleFields>(EMPTY_SEO);
  const [aeoForm, setAeoForm] = useState<AeoLocaleFields>(EMPTY_AEO);
  const [seoRevision, setSeoRevision] = useState('');
  const [aeoRevision, setAeoRevision] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<Section | null>(null);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
  };

  const fetchSection = async (target: Section) => {
    const response = await fetch(`/api/admin/seo?section=${target}`, { cache: 'no-store' });
    const json = await response.json();
    if (!response.ok || !json.success) throw new Error(json.error?.message || 'Không thể tải cấu hình');
    return json.data as SectionResponse;
  };

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([fetchSection('seo'), fetchSection('aeo')])
      .then(([seoResult, aeoResult]) => {
        if (cancelled) return;
        if (seoResult.status === 'fulfilled') {
          setSeoConfig({ version: 2, global: seoResult.value.global || {}, pages: seoResult.value.pages as SeoConfig['pages'], aeo: {} });
          setSeoRevision(seoResult.value.revision);
        } else {
          showToast(seoResult.reason instanceof Error ? seoResult.reason.message : 'Không thể tải SEO metadata', 'error');
        }
        if (aeoResult.status === 'fulfilled') {
          setAeoConfig({ version: 2, global: {}, pages: {}, aeo: aeoResult.value.pages as SeoConfig['aeo'] });
          setAeoRevision(aeoResult.value.revision);
        }
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    setSeoForm(getLocaleSeo(seoConfig, routeKey, locale));
    setAeoForm(getLocaleAeo(aeoConfig, routeKey, locale));
  }, [seoConfig, aeoConfig, routeKey, locale]);

  const previewPath = useMemo(() => routePreview(routeKey, locale), [routeKey, locale]);

  const updateSeo = <K extends keyof SeoLocaleFields>(key: K, value: SeoLocaleFields[K]) => {
    setSeoForm((current) => ({ ...current, [key]: value }));
  };

  const updateAeo = <K extends keyof AeoLocaleFields>(key: K, value: AeoLocaleFields[K]) => {
    setAeoForm((current) => ({ ...current, [key]: value }));
  };

  const updateFaq = (index: number, key: keyof AeoFaq, value: string) => {
    const next = aeoForm.faqs.map((faq, faqIndex) => faqIndex === index ? { ...faq, [key]: value } : faq);
    updateAeo('faqs', next);
  };

  const save = async (target: Section, status: 'draft' | 'published') => {
    setIsSaving(target);
    try {
      const data = target === 'seo'
        ? { ...seoForm, keywords: seoForm.keywords.filter(Boolean), canonicalPath: routeKey === 'global' ? '' : seoForm.canonicalPath }
        : aeoForm;
      const response = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: target,
          routeKey,
          locale,
          status,
          data,
          expectedRevision: target === 'seo' ? seoRevision : aeoRevision,
        }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error?.message || 'Không thể lưu');
      if (target === 'seo') {
        setSeoConfig((current) => ({ ...current, global: json.data.document.global || {}, pages: json.data.document.pages || {} }));
        setSeoRevision(json.data.revision);
      } else {
        setAeoConfig((current) => ({ ...current, aeo: json.data.document.pages || {} }));
        setAeoRevision(json.data.revision);
      }
      showToast(status === 'published' ? 'Đã xuất bản nội dung.' : 'Đã lưu bản nháp.', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Lỗi khi lưu nội dung', 'error');
    } finally {
      setIsSaving(null);
    }
  };

  if (isLoading) return <div className="flex h-64 items-center justify-center text-gray-400">Đang tải...</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-admin-text"><Search className="text-admin-gold" /> SEO &amp; AEO</h1>
          <p className="mt-1 text-sm text-admin-text-dim">Quản lý metadata, đường dẫn đa ngôn ngữ và nội dung trả lời visible theo quy trình bản nháp / xuất bản.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-admin-text-faint"><Globe2 size={16} /> {locale.toUpperCase()} · {previewPath}</div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-admin-line pb-3">
        <button type="button" onClick={() => setSection('seo')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${section === 'seo' ? 'bg-admin-gold text-[#241804]' : 'bg-admin-panel text-admin-text-dim'}`}><Search size={16} /> SEO metadata</button>
        <button type="button" onClick={() => setSection('aeo')} className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold ${section === 'aeo' ? 'bg-admin-gold text-[#241804]' : 'bg-admin-panel text-admin-text-dim'}`}><FileText size={16} /> AEO answers</button>
      </div>

      <div className="grid gap-4 md:grid-cols-[210px_1fr]">
        <aside className="space-y-4 rounded-xl border border-admin-line bg-admin-panel p-4">
          <div><label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-admin-text-faint">Route</label><select value={routeKey} onChange={(event) => setRouteKey(event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-3 py-2 text-sm text-admin-text">{ROUTES.map((route) => <option key={route.key} value={route.key}>{route.label}</option>)}</select></div>
          <div><span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-admin-text-faint">Locale</span><div className="grid grid-cols-3 gap-2">{SUPPORTED_LOCALES.map((item) => <button key={item} type="button" onClick={() => setLocale(item)} className={`rounded-md px-2 py-2 text-xs font-bold ${locale === item ? 'bg-admin-gold text-[#241804]' : 'bg-admin-panel-2 text-admin-text-dim'}`}>{item.toUpperCase()}</button>)}</div></div>
          <p className="text-xs leading-5 text-admin-text-faint">Canonical được tạo từ origin cấu hình server và chỉ nhận đường dẫn nội bộ. Bản nháp không xuất hiện trên public HTML.</p>
        </aside>

        {section === 'seo' ? (
          <section className="space-y-5 rounded-xl border border-admin-line bg-admin-panel p-5 shadow-[var(--shadow)]">
            <div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Meta title</label><input value={seoForm.title} onChange={(event) => updateSeo('title', event.target.value)} maxLength={160} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /><p className="mt-1 text-[11px] text-admin-text-faint">{seoForm.title.length}/160 ký tự</p></div>
            <div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Meta description</label><textarea value={seoForm.description} onChange={(event) => updateSeo('description', event.target.value)} maxLength={500} rows={4} className="w-full resize-none rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /><p className="mt-1 text-[11px] text-admin-text-faint">{seoForm.description.length}/500 ký tự</p></div>
            <div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Keywords compatibility</label><input value={seoForm.keywords.join(', ')} onChange={(event) => updateSeo('keywords', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /><p className="mt-1 text-[11px] text-admin-text-faint">Giữ lại để tương thích; keywords không được coi là tín hiệu xếp hạng chính.</p></div>
            <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">OG image URL</label><input value={seoForm.ogImage} onChange={(event) => updateSeo('ogImage', event.target.value)} placeholder="https://... hoặc /images/..." className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">OG image alt</label><input value={seoForm.ogImageAlt} onChange={(event) => updateSeo('ogImageAlt', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div></div>
            <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Canonical path override</label><input value={seoForm.canonicalPath} onChange={(event) => updateSeo('canonicalPath', event.target.value)} placeholder={previewPath} disabled={routeKey === 'global'} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400" /><p className="mt-1 text-[11px] text-admin-text-faint">{routeKey === 'global' ? 'Global luôn để trống; chỉ cấu hình canonical ở từng route.' : 'Để trống để dùng pathname của route.'}</p></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Twitter card</label><select value={seoForm.twitterCard} onChange={(event) => updateSeo('twitterCard', event.target.value as SeoLocaleFields['twitterCard'])} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text"><option value="summary_large_image">summary_large_image</option><option value="summary">summary</option></select></div></div>
            <label className="flex items-center gap-3 text-sm text-admin-text"><input type="checkbox" checked={seoForm.indexable} onChange={(event) => updateSeo('indexable', event.target.checked)} className="h-4 w-4 accent-[#b8894f]" /> Cho phép index route đã xuất bản</label>
            <div className="flex flex-wrap justify-end gap-3 border-t border-admin-line pt-4"><button type="button" onClick={() => save('seo', 'draft')} disabled={isSaving !== null} className="flex items-center gap-2 rounded-lg border border-admin-line-strong px-4 py-2.5 text-sm font-semibold text-admin-text disabled:opacity-50"><Save size={16} /> Lưu bản nháp</button><button type="button" onClick={() => save('seo', 'published')} disabled={isSaving !== null} className="flex items-center gap-2 rounded-lg bg-admin-gold px-4 py-2.5 text-sm font-semibold text-[#241804] disabled:opacity-50"><Search size={16} /> Xuất bản SEO</button></div>
          </section>
        ) : (
          <section className="space-y-5 rounded-xl border border-admin-line bg-admin-panel p-5 shadow-[var(--shadow)]">
            <div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Service / entity name</label><input value={aeoForm.serviceName} onChange={(event) => updateAeo('serviceName', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div>
            <div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Answer-ready summary</label><textarea value={aeoForm.answer} onChange={(event) => updateAeo('answer', event.target.value)} rows={5} className="w-full resize-none rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div>
            <div className="grid gap-5 md:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Who it suits</label><input value={aeoForm.audience} onChange={(event) => updateAeo('audience', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Duration</label><input value={aeoForm.duration} onChange={(event) => updateAeo('duration', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Price / currency</label><input value={aeoForm.price} onChange={(event) => updateAeo('price', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Location</label><input value={aeoForm.location} onChange={(event) => updateAeo('location', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Hours</label><input value={aeoForm.hours} onChange={(event) => updateAeo('hours', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Inclusions, comma separated</label><input value={aeoForm.inclusions.join(', ')} onChange={(event) => updateAeo('inclusions', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div></div>
            <div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Booking process</label><textarea value={aeoForm.bookingProcess} onChange={(event) => updateAeo('bookingProcess', event.target.value)} rows={3} className="w-full resize-none rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div>
            <div className="space-y-3"><div className="flex items-center justify-between"><h2 className="text-sm font-semibold text-admin-text">Visible FAQs</h2><button type="button" onClick={() => updateAeo('faqs', [...aeoForm.faqs, { question: '', answer: '' }])} className="rounded-md border border-admin-line-strong px-3 py-1.5 text-xs font-semibold text-admin-text">+ Thêm FAQ</button></div>{aeoForm.faqs.map((faq, index) => <div key={index} className="grid gap-3 rounded-lg border border-admin-line p-3 md:grid-cols-[1fr_1fr_auto]"><input value={faq.question} onChange={(event) => updateFaq(index, 'question', event.target.value)} placeholder="Question" className="rounded-md border border-admin-line-strong bg-white px-3 py-2 text-sm text-admin-text" /><textarea value={faq.answer} onChange={(event) => updateFaq(index, 'answer', event.target.value)} placeholder="Answer" rows={2} className="rounded-md border border-admin-line-strong bg-white px-3 py-2 text-sm text-admin-text" /><button type="button" onClick={() => updateAeo('faqs', aeoForm.faqs.filter((_, faqIndex) => faqIndex !== index))} className="self-start rounded-md px-2 py-2 text-xs text-red-600">Xóa</button></div>)}</div>
            <div className="grid gap-5 border-t border-admin-line pt-4 md:grid-cols-2"><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Source label</label><input value={aeoForm.sourceLabel} onChange={(event) => updateAeo('sourceLabel', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div><div><label className="mb-2 block text-sm font-medium text-admin-text-dim">Source URL (optional)</label><input value={aeoForm.sourceUrl} onChange={(event) => updateAeo('sourceUrl', event.target.value)} className="w-full rounded-lg border border-admin-line-strong bg-white px-4 py-3 text-admin-text" /></div></div>
            <div className="flex flex-wrap justify-end gap-3 border-t border-admin-line pt-4"><button type="button" onClick={() => save('aeo', 'draft')} disabled={isSaving !== null} className="flex items-center gap-2 rounded-lg border border-admin-line-strong px-4 py-2.5 text-sm font-semibold text-admin-text disabled:opacity-50"><Save size={16} /> Lưu bản nháp</button><button type="button" onClick={() => save('aeo', 'published')} disabled={isSaving !== null} className="flex items-center gap-2 rounded-lg bg-admin-gold px-4 py-2.5 text-sm font-semibold text-[#241804] disabled:opacity-50"><Search size={16} /> Xuất bản AEO</button></div>
          </section>
        )}
      </div>

      <div className="max-w-2xl rounded-xl bg-white p-5 text-gray-700 shadow-sm"><h2 className="mb-3 border-b pb-2 text-sm font-semibold">Preview metadata</h2><p className="text-xs text-gray-500">{previewPath}</p><div className="mt-2 text-xl font-medium text-[#1a0dab]">{seoForm.title || 'Tiêu đề trang sẽ hiển thị ở đây'}</div><p className="mt-1 text-sm leading-6 text-[#4d5156]">{seoForm.description || 'Mô tả hiển thị sau tiêu đề.'}</p></div>

      {toast && <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-6 py-3 text-white shadow-2xl ${toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>{toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}<span className="font-medium">{toast.message}</span></div>}
    </div>
  );
}
