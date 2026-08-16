'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight, X, Plus, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getPureRelaxationSections } from '@/components/PureRelaxation/pureRelaxationData';

const defaultBgImages = [
  '/images/services/aroma-oil.png',
  '/images/services/barber.JPG',
  '/images/services/coconut-oil.png',
  '/images/services/earclean.png',
  '/images/services/facial.png',
  '/images/services/foot-massage.png',
  '/images/services/hairwash.png',
  '/images/services/hotstone.png',
  '/images/services/shave.JPG',
  '/images/services/shiatsu.png',
  '/images/services/thai.png'
];

const PureAdminPage = () => {
  const [contentData, setContentData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ slideshow: true, categories: true });

  // Add local override state to avoid constant saving on every keystroke
  const [localTextOverrides, setLocalTextOverrides] = useState<any>({});

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: prev[catId] === undefined ? false : !prev[catId]
    }));
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/content');
      const json = await res.json();
      if (json.success) {
        setContentData(json.data.pure_relaxation_media || {});
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveContent = async (newMediaData: any) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pure_relaxation_media: newMediaData }),
      });
      const json = await res.json();
      if (!json.success) {
        alert('Lỗi khi lưu dữ liệu!');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống khi lưu');
    }
  };

  const handleFileUpload = async (keyPath: string, file: File, isArray = false) => {
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    setUploadingId(keyPath);
    setSuccessId(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `pure/${fileName}`;

      const supabase = createClient();
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('media-uploads')
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        alert('Lỗi tải lên (Supabase): ' + uploadError.message);
        setUploadingId(null);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('media-uploads').getPublicUrl(uploadData.path);

      let newMediaData = { ...contentData };
      if (isArray) {
        const arr = newMediaData[keyPath] || defaultBgImages;
        newMediaData[keyPath] = [...arr, publicUrl];
      } else {
        const existing = newMediaData[keyPath] || {};
        newMediaData[keyPath] = { ...existing, type, src: publicUrl };
      }
      
      setContentData(newMediaData);
      await saveContent(newMediaData);

      setSuccessId(keyPath);
      setTimeout(() => setSuccessId(null), 3000);
    } catch {
      alert('Lỗi hệ thống');
    } finally {
      setUploadingId(null);
    }
  };

  const removeArrayItem = async (keyPath: string, index: number) => {
    const arr = [...(contentData[keyPath] || defaultBgImages)];
    arr.splice(index, 1);
    
    let newMediaData = { ...contentData };
    newMediaData[keyPath] = arr;
    
    setContentData(newMediaData);
    await saveContent(newMediaData);
  };

  const handleTextChange = (serviceName: string, field: string, value: string, subField?: string) => {
    setLocalTextOverrides((prev: any) => {
      const s = prev[serviceName] || contentData[serviceName] || {};
      const newS = { ...s };
      if (subField) {
        newS[field] = { ...(newS[field] || {}), [subField]: value };
      } else {
        newS[field] = value;
      }
      return { ...prev, [serviceName]: newS };
    });
  };

  const saveTextChanges = async (serviceName: string) => {
    if (!localTextOverrides[serviceName]) return;
    const newMediaData = {
      ...contentData,
      [serviceName]: {
        ...(contentData[serviceName] || {}),
        ...localTextOverrides[serviceName]
      }
    };
    setContentData(newMediaData);
    setSuccessId(`${serviceName}-text`);
    await saveContent(newMediaData);
    setTimeout(() => setSuccessId(null), 3000);
  };

  const ServiceEditCard = ({ service }: { service: any }) => {
    const serviceName = service.name;
    const isUploading = uploadingId === serviceName;
    const isSuccessMedia = successId === serviceName;
    const isSuccessText = successId === `${serviceName}-text`;

    const cData = localTextOverrides[serviceName] !== undefined 
      ? localTextOverrides[serviceName] 
      : (contentData[serviceName] || {});

    const mediaType = cData.type || service.media?.type || 'image';
    const mediaSrc = cData.src || service.media?.src;

    const desc = cData.description !== undefined ? cData.description : service.description || '';
    
    const privTitle = cData.privilege?.title !== undefined ? cData.privilege.title : service.privilege?.title || '';
    const privCopy = cData.privilege?.copy !== undefined ? cData.privilege.copy : service.privilege?.copy || '';
    const privTime = cData.privilege?.time !== undefined ? cData.privilege.time : service.privilege?.time || '';

    const hasChanges = !!localTextOverrides[serviceName];

    return (
      <div className="bg-admin-bg p-4 rounded-xl border border-admin-line flex flex-col gap-4">
        <h4 className="font-bold text-admin-text border-b border-admin-line pb-2">{serviceName}</h4>
        
        {/* Media Upload */}
        <div className="relative overflow-hidden group rounded-xl border border-admin-line-strong">
          {mediaSrc ? (
            <div className="w-full h-40 relative bg-black/5 flex items-center justify-center">
              {mediaType === 'video' ? (
                <video src={mediaSrc} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <img src={mediaSrc} alt={serviceName} className="w-full h-full object-cover" />
              )}
              
              <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-medium flex items-center gap-1 backdrop-blur-md">
                {mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
                {mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
              </div>
              
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-admin-gold text-[#241804] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#a67433] transition-colors shadow-lg">
                  Đổi ảnh/video
                  <input
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(serviceName, file, false);
                    }}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="w-full h-40 flex flex-col items-center justify-center gap-2 hover:border-admin-gold transition-colors bg-admin-panel">
              <Upload size={24} className="text-admin-text-dim" />
              <label className="cursor-pointer bg-admin-gold text-[#241804] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#a67433] mt-1 shadow-sm transition-transform active:scale-95">
                Tải lên media
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(serviceName, file, false);
                  }}
                />
              </label>
            </div>
          )}

          {isUploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10 backdrop-blur-sm">
              <div className="animate-spin w-8 h-8 border-3 border-admin-gold border-t-transparent rounded-full"></div>
            </div>
          )}

          {isSuccessMedia && (
            <div className="absolute inset-0 bg-admin-green/90 flex items-center justify-center z-10 text-white backdrop-blur-sm">
              <CheckCircle size={32} className="animate-[bounce_0.5s_ease-out]" />
            </div>
          )}
        </div>

        {/* Text Fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Mô tả dịch vụ</label>
            <textarea 
              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[60px]"
              value={desc}
              onChange={(e) => handleTextChange(serviceName, 'description', e.target.value)}
              placeholder="Mô tả..."
            />
          </div>

          <div className="border-t border-admin-line pt-2 mt-1">
            <label className="text-[10px] uppercase font-bold text-admin-gold mb-2 block">Đặc Quyền (Privilege)</label>
            <div className="space-y-2">
              <input 
                type="text"
                className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                value={privTitle}
                onChange={(e) => handleTextChange(serviceName, 'privilege', e.target.value, 'title')}
                placeholder="Tiêu đề đặc quyền..."
              />
              <textarea 
                className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[50px]"
                value={privCopy}
                onChange={(e) => handleTextChange(serviceName, 'privilege', e.target.value, 'copy')}
                placeholder="Mô tả đặc quyền..."
              />
              <input 
                type="text"
                className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                value={privTime}
                onChange={(e) => handleTextChange(serviceName, 'privilege', e.target.value, 'time')}
                placeholder="Thời gian (VD: 5-10 mins)..."
              />
            </div>
          </div>
        </div>

        <button 
          onClick={() => saveTextChanges(serviceName)}
          disabled={!hasChanges}
          className={`mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${hasChanges ? 'bg-admin-gold text-[#241804] hover:bg-[#a67433]' : 'bg-admin-line text-admin-text-dim cursor-not-allowed'}`}
        >
          {isSuccessText ? <CheckCircle size={16} /> : <Save size={16} />}
          {isSuccessText ? 'Đã lưu' : 'Lưu nội dung chữ'}
        </button>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-admin-text-dim">Đang tải cấu hình...</div>;

  const currentSlideshow = contentData.slideshow || defaultBgImages;
  const sections = getPureRelaxationSections(); // Use raw structure for admin layout

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">✨ Quản Lý Pure Relaxation</h1>
        <p className="text-admin-text-dim mt-2">Cấu hình slideshow ảnh nền chuyển động và ảnh/video, mô tả của từng dịch vụ.</p>
      </div>

      <div className="space-y-6 pb-20">
        
        {/* Slideshow Management */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleCat('slideshow')}
            className="w-full px-6 py-4 flex items-center justify-between bg-admin-panel hover:bg-admin-bg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-admin-gold/20 text-admin-gold text-xs font-bold">1</span>
              <h2 className="text-lg font-bold text-admin-text">Background Slideshow (Ảnh nền chuyển động)</h2>
            </div>
            {expandedCats['slideshow'] ? <ChevronDown size={20} className="text-admin-text-dim" /> : <ChevronRight size={20} className="text-admin-text-dim" />}
          </button>
          
          {expandedCats['slideshow'] && (
            <div className="p-6 pt-2 border-t border-admin-line-strong bg-admin-panel/50">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-4">
                {currentSlideshow.map((src: string, index: number) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden aspect-video bg-black/10 border border-admin-line-strong">
                    <img src={src} className="w-full h-full object-cover" alt={`Slide ${index}`} />
                    <button 
                      onClick={() => removeArrayItem('slideshow', index)}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa ảnh này"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                
                <label className="cursor-pointer border-2 border-dashed border-admin-line-strong hover:border-admin-gold rounded-xl flex flex-col items-center justify-center aspect-video text-admin-text-dim hover:text-admin-gold transition-colors relative">
                  <Plus size={24} className="mb-2" />
                  <span className="text-xs font-bold">Thêm ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload('slideshow', file, true);
                    }}
                  />
                  {uploadingId === 'slideshow' && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10 backdrop-blur-sm">
                      <div className="animate-spin w-6 h-6 border-2 border-admin-gold border-t-transparent rounded-full"></div>
                    </div>
                  )}
                </label>
              </div>
              <p className="text-xs text-admin-text-dim">Ghi chú: Nên sử dụng ảnh chất lượng cao (khuyên dùng định dạng ngang, kích thước tối thiểu 1920x1080).</p>
            </div>
          )}
        </div>

        {/* Dynamic Category Management */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleCat('categories')}
            className="w-full px-6 py-4 flex items-center justify-between bg-admin-panel hover:bg-admin-bg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-admin-gold/20 text-admin-gold text-xs font-bold">2</span>
              <h2 className="text-lg font-bold text-admin-text">Tùy chỉnh Dịch vụ & Đặc quyền</h2>
            </div>
            {expandedCats['categories'] ? <ChevronDown size={20} className="text-admin-text-dim" /> : <ChevronRight size={20} className="text-admin-text-dim" />}
          </button>
          
          {expandedCats['categories'] && (
            <div className="p-6 pt-2 border-t border-admin-line-strong flex flex-col gap-8 bg-admin-panel/50">
              {sections.map(section => (
                <div key={section.id} className="border border-admin-line-strong rounded-xl p-5 bg-admin-bg/50">
                  <h3 className="text-xl font-bold text-admin-gold mb-4 flex items-center gap-3 border-b border-admin-line pb-3">
                    <img src={section.icon} className="w-8 h-8 filter invert opacity-80" alt="" />
                    {section.title}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {section.services.map(service => {
                       // Render all services and their variants if they exist
                       const items = service.variants ? service.variants.map(v => ({...v, name: v.name, description: v.subtitle})) : [service];
                       return items.map((item, idx) => (
                         <ServiceEditCard key={`${service.name}-${idx}`} service={item} />
                       ));
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PureAdminPage;
