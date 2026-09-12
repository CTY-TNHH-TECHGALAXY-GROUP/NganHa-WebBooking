'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  CheckCircle,
  AlertCircle,
  Upload,
  Sparkles,
  ClipboardPaste,
  X,
  ImageIcon,
  Video,
  FileText,
  HelpCircle,
  ExternalLink,
  Trees,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  DEFAULT_FARM_RETREAT_CONFIG,
  hydrateFarmRetreatConfig,
  type FarmRetreatConfig,
} from '@/data/farmRetreatData';
import { WatermarkControl } from '@/components/Admin/WatermarkControl';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

export default function FarmRetreatAdminPage() {
  const [config, setConfig] = useState<FarmRetreatConfig>(DEFAULT_FARM_RETREAT_CONFIG);
  const [activeLang, setActiveLang] = useState<string>('vi');
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);

  // Helper to mark dirty on edit
  const updateConfig = (updater: (prev: FarmRetreatConfig) => FarmRetreatConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  };

  // Load initial content from API
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/site-content?t=${Date.now()}`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          const remoteContent = data?.farm_retreat_content || data?.content?.farm_retreat_content;
          if (remoteContent) {
            setConfig(hydrateFarmRetreatConfig(remoteContent));
          }
        }
      } catch (err) {
        console.error('Failed to load farm-retreat content:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save changes
  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      // 1. Dual save to content API
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm_retreat_content: config }),
      });

      // 2. Dual save to system-settings API
      await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm_retreat_content: config }),
      }).catch((e) => console.warn('Sync to system-settings skipped:', e));

      if (res.ok) {
        setIsDirty(false);
        setMessage({
          type: 'success',
          text: 'Đã lưu cấu hình Oria Farm Retreat và đồng bộ Weblive thành công!',
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 4000);
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Lỗi khi lưu');
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể lưu dữ liệu' });
    } finally {
      setSaving(false);
    }
  };

  // Media Upload handler for Supabase (Image & Video)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'hero' | 'story-0' | 'story-1' | 'story-2' | 'story-3' | 'story-4'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);

    setUploadingKey(target);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const fileName = `oriafarm-retreat/${target}-${Date.now()}.${ext}`;

      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: publicUrlData } = supabase.storage
        .from('media-uploads')
        .getPublicUrl(fileName);

      const url = publicUrlData.publicUrl;

      if (target === 'hero') {
        updateConfig((prev) => ({
          ...prev,
          heroImage: url,
          heroMediaType: isVideo ? 'video' : 'image',
        }));
      } else {
        const idx = parseInt(target.replace('story-', ''), 10);
        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', ''])];
          while (nextPhotos.length < 5) nextPhotos.push('');
          nextPhotos[idx] = url;
          return { ...prev, storyPhotos: nextPhotos };
        });
      }

      setMessage({
        type: 'success',
        text: isVideo ? 'Tải video lên thành công!' : 'Tải ảnh lên thành công!',
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setMessage({
        type: 'error',
        text: (isVideo ? 'Tải video thất bại: ' : 'Tải ảnh thất bại: ') + err.message,
      });
    } finally {
      setUploadingKey(null);
    }
  };

  // Story photo labels and descriptions
  const STORY_PHOTO_LABELS = [
    { label: 'Khung Ảnh 01: Bungalow giữa thiên nhiên', pos: 'Nằm sau phần Mở đầu / Trước Section 1' },
    { label: 'Khung Ảnh 02: Góc thư giãn trà & sách', pos: 'Nằm sau Section 1 (Bungalow riêng cho ngày của bạn)' },
    { label: 'Khung Ảnh 03: Trị liệu & Tắm bồn ấm', pos: 'Nằm sau Section 2 (Xông hơi · Tắm bồn · Xoa bóp)' },
    { label: 'Khung Ảnh 04: Bàn ăn & Trà giữa thiên nhiên', pos: 'Nằm sau Section 3 (Ăn chậm lại)' },
    { label: 'Khung Ảnh 05: Hoàng hôn & Khung cảnh tĩnh lặng', pos: 'Nằm sau Section 4 (Không cần đi thật xa)' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-admin-gold">
          <div className="w-5 h-5 border-2 border-admin-gold border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Đang tải cấu hình Oria Farm Retreat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg pb-32">
      {/* HEADER */}
      <div className="sticky top-0 z-30 bg-admin-card/90 backdrop-blur-md border-b border-admin-line px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="p-2 rounded-xl bg-admin-line/50 hover:bg-admin-line text-admin-text-dim hover:text-admin-text transition-colors"
              title="Quay về Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-admin-text flex items-center gap-2">
                <Trees size={20} className="text-admin-gold" />
                Quản lý Oria Farm Retreat
              </h1>
              <p className="text-xs text-admin-text-faint">
                Điều chỉnh bài viết giới thiệu editorial, video/ảnh hero và 5 khung ảnh minh họa đan xen
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/oriafarm-retreat"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-admin-line/40 hover:bg-admin-line text-admin-text text-xs font-semibold transition-colors border border-admin-line"
            >
              <span>Xem Weblive</span>
              <ExternalLink size={13} />
            </Link>
          </div>
        </div>
      </div>

      {/* LANGUAGE SELECTOR TABS */}
      <div className="max-w-6xl mx-auto px-6 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded-2xl bg-admin-card border border-admin-line">
          <div className="flex items-center gap-1 text-xs text-admin-text-dim font-semibold px-3">
            <span>NGÔN NGỮ SỬA:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeLang === lang.code
                    ? 'bg-admin-gold text-admin-bg shadow-md'
                    : 'bg-admin-line/40 text-admin-text-dim hover:text-admin-text hover:bg-admin-line'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
          <span className="text-[11px] text-admin-text-faint px-3">
            Đang chỉnh sửa: <strong className="text-admin-gold uppercase">{activeLang}</strong>
          </span>
        </div>
      </div>

      {/* MAIN CONFIG CONTENT */}
      <div className="max-w-6xl mx-auto px-6 pt-6 space-y-8">
        {/* 1. HERO BANNER SECTION (VIDEO & IMAGE) */}
        <section className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-5">
          <div className="flex items-center justify-between border-b border-admin-line pb-3">
            <h2 className="text-base font-bold text-admin-gold flex items-center gap-2">
              <Video size={18} /> Media Hero Banner Toàn Cảnh &amp; Tiêu Đề
            </h2>
            <span className="text-xs text-admin-text-faint">Phần đầu trang khách</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Media Preview & Upload */}
            <div className="md:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block font-semibold">
                  Media Nền Hero Banner (16:9)
                </label>
                {/* Media type switcher */}
                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-admin-line text-[11px]">
                  <button
                    type="button"
                    onClick={() => updateConfig((prev) => ({ ...prev, heroMediaType: 'image' }))}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                      config.heroMediaType !== 'video'
                        ? 'bg-admin-gold/20 text-admin-gold font-bold'
                        : 'text-admin-text-faint hover:text-admin-text'
                    }`}
                  >
                    <ImageIcon size={12} />
                    <span>Ảnh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateConfig((prev) => ({ ...prev, heroMediaType: 'video' }))}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-all ${
                      config.heroMediaType === 'video'
                        ? 'bg-admin-gold/20 text-admin-gold font-bold'
                        : 'text-admin-text-faint hover:text-admin-text'
                    }`}
                  >
                    <Video size={12} />
                    <span>Video</span>
                  </button>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-admin-line w-full aspect-[16/9] bg-black/50">
                {config.heroImage ? (
                  (config.heroMediaType === 'video' || /\.(mp4|mov|webm)(\?.*)?$/i.test(config.heroImage)) ? (
                    <>
                      <video
                        src={config.heroImage}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-black/75 text-admin-gold border border-admin-gold/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                        <Video size={11} /> VIDEO HERO
                      </span>
                    </>
                  ) : (
                    <>
                      <img
                        src={config.heroImage}
                        alt="Hero banner"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2.5 left-2.5 bg-black/75 text-admin-text border border-admin-line text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-sm">
                        <ImageIcon size={11} /> ẢNH HERO
                      </span>
                    </>
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-admin-text-dim text-xs gap-2 p-4 text-center">
                    <div className="flex items-center gap-2 text-admin-gold opacity-50">
                      <ImageIcon size={24} />
                      <Video size={24} />
                    </div>
                    <span>Chưa có ảnh hoặc video Hero Banner</span>
                    <span className="text-[10px] text-admin-text-faint">
                      Dán link URL hoặc tải ảnh / video từ máy tính (MP4, MOV, WebM, JPG, PNG)
                    </span>
                  </div>
                )}
                {config.heroWatermarkEnabled !== false && Boolean(config.heroImage) && (
                  <div
                    className="media-watermark pointer-events-none"
                    aria-hidden="true"
                    style={{ opacity: (config.heroWatermarkOpacity ?? 15) / 100 }}
                  />
                )}
                {uploadingKey === 'hero' && (
                  <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs text-admin-gold font-semibold">
                    Đang tải lên...
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                  <Upload size={14} />
                  <span>Tải ảnh hoặc video mới từ máy tính</span>
                  <input
                    type="file"
                    accept="image/*, video/*, .mp4, .mov, .webm"
                    disabled={uploadingKey === 'hero'}
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'hero')}
                  />
                </label>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={config.heroImage ?? ''}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const isVid = /\.(mp4|mov|webm)(\?.*)?$/i.test(val);
                        updateConfig((prev) => ({
                          ...prev,
                          heroImage: val,
                          heroMediaType: isVid ? 'video' : prev.heroMediaType,
                        }));
                      }}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text');
                        if (pasted) {
                          e.preventDefault();
                          const trimmed = pasted.trim();
                          const isVid = /\.(mp4|mov|webm)(\?.*)?$/i.test(trimmed);
                          updateConfig((prev) => ({
                            ...prev,
                            heroImage: trimmed,
                            heroMediaType: isVid ? 'video' : prev.heroMediaType,
                          }));
                        }
                      }}
                      placeholder="Dán link URL ảnh hoặc video (.mp4, .mov...) vào đây..."
                      className="w-full bg-admin-bg text-xs text-admin-text p-2.5 pr-8 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-mono"
                    />
                    {config.heroImage ? (
                      <button
                        type="button"
                        onClick={() => updateConfig((prev) => ({ ...prev, heroImage: '' }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-text-faint hover:text-red-400 p-1"
                        title="Xóa link"
                      >
                        <X size={14} />
                      </button>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        if (text && text.trim()) {
                          const trimmed = text.trim();
                          const isVid = /\.(mp4|mov|webm)(\?.*)?$/i.test(trimmed);
                          updateConfig((prev) => ({
                            ...prev,
                            heroImage: trimmed,
                            heroMediaType: isVid ? 'video' : prev.heroMediaType,
                          }));
                        } else {
                          const url = prompt('Dán link URL ảnh hoặc video Hero vào đây:');
                          if (url) {
                            const trimmed = url.trim();
                            const isVid = /\.(mp4|mov|webm)(\?.*)?$/i.test(trimmed);
                            updateConfig((prev) => ({
                              ...prev,
                              heroImage: trimmed,
                              heroMediaType: isVid ? 'video' : prev.heroMediaType,
                            }));
                          }
                        }
                      } catch {
                        const url = prompt('Dán link URL ảnh hoặc video Hero vào đây:');
                        if (url) {
                          const trimmed = url.trim();
                          const isVid = /\.(mp4|mov|webm)(\?.*)?$/i.test(trimmed);
                          updateConfig((prev) => ({
                            ...prev,
                            heroImage: trimmed,
                            heroMediaType: isVid ? 'video' : prev.heroMediaType,
                          }));
                        }
                      }
                    }}
                    className="px-3.5 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                    title="Dán nhanh link từ bộ nhớ tạm"
                  >
                    <ClipboardPaste size={14} className="text-admin-gold" />
                    <span>Dán link</span>
                  </button>
                </div>

                <div className="pt-2">
                  <WatermarkControl
                    checked={config.heroWatermarkEnabled !== false}
                    opacity={config.heroWatermarkOpacity ?? 15}
                    onChangeChecked={(checked) => {
                      updateConfig((prev) => ({ ...prev, heroWatermarkEnabled: checked }));
                    }}
                    onChangeOpacity={(opacity) => {
                      updateConfig((prev) => ({ ...prev, heroWatermarkOpacity: opacity }));
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Title & Subtitle for activeLang */}
            <div className="md:col-span-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Tiêu đề trang ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={config.pageTitle?.[activeLang] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      pageTitle: { ...prev.pageTitle, [activeLang]: val },
                    }));
                  }}
                  placeholder="VD: Oria Farm Retreat"
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Khẩu hiệu / Phụ đề ngắn ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={config.pageSubtitle?.[activeLang] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      pageSubtitle: { ...prev.pageSubtitle, [activeLang]: val },
                    }));
                  }}
                  placeholder="VD: Một ngày rời khỏi thành phố"
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>

              <div className="p-4 rounded-xl bg-admin-bg/50 border border-admin-line text-xs space-y-2 text-admin-text-dim">
                <p className="font-semibold text-admin-text flex items-center gap-1.5">
                  <Sparkles size={14} className="text-admin-gold" />
                  Gợi ý thiết kế:
                </p>
                <p>
                  Tiêu đề và phụ đề sẽ hiển thị cân đối trên nền video/ảnh hero toàn cảnh. Logo chìm có thể bật/tắt linh hoạt để tạo cảm giác trang nhã nhất.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INTRO PARAGRAPHS */}
        <section className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4">
          <div className="flex items-center justify-between border-b border-admin-line pb-3">
            <h2 className="text-base font-bold text-admin-gold flex items-center gap-2">
              <FileText size={18} /> Lời Mở Đầu (Intro Paragraphs)
            </h2>
            <span className="text-xs text-admin-text-faint">Đoạn văn mở đầu bài viết</span>
          </div>

          <div className="space-y-4">
            {(config.introParagraphs || []).map((para, pIdx) => (
              <div key={'intro-field-' + pIdx} className="space-y-1.5">
                <label className="text-xs text-admin-text-dim font-medium block">
                  Đoạn {pIdx + 1} ({pIdx === 0 ? 'Dòng dẫn dắt / Lead' : 'Đoạn diễn giải'}) - {activeLang.toUpperCase()}:
                </label>
                <textarea
                  rows={pIdx === 3 ? 4 : 2}
                  value={para?.[activeLang] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => {
                      const nextIntro = [...(prev.introParagraphs || [])];
                      nextIntro[pIdx] = { ...(nextIntro[pIdx] || {}), [activeLang]: val };
                      return { ...prev, introParagraphs: nextIntro };
                    });
                  }}
                  className="w-full bg-admin-bg text-xs text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none leading-relaxed"
                />
              </div>
            ))}
          </div>
        </section>

        {/* 3. MEDIA FRAMES & EDITORIAL SECTIONS */}
        <div className="space-y-8">
          {config.sections.map((section, sIdx) => {
            const photoConfig = STORY_PHOTO_LABELS[sIdx];
            const currentPhotoUrl = config.storyPhotos?.[sIdx] || '';
            const watermarkOn = config.storyPhotosWatermark?.[sIdx] !== false;

            return (
              <div key={section.id || 'sec-' + sIdx} className="space-y-6">
                {/* Media Frame Slot */}
                {photoConfig && (
                  <div className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4">
                    <div className="flex items-center justify-between border-b border-admin-line pb-3">
                      <div>
                        <h3 className="text-sm font-bold text-admin-gold flex items-center gap-2">
                          <ImageIcon size={16} /> {photoConfig.label}
                        </h3>
                        <p className="text-[11px] text-admin-text-faint">{photoConfig.pos}</p>
                      </div>
                      <span className="text-[10px] text-admin-text-faint bg-black/40 px-2 py-0.5 rounded">
                        Chung 5 ngôn ngữ
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Photo preview */}
                      <div className="md:col-span-5">
                        <div className="relative rounded-xl overflow-hidden border border-admin-line w-full aspect-[16/9] bg-black/50">
                          {currentPhotoUrl ? (
                            <img
                              src={currentPhotoUrl}
                              alt={`Story photo ${sIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-admin-text-dim text-xs gap-2 p-4 text-center">
                              <ImageIcon size={24} className="opacity-40 text-admin-gold" />
                              <span>Chưa có Khung Ảnh 0{sIdx + 1}</span>
                              <span className="text-[10px] text-admin-text-faint">
                                Dán link URL hoặc tải ảnh từ máy tính
                              </span>
                            </div>
                          )}
                          {watermarkOn && Boolean(currentPhotoUrl) && (
                            <div
                              className="media-watermark pointer-events-none"
                              aria-hidden="true"
                              style={{ opacity: (config.storyPhotosWatermarkOpacity?.[sIdx] ?? 15) / 100 }}
                            />
                          )}
                          {uploadingKey === `story-${sIdx}` && (
                            <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs text-admin-gold font-semibold">
                              Đang tải ảnh lên...
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Photo inputs */}
                      <div className="md:col-span-7 space-y-3">
                        <label className="flex items-center justify-center gap-2 w-full py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                          <Upload size={14} />
                          <span>Tải ảnh mới từ máy tính</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={uploadingKey === `story-${sIdx}`}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, `story-${sIdx}` as any)}
                          />
                        </label>

                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={currentPhotoUrl}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateConfig((prev) => {
                                  const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                  while (nextP.length < 5) nextP.push('');
                                  nextP[sIdx] = val;
                                  return { ...prev, storyPhotos: nextP };
                                });
                              }}
                              onPaste={(e) => {
                                const pasted = e.clipboardData.getData('text');
                                if (pasted) {
                                  e.preventDefault();
                                  updateConfig((prev) => {
                                    const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                    while (nextP.length < 5) nextP.push('');
                                    nextP[sIdx] = pasted.trim();
                                    return { ...prev, storyPhotos: nextP };
                                  });
                                }
                              }}
                              placeholder="Dán link URL ảnh mới vào đây..."
                              className="w-full bg-admin-bg text-xs text-admin-text p-2.5 pr-8 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-mono"
                            />
                            {currentPhotoUrl ? (
                              <button
                                type="button"
                                onClick={() => {
                                  updateConfig((prev) => {
                                    const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                    while (nextP.length < 5) nextP.push('');
                                    nextP[sIdx] = '';
                                    return { ...prev, storyPhotos: nextP };
                                  });
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-text-faint hover:text-red-400 p-1"
                                title="Xóa link"
                              >
                                <X size={14} />
                              </button>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const text = await navigator.clipboard.readText();
                                if (text && text.trim()) {
                                  updateConfig((prev) => {
                                    const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                    while (nextP.length < 5) nextP.push('');
                                    nextP[sIdx] = text.trim();
                                    return { ...prev, storyPhotos: nextP };
                                  });
                                } else {
                                  const url = prompt(`Dán link URL Khung Ảnh 0${sIdx + 1} vào đây:`);
                                  if (url) {
                                    updateConfig((prev) => {
                                      const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                      while (nextP.length < 5) nextP.push('');
                                      nextP[sIdx] = url.trim();
                                      return { ...prev, storyPhotos: nextP };
                                    });
                                  }
                                }
                              } catch {
                                const url = prompt(`Dán link URL Khung Ảnh 0${sIdx + 1} vào đây:`);
                                if (url) {
                                  updateConfig((prev) => {
                                    const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                    while (nextP.length < 5) nextP.push('');
                                    nextP[sIdx] = url.trim();
                                    return { ...prev, storyPhotos: nextP };
                                  });
                                }
                              }
                            }}
                            className="px-3.5 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                            title="Dán link từ clipboard"
                          >
                            <ClipboardPaste size={14} className="text-admin-gold" />
                            <span>Dán link</span>
                          </button>
                        </div>

                        <WatermarkControl
                          checked={watermarkOn}
                          opacity={config.storyPhotosWatermarkOpacity?.[sIdx] ?? 15}
                          onChangeChecked={(checked) => {
                            updateConfig((prev) => {
                              const nextW = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
                              while (nextW.length < 5) nextW.push(true);
                              nextW[sIdx] = checked;
                              return { ...prev, storyPhotosWatermark: nextW };
                            });
                          }}
                          onChangeOpacity={(opacity) => {
                            updateConfig((prev) => {
                              const nextO = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];
                              while (nextO.length < 5) nextO.push(15);
                              nextO[sIdx] = opacity;
                              return { ...prev, storyPhotosWatermarkOpacity: nextO };
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Editorial Section Text Content */}
                <div className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4">
                  <div className="flex items-center justify-between border-b border-admin-line pb-3">
                    <h3 className="text-sm font-bold text-admin-gold flex items-center gap-2">
                      <FileText size={16} /> Phần {sIdx + 1}: Tiêu đề &amp; Đoạn văn ({activeLang.toUpperCase()})
                    </h3>
                  </div>

                  {/* Section heading */}
                  <div>
                    <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                      Tiêu đề phần ({activeLang.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={section.heading?.[activeLang] ?? ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateConfig((prev) => {
                          const nextSecs = [...prev.sections];
                          nextSecs[sIdx] = {
                            ...nextSecs[sIdx],
                            heading: { ...nextSecs[sIdx].heading, [activeLang]: val },
                          };
                          return { ...prev, sections: nextSecs };
                        });
                      }}
                      className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                    />
                  </div>

                  {/* Section paragraphs */}
                  <div className="space-y-3 pt-2">
                    <label className="text-xs uppercase tracking-wider text-admin-text-dim block font-semibold">
                      Các đoạn văn bản ({activeLang.toUpperCase()})
                    </label>
                    {section.paragraphs.map((p, pIdx) => (
                      <div key={'p-' + sIdx + '-' + pIdx} className="space-y-1">
                        <span className="text-[11px] text-admin-text-faint">Đoạn {pIdx + 1}:</span>
                        <textarea
                          rows={3}
                          value={p?.[activeLang] ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateConfig((prev) => {
                              const nextSecs = [...prev.sections];
                              const nextParas = [...nextSecs[sIdx].paragraphs];
                              nextParas[pIdx] = { ...nextParas[pIdx], [activeLang]: val };
                              nextSecs[sIdx] = { ...nextSecs[sIdx], paragraphs: nextParas };
                              return { ...prev, sections: nextSecs };
                            });
                          }}
                          className="w-full bg-admin-bg text-xs text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none leading-relaxed"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Fifth Media Frame Slot (Sunset / Landscape after Section 4) */}
          {STORY_PHOTO_LABELS[4] && (
            <div className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4">
              <div className="flex items-center justify-between border-b border-admin-line pb-3">
                <div>
                  <h3 className="text-sm font-bold text-admin-gold flex items-center gap-2">
                    <ImageIcon size={16} /> {STORY_PHOTO_LABELS[4].label}
                  </h3>
                  <p className="text-[11px] text-admin-text-faint">{STORY_PHOTO_LABELS[4].pos}</p>
                </div>
                <span className="text-[10px] text-admin-text-faint bg-black/40 px-2 py-0.5 rounded">
                  Chung 5 ngôn ngữ
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                {/* Photo preview */}
                <div className="md:col-span-5">
                  <div className="relative rounded-xl overflow-hidden border border-admin-line w-full aspect-[16/9] bg-black/50">
                    {config.storyPhotos?.[4] ? (
                      <img
                        src={config.storyPhotos[4]}
                        alt="Story photo 5"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-admin-text-dim text-xs gap-2 p-4 text-center">
                        <ImageIcon size={24} className="opacity-40 text-admin-gold" />
                        <span>Chưa có Khung Ảnh 05</span>
                        <span className="text-[10px] text-admin-text-faint">
                          Dán link URL hoặc tải ảnh từ máy tính
                        </span>
                      </div>
                    )}
                    {config.storyPhotosWatermark?.[4] !== false && Boolean(config.storyPhotos?.[4]) && (
                      <div
                        className="media-watermark pointer-events-none"
                        aria-hidden="true"
                        style={{ opacity: (config.storyPhotosWatermarkOpacity?.[4] ?? 15) / 100 }}
                      />
                    )}
                    {uploadingKey === 'story-4' && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs text-admin-gold font-semibold">
                        Đang tải ảnh lên...
                      </div>
                    )}
                  </div>
                </div>

                {/* Photo inputs */}
                <div className="md:col-span-7 space-y-3">
                  <label className="flex items-center justify-center gap-2 w-full py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                    <Upload size={14} />
                    <span>Tải ảnh mới từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingKey === 'story-4'}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'story-4')}
                    />
                  </label>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={config.storyPhotos?.[4] || ''}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateConfig((prev) => {
                            const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                            while (nextP.length < 5) nextP.push('');
                            nextP[4] = val;
                            return { ...prev, storyPhotos: nextP };
                          });
                        }}
                        onPaste={(e) => {
                          const pasted = e.clipboardData.getData('text');
                          if (pasted) {
                            e.preventDefault();
                            updateConfig((prev) => {
                              const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                              while (nextP.length < 5) nextP.push('');
                              nextP[4] = pasted.trim();
                              return { ...prev, storyPhotos: nextP };
                            });
                          }
                        }}
                        placeholder="Dán link URL ảnh mới vào đây..."
                        className="w-full bg-admin-bg text-xs text-admin-text p-2.5 pr-8 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-mono"
                      />
                      {config.storyPhotos?.[4] ? (
                        <button
                          type="button"
                          onClick={() => {
                            updateConfig((prev) => {
                              const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                              while (nextP.length < 5) nextP.push('');
                              nextP[4] = '';
                              return { ...prev, storyPhotos: nextP };
                            });
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-text-faint hover:text-red-400 p-1"
                          title="Xóa link"
                        >
                          <X size={14} />
                        </button>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const text = await navigator.clipboard.readText();
                          if (text && text.trim()) {
                            updateConfig((prev) => {
                              const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                              while (nextP.length < 5) nextP.push('');
                              nextP[4] = text.trim();
                              return { ...prev, storyPhotos: nextP };
                            });
                          } else {
                            const url = prompt('Dán link URL Khung Ảnh 05 vào đây:');
                            if (url) {
                              updateConfig((prev) => {
                                const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                while (nextP.length < 5) nextP.push('');
                                nextP[4] = url.trim();
                                return { ...prev, storyPhotos: nextP };
                              });
                            }
                          }
                        } catch {
                          const url = prompt('Dán link URL Khung Ảnh 05 vào đây:');
                          if (url) {
                            updateConfig((prev) => {
                              const nextP = [...(prev.storyPhotos || ['', '', '', '', ''])];
                              while (nextP.length < 5) nextP.push('');
                              nextP[4] = url.trim();
                              return { ...prev, storyPhotos: nextP };
                            });
                          }
                        }
                      }}
                      className="px-3.5 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl transition-all shrink-0 flex items-center gap-1.5"
                      title="Dán link từ clipboard"
                    >
                      <ClipboardPaste size={14} className="text-admin-gold" />
                      <span>Dán link</span>
                    </button>
                  </div>

                  <WatermarkControl
                    checked={config.storyPhotosWatermark?.[4] !== false}
                    opacity={config.storyPhotosWatermarkOpacity?.[4] ?? 15}
                    onChangeChecked={(checked) => {
                      updateConfig((prev) => {
                        const nextW = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
                        while (nextW.length < 5) nextW.push(true);
                        nextW[4] = checked;
                        return { ...prev, storyPhotosWatermark: nextW };
                      });
                    }}
                    onChangeOpacity={(opacity) => {
                      updateConfig((prev) => {
                        const nextO = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];
                        while (nextO.length < 5) nextO.push(15);
                        nextO[4] = opacity;
                        return { ...prev, storyPhotosWatermarkOpacity: nextO };
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 4. CLOSING TEXT & CTA SECTION */}
        <section className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4">
          <div className="flex items-center justify-between border-b border-admin-line pb-3">
            <h2 className="text-base font-bold text-admin-gold flex items-center gap-2">
              <Sparkles size={18} /> Phần Kết Bài &amp; Nút Liên Hệ (CTA)
            </h2>
            <span className="text-xs text-admin-text-faint">Cuối trang</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                Đoạn văn kết bài ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={config.closingText?.[activeLang] ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig((prev) => ({
                    ...prev,
                    closingText: { ...prev.closingText, [activeLang]: val },
                  }));
                }}
                className="w-full bg-admin-bg text-xs text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Chữ trên nút bấm CTA ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={config.ctaText?.[activeLang] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      ctaText: { ...prev.ctaText, [activeLang]: val },
                    }));
                  }}
                  placeholder="VD: Liên Hệ Đặt Chỗ Farm Retreat"
                  className="w-full bg-admin-bg text-xs text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Đường dẫn (URL / Link) khi bấm nút CTA
                </label>
                <input
                  type="text"
                  value={config.ctaLink ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({ ...prev, ctaLink: val }));
                  }}
                  placeholder="Để trống sẽ tự động mở cuộc gọi tới hotline"
                  className="w-full bg-admin-bg text-xs text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* COMPACT STICKY FLOATING SAVE BAR (Not too large) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-xl">
        <div className="flex items-center justify-between gap-3 px-5 py-3 rounded-2xl bg-admin-card/95 border border-admin-gold/30 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            {isDirty ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
                <span className="text-xs font-medium text-admin-text truncate">
                  Có thay đổi chưa lưu
                </span>
              </>
            ) : message.text ? (
              message.type === 'success' ? (
                <>
                  <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                  <span className="text-xs font-medium text-emerald-300 truncate">
                    {message.text}
                  </span>
                </>
              ) : (
                <>
                  <AlertCircle size={15} className="text-red-400 shrink-0" />
                  <span className="text-xs font-medium text-red-300 truncate">
                    {message.text}
                  </span>
                </>
              )
            ) : (
              <>
                <CheckCircle size={15} className="text-admin-gold/60 shrink-0" />
                <span className="text-xs text-admin-text-faint truncate">
                  Cấu hình đã đồng bộ
                </span>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-admin-gold hover:bg-admin-gold-hover text-admin-bg font-bold text-xs shadow-md transition-all shrink-0 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-admin-bg border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Lưu thay đổi</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
