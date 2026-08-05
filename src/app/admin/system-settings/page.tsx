'use client';

import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Settings, Image as ImageIcon } from 'lucide-react';
import { SUPPORTED_LOCALES, Locale } from '@/lib/constants';
import { SystemSettings, AboutStoryContent, AboutStoryGalleryItem } from '@/components/SystemSettingsProvider';

// Helper component for multi-language input
const MultiLangInput = ({ 
  label, 
  value, 
  onChange, 
  multiline = false 
}: { 
  label: string; 
  value: Record<string, string> | undefined; 
  onChange: (val: Record<string, string>) => void;
  multiline?: boolean;
}) => {
  const handleChange = (lang: string, text: string) => {
    onChange({ ...(value || {}), [lang]: text });
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
      <label className="block text-sm font-semibold text-gray-800 mb-3">{label} (5 ngôn ngữ)</label>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {SUPPORTED_LOCALES.map(lang => (
          <div key={lang}>
            <div className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wider">{lang}</div>
            {multiline ? (
              <textarea
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                value={value?.[lang] || ''}
                onChange={e => handleChange(lang, e.target.value)}
                placeholder={`Nhập tiếng ${lang.toUpperCase()}`}
              />
            ) : (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                value={value?.[lang] || ''}
                onChange={e => handleChange(lang, e.target.value)}
                placeholder={`Nhập tiếng ${lang.toUpperCase()}`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<'general' | 'about'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({});
  const [aboutStoryContent, setAboutStoryContent] = useState<AboutStoryContent>({
    section1: { image: '', title: {}, items: [] },
    section2: { image: '', title: {}, items: [] },
    section3: { title: {}, detail: {} },
    gallery: []
  });

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data.system_settings) setSystemSettings(data.system_settings);
        if (data.about_story_content) setAboutStoryContent(data.about_story_content);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_settings: systemSettings, about_story_content: aboutStoryContent }),
      });
      if (res.ok) {
        setMessage('Lưu cấu hình thành công!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Có lỗi xảy ra khi lưu.');
      }
    } catch (e) {
      setMessage('Có lỗi xảy ra khi lưu.');
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Đang tải cấu hình...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cấu Hình Hệ Thống</h1>
          <p className="text-gray-500 mt-1">Quản lý thông tin chung và hình ảnh Our Story</p>
        </div>
        
        <div className="flex items-center gap-4">
          {message && (
            <span className={`text-sm font-medium ${message.includes('thành công') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium shadow-sm hover:shadow-md"
          >
            <Save size={18} />
            {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-xl px-2 pt-2 shadow-sm">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Settings size={18} />
          Thông Tin Chung
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'about' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <ImageIcon size={18} />
          Nội Dung Our Story
        </button>
      </div>

      <div className="space-y-8">
        {/* TAB 1: GENERAL SETTINGS */}
        {activeTab === 'general' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              Liên hệ & Mạng xã hội
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số điện thoại / Hotline</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.phone || ''}
                  onChange={e => setSystemSettings({ ...systemSettings, phone: e.target.value })}
                  placeholder="Ví dụ: +84..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Link Zalo</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.zalo || ''}
                  onChange={e => setSystemSettings({ ...systemSettings, zalo: e.target.value })}
                  placeholder="Ví dụ: https://zalo.me/..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Link Facebook</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.facebook || ''}
                  onChange={e => setSystemSettings({ ...systemSettings, facebook: e.target.value })}
                  placeholder="Ví dụ: https://m.me/..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Giờ hoạt động</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.hours || ''}
                  onChange={e => setSystemSettings({ ...systemSettings, hours: e.target.value })}
                  placeholder="Ví dụ: 9:00 AM - 12:00 AM"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Link Bản Đồ Google</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                  value={systemSettings.googleMaps || ''}
                  onChange={e => setSystemSettings({ ...systemSettings, googleMaps: e.target.value })}
                  placeholder="Ví dụ: https://maps.app.goo.gl/..."
                />
              </div>
            </div>

            <MultiLangInput
              label="Địa chỉ chi nhánh"
              value={systemSettings.address}
              onChange={val => setSystemSettings({ ...systemSettings, address: val })}
              multiline
            />
          </div>
        )}

        {/* TAB 2: ABOUT STORY MEDIA */}
        {activeTab === 'about' && (
          <div className="space-y-6">
            {/* SECTION 1 */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></span>
                Khối 1: Vị Trí Vàng
              </h2>
              
              <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Ảnh Minh Họa (URL)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={aboutStoryContent.section1?.image || ''}
                  onChange={e => setAboutStoryContent({
                    ...aboutStoryContent,
                    section1: { ...aboutStoryContent.section1!, image: e.target.value }
                  })}
                  placeholder="https://..."
                />
              </div>

              <MultiLangInput
                label="Tiêu đề Khối 1"
                value={aboutStoryContent.section1?.title}
                onChange={val => setAboutStoryContent({
                  ...aboutStoryContent,
                  section1: { ...aboutStoryContent.section1!, title: val }
                })}
              />

              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Các gạch đầu dòng (Chi tiết Khối 1)</h4>
                {aboutStoryContent.section1?.items?.map((item, idx) => (
                  <div key={idx} className="relative mb-8 pl-4 border-l-2 border-blue-200">
                    <button 
                      onClick={() => {
                        const newItems = [...(aboutStoryContent.section1?.items || [])];
                        newItems.splice(idx, 1);
                        setAboutStoryContent({ ...aboutStoryContent, section1: { ...aboutStoryContent.section1!, items: newItems } });
                      }}
                      className="absolute -left-[9px] -top-2 w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200"
                    >
                      ×
                    </button>
                    <MultiLangInput
                      label={`Gạch đầu dòng ${idx + 1} (Hỗ trợ thẻ HTML <em>)`}
                      value={item}
                      onChange={val => {
                        const newItems = [...(aboutStoryContent.section1?.items || [])];
                        newItems[idx] = val;
                        setAboutStoryContent({ ...aboutStoryContent, section1: { ...aboutStoryContent.section1!, items: newItems } });
                      }}
                      multiline
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    setAboutStoryContent({
                      ...aboutStoryContent,
                      section1: { ...aboutStoryContent.section1!, items: [...(aboutStoryContent.section1?.items || []), {}] }
                    });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  + Thêm Gạch Đầu Dòng Khối 1
                </button>
              </div>
            </div>

            {/* SECTION 2 & 3 Combined */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></span>
                Khối 2 & 3: Không khí & Đặc sản
              </h2>
              
              <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Ảnh Minh Họa Khối 2 (URL)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={aboutStoryContent.section2?.image || ''}
                  onChange={e => setAboutStoryContent({
                    ...aboutStoryContent,
                    section2: { ...aboutStoryContent.section2!, image: e.target.value }
                  })}
                />
              </div>

              <MultiLangInput
                label="Tiêu đề Khối 2 (Không khí)"
                value={aboutStoryContent.section2?.title}
                onChange={val => setAboutStoryContent({
                  ...aboutStoryContent,
                  section2: { ...aboutStoryContent.section2!, title: val }
                })}
              />

              <div className="mb-8">
                <h4 className="font-semibold text-gray-700 mb-2">Các gạch đầu dòng (Khối 2)</h4>
                {aboutStoryContent.section2?.items?.map((item, idx) => (
                  <div key={idx} className="relative mb-6 pl-4 border-l-2 border-blue-200">
                     <button 
                      onClick={() => {
                        const newItems = [...(aboutStoryContent.section2?.items || [])];
                        newItems.splice(idx, 1);
                        setAboutStoryContent({ ...aboutStoryContent, section2: { ...aboutStoryContent.section2!, items: newItems } });
                      }}
                      className="absolute -left-[9px] -top-2 w-4 h-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center"
                    >
                      ×
                    </button>
                    <MultiLangInput
                      label={`Dòng ${idx + 1}`}
                      value={item}
                      onChange={val => {
                        const newItems = [...(aboutStoryContent.section2?.items || [])];
                        newItems[idx] = val;
                        setAboutStoryContent({ ...aboutStoryContent, section2: { ...aboutStoryContent.section2!, items: newItems } });
                      }}
                      multiline
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    setAboutStoryContent({
                      ...aboutStoryContent,
                      section2: { ...aboutStoryContent.section2!, items: [...(aboutStoryContent.section2?.items || []), {}] }
                    });
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
                >
                  + Thêm Gạch Đầu Dòng Khối 2
                </button>
              </div>

              <div className="border-t border-gray-200 my-8 pt-8">
                <MultiLangInput
                  label="Tiêu đề Khối 3 (Đặc sản)"
                  value={aboutStoryContent.section3?.title}
                  onChange={val => setAboutStoryContent({
                    ...aboutStoryContent,
                    section3: { ...aboutStoryContent.section3!, title: val }
                  })}
                />
                <MultiLangInput
                  label="Chi tiết Khối 3"
                  value={aboutStoryContent.section3?.detail}
                  onChange={val => setAboutStoryContent({
                    ...aboutStoryContent,
                    section3: { ...aboutStoryContent.section3!, detail: val }
                  })}
                  multiline
                />
              </div>
            </div>

            {/* GALLERY */}
            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></span>
                Dải Hình Ảnh Gallery
              </h2>
              
              <div className="space-y-6">
                {aboutStoryContent.gallery?.map((img, idx) => (
                  <div key={img.id || idx} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 relative group">
                    <button
                      onClick={() => {
                        const newGallery = [...(aboutStoryContent.gallery || [])];
                        newGallery.splice(idx, 1);
                        setAboutStoryContent({ ...aboutStoryContent, gallery: newGallery });
                      }}
                      className="absolute top-4 right-4 text-red-500 p-2 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={18} />
                    </button>
                    
                    <div className="mb-4 pr-12">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">URL Ảnh {idx + 1}</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                        value={img.src || ''}
                        onChange={e => {
                          const newGallery = [...(aboutStoryContent.gallery || [])];
                          newGallery[idx] = { ...newGallery[idx], src: e.target.value };
                          setAboutStoryContent({ ...aboutStoryContent, gallery: newGallery });
                        }}
                      />
                    </div>
                    
                    <MultiLangInput
                      label={`Chú thích (Caption) Ảnh ${idx + 1}`}
                      value={img.caption}
                      onChange={val => {
                        const newGallery = [...(aboutStoryContent.gallery || [])];
                        newGallery[idx] = { ...newGallery[idx], caption: val };
                        setAboutStoryContent({ ...aboutStoryContent, gallery: newGallery });
                      }}
                    />
                  </div>
                ))}
              </div>
              
              <button
                onClick={() => {
                  setAboutStoryContent({
                    ...aboutStoryContent,
                    gallery: [...(aboutStoryContent.gallery || []), { id: Date.now().toString(), src: '', caption: {} }]
                  });
                }}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 text-gray-600 rounded-xl hover:bg-gray-50 hover:border-blue-400 hover:text-blue-600 transition-colors font-medium w-full justify-center"
              >
                <Plus size={18} />
                Thêm Ảnh Mới Vào Gallery
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
