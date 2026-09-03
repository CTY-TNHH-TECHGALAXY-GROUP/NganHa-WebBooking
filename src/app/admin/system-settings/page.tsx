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
  const [activeTab, setActiveTab] = useState<'general' | 'footer'>('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({});
  const [footerContent, setFooterContent] = useState<any>({
    description: {},
    locationsTitle: {},
    contactTitle: {},
    copyright: ''
  });

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        if (data.system_settings) setSystemSettings(data.system_settings);
        if (data.footer_content) setFooterContent(data.footer_content);
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
        body: JSON.stringify({ system_settings: systemSettings, footer_content: footerContent }),
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
          <p className="text-gray-500 mt-1">Quản lý thông tin chung và hình ảnh History</p>
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
          onClick={() => setActiveTab('footer')}
          className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'footer' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Settings size={18} />
          Nội Dung Footer
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

                {/* TAB 2: FOOTER SETTINGS */}
        {activeTab === 'footer' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[#D4AF37] rounded-full"></span>
              Nội dung phần Footer
            </h2>
            
            <MultiLangInput
              label="Mô tả thương hiệu (Description)"
              value={footerContent.description || {}}
              onChange={val => setFooterContent({ ...footerContent, description: val })}
              multiline
            />

            <MultiLangInput
              label="Tiêu đề Cột Chi nhánh (Locations Title)"
              value={footerContent.locationsTitle || {}}
              onChange={val => setFooterContent({ ...footerContent, locationsTitle: val })}
            />

            <MultiLangInput
              label="Tiêu đề Cột Liên hệ (Contact Title)"
              value={footerContent.contactTitle || {}}
              onChange={val => setFooterContent({ ...footerContent, contactTitle: val })}
            />

            <div className="mb-6 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
              <label className="block text-sm font-semibold text-gray-800 mb-3">Văn bản Bản quyền (Copyright)</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500"
                value={footerContent.copyright || ''}
                onChange={e => setFooterContent({ ...footerContent, copyright: e.target.value })}
                placeholder="Ví dụ: © 2026 TECHGALAXY GROUP. All rights reserved."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}