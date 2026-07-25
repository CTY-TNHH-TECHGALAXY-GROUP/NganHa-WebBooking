'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

const ServicesAdminPage = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [mediaLibrary, setMediaLibrary] = useState<any[]>([]);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [cat]: prev[cat] === undefined ? false : !prev[cat] // Mặc định là true nên khi undefined đổi thành false
    }));
  };

  useEffect(() => {
    fetchServices();
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

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/services');
      const json = await res.json();
      if (Array.isArray(json)) setServices(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (ids: string[], file: File) => {
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    const representId = ids[0];
    setUploadingId(representId);
    setSuccessId(null);

    try {
      // 1. Upload file trực tiếp lên Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `services/${fileName}`;

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
          title: `Service Media - ${file.name}`,
          type: type,
          url: publicUrl,
          source: 'supabase',
        }),
      });
      fetchMediaLibrary(); // Refresh library

      // 3. Update all services in group
      const updatePromises = ids.map(id => fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_url: publicUrl, media_type: type }),
      }));

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        setSuccessId(representId);
        setTimeout(() => setSuccessId(null), 3000);
        fetchServices();
      } else {
        alert('Lỗi cập nhật một số dịch vụ!');
      }
    } catch {
      alert('Lỗi hệ thống');
    } finally {
      setUploadingId(null);
    }
  };
  const handleSelectMedia = async (ids: string[], mediaUrl: string, mediaType: string) => {
    const representId = ids[0];
    setUploadingId(representId);
    setSuccessId(null);
    try {
      const updatePromises = ids.map(id => fetch(`/api/admin/services/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ media_url: mediaUrl, media_type: mediaType }),
      }));

      const results = await Promise.all(updatePromises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        setSuccessId(representId);
        setTimeout(() => setSuccessId(null), 3000);
        fetchServices();
      } else {
        alert('Lỗi cập nhật một số dịch vụ');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">💆 Quản Lý Ảnh / Video Dịch Vụ</h1>
        <p className="text-admin-text-dim mt-2">Tải lên hình ảnh hoặc video giới thiệu cho từng dịch vụ spa.</p>
      </div>

      {/* Hướng dẫn */}
      <div className="mb-8 bg-admin-panel border border-admin-line rounded-2xl p-5 shadow-[var(--shadow)]">
        <p className="text-sm text-admin-text-dim">
          👉 Nhấn nút <strong className="text-admin-text">"Chọn ảnh/video"</strong> bên dưới mỗi dịch vụ để tải file lên.
          File sẽ tự động lưu và hiển thị trên website.
        </p>
      </div>

      {/* Services Grid */}
      <div className="space-y-12">
        {loading ? (
          <p className="text-admin-text-dim text-center py-8">⏳ Đang tải danh sách dịch vụ...</p>
        ) : services.length === 0 ? (
          <p className="text-admin-text-dim text-center py-8">Chưa có dịch vụ nào trong hệ thống.</p>
        ) : (
          Object.entries(
            services.reduce((acc: any, service) => {
              const cat = service.cat || 'Khác';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(service);
              return acc;
            }, {})
          ).map(([category, items]: [string, any]) => {
            const isExpanded = expandedCats[category] !== false; // Mặc định mở
            return (
            <div key={category} className="space-y-4 bg-admin-panel p-4 rounded-2xl border border-admin-line shadow-sm">
              <button 
                onClick={() => toggleCat(category)}
                className="w-full flex items-center justify-between text-lg font-bold text-admin-gold hover:opacity-80 transition-opacity"
              >
                <span>{category} <span className="text-admin-text-dim text-sm font-normal ml-2">({items.length} dịch vụ)</span></span>
                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
              </button>
              
              {isExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4 border-t border-admin-line-strong">
                {Object.values(
                  items.reduce((acc: any, service: any) => {
                    const baseNameEn = service.names?.en?.trim().toLowerCase() || service.id;
                    if (!acc[baseNameEn]) acc[baseNameEn] = [];
                    acc[baseNameEn].push(service);
                    return acc;
                  }, {})
                ).map((group: any) => {
                  const service = group[0];
                  const allIds = group.map((s: any) => s.id);
                  const isMultiple = group.length > 1;
                  return (
            <div
              key={service.id}
              className={`
                bg-admin-panel border rounded-2xl overflow-hidden flex flex-col shadow-[var(--shadow)]
                transition-all duration-300
                ${successId === service.id ? 'border-admin-green ring-1 ring-admin-green-a' : 'border-admin-line-strong hover:border-admin-gold hover:-translate-y-1'}
              `}
            >
              {/* Media Preview */}
              <div className="relative w-full aspect-video bg-admin-panel-2 flex items-center justify-center border-b border-admin-line-strong">
                {service.media_url ? (
                  service.media_type === 'video' ? (
                    <video src={service.media_url} controls className="w-full h-full object-cover" />
                  ) : (
                    <img src={service.media_url} alt="" className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-center text-admin-text-faint">
                    <ImageIcon size={32} className="mx-auto mb-2" />
                    <p className="text-xs">Chưa có ảnh/video</p>
                  </div>
                )}

                {/* Success Badge */}
                {successId === service.id && (
                  <div className="absolute top-3 right-3 bg-admin-green text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 animate-bounce">
                    <CheckCircle size={14} /> Đã lưu!
                  </div>
                )}

                {/* Uploading Overlay */}
                {uploadingId === service.id && (
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
                <div className="mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-admin-gold-dim text-admin-gold px-2 py-0.5 rounded-full border border-admin-gold/20">
                    {service.cat}
                  </span>
                </div>
                <h3 className="text-base font-bold text-admin-text mb-0.5">{service.names?.vi || service.id}</h3>
                <p className="text-xs text-admin-text-dim mb-2">{service.names?.en || ''}</p>
                {isMultiple && (
                  <p className="text-[11px] text-admin-gold font-medium mb-4">
                    ✨ Cập nhật ảnh/video sẽ áp dụng cho {group.length} dịch vụ
                  </p>
                )}

                {/* Action Buttons: Select & Upload */}
                <div className="mt-auto space-y-2">
                  {/* Select Existing Media */}
                  <div className="relative">
                    <select
                      className="w-full appearance-none bg-admin-panel border border-admin-line-strong text-admin-text-dim text-sm rounded-xl px-3 py-2.5 outline-none focus:border-admin-gold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={uploadingId === service.id}
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const selectedMedia = mediaLibrary.find(m => m.url === e.target.value);
                        if (selectedMedia) {
                          handleSelectMedia(allIds, selectedMedia.url, selectedMedia.type);
                        }
                      }}
                      value={service.media_url || ''}
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
                    ${uploadingId === service.id
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
                      disabled={uploadingId === service.id}
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload(allIds, file);
                        e.target.value = '';
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>
          )})}
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

export default ServicesAdminPage;
