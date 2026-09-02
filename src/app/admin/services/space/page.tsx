'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight, Crop } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import FocalPointEditor from '@/components/Admin/FocalPointEditor';

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

  const processGoogleDriveLink = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?id=${match[1]}`;
    }
    return url;
  };

  const handleLinkInput = async (keyPath: string) => {
    const url = window.prompt('Nhập đường link (URL) ảnh/video:');
    if (!url || !url.trim()) return;
    
    const finalUrl = processGoogleDriveLink(url.trim());
    
    let isVideo = !!url.match(/\.(mp4|mov|webm)$/i);
    if (!isVideo && url.includes('drive.google.com')) {
      isVideo = window.confirm('Link Google Drive này là VIDEO phải không?\n(Nhấn OK nếu là Video, Cancel nếu là Hình ảnh)');
    }
    const type = isVideo ? 'video' : 'image';
    
    setUploadingId(keyPath);
    setSuccessId(null);
    try {
      const newMediaData = setNestedValue(contentData, keyPath, { type, src: finalUrl });
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
    const serverObjPos = currentMedia?.objectPosition || 'center';
    const [localObjPos, setLocalObjPos] = useState(serverObjPos);
    const [isFocalEditorOpen, setIsFocalEditorOpen] = useState(false);

    useEffect(() => {
      setLocalObjPos(currentMedia?.objectPosition || 'center');
    }, [currentMedia?.objectPosition]);

    const objPos = localObjPos;

    const savePos = async (newPos: string) => {
      if (newPos === serverObjPos) {
        setIsFocalEditorOpen(false);
        return;
      }
      setLocalObjPos(newPos);
      setIsFocalEditorOpen(false);
      setUploadingId(keyPath);
      try {
        const updatedMedia = { ...(currentMedia || { type: 'image', src: '' }), objectPosition: newPos };
        const newMediaData = setNestedValue(contentData, keyPath, updatedMedia);
        setContentData(newMediaData);
        await saveContent(newMediaData);
        setSuccessId(keyPath);
        setTimeout(() => setSuccessId(null), 3000);
      } catch (err) {
        console.error(err);
      } finally {
        setUploadingId(null);
      }
    };
    
    return (
      <div
        key={keyPath}
        className={`
          bg-admin-panel border rounded-2xl overflow-hidden flex flex-col shadow-[var(--shadow)]
          transition-all duration-300
          ${successId === keyPath ? 'border-admin-green ring-1 ring-admin-green-a' : 'border-admin-line-strong hover:border-admin-gold hover:-translate-y-1'}
        `}
      >
        <div className="relative w-full aspect-video bg-admin-panel-2 flex items-center justify-center border-b border-admin-line-strong group">
          {currentMedia?.src ? (
            <>
              {currentMedia.type === 'video' ? (
                <video src={currentMedia.src} controls className="w-full h-full object-cover" style={{ objectPosition: objPos }} />
              ) : (
                <img src={currentMedia.src} alt="" className="w-full h-full object-cover" style={{ objectPosition: objPos }} />
              )}
              <button
                onClick={() => setIsFocalEditorOpen(true)}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 hover:bg-admin-gold hover:text-[#241804] transition-all z-10 shadow-lg"
                title="Điều chỉnh vùng hiển thị"
              >
                <Crop size={16} />
              </button>
            </>
          ) : (
            <div className="text-center text-admin-text-faint">
              <ImageIcon size={32} className="mx-auto mb-2" />
              <p className="text-xs">Chưa cấu hình (dùng mặc định)</p>
            </div>
          )}

          {successId === keyPath && (
            <div className="absolute top-3 left-3 bg-admin-green text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 animate-bounce z-10">
              <CheckCircle size={14} /> Đã lưu!
            </div>
          )}

          {uploadingId === keyPath && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-admin-gold border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-admin-gold font-medium">Đang lưu...</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-base font-bold text-admin-text mb-2 uppercase tracking-wider text-[11px]">{keyPath.replace('.', ' / ')}</h3>
          
          <div className="mb-4">
            <label className="text-[11px] text-admin-text-faint uppercase tracking-wider mb-1 block">Tên hiển thị trên Web</label>
            <input
              type="text"
              placeholder="VD: Lễ tân, Sảnh chờ..."
              defaultValue={currentMedia?.title || ''}
              onBlur={async (e) => {
                const newTitle = e.target.value;
                if (newTitle === (currentMedia?.title || '')) return;
                setUploadingId(keyPath);
                try {
                  const updatedMedia = { ...(currentMedia || { type: 'image', src: '' }), title: newTitle };
                  const newMediaData = setNestedValue(contentData, keyPath, updatedMedia);
                  setContentData(newMediaData);
                  await saveContent(newMediaData);
                  setSuccessId(keyPath);
                  setTimeout(() => setSuccessId(null), 3000);
                } catch (err) {
                  console.error(err);
                } finally {
                  setUploadingId(null);
                }
              }}
              className="w-full bg-admin-panel-2 border border-admin-line-strong text-admin-text text-sm rounded-lg px-3 py-2 outline-none focus:border-admin-gold transition-colors"
            />
          </div>

          {isFocalEditorOpen && currentMedia?.src && (
            <FocalPointEditor
              src={currentMedia.src}
              mediaType={currentMedia.type || 'image'}
              aspectRatio={16/9}
              initialPosition={objPos}
              onSave={savePos}
              onClose={() => setIsFocalEditorOpen(false)}
            />
          )}

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

            <div className="flex gap-2">
              <label className={`
                flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl cursor-pointer
                font-semibold text-[13.5px] transition-all duration-200 border border-admin-line-strong
                ${uploadingId === keyPath
                  ? 'bg-admin-line text-admin-text-faint cursor-wait'
                  : 'bg-transparent hover:border-admin-gold hover:bg-admin-gold-dim text-admin-text-dim hover:text-admin-gold'
                }
              `}>
                <Upload size={16} />
                Tải lên
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
              
              <button
                onClick={() => handleLinkInput(keyPath)}
                disabled={uploadingId === keyPath}
                className="flex items-center justify-center gap-1.5 px-3 rounded-xl border border-admin-line-strong bg-admin-panel-2 text-admin-text-dim hover:border-admin-gold hover:text-admin-gold font-semibold text-[13.5px] transition-colors shadow-sm disabled:opacity-50"
                title="Nhập link trực tiếp"
              >
                🔗 Link
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getSectionKeys = (sectionId: string, defaultKeys: string[]) => {
    if (sectionId === 'hero' || sectionId === 'cta') return defaultKeys;
    const customData = contentData[sectionId];
    if (customData && typeof customData === 'object' && Object.keys(customData).length > 0) {
      return Object.keys(customData).map(k => `${sectionId}.${k}`);
    }
    return defaultKeys;
  };

  const handleAddMedia = async (sectionId: string) => {
    const newKey = window.prompt('Nhập mã hiển thị ngắn gọn (VD: vip_room, massage_2):');
    if (!newKey || !/^[a-zA-Z0-9_]+$/.test(newKey)) {
      alert('Mã không hợp lệ! Vui lòng chỉ dùng chữ cái, số và dấu gạch dưới.');
      return;
    }
    
    const keyPath = `${sectionId}.${newKey}`;
    if (getNestedValue(contentData, keyPath)) {
      alert('Mã này đã tồn tại!');
      return;
    }
    
    const newMediaData = setNestedValue(contentData, keyPath, { type: 'image', src: '', title: newKey });
    setContentData(newMediaData);
    await saveContent(newMediaData);
  };

  const handleRemoveMedia = async (keyPath: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa [${keyPath}] không? Hành động này không thể hoàn tác.`)) return;
    
    const parts = keyPath.split('.');
    const sectionId = parts[0];
    const itemKey = parts[1];
    
    const newMediaData = { ...contentData };
    if (newMediaData[sectionId] && newMediaData[sectionId][itemKey]) {
      delete newMediaData[sectionId][itemKey];
    }
    
    setContentData(newMediaData);
    await saveContent(newMediaData);
  };

  return (
    <div className="p-6 lg:p-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">✨ Quản Lý Media: Space Experience</h1>
        <p className="text-admin-text-dim mt-2">Cấu hình hình ảnh và video cho từng góc không gian của Spa. Bạn có thể thêm không giới hạn media cho từng khu vực.</p>
      </div>

      <div className="space-y-12">
        {loading ? (
          <p className="text-admin-text-dim text-center py-8">⏳ Đang tải dữ liệu...</p>
        ) : (
          spaceStructure.map((section) => {
            const isExpanded = expandedCats[section.id] !== false;
            const currentKeys = getSectionKeys(section.id, section.keys);
            const isDynamic = !['hero', 'cta'].includes(section.id);
            
            return (
              <div key={section.id} className="space-y-4 bg-admin-panel p-4 rounded-2xl border border-admin-line shadow-sm">
                <div className="flex items-center justify-between">
                  <button 
                    onClick={() => toggleCat(section.id)}
                    className="flex-1 flex items-center gap-2 text-lg font-bold text-admin-gold hover:opacity-80 transition-opacity text-left"
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                    <span>{section.title}</span>
                  </button>
                  {isDynamic && isExpanded && (
                    <button 
                      onClick={() => handleAddMedia(section.id)}
                      className="px-4 py-2 bg-admin-gold text-admin-background text-sm font-bold rounded-lg hover:brightness-110 transition-all"
                    >
                      + Thêm Video / Ảnh
                    </button>
                  )}
                </div>
                
                {isExpanded && (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pt-4 border-t border-admin-line-strong">
                    {currentKeys.map((keyPath) => (
                      <div key={keyPath} className="relative group">
                        <RenderMediaCard keyPath={keyPath} />
                        {isDynamic && currentKeys.length > 1 && (
                          <button 
                            onClick={() => handleRemoveMedia(keyPath)}
                            className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 font-bold"
                            title="Xóa mục này"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    ))}
                    {currentKeys.length === 0 && (
                      <p className="text-admin-text-dim text-sm italic col-span-full">Chưa có dữ liệu nào. Hãy bấm "Thêm Video / Ảnh" để tạo mới.</p>
                    )}
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
