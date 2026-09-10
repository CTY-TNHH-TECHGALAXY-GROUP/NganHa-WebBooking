'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Save,
  ArrowLeft,
  Image as ImageIcon,
  Compass,
  Upload,
  CheckCircle2,
  AlertCircle,
  Eye,
  RotateCcw,
  Sparkles,
  Clock,
  Layers,
  FileText,
  Plus,
  Trash2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  DEFAULT_LOCAL_TOUR_CONFIG,
  hydrateLocalTourConfig,
  type LocalTourConfig,
  type LocalTourDestination,
  type LocalTourPackage,
} from '@/data/localTourData';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

export default function LocalTourAdminPage() {
  const [config, setConfig] = useState<LocalTourConfig>(DEFAULT_LOCAL_TOUR_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<string>('vi');
  const [mainTab, setMainTab] = useState<'packages' | 'destinations' | 'intro'>('packages');
  const [activePackageTab, setActivePackageTab] = useState<number>(0);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [uploadingHlKey, setUploadingHlKey] = useState<string | null>(null);
  const [newImageUrlInputs, setNewImageUrlInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  // Load existing configuration from API (system-settings & content fallback)
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/system-settings').then((res) => (res.ok ? res.json() : null)),
      fetch('/api/admin/content').then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([settingsData, contentData]) => {
        const remoteTour =
          settingsData?.local_tour_content ||
          contentData?.data?.local_tour_content ||
          contentData?.local_tour_content;
        if (remoteTour) {
          setConfig(hydrateLocalTourConfig(remoteTour));
        } else {
          setConfig(DEFAULT_LOCAL_TOUR_CONFIG);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load local tour admin content:', err);
        setLoading(false);
      });
  }, []);

  // Save updated config to both system-settings and content
  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const [resSettings, resContent] = await Promise.all([
        fetch('/api/admin/system-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ local_tour_content: config }),
        }),
        fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ local_tour_content: config }),
        }),
      ]);

      if (resSettings.ok || resContent.ok) {
        setMessage({ type: 'success', text: '✅ Đã lưu cấu hình Local Tour và đồng bộ trực tiếp lên Weblive thành công!' });
      } else {
        setMessage({ type: 'error', text: 'Có lỗi xảy ra khi lưu cấu hình. Vui lòng thử lại.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: `Lỗi kết nối máy chủ: ${err?.message || ''}` });
    } finally {
      setSaving(false);
    }
  };

  // Upload image to Supabase Storage - applies to dest.image for ALL 5 languages
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, destId: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(destId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `local-tour/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        alert('Lỗi tải ảnh lên: ' + error.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-uploads').getPublicUrl(data.path);

      updateDestinationImage(destId, publicUrl);
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể tải ảnh lên'));
    } finally {
      setUploadingId(null);
    }
  };

  // 1 Image URL applies to all 5 languages
  const updateDestinationImage = (destId: number, url: string) => {
    setConfig((prev) => ({
      ...prev,
      destinations: prev.destinations.map((d) => (d.id === destId ? { ...d, image: url } : d)),
    }));
  };

  // Update Destination Name for activeLang
  const updateDestinationName = (destId: number, text: string) => {
    setConfig((prev) => ({
      ...prev,
      destinations: prev.destinations.map((d) => {
        if (d.id !== destId) return d;
        return {
          ...d,
          name: {
            ...d.name,
            [activeLang]: text,
          },
        };
      }),
    }));
  };

  // Package field updates for activeLang
  const updatePackageField = (pkgIndex: number, field: keyof LocalTourPackage, value: any) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      if (field === 'title' || field === 'time' || field === 'bestFor') {
        pkg[field] = {
          ...(pkg[field] as Record<string, string>),
          [activeLang]: value,
        };
      }
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Update schedule line for activeLang
  const updateScheduleItem = (pkgIndex: number, schedIndex: number, value: string) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextSchedule = [...(pkg.schedule || [])];
      nextSchedule[schedIndex] = {
        ...(nextSchedule[schedIndex] || {}),
        [activeLang]: value,
      };
      pkg.schedule = nextSchedule;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Update paragraph for activeLang
  const updateParagraph = (pkgIndex: number, pIndex: number, value: string) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextParagraphs = [...(pkg.paragraphs || [])];
      nextParagraphs[pIndex] = {
        ...(nextParagraphs[pIndex] || {}),
        [activeLang]: value,
      };
      pkg.paragraphs = nextParagraphs;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Update Highlight Title for activeLang
  const updateHighlightTitle = (pkgIndex: number, hlIndex: number, text: string) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextHighlights = [...(pkg.highlights || [])];
      const hl = { ...nextHighlights[hlIndex] };
      hl.title = {
        ...(hl.title || {}),
        [activeLang]: text,
      };
      nextHighlights[hlIndex] = hl;
      pkg.highlights = nextHighlights;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Update Highlight Subtitle for activeLang
  const updateHighlightSubtitle = (pkgIndex: number, hlIndex: number, text: string) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextHighlights = [...(pkg.highlights || [])];
      const hl = { ...nextHighlights[hlIndex] };
      hl.subtitle = {
        ...(hl.subtitle || {}),
        [activeLang]: text,
      };
      nextHighlights[hlIndex] = hl;
      pkg.highlights = nextHighlights;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Add Image to Highlight card
  const addImageToHighlight = (pkgIndex: number, hlIndex: number, imageUrl: string) => {
    if (!imageUrl.trim()) return;
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextHighlights = [...(pkg.highlights || [])];
      const hl = { ...nextHighlights[hlIndex] };
      const currentImages = Array.isArray(hl.images) && hl.images.length > 0
        ? [...hl.images]
        : (hl.image ? [hl.image] : []);
      const newImages = [...currentImages, imageUrl.trim()];
      hl.images = newImages;
      hl.image = newImages[0];
      nextHighlights[hlIndex] = hl;
      pkg.highlights = nextHighlights;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Remove Image from Highlight card
  const removeImageFromHighlight = (pkgIndex: number, hlIndex: number, imgIndex: number) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextHighlights = [...(pkg.highlights || [])];
      const hl = { ...nextHighlights[hlIndex] };
      const currentImages = Array.isArray(hl.images) && hl.images.length > 0
        ? [...hl.images]
        : (hl.image ? [hl.image] : []);
      if (currentImages.length <= 1) {
        alert('Mỗi thẻ cần giữ lại ít nhất 1 ảnh.');
        return prev;
      }
      currentImages.splice(imgIndex, 1);
      hl.images = currentImages;
      hl.image = currentImages[0];
      nextHighlights[hlIndex] = hl;
      pkg.highlights = nextHighlights;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Upload image to Highlight card via Supabase
  const handleHighlightImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    pkgIndex: number,
    hlIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadKey = `pkg-${pkgIndex}-hl-${hlIndex}`;
    setUploadingHlKey(uploadKey);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `local-tour/highlights/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        alert('Lỗi tải ảnh lên: ' + error.message);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from('media-uploads').getPublicUrl(data.path);

      addImageToHighlight(pkgIndex, hlIndex, publicUrl);
    } catch (err: any) {
      alert('Lỗi: ' + (err?.message || 'Không thể tải ảnh lên'));
    } finally {
      setUploadingHlKey(null);
    }
  };

  // Add new Highlight Card
  const handleAddHighlightCard = (pkgIndex: number) => {
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextHighlights = [...(pkg.highlights || [])];
      nextHighlights.push({
        image: 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
        images: [
          'https://images.unsplash.com/photo-1583417319070-4a69db38a482?auto=format&fit=crop&w=900&q=80',
        ],
        title: {
          vi: 'Điểm Nhấn Trải Nghiệm Mới',
          en: 'New Experience Highlight',
          cn: '新体验亮点',
          kr: '새로운 하이라이트',
          jp: '新しい見どころ',
        },
        subtitle: {
          vi: 'Mô tả chi tiết điểm nhấn trải nghiệm cho khách hàng...',
          en: 'Detailed highlight description for guests...',
          cn: '精彩亮点体验介绍...',
          kr: '고객을 위한 상세 하이라이트 설명...',
          jp: '旅の見どころについての詳細...',
        },
      });
      pkg.highlights = nextHighlights;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Delete Highlight Card
  const handleDeleteHighlightCard = (pkgIndex: number, hlIndex: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa thẻ điểm nhấn này?')) return;
    setConfig((prev) => {
      const nextPackages = [...prev.packages];
      const pkg = { ...nextPackages[pkgIndex] };
      const nextHighlights = [...(pkg.highlights || [])];
      nextHighlights.splice(hlIndex, 1);
      pkg.highlights = nextHighlights;
      nextPackages[pkgIndex] = pkg;
      return { ...prev, packages: nextPackages };
    });
  };

  // Global intro/closing field updates for activeLang
  const updateGlobalField = (field: 'docTitle' | 'docScript' | 'docIntro' | 'docIntroSub' | 'docClosing' | 'address', value: string) => {
    setConfig((prev) => ({
      ...prev,
      [field]: {
        ...(prev[field] as Record<string, string> || {}),
        [activeLang]: value,
      },
    }));
  };

  const handleResetDefaults = () => {
    if (confirm('Khôi phục lại toàn bộ nội dung và ảnh gốc theo tài liệu chuẩn?')) {
      setConfig(DEFAULT_LOCAL_TOUR_CONFIG);
      setMessage({
        type: 'success',
        text: 'Đã khôi phục dữ liệu mặc định ban đầu. Nhấn "Lưu Thay Đổi" để cập nhật lên website.',
      });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-admin-text-faint">
        Đang tải dữ liệu quản trị Local Tour từ Weblive...
      </div>
    );
  }

  const activePackage = config.packages[activePackageTab] || config.packages[0];
  const activeDestinations = activePackage.destinationIds
    .map((id) => config.destinations.find((d) => d.id === id))
    .filter((d): d is LocalTourDestination => Boolean(d));

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-28">
      {/* Header & Main Controls */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-admin-text flex items-center gap-3">
              <Compass className="text-admin-gold" size={28} /> Quản Trị Local Tour Sài Gòn
            </h1>
            <p className="text-admin-text-dim mt-2 text-sm">
              Đồng bộ trực tiếp Weblive — Chỉnh sửa 5 ngôn ngữ — 1 link ảnh sử dụng chung cho 5 ngôn ngữ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/local-tour"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-admin-card border border-admin-line text-admin-text rounded-xl text-sm font-semibold hover:bg-admin-line transition-all"
            >
              <Eye size={16} /> Xem Trang Web
            </Link>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              <Save size={18} />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {message.text && (
          <div
            className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm ${
              message.type === 'success'
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-red-500/10 border border-red-500/20 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Language Switcher Bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 p-4 bg-admin-card rounded-2xl border border-admin-line">
        <div className="flex items-center gap-2 text-xs font-semibold text-admin-text-dim uppercase tracking-wider">
          <Sparkles size={16} className="text-admin-gold" />
          <span>Ngôn ngữ đang chỉnh sửa:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setActiveLang(lang.code)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeLang === lang.code
                  ? 'bg-admin-gold text-[#241804] font-bold shadow-md scale-105'
                  : 'bg-admin-line text-admin-text-dim hover:text-admin-text hover:bg-admin-line-strong'
              }`}
            >
              <span className="text-sm">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Navigation Sections */}
      <div className="flex gap-2 border-b border-admin-line mb-8 pb-1">
        <button
          type="button"
          onClick={() => setMainTab('packages')}
          className={`px-5 py-3 rounded-t-xl text-sm transition-all flex items-center gap-2 ${
            mainTab === 'packages'
              ? 'bg-admin-card border-t-2 border-t-admin-gold border-x border-admin-line text-admin-text font-bold -mb-[5px] border-b-2 border-b-admin-card shadow-sm'
              : 'text-admin-text-dim hover:text-admin-text font-medium'
          }`}
        >
          <Layers size={16} className={mainTab === 'packages' ? 'text-admin-gold' : 'text-admin-text-dim'} /> 3 Gói Trải Nghiệm &amp; Lịch Trình
        </button>
        <button
          type="button"
          onClick={() => setMainTab('destinations')}
          className={`px-5 py-3 rounded-t-xl text-sm transition-all flex items-center gap-2 ${
            mainTab === 'destinations'
              ? 'bg-admin-card border-t-2 border-t-admin-gold border-x border-admin-line text-admin-text font-bold -mb-[5px] border-b-2 border-b-admin-card shadow-sm'
              : 'text-admin-text-dim hover:text-admin-text font-medium'
          }`}
        >
          <ImageIcon size={16} className={mainTab === 'destinations' ? 'text-admin-gold' : 'text-admin-text-dim'} /> Thư Viện 10 Điểm Dừng &amp; Ảnh Phim
        </button>
        <button
          type="button"
          onClick={() => setMainTab('intro')}
          className={`px-5 py-3 rounded-t-xl text-sm transition-all flex items-center gap-2 ${
            mainTab === 'intro'
              ? 'bg-admin-card border-t-2 border-t-admin-gold border-x border-admin-line text-admin-text font-bold -mb-[5px] border-b-2 border-b-admin-card shadow-sm'
              : 'text-admin-text-dim hover:text-admin-text font-medium'
          }`}
        >
          <FileText size={16} className={mainTab === 'intro' ? 'text-admin-gold' : 'text-admin-text-dim'} /> Tiêu Đề, Mở Đầu &amp; Địa Chỉ Chân Trang
        </button>
      </div>

      {/* TAB 1: PACKAGES & SCHEDULES */}
      {mainTab === 'packages' && (
        <div className="space-y-8">
          {/* Subtabs for Packages */}
          <div className="flex gap-2 border-b border-admin-line pb-1 overflow-x-auto">
            {config.packages.map((pkg, idx) => (
              <button
                key={pkg.id}
                type="button"
                onClick={() => setActivePackageTab(idx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2.5 ${
                  activePackageTab === idx
                    ? 'bg-admin-gold text-[#241804] border border-[#a67433] shadow-md'
                    : 'bg-admin-card text-admin-text border border-admin-line hover:border-admin-line-strong hover:text-black'
                }`}
              >
                <span className={activePackageTab === idx ? 'text-[#241804] font-extrabold' : 'text-admin-text-faint font-semibold'}>
                  {pkg.orderNumber}.
                </span>
                <span className={activePackageTab === idx ? 'text-[#241804] font-bold' : 'text-admin-text font-medium'}>
                  {pkg.title[activeLang] || pkg.title['vi']}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                    activePackageTab === idx
                      ? 'bg-[#241804] text-[#f7ebc7]'
                      : 'bg-admin-line text-admin-text-dim'
                  }`}
                >
                  {pkg.destinationIds.length} ảnh
                </span>
              </button>
            ))}
          </div>

          {/* Active Package Form */}
          <div className="bg-admin-card rounded-2xl border border-admin-line p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-admin-line pb-4">
              <div>
                <span className="text-xs font-bold text-admin-gold uppercase tracking-wider">
                  Gói {activePackage.orderNumber}
                </span>
                <h2 className="text-xl font-bold text-admin-text mt-1">
                  {activePackage.title[activeLang] || activePackage.title['vi']}
                </h2>
              </div>
              <span className="text-xs text-admin-text-faint bg-admin-bg px-3 py-1.5 rounded-lg border border-admin-line">
                Ngôn ngữ: <strong>{activeLang.toUpperCase()}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                  Tên Gói Trải Nghiệm ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={activePackage.title[activeLang] || ''}
                  onChange={(e) => updatePackageField(activePackageTab, 'title', e.target.value)}
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                  Thời Gian / Khung Giờ ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={activePackage.time[activeLang] || ''}
                  onChange={(e) => updatePackageField(activePackageTab, 'time', e.target.value)}
                  placeholder="Ví dụ: 9:00 SÁNG - 7:00 TỐI (TRỌN NGÀY)"
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                Phù Hợp Cho ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={activePackage.bestFor[activeLang] || ''}
                onChange={(e) => updatePackageField(activePackageTab, 'bestFor', e.target.value)}
                className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
              />
            </div>

            {/* Schedule Items if applicable */}
            {activePackage.schedule && activePackage.schedule.length > 0 && (
              <div className="pt-4 border-t border-admin-line space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-admin-gold flex items-center gap-2">
                    <Clock size={16} /> Các Mốc Lịch Trình ({activePackage.schedule.length} mốc)
                  </h3>
                  <span className="text-xs text-admin-text-faint italic">
                    (Không viền khung trên trang web khách)
                  </span>
                </div>

                <div className="space-y-3">
                  {activePackage.schedule.map((item, sIdx) => (
                    <div key={'sched-edit-' + sIdx} className="flex items-center gap-3">
                      <span className="text-xs text-admin-gold font-mono w-6 text-center shrink-0">
                        #{sIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={item[activeLang] || ''}
                        onChange={(e) => updateScheduleItem(activePackageTab, sIdx, e.target.value)}
                        className="flex-1 bg-admin-bg text-sm text-admin-text p-2.5 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Paragraphs */}
            <div className="pt-4 border-t border-admin-line space-y-4">
              <h3 className="text-sm font-bold text-admin-text flex items-center gap-2">
                <FileText size={16} className="text-admin-gold" /> Các Đoạn Văn Giới Thiệu / Kể Chuyện
              </h3>

              <div className="space-y-4">
                {activePackage.paragraphs.map((para, pIdx) => (
                  <div key={'para-edit-' + pIdx} className="space-y-1.5">
                    <label className="text-xs text-admin-text-dim block">
                      Đoạn {pIdx + 1} ({activeLang.toUpperCase()}):
                    </label>
                    <textarea
                      rows={3}
                      value={para[activeLang] || ''}
                      onChange={(e) => updateParagraph(activePackageTab, pIdx, e.target.value)}
                      className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* HIGHLIGHTS: EXPERIENCE CARDS & HORIZONTAL PHOTO GALLERY */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-admin-text flex items-center gap-2">
                  <Sparkles size={20} className="text-admin-gold" />
                  Điểm Nhấn Trải Nghiệm (Highlights) — Thẻ Ảnh Cuộn Ngang
                </h3>
                <p className="text-xs text-admin-text-dim mt-1">
                  Mỗi thẻ được quyền thêm nhiều ảnh để khách cuộn/lướt ngang (swipe) trên điện thoại và máy tính.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleAddHighlightCard(activePackageTab)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-admin-gold/15 border border-admin-gold/30 hover:bg-admin-gold/25 text-admin-gold text-xs font-bold rounded-xl transition-all self-start sm:self-auto"
              >
                <Plus size={14} /> Thêm Thẻ Điểm Nhấn Mới
              </button>
            </div>

            <div className="space-y-6">
              {(activePackage.highlights || []).map((hl, hlIdx) => {
                const hlImages = Array.isArray(hl.images) && hl.images.length > 0
                  ? hl.images
                  : (hl.image ? [hl.image] : []);
                const inputKey = `${activePackageTab}-${hlIdx}`;
                const uploadKey = `pkg-${activePackageTab}-hl-${hlIdx}`;

                return (
                  <div
                    key={'hl-admin-' + hlIdx}
                    className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-5 hover:border-admin-line-strong transition-all"
                  >
                    {/* Header of Highlight Card */}
                    <div className="flex items-center justify-between border-b border-admin-line pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-admin-gold/20 text-admin-gold text-xs font-bold flex items-center justify-center">
                          {String(hlIdx + 1).padStart(2, '0')}
                        </span>
                        <span className="text-sm font-bold text-admin-text">
                          {hl.title[activeLang] || hl.title['vi'] || `Thẻ Điểm Nhấn #${hlIdx + 1}`}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-admin-line text-admin-text-dim font-semibold">
                          {hlImages.length} ảnh
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHighlightCard(activePackageTab, hlIdx)}
                        className="text-xs text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors flex items-center gap-1"
                        title="Xóa thẻ này"
                      >
                        <Trash2 size={14} />
                        <span>Xóa thẻ</span>
                      </button>
                    </div>

                    {/* Title & Subtitle for activeLang */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                          Tiêu Đề Thẻ ({activeLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={hl.title[activeLang] || ''}
                          onChange={(e) => updateHighlightTitle(activePackageTab, hlIdx, e.target.value)}
                          placeholder="Ví dụ: Dạo Bước Đường Đồng Khởi..."
                          className="w-full bg-admin-bg text-sm text-admin-text p-2.5 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                          Phụ Đề / Lời Dẫn Ngắn ({activeLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          value={hl.subtitle[activeLang] || ''}
                          onChange={(e) => updateHighlightSubtitle(activePackageTab, hlIdx, e.target.value)}
                          placeholder="Ví dụ: Khởi hành từ Oria Spa bên bờ sông..."
                          className="w-full bg-admin-bg text-sm text-admin-text p-2.5 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                        />
                      </div>
                    </div>

                    {/* Image Gallery & Actions */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs uppercase tracking-wider text-admin-text-dim font-semibold">
                          Thư Viện Ảnh Của Thẻ Này ({hlImages.length} ảnh — cuộn ngang trên weblive)
                        </label>
                        <span className="text-[11px] text-amber-300/80">
                          {hlImages.length > 1 ? '✨ Đang kích hoạt cuộn ngang & số đếm ảnh' : 'ℹ️ Thêm ảnh thứ 2 để bật cuộn ngang'}
                        </span>
                      </div>

                      {/* Thumbnails list */}
                      <div className="flex items-center gap-3 overflow-x-auto pb-2">
                        {hlImages.map((imgUrl, imgIdx) => (
                          <div
                            key={'hl-thumb-' + imgIdx}
                            className="relative group rounded-xl overflow-hidden border border-admin-line w-28 aspect-[16/11] bg-black/40 shrink-0"
                          >
                            <img
                              src={imgUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-admin-gold font-mono">
                              #{imgIdx + 1}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeImageFromHighlight(activePackageTab, hlIdx, imgIdx)}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              title="Xóa ảnh này"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Upload & Add URL controls */}
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                        <label className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl cursor-pointer transition-colors shrink-0">
                          <Upload size={14} />
                          <span>{uploadingHlKey === uploadKey ? 'Đang tải ảnh...' : 'Tải thêm ảnh lên'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingHlKey === uploadKey}
                            className="hidden"
                            onChange={(e) => handleHighlightImageUpload(e, activePackageTab, hlIdx)}
                          />
                        </label>

                        <div className="flex-1 flex gap-2">
                          <input
                            type="text"
                            placeholder="Hoặc dán URL ảnh mới vào đây..."
                            value={newImageUrlInputs[inputKey] || ''}
                            onChange={(e) =>
                              setNewImageUrlInputs((prev) => ({
                                ...prev,
                                [inputKey]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                const val = newImageUrlInputs[inputKey];
                                if (val) {
                                  addImageToHighlight(activePackageTab, hlIdx, val);
                                  setNewImageUrlInputs((prev) => ({ ...prev, [inputKey]: '' }));
                                }
                              }
                            }}
                            className="flex-1 bg-admin-bg text-xs text-admin-text p-2 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const val = newImageUrlInputs[inputKey];
                              if (val) {
                                addImageToHighlight(activePackageTab, hlIdx, val);
                                setNewImageUrlInputs((prev) => ({ ...prev, [inputKey]: '' }));
                              }
                            }}
                            className="px-3 py-2 bg-admin-card border border-admin-line hover:border-admin-gold text-admin-text text-xs font-semibold rounded-xl transition-all"
                          >
                            + Thêm
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Destinations & Shared Photos inside this package */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <ImageIcon size={20} className="text-admin-gold" />
                {activeDestinations.length} Điểm Dừng &amp; Ảnh Cuộn Phim Cho Gói Này
              </h3>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-full font-medium">
                <span>⚡ 1 Link ảnh dùng chung cho cả 5 ngôn ngữ</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeDestinations.map((dest, index) => (
                <div
                  key={'pkg-dest-' + dest.id}
                  className="p-5 rounded-2xl bg-admin-card border border-admin-line space-y-4 hover:border-admin-line-strong transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-admin-gold font-bold">
                      ĐIỂM {String(index + 1).padStart(2, '0')} (ID: {dest.id})
                    </span>
                    <span className="text-[10px] text-admin-text-faint bg-black/40 px-2 py-0.5 rounded">
                      Ảnh dùng chung 5 ngôn ngữ
                    </span>
                  </div>

                  {/* Photo Preview & Quick Upload */}
                  <div className="flex gap-4 items-start">
                    <div className="relative rounded-xl overflow-hidden border border-admin-line w-32 aspect-[4/3] bg-black/40 shrink-0">
                      <img
                        src={dest.image}
                        alt={dest.name[activeLang] || dest.name['vi']}
                        className="w-full h-full object-cover"
                      />
                      {uploadingId === dest.id && (
                        <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-admin-gold">
                          Đang tải...
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <label className="flex items-center justify-center gap-2 w-full py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                        <Upload size={14} />
                        <span>Tải ảnh mới</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleImageUpload(e, dest.id)}
                        />
                      </label>

                      <input
                        type="text"
                        value={dest.image}
                        onChange={(e) => updateDestinationImage(dest.id, e.target.value)}
                        placeholder="URL ảnh dùng chung..."
                        className="w-full bg-admin-bg text-[11px] text-admin-text-dim p-2 rounded-lg border border-admin-line focus:border-admin-gold outline-none"
                      />
                    </div>
                  </div>

                  {/* Destination Name for current language */}
                  <div>
                    <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                      Tên Điểm Dừng ({activeLang.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={dest.name[activeLang] || ''}
                      onChange={(e) => updateDestinationName(dest.id, e.target.value)}
                      className="w-full bg-admin-bg text-sm text-admin-text p-2.5 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-medium"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER DESTINATIONS GALLERY (ALL 10 DESTINATIONS) */}
      {mainTab === 'destinations' && (
        <div className="space-y-6">
          <div className="p-4 bg-admin-card rounded-xl border border-admin-line flex items-center justify-between">
            <p className="text-sm text-admin-text-dim">
              Đây là toàn bộ <strong>{config.destinations.length} điểm đến</strong> của Local Tour Sài Gòn. Bạn có thể thay đổi link ảnh một lần duy nhất để áp dụng tự động cho cả 5 ngôn ngữ.
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 border border-green-500/30 text-green-400 text-xs rounded-full font-semibold">
              <CheckCircle2 size={14} /> 1 Link ảnh dùng chung
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {config.destinations.map((dest) => (
              <div
                key={'master-dest-' + dest.id}
                className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4 hover:border-admin-line-strong transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-admin-gold font-bold">
                    ĐIỂM DỪNG #{dest.id}
                  </span>
                  <span className="text-xs text-admin-text-faint">
                    {activeLang.toUpperCase()}
                  </span>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="relative rounded-xl overflow-hidden border border-admin-line w-36 aspect-[4/3] bg-black/40 shrink-0">
                    <img
                      src={dest.image}
                      alt={dest.name[activeLang] || dest.name['vi']}
                      className="w-full h-full object-cover"
                    />
                    {uploadingId === dest.id && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-xs text-admin-gold">
                        Đang tải ảnh...
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="flex items-center justify-center gap-2 w-full py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-lg cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>Tải ảnh lên</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, dest.id)}
                      />
                    </label>

                    <input
                      type="text"
                      value={dest.image}
                      onChange={(e) => updateDestinationImage(dest.id, e.target.value)}
                      placeholder="URL ảnh dùng chung cho 5 ngôn ngữ..."
                      className="w-full bg-admin-bg text-[11px] text-admin-text-dim p-2 rounded-lg border border-admin-line focus:border-admin-gold outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                    Tên Điểm Dừng ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={dest.name[activeLang] || ''}
                    onChange={(e) => updateDestinationName(dest.id, e.target.value)}
                    className="w-full bg-admin-bg text-sm text-admin-text p-2.5 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-medium"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INTRO, HEADER & CLOSING */}
      {mainTab === 'intro' && (
        <div className="bg-admin-card rounded-2xl border border-admin-line p-6 space-y-6">
          <div className="border-b border-admin-line pb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-admin-text flex items-center gap-2">
              <FileText size={20} className="text-admin-gold" /> Tiêu Đề, Lời Dẫn &amp; Địa Chỉ Chân Trang
            </h2>
            <span className="text-xs text-admin-gold font-semibold">
              Ngôn ngữ: {activeLang.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                Tiêu Đề Chính ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={config.docTitle[activeLang] || ''}
                onChange={(e) => updateGlobalField('docTitle', e.target.value)}
                className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                Dòng Phụ Đề Thư Pháp Script ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={config.docScript[activeLang] || ''}
                onChange={(e) => updateGlobalField('docScript', e.target.value)}
                className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
              Đoạn Mở Đầu (Lead Intro) ({activeLang.toUpperCase()})
            </label>
            <textarea
              rows={3}
              value={config.docIntro[activeLang] || ''}
              onChange={(e) => updateGlobalField('docIntro', e.target.value)}
              className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none resize-y"
            />
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
              Dòng Phụ Mở Đầu ({activeLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={config.docIntroSub[activeLang] || ''}
              onChange={(e) => updateGlobalField('docIntroSub', e.target.value)}
              className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
            />
          </div>

          <div className="pt-4 border-t border-admin-line space-y-4">
            <h3 className="text-sm font-bold text-admin-gold">Thông Tin Kết Thúc &amp; Địa Chỉ</h3>

            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                Lời Kết Tour ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={config.docClosing[activeLang] || ''}
                onChange={(e) => updateGlobalField('docClosing', e.target.value)}
                className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none resize-y"
              />
            </div>

            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-2 font-semibold">
                Địa Chỉ Chân Trang ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={config.address?.[activeLang] || DEFAULT_LOCAL_TOUR_CONFIG.address?.[activeLang] || ''}
                onChange={(e) => updateGlobalField('address', e.target.value)}
                placeholder="Ngô Đức Kế, Sài Gòn, Thành phố Hồ Chí Minh"
                className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
              />
              <p className="text-xs text-admin-text-faint mt-1.5">
                Mặc định: Ngô Đức Kế, Sài Gòn, Thành phố Hồ Chí Minh
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Reset Defaults & Save */}
      <div className="mt-12 pt-6 border-t border-admin-line flex items-center justify-between">
        <button
          type="button"
          onClick={handleResetDefaults}
          className="inline-flex items-center gap-2 text-xs text-admin-text-faint hover:text-admin-text transition-colors"
        >
          <RotateCcw size={14} /> Khôi phục toàn bộ nội dung &amp; ảnh gốc
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
        >
          <Save size={18} />
          {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
        </button>
      </div>
    </div>
  );
}
