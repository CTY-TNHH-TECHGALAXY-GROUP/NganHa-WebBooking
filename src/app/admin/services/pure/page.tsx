'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight, X, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase';

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

const categoryStructure = [
  { id: 'spaVideo', title: 'Aroma / Hotstone' },
  { id: 'massageVideo', title: 'Body Massage / No Oil' },
  { id: 'headSpaVideo', title: 'Head Spa / Hair Wash' },
  { id: 'barberVideo', title: 'Barber Services' },
  { id: 'footVideo', title: 'Foot Ritual' },
  { id: 'footImg', title: 'Heel Care / Foot Image' },
  { id: 'teaImg', title: 'Tea Privilege' },
  { id: 'herbalImg', title: 'Herbal Privilege' }
];

const PureAdminPage = () => {
  const [contentData, setContentData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ slideshow: true, categories: false });

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
        newMediaData[keyPath] = { type, src: publicUrl };
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

  const MediaUploadBox = ({ title, keyPath }: { title: string, keyPath: string }) => {
    const media = contentData[keyPath];
    const isUploading = uploadingId === keyPath;
    const isSuccess = successId === keyPath;

    return (
      <div className="bg-admin-bg p-4 rounded-xl border border-admin-line-strong flex flex-col items-center text-center gap-3 relative overflow-hidden group">
        {media ? (
          <div className="w-full h-32 relative rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
            {media.type === 'video' ? (
              <video src={media.src} className="w-full h-full object-cover" autoPlay muted loop playsInline />
            ) : (
              <img src={media.src} alt={title} className="w-full h-full object-cover" />
            )}
            <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-medium flex items-center gap-1 backdrop-blur-md">
              {media.type === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
              {media.type === 'video' ? 'VIDEO' : 'IMAGE'}
            </div>
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <label className="cursor-pointer bg-admin-gold text-[#241804] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#a67433] transition-colors shadow-lg">
                Thay đổi
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(keyPath, file, false);
                  }}
                />
              </label>
            </div>
          </div>
        ) : (
          <div className="w-full h-32 rounded-lg border-2 border-dashed border-admin-line-strong flex flex-col items-center justify-center gap-2 hover:border-admin-gold transition-colors bg-admin-panel">
            <Upload size={24} className="text-admin-text-dim" />
            <span className="text-xs text-admin-text-dim font-medium">Sử dụng mặc định</span>
            <label className="cursor-pointer bg-admin-gold text-[#241804] px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-[#a67433] mt-1 shadow-sm transition-transform active:scale-95">
              Tải lên thay thế
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(keyPath, file, false);
                }}
              />
            </label>
          </div>
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-xl z-10 backdrop-blur-sm">
            <div className="animate-spin w-8 h-8 border-3 border-admin-gold border-t-transparent rounded-full"></div>
          </div>
        )}

        {isSuccess && (
          <div className="absolute inset-0 bg-admin-green/90 flex items-center justify-center rounded-xl z-10 text-white backdrop-blur-sm">
            <CheckCircle size={32} className="animate-[bounce_0.5s_ease-out]" />
          </div>
        )}

        <div className="w-full flex justify-between items-end mt-1">
          <span className="text-xs font-bold text-admin-text truncate max-w-[150px]" title={title}>{title}</span>
        </div>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-center text-admin-text-dim">Đang tải cấu hình...</div>;

  const currentSlideshow = contentData.slideshow || defaultBgImages;

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">✨ Quản Lý Pure Relaxation</h1>
        <p className="text-admin-text-dim mt-2">Cấu hình slideshow ảnh nền chuyển động và ảnh/video các danh mục.</p>
      </div>

      <div className="space-y-4 pb-20">
        
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

        {/* Category Media Management */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleCat('categories')}
            className="w-full px-6 py-4 flex items-center justify-between bg-admin-panel hover:bg-admin-bg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-admin-gold/20 text-admin-gold text-xs font-bold">2</span>
              <h2 className="text-lg font-bold text-admin-text">Category Media (Ảnh/Video các danh mục)</h2>
            </div>
            {expandedCats['categories'] ? <ChevronDown size={20} className="text-admin-text-dim" /> : <ChevronRight size={20} className="text-admin-text-dim" />}
          </button>
          
          {expandedCats['categories'] && (
            <div className="p-6 pt-2 border-t border-admin-line-strong grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 bg-admin-panel/50">
              {categoryStructure.map(cat => (
                <MediaUploadBox key={cat.id} title={cat.title} keyPath={cat.id} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PureAdminPage;
