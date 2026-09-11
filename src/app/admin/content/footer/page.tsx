'use client';

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  LayoutTemplate, 
  Upload, 
  RefreshCw, 
  Image as ImageIcon, 
  Sparkles, 
  HeartPulse, 
  ShieldCheck 
} from 'lucide-react';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
];

const DEFAULT_CORE_VALUES_SECTION_TITLE = {
  vi: 'GIÁ TRỊ CỐT LÕI',
  en: 'OUR CORE VALUES',
  cn: '核心价值',
  jp: '私たちのコアバリュー',
  kr: '핵심 가치'
};

const DEFAULT_CORE_VALUES = [
  {
    id: 'guest-centric',
    label: 'Giá trị 1: Tận tâm phụng sự / Guest-centric Excellence',
    defaultImgSrc: '/images/core-values/guest-centric.png',
    defaultIcon: 'none',
    title: {
      vi: 'TẬN TÂM PHỤNG SỰ',
      en: 'GUEST-CENTRIC EXCELLENCE',
      cn: '全心服务',
      jp: '真心のおもてなし',
      kr: '정성을 다하는 서비스'
    }
  },
  {
    id: 'natural-authenticity',
    label: 'Giá trị 2: Thuần thiên nhiên / Natural Authenticity',
    defaultImgSrc: '/images/core-values/natural-authenticity.png',
    defaultIcon: 'none',
    title: {
      vi: 'THUẦN THIÊN NHIÊN',
      en: 'NATURAL AUTHENTICITY',
      cn: '纯粹自然',
      jp: '純粋な自然の恵み',
      kr: '순수한 자연의 본질'
    }
  },
  {
    id: 'empathetic-understanding',
    label: 'Giá trị 3: Lắng nghe & Thấu hiểu / Empathetic Understanding',
    defaultImgSrc: '',
    defaultIcon: 'HeartPulse',
    title: {
      vi: 'LẮNG NGHE & THẤU HIỂU',
      en: 'EMPATHETIC UNDERSTANDING',
      cn: '倾听与理解',
      jp: '傾聴と深い理解',
      kr: '경청과 깊은 공감'
    }
  },
  {
    id: 'artisans-touch',
    label: "Giá trị 4: Bàn tay nghệ nhân / Artisan's Touch",
    defaultImgSrc: '/images/core-values/artisans-touch.png',
    defaultIcon: 'none',
    title: {
      vi: 'BÀN TAY NGHỆ NHÂN',
      en: "ARTISAN'S TOUCH",
      cn: '匠人手法',
      jp: '匠の手技',
      kr: '장인의 손길'
    }
  },
  {
    id: 'global-essence',
    label: 'Giá trị 5: Hội nhập & Sáng tạo / Global Essence & Creative Fusion',
    defaultImgSrc: '/images/core-values/global-essence.png',
    defaultIcon: 'none',
    title: {
      vi: 'HỘI NHẬP & SÁNG TẠO',
      en: 'GLOBAL ESSENCE & CREATIVE FUSION',
      cn: '融合与创新',
      jp: 'グローバルと創造の融合',
      kr: '융합과 창의적 감각'
    }
  },
  {
    id: 'hygiene-health',
    label: 'Giá trị 6: Sạch khỏe đồng hành / Hygiene & Health Priority',
    defaultImgSrc: '',
    defaultIcon: 'ShieldCheck',
    title: {
      vi: 'SẠCH KHỎE ĐỒNG HÀNH',
      en: 'HYGIENE & HEALTH PRIORITY',
      cn: '卫生与健康同行',
      jp: '衛生と健康の優先',
      kr: '청결과 건강의 동행'
    }
  },
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
  address: {
    vi: '11 Ngô Đức Kế, Sài Gòn, Hồ Chí Minh 700000, Vietnam',
    en: '11 Ngo Duc Ke, Saigon Ward, Ho Chi Minh City 700000, Vietnam',
    cn: '越南胡志明市西贡 Ngô Đức Kế 街 11 号，邮编 700000',
    jp: 'ベトナム 700000 ホーチミン市サイゴン、ゴー・ドゥック・ケー通り11番地',
    kr: '베트남 700000 호찌민시 사이공, 응오득께 거리 11번지'
  },
  contactTitle: { vi: 'Liên hệ', en: 'Contact', kr: '연락처', jp: '連絡先', cn: '联系我们' },
  coreValuesSectionTitle: DEFAULT_CORE_VALUES_SECTION_TITLE,
  coreValues: DEFAULT_CORE_VALUES.map(item => ({
    id: item.id,
    imgSrc: item.defaultImgSrc,
    applyGoldFilter: Boolean(item.defaultImgSrc),
    title: { ...item.title }
  })),
  phone: '+84964090277',
  zalo: '+84964090277',
  whatsapp: 'https://api.whatsapp.com/send/?phone=84964090277&text=Hello+Oria+Spa&type=phone_number&app_absent=0',
  wechat: '+84964090277',
  kakaotalk: 'https://pf.kakao.com/_xjVyxaX',
  line: '',
  facebook: '',
  instagram: '',
  tiktok: '',
  copyright: `© ${new Date().getFullYear()} TECHGALAXY GROUP. All rights reserved.`,
};

export default function FooterContentPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeLang, setActiveLang] = useState('vi');
  
  const [content, setContent] = useState<any>(DEFAULT_CONTENT);

  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then(res => res.json())
      .then(data => {
        const fc = data.footer_content || {};
        const ss = data.system_settings || {};

        const savedCoreValues = Array.isArray(fc.coreValues) ? fc.coreValues : [];
        const mergedCoreValues = DEFAULT_CORE_VALUES.map((def, idx) => {
          const existing = savedCoreValues.find((c: any) => c && c.id === def.id) || savedCoreValues[idx];
          return {
            id: def.id,
            imgSrc: existing?.imgSrc !== undefined ? existing.imgSrc : def.defaultImgSrc,
            applyGoldFilter: existing?.applyGoldFilter !== undefined ? Boolean(existing.applyGoldFilter) : Boolean(def.defaultImgSrc),
            title: {
              ...def.title,
              ...(existing?.title || {})
            }
          };
        });

        setContent({
          description: { ...DEFAULT_CONTENT.description, ...(fc.description || {}) },
          locationsTitle: { ...DEFAULT_CONTENT.locationsTitle, ...(fc.locationsTitle || {}) },
          address: { ...DEFAULT_CONTENT.address, ...(fc.address || ss.address || {}) },
          contactTitle: { ...DEFAULT_CONTENT.contactTitle, ...(fc.contactTitle || {}) },
          coreValuesSectionTitle: { ...DEFAULT_CORE_VALUES_SECTION_TITLE, ...(fc.coreValuesSectionTitle || {}) },
          coreValues: mergedCoreValues,
          phone: fc.phone ?? ss.phone ?? DEFAULT_CONTENT.phone,
          zalo: fc.zalo ?? ss.zalo ?? DEFAULT_CONTENT.zalo,
          whatsapp: fc.whatsapp ?? ss.whatsapp ?? DEFAULT_CONTENT.whatsapp,
          wechat: fc.wechat ?? ss.wechat ?? DEFAULT_CONTENT.wechat,
          kakaotalk: fc.kakaotalk ?? ss.kakaotalk ?? DEFAULT_CONTENT.kakaotalk,
          line: fc.line ?? ss.line ?? DEFAULT_CONTENT.line,
          facebook: fc.facebook ?? ss.facebook ?? '',
          instagram: fc.instagram ?? ss.instagram ?? '',
          tiktok: fc.tiktok ?? ss.tiktok ?? '',
          copyright: fc.copyright || DEFAULT_CONTENT.copyright,
        });
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
        body: JSON.stringify({ 
          footer_content: content,
          system_settings: {
            phone: content.phone,
            zalo: content.zalo,
            whatsapp: content.whatsapp,
            wechat: content.wechat,
            kakaotalk: content.kakaotalk,
            line: content.line,
            facebook: content.facebook,
            instagram: content.instagram,
            tiktok: content.tiktok,
            address: content.address,
          }
        }),
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
        ...(prev[field] || {}),
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

  const handleUploadImage = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('folder', 'core-values');
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (data.success && data.data?.url) {
        handleCoreValueChange(index, 'imgSrc', data.data.url);
        setMessage({ type: 'success', text: `Đã tải ảnh cho giá trị ${index + 1} thành công!` });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        alert('Lỗi tải ảnh: ' + (data.error?.message || 'Vui lòng thử lại'));
      }
    } catch (err: any) {
      alert('Lỗi khi tải ảnh lên: ' + (err.message || 'Lỗi mạng'));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleCoreValueChange = (index: number, field: string, value: any) => {
    setContent((prev: any) => {
      const nextList = [...(prev.coreValues || [])];
      nextList[index] = {
        ...nextList[index],
        [field]: value
      };
      return { ...prev, coreValues: nextList };
    });
  };

  const handleCoreValueTitleChange = (index: number, lang: string, value: string) => {
    setContent((prev: any) => {
      const nextList = [...(prev.coreValues || [])];
      nextList[index] = {
        ...nextList[index],
        title: {
          ...(nextList[index]?.title || {}),
          [lang]: value
        }
      };
      return { ...prev, coreValues: nextList };
    });
  };

  const handleResetCoreValueImage = (index: number) => {
    const def = DEFAULT_CORE_VALUES[index];
    handleCoreValueChange(index, 'imgSrc', def.defaultImgSrc);
    handleCoreValueChange(index, 'applyGoldFilter', Boolean(def.defaultImgSrc));
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
          <p className="text-admin-text-dim mt-2">Quản lý nội dung văn bản, địa chỉ chi nhánh và liên hệ hiển thị ở chân trang (Footer).</p>
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
        {/* Section: Đa ngôn ngữ */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-6 pb-4 border-b border-admin-line-strong">
            Nội dung Đa ngôn ngữ ({LANGUAGES.find(l => l.code === activeLang)?.label})
          </h2>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Đoạn giới thiệu thương hiệu ngắn</label>
              <textarea
                value={content.description?.[activeLang] || ''}
                onChange={e => handleI18nChange('description', e.target.value)}
                rows={3}
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Địa chỉ chi nhánh (Branch Address / Content)</label>
              <textarea
                value={content.address?.[activeLang] || ''}
                onChange={e => handleI18nChange('address', e.target.value)}
                rows={2}
                placeholder="Ví dụ: 11 Ngô Đức Kế, Sài Gòn, Hồ Chí Minh 700000, Vietnam"
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-2">Tiêu đề Cột Chi nhánh</label>
                <input
                  type="text"
                  value={content.locationsTitle?.[activeLang] || ''}
                  onChange={e => handleI18nChange('locationsTitle', e.target.value)}
                  className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-2">Tiêu đề Cột Liên hệ</label>
                <input
                  type="text"
                  value={content.contactTitle?.[activeLang] || ''}
                  onChange={e => handleI18nChange('contactTitle', e.target.value)}
                  className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Giá trị Cốt lõi (Our Core Values) */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-admin-line-strong">
            <div>
              <h2 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <Sparkles className="text-admin-gold" size={20} />
                Quản lý Giá trị Cốt lõi (Our Core Values)
              </h2>
              <p className="text-admin-text-dim text-sm mt-1">
                Chỉnh sửa hình ảnh, icon và tiêu đề cho 6 trụ cột Giá trị Cốt lõi hiển thị ở phần chân trang Footer.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1.5 rounded-xl bg-admin-bg border border-admin-line-strong text-admin-gold font-medium">
                Ngôn ngữ: {LANGUAGES.find(l => l.code === activeLang)?.flag} {LANGUAGES.find(l => l.code === activeLang)?.label}
              </span>
            </div>
          </div>

          {/* Section Heading Title */}
          <div className="mb-8 p-4 rounded-xl bg-admin-bg/60 border border-admin-line-strong">
            <label className="block text-sm font-semibold text-admin-text mb-2">
              Tiêu đề Tiết mục (Section Title) - {LANGUAGES.find(l => l.code === activeLang)?.label}
            </label>
            <input
              type="text"
              value={content.coreValuesSectionTitle?.[activeLang] || ''}
              onChange={e => {
                const val = e.target.value;
                setContent((prev: any) => ({
                  ...prev,
                  coreValuesSectionTitle: {
                    ...(prev.coreValuesSectionTitle || {}),
                    [activeLang]: val
                  }
                }));
              }}
              placeholder={DEFAULT_CORE_VALUES_SECTION_TITLE[activeLang as keyof typeof DEFAULT_CORE_VALUES_SECTION_TITLE] || 'GIÁ TRỊ CỐT LÕI'}
              className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors font-medium"
            />
          </div>

          {/* Grid of 6 Core Values */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {DEFAULT_CORE_VALUES.map((def, index) => {
              const currentItem = content.coreValues?.[index] || {};
              const currentImgSrc = currentItem.imgSrc !== undefined ? currentItem.imgSrc : def.defaultImgSrc;
              const applyGold = currentItem.applyGoldFilter !== undefined ? Boolean(currentItem.applyGoldFilter) : Boolean(def.defaultImgSrc);
              const currentTitle = currentItem.title?.[activeLang] || '';
              const isUploading = uploadingIndex === index;

              return (
                <div 
                  key={def.id}
                  className="rounded-xl border border-admin-line-strong bg-admin-bg/40 p-5 flex flex-col justify-between hover:border-admin-gold/40 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Header card */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-admin-gold/10 text-admin-gold border border-admin-gold/20">
                        #{index + 1} • {def.id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleResetCoreValueImage(index)}
                        title="Khôi phục ảnh & cài đặt mặc định"
                        className="text-xs text-admin-text-dim hover:text-admin-gold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} />
                        Khôi phục gốc
                      </button>
                    </div>

                    {/* Preview + Upload Controls */}
                    <div className="flex items-start gap-4 p-3 rounded-lg bg-[rgba(40,27,21,0.6)] border border-[#f7ebc7]/10">
                      {/* Dark preview square matching footer color */}
                      <div className="w-20 h-20 rounded-xl bg-[rgba(40,27,21,1)] border border-[#f7ebc7]/20 flex items-center justify-center shrink-0 overflow-hidden relative shadow-inner">
                        {currentImgSrc ? (
                          <img
                            src={currentImgSrc}
                            alt={currentTitle || def.title.vi}
                            className="w-14 h-14 object-contain"
                            style={applyGold ? {
                              filter: 'brightness(0) saturate(100%) invert(92%) sepia(16%) saturate(444%) hue-rotate(350deg) brightness(101%) contrast(94%)',
                              WebkitFilter: 'brightness(0) saturate(100%) invert(92%) sepia(16%) saturate(444%) hue-rotate(350deg) brightness(101%) contrast(94%)',
                            } : undefined}
                          />
                        ) : def.defaultIcon === 'HeartPulse' ? (
                          <HeartPulse size={40} className="text-[#f7ebc7]" strokeWidth={1.2} />
                        ) : def.defaultIcon === 'ShieldCheck' ? (
                          <ShieldCheck size={40} className="text-[#f7ebc7]" strokeWidth={1.2} />
                        ) : (
                          <ImageIcon size={32} className="text-[#f7ebc7]/40" />
                        )}

                        {isUploading && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <RefreshCw className="animate-spin text-admin-gold" size={20} />
                          </div>
                        )}
                      </div>

                      {/* Upload & Options */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-admin-panel hover:bg-admin-panel/80 border border-admin-line text-xs font-semibold text-admin-text transition-colors shadow-sm">
                            <Upload size={13} className="text-admin-gold" />
                            {isUploading ? 'Đang tải lên...' : 'Tải ảnh mới'}
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={isUploading}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadImage(index, file);
                                e.target.value = '';
                              }}
                            />
                          </label>

                          {currentImgSrc && (
                            <button
                              type="button"
                              onClick={() => handleCoreValueChange(index, 'imgSrc', '')}
                              className="px-2.5 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-950/20 transition-colors cursor-pointer"
                            >
                              Xoá ảnh
                            </button>
                          )}
                        </div>

                        {/* Gold filter toggle */}
                        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-admin-text-dim hover:text-admin-text">
                          <input
                            type="checkbox"
                            checked={applyGold}
                            onChange={e => handleCoreValueChange(index, 'applyGoldFilter', e.target.checked)}
                            className="rounded border-admin-line-strong text-admin-gold focus:ring-0 w-3.5 h-3.5 bg-admin-bg cursor-pointer"
                          />
                          <span>Hiệu ứng vàng kim (Gold Filter)</span>
                        </label>
                        <p className="text-[11px] text-admin-text-dim/70 leading-tight">
                          {applyGold ? 'Đang bật hiệu ứng vàng cho icon đơn sắc.' : 'Đang giữ nguyên màu gốc của ảnh/hình chụp.'}
                        </p>
                      </div>
                    </div>

                    {/* Image URL input */}
                    <div>
                      <label className="block text-xs font-semibold text-admin-text-dim mb-1">
                        Đường dẫn ảnh (URL hoặc đường dẫn file)
                      </label>
                      <input
                        type="text"
                        value={currentImgSrc || ''}
                        onChange={e => handleCoreValueChange(index, 'imgSrc', e.target.value)}
                        placeholder="https://... hoặc /images/core-values/..."
                        className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-3 py-2 text-admin-text text-xs focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                      />
                    </div>

                    {/* Title in Active Language */}
                    <div>
                      <label className="block text-xs font-semibold text-admin-text-dim mb-1">
                        Tiêu đề ({LANGUAGES.find(l => l.code === activeLang)?.label})
                      </label>
                      <input
                        type="text"
                        value={currentTitle}
                        onChange={e => handleCoreValueTitleChange(index, activeLang, e.target.value)}
                        placeholder={def.title[activeLang as keyof typeof def.title] || def.title.vi}
                        className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-3 py-2 text-admin-text text-sm font-semibold tracking-wide focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section: Liên hệ & Mạng xã hội */}
        <section className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-admin-text mb-6 pb-4 border-b border-admin-line-strong">
            Thông tin Liên hệ & Mạng xã hội
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Số Hotline / Điện thoại</label>
              <input
                type="text"
                value={content.phone || ''}
                onChange={e => handleChange('phone', e.target.value)}
                placeholder="+84964090277"
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Link / SĐT Zalo</label>
              <input
                type="text"
                value={content.zalo || ''}
                onChange={e => handleChange('zalo', e.target.value)}
                placeholder="+84964090277 hoặc https://zalo.me/..."
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Link / SĐT WhatsApp</label>
              <input
                type="text"
                value={content.whatsapp || ''}
                onChange={e => handleChange('whatsapp', e.target.value)}
                placeholder="+84964090277 hoặc link https://wa.me/..."
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">LINE ID / Link</label>
              <input
                type="text"
                value={content.line || ''}
                onChange={e => handleChange('line', e.target.value)}
                placeholder="ID hoặc link https://line.me/..."
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">WeChat ID / Link</label>
              <input
                type="text"
                value={content.wechat || ''}
                onChange={e => handleChange('wechat', e.target.value)}
                placeholder="+84964090277 hoặc ID"
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Link / ID KakaoTalk</label>
              <input
                type="text"
                value={content.kakaotalk || ''}
                onChange={e => handleChange('kakaotalk', e.target.value)}
                placeholder="https://pf.kakao.com/... hoặc ID"
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Link Facebook (Để trống nếu không dùng)</label>
              <input
                type="text"
                value={content.facebook || ''}
                onChange={e => handleChange('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Link Instagram (Để trống nếu không dùng)</label>
              <input
                type="text"
                value={content.instagram || ''}
                onChange={e => handleChange('instagram', e.target.value)}
                placeholder="https://instagram.com/... hoặc @oriaspa.sg"
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-2">Link TikTok (Để trống nếu không dùng)</label>
              <input
                type="text"
                value={content.tiktok || ''}
                onChange={e => handleChange('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@... hoặc @oriaspa.sg"
                className="w-full bg-admin-bg border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-sm focus:border-admin-gold focus:ring-1 focus:ring-admin-gold outline-none transition-colors"
              />
            </div>
          </div>
        </section>
        
        {/* Section: Cài đặt chung */}
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
