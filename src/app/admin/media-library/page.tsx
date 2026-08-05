'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Image as ImageIcon, Video, Upload, Link as LinkIcon, Trash2, CheckCircle, Copy, FileVideo, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';

// 🔧 UI CONFIGURATION
const MAX_UPLOAD_SIZE_MB = 100;

export default function MediaLibraryAdmin() {
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'link'>('upload');
  
  // Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  
  // Link State
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkType, setLinkType] = useState<'image' | 'video'>('image');
  const [linkSource, setLinkSource] = useState<'external' | 'gdrive'>('gdrive');

  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/media-library');
      const json = await res.json();
      if (json.success) setMediaList(json.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
      alert(`File quá lớn! Tối đa ${MAX_UPLOAD_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (!uploadTitle) setUploadTitle(file.name);
  };

  const processGoogleDriveLink = (url: string) => {
    // Convert https://drive.google.com/file/d/ID/view to https://drive.google.com/uc?id=ID
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/uc?id=${match[1]}`;
    }
    return url;
  };

  const handleSubmit = async () => {
    if (activeTab === 'upload') {
      if (!selectedFile || !uploadTitle) {
        alert('Vui lòng chọn file và nhập tiêu đề');
        return;
      }

      setUploading(true);
      try {
        const isVideo = selectedFile.type.startsWith('video/');
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `marketing/${fileName}`;
        
        const supabase = createClient();
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('media-uploads')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });

        if (uploadError) {
          alert('Lỗi tải lên (Supabase): ' + uploadError.message);
          setUploading(false);
          return;
        }

        const { data: { publicUrl } } = supabase.storage.from('media-uploads').getPublicUrl(uploadData.path);

        
        // Save record
        const res = await fetch('/api/admin/media-library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadTitle,
            type: isVideo ? 'video' : 'image',
            url: publicUrl,
            source: 'supabase',
          }),
        });

        if (res.ok) {
          setSelectedFile(null);
          setPreviewUrl(null);
          setUploadTitle('');
          showSuccess('✅ Đã tải file lên thành công!');
          fetchMedia();
        }
      } catch {
        alert('Lỗi hệ thống');
      } finally {
        setUploading(false);
      }
    } else {
      // Link mode
      if (!linkUrl || !linkTitle) {
        alert('Vui lòng nhập link và tiêu đề');
        return;
      }
      
      let finalUrl = linkUrl;
      if (linkSource === 'gdrive') {
        finalUrl = processGoogleDriveLink(linkUrl);
      }

      setUploading(true);
      try {
        const res = await fetch('/api/admin/media-library', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: linkTitle,
            type: linkType,
            url: finalUrl,
            source: linkSource,
          }),
        });

        if (res.ok) {
          setLinkUrl('');
          setLinkTitle('');
          showSuccess('✅ Đã thêm link thành công!');
          fetchMedia();
        }
      } catch {
        alert('Lỗi hệ thống');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa vĩnh viễn mục này? (Sẽ xóa luôn file lưu trữ nếu có)')) return;
    
    try {
      await fetch(`/api/admin/media-library/${id}`, { method: 'DELETE' });
      showSuccess('🗑️ Đã xóa thành công.');
      fetchMedia();
    } catch {
      alert('Lỗi xóa file');
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess('📋 Đã copy link!');
  };

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">🖼️ Kho Media (Marketing)</h1>
        <p className="text-admin-text-dim mt-2">
          Quản lý tập trung toàn bộ hình ảnh, video của website. Tiết kiệm dung lượng bằng cách thêm link Google Drive.
        </p>
      </div>

      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-admin-green-a border border-admin-green-b text-admin-green text-sm font-semibold flex items-center gap-2">
          <CheckCircle size={18} /> {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lớp Trái: Thêm Mới */}
        <div className="lg:col-span-1">
          <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-[var(--shadow)] sticky top-20">
            <h2 className="text-lg font-bold text-admin-text mb-4">Thêm Media Mới</h2>
            
            {/* Tabs */}
            <div className="flex bg-admin-bg p-1 rounded-xl mb-6">
              <button 
                onClick={() => setActiveTab('upload')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-admin-panel text-admin-text shadow-sm' : 'text-admin-text-faint hover:text-admin-text-dim'}`}
              >
                <Upload size={16} /> Tải file
              </button>
              <button 
                onClick={() => setActiveTab('link')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'link' ? 'bg-admin-panel text-admin-text shadow-sm' : 'text-admin-text-faint hover:text-admin-text-dim'}`}
              >
                <LinkIcon size={16} /> Dùng Link
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    cursor-pointer border-2 border-dashed rounded-xl
                    flex flex-col items-center justify-center min-h-[160px]
                    transition-all duration-200 overflow-hidden
                    ${previewUrl ? 'border-admin-gold p-2' : 'border-admin-line-strong hover:border-admin-gold hover:bg-admin-gold-dim p-4'}
                  `}
                >
                  {previewUrl ? (
                    selectedFile?.type.startsWith('video') ? (
                      <video src={previewUrl} className="w-full h-32 object-cover rounded-lg" />
                    ) : (
                      <img src={previewUrl} className="w-full h-32 object-cover rounded-lg" />
                    )
                  ) : (
                    <>
                      <ImageIcon size={32} className="text-admin-text-faint mb-3" />
                      <p className="text-sm font-medium text-admin-text-dim">Nhấn để chọn file</p>
                      <p className="text-xs text-admin-text-faint mt-1">Ảnh hoặc Video (Tối đa 100MB)</p>
                    </>
                  )}
                  <input ref={fileInputRef} type="file" accept="image/*, video/*, .mp4, .mov, .webm" onChange={handleFileSelect} className="hidden" />
                </div>
                
                {selectedFile && (
                  <div>
                    <label className="block text-sm font-medium text-admin-text-dim mb-1">Tiêu đề (Tên gợi nhớ)</label>
                    <input 
                      type="text" 
                      value={uploadTitle}
                      onChange={e => setUploadTitle(e.target.value)}
                      className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-admin-text focus:border-admin-gold focus:outline-none"
                      placeholder="VD: Banner Tháng 8"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Link Tab */}
            {activeTab === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-admin-text-dim mb-1">Nguồn link</label>
                  <select 
                    value={linkSource}
                    onChange={e => setLinkSource(e.target.value as any)}
                    className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-admin-text focus:border-admin-gold focus:outline-none"
                  >
                    <option value="gdrive">Google Drive (Tự động format link)</option>
                    <option value="external">Nguồn khác (Youtube, Imgur...)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-dim mb-1">Đường dẫn (URL)</label>
                  <input 
                    type="text" 
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                    className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-admin-text focus:border-admin-gold focus:outline-none"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-dim mb-1">Loại nội dung</label>
                  <select 
                    value={linkType}
                    onChange={e => setLinkType(e.target.value as any)}
                    className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-admin-text focus:border-admin-gold focus:outline-none"
                  >
                    <option value="image">Hình ảnh (Image)</option>
                    <option value="video">Video</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-admin-text-dim mb-1">Tiêu đề</label>
                  <input 
                    type="text" 
                    value={linkTitle}
                    onChange={e => setLinkTitle(e.target.value)}
                    className="w-full bg-admin-bg border border-admin-line rounded-xl px-4 py-2.5 text-admin-text focus:border-admin-gold focus:outline-none"
                    placeholder="VD: Khuyến mãi mùa thu"
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={uploading}
              className={`
                w-full mt-6 py-3 rounded-xl font-semibold text-sm
                transition-all duration-200 shadow-sm flex justify-center items-center gap-2
                ${uploading
                  ? 'bg-admin-line text-admin-text-faint cursor-wait'
                  : 'bg-admin-gold hover:bg-[#a67433] text-[#241804]'
                }
              `}
            >
              {uploading ? <div className="w-4 h-4 border-2 border-[#241804] border-t-transparent rounded-full animate-spin" /> : <Upload size={18} />}
              {uploading ? 'Đang xử lý...' : 'Lưu vào Kho'}
            </button>
          </div>
        </div>

        {/* Lớp Phải: Danh sách Media */}
        <div className="lg:col-span-2">
          <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 shadow-[var(--shadow)] min-h-[500px]">
            <h2 className="text-lg font-bold text-admin-text mb-6">Tất cả Media ({mediaList.length})</h2>
            
            {loading ? (
              <p className="text-admin-text-dim text-center py-8">⏳ Đang tải...</p>
            ) : mediaList.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-admin-line-strong rounded-xl">
                <ImageIcon size={48} className="mx-auto text-admin-text-faint mb-4" />
                <p className="text-admin-text-dim font-medium">Kho media trống</p>
                <p className="text-admin-text-faint text-sm mt-1">Hãy thêm file hoặc link mới từ bên trái</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mediaList.map((media) => (
                  <div key={media.id} className="group border border-admin-line rounded-xl overflow-hidden bg-admin-bg relative flex flex-col shadow-sm hover:shadow-md transition-shadow">
                    {/* Media Preview */}
                    <div className="aspect-[4/3] bg-black/5 relative overflow-hidden flex items-center justify-center">
                      {media.type === 'video' ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                          <FileVideo size={40} className="text-admin-text-faint" />
                          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">VIDEO</span>
                        </div>
                      ) : (
                        <img src={media.url} alt={media.title} className="w-full h-full object-cover" />
                      )}
                      
                      {/* Badge Nguồn */}
                      <div className="absolute top-2 left-2 flex gap-1">
                        {media.source === 'supabase' && (
                          <span className="bg-admin-gold text-[#241804] text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">SUPABASE</span>
                        )}
                        {media.source === 'gdrive' && (
                          <span className="bg-[#1FA463] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">GDRIVE</span>
                        )}
                      </div>
                      
                      {/* Lớp phủ (Overlay) khi hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => copyToClipboard(media.url)}
                          className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                          title="Copy Link"
                        >
                          <Copy size={16} />
                        </button>
                        <a 
                          href={media.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-white rounded-full text-black hover:scale-110 transition-transform"
                          title="Xem file gốc"
                        >
                          <ExternalLink size={16} />
                        </a>
                      </div>
                    </div>
                    
                    {/* Thông tin */}
                    <div className="p-3 border-t border-admin-line flex items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-admin-text truncate" title={media.title}>{media.title}</p>
                        <p className="text-[11px] text-admin-text-faint mt-0.5">
                          {new Date(media.created_at).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <button 
                        onClick={() => handleDelete(media.id)}
                        className="p-1.5 text-admin-text-faint hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa vĩnh viễn"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
