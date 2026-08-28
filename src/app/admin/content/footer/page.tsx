'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, LayoutTemplate } from 'lucide-react';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
];

const DEFAULT_CONTENT = {
  description: { 
    vi: 'Trải nghiệm dịch vụ chăm sóc sức khoẻ và làm đẹp đẳng cấp tại trung tâm Quận 1, TP.HCM.',
    en: 'Experience premium wellness and beauty services in the heart of District 1, HCMC.',
    kr: '호치민시 1군 중심에서 프리미엄 웰빙 및 뷰티 서비스를 경험하세요.',
    jp: 'ホーチミン市1区の中心でプレミアムなウェルネス＆ビューティーサービスを体験してください。',
    cn: '在胡志明市第一郡的中心体验优质的健康与美容服务。'
  },
  locationsTitle: { vi: 'Chi nhánh', en: 'Locations', kr: '지점', jp: '店舗', cn: '分店' },
  contactTitle: { vi: 'Liên hệ', en: 'Contact', kr: '연락처', jp: '連絡先', cn: '联系我们' },
  copyright: `© ${new Date().getFullYear()} TECHGALAXY GROUP. All rights reserved.`,
};

export default function FooterContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeLang, setActiveLang] = useState('vi');
  
  const [content, setContent] = useState<any>(DEFAULT_CONTENT);

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data.footer_content) {
          // Merge with default to ensure all fields exist
          setContent({
            description: { ...DEFAULT_CONTENT.description, ...(data.footer_content.description || {}) },
            locationsTitle: { ...DEFAULT_CONTENT.locationsTitle, ...(data.footer_content.locationsTitle || {}) },
            contactTitle: { ...DEFAULT_CONTENT.contactTitle, ...(data.footer_content.contactTitle || {}) },
            copyright: data.footer_content.copyright || DEFAULT_CONTENT.copyright,
          });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ footer_content: content }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Lưu thông tin Footer thành công!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
    }
    setSaving(false);
  };

  const handleI18nChange = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      [field]: {
        ...prev[field],
        [activeLang]: value
      }
    }));
  };

  const handleChange = (field: string, value: string) => {
    setContent((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-admin-text-dim">Đang tải cấu hình...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto pb-12 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-admin-panel border border-admin-line p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text flex items-center gap-2">
            <LayoutTemplate className="text-admin-gold" />
            Thông Tin Footer
          </h1>
          <p className="text-admin-text-dim mt-2">Quản lý nội dung văn bản hiển thị ở chân trang (Footer).</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all active:scale-[0.98] disabled:opacity-70 shadow-md"
        >
          {saving ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-admin-green-a border-admin-green-b text-admin-green border' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs Ngôn Ngữ */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide border-b border-admin-line-strong">
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
            <span className="text-lg">{lang.flag}</span>
            {lang.label}
          </button>
        ))}
      </div>

      <div className="space-y-6">
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-6 pb-4 border-b border-admin-line-strong">
            Nội dung Đa ngôn ngữ
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Đoạn giới thiệu ngắn</label>
              <textarea
                value={content.description[activeLang] || ''}
                onChange={e => handleI18nChange('description', e.target.value)}
                rows={3}
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-2">Tiêu đề Chi nhánh</label>
                <input
                  type="text"
                  value={content.locationsTitle[activeLang] || ''}
                  onChange={e => handleI18nChange('locationsTitle', e.target.value)}
                  className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-2">Tiêu đề Liên hệ</label>
                <input
                  type="text"
                  value={content.contactTitle[activeLang] || ''}
                  onChange={e => handleI18nChange('contactTitle', e.target.value)}
                  className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </section>
        
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-6 pb-4 border-b border-admin-line-strong">
            Cài đặt chung
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Copyright (Bản quyền)</label>
              <input
                type="text"
                value={content.copyright || ''}
                onChange={e => handleChange('copyright', e.target.value)}
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
