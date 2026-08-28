'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Type, Layout } from 'lucide-react';

export default function HomepageStylingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  
  const [styling, setStyling] = useState({
    headingFont: 'Playfair Display',
    bodyFont: 'Inter',
    baseFontSize: '16px',
    heroHeadingSize: '4rem',
    headingWeight: '600'
  });

  const headingFonts = [
    'Playfair Display',
    'Cormorant Garamond',
    'Cinzel',
    'Merriweather',
    'Lora'
  ];

  const bodyFonts = [
    'Inter',
    'Roboto',
    'Outfit',
    'Open Sans',
    'Montserrat'
  ];

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data.homepage_styling) {
          setStyling(data.homepage_styling);
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
        body: JSON.stringify({ homepage_styling: styling }),
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Lưu cấu hình giao diện thành công!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu.' });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-admin-text-dim">Đang tải cấu hình...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8 bg-admin-panel border border-admin-line p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text flex items-center gap-2">
            <Layout className="text-admin-gold" />
            Cấu Hình Giao Diện
          </h1>
          <p className="text-admin-text-dim mt-2">Thay đổi font chữ và kích cỡ cho nội dung trên trang chủ.</p>
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
        <div className={`mb-6 p-4 rounded-xl flex items-center gap-2 font-medium ${message.type === 'success' ? 'bg-admin-green-a border-admin-green-b text-admin-green border' : 'bg-red-900/20 text-red-400 border border-red-900/50'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
        <h2 className="text-xl font-bold text-admin-text mb-6 flex items-center gap-2 border-b border-admin-line pb-4">
          <Type className="text-admin-gold" />
          Tùy Chỉnh Font Chữ
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-semibold text-admin-text mb-2">Font Tiêu Đề (Heading Font)</label>
            <p className="text-xs text-admin-text-dim mb-3">Dùng cho các thẻ h1, h2, h3... và Hero section.</p>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-admin-gold outline-none"
              value={styling.headingFont}
              onChange={e => setStyling({ ...styling, headingFont: e.target.value })}
            >
              {headingFonts.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-admin-text mb-2">Độ Đậm Tiêu Đề (Heading Weight)</label>
            <p className="text-xs text-admin-text-dim mb-3">Mức độ in đậm của các tiêu đề.</p>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-admin-gold outline-none"
              value={styling.headingWeight}
              onChange={e => setStyling({ ...styling, headingWeight: e.target.value })}
            >
              <option value="400">Normal (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi Bold (600)</option>
              <option value="700">Bold (700)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-admin-text mb-2">Font Nội Dung (Body Font)</label>
            <p className="text-xs text-admin-text-dim mb-3">Dùng cho các đoạn văn bản mô tả, văn bản thường.</p>
            <select
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-admin-gold outline-none"
              value={styling.bodyFont}
              onChange={e => setStyling({ ...styling, bodyFont: e.target.value })}
            >
              {bodyFonts.map(font => <option key={font} value={font}>{font}</option>)}
            </select>
          </div>
        </div>

        <h2 className="text-xl font-bold text-admin-text mb-6 flex items-center gap-2 border-b border-admin-line pb-4 pt-4">
          <Type className="text-admin-gold" />
          Tùy Chỉnh Kích Thước
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label className="block text-sm font-semibold text-admin-text mb-2">Kích Cỡ Chữ Cơ Bản (Base Font Size)</label>
            <p className="text-xs text-admin-text-dim mb-3">Ví dụ: 16px. Thay đổi sẽ ảnh hưởng toàn bộ tỉ lệ chữ (rem) của website.</p>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-admin-gold outline-none"
              value={styling.baseFontSize}
              onChange={e => setStyling({ ...styling, baseFontSize: e.target.value })}
              placeholder="16px"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-admin-text mb-2">Kích Cỡ Tiêu Đề Hero (Hero Heading Size)</label>
            <p className="text-xs text-admin-text-dim mb-3">Ví dụ: 4rem hoặc 5rem. Dành riêng cho tiêu đề nổi bật ở màn hình chính.</p>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-admin-gold outline-none"
              value={styling.heroHeadingSize}
              onChange={e => setStyling({ ...styling, heroHeadingSize: e.target.value })}
              placeholder="4rem"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
