'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, FileText, X } from 'lucide-react';
import Link from 'next/link';

const BlogAdminPage = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form
  const [activeLang, setActiveLang] = useState('vi');
  const [slug, setSlug] = useState('');
  const [titles, setTitles] = useState<Record<string, string>>({ vi: '', en: '', cn: '', ko: '', ja: '' });
  const [contents, setContents] = useState<Record<string, string>>({ vi: '', en: '', cn: '', ko: '', ja: '' });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/admin/posts');
      const json = await res.json();
      if (json.success) setPosts(json.data || []);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-generate slug from title (using Vietnamese title as base)
  const handleTitleChange = (lang: string, value: string) => {
    setTitles(prev => ({ ...prev, [lang]: value }));
    if (lang === 'vi' && (!slug || slug === slugify(titles.vi))) {
      setSlug(slugify(value));
    }
  };

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      slug: slug || slugify(titles.vi),
      title: titles,
      content: contents,
      excerpt: { vi: '', en: '', ko: '', ja: '', cn: '' },
      status: 'published',
    };

    const res = await fetch('/api/admin/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSlug('');
      setTitles({ vi: '', en: '', cn: '', ko: '', ja: '' });
      setContents({ vi: '', en: '', cn: '', ko: '', ja: '' });
      setIsAdding(false);
      setSuccessMessage('✅ Đã thêm bài viết thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchPosts();
    } else {
      alert('Lỗi khi lưu bài viết!');
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return;
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE' });
    setSuccessMessage('🗑️ Đã xóa bài viết.');
    setTimeout(() => setSuccessMessage(''), 3000);
    fetchPosts();
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin" className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-admin-text">📝 Quản Lý Bài Viết</h1>
            <p className="text-admin-text-dim mt-2">Viết bài blog chia sẻ kinh nghiệm spa, khuyến mãi cho khách đọc.</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`
              flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-[14px]
              transition-all duration-200 active:scale-[0.98] shadow-sm
              ${isAdding
                ? 'bg-admin-line text-admin-text border border-admin-line-strong'
                : 'bg-admin-gold hover:bg-[#a67433] text-[#241804]'
              }
            `}
          >
            {isAdding ? <><X size={16} /> Hủy</> : <><Plus size={16} /> Viết bài mới</>}
          </button>
        </div>
      </div>

      {/* Success Toast */}
      {successMessage && (
        <div className="mb-6 p-4 rounded-xl bg-admin-green-a border border-admin-green-b text-admin-green text-sm font-semibold">
          {successMessage}
        </div>
      )}

      {/* Form Thêm Bài */}
      {isAdding && (
        <div className="bg-admin-panel border border-admin-line rounded-2xl p-6 mb-8 shadow-[var(--shadow)]">
          <h2 className="text-lg font-semibold text-admin-text mb-5">✍️ Viết bài mới</h2>
          
          <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide border-b border-admin-line-strong">
            {[
              { code: 'vi', countryCode: 'vn', label: 'Tiếng Việt' },
              { code: 'en', countryCode: 'gb', label: 'English' },
              { code: 'cn', countryCode: 'cn', label: '中文' },
              { code: 'jp', countryCode: 'jp', label: '日本語' },
              { code: 'kr', countryCode: 'kr', label: '한국어' },
            ].map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => setActiveLang(lang.code)}
                className={`
                  flex items-center gap-2 px-5 py-2.5 rounded-t-xl font-semibold whitespace-nowrap transition-colors text-sm
                  ${activeLang === lang.code 
                    ? 'bg-admin-bg border-t border-l border-r border-admin-line-strong text-admin-gold' 
                    : 'text-admin-text-dim hover:text-admin-text hover:bg-admin-bg/50'
                  }
                `}
              >
                <img 
                  src={`https://flagcdn.com/24x18/${lang.countryCode}.png`} 
                  alt={lang.code}
                  className="w-4 h-auto rounded-[2px]"
                />
                {lang.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAdd} className="space-y-5 bg-admin-bg p-5 rounded-b-xl rounded-tr-xl border-x border-b border-admin-line-strong -mt-4">
            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-1.5">Tiêu đề bài viết</label>
              <input
                type="text"
                required={activeLang === 'vi'}
                value={titles[activeLang] || ''}
                onChange={e => handleTitleChange(activeLang, e.target.value)}
                placeholder={activeLang === 'vi' ? "Ví dụ: 5 Lợi Ích Của Massage Đá Nóng" : "Enter title..."}
                className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text text-lg focus:border-admin-gold focus:ring-1 focus:ring-admin-gold transition-colors"
              />
            </div>

            <div className={activeLang !== 'vi' ? 'hidden' : 'block'}>
              <label className="block text-sm font-semibold text-admin-text-dim mb-1.5">
                Đường dẫn <span className="text-admin-text-faint">(tự tạo từ tiêu đề tiếng Việt)</span>
              </label>
              <div className="flex items-center bg-white border border-admin-line-strong rounded-xl overflow-hidden focus-within:border-admin-gold focus-within:ring-1 focus-within:ring-admin-gold transition-colors">
                <span className="px-3 text-admin-text-faint text-[14px] bg-admin-panel-2 py-3 border-r border-admin-line-strong font-medium">/blog/</span>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-3 text-admin-text focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text-dim mb-1.5">Nội dung bài viết</label>
              <textarea
                required={activeLang === 'vi'}
                rows={8}
                value={contents[activeLang] || ''}
                onChange={e => setContents(prev => ({ ...prev, [activeLang]: e.target.value }))}
                placeholder="Viết nội dung bài viết ở đây...&#10;&#10;Bạn có thể dùng HTML cơ bản: <b>in đậm</b>, <i>in nghiêng</i>, <br> xuống dòng"
                className="w-full bg-white border border-admin-line-strong rounded-xl px-4 py-3 text-admin-text leading-relaxed focus:border-admin-gold focus:ring-1 focus:ring-admin-gold transition-colors resize-y"
              />
              <p className="text-[12px] text-admin-text-faint mt-1">Hỗ trợ HTML cơ bản.</p>
            </div>

            <button
              type="submit"
              disabled={loading || !titles.vi.trim()}
              className={`
                px-8 py-3.5 rounded-xl font-bold text-base shadow-sm
                transition-all duration-200
                ${loading || !titles.vi.trim()
                  ? 'bg-admin-line text-admin-text-faint cursor-not-allowed border border-admin-line-strong'
                  : 'bg-admin-gold hover:bg-[#a67433] text-[#241804] active:scale-[0.98]'
                }
              `}
            >
              {loading ? '⏳ Đang lưu...' : '✅ Đăng bài viết'}
            </button>
          </form>
        </div>
      )}

      {/* Posts List */}
      <div>
        <h2 className="text-lg font-semibold text-admin-text mb-4">
          Bài viết hiện có ({posts.length})
        </h2>

        {loading && posts.length === 0 ? (
          <p className="text-admin-text-dim text-center py-8">⏳ Đang tải...</p>
        ) : posts.length === 0 ? (
          <div className="bg-admin-panel border border-admin-line rounded-2xl p-8 text-center shadow-[var(--shadow)]">
            <FileText size={40} className="mx-auto mb-3 text-admin-text-faint" />
            <p className="text-admin-text-dim font-semibold mb-1">Chưa có bài viết nào.</p>
            <p className="text-admin-text-faint text-[13px]">Nhấn "Viết bài mới" ở trên để bắt đầu.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div key={post.id} className="bg-admin-panel border border-admin-line rounded-xl p-4 flex items-center gap-4 group hover:border-admin-line-strong transition-colors shadow-sm">
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-admin-green-a border border-admin-green-b flex items-center justify-center flex-shrink-0">
                  <FileText size={18} className="text-admin-green" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-admin-text truncate">
                    {post.title?.vi || post.title?.en || '(Chưa có tiêu đề)'}
                  </h3>
                  <p className="text-[13px] text-admin-text-dim mt-0.5">/blog/{post.slug}</p>
                </div>

                {/* Status */}
                <span className="hidden sm:inline-flex items-center gap-1 bg-admin-green-a text-admin-green px-2.5 py-1 rounded-full text-[11px] border border-admin-green-b font-bold tracking-wide uppercase">
                  Đang hiển thị
                </span>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2.5 text-admin-text-faint hover:text-[#c85a5a] hover:bg-red-50 rounded-xl transition-all opacity-60 group-hover:opacity-100"
                  title="Xóa bài viết"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogAdminPage;
