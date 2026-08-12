'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { pureRelaxationSections, PureRelaxationSection, PureRelaxationService } from '@/components/PureRelaxation/pureRelaxationData';

const hasVariants = (service: PureRelaxationService): boolean =>
  Array.isArray(service.variants) && service.variants.length > 0;

const PureRelaxationAdminPage = () => {
  const [contentData, setContentData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCat = (catId: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: prev[catId] === undefined ? false : !prev[catId]
    }));
  };

  useEffect(() => {
    fetchContent();
    fetchMediaLibrary();
  }, []);

  const fetchMediaLibrary = async () => {
    try {
      const res = await fetch('/api/admin/media-library');
      const json = await res.json();
      if (json.success) setMediaLibrary(json.data || []);
    } catch (err) {
      console.error(err);
    }
  };

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

  const saveContent = async (newMediaData: Record<string, any>) => {
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

  const handleFileUpload = async (serviceName: string, file: File) => {
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    setUploadingId(serviceName);
    setSuccessId(null);

    try {
      // 1. Upload file trực tiếp lên Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `pure-relaxation/${fileName}`;

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

      // 2. Add to Media Library
      await fetch('/api/admin/media-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Pure Relax - ${file.name}`,
          type: type,
          url: publicUrl,
          source: 'supabase',
        }),
      });
      fetchMediaLibrary(); // Refresh library

      // 3. Update content data
      const newMediaData = {
        ...contentData,
        [serviceName]: { type, src: publicUrl }
      };
      
      setContentData(newMediaData);
      await saveContent(newMediaData);

      setSuccessId(serviceName);
      setTimeout(() => setSuccessId(null), 3000);
    } catch {
      alert('Lỗi hệ thống');
    } finally {
      setUploadingId(null);
    }
  };

  const handleSelectMedia = async (serviceName: string, mediaUrl: string, mediaType: string) => {
    setUploadingId(serviceName);
    setSuccessId(null);
    try {
      const newMediaData = {
        ...contentData,
        [serviceName]: { type: mediaType, src: mediaUrl }
      };
      
      setContentData(newMediaData);
      await saveContent(newMediaData);
      
      setSuccessId(serviceName);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống');
    } finally {
      setUploadingId(null);
    }
  };

  // Helper component to render a single service card
  const RenderServiceCard = ({ name, description, defaultMedia, groupLabel }: { name: string, description: string, defaultMedia: any, groupLabel?: string }) => {
    const currentMedia = contentData[name] || defaultMedia;
    
    return (
      <div
        key={name}
        className={`
          bg-admin-panel border rounded-2xl overflow-hidden flex flex-col shadow-[var(--shadow)]
          transition-all duration-300
          ${successId === name ? 'border-admin-green ring-1 ring-admin-green-a' : 'border-admin-line-strong hover:border-admin-gold hover:-translate-y-1'}
        `}
      >
        {/* Media Preview */}
        <div className="relative w-full aspect-video bg-admin-panel-2 flex items-center justify-center border-b border-admin-line-strong">
          {currentMedia?.src ? (
            currentMedia.type === 'video' ? (
              <video src={currentMedia.src} controls className="w-full h-full object-cover" />
            ) : (
              <img src={currentMedia.src} alt="" className="w-full h-full object-cover" />
            )
          ) : (
            <div className="text-center text-admin-text-faint">
              <ImageIcon size={32} className="mx-auto mb-2" />
              <p className="text-xs">Chưa có ảnh/video</p>
            </div>
          )}

          {/* Success Badge */}
          {successId === name && (
            <div className="absolute top-3 right-3 bg-admin-green text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 animate-bounce">
              <CheckCircle size={14} /> Đã lưu!
            </div>
          )}

          {/* Uploading Overlay */}
          {uploadingId === name && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-admin-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-admin-gold font-medium">Đang tải lên...</p>
              </div>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-5 flex flex-col flex-1">
          {groupLabel && (
             <div className="mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-admin-gold-dim text-admin-gold px-2 py-0.5 rounded-full border border-admin-gold/20">
                {groupLabel}
              </span>
            </div>
          )}
          <h3 className="text-base font-bold text-admin-text mb-1">{name}</h3>
          <p className="text-xs text-admin-text-dim mb-4 line-clamp-2" title={description}>{description}</p>

          {/* Action Buttons: Select & Upload */}
          <div className="mt-auto space-y-2">
            {/* Select Existing Media */}
            <div className="relative">
              <select
                className="w-full appearance-none bg-admin-panel border border-admin-line-strong text-admin-text-dim text-sm rounded-xl px-3 py-2.5 outline-none focus:border-admin-gold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploadingId === name}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const selectedMedia = mediaLibrary.find(m => m.url === e.target.value);
                  if (selectedMedia) {
                    handleSelectMedia(name, selectedMedia.url, selectedMedia.type);
                  }
                }}
                value={contentData[name]?.src || ''}
              >
                <option value="">-- Chọn ảnh/video có sẵn --</option>
                {mediaLibrary.map(media => (
                  <option key={media.id} value={media.url}>
                    {media.type === 'video' ? '🎬' : '🖼️'} {media.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Upload New Media */}
            <label className={`
              flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer
              font-semibold text-[13.5px] transition-all duration-200 border border-admin-line-strong
              ${uploadingId === name
                ? 'bg-admin-line text-admin-text-faint cursor-wait'
                : 'bg-transparent hover:border-admin-gold hover:bg-admin-gold-dim text-admin-text-dim hover:text-admin-gold'
              }
            `}>
              <Upload size={16} />
              Tải lên file mới
              <input
                type="file"
                accept="image/*, video/*, .mp4, .mov, .webm"
                className="hidden"
                disabled={uploadingId === name}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(name, file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">✨ Quản Lý Media: Pure Relaxation</h1>
        <p className="text-admin-text-dim mt-2">Cấu hình hình ảnh và video độc quyền cho trang Pure Relaxation.</p>
      </div>

      {/* Hướng dẫn */}
      <div className="mb-8 bg-admin-panel border border-admin-line rounded-2xl p-5 shadow-[var(--shadow)]">
        <p className="text-sm text-admin-text-dim">
          👉 Trang Pure Relaxation có cấu trúc dịch vụ và package (gói) riêng biệt. Tại đây bạn có thể 
          chủ động thay thế video/ảnh cho từng dịch vụ mà không cần phụ thuộc vào Menu tiêu chuẩn.
        </p>
      </div>

      {/* Sections Grid */}
      <div className="space-y-12">
        {loading ? (
          <p className="text-admin-text-dim text-center py-8">⏳ Đang tải dữ liệu...</p>
        ) : (
          pureRelaxationSections.map((section: PureRelaxationSection) => {
            const isExpanded = expandedCats[section.id] !== false; // Mặc định mở
            return (
              <div key={section.id} className="space-y-4 bg-admin-panel p-4 rounded-2xl border border-admin-line shadow-sm">
                <button 
                  onClick={() => toggleCat(section.id)}
                  className="w-full flex items-center justify-between text-lg font-bold text-admin-gold hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-5 h-5 bg-admin-gold" 
                      style={{
                        maskImage: `url(${section.icon})`,
                        WebkitMaskImage: `url(${section.icon})`,
                        maskSize: 'contain',
                        maskRepeat: 'no-repeat',
                        WebkitMaskSize: 'contain',
                        WebkitMaskRepeat: 'no-repeat'
                      }}
                    />
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4 border-t border-admin-line-strong">
                    {section.services.map((service) => {
                      if (hasVariants(service)) {
                        // Render variants if available (e.g. Hair Wash & Facial packages)
                        return service.variants!.map(variant => (
                          <RenderServiceCard 
                            key={variant.name}
                            name={variant.name} 
                            description={variant.subtitle} 
                            defaultMedia={variant.media}
                            groupLabel={service.name} 
                          />
                        ));
                      } else {
                        // Render standard service
                        return (
                          <RenderServiceCard 
                            key={service.name}
                            name={service.name} 
                            description={service.description} 
                            defaultMedia={service.media} 
                          />
                        );
                      }
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PureRelaxationAdminPage;
