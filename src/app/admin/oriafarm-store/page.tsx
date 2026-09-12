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
  Store,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  Layers,
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import {
  DEFAULT_FARM_STORE_CONFIG,
  hydrateFarmStoreConfig,
  type FarmStoreConfig,
} from '@/data/farmStoreData';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

const WatermarkToggle = ({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) => (
  <div className="flex items-center justify-between gap-3 rounded-lg border border-admin-line bg-admin-card/70 px-3 py-2.5">
    <div>
      <p className="text-xs font-bold text-admin-text">Logo mờ trên khung này</p>
      <p className="mt-0.5 text-[10px] text-admin-text-faint">{checked ? 'Đang hiển thị' : 'Đang ẩn'}</p>
    </div>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
        checked ? 'bg-admin-gold' : 'bg-admin-line'
      }`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  </div>
);

export default function FarmStoreAdminPage() {
  const [config, setConfig] = useState<FarmStoreConfig>(DEFAULT_FARM_STORE_CONFIG);
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
  const updateConfig = (updater: (prev: FarmStoreConfig) => FarmStoreConfig) => {
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
          const remoteContent = data?.farm_store_content || data?.content?.farm_store_content;
          if (remoteContent) {
            setConfig(hydrateFarmStoreConfig(remoteContent));
          }
        }
      } catch (err) {
        console.error('Failed to load farm-store content:', err);
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
        body: JSON.stringify({ farm_store_content: config }),
      });

      // 2. Dual save to system-settings API
      await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ farm_store_content: config }),
      }).catch((e) => console.warn('Sync to system-settings skipped:', e));

      if (res.ok) {
        setIsDirty(false);
        setMessage({
          type: 'success',
          text: 'Đã lưu cấu hình Oria Farm Store và đồng bộ Weblive thành công!',
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
    target: 'hero' | 'batch' | `story-${number}`
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
          const fileName = `oriafarm-store/story-batch-${Date.now()}-${i}.${ext}`;

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
          const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', '', ''])];
          const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true, true])];

          // Fill into any existing empty slots first, then append remaining
          let uploadIdx = 0;
          for (let i = 0; i < nextPhotos.length && uploadIdx < uploadedUrls.length; i++) {
            if (!nextPhotos[i] || !nextPhotos[i].trim()) {
              nextPhotos[i] = uploadedUrls[uploadIdx];
              nextWm[i] = true;
              uploadIdx++;
            }
          }
          while (uploadIdx < uploadedUrls.length) {
            nextPhotos.push(uploadedUrls[uploadIdx]);
            nextWm.push(true);
            uploadIdx++;
          }

          return { ...prev, storyPhotos: nextPhotos, storyPhotosWatermark: nextWm };
        });
      } else if (target === 'hero') {
        const file = files[0];
        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
        const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
        const fileName = `oriafarm-store/${target}-${Date.now()}.${ext}`;

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
      } else {
        const file = files[0];
        const isVid = file.type.startsWith('video/') || /\.(mp4|mov|webm)$/i.test(file.name);
        const ext = file.name.split('.').pop() || (isVid ? 'mp4' : 'jpg');
        const fileName = `oriafarm-store/${target}-${Date.now()}.${ext}`;

        const { error } = await supabase.storage
          .from('media-uploads')
          .upload(fileName, file, { upsert: true });

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
          .from('media-uploads')
          .getPublicUrl(fileName);

        const idx = parseInt(target.replace('story-', ''), 10);
        updateConfig((prev) => {
          const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', '', ''])];
          const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true, true])];
          while (nextPhotos.length <= idx) nextPhotos.push('');
          while (nextWm.length <= idx) nextWm.push(true);
          nextPhotos[idx] = publicUrlData.publicUrl;
          return { ...prev, storyPhotos: nextPhotos, storyPhotosWatermark: nextWm };
        });
      }
    } catch (err: any) {
      alert(`Lỗi upload media: ${err.message || 'Không thể upload'}`);
    } finally {
      setUploadingKey(null);
      e.target.value = '';
    }
  };

  // Add new empty media frame
  const handleAddMediaFrame = () => {
    updateConfig((prev) => {
      const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', '', ''])];
      const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true, true])];
      nextPhotos.push('');
      nextWm.push(true);
      return { ...prev, storyPhotos: nextPhotos, storyPhotosWatermark: nextWm };
    });
  };

  // Reorder frames
  const handleMoveFrame = (idx: number, direction: 'up' | 'down') => {
    updateConfig((prev) => {
      const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', '', ''])];
      const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true, true])];
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= nextPhotos.length) return prev;

      const tempPhoto = nextPhotos[idx];
      nextPhotos[idx] = nextPhotos[targetIdx];
      nextPhotos[targetIdx] = tempPhoto;

      const tempWm = nextWm[idx];
      nextWm[idx] = nextWm[targetIdx];
      nextWm[targetIdx] = tempWm;

      return { ...prev, storyPhotos: nextPhotos, storyPhotosWatermark: nextWm };
    });
  };

  // Remove or clear frame
  const handleDeleteFrame = (idx: number) => {
    updateConfig((prev) => {
      const nextPhotos = [...(prev.storyPhotos || ['', '', '', '', '', ''])];
      const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true, true])];

      if (idx >= 6) {
        // Can completely remove additional frames
        nextPhotos.splice(idx, 1);
        nextWm.splice(idx, 1);
      } else {
        // Clear slot for main editorial frame
        nextPhotos[idx] = '';
      }

      return { ...prev, storyPhotos: nextPhotos, storyPhotosWatermark: nextWm };
    });
  };

  // Get frame label
  const getFrameLabel = (idx: number) => {
    const STANDARD_LABELS: Record<number, string> = {
      0: 'Khung 01: Toàn cảnh khu vườn Oria Farm (Panorama)',
      1: 'Khung 02: Thu hoạch tươi nguyên (Cặp 1/2)',
      2: 'Khung 03: Chế biến nguyên liệu sạch (Cặp 2/2)',
      3: 'Khung 04: Thức uống năng lượng & ngũ cốc (Cặp 1/2)',
      4: 'Khung 05: Ly nước cầm trên tay giữa ngày (Cặp 2/2)',
      5: 'Khung 06: Nghệ thuật F&B giữa thiên nhiên (Artistic)',
    };
    return STANDARD_LABELS[idx] || `Khung ${idx + 1 < 10 ? '0' + (idx + 1) : idx + 1}: Media mở rộng / Bộ sưu tập (${idx - 5})`;
  };

  const isVideo = (url?: string) => {
    if (!url) return false;
    return /\.(mp4|mov|webm)(\?.*)?$/i.test(url) || url.includes('/videos/') || url.includes('.mp4');
  };

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-admin-gold border-t-transparent" />
          <p className="text-sm font-medium text-admin-text-faint">Đang tải cấu hình Oria Farm Store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-32">
      {/* 1. Header Bar */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-admin-gold">
            <Store size={15} />
            <span>F&B Dinh Dưỡng Xanh · Editorial Manager</span>
          </div>
          <h1 className="mt-1 font-serif text-2xl font-bold text-admin-text sm:text-3xl">
            Quản trị Nội dung Oria Farm Store
          </h1>
          <p className="mt-1 text-sm text-admin-text-faint">
            Tùy chỉnh video/ảnh Hero, 6 khung ảnh dinh dưỡng, triết lý hữu cơ và văn bản 5 ngôn ngữ.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/oriafarm-store"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-admin-line bg-admin-card px-3.5 py-2 text-xs font-semibold text-admin-text hover:border-admin-gold transition-colors"
          >
            <span>Xem Weblive</span>
            <ExternalLink size={14} />
          </Link>
        </div>
      </div>

      {/* Notification Toast */}
      {message.text && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-xl border p-4 text-sm font-medium transition-all ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-300'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. 5-Language Tabs */}
      <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-admin-line pb-4">
        {LANGUAGES.map((item) => (
          <button
            key={item.code}
            type="button"
            onClick={() => setActiveLang(item.code)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeLang === item.code
                ? 'bg-admin-gold text-[#120e0c] font-bold shadow-md shadow-admin-gold/20'
                : 'bg-admin-card text-admin-text-faint hover:bg-admin-card-hover hover:text-admin-text'
            }`}
          >
            <span>{item.flag}</span>
            <span>{item.label}</span>
          </button>
        ))}
        <span className="ml-auto text-xs text-admin-text-faint hidden sm:inline-block">
          Đang chỉnh sửa: <strong>{LANGUAGES.find((l) => l.code === activeLang)?.label}</strong>
        </span>
      </div>

      <div className="space-y-8">
        {/* ========================================================================= */}
        {/* 3. HERO BANNER CONTROLLER (VIDEO & IMAGE)                                */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-admin-line pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-gold/10 text-admin-gold">
                {isVideo(config.heroImage) ? <Video size={18} /> : <ImageIcon size={18} />}
              </div>
              <div>
                <h2 className="text-base font-bold text-admin-text">Hero Banner Media (Video & Ảnh)</h2>
                <p className="text-xs text-admin-text-faint">
                  Hiển thị ở phần đầu trang. Hỗ trợ tải Video (mp4, webm) hoặc Ảnh chất lượng cao.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left preview */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-admin-line bg-black/60 shadow-inner flex items-center justify-center">
                {Boolean(config.heroImage) ? (
                  isVideo(config.heroImage) ? (
                    <video
                      src={config.heroImage}
                      autoPlay
                      muted
                      loop
                      playsInline
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={config.heroImage}
                      alt="Hero preview"
                      className="h-full w-full object-cover"
                    />
                  )
                ) : (
                  <div className="text-center p-6">
                    <ImageIcon className="mx-auto h-10 w-10 text-admin-text-faint/40 mb-2" />
                    <p className="text-xs text-admin-text-faint">Chưa có media nào</p>
                    <p className="text-[11px] text-admin-text-faint/60 mt-1">Khung ảnh hiện đang để trống</p>
                  </div>
                )}

                {config.heroWatermarkEnabled !== false && Boolean(config.heroImage) && (
                  <div className="absolute top-3 left-3 rounded bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white/80 backdrop-blur-sm">
                    Watermark ON
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls */}
            <div className="flex flex-col justify-between space-y-4 lg:col-span-7">
              <div>
                <label className="block text-xs font-bold text-admin-text mb-1.5">
                  Đường dẫn Media Hero (URL hoặc tải file lên)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={config.heroImage || ''}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        heroImage: e.target.value,
                        heroMediaType: isVideo(e.target.value) ? 'video' : 'image',
                      }))
                    }
                    placeholder="https://... hoặc tải file từ máy tính"
                    className="flex-1 rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2.5 text-xs text-admin-text placeholder:text-admin-text-faint/50 focus:border-admin-gold focus:outline-none"
                  />
                  {Boolean(config.heroImage) && (
                    <button
                      type="button"
                      onClick={() => updateConfig((prev) => ({ ...prev, heroImage: '' }))}
                      className="rounded-lg border border-admin-line px-3 text-xs text-admin-text-faint hover:text-rose-400 hover:border-rose-400/40 transition-colors"
                      title="Xóa link media"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Upload button & Watermark Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-admin-gold/40 bg-admin-gold/5 px-4 py-3 text-xs font-bold text-admin-gold hover:bg-admin-gold/10 transition-colors">
                  <Upload size={15} />
                  <span>{uploadingKey === 'hero' ? 'Đang tải lên...' : 'Tải Video / Ảnh lên'}</span>
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    disabled={uploadingKey === 'hero'}
                    onChange={(e) => handleFileUpload(e, 'hero')}
                  />
                </label>

                <WatermarkToggle
                  checked={config.heroWatermarkEnabled !== false}
                  onChange={(checked) =>
                    updateConfig((prev) => ({ ...prev, heroWatermarkEnabled: checked }))
                  }
                />
              </div>

              {/* Text titles for Hero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-admin-line">
                <div>
                  <label className="block text-xs font-semibold text-admin-text-faint mb-1">
                    Huy hiệu nhỏ trên đầu (Pre-title - {activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={(config.preTitle as any)?.[activeLang] || ''}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        preTitle: { ...prev.preTitle, [activeLang]: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-admin-line bg-admin-bg px-3 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-admin-text-faint mb-1">
                    Tiêu đề chính (Page Title - {activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={(config.pageTitle as any)?.[activeLang] || ''}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        pageTitle: { ...prev.pageTitle, [activeLang]: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-admin-line bg-admin-bg px-3 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-admin-text-faint mb-1">
                    Phụ đề Hero (Subtitle - {activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={(config.pageSubtitle as any)?.[activeLang] || ''}
                    onChange={(e) =>
                      updateConfig((prev) => ({
                        ...prev,
                        pageSubtitle: { ...prev.pageSubtitle, [activeLang]: e.target.value },
                      }))
                    }
                    className="w-full rounded-lg border border-admin-line bg-admin-bg px-3 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. MEDIA FRAMES CONTROLLER (EDITORIAL + DYNAMIC EXPANSION)                */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-admin-line pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-admin-gold/10 text-admin-gold">
                <ImageIcon size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-admin-text">Hệ Thống Media & Hình Ảnh Oria Farm Store</h2>
                  <span className="rounded-full bg-admin-gold/10 px-2 py-0.5 text-[11px] font-semibold text-admin-gold">
                    {config.storyPhotos?.length || 0} khung
                  </span>
                </div>
                <p className="text-xs text-admin-text-faint">
                  6 khung chính định hình bài viết + hỗ trợ thêm không giới hạn ảnh/video cho bộ sưu tập mở rộng.
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
            {(config.storyPhotos || ['', '', '', '', '', '']).map((url, idx) => {
              const wmChecked = config.storyPhotosWatermark?.[idx] !== false;
              const uploadKey = `story-${idx}` as const;
              const isFirst = idx === 0;
              const isLast = idx === (config.storyPhotos?.length || 1) - 1;
              const isExtra = idx >= 6;

              return (
                <div key={idx} className={`flex flex-col justify-between rounded-xl border ${isExtra ? 'border-admin-gold/40 bg-admin-gold/[0.03]' : 'border-admin-line bg-admin-bg/60'} p-4 transition-all`}>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-admin-gold">Khung #{idx + 1}</span>
                        {isExtra && (
                          <span className="rounded bg-admin-gold/15 px-1.5 py-0.5 text-[9px] font-bold text-admin-gold">
                            Mở rộng
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
                    </div>

                    {/* URL Input */}
                    <input
                      type="text"
                      value={url}
                      onChange={(e) =>
                        updateConfig((prev) => {
                          const next = [...(prev.storyPhotos || ['', '', '', '', '', ''])];
                          next[idx] = e.target.value;
                          return { ...prev, storyPhotos: next };
                        })
                      }
                      placeholder="Dán link ảnh / video URL..."
                      className="w-full rounded-lg border border-admin-line bg-admin-card px-3 py-2 text-xs text-admin-text placeholder:text-admin-text-faint/40 focus:border-admin-gold focus:outline-none mb-3"
                    />
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

                    <WatermarkToggle
                      checked={wmChecked}
                      onChange={(val) =>
                        updateConfig((prev) => {
                          const nextWm = [...(prev.storyPhotosWatermark || [true, true, true, true, true, true])];
                          while (nextWm.length <= idx) nextWm.push(true);
                          nextWm[idx] = val;
                          return { ...prev, storyPhotosWatermark: nextWm };
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
        {/* 5. INTRO & 3 PILLARS EDITING                                              */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 shadow-sm space-y-6">
          <div className="border-b border-admin-line pb-4">
            <h2 className="text-base font-bold text-admin-text">
              Đoạn Mở Đầu & 3 Giá Trị Cốt Lõi ({activeLang.toUpperCase()})
            </h2>
          </div>

          <div>
            <label className="block text-xs font-bold text-admin-text mb-1">
              Câu dẫn nhập mở đầu (Intro Lead)
            </label>
            <input
              type="text"
              value={(config.introLead as any)?.[activeLang] || ''}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  introLead: { ...prev.introLead, [activeLang]: e.target.value },
                }))
              }
              className="w-full rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-admin-text mb-1">
              Đoạn văn mở đầu (Intro Paragraph)
            </label>
            <textarea
              rows={3}
              value={(config.introParagraphs?.[0] as any)?.[activeLang] || ''}
              onChange={(e) =>
                updateConfig((prev) => {
                  const nextParas = [...(prev.introParagraphs || [{}])];
                  nextParas[0] = { ...nextParas[0], [activeLang]: e.target.value };
                  return { ...prev, introParagraphs: nextParas };
                })
              }
              className="w-full rounded-lg border border-admin-line bg-admin-bg p-3 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
            />
          </div>

          {/* 3 Pillars */}
          <div className="pt-4 border-t border-admin-line">
            <h3 className="text-sm font-bold text-admin-gold mb-3">3 Giá Trị Cốt Lõi Dinh Dưỡng Xanh (3 Pillars)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {config.pillars?.map((pillar, pIdx) => (
                <div key={pIdx} className="rounded-xl border border-admin-line bg-admin-bg p-3.5 space-y-2">
                  <span className="text-[10px] font-bold text-admin-gold uppercase tracking-wider">Cột trụ #{pIdx + 1}</span>
                  <div>
                    <label className="block text-[11px] text-admin-text-faint mb-1">Tiêu đề</label>
                    <input
                      type="text"
                      value={(pillar.title as any)?.[activeLang] || ''}
                      onChange={(e) =>
                        updateConfig((prev) => {
                          const next = [...prev.pillars];
                          next[pIdx] = {
                            ...next[pIdx],
                            title: { ...next[pIdx].title, [activeLang]: e.target.value },
                          };
                          return { ...prev, pillars: next };
                        })
                      }
                      className="w-full rounded-lg border border-admin-line bg-admin-card px-2.5 py-1.5 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-admin-text-faint mb-1">Mô tả ngắn</label>
                    <textarea
                      rows={2}
                      value={(pillar.desc as any)?.[activeLang] || ''}
                      onChange={(e) =>
                        updateConfig((prev) => {
                          const next = [...prev.pillars];
                          next[pIdx] = {
                            ...next[pIdx],
                            desc: { ...next[pIdx].desc, [activeLang]: e.target.value },
                          };
                          return { ...prev, pillars: next };
                        })
                      }
                      className="w-full rounded-lg border border-admin-line bg-admin-card p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. EDITORIAL SECTIONS (4 SECTIONS)                                       */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 shadow-sm space-y-6">
          <div className="border-b border-admin-line pb-4">
            <h2 className="text-base font-bold text-admin-text">
              Nội Dung 4 Phần Bài Viết ({activeLang.toUpperCase()})
            </h2>
          </div>

          {config.sections?.map((section, sIdx) => (
            <div key={section.id || sIdx} className="rounded-xl border border-admin-line bg-admin-bg/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-admin-line/50 pb-2">
                <span className="text-xs font-bold text-admin-gold uppercase tracking-wider">
                  Phần #{sIdx + 1}: {section.id}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-admin-text-faint mb-1">
                  Tiêu đề phần
                </label>
                <input
                  type="text"
                  value={(section.heading as any)?.[activeLang] || ''}
                  onChange={(e) =>
                    updateConfig((prev) => {
                      const next = [...prev.sections];
                      next[sIdx] = {
                        ...next[sIdx],
                        heading: { ...next[sIdx].heading, [activeLang]: e.target.value },
                      };
                      return { ...prev, sections: next };
                    })
                  }
                  className="w-full rounded-lg border border-admin-line bg-admin-card px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-semibold text-admin-text-faint">Các đoạn văn</label>
                {section.paragraphs?.map((para, pIdx) => (
                  <textarea
                    key={pIdx}
                    rows={2}
                    value={(para as any)?.[activeLang] || ''}
                    onChange={(e) =>
                      updateConfig((prev) => {
                        const next = [...prev.sections];
                        const nextParas = [...next[sIdx].paragraphs];
                        nextParas[pIdx] = { ...nextParas[pIdx], [activeLang]: e.target.value };
                        next[sIdx] = { ...next[sIdx], paragraphs: nextParas };
                        return { ...prev, sections: next };
                      })
                    }
                    className="w-full rounded-lg border border-admin-line bg-admin-card p-3 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                  />
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* ========================================================================= */}
        {/* 7. CLOSING TEXT & CTA EDITING                                            */}
        {/* ========================================================================= */}
        <section className="rounded-2xl border border-admin-line bg-admin-card p-6 shadow-sm space-y-4">
          <div className="border-b border-admin-line pb-4">
            <h2 className="text-base font-bold text-admin-text">
              Phần Đúc Kết, Hashtags & Liên Kết CTA ({activeLang.toUpperCase()})
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1">
                Phương châm (Motto - {activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={(config.motto as any)?.[activeLang] || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    motto: { ...prev.motto, [activeLang]: e.target.value },
                  }))
                }
                className="w-full rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1">
                Dòng Hashtags (Dùng chung)
              </label>
              <input
                type="text"
                value={config.hashtags || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, hashtags: e.target.value }))
                }
                className="w-full rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-admin-text mb-1">
              Đoạn văn đúc kết cuối trang (Closing Text)
            </label>
            <textarea
              rows={2}
              value={(config.closingText as any)?.[activeLang] || ''}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  closingText: { ...prev.closingText, [activeLang]: e.target.value },
                }))
              }
              className="w-full rounded-lg border border-admin-line bg-admin-bg p-3 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-admin-text mb-1">
              Địa chỉ cửa hàng (Store Address - {activeLang.toUpperCase()})
            </label>
            <input
              type="text"
              value={(config.address as any)?.[activeLang] || ''}
              onChange={(e) =>
                updateConfig((prev) => ({
                  ...prev,
                  address: {
                    ...prev.address,
                    [activeLang]: e.target.value,
                  },
                }))
              }
              placeholder="Toạ lạc tại SH04, khu đô thị Thủ Thiêm, 19 Tố Hữu, phường An Khánh, Thành Phố Hồ Chí Minh."
              className="w-full rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-admin-line">
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1">
                Chữ hiển thị liên kết CTA ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                value={(config.ctaText as any)?.[activeLang] || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({
                    ...prev,
                    ctaText: { ...prev.ctaText, [activeLang]: e.target.value },
                  }))
                }
                placeholder="Liên hệ Oria Farm Store"
                className="w-full rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-admin-text mb-1">
                Đường dẫn liên kết (CTA Link - tel: hoặc URL)
              </label>
              <input
                type="text"
                value={config.ctaLink || ''}
                onChange={(e) =>
                  updateConfig((prev) => ({ ...prev, ctaLink: e.target.value }))
                }
                placeholder="tel:+84964090277 hoặc /menu"
                className="w-full rounded-lg border border-admin-line bg-admin-bg px-3.5 py-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
              />
            </div>
          </div>
        </section>
      </div>

      {/* ========================================================================= */}
      {/* 8. COMPACT STICKY FLOATING SAVE BAR (NOT TOO LARGE)                       */}
      {/* ========================================================================= */}
      <div className="fixed bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
        <div
          className={`flex w-full max-w-xl items-center justify-between gap-4 rounded-2xl border px-5 py-3 shadow-2xl backdrop-blur-md transition-all duration-300 pointer-events-auto ${
            isDirty
              ? 'border-admin-gold/40 bg-[#1e1511]/95 shadow-admin-gold/10 translate-y-0 opacity-100 ring-1 ring-admin-gold/30'
              : 'border-admin-line/50 bg-[#18110e]/85 translate-y-1 opacity-90'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-colors ${
                isDirty ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
              }`}
            />
            <span className="text-xs font-medium text-admin-text">
              {isDirty ? 'Có thay đổi chưa lưu' : 'Dữ liệu đã đồng bộ'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={`inline-flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold transition-all ${
                isDirty
                  ? 'bg-admin-gold text-[#120e0c] shadow-lg shadow-admin-gold/20 hover:brightness-110 active:scale-95'
                  : 'bg-admin-gold/20 text-admin-gold hover:bg-admin-gold/30'
              }`}
            >
              {saving ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span>Đang lưu...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Lưu Cấu Hình</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
