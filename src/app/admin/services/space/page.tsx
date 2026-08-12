'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const spaceStructure = [
  { id: 'hero', title: 'Hero Section', keys: ['hero'] },
  { id: 'welcome', title: '01 / Welcome Area', keys: ['welcome.reception', 'welcome.lounge', 'welcome.ritual'] },
  { id: 'floor1', title: '02 / First Floor', keys: ['floor1.body', 'floor1.foot', 'floor1.private'] },
  { id: 'floor2', title: '03 / Second Floor', keys: ['floor2.suite', 'floor2.headSpa', 'floor2.quiet'] },
  { id: 'gallery', title: 'Gallery Details', keys: ['gallery.main', 'gallery.sideTop', 'gallery.sideBottom'] },
  { id: 'cta', title: 'Call To Action', keys: ['cta'] }
];

const SpaceAdminPage = () => {
  const [contentData, setContentData] = useState<any>({});
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
        setContentData(json.data.space_media || {});
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
        body: JSON.stringify({ space_media: newMediaData }),
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

  const setNestedValue = (obj: any, path: string, value: any) => {
    const parts = path.split('.');
    const newObj = { ...obj };
    let current = newObj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) current[parts[i]] = {};
      current[parts[i]] = { ...current[parts[i]] };
      current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
    return newObj;
  };

  const getNestedValue = (obj: any, path: string) => {
    const parts = path.split('.');
    let val = obj;
    for (const p of parts) {
      if (!val) break;
      val = val[p];
    }
    return val;
  };

  const handleFileUpload = async (keyPath: string, file: File) => {
    const isVideo = file.type.startsWith('video/');
    const type = isVideo ? 'video' : 'image';

    setUploadingId(keyPath);
    setSuccessId(null);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `space/${fileName}`;

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

      await fetch('/api/admin/media-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `Space - ${file.name}`,
          type: type,
          url: publicUrl,
          source: 'supabase',
        }),
      });
      fetchMediaLibrary();

      const newMediaData = setNestedValue(contentData, keyPath, { type, src: publicUrl });
      
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

  const handleSelectMedia = async (keyPath: string, mediaUrl: string, mediaType: string) => {
    setUploadingId(keyPath);
    setSuccessId(null);
    try {
      const newMediaData = setNestedValue(contentData, keyPath, { type: mediaType, src: mediaUrl });
      setContentData(newMediaData);
      await saveContent(newMediaData);
      setSuccessId(keyPath);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi hệ thống');
    } finally {
      setUploadingId(null);
    }
  };

  const RenderMediaCard = ({ keyPath }: { keyPath: string }) => {
    const currentMedia = getNestedValue(contentData, keyPath);
    
    return (
      <div
        key={keyPath}
        className={`
          bg-admin-panel border rounded-2xl overflow-hidden flex flex-col shadow-[var(--shadow)]
          transition-all duration-300
          ${successId === keyPath ? 'border-admin-green ring-1 ring-admin-green-a' : 'border-admin-line-strong hover:border-admin-gold hover:-translate-y-1'}
        `}
      >
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
              <p className="text-xs">Chưa cấu hình (dùng mặc định)</p>
            </div>
          )}

          {successId === keyPath && (
            <div className="absolute top-3 right-3 bg-admin-green text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 animate-bounce">
              <CheckCircle size={14} /> Đã lưu!
            </div>
          )}

          {uploadingId === keyPath && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-admin-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-admin-gold font-medium">Đang tải lên...</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-bold text-admin-text mb-4 uppercase tracking-wider text-[11px]">{keyPath.replace('.', ' / ')}</h3>

          <div className="mt-auto space-y-2">
            <div className="relative">
              <select
                className="w-full appearance-none bg-admin-panel border border-admin-line-strong text-admin-text-dim text-sm rounded-xl px-3 py-2.5 outline-none focus:border-admin-gold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={uploadingId === keyPath}
                onChange={(e) => {
                  if (!e.target.value) return;
                  const selectedMedia = mediaLibrary.find(m => m.url === e.target.value);
                  if (selectedMedia) handleSelectMedia(keyPath, selectedMedia.url, selectedMedia.type);
                }}
                value={currentMedia?.src || ''}
              >
                <option value="">-- Chọn ảnh/video có sẵn --</option>
                {mediaLibrary.map(media => (
                  <option key={media.id} value={media.url}>
                    {media.type === 'video' ? '🎬' : '🖼️'} {media.title}
                  </option>
                ))}
              </select>
            </div>

            <label className={`
              flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer
              font-semibold text-[13.5px] transition-all duration-200 border border-admin-line-strong
              ${uploadingId === keyPath
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
                disabled={uploadingId === keyPath}
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(keyPath, file);
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
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">✨ Quản Lý Media: Space Experience</h1>
        <p className="text-admin-text-dim mt-2">Cấu hình hình ảnh và video cho từng góc không gian của Spa.</p>
      </div>

      <div className="space-y-12">
        {loading ? (
          <p className="text-admin-text-dim text-center py-8">⏳ Đang tải dữ liệu...</p>
        ) : (
          spaceStructure.map((section) => {
            const isExpanded = expandedCats[section.id] !== false;
            return (
              <div key={section.id} className="space-y-4 bg-admin-panel p-4 rounded-2xl border border-admin-line shadow-sm">
                <button 
                  onClick={() => toggleCat(section.id)}
                  className="w-full flex items-center justify-between text-lg font-bold text-admin-gold hover:opacity-80 transition-opacity"
                >
                  <span>{section.title}</span>
                  {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4 border-t border-admin-line-strong">
                    {section.keys.map((keyPath) => (
                      <RenderMediaCard key={keyPath} keyPath={keyPath} />
                    ))}
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

export default SpaceAdminPage;
