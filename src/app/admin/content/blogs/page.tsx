'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, FileText, Save } from 'lucide-react';
import { DEFAULT_BLOG_CONTENT } from '@/components/Blogs/blogContent';
import type { Locale } from '@/lib/constants';

const LANGUAGES: Array<{ code: Locale; label: string; flag: string }> = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

export default function BlogContentAdminPage() {
  const [content, setContent] = useState<any>(DEFAULT_BLOG_CONTENT);
  const [activeLang, setActiveLang] = useState<Locale>('vi');
  const [draft, setDraft] = useState(JSON.stringify(DEFAULT_BLOG_CONTENT.vi, null, 2));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then((response) => response.json())
      .then((data) => {
        const next = { ...DEFAULT_BLOG_CONTENT, ...(data.blog_content || {}) };
        setContent(next);
        setDraft(JSON.stringify(next.vi, null, 2));
      })
      .catch(() => setMessage({ type: 'error', text: 'Không thể tải nội dung Blog.' }))
      .finally(() => setLoading(false));
  }, []);

  const activeLabel = useMemo(() => LANGUAGES.find((language) => language.code === activeLang)?.label, [activeLang]);

  const changeLanguage = (lang: Locale) => {
    try {
      const parsed = JSON.parse(draft);
      setContent((previous: any) => ({ ...previous, [activeLang]: parsed }));
    } catch {
      setMessage({ type: 'error', text: 'JSON của ngôn ngữ hiện tại chưa hợp lệ. Hãy sửa trước khi đổi tab.' });
      return;
    }
    setActiveLang(lang);
    setDraft(JSON.stringify(content[lang] || DEFAULT_BLOG_CONTENT[lang], null, 2));
    setMessage({ type: '', text: '' });
  };

  const save = async () => {
    let parsed: any;
    try {
      parsed = JSON.parse(draft);
    } catch {
      setMessage({ type: 'error', text: 'Nội dung chưa đúng định dạng JSON.' });
      return;
    }
    const next = { ...content, [activeLang]: parsed };
    setSaving(true);
    try {
      const response = await fetch('/api/admin/system-settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ blog_content: next }),
      });
      if (!response.ok) throw new Error('Save failed');
      setContent(next);
      setMessage({ type: 'success', text: 'Đã lưu nội dung Blog.' });
    } catch {
      setMessage({ type: 'error', text: 'Không thể lưu nội dung Blog.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-admin-text-dim">Đang tải nội dung Blog...</div>;

  return <div className="max-w-6xl mx-auto p-6 lg:p-10 space-y-6">
    <header className="flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold text-admin-text"><FileText className="text-admin-gold" /> Nội dung Blog</h1><p className="mt-2 text-admin-text-dim">Toàn bộ copy, card, hình ảnh và thứ tự editorial của trang Blog theo 5 ngôn ngữ.</p></div>
      <button onClick={save} disabled={saving} className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-admin-gold text-[#241804] font-bold disabled:opacity-60"><Save size={17} />{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
    </header>

    {message.text && <div className={`flex items-center gap-2 p-4 rounded-xl border ${message.type === 'success' ? 'bg-admin-green-a border-admin-green-b text-admin-green' : 'bg-red-900/20 border-red-900/40 text-red-400'}`}>{message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}{message.text}</div>}

    <div className="bg-admin-panel border border-admin-line rounded-2xl p-2 flex flex-wrap gap-2">
      {LANGUAGES.map((language) => <button key={language.code} onClick={() => changeLanguage(language.code)} className={`px-4 py-2.5 rounded-xl font-semibold text-sm ${activeLang === language.code ? 'bg-admin-gold text-[#241804]' : 'text-admin-text-dim hover:bg-admin-line'}`}><span className="mr-2">{language.flag}</span>{language.label}</button>)}
    </div>

    <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-bold text-admin-text">Editorial structure: {activeLabel}</h2>
      <p className="mt-2 mb-5 text-sm text-admin-text-dim">Các block gồm hero, discovery, featured notes, quick intelligence, city lenses, latest posts và footer. Có thể thêm/xóa card trong các mảng; giữ nguyên `id` để animation và tracking ổn định.</p>
      <textarea value={draft} onChange={(event) => setDraft(event.target.value)} spellCheck={false} className="w-full min-h-[720px] rounded-xl bg-admin-bg border border-admin-line-strong p-4 font-mono text-xs leading-6 text-admin-text focus:outline-none focus:border-admin-gold" />
    </section>
  </div>;
}
