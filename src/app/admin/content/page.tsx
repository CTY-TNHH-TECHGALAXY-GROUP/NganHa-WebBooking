'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { LANGUAGES } from '@/components/Header/Header.logic';

// Mẫu dữ liệu mặc định để form không bị lỗi nếu DB chưa có
const DEFAULT_CONTENT = {
  header_menu: {
    home: '', service: '', shop: '', service_area: '', blogs: '', academy: '', spa_home: ''
  },
  hero_section: {
    badge: '✦ Premium Spa & Barbershop ✦',
    subtitle: '',
    title: 'Oria Spa',
    subTitle2: 'Welcome to',
    tagline: 'SPA',
    cta1: 'BEST-SELLER',
    cta2: 'Đặt Lịch Ngay',
    scrollHint: 'Cuộn xuống để khám phá',
    ending_soon: '', 
    explore: '', 
    book_now: ''
  },
  about_story: {
    system: '', title: '', heading_1: '', desc_1: '', heading_2: '', desc_2: '', heading_3: '', desc_3: ''
  },
  service_menu: {
    eyebrow: '', title: '', subtitle: '', hint_text: '', cta: ''
  }
};

export default function ContentAdminPage() {
  const [activeLang, setActiveLang] = useState('vi');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  // State lưu toàn bộ dữ liệu (key -> lang -> field -> value)
  const [content, setContent] = useState<Record<string, Record<string, any>>>({});

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/content');
      const json = await res.json();
      if (json.success && json.data) {
        setContent(json.data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content)
      });
      const json = await res.json();
      if (json.success) {
        setMessage({ type: 'success', text: 'Đã lưu cấu hình nội dung thành công!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: json.message || 'Lỗi khi lưu' });
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Lỗi kết nối' });
    } finally {
      setSaving(false);
    }
  };

  // Helper để lấy value an toàn
  const getValue = (sectionKey: string, fieldKey: string) => {
    return content[sectionKey]?.[activeLang]?.[fieldKey] || '';
  };

  // Helper để update value
  const updateValue = (sectionKey: string, fieldKey: string, value: string) => {
    setContent(prev => {
      const newContent = { ...prev };
      if (!newContent[sectionKey]) newContent[sectionKey] = {};
      if (!newContent[sectionKey][activeLang]) newContent[sectionKey][activeLang] = {};
      newContent[sectionKey][activeLang][fieldKey] = value;
      return newContent;
    });
  };

  if (loading) {
    return <div className="p-10 text-admin-text-dim">⏳ Đang tải cấu hình...</div>;
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">🌐 Quản Lý Nội Dung Đa Ngôn Ngữ</h1>
          <p className="text-admin-text-dim mt-2">Thay đổi nội dung văn bản hiển thị trên trang chủ cho 5 ngôn ngữ.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {saving ? '⏳ Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
        </button>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-admin-green-a border-admin-green-b text-admin-green border' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs Ngôn Ngữ */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide border-b border-admin-line-strong">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-t-xl font-semibold whitespace-nowrap transition-colors
              ${activeLang === lang.code 
                ? 'bg-admin-panel border-t border-l border-r border-admin-line-strong text-admin-gold' 
                : 'text-admin-text-dim hover:text-admin-text hover:bg-admin-panel/50'
              }
            `}
          >
            <img 
              src={`https://flagcdn.com/24x18/${lang.countryCode}.png`} 
              alt={lang.code}
              className="w-5 h-auto rounded-[2px]"
            />
            {lang.label}
          </button>
        ))}
      </div>

      <div className="space-y-8 pb-20">
        {/* Section: Header Menu */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-4 border-b border-admin-line-strong pb-2">Header Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.keys(DEFAULT_CONTENT.header_menu).map(field => (
              <div key={field}>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={getValue('header_menu', field)}
                  onChange={e => updateValue('header_menu', field, e.target.value)}
                  className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Section: Hero Section */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-4 border-b border-admin-line-strong pb-2">Hero Section (Video)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.keys(DEFAULT_CONTENT.hero_section).map(field => (
              <div key={field}>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={getValue('hero_section', field)}
                  onChange={e => updateValue('hero_section', field, e.target.value)}
                  className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Section: History */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-4 border-b border-admin-line-strong pb-2">About History</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {['system', 'title'].map(field => (
              <div key={field}>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={getValue('about_story', field)}
                  onChange={e => updateValue('about_story', field, e.target.value)}
                  className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map(num => (
              <div key={num} className="p-4 border border-admin-line-strong rounded-xl bg-admin-bg/30">
                <div className="mb-3">
                  <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Heading {num}</label>
                  <input
                    type="text"
                    value={getValue('about_story', `heading_${num}`)}
                    onChange={e => updateValue('about_story', `heading_${num}`, e.target.value)}
                    className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Description {num} (Hỗ trợ HTML)</label>
                  <textarea
                    rows={3}
                    value={getValue('about_story', `desc_${num}`)}
                    onChange={e => updateValue('about_story', `desc_${num}`, e.target.value)}
                    className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors resize-y"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section: Service Menu */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-4 border-b border-admin-line-strong pb-2">Service Menu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(DEFAULT_CONTENT.service_menu).map(field => (
              <div key={field}>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5 capitalize">
                  {field.replace('_', ' ')}
                </label>
                <input
                  type="text"
                  value={getValue('service_menu', field)}
                  onChange={e => updateValue('service_menu', field, e.target.value)}
                  className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
