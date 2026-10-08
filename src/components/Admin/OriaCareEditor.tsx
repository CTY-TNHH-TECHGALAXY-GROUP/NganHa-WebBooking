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
  ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  DEFAULT_ORIA_CARE_CONFIG,
  hydrateOriaCareConfig,
  type OriaCareConfig,
} from '@/data/oriaCareData';
import { WatermarkControl } from '@/components/Admin/WatermarkControl';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

export default function OriaCareEditor() {
  const [config, setConfig] = useState<OriaCareConfig>(DEFAULT_ORIA_CARE_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeLang, setActiveLang] = useState<string>('vi');
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  const updateConfig = (updater: (prev: OriaCareConfig) => OriaCareConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      setIsDirty(true);
      return next;
    });
  };

  // Load configuration from API
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/content');
        if (res.ok) {
          const json = await res.json();
          const remoteContent = json.data?.oria_care_content || json.oria_care_content;
          if (remoteContent) {
            setConfig(hydrateOriaCareConfig(remoteContent));
          }
        }
      } catch (err) {
        console.error('Failed to load oria-care config:', err);
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
        body: JSON.stringify({ oria_care_content: config }),
      });

      // 2. Dual save to system-settings API
      await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oria_care_content: config }),
      }).catch((e) => console.warn('Sync to system-settings skipped:', e));

      if (res.ok) {
        setIsDirty(false);
        setMessage({
          type: 'success',
          text: 'Đã lưu cấu hình Oria Care và đồng bộ Weblive thành công!',
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
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'hero' | 'story-0' | 'story-1' | 'story-2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);

    setUploadingKey(target);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const fileName = `oriacare/${target}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
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
      } else if (target === 'story-0') {
        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', ''])];
          nextPhotos[0] = url;
          return { ...prev, storyPhotos: nextPhotos };
        });
      } else if (target === 'story-1') {
        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', ''])];
          nextPhotos[1] = url;
          return { ...prev, storyPhotos: nextPhotos };
        });
      } else if (target === 'story-2') {
        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', ''])];
          nextPhotos[2] = url;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-admin-bg p-8 flex items-center justify-center">
        <div className="flex items-center gap-3 text-admin-text">
          <div className="w-5 h-5 border-2 border-admin-gold border-t-transparent rounded-full animate-spin" />
          <span>Đang tải dữ liệu Oria Care...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text pb-36">
      {/* 1. TOP HEADER */}
      <header className="bg-admin-card/90 backdrop-blur-md border-b border-admin-line px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="p-2 text-admin-text-faint hover:text-admin-text hover:bg-admin-line rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-admin-text tracking-wide">
                  Quản Trị Oria Care
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-admin-gold/15 text-admin-gold border border-admin-gold/30 font-medium">
                  5 Ngôn Ngữ
                </span>
              </div>
              <p className="text-xs text-admin-text-faint mt-0.5">
                Điều chỉnh bài viết giới thiệu editorial, hình ảnh hero, và 3 khung ảnh minh họa xen kẽ cho Oria Care.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/oriahome#oria-care"
              target="_blank"
              className="px-3.5 py-2 text-xs text-admin-text-dim hover:text-admin-gold border border-admin-line hover:border-admin-gold rounded-xl transition-all flex items-center gap-1.5"
            >
              <ExternalLink size={14} />
              <span>Xem Weblive</span>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. NOTIFICATION TOAST */}
      {message.text && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-semibold ${
              message.type === 'success'
                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}
          >
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT CONTAINER */}
      <main className="max-w-6xl mx-auto px-6 py-6 space-y-8">
        {/* LANGUAGE SWITCHER */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-admin-line pb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-xs uppercase tracking-wider text-admin-text-dim font-bold mr-1">
              Ngôn ngữ sửa:
            </span>
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setActiveLang(lang.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeLang === lang.code
                    ? 'bg-admin-gold text-admin-bg shadow-sm scale-105'
                    : 'bg-admin-card text-admin-text-dim hover:text-admin-text border border-admin-line'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>

          <span className="text-xs text-admin-text-faint">
            Đang chỉnh sửa: <strong className="text-admin-gold uppercase">{activeLang}</strong>
          </span>
        </div>

        {/* HERO BANNER SECTION */}
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
                    <span className="text-[10px] text-admin-text-faint">Dán link URL hoặc tải ảnh / video từ máy tính (MP4, MOV, WebM, JPG, PNG)</span>
                  </div>
                )}
                {config.heroImage && config.heroWatermarkEnabled !== false && (
                  <div
                    className="media-watermark pointer-events-none"
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
                    onChange={(e) => handleImageUpload(e, 'hero')}
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
                  Tiêu Đề Trang ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={config.pageTitle[activeLang] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      pageTitle: { ...prev.pageTitle, [activeLang]: val },
                    }));
                  }}
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Khẩu Hiệu / Phụ Đề Ngắn ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={config.pageSubtitle[activeLang] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      pageSubtitle: { ...prev.pageSubtitle, [activeLang]: val },
                    }));
                  }}
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>
            </div>
          </div>
        </section>

        {/* EDITORIAL SECTIONS */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-admin-line pb-3">
            <h2 className="text-base font-bold text-admin-text flex items-center gap-2">
              <FileText size={18} className="text-admin-gold" />
              Nội Dung Bài Viết (Các Phần Kể Chuyện)
            </h2>
            <span className="text-xs text-admin-text-faint">Đang sửa: {activeLang.toUpperCase()}</span>
          </div>

          {config.sections.map((section, sIdx) => (
            <div
              key={section.id || 'sec-' + sIdx}
              className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-4"
            >
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-admin-gold/20 text-admin-gold text-xs font-bold flex items-center justify-center">
                  #{sIdx + 1}
                </span>
                <span className="text-xs uppercase tracking-wider text-admin-gold font-bold">
                  Phần {sIdx + 1}
                </span>
              </div>

              <div>
                <label className="text-xs text-admin-text-dim block mb-1 font-semibold">
                  Tiêu Đề Phần ({activeLang.toUpperCase()}):
                </label>
                <input
                  type="text"
                  value={section.heading[activeLang] || ''}
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
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-semibold"
                />
              </div>

              <div className="space-y-3 pt-1">
                {section.paragraphs.map((para, pIdx) => (
                  <div key={'p-edit-' + sIdx + '-' + pIdx} className="space-y-1">
                    <label className="text-xs text-admin-text-dim block">
                      Đoạn {pIdx + 1} ({activeLang.toUpperCase()}):
                    </label>
                    <textarea
                      rows={3}
                      value={para[activeLang] || ''}
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
                      className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none resize-y"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* 3 KHUNG ẢNH MINH HỌA (STORY PHOTOS) */}
        <section className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-5">
          <div className="flex items-center justify-between border-b border-admin-line pb-3">
            <div>
              <h2 className="text-base font-bold text-admin-gold flex items-center gap-2">
                <ImageIcon size={18} />
                3 Khung Ảnh Minh Họa Bài Viết (Xen Kẽ Giữa Các Phần)
              </h2>
              <p className="text-xs text-admin-text-dim mt-0.5">
                Khung 01 sau Phần 1, Khung 02 sau Phần 2, Khung 03 sau Phần 3.
              </p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold">
              ⚡ 3 Khung ảnh
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {[0, 1, 2].map((idx) => {
              const targetKey = `story-${idx}` as 'story-0' | 'story-1' | 'story-2';
              return (
                <div key={idx} className="p-5 rounded-2xl bg-admin-bg/60 border border-admin-line space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-wider text-admin-gold font-bold">
                      Khung Ảnh {idx + 1 < 10 ? `0${idx + 1}` : idx + 1} (Sau Phần {idx + 1})
                    </span>
                    <span className="text-[10px] text-admin-text-faint bg-black/40 px-2 py-0.5 rounded">
                      Chung 5 ngôn ngữ
                    </span>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-admin-line w-full aspect-[16/9] bg-black/50">
                    {config.storyPhotos?.[idx] ? (
                      <img
                        src={config.storyPhotos[idx]}
                        alt={`Story photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-admin-text-dim text-xs gap-2 p-4 text-center">
                        <ImageIcon size={24} className="opacity-40 text-admin-gold" />
                        <span>Chưa có Khung Ảnh {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}</span>
                        <span className="text-[10px] text-admin-text-faint">Dán link URL hoặc tải ảnh từ máy tính</span>
                      </div>
                    )}
                    {config.storyPhotos?.[idx] && config.storyPhotosWatermark?.[idx] !== false && (
                      <div
                        className="media-watermark pointer-events-none"
                        style={{ opacity: (config.storyPhotosWatermarkOpacity?.[idx] ?? 15) / 100 }}
                      />
                    )}
                    {uploadingKey === targetKey && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs text-admin-gold font-semibold">
                        Đang tải ảnh lên...
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 pt-1">
                    <label className="flex items-center justify-center gap-2 w-full py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>Tải ảnh mới từ máy tính</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={uploadingKey === targetKey}
                        className="hidden"
                        onChange={(e) => handleImageUpload(e, targetKey)}
                      />
                    </label>

                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={config.storyPhotos?.[idx] ?? ''}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateConfig((prev) => {
                              const nextP = [...(prev.storyPhotos || ['', '', ''])];
                              nextP[idx] = val;
                              return { ...prev, storyPhotos: nextP };
                            });
                          }}
                          onPaste={(e) => {
                            const pasted = e.clipboardData.getData('text');
                            if (pasted) {
                              e.preventDefault();
                              updateConfig((prev) => {
                                const nextP = [...(prev.storyPhotos || ['', '', ''])];
                                nextP[idx] = pasted.trim();
                                return { ...prev, storyPhotos: nextP };
                              });
                            }
                          }}
                          placeholder="Dán link URL ảnh mới vào đây..."
                          className="w-full bg-admin-bg text-xs text-admin-text p-2.5 pr-8 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-mono"
                        />
                        {config.storyPhotos?.[idx] ? (
                          <button
                            type="button"
                            onClick={() => {
                              updateConfig((prev) => {
                                const nextP = [...(prev.storyPhotos || ['', '', ''])];
                                nextP[idx] = '';
                                return { ...prev, storyPhotos: nextP };
                              });
                            }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-text-faint hover:text-red-400 text-xs p-1"
                            title="Xóa link ảnh"
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
                                const nextP = [...(prev.storyPhotos || ['', '', ''])];
                                nextP[idx] = text.trim();
                                return { ...prev, storyPhotos: nextP };
                              });
                            } else {
                              const url = prompt('Dán link URL ảnh vào đây:');
                              if (url) {
                                updateConfig((prev) => {
                                  const nextP = [...(prev.storyPhotos || ['', '', ''])];
                                  nextP[idx] = url.trim();
                                  return { ...prev, storyPhotos: nextP };
                                });
                              }
                            }
                          } catch {
                            const url = prompt('Dán link URL ảnh vào đây:');
                            if (url) {
                              updateConfig((prev) => {
                                const nextP = [...(prev.storyPhotos || ['', '', ''])];
                                nextP[idx] = url.trim();
                                return { ...prev, storyPhotos: nextP };
                              });
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
                        checked={config.storyPhotosWatermark?.[idx] !== false}
                        opacity={config.storyPhotosWatermarkOpacity?.[idx] ?? 15}
                        onChangeChecked={(checked) => {
                          updateConfig((prev) => {
                            const nextWm = [...(prev.storyPhotosWatermark || [true, true, true])];
                            while (nextWm.length < 3) nextWm.push(true);
                            nextWm[idx] = checked;
                            return { ...prev, storyPhotosWatermark: nextWm };
                          });
                        }}
                        onChangeOpacity={(opacity) => {
                          updateConfig((prev) => {
                            const nextO = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15])];
                            while (nextO.length < 3) nextO.push(15);
                            nextO[idx] = opacity;
                            return { ...prev, storyPhotosWatermarkOpacity: nextO };
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* CLOSING & CTA */}
        <section className="p-6 rounded-2xl bg-admin-card border border-admin-line space-y-5">
          <div className="flex items-center justify-between border-b border-admin-line pb-3">
            <h2 className="text-base font-bold text-admin-gold flex items-center gap-2">
              <Sparkles size={18} /> Đoạn Kết &amp; Đường Dẫn CTA Cuối Trang
            </h2>
            <span className="text-xs text-admin-text-faint">Đang sửa: {activeLang.toUpperCase()}</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                Đoạn Đúc Kết ({activeLang.toUpperCase()})
              </label>
              <textarea
                rows={3}
                value={config.closingText[activeLang] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  updateConfig((prev) => ({
                    ...prev,
                    closingText: { ...prev.closingText, [activeLang]: val },
                  }));
                }}
                className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none resize-y"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Chữ Nút CTA ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={config.ctaText[activeLang] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({
                      ...prev,
                      ctaText: { ...prev.ctaText, [activeLang]: val },
                    }));
                  }}
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-admin-text-dim block mb-1.5 font-semibold">
                  Đường Dẫn CTA (Link điện thoại hoặc Zalo)
                </label>
                <input
                  type="text"
                  value={config.ctaLink || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateConfig((prev) => ({ ...prev, ctaLink: val }));
                  }}
                  placeholder="tel:+84964090277 hoặc https://..."
                  className="w-full bg-admin-bg text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Save the Care content independently */}
      <div className="px-6 pb-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between p-4 bg-admin-card/95 border border-admin-gold/30 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto">
          <div className="flex items-center gap-3">
            <span
              className={`w-3 h-3 rounded-full ${
                isDirty ? 'bg-amber-400 animate-pulse' : 'bg-green-400'
              }`}
            />
            <div>
              <p className="text-xs font-semibold text-admin-text">
                {isDirty ? 'Có thay đổi chưa lưu' : 'Dữ liệu đang đồng bộ Weblive'}
              </p>
              <p className="text-[11px] text-admin-text-dim">
                {isDirty
                  ? 'Bấm "Lưu Nội Dung Oria Care" để cập nhật phần Care trên trang Oria Home Care'
                  : 'Hệ thống tự động đồng bộ cả 5 ngôn ngữ'}
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-admin-gold hover:bg-admin-gold-hover text-admin-bg text-xs font-bold rounded-xl transition-all shadow-lg hover:shadow-admin-gold/20 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-admin-bg border-t-transparent rounded-full animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Lưu Nội Dung Oria Care</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
