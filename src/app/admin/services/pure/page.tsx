'use client';

import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Upload, CheckCircle, ChevronDown, ChevronRight, X, Plus, Save, Crop } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getPureRelaxationSections } from '@/components/PureRelaxation/pureRelaxationData';
import { PURE_RELAXATION_DEFAULTS } from '@/components/PureRelaxation/pureRelaxationDefaults';
import FocalPointEditor from '@/components/Admin/FocalPointEditor';

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

const LANGUAGES = [
  { id: 'vi', label: 'VI' },
  { id: 'en', label: 'EN' },
  { id: 'cn', label: 'CN' },
  { id: 'jp', label: 'JP' },
  { id: 'kr', label: 'KR' },
];

const processGoogleDriveLink = (url: string) => {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?id=${match[1]}`;
    }
    return url;
  };

const ServiceEditCard = ({
service,
contentData,
localTextOverrides,
uploadingId,
successId,
handleTextChange,
saveTextChanges,
handleFileUpload,
setContentData,
saveContent,
setSuccessId
}: any) => {
  const [activeLang, setActiveLang] = useState('vi');
  const [isFocalEditorOpen, setIsFocalEditorOpen] = useState(false);
  const serviceName = service.name;
  const isUploading = uploadingId === serviceName;
  const isSuccessMedia = successId === serviceName;
  const isSuccessText = successId === `${serviceName}-text`;

  const cData = localTextOverrides[serviceName] !== undefined 
    ? localTextOverrides[serviceName] 
    : (contentData[serviceName] || {});

  const mediaType = cData.type || service.media?.type || 'image';
  const mediaSrc = cData.src || service.media?.src;
  const objPos = cData.objectPosition || 'center';

  const langData = cData[activeLang] || {};

  const desc = langData.description !== undefined ? langData.description : '';
  const privTitle = langData.privilege?.title !== undefined ? langData.privilege.title : '';
  const privCopy = langData.privilege?.copy !== undefined ? langData.privilege.copy : '';
  const privTime = langData.privilege?.time !== undefined ? langData.privilege.time : '';

  const hasChanges = !!localTextOverrides[serviceName];

  const handleServiceLink = async () => {
    const url = window.prompt('Nhập đường link (URL) ảnh hoặc video:');
    if (!url || !url.trim()) return;
    
    const finalUrl = processGoogleDriveLink(url.trim());
    
    let isVideo = !!url.match(/\.(mp4|mov|webm)$/i);
    if (!isVideo && url.includes('drive.google.com')) {
      isVideo = window.confirm('Link Google Drive này là VIDEO phải không?\n(Nhấn OK nếu là Video, Cancel nếu là Hình ảnh)');
    }
    const type = isVideo ? 'video' : 'image';
    
    let newMediaData = { ...contentData };
    const existing = newMediaData[serviceName] || {};
    newMediaData[serviceName] = { ...existing, type, src: finalUrl };
    
    setContentData(newMediaData);
    await saveContent(newMediaData);
    setSuccessId(serviceName);
    setTimeout(() => setSuccessId(null), 3000);
  };

  const savePos = async (newPos: string) => {
    setIsFocalEditorOpen(false);
    let newMediaData = { ...contentData };
    const existing = newMediaData[serviceName] || {};
    newMediaData[serviceName] = { ...existing, objectPosition: newPos };
    
    setContentData(newMediaData);
    await saveContent(newMediaData);
    setSuccessId(serviceName);
    setTimeout(() => setSuccessId(null), 3000);
  };

  return (
    <div className="bg-admin-bg p-4 rounded-xl border border-admin-line flex flex-col gap-4">
      <h4 className="font-bold text-admin-text border-b border-admin-line pb-2">{serviceName}</h4>
      
      {/* Media Upload */}
      <div className="relative overflow-hidden group rounded-xl border border-admin-line-strong">
        {mediaSrc ? (
          <div className="w-full h-40 relative bg-black/5 flex items-center justify-center group/preview">
            {mediaType === 'video' ? (
              <video src={mediaSrc} className="w-full h-full object-cover" style={{ objectPosition: objPos }} autoPlay muted loop playsInline />
            ) : (
              <img src={mediaSrc} alt={serviceName} className="w-full h-full object-cover" style={{ objectPosition: objPos }} />
            )}
            
            <button
              onClick={() => setIsFocalEditorOpen(true)}
              className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 opacity-0 group-hover/preview:opacity-100 hover:bg-admin-gold hover:text-[#241804] transition-all z-10 shadow-lg"
              title="Điều chỉnh vùng hiển thị"
            >
              <Crop size={16} />
            </button>

            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-[10px] text-white font-medium flex items-center gap-1 backdrop-blur-md">
              {mediaType === 'video' ? <Video size={12} /> : <ImageIcon size={12} />}
              {mediaType === 'video' ? 'VIDEO' : 'IMAGE'}
            </div>
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 items-center justify-center pointer-events-none group-hover:pointer-events-auto">
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
              <button
                onClick={handleServiceLink}
                className="bg-admin-panel text-admin-text px-4 py-2 rounded-lg text-xs font-bold hover:bg-admin-line transition-colors shadow-lg"
              >
                🔗 Dán link
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full h-40 bg-admin-panel-2 border border-admin-line border-dashed rounded-lg flex flex-col items-center justify-center text-admin-text-faint gap-3 transition-colors hover:border-admin-gold hover:bg-admin-panel">
            <Upload size={24} className="opacity-50" />
            <div className="flex gap-2">
              <label className="cursor-pointer bg-admin-panel text-admin-text border border-admin-line px-3 py-1.5 rounded-md text-xs hover:bg-admin-line transition-colors">
                Tải lên
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
              <button onClick={handleServiceLink} className="bg-admin-panel text-admin-text border border-admin-line px-3 py-1.5 rounded-md text-xs hover:bg-admin-line transition-colors">
                Dán link
              </button>
            </div>
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

      {isFocalEditorOpen && mediaSrc && (
        <FocalPointEditor
          src={mediaSrc}
          mediaType={mediaType as 'image'|'video'}
          aspectRatio={0.75} 
          initialPosition={objPos}
          onSave={savePos}
          onClose={() => setIsFocalEditorOpen(false)}
        />
      )}

      {/* Text Fields */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-1 border-b border-admin-line pb-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`px-3 py-1 rounded-md text-[10px] font-bold transition-colors ${activeLang === lang.id ? 'bg-admin-gold text-[#241804]' : 'bg-admin-panel text-admin-text-dim hover:text-admin-gold'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Mô tả dịch vụ ({activeLang})</label>
          <textarea 
            className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[60px]"
            value={desc}
            onChange={(e) => handleTextChange(serviceName, activeLang, 'description', e.target.value)}
            placeholder={`Mô tả (${activeLang.toUpperCase()})...`}
          />
        </div>

        <div className="border-t border-admin-line pt-2 mt-1">
          <label className="text-[10px] uppercase font-bold text-admin-gold mb-2 block">Đặc Quyền (Privilege) - {activeLang}</label>
          <div className="space-y-2">
            <input 
              type="text"
              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
              value={privTitle}
              onChange={(e) => handleTextChange(serviceName, activeLang, 'privilege', e.target.value, 'title')}
              placeholder="Tiêu đề đặc quyền..."
            />
            <textarea 
              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[50px]"
              value={privCopy}
              onChange={(e) => handleTextChange(serviceName, activeLang, 'privilege', e.target.value, 'copy')}
              placeholder="Mô tả đặc quyền..."
            />
            <input 
              type="text"
              className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
              value={privTime}
              onChange={(e) => handleTextChange(serviceName, activeLang, 'privilege', e.target.value, 'time')}
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

const PureAdminPage = () => {
  const [contentData, setContentData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({ slideshow: true, narratives: true, categories: true });

  const [localTextOverrides, setLocalTextOverrides] = useState<any>({});
  const [localNarrativeOverrides, setLocalNarrativeOverrides] = useState<any>({});

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


  const handleLinkInputArray = async (keyPath: string) => {
    const url = window.prompt('Nhập đường link (URL) ảnh:');
    if (!url || !url.trim()) return;
    
    const finalUrl = processGoogleDriveLink(url.trim());
    
    let newMediaData = { ...contentData };
    const arr = newMediaData[keyPath] || defaultBgImages;
    newMediaData[keyPath] = [...arr, finalUrl];
    
    setContentData(newMediaData);
    await saveContent(newMediaData);
  };

  // --- SERVICE EDITING ---
  const handleTextChange = (serviceName: string, lang: string, field: string, value: string, subField?: string) => {
    setLocalTextOverrides((prev: any) => {
      const s = prev[serviceName] || contentData[serviceName] || {};
      const newS = { ...s };
      newS[lang] = newS[lang] || {};

      if (subField) {
        newS[lang][field] = { ...(newS[lang][field] || {}), [subField]: value };
      } else {
        newS[lang][field] = value;
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



  // --- NARRATIVE EDITING ---
  const handleNarrativeChange = (sectionId: string, lang: string, field: string, value: any) => {
    setLocalNarrativeOverrides((prev: any) => {
      const existingNarratives = contentData.narratives || {};
      const s = prev[sectionId] || existingNarratives[sectionId] || {};
      const newS = { ...s };
      newS[lang] = newS[lang] || {};
      newS[lang][field] = value;
      return { ...prev, [sectionId]: newS };
    });
  };

  const saveNarrativeChanges = async (sectionId: string) => {
    if (!localNarrativeOverrides[sectionId]) return;
    const existingNarratives = contentData.narratives || {};
    const newMediaData = {
      ...contentData,
      narratives: {
        ...existingNarratives,
        [sectionId]: {
          ...(existingNarratives[sectionId] || {}),
          ...localNarrativeOverrides[sectionId]
        }
      }
    };
    setContentData(newMediaData);
    setSuccessId(`narrative-${sectionId}`);
    await saveContent(newMediaData);
    setTimeout(() => setSuccessId(null), 3000);
  };

  const NarrativeEditCard = ({
  section,
  contentData,
  localNarrativeOverrides,
  successId,
  handleNarrativeChange,
  saveNarrativeChanges
}: any) => {
    const [activeLang, setActiveLang] = useState('vi');
    const sectionId = section.id;
    const isSuccessText = successId === `narrative-${sectionId}`;

    const existingNarratives = contentData.narratives || {};
    const nData = localNarrativeOverrides[sectionId] !== undefined 
      ? localNarrativeOverrides[sectionId] 
      : (existingNarratives[sectionId] || {});

    const langData = nData[activeLang] || {};
    const defaults = PURE_RELAXATION_DEFAULTS[sectionId]?.[activeLang] || {};
    const hasChanges = !!localNarrativeOverrides[sectionId];

    const getValue = (field: string) => {
      return langData[field] !== undefined ? langData[field] : (defaults[field] || '');
    };

    const isVip = sectionId === 'vip-package';

    return (
      <div className="bg-admin-bg p-5 rounded-xl border border-admin-line flex flex-col gap-4">
        <div className="flex gap-1 border-b border-admin-line pb-3">
          {LANGUAGES.map(lang => (
            <button
              key={lang.id}
              onClick={() => setActiveLang(lang.id)}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${activeLang === lang.id ? 'bg-admin-gold text-[#241804]' : 'bg-admin-panel text-admin-text-dim hover:text-admin-gold'}`}
            >
              {lang.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 space-y-3">
            {!isVip && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Eyebrow (Tiêu đề nhỏ)</label>
                  <input 
                    className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                    value={getValue('eyebrow')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'eyebrow', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Quote (Trích dẫn)</label>
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[50px]"
                    value={getValue('quote')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'quote', e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Headline (Tiêu đề chính)</label>
              <input 
                className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none"
                value={getValue('headline')}
                onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'headline', e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Lead (Đoạn mở đầu)</label>
              <textarea 
                className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[60px]"
                value={getValue('lead')}
                onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'lead', e.target.value)}
              />
            </div>

            {!isVip && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Body 1</label>
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[60px]"
                    value={getValue('body1')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'body1', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Body 2</label>
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[60px]"
                    value={getValue('body2')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'body2', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Body 3</label>
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[60px]"
                    value={getValue('body3')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'body3', e.target.value)}
                  />
                </div>
              </>
            )}

            {isVip && (
              <>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-text-dim mb-1 block">Paragraphs (Nội dung đoạn văn - Tách bằng dấu Enter)</label>
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-line rounded-lg p-2 text-sm text-admin-text focus:border-admin-gold focus:outline-none min-h-[100px]"
                    value={Array.isArray(langData.paragraphs) ? langData.paragraphs.join('\n') : getValue('paragraphs')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'paragraphs', e.target.value.split('\n'))}
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-admin-gold mb-1 block">Special Text</label>
                  <textarea 
                    className="w-full bg-admin-panel border border-admin-gold/50 rounded-lg p-2 text-sm text-admin-gold focus:border-admin-gold focus:outline-none min-h-[60px]"
                    value={getValue('specialText')}
                    onChange={(e) => handleNarrativeChange(sectionId, activeLang, 'specialText', e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          
          <div className="w-full xl:w-[280px] shrink-0">
             <div className="bg-[#f5f1ea] text-[#241804] p-5 rounded-xl border border-admin-line shadow-inner text-[10px] font-sans sticky top-6">
                <div className="text-center font-bold mb-4 border-b border-[#241804]/10 pb-2 uppercase tracking-widest text-[#a67433]">
                   Vị trí trên Template
                </div>
                {!isVip ? (
                  <div className="space-y-2 text-center">
                    <div className="text-[#a67433] tracking-widest uppercase font-bold text-[8px] border border-dashed border-[#a67433] p-1 bg-[#a67433]/10">[Eyebrow]</div>
                    <div className="text-xl font-serif border border-dashed border-gray-400 p-1 bg-white">[Headline]</div>
                    <div className="font-medium text-[10px] leading-relaxed border border-dashed border-gray-400 p-1 bg-white">[Lead]</div>
                    <div className="italic border-l-2 border-[#a67433] pl-2 text-left text-[10px] bg-white p-1 border-dashed border border-gray-400">[Quote]</div>
                    <div className="text-left text-gray-500 border border-dashed border-gray-400 p-1 bg-white">[Body 1]</div>
                    <div className="text-left text-gray-500 border border-dashed border-gray-400 p-1 bg-white">[Body 2]</div>
                    <div className="text-left text-gray-500 border border-dashed border-gray-400 p-1 bg-white">[Body 3]</div>
                  </div>
                ) : (
                  <div className="space-y-3 text-center">
                    <div className="text-xl font-serif border border-dashed border-gray-400 p-1 bg-white text-[#241804]">[Headline]</div>
                    <div className="font-medium text-[10px] leading-relaxed border border-dashed border-gray-400 p-1 bg-white">[Lead]</div>
                    <div className="text-left text-gray-500 border border-dashed border-gray-400 p-2 bg-white flex flex-col gap-1.5">
                       <div>[Paragraphs - dòng 1]</div>
                       <div>[Paragraphs - dòng 2]</div>
                       <div>[Paragraphs - dòng 3]</div>
                    </div>
                    <div className="text-[#a67433] italic text-lg font-serif border border-dashed border-[#a67433] p-2 bg-[#a67433]/10">[Special Text]</div>
                  </div>
                )}
             </div>
          </div>
        </div>

        <button 
          onClick={() => saveNarrativeChanges(sectionId)}
          disabled={!hasChanges}
          className={`mt-2 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold transition-colors ${hasChanges ? 'bg-admin-gold text-[#241804] hover:bg-[#a67433]' : 'bg-admin-line text-admin-text-dim cursor-not-allowed'}`}
        >
          {isSuccessText ? <CheckCircle size={16} /> : <Save size={16} />}
          {isSuccessText ? 'Đã lưu' : 'Lưu Narrative'}
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
        <p className="text-admin-text-dim mt-2">Cấu hình nội dung đa ngôn ngữ: slideshow ảnh nền, bài viết giới thiệu (narrative) và ảnh/video các danh mục.</p>
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
                
                <div className="flex flex-col gap-2">
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
                  <button
                    onClick={() => handleLinkInputArray('slideshow')}
                    className="w-full bg-admin-panel border border-admin-line text-admin-text py-2 rounded-lg text-xs font-bold hover:bg-admin-line transition-colors shadow-sm"
                  >
                    🔗 Hoặc nhập link
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Category Management (Narratives + Services) */}
        <div className="bg-admin-panel border border-admin-line rounded-2xl overflow-hidden shadow-sm">
          <button 
            onClick={() => toggleCat('categories')}
            className="w-full px-6 py-4 flex items-center justify-between bg-admin-panel hover:bg-admin-bg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-admin-gold/20 text-admin-gold text-xs font-bold">2</span>
              <h2 className="text-lg font-bold text-admin-text">Tùy chỉnh Bài viết Danh mục & Các Dịch vụ</h2>
            </div>
            {expandedCats['categories'] ? <ChevronDown size={20} className="text-admin-text-dim" /> : <ChevronRight size={20} className="text-admin-text-dim" />}
          </button>
          
          {expandedCats['categories'] && (
            <div className="p-6 pt-2 border-t border-admin-line-strong flex flex-col gap-10 bg-admin-panel/50">
              {sections.map(section => (
                <div key={section.id} className="border border-admin-line-strong rounded-2xl p-6 bg-admin-bg/50">
                  <h3 className="text-2xl font-bold text-admin-gold mb-6 flex items-center gap-3 border-b border-admin-line pb-4">
                    <img src={section.icon} className="w-8 h-8 filter invert opacity-80" alt="" />
                    {section.title}
                  </h3>

                  {/* 1. Category Narrative Editor */}
                  <div className="mb-8">
                    <h4 className="text-xs font-bold text-admin-text-dim mb-3 uppercase tracking-widest">I. Bài viết giới thiệu danh mục (Perspective)</h4>
                    <NarrativeEditCard 
                    section={section}
                    contentData={contentData}
                    localNarrativeOverrides={localNarrativeOverrides}
                    successId={successId}
                    handleNarrativeChange={handleNarrativeChange}
                    saveNarrativeChanges={saveNarrativeChanges}
                  />
                  </div>

                  {/* 2. Services Editor */}
                  <div>
                    <h4 className="text-xs font-bold text-admin-text-dim mb-3 uppercase tracking-widest">II. Các dịch vụ thuộc danh mục</h4>
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {section.services.map(service => {
                         const items = service.variants ? service.variants.map(v => ({...v, name: v.name, description: v.subtitle})) : [service];
                         return items.map((item, idx) => (
                           <ServiceEditCard key={`${service.name}-${idx}`} service={item} />
                         ));
                      })}
                    </div>
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
