'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Image as ImageIcon, Video, Upload, ArrowLeft, GripVertical } from 'lucide-react';
import Link from 'next/link';

// 🔧 UI CONFIGURATION
const MAX_FILE_SIZE_MB = 50;

const FlipbookPagesAdmin = () => {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({ page_number: 1, title: '', media_type: 'image' as 'image' | 'video', service_id: undefined as string | undefined });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetchPages();
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const json = await res.json();
      if (json.success) setServices(json.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách dịch vụ:', err);
    }
  };

  const fetchPages = async () => {
    try {
      const res = await fetch('/api/admin/flipbook-pages');
      const json = await res.json();
      if (json.success) {
        setPages(json.data || []);
        setFormData(prev => ({ ...prev, page_number: (json.data?.length || 0) + 1 }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert(`File quá lớn! Tối đa ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    // Auto-detect media type
    const isVideo = file.type.startsWith('video/');
    setFormData(prev => ({ ...prev, media_type: isVideo ? 'video' : 'image' }));
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Vui lòng chọn file ảnh hoặc video!');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload file
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('folder', 'flipbook');
      const uploadRes = await fetch('/api/admin/media', { method: 'POST', body: form });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        alert('Lỗi tải file: ' + (uploadJson.error?.message || 'Không rõ'));
        setUploading(false);
        return;
      }

      // 2. Save record
      const res = await fetch('/api/admin/flipbook-pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, media_url: uploadJson.data.url }),
      });

      if (res.ok) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccessMessage('✅ Đã thêm trang thành công!');
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchPages();
      } else {
        alert('Lỗi khi lưu!');
      }
    } catch {
      alert('Lỗi hệ thống, vui lòng thử lại.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa trang này không?')) return;
    setLoading(true);
    await fetch(`/api/admin/flipbook-pages/${id}`, { method: 'DELETE' });
    setSuccessMessage('🗑️ Đã xóa trang.');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchPages();
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">📖 Quản Lý Sách Lật (Flipbook)</h1>
        <p className="text-admin-text-dim mt-2">Thêm các trang ảnh hoặc video vào cuốn sách dịch vụ trên website.</p>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-admin-green-a border border-admin-green-b text-admin-green text-sm font-semibold animate-pulse">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* FORM — Chiếm 2 cột */}
        <div className="lg:col-span-2">
          <div className="bg-admin-panel rounded-2xl border border-admin-line-strong p-6 sticky top-6 shadow-[var(--shadow)]">
            <h2 className="text-lg font-semibold text-admin-gold mb-5 flex items-center gap-2">
              <Plus size={18} /> Thêm trang mới
            </h2>

            <form onSubmit={handleAdd} className="space-y-5">
              {/* Số trang */}
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-1.5">Số thứ tự trang</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formData.page_number}
                  onChange={e => setFormData({ ...formData, page_number: Number(e.target.value) })}
                  className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-lg focus:border-admin-gold focus:ring-1 focus:ring-admin-gold transition-colors"
                />
              </div>

              {/* Tiêu đề / Tên Dịch Vụ */}
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-1.5">Liên kết Dịch Vụ (Tùy chọn)</label>
                <div className="flex flex-col gap-2">
                  <select
                    value={formData.service_id || ''}
                    onChange={e => {
                      const selectedService = services.find(s => s.id === e.target.value);
                      if (selectedService) {
                        setFormData({ 
                          ...formData, 
                          service_id: selectedService.id, 
                          title: selectedService.name_vi || selectedService.names?.vi || formData.title
                        });
                      } else {
                        setFormData({ ...formData, service_id: undefined });
                      }
                    }}
                    className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text focus:border-admin-gold focus:ring-1 focus:ring-admin-gold transition-colors"
                  >
                    <option value="">-- Không liên kết --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.name_vi || s.names?.vi || s.id}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Hoặc nhập tay (VD: Bìa sách, Video quảng cáo...)"
                    className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text focus:border-admin-gold focus:ring-1 focus:ring-admin-gold transition-colors"
                  />
                </div>
              </div>

              {/* Khu vực upload */}
              <div>
                <label className="block text-sm font-semibold text-admin-text-dim mb-1.5">Chọn ảnh hoặc video</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative cursor-pointer border-2 border-dashed rounded-2xl
                    flex flex-col items-center justify-center p-6 min-h-[180px]
                    transition-all duration-200
                    ${previewUrl
                      ? 'border-admin-gold bg-admin-gold-dim'
                      : 'border-admin-line-strong bg-admin-panel-2 hover:border-admin-gold hover:bg-admin-gold-dim'
                    }
                  `}
                >
                  {previewUrl ? (
                    <div className="w-full">
                      {formData.media_type === 'image' ? (
                        <img src={previewUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl shadow-sm" />
                      ) : (
                        <video src={previewUrl} className="w-full h-40 object-cover rounded-xl shadow-sm" controls />
                      )}
                      <p className="text-center text-xs text-admin-text-faint mt-2">Nhấn để chọn file khác</p>
                    </div>
                  ) : (
                    <>
                      <Upload size={32} className="text-admin-text-faint mb-3" />
                      <p className="text-sm text-admin-text-dim text-center">
                        <strong className="text-admin-text">Nhấn vào đây</strong> để chọn file
                      </p>
                      <p className="text-[12px] text-admin-text-faint mt-1">JPG, PNG, MP4 — tối đa {MAX_FILE_SIZE_MB}MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Nút thêm */}
              <button
                type="submit"
                disabled={uploading || !selectedFile}
                className={`
                  w-full py-3.5 rounded-xl font-bold text-base
                  transition-all duration-200 shadow-sm
                  ${uploading || !selectedFile
                    ? 'bg-admin-line text-admin-text-faint cursor-not-allowed border border-admin-line-strong'
                    : 'bg-admin-gold hover:bg-[#a67433] text-[#241804] active:scale-[0.98]'
                  }
                `}
              >
                {uploading ? '⏳ Đang tải lên...' : selectedFile ? '✅ Thêm trang này' : 'Chọn file trước khi thêm'}
              </button>
            </form>
          </div>
        </div>

        {/* DANH SÁCH — Chiếm 3 cột */}
        <div className="lg:col-span-3 space-y-4">
          <h2 className="text-lg font-semibold text-admin-text mb-2">
            Các trang hiện có ({pages.length})
          </h2>

          {loading && pages.length === 0 ? (
            <div className="bg-admin-panel border border-admin-line rounded-2xl p-8 text-center shadow-[var(--shadow)]">
              <p className="text-admin-text-dim">⏳ Đang tải...</p>
            </div>
          ) : pages.length === 0 ? (
            <div className="bg-admin-panel border border-admin-line rounded-2xl p-8 text-center shadow-[var(--shadow)]">
              <Upload size={40} className="mx-auto mb-3 text-admin-text-faint" />
              <p className="text-admin-text-dim font-medium">Chưa có trang nào.</p>
              <p className="text-admin-text-faint text-sm mt-1">Hãy thêm trang đầu tiên bằng form bên trái ←</p>
            </div>
          ) : (
            pages.map((page) => (
              <div
                key={page.id}
                className="bg-admin-panel border border-admin-line rounded-xl p-4 flex items-center gap-4 hover:border-admin-line-strong transition-colors group shadow-[var(--shadow)]"
              >
                {/* Page Number Badge */}
                <div className="w-11 h-11 rounded-lg bg-admin-gold-dim border border-admin-gold/30 flex items-center justify-center font-bold text-admin-gold text-lg flex-shrink-0 shadow-sm">
                  {page.page_number}
                </div>

                {/* Thumbnail */}
                <div className="w-20 h-20 bg-admin-panel-2 rounded-xl overflow-hidden flex-shrink-0 border border-admin-line-strong flex items-center justify-center shadow-sm">
                  {page.media_type === 'image' ? (
                    <img src={page.media_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="relative w-full h-full">
                      <video src={page.media_url} className="w-full h-full object-cover" />
                      <Video className="absolute inset-0 m-auto w-6 h-6 text-white drop-shadow" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-admin-text truncate">{page.title || `Trang ${page.page_number}`}</h3>
                  <span className="inline-flex items-center gap-1 text-[13px] text-admin-text-dim mt-1 font-medium">
                    {page.media_type === 'image' ? <ImageIcon size={14} /> : <Video size={14} />}
                    {page.media_type === 'image' ? 'Hình ảnh' : 'Video'}
                  </span>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(page.id)}
                  className="p-2.5 text-admin-text-faint hover:text-[#c85a5a] hover:bg-red-50 rounded-xl transition-all opacity-60 group-hover:opacity-100"
                  title="Xóa trang này"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipbookPagesAdmin;
