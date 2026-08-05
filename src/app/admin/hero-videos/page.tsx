'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Upload, Trash2, Video, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';

// 🔧 UI CONFIGURATION
const MAX_VIDEO_SIZE_MB = 100;

const HeroVideosAdmin = () => {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const res = await fetch('/api/admin/hero-videos');
      const json = await res.json();
      if (json.success) setVideos(json.data || []);
    } catch {
      // API might not exist yet - that's OK, we show empty state
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Vui lòng chọn file video (MP4, MOV...)!');
      return;
    }

    if (file.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
      alert(`Video quá lớn! Tối đa ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('folder', 'hero-videos');

      const uploadRes = await fetch('/api/admin/media', { method: 'POST', body: form });
      const uploadJson = await uploadRes.json();

      if (!uploadJson.success) {
        alert('Lỗi tải lên: ' + (uploadJson.error?.message || 'Không rõ'));
        return;
      }

      // Save video record
      const res = await fetch('/api/admin/hero-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: uploadJson.data.url,
          sort_order: videos.length + 1,
        }),
      });

      if (res.ok) {
        setSelectedFile(null);
        setPreviewUrl(null);
        setSuccessMessage('✅ Đã thêm video trang chủ thành công!');
        setTimeout(() => setSuccessMessage(''), 4000);
        fetchVideos();
      }
    } catch {
      alert('Lỗi hệ thống');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa video này không?')) return;
    await fetch(`/api/admin/hero-videos/${id}`, { method: 'DELETE' });
    setSuccessMessage('🗑️ Đã xóa video.');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchVideos();
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">🎬 Video Trang Chủ</h1>
        <p className="text-admin-text-dim mt-2">
          Quản lý video nền hiển thị khi khách truy cập trang chủ website.
          Video sẽ tự động chuyển đổi theo thứ tự.
        </p>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-admin-green-a border border-admin-green-b text-admin-green text-sm font-semibold">
          {successMessage}
        </div>
      )}

      {/* Upload Area */}
      <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 mb-8 shadow-[var(--shadow)]">
        <h2 className="text-lg font-semibold text-admin-text mb-4 flex items-center gap-2">
          <Upload size={18} className="text-admin-gold" /> Tải lên video mới
        </h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          className={`
            cursor-pointer border-2 border-dashed rounded-2xl
            flex flex-col items-center justify-center min-h-[200px]
            transition-all duration-200
            ${previewUrl
              ? 'border-admin-gold bg-admin-gold-dim p-4'
              : 'border-admin-line-strong bg-admin-panel-2 hover:border-admin-gold hover:bg-admin-gold-dim p-8 text-admin-text-dim'
            }
          `}
        >
          {previewUrl ? (
            <div className="w-full">
              <video src={previewUrl} controls className="w-full max-h-[300px] rounded-xl mx-auto" />
              <p className="text-center text-xs text-admin-text-dim mt-3">Nhấn để chọn video khác</p>
            </div>
          ) : (
            <>
              <Video size={40} className="text-admin-text-faint mb-4" />
              <p className="text-base text-admin-text-dim text-center">
                <strong className="text-admin-text">Nhấn vào đây</strong> để chọn video
              </p>
              <p className="text-[12px] text-admin-text-faint mt-2">MP4, MOV — tối đa {MAX_VIDEO_SIZE_MB}MB</p>
              <p className="text-[12px] text-admin-text-faint mt-1">Nên dùng video ngang (16:9) cho đẹp nhất</p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {selectedFile && (
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`
              w-full mt-4 py-3.5 rounded-xl font-semibold text-base
              transition-all duration-200 shadow-sm
              ${uploading
                ? 'bg-admin-line text-admin-text-faint cursor-wait border border-admin-line-strong'
                : 'bg-admin-gold hover:bg-[#a67433] text-[#241804] active:scale-[0.98]'
              }
            `}
          >
            {uploading ? '⏳ Đang tải lên... (có thể mất vài phút)' : '✅ Tải video lên trang chủ'}
          </button>
        )}
      </div>

      {/* Current Videos */}
      <div>
        <h2 className="text-lg font-semibold text-admin-text mb-4">
          Video đang hiển thị ({videos.length})
        </h2>

        {loading ? (
          <p className="text-admin-text-dim text-center py-8">⏳ Đang tải...</p>
        ) : videos.length === 0 ? (
          <div className="bg-admin-panel border border-admin-line rounded-2xl p-8 text-center shadow-[var(--shadow)]">
            <Video size={40} className="mx-auto mb-3 text-admin-text-faint" />
            <p className="text-admin-text-dim mb-1 font-semibold">Chưa có video nào.</p>
            <p className="text-admin-text-faint text-sm">Website đang dùng video mặc định trong code.</p>
            <p className="text-admin-text-faint text-sm">Tải lên video ở trên để thay thế.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video, idx) => (
              <div key={video.id} className="bg-admin-panel border border-admin-line rounded-xl p-4 flex items-center gap-4 group hover:border-admin-line-strong transition-colors shadow-[var(--shadow)]">
                {/* Order Badge */}
                <div className="w-10 h-10 rounded-lg bg-admin-purple-a border border-admin-purple-b flex items-center justify-center font-bold text-admin-purple flex-shrink-0 shadow-sm">
                  {idx + 1}
                </div>

                {/* Video Thumbnail */}
                <div className="w-32 h-20 bg-black rounded-xl overflow-hidden flex-shrink-0 border border-admin-line-strong relative shadow-sm">
                  <video src={video.url} className="w-full h-full object-cover" />
                  <Play className="absolute inset-0 m-auto w-6 h-6 text-white/90 drop-shadow" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-admin-text font-semibold truncate">{video.url.split('/').pop()}</p>
                  <p className="text-xs text-admin-text-dim mt-1">Video #{idx + 1} trong carousel trang chủ</p>
                </div>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(video.id)}
                  className="p-2.5 text-admin-text-faint hover:text-[#c85a5a] hover:bg-red-50 rounded-xl transition-all opacity-60 group-hover:opacity-100"
                  title="Xóa video"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="mt-8 bg-admin-panel border border-admin-line rounded-2xl p-5 shadow-[var(--shadow)]">
        <h3 className="text-sm font-semibold text-admin-text mb-2 flex items-center gap-2">💡 Lưu ý</h3>
        <ul className="text-sm text-admin-text-dim space-y-2">
          <li>• Video nên có độ phân giải <strong className="text-admin-text">1920x1080</strong> (Full HD) trở lên.</li>
          <li>• Thời lượng nên từ <strong className="text-admin-text">15-60 giây</strong> để không quá nặng.</li>
          <li>• Định dạng <strong className="text-admin-text">MP4</strong> được khuyến nghị (nhẹ + tương thích mọi trình duyệt).</li>
        </ul>
      </div>
    </div>
  );
};

export default HeroVideosAdmin;
