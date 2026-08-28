import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';

interface ServiceEditModalProps {
  service: any; // Mapped service from /api/services
  onClose: () => void;
  onSave: () => void;
}

export const ServiceEditModal: React.FC<ServiceEditModalProps> = ({ service, onClose, onSave }) => {
  const [saving, setSaving] = useState(false);
  
  // Initialize form data from service object
  const [formData, setFormData] = useState({
    nameVN: service.names?.vi || '',
    nameEN: service.names?.en || '',
    nameKR: service.names?.kr || '',
    nameJP: service.names?.jp || '',
    nameCN: service.names?.cn || '',
    priceVND: service.priceVND || 0,
    duration: service.timeValue || 0,
    category: service.cat || '',
    isActive: service.ACTIVE !== false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: Number(value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onSave();
        onClose();
      } else {
        alert('Lỗi cập nhật dịch vụ!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-admin-panel rounded-2xl border border-admin-line-strong shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-admin-line-strong flex items-center justify-between bg-admin-bg/50">
          <h2 className="text-xl font-bold text-admin-text">
            Chỉnh sửa dịch vụ: <span className="text-admin-gold">{service.id}</span>
          </h2>
          <button onClick={onClose} className="p-2 text-admin-text-faint hover:text-admin-text hover:bg-admin-line rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <form id="service-edit-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Tên tiếng Việt</label>
                <input required type="text" name="nameVN" value={formData.nameVN} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Tên tiếng Anh (EN)</label>
                <input required type="text" name="nameEN" value={formData.nameEN} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Tên tiếng Hàn (KR)</label>
                <input type="text" name="nameKR" value={formData.nameKR} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Tên tiếng Nhật (JP)</label>
                <input type="text" name="nameJP" value={formData.nameJP} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Tên tiếng Trung (CN)</label>
                <input type="text" name="nameCN" value={formData.nameCN} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
              
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Danh mục (Category)</label>
                <input required type="text" name="category" value={formData.category} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
            </div>

            <hr className="border-admin-line-strong" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Giá tiền (VND)</label>
                <input required type="number" min={0} name="priceVND" value={formData.priceVND} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-admin-text-dim mb-1.5">Thời lượng (Phút)</label>
                <input required type="number" min={0} name="duration" value={formData.duration} onChange={handleChange} className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-2.5 text-sm outline-none focus:border-admin-gold" />
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-admin-bg rounded-xl border border-admin-line">
              <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} className="w-4 h-4 rounded text-admin-gold focus:ring-admin-gold cursor-pointer" />
              <label htmlFor="isActive" className="text-sm font-semibold text-admin-text cursor-pointer">
                Kích hoạt dịch vụ (Hiển thị trên web)
              </label>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-admin-line-strong flex items-center justify-end gap-3 bg-admin-bg/50">
          <button onClick={onClose} disabled={saving} className="px-5 py-2.5 text-sm font-semibold text-admin-text-dim hover:text-admin-text transition-colors">
            Hủy bỏ
          </button>
          <button form="service-edit-form" type="submit" disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all disabled:opacity-70">
            {saving ? '⏳ Đang lưu...' : <><Save size={16} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  );
};
