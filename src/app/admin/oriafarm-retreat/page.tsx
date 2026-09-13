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
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Layers,
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

  // Media Upload handler for Supabase (Single & Multiple Image/Video)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: 'hero' | 'batch' | string
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingKey(target);
    try {
      const supabase = createClient();

      if (target === 'batch') {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
          const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
          const fileName = `oriafarm-retreat/story-batch-${Date.now()}-${i}.${ext}`;

          const { error } = await supabase.storage
            .from('media-uploads')
            .upload(fileName, file, { upsert: true });

          if (error) throw error;

          const { data: publicUrlData } = supabase.storage
            .from('media-uploads')
            .getPublicUrl(fileName);
          uploadedUrls.push(publicUrlData.publicUrl);
        }

        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', ''])];
          const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
          const nextWmOpacity = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];

          // Fill into any existing empty slots first, then append remaining
          let uploadIdx = 0;
          for (let i = 0; i < nextPhotos.length && uploadIdx < uploadedUrls.length; i++) {
            if (!nextPhotos[i] || !nextPhotos[i].trim()) {
              nextPhotos[i] = uploadedUrls[uploadIdx];
              nextWm[i] = true;
              nextWmOpacity[i] = 15;
              uploadIdx++;
            }
          }
          while (uploadIdx < uploadedUrls.length) {
            nextPhotos.push(uploadedUrls[uploadIdx]);
            nextWm.push(true);
            nextWmOpacity.push(15);
            uploadIdx++;
          }

          return {
            ...prev,
            storyPhotos: nextPhotos,
            storyPhotosWatermark: nextWm,
            storyPhotosWatermarkOpacity: nextWmOpacity,
          };
        });

        setMessage({
          type: 'success',
          text: `Đã tải lên thành công ${uploadedUrls.length} ảnh/video!`,
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else if (target === 'hero') {
        const file = files[0];
        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
        const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
        const fileName = `oriafarm-retreat/${target}-${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from('media-uploads')
          .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('media-uploads')
          .getPublicUrl(fileName);

        updateConfig((prev) => ({
          ...prev,
          heroImage: publicUrlData.publicUrl,
          heroMediaType: isVid ? 'video' : 'image',
        }));

        setMessage({
          type: 'success',
          text: isVid ? 'Tải video Hero thành công!' : 'Tải ảnh Hero thành công!',
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      } else {
        const file = files[0];
        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
        const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
        const fileName = `oriafarm-retreat/${target}-${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from('media-uploads')
          .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('media-uploads')
          .getPublicUrl(fileName);

        const idx = parseInt(target.replace('story-', ''), 10);
        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', ''])];
          const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
          const nextWmOpacity = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];
          while (nextPhotos.length <= idx) nextPhotos.push('');
          while (nextWm.length <= idx) nextWm.push(true);
          while (nextWmOpacity.length <= idx) nextWmOpacity.push(15);
          nextPhotos[idx] = publicUrlData.publicUrl;
          return {
            ...prev,
            storyPhotos: nextPhotos,
            storyPhotosWatermark: nextWm,
            storyPhotosWatermarkOpacity: nextWmOpacity,
          };
        });

        setMessage({
          type: 'success',
          text: isVid ? 'Tải video lên thành công!' : 'Tải ảnh lên thành công!',
        });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
      setMessage({
        type: 'error',
        text: 'Tải tệp lên thất bại: ' + (err.message || 'Lỗi không xác định'),
      });
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  // Add new empty media frame
  const handleAddMediaFrame = () => {
    updateConfig((prev) => {
      const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', ''])];
      const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
      const nextWmOpacity = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];
      nextPhotos.push('');
      nextWm.push(true);
      nextWmOpacity.push(15);
      return {
        ...prev,
        storyPhotos: nextPhotos,
        storyPhotosWatermark: nextWm,
        storyPhotosWatermarkOpacity: nextWmOpacity,
      };
    });
  };

  // Reorder frames
  const handleMoveFrame = (idx: number, direction: 'up' | 'down') => {
    updateConfig((prev) => {
      const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', ''])];
      const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
      const nextWmOpacity = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= nextPhotos.length) return prev;

      const tempPhoto = nextPhotos[idx];
      nextPhotos[idx] = nextPhotos[targetIdx];
      nextPhotos[targetIdx] = tempPhoto;

      const tempWm = nextWm[idx];
      nextWm[idx] = nextWm[targetIdx];
      nextWm[targetIdx] = tempWm;

      const tempWmOpacity = nextWmOpacity[idx] ?? 15;
      nextWmOpacity[idx] = nextWmOpacity[targetIdx] ?? 15;
      nextWmOpacity[targetIdx] = tempWmOpacity;

      return {
        ...prev,
        storyPhotos: nextPhotos,
        storyPhotosWatermark: nextWm,
        storyPhotosWatermarkOpacity: nextWmOpacity,
      };
    });
  };

  // Remove or clear frame
  const handleDeleteFrame = (idx: number) => {
    updateConfig((prev) => {
      const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', ''])];
      const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
      const nextWmOpacity = [...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15])];

      if (idx >= 5) {
        // Can completely remove additional frames
        nextPhotos.splice(idx, 1);
        nextWm.splice(idx, 1);
        nextWmOpacity.splice(idx, 1);
      } else {
        // Clear slot for main editorial frame
        nextPhotos[idx] = '';
      }

      return {
        ...prev,
        storyPhotos: nextPhotos,
        storyPhotosWatermark: nextWm,
        storyPhotosWatermarkOpacity: nextWmOpacity,
      };
    });
  };

  // Get frame label
  const getFrameLabel = (idx: number) => {
    const STANDARD_LABELS: Record<number, string> = {
      0: 'Khung 01: Bungalow giữa thiên nhiên (Toàn cảnh kiến trúc)',
      1: 'Khung 02: Góc thư giãn trà & sách (Bungalow riêng)',
      2: 'Khung 03: Trị liệu & Tắm bồn ấm (Chăm sóc cơ thể)',
      3: 'Khung 04: Bàn ăn & Trà giữa thiên nhiên (Ăn uống chậm rãi)',
      4: 'Khung 05: Hoàng hôn & Khung cảnh tĩnh lặng (Chiều buông)',
    };
    return STANDARD_LABELS[idx] || `Khung #${idx + 1}: Khoảnh khắc Retreat mở rộng (Moments)`;
  };

  // Detect video url
  const isVideo = (url?: string) => {
    if (!url) return false;
    return /\.(mp4|mov|webm)(\?.*)?$/i.test(url) || url.includes('/video/');
  };

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

        {/* ========================================================================= */}
        {/* 3. MEDIA FRAMES CONTROLLER (EDITORIAL + DYNAMIC EXPANSION)                */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-admin-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-gold/10 text-admin-gold">
                <ImageIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-admin-text">Hệ Thống Media &amp; Hình Ảnh Oria Farm Retreat</h2>
                  <span className="rounded-full bg-admin-gold/10 px-2 py-0.5 text-[11px] font-semibold text-admin-gold">
                    {config.storyPhotos?.length || 0} khung
                  </span>
                </div>
                <p className="text-xs text-admin-text-faint">
                  5 khung chính định hình bài viết + hỗ trợ thêm không giới hạn ảnh/video cho bộ sưu tập Khoảnh khắc (Moments) mở rộng.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Batch Upload */}
              <label className="relative flex cursor-pointer items-center gap-1.5 rounded-lg border border-admin-gold/40 bg-admin-gold/10 px-3 py-2 text-xs font-semibold text-admin-gold hover:bg-admin-gold/20 transition-colors">
                <Upload size={14} />
                <span>{uploadingKey === 'batch' ? 'Đang tải lên...' : 'Tải lên nhiều ảnh cùng lúc'}</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4,video/webm"
                  className="hidden"
                  disabled={uploadingKey === 'batch'}
                  onChange={(e) => handleFileUpload(e, 'batch')}
                />
              </label>

              {/* Add Single Frame */}
              <button
                type="button"
                onClick={handleAddMediaFrame}
                className="flex items-center gap-1.5 rounded-lg bg-admin-gold px-3 py-2 text-xs font-semibold text-black hover:brightness-110 transition-all shadow-sm active:scale-95"
              >
                <Plus size={14} />
                <span>Thêm khung Media</span>
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(config.storyPhotos || ['', '', '', '', '']).map((url, idx) => {
              const wmChecked = config.storyPhotosWatermark?.[idx] !== false;
              const wmOpacity = config.storyPhotosWatermarkOpacity?.[idx] ?? 15;
              const uploadKey = `story-${idx}`;
              const isFirst = idx === 0;
              const isLast = idx === (config.storyPhotos?.length || 1) - 1;
              const isExtra = idx >= 5;

              return (
                <div key={idx} className={`flex flex-col justify-between rounded-xl border ${isExtra ? 'border-admin-gold/40 bg-admin-gold/[0.03]' : 'border-admin-line bg-admin-bg/60'} p-4 transition-all`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-admin-gold">Khung #{idx + 1}</span>
                        {isExtra && (
                          <span className="rounded bg-admin-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-admin-gold">
                            Mở rộng (Moments)
                          </span>
                        )}
                      </div>

                      {/* Control buttons: Move Up, Move Down, Delete */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveFrame(idx, 'up')}
                          title="Di chuyển lên trước"
                          className="rounded p-1 text-admin-text-faint hover:bg-admin-line hover:text-admin-text disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveFrame(idx, 'down')}
                          title="Di chuyển xuống sau"
                          className="rounded p-1 text-admin-text-faint hover:bg-admin-line hover:text-admin-text disabled:opacity-20 disabled:pointer-events-none transition-colors"
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteFrame(idx)}
                          title={isExtra ? 'Xóa khung này' : 'Xóa ảnh trong khung'}
                          className="rounded p-1 text-admin-text-faint hover:bg-rose-500/15 hover:text-rose-400 transition-colors ml-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-admin-text-faint line-clamp-1 mb-3">{getFrameLabel(idx)}</p>

                    {/* Preview box */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-admin-line bg-black/40 flex items-center justify-center mb-3">
                      {Boolean(url) ? (
                        isVideo(url) ? (
                          <video src={url} autoPlay muted loop playsInline className="h-full w-full object-cover" />
                        ) : (
                          <img src={url} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                        )
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="mx-auto h-7 w-7 text-admin-text-faint/30 mb-1" />
                          <span className="text-[10px] text-admin-text-faint/60">Khung ảnh trống</span>
                        </div>
                      )}
                      {wmChecked && Boolean(url) && (
                        <div
                          className="media-watermark pointer-events-none"
                          aria-hidden="true"
                          style={{ opacity: wmOpacity / 100 }}
                        />
                      )}
                      {uploadingKey === uploadKey && (
                        <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-xs text-admin-gold font-semibold">
                          Đang tải lên...
                        </div>
                      )}
                    </div>

                    {/* URL Input */}
                    <div className="flex gap-2 mb-3">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          value={url}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) =>
                            updateConfig((prev) => {
                              const next = [...(prev.storyPhotos || ['', '', '', '', ''])];
                              while (next.length <= idx) next.push('');
                              next[idx] = e.target.value;
                              return { ...prev, storyPhotos: next };
                            })
                          }
                          placeholder="Dán link ảnh / video URL..."
                          className="w-full rounded-lg border border-admin-line bg-admin-card px-3 py-2 pr-7 text-xs text-admin-text placeholder:text-admin-text-faint/40 focus:border-admin-gold focus:outline-none font-mono"
                        />
                        {Boolean(url) && (
                          <button
                            type="button"
                            onClick={() =>
                              updateConfig((prev) => {
                                const next = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                while (next.length <= idx) next.push('');
                                next[idx] = '';
                                return { ...prev, storyPhotos: next };
                              })
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-text-faint hover:text-red-400 p-0.5"
                            title="Xóa link"
                          >
                            <X size={13} />
                          </button>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const text = await navigator.clipboard.readText();
                            if (text && text.trim()) {
                              updateConfig((prev) => {
                                const next = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                while (next.length <= idx) next.push('');
                                next[idx] = text.trim();
                                return { ...prev, storyPhotos: next };
                              });
                            } else {
                              const promptUrl = prompt(`Dán link URL Khung #${idx + 1} vào đây:`);
                              if (promptUrl) {
                                updateConfig((prev) => {
                                  const next = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                  while (next.length <= idx) next.push('');
                                  next[idx] = promptUrl.trim();
                                  return { ...prev, storyPhotos: next };
                                });
                              }
                            }
                          } catch {
                            const promptUrl = prompt(`Dán link URL Khung #${idx + 1} vào đây:`);
                            if (promptUrl) {
                              updateConfig((prev) => {
                                const next = [...(prev.storyPhotos || ['', '', '', '', ''])];
                                while (next.length <= idx) next.push('');
                                next[idx] = promptUrl.trim();
                                return { ...prev, storyPhotos: next };
                              });
                            }
                          }
                        }}
                        className="px-2.5 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text text-xs font-semibold rounded-lg transition-all shrink-0 flex items-center gap-1"
                        title="Dán link từ clipboard"
                      >
                        <ClipboardPaste size={13} className="text-admin-gold" />
                        <span className="hidden sm:inline">Dán</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-admin-line">
                    <label className="relative flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-admin-gold/40 bg-admin-gold/5 py-2 text-xs font-semibold text-admin-gold hover:bg-admin-gold/10 transition-colors">
                      <Upload size={13} />
                      <span>{uploadingKey === uploadKey ? 'Đang tải...' : 'Tải ảnh lên'}</span>
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        className="hidden"
                        disabled={uploadingKey === uploadKey}
                        onChange={(e) => handleFileUpload(e, uploadKey)}
                      />
                    </label>

                    <WatermarkControl
                      checked={wmChecked}
                      opacity={wmOpacity}
                      onChangeChecked={(val) =>
                        updateConfig((prev) => {
                          const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true])];
                          while (nextWm.length <= idx) nextWm.push(true);
                          nextWm[idx] = val;
                          return { ...prev, storyPhotosWatermark: nextWm };
                        })
                      }
                      onChangeOpacity={(val) =>
                        updateConfig((prev) => {
                          const nextWmOpacity = [
                            ...(prev.storyPhotosWatermarkOpacity || [15, 15, 15, 15, 15]),
                          ];
                          while (nextWmOpacity.length <= idx) nextWmOpacity.push(15);
                          nextWmOpacity[idx] = val;
                          return { ...prev, storyPhotosWatermarkOpacity: nextWmOpacity };
                        })
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. BÀI VIẾT BIÊN TẬP & NỘI DUNG CHÍNH (EDITORIAL SECTIONS)                 */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-admin-line pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-gold/10 text-admin-gold">
                <FileText size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-admin-text">Bài Viết Biên Tập &amp; Nội Dung Chính (Editorial Sections)</h2>
                <p className="text-xs text-admin-text-faint">
                  4 phần nội dung văn bản dẫn dắt trải nghiệm nghỉ ngơi tại Oria Farm Retreat.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {config.sections.map((section, sIdx) => (
              <div key={section.id || 'sec-' + sIdx} className="rounded-xl border border-admin-line bg-admin-bg/60 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-admin-line pb-2.5">
                  <h3 className="text-sm font-bold text-admin-gold flex items-center gap-2">
                    <FileText size={15} /> Phần {sIdx + 1}: {sIdx === 0 ? 'Bungalow riêng' : sIdx === 1 ? 'Xông hơi · Tắm bồn · Massage' : sIdx === 2 ? 'Ăn uống chậm lại' : 'Rời khỏi thành phố'} ({activeLang.toUpperCase()})
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
                    className="w-full bg-admin-card text-sm text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none"
                  />
                </div>

                {/* Section paragraphs */}
                <div className="space-y-3 pt-2">
                  <label className="text-xs uppercase tracking-wider text-admin-text-dim block font-semibold">
                    Các đoạn văn bản ({activeLang.toUpperCase()})
                  </label>
                  {section.paragraphs.map((p, pIdx) => (
                    <div key={'p-' + sIdx + '-' + pIdx} className="space-y-1">
                      <span className="text-[11px] text-admin-text-faint font-medium">Đoạn {pIdx + 1}:</span>
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
                        className="w-full bg-admin-card text-xs text-admin-text p-3 rounded-xl border border-admin-line focus:border-admin-gold outline-none leading-relaxed"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

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
