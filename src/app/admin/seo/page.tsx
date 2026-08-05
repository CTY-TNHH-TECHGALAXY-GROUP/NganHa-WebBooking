'use client';

import React, { useState, useEffect } from 'react';
import { Save, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SeoAdminPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    keywords: '',
    ogImage: ''
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    fetchSeo();
  }, []);

  const fetchSeo = async () => {
    try {
      const res = await fetch('/api/admin/seo');
      const json = await res.json();
      if (json.success && json.data) {
        setFormData(json.data);
      }
    } catch (e) {
      console.error(e);
      showToast('Không thể tải cấu hình SEO', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const json = await res.json();
      if (json.success) {
        showToast('Đã lưu cấu hình SEO thành công!', 'success');
      } else {
        throw new Error('Lỗi server');
      }
    } catch (e) {
      console.error(e);
      showToast('Lỗi khi lưu cấu hình SEO', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center text-gray-400">Đang tải...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-admin-text flex items-center gap-2">
            <Search className="text-admin-gold" />
            Cấu hình SEO (Tối ưu tìm kiếm)
          </h1>
          <p className="text-admin-text-dim text-sm mt-1">
            Điều chỉnh thẻ Tiêu đề, Mô tả và Từ khóa để Google hiển thị website của bạn tốt nhất.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-admin-gold hover:bg-[#a67433] text-[#241804] px-6 py-2.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-sm"
        >
          {isSaving ? (
            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Lưu cấu hình
        </button>
      </div>

      {/* Main Form */}
      <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 space-y-6 shadow-[var(--shadow)]">
        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-medium text-admin-text-dim mb-2">
            Tiêu đề trang (Meta Title)
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="VD: Ngân Hà Spa & Barbershop | Massage chuẩn trị liệu"
            className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
          />
          <p className="text-[11px] text-admin-text-faint mt-2">Độ dài lý tưởng: 50-60 ký tự. Sẽ hiển thị nổi bật nhất trên Google.</p>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-medium text-admin-text-dim mb-2">
            Mô tả ngắn (Meta Description)
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="VD: Trải nghiệm dịch vụ massage, gội đầu dưỡng sinh cao cấp tại..."
            className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors resize-none"
          />
          <p className="text-[11px] text-admin-text-faint mt-2">Độ dài lý tưởng: 150-160 ký tự. Là đoạn text giới thiệu nhỏ dưới tiêu đề trên Google.</p>
        </div>

        {/* Từ khóa */}
        <div>
          <label className="block text-sm font-medium text-admin-text-dim mb-2">
            Từ khóa SEO (Keywords)
          </label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            placeholder="VD: spa quận 1, gội đầu dưỡng sinh, massage trị liệu..."
            className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
          />
          <p className="text-[11px] text-admin-text-faint mt-2">Cách nhau bởi dấu phẩy (,).</p>
        </div>

        {/* Ảnh Open Graph */}
        <div>
          <label className="block text-sm font-medium text-admin-text-dim mb-2">
            Link ảnh chia sẻ (Open Graph Image URL)
          </label>
          <input
            type="text"
            name="ogImage"
            value={formData.ogImage}
            onChange={handleChange}
            placeholder="https://..."
            className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-gold transition-colors"
          />
          <p className="text-[11px] text-admin-text-faint mt-2">Hình ảnh sẽ hiện ra khi bạn share link website lên Facebook, Zalo.</p>
        </div>
      </div>

      {/* Google Preview */}
      <div className="bg-white rounded-2xl p-6 space-y-2 max-w-2xl">
        <h3 className="text-sm font-semibold text-gray-800 mb-4 border-b pb-2">Mô phỏng hiển thị trên Google</h3>
        <div className="text-sm text-gray-600 flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs">NG</div>
          <div>
            <div className="text-gray-800">Ngân Hà Spa</div>
            <div className="text-xs text-gray-500">https://nganhaspa.com</div>
          </div>
        </div>
        <div className="text-[20px] text-[#1a0dab] font-medium leading-tight hover:underline cursor-pointer">
          {formData.title || 'Tiêu đề trang sẽ hiển thị ở đây'}
        </div>
        <div className="text-sm text-[#4d5156] leading-snug break-words">
          {formData.description || 'Đoạn mô tả ngắn gọn về dịch vụ của bạn sẽ xuất hiện tại đây, giúp khách hàng quyết định click vào.'}
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-xl flex items-center gap-3 shadow-2xl z-50 animate-fade-in-up ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="font-medium">{toast.message}</span>
        </div>
      )}
    </div>
  );
}
