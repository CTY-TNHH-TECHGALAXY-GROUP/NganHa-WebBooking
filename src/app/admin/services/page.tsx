'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle } from 'lucide-react';
import { DEFAULT_JOURNEY_CONTENT } from '@/components/DesignYourJourney/designJourneyData';

const LANGUAGES = [
  { id: 'vi', label: 'VI' },
  { id: 'en', label: 'EN' },
  { id: 'cn', label: 'CN' },
  { id: 'jp', label: 'JP' },
  { id: 'kr', label: 'KR' },
];

export default function DesignJourneyAdminPage() {
  const [contentData, setContentData] = useState<any>({});
  const [localOverrides, setLocalOverrides] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState('vi');

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/content');
      const json = await res.json();
      if (json.success) {
        setContentData(json.data.design_journey_content || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async () => {
    try {
      const newMediaData = {
        ...contentData,
        ...localOverrides
      };
      
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ design_journey_content: newMediaData }),
      });
      
      const json = await res.json();
      if (json.success) {
        setContentData(newMediaData);
        setLocalOverrides({});
        setSuccessId('save');
        setTimeout(() => setSuccessId(null), 3000);
      } else {
        alert('Lỗi khi lưu dữ liệu!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống khi lưu');
    }
  };

  const handleChange = (key: string, lang: string, value: string) => {
    setLocalOverrides((prev: any) => {
      const fieldData = prev[key] || contentData[key] || {};
      return {
        ...prev,
        [key]: {
          ...fieldData,
          [lang]: value
        }
      };
    });
  };

  if (loading) return <div className="p-8 text-center text-admin-text-dim">Đang tải cấu hình...</div>;

  const keys = Object.keys(DEFAULT_JOURNEY_CONTENT);
  const hasChanges = Object.keys(localOverrides).length > 0;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">✨ Quản Lý Text "Design Your Journey"</h1>
          <p className="text-admin-text-dim mt-2">Chỉnh sửa nội dung chữ đa ngôn ngữ của trang Design Your Journey.</p>
        </div>
        
        <button 
          onClick={saveContent}
          disabled={!hasChanges}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${hasChanges ? 'bg-admin-gold text-[#241804] hover:bg-[#a67433] shadow-lg' : 'bg-admin-panel border border-admin-line text-admin-text-dim cursor-not-allowed'}`}
        >
          {successId === 'save' ? <CheckCircle size={20} /> : <Save size={20} />}
          {successId === 'save' ? 'Đã Lưu Thành Công' : 'Lưu Thay Đổi'}
        </button>
      </div>

      <div className="bg-admin-panel border border-admin-line rounded-2xl overflow-hidden shadow-sm p-6">
        {/* Language Tabs */}
        <div className="flex gap-2 border-b border-admin-line pb-4 mb-6 sticky top-0 bg-admin-panel z-10 pt-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${activeLang === lang.id ? 'bg-admin-gold text-[#241804]' : 'bg-admin-bg border border-admin-line text-admin-text-dim hover:text-admin-gold'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {keys.map((key) => {
            const defaultEntry = (DEFAULT_JOURNEY_CONTENT as any)[key] || {};
            const defaultVal = defaultEntry[activeLang] || '';
            const currentVal = localOverrides[key]?.[activeLang] !== undefined 
              ? localOverrides[key][activeLang] 
              : (contentData[key]?.[activeLang] !== undefined ? contentData[key][activeLang] : defaultVal);
            
            const isHtml = currentVal.includes('<br>');
            
            return (
              <div key={key} className="bg-admin-bg p-4 rounded-xl border border-admin-line">
                <label className="text-xs uppercase font-bold text-admin-gold mb-2 block">{key}</label>
                {isHtml || currentVal.length > 60 ? (
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-line-strong rounded-lg p-3 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[100px]"
                    value={currentVal}
                    onChange={(e) => handleChange(key, activeLang, e.target.value)}
                  />
                ) : (
                  <input 
                    type="text"
                    className="w-full bg-admin-panel border border-admin-line-strong rounded-lg p-3 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                    value={currentVal}
                    onChange={(e) => handleChange(key, activeLang, e.target.value)}
                  />
                )}
                <div className="mt-2 text-[10px] text-admin-text-faint">Mặc định: {defaultVal}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
