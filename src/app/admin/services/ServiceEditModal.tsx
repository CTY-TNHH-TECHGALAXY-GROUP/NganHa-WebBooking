import React, { useState } from 'react';
import { Image as ImageIcon, Save, Video, X } from 'lucide-react';

interface ServiceEditModalProps {
  service: any;
  onClose: () => void;
  onSave: () => void;
}

const LOCALES = ['vi', 'en', 'jp', 'kr', 'cn'] as const;

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({ service, onClose, onSave }) => {
  const initialUrl = service.media_url || '';
  const initialType = service.media_type === 'video' ? 'video' : 'image';
  const [mediaUrl, setMediaUrl] = useState(initialUrl);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialType);
  const [activeLocale, setActiveLocale] = useState<(typeof LOCALES)[number]>('vi');
  const [saving, setSaving] = useState(false);

  const currentUrl = initialUrl || null;
  const currentType = initialUrl ? initialType : null;
  const previewUrl = mediaUrl.trim();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const nextUrl = previewUrl || null;
      const response = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_url: nextUrl,
          media_type: nextUrl ? mediaType : null,
          expectedMediaUrl: currentUrl,
          expectedMediaType: currentType,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        alert(result?.error?.message || 'Không thể lưu media dịch vụ.');
        return;
      }
      onSave();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Lỗi hệ thống khi lưu media.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-admin-panel rounded-2xl border border-admin-line-strong shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-admin-line-strong flex items-center justify-between bg-admin-bg/50">
          <div>
            <h2 className="text-xl font-bold text-admin-text">Media dịch vụ</h2>
            <p className="text-xs text-admin-text-dim mt-1">{service.id}</p>
          </div>
          <button type="button" onClick={onClose} className="p-2 text-admin-text-faint hover:text-admin-text hover:bg-admin-line rounded-lg transition-colors" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="service-media-form" onSubmit={handleSubmit} className="space-y-6">
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-admin-text">Thông tin catalog (chỉ đọc)</h3>
                <span className="text-[11px] text-admin-text-faint">Giá, thời lượng và trạng thái do hệ thống điều phối quản lý</span>
              </div>
              <div className="flex gap-1 border-b border-admin-line pb-2">
                {LOCALES.map(locale => (
                  <button key={locale} type="button" onClick={() => setActiveLocale(locale)} className={`px-3 py-1 rounded-md text-[10px] font-bold ${activeLocale === locale ? 'bg-admin-gold text-[#241804]' : 'bg-admin-panel-2 text-admin-text-dim'}`}>
                    {locale.toUpperCase()}
                  </button>
                ))}
              </div>
              <input readOnly value={service.names?.[activeLocale] || ''} className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-sm text-admin-text" aria-label={`Tên dịch vụ ${activeLocale}`} />
              <textarea readOnly value={service.descriptions?.[activeLocale] || ''} className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-sm text-admin-text min-h-[76px]" aria-label={`Mô tả dịch vụ ${activeLocale}`} />
              <div className="grid grid-cols-2 gap-3 text-sm text-admin-text-dim">
                <div className="bg-admin-bg border border-admin-line rounded-xl px-4 py-3">Giá: <strong className="text-admin-text">{service.priceVND?.toLocaleString?.('vi-VN') || 0} VND</strong></div>
                <div className="bg-admin-bg border border-admin-line rounded-xl px-4 py-3">Thời lượng: <strong className="text-admin-text">{service.timeValue || 0} phút</strong></div>
              </div>
            </section>

            <section className="space-y-3 border-t border-admin-line pt-5">
              <h3 className="text-sm font-semibold text-admin-text">Media được phép chỉnh sửa</h3>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                <input type="text" value={mediaUrl} onChange={event => setMediaUrl(event.target.value)} placeholder="https://... hoặc /media/..." className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
                <select value={mediaType} onChange={event => setMediaType(event.target.value as 'image' | 'video')} className="bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold">
                  <option value="image">Ảnh</option>
                  <option value="video">Video</option>
                </select>
              </div>
              {previewUrl && (
                <div className="h-48 rounded-xl overflow-hidden border border-admin-line bg-black/10 flex items-center justify-center">
                  {mediaType === 'video' ? <video src={previewUrl} controls muted className="w-full h-full object-contain" /> : <img src={previewUrl} alt="Media preview" className="w-full h-full object-contain" />}
                </div>
              )}
              <p className="text-xs text-admin-text-faint flex items-center gap-1">
                {mediaType === 'video' ? <Video size={13} /> : <ImageIcon size={13} />}
                Chỉ thay liên kết media của dịch vụ này; catalog và booking không bị ghi.
              </p>
            </section>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-admin-line-strong flex items-center justify-end gap-3 bg-admin-bg/50">
          <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-admin-text-dim hover:text-admin-text transition-colors">Hủy bỏ</button>
          <button form="service-media-form" type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all disabled:opacity-70">
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu media'}
          </button>
        </div>
      </div>
    </div>
  );
};
