'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArchiveRestore, ArrowLeft, CirclePlus, Save, Trash2, Upload, 
  Image as ImageIcon, CheckCircle2, AlertCircle, ExternalLink, 
  Globe, Calendar, MapPin, Tag, RefreshCw, X, Eye, Loader2, Sparkles, Glasses, Watch, Ear, UserCheck, Phone, Mail, FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { Locale } from '@/lib/constants';
import type { LostAndFoundStatus } from '@/lib/lostAndFound';
import type { LostFoundClaimStatus, WebbookingLostFoundItem } from '@/lib/webbookingLostFound';

const LANGUAGES: { code: Locale; label: string; flag: string }[] = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

const ITEM_TYPES: { value: WebbookingLostFoundItem['type']; label: string; icon: any }[] = [
  { value: 'glasses', label: 'Kính mắt (Glasses)', icon: Glasses },
  { value: 'accessory', label: 'Phụ kiện / Khăn / Trang sức', icon: Sparkles },
  { value: 'tech', label: 'Thiết bị điện tử (Tai nghe, đồng hồ...)', icon: Watch },
  { value: 'other', label: 'Vật dụng khác', icon: Ear },
];

const ITEM_STATUS: Record<LostAndFoundStatus, { label: string; color: string }> = {
  available: { label: 'Đang lưu giữ (Hiển thị)', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  contacting: { label: 'Đang liên hệ khách', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  returned: { label: 'Đã trả lại (Ẩn WebLive)', color: 'text-slate-400 border-slate-600/30 bg-slate-500/10' },
};

const CLAIM_STATUS: Record<LostFoundClaimStatus, { label: string; color: string }> = {
  none: { label: 'Chưa có liên hệ', color: 'text-admin-text-dim border-admin-line bg-admin-card/50' },
  new: { label: 'Khách liên hệ mới!', color: 'text-admin-gold border-admin-gold/50 bg-admin-gold/10 animate-pulse' },
  contacted: { label: 'Đã phản hồi', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  resolved: { label: 'Đã xử lý xong', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  archived: { label: 'Lưu trữ', color: 'text-slate-400 border-slate-600/30 bg-slate-500/10' },
};

const createDraft = (): WebbookingLostFoundItem => ({
  id: `draft-${Date.now()}`,
  type: 'other',
  sortOrder: 0,
  title: { vi: '', en: '', cn: '', jp: '', kr: '' },
  detail: { vi: '', en: '', cn: '', jp: '', kr: '' },
  foundAt: { vi: '', en: '', cn: '', jp: '', kr: '' },
  foundOn: new Date().toISOString().slice(0, 10),
  status: 'available',
  image: '',
  claimStatus: 'none',
});

export default function LostAndFoundAdminPage() {
  const [items, setItems] = useState<WebbookingLostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);
  const [activeLang, setActiveLang] = useState<Locale>('vi');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/lost-and-found', { cache: 'no-store' });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể tải danh sách món đồ');
      setItems(json.data || []);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Lỗi khi kết nối với máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  const update = (id: string, patch: Partial<WebbookingLostFoundItem>) => {
    setItems(current => current.map(item => item.id === id ? { ...item, ...patch } : item));
  };

  const updateLocalizedField = (
    id: string, 
    field: 'title' | 'foundAt' | 'detail', 
    lang: Locale, 
    value: string
  ) => {
    setItems(current => current.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        [field]: {
          ...(item[field] || { vi: '', en: '', cn: '', jp: '', kr: '' }),
          [lang]: value,
        },
      };
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Kích thước file ảnh không được vượt quá 10MB.' });
      return;
    }

    setUploadingTarget(itemId);
    setMessage(null);
    try {
      const fileExt = file.name.split('.').pop() || 'png';
      const fileName = `lost-and-found/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        throw new Error(`Lỗi tải ảnh lên Supabase: ${error.message}`);
      }

      const { data: { publicUrl } } = supabase.storage.from('media-uploads').getPublicUrl(data.path);
      update(itemId, { image: publicUrl });
      setMessage({ type: 'success', text: 'Tải ảnh lên thành công! Nhớ nhấn "Lưu món đồ" để hoàn tất.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể tải ảnh lên' });
    } finally {
      setUploadingTarget(null);
      if (fileInputRefs.current[itemId]) {
        fileInputRefs.current[itemId]!.value = '';
      }
    }
  };

  const saveItem = async (item: WebbookingLostFoundItem) => {
    if (item.claimStatus !== 'none') {
      const hasName = Boolean(item.claimantName?.trim());
      const hasNote = Boolean(item.claimNote?.trim());
      const hasContact = Boolean(item.claimantPhone?.trim() || item.claimantEmail?.trim());
      if (!hasName || !hasNote || !hasContact) {
        setMessage({ 
          type: 'error', 
          text: 'Khi trạng thái liên hệ khác "Chưa có liên hệ", bạn phải điền Tên khách, Dấu hiệu nhận diện và SĐT hoặc Email.' 
        });
        return;
      }
    }

    setSaving(item.id);
    setMessage(null);
    try {
      const isDraft = item.id.startsWith('draft-') || item.id.startsWith('found-');
      const response = await fetch(isDraft ? '/api/admin/lost-and-found' : `/api/admin/lost-and-found/${item.id}`, {
        method: isDraft ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || 'Không thể lưu món đồ');
      
      setItems(current => current.map(currentItem => currentItem.id === item.id ? json.data : currentItem));
      setMessage({ 
        type: 'success', 
        text: `✅ Đã lưu món đồ "${json.data.title[activeLang] || json.data.title.vi || json.data.title.en || 'Món đồ'}" thành công! Dữ liệu đã đồng bộ ngay sang WebLive.` 
      });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Không thể lưu món đồ. Vui lòng kiểm tra quyền admin.' });
    } finally {
      setSaving(null);
    }
  };

  const removeItem = async (item: WebbookingLostFoundItem) => {
    const itemName = item.title[activeLang] || item.title.vi || item.title.en || 'món đồ này';
    if (!confirm(`Bạn có chắc chắn muốn xóa "${itemName}" khỏi hệ thống?`)) return;

    if (!item.id.startsWith('draft-') && !item.id.startsWith('found-')) {
      try {
        const response = await fetch(`/api/admin/lost-and-found/${item.id}`, { method: 'DELETE' });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Không thể xóa món đồ trên hệ thống');
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message });
        return;
      }
    }

    setItems(current => current.filter(currentItem => currentItem.id !== item.id));
    setMessage({ type: 'success', text: `Đã xóa "${itemName}" khỏi cơ sở dữ liệu và WebLive.` });
  };

  const activeLangConfig = LANGUAGES.find(l => l.code === activeLang) || LANGUAGES[0];

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-32">
      {/* Header Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Link 
          href="/admin" 
          className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-gold text-sm transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <div className="flex items-center gap-3">
          <Link 
            href="/lost-and-found" 
            target="_blank" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-admin-line text-xs font-semibold text-admin-text-dim hover:text-admin-gold hover:border-admin-gold/50 transition-colors"
          >
            <ExternalLink size={13} /> Xem WebLive Lost & Found
          </Link>
          <button 
            onClick={loadItems} 
            title="Làm mới dữ liệu"
            className="p-1.5 rounded-lg border border-admin-line text-admin-text-dim hover:text-admin-text transition-colors"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main Title Banner */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-8 pb-6 border-b border-admin-line">
        <div>
          <p className="text-admin-gold text-xs font-bold tracking-[.18em] uppercase mb-1.5 flex items-center gap-1.5">
            <ArchiveRestore size={15} /> Guest Care & Hospitality
          </p>
          <h1 className="text-3xl font-bold text-admin-text">Lost & Found (Đồ Thất Lạc)</h1>
          <p className="text-admin-text-dim text-sm mt-1.5 max-w-2xl">
            Quản lý các món đồ khách để quên tại spa và cập nhật thông tin tiếp nhận theo 5 ngôn ngữ. Bất kỳ chỉnh sửa nào sẽ được tự động đồng bộ tức thì lên WebLive.
          </p>
        </div>

        <button 
          onClick={() => {
            const draft = createDraft();
            setItems(current => [draft, ...current]);
            setMessage({ type: 'success', text: 'Đã tạo bản ghi mới ở đầu danh sách. Hãy nhập thông tin và nhấn "Lưu món đồ".' });
          }} 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-admin-gold text-[#1c1409] font-bold hover:brightness-110 transition-all shadow-md active:scale-95 shrink-0"
        >
          <CirclePlus size={18} /> Thêm món đồ mới
        </button>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 border ${
          message.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
            : 'bg-red-500/10 border-red-500/40 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} className="shrink-0 text-emerald-400" /> : <AlertCircle size={18} className="shrink-0 text-red-400" />}
          <p className="text-sm font-medium">{message.text}</p>
          <button onClick={() => setMessage(null)} className="ml-auto text-admin-text-dim hover:text-admin-text p-1">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Status Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-admin-panel border border-admin-line p-3.5 rounded-lg">
          <p className="text-xs text-admin-text-dim uppercase tracking-wider">Tổng số đồ</p>
          <p className="text-2xl font-bold text-admin-text mt-1">{items.length}</p>
        </div>
        <div className="bg-admin-panel border border-admin-line p-3.5 rounded-lg">
          <p className="text-xs text-emerald-400 uppercase tracking-wider">Đang lưu giữ (Live)</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{items.filter(i => i.status === 'available').length}</p>
        </div>
        <div className="bg-admin-panel border border-admin-line p-3.5 rounded-lg">
          <p className="text-xs text-amber-400 uppercase tracking-wider">Đang liên hệ</p>
          <p className="text-2xl font-bold text-amber-400 mt-1">{items.filter(i => i.status === 'contacting').length}</p>
        </div>
        <div className="bg-admin-panel border border-admin-line p-3.5 rounded-lg">
          <p className="text-xs text-admin-gold uppercase tracking-wider">Khách liên hệ mới</p>
          <p className="text-2xl font-bold text-admin-gold mt-1">{items.filter(i => i.claimStatus === 'new').length}</p>
        </div>
      </div>

      {/* Language Switcher Bar (5 Languages) */}
      <div className="bg-admin-panel border border-admin-line rounded-xl p-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-admin-text font-medium">
            <Globe size={18} className="text-admin-gold" />
            <span>Ngôn ngữ chỉnh sửa nội dung:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {LANGUAGES.map(lang => {
              const isActive = activeLang === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setActiveLang(lang.code)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-admin-gold text-[#1c1409] shadow-sm scale-105' 
                      : 'bg-admin-bg border border-admin-line text-admin-text-dim hover:text-admin-text hover:border-admin-line-strong'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="text-xs text-admin-text-dim mt-2.5">
          Đang chỉnh sửa: <strong className="text-admin-gold">{activeLangConfig.label} ({activeLang.toUpperCase()})</strong>. Bạn có thể chuyển ngôn ngữ bất kỳ lúc nào để bổ sung bản dịch mà không làm mất dữ liệu các ngôn ngữ khác.
        </p>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="py-20 text-center text-admin-text-dim flex flex-col items-center justify-center gap-3">
          <Loader2 size={28} className="animate-spin text-admin-gold" />
          <p className="text-sm">Đang tải danh sách đồ thất lạc...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-admin-line rounded-xl p-8">
          <ArchiveRestore size={36} className="mx-auto text-admin-text-dim mb-3 opacity-60" />
          <p className="text-admin-text font-medium">Chưa có món đồ nào trong danh sách</p>
          <p className="text-admin-text-dim text-sm mt-1">Nhấn nút "Thêm món đồ mới" ở phía trên để bắt đầu thêm đồ thất lạc.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {items.map((item, index) => {
            const isSavingThis = saving === item.id;
            const isUploadingThis = uploadingTarget === item.id;
            const itemTitle = item.title[activeLang] || item.title.vi || item.title.en || 'Món đồ chưa đặt tên';

            return (
              <article 
                key={item.id} 
                className="bg-admin-panel border border-admin-line-strong rounded-xl p-6 transition-all hover:border-admin-gold/40 shadow-sm"
              >
                {/* Item Card Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-admin-line pb-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-admin-gold/10 border border-admin-gold/30 flex items-center justify-center text-admin-gold font-bold text-xs">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-admin-text flex items-center gap-2">
                        {itemTitle}
                        {item.id.startsWith('draft-') && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">Mới tạo</span>
                        )}
                      </h2>
                      <p className="text-xs text-admin-text-dim mt-0.5">
                        Mã: <code className="text-[11px] text-admin-gold/80">{item.id}</code>
                      </p>
                    </div>
                  </div>

                  {/* Multi-language fill indicators on each item */}
                  <div className="flex items-center gap-1.5">
                    {LANGUAGES.map(lang => {
                      const hasTitle = Boolean(item.title?.[lang.code]?.trim());
                      const isCurrent = activeLang === lang.code;
                      return (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => setActiveLang(lang.code)}
                          title={`${lang.label}: ${hasTitle ? 'Đã nhập' : 'Chưa có dữ liệu'}`}
                          className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono transition-colors ${
                            isCurrent 
                              ? 'border-admin-gold bg-admin-gold/20 text-admin-gold font-bold border' 
                              : hasTitle 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-admin-bg/60 text-admin-text-dim/60 border border-admin-line'
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.code.toUpperCase()}</span>
                          <span className={`w-1.5 h-1.5 rounded-full ${hasTitle ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                        </button>
                      );
                    })}

                    <button 
                      onClick={() => removeItem(item)} 
                      className="p-1.5 ml-2 text-admin-text-dim hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" 
                      title="Xóa món đồ này"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Form Body */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Image Upload & Preview (4 cols) */}
                  <div className="lg:col-span-4 flex flex-col gap-3">
                    <label className="text-xs font-semibold text-admin-text-dim uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon size={14} className="text-admin-gold" /> Hình ảnh món đồ
                    </label>

                    {/* Image Preview Area */}
                    <div className="relative w-full aspect-square rounded-xl bg-admin-bg border border-admin-line overflow-hidden flex flex-col items-center justify-center group">
                      {item.image ? (
                        <>
                          <Image
                            src={item.image}
                            alt={itemTitle}
                            fill
                            sizes="(max-width: 768px) 100vw, 300px"
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <a
                              href={item.image}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm transition-colors"
                              title="Xem ảnh gốc"
                            >
                              <Eye size={16} />
                            </a>
                            <button
                              type="button"
                              onClick={() => update(item.id, { image: '' })}
                              className="p-2 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-red-300 backdrop-blur-sm transition-colors"
                              title="Xóa ảnh này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4 text-admin-text-dim">
                          <ImageIcon size={36} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs">Chưa có ảnh</p>
                          <p className="text-[11px] text-admin-text-dim/70 mt-0.5">Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)</p>
                        </div>
                      )}

                      {/* Upload overlay spinner */}
                      {isUploadingThis && (
                        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-2 text-admin-gold z-10">
                          <Loader2 size={24} className="animate-spin" />
                          <p className="text-xs font-semibold">Đang tải ảnh lên...</p>
                        </div>
                      )}
                    </div>

                    {/* Upload button & Direct input */}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={el => { fileInputRefs.current[item.id] = el; }}
                        onChange={e => handleFileUpload(e, item.id)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                        disabled={isUploadingThis}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-admin-bg border border-admin-line text-admin-text hover:border-admin-gold hover:text-admin-gold text-xs font-semibold transition-colors disabled:opacity-50"
                      >
                        <Upload size={14} /> Tải ảnh lên
                      </button>
                      {item.image && (
                        <button
                          type="button"
                          onClick={() => update(item.id, { image: '' })}
                          className="px-3 py-2 rounded-lg bg-admin-bg border border-admin-line text-red-400 hover:bg-red-500/10 text-xs transition-colors"
                          title="Gỡ ảnh"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {/* Image URL fallback input */}
                    <div>
                      <input
                        type="text"
                        value={item.image}
                        onChange={e => update(item.id, { image: e.target.value })}
                        placeholder="Hoặc dán URL ảnh (https://...)"
                        className="w-full bg-admin-bg border border-admin-line rounded-lg px-2.5 py-1.5 text-xs text-admin-text placeholder:text-admin-text-dim/50 focus:border-admin-gold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Right Column: Multilingual Content & Metadata (8 cols) */}
                  <div className="lg:col-span-8 flex flex-col gap-4">
                    {/* Multilingual Notice */}
                    <div className="bg-admin-bg/60 border border-admin-line/70 rounded-lg p-3 flex items-center justify-between gap-3 text-xs">
                      <span className="text-admin-text-dim flex items-center gap-1.5">
                        <span>Đang nhập theo:</span>
                        <strong className="text-admin-gold flex items-center gap-1">
                          <span>{activeLangConfig.flag}</span>
                          <span>{activeLangConfig.label} ({activeLang.toUpperCase()})</span>
                        </strong>
                      </span>
                      <span className="text-[11px] text-admin-text-dim">
                        {item.title[activeLang] ? '✓ Đã có tiêu đề' : '⚠ Chưa có tiêu đề'}
                      </span>
                    </div>

                    {/* Active Language Inputs */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {/* Title input for activeLang */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 flex items-center justify-between">
                          <span>Tên món đồ ({activeLang.toUpperCase()}) *</span>
                          <span className="text-[10px] text-admin-gold">{activeLangConfig.label}</span>
                        </label>
                        <input
                          type="text"
                          value={item.title[activeLang] || ''}
                          onChange={e => updateLocalizedField(item.id, 'title', activeLang, e.target.value)}
                          placeholder={`Nhập tên món đồ bằng ${activeLangConfig.label}...`}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                        />
                      </div>

                      {/* Found Location for activeLang */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 flex items-center justify-between">
                          <span>Nơi tìm thấy ({activeLang.toUpperCase()})</span>
                          <span className="text-[10px] text-admin-gold">{activeLangConfig.label}</span>
                        </label>
                        <input
                          type="text"
                          value={item.foundAt[activeLang] || ''}
                          onChange={e => updateLocalizedField(item.id, 'foundAt', activeLang, e.target.value)}
                          placeholder={`Ví dụ: Quầy tiếp đón, Phòng trị liệu...`}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                        />
                      </div>

                      {/* Detail / Description for activeLang */}
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 flex items-center justify-between">
                          <span>Mô tả ngắn gọn ({activeLang.toUpperCase()})</span>
                          <span className="text-[10px] text-admin-gold">{activeLangConfig.label}</span>
                        </label>
                        <textarea
                          rows={2}
                          value={item.detail[activeLang] || ''}
                          onChange={e => updateLocalizedField(item.id, 'detail', activeLang, e.target.value)}
                          placeholder={`Ghi chú mô tả ngắn để hỗ trợ nhận diện món đồ bằng ${activeLangConfig.label}...`}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2.5 text-sm text-admin-text focus:border-admin-gold focus:outline-none resize-y"
                        />
                      </div>
                    </div>

                    {/* Item Classification & Logistics */}
                    <div className="pt-3 border-t border-admin-line grid sm:grid-cols-3 gap-4">
                      {/* Item Type */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 block">
                          Phân loại món đồ
                        </label>
                        <select
                          value={item.type}
                          onChange={e => update(item.id, { type: e.target.value as WebbookingLostFoundItem['type'] })}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                        >
                          {ITEM_TYPES.map(t => (
                            <option key={t.value} value={t.value}>{t.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Found Date */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 block">
                          Ngày tìm thấy
                        </label>
                        <input
                          type="date"
                          value={item.foundOn}
                          onChange={e => update(item.id, { foundOn: e.target.value })}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                        />
                      </div>

                      {/* Sort Order */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 block">
                          Thứ tự ưu tiên
                        </label>
                        <input
                          type="number"
                          value={item.sortOrder ?? 0}
                          onChange={e => update(item.id, { sortOrder: Number(e.target.value) || 0 })}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Status & Claim Management */}
                    <div className="pt-3 border-t border-admin-line grid sm:grid-cols-2 gap-4">
                      {/* Item Public Status */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 block">
                          Trạng thái món đồ (WebLive)
                        </label>
                        <select
                          value={item.status}
                          onChange={e => update(item.id, { status: e.target.value as LostAndFoundStatus })}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                        >
                          {Object.entries(ITEM_STATUS).map(([val, conf]) => (
                            <option key={val} value={val}>{conf.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Claim Status */}
                      <div>
                        <label className="text-xs font-semibold text-admin-text-dim mb-1.5 block">
                          Trạng thái liên hệ của khách
                        </label>
                        <select
                          value={item.claimStatus}
                          onChange={e => update(item.id, { claimStatus: e.target.value as LostFoundClaimStatus })}
                          className="w-full bg-admin-bg border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                        >
                          {Object.entries(CLAIM_STATUS).map(([val, conf]) => (
                            <option key={val} value={val}>{conf.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Claimant Contact Details (shown when claimStatus !== 'none') */}
                    {item.claimStatus !== 'none' && (
                      <div className="bg-admin-bg/80 border border-admin-gold/30 rounded-xl p-4 mt-2 space-y-3 animate-fadeIn">
                        <p className="text-xs font-bold text-admin-gold uppercase tracking-wider flex items-center gap-1.5">
                          <UserCheck size={14} /> Thông tin khách hàng gửi yêu cầu nhận đồ
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-admin-text-dim mb-1 block">Họ tên khách *</label>
                            <input
                              type="text"
                              value={item.claimantName || ''}
                              onChange={e => update(item.id, { claimantName: e.target.value })}
                              placeholder="Nguyễn Văn A"
                              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-admin-text-dim mb-1 block">Số điện thoại hoặc Email *</label>
                            <input
                              type="text"
                              value={item.claimantPhone || item.claimantEmail || ''}
                              onChange={e => {
                                const val = e.target.value;
                                if (val.includes('@')) {
                                  update(item.id, { claimantEmail: val, claimantPhone: '' });
                                } else {
                                  update(item.id, { claimantPhone: val, claimantEmail: '' });
                                }
                              }}
                              placeholder="0901234567 hoặc guest@gmail.com"
                              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="text-xs text-admin-text-dim mb-1 block">Dấu hiệu nhận diện do khách cung cấp *</label>
                            <textarea
                              rows={2}
                              value={item.claimNote || ''}
                              onChange={e => update(item.id, { claimNote: e.target.value })}
                              placeholder="Ví dụ: Kính có vết xước nhỏ ở gọng trái, bên trong hộp có khăn lau màu vàng..."
                              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-xs text-admin-text focus:border-admin-gold focus:outline-none resize-y"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-6 pt-4 border-t border-admin-line flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${ITEM_STATUS[item.status].color}`}>
                      {ITEM_STATUS[item.status].label}
                    </span>
                    {item.claimStatus !== 'none' && (
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${CLAIM_STATUS[item.claimStatus].color}`}>
                        {CLAIM_STATUS[item.claimStatus].label}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => saveItem(item)}
                      disabled={isSavingThis}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-admin-gold text-[#1c1409] text-xs font-bold hover:brightness-110 active:scale-95 transition-all shadow disabled:opacity-50"
                    >
                      {isSavingThis ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Đang lưu & đồng bộ...
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          Lưu món đồ
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
