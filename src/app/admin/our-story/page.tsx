'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Save, ArrowLeft, Image as ImageIcon, Film, MapPin, Sparkles, 
  Upload, CheckCircle2, AlertCircle, Plus, Trash2, Eye, ExternalLink 
} from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { Locale } from '@/lib/constants';
import {
  OurStoryConfig,
  OurStoryFilmFrame,
  createDefaultOurStoryConfig,
  hydrateOurStoryConfig,
  LocalizedString
} from '@/components/OurStory/OurStory.data';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'cn', label: '中文', flag: '🇨🇳' },
  { code: 'jp', label: '日本語', flag: '🇯🇵' },
  { code: 'kr', label: '한국어', flag: '🇰🇷' },
];

export default function OurStoryAdminPage() {
  const [config, setConfig] = useState<OurStoryConfig>(createDefaultOurStoryConfig());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeLang, setActiveLang] = useState<string>('vi');
  const [activeTab, setActiveTab] = useState<'location' | 'architecture' | 'film' | 'atmosphere' | 'specialty'>('location');
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [uploadingTarget, setUploadingTarget] = useState<string | null>(null);

  // Load existing configuration from API
  useEffect(() => {
    fetch('/api/admin/system-settings')
      .then((res) => res.json())
      .then((data) => {
        const raw = data.about_story_content || data.homepage_content?.ourStory;
        setConfig(hydrateOurStoryConfig(raw));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load our-story settings:', err);
        setLoading(false);
      });
  }, []);

  // Save updated config
  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      const res = await fetch('/api/admin/system-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          about_story_content: config,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '✅ Đã lưu cấu hình Our Story thành công!' });
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: `Lỗi khi lưu: ${err.error || 'Vui lòng thử lại'}` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Lỗi kết nối máy chủ' });
    } finally {
      setSaving(false);
    }
  };

  // Direct image upload to Supabase Storage
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, onUploaded: (url: string) => void, targetId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTarget(targetId);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `story/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const supabase = createClient();

      const { data, error } = await supabase.storage
        .from('media-uploads')
        .upload(fileName, file, { cacheControl: '3600', upsert: true });

      if (error) {
        alert('Lỗi tải ảnh lên: ' + error.message);
        return;
      }

      const { data: { publicUrl } } = supabase.storage.from('media-uploads').getPublicUrl(data.path);
      onUploaded(publicUrl);
    } catch (err: any) {
      alert('Lỗi: ' + (err.message || 'Không thể tải ảnh lên'));
    } finally {
      setUploadingTarget(null);
    }
  };

  // Helper to update localized strings
  const updateField = (
    field: LocalizedString | undefined,
    text: string
  ): LocalizedString => {
    return { ...(field || { vi: '', en: '' }), [activeLang]: text };
  };

  if (loading) {
    return <div className="p-12 text-center text-admin-text-faint">Đang tải cấu hình Our Story...</div>;
  }

  return (
    <div className="p-6 lg:p-10 max-w-6xl mx-auto pb-28">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-admin-text-dim hover:text-admin-text text-sm mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Quay lại Tổng quan
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-admin-text flex items-center gap-3">
              <span>📖</span> Quản Trị Nội Dung &amp; Hình Ảnh: Our Story
            </h1>
            <p className="text-admin-text-dim mt-2 text-sm">
              Điều chỉnh hình ảnh vị trí, thước phim 35mm và nội dung phần Our Story trên trang chủ.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/#our-story"
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-admin-card border border-admin-line text-admin-text rounded-xl text-sm font-semibold hover:bg-admin-line transition-all"
            >
              <Eye size={16} /> Xem Trang Chủ
            </Link>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-admin-gold hover:bg-[#a67433] text-[#241804] rounded-xl font-bold transition-all disabled:opacity-50 shadow-sm"
            >
              <Save size={18} />
              {saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {message.text && (
          <div
            className={`mt-4 p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
              message.type === 'success' ? 'bg-admin-green/10 text-admin-green border border-admin-green/30' : 'bg-red-500/10 text-red-500 border border-red-500/30'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Language Tabs Selector */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 bg-admin-card p-3 rounded-2xl border border-admin-line-strong">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-admin-text-faint uppercase tracking-wider pl-2">
              Ngôn ngữ chỉnh sửa:
            </span>
            <div className="flex gap-1.5 overflow-x-auto">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setActiveLang(lang.code)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
                    activeLang === lang.code
                      ? 'bg-admin-gold text-[#241804] shadow-sm'
                      : 'bg-admin-bg/60 text-admin-text-dim hover:text-admin-text hover:bg-admin-line'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs text-admin-text-faint pr-2">
            Đang hiển thị ngôn ngữ: <strong className="text-admin-gold uppercase">{activeLang}</strong>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="mt-4 flex flex-wrap gap-2 border-b border-admin-line-strong pb-2">
          {[
            { id: 'location', label: '1. Vị Trí Vàng & Biển Báo', icon: MapPin },
            { id: 'architecture', label: '2. Kiến Trúc & Thương Mại', icon: Sparkles },
            { id: 'film', label: '3. Thước Phim 35mm Film Reel', icon: Film },
            { id: 'atmosphere', label: '4. Không Khí Đêm Sài Gòn', icon: ImageIcon },
            { id: 'specialty', label: '5. Đặc Sản Oria Spa', icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                  isActive
                    ? 'bg-admin-line text-admin-gold border border-admin-gold/40'
                    : 'text-admin-text-dim hover:text-admin-text hover:bg-admin-card'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: VỊ TRÍ VÀNG VÀ KẾT NỐI */}
      {activeTab === 'location' && (
        <div className="space-y-6">
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-admin-text mb-4 flex items-center gap-2">
              <MapPin className="text-admin-gold" size={20} />
              Hình Ảnh Vị Trí / Biển Báo Đường (Street Sign)
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">
                  Đường dẫn ảnh (URL hoặc đường dẫn nội bộ)
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold mb-3"
                  value={config.locationSection.streetSignImage || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      locationSection: { ...config.locationSection, streetSignImage: e.target.value },
                    })
                  }
                  placeholder="Ví dụ: /images/story/street-sign.jpg hoặc https://..."
                />

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text rounded-lg text-xs font-bold transition-all">
                    <Upload size={14} />
                    {uploadingTarget === 'streetSign' ? 'Đang tải ảnh lên...' : 'Tải Ảnh Mới Lên'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingTarget === 'streetSign'}
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          (url) =>
                            setConfig({
                              ...config,
                              locationSection: { ...config.locationSection, streetSignImage: url },
                            }),
                          'streetSign'
                        )
                      }
                    />
                  </label>
                  <span className="text-xs text-admin-text-faint">Hỗ trợ JPG, PNG, WEBP</span>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-admin-text mb-2">
                    Chú thích ảnh ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                    value={config.locationSection.imageCaption?.[activeLang] || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        locationSection: {
                          ...config.locationSection,
                          imageCaption: updateField(config.locationSection.imageCaption, e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-admin-bg rounded-xl border border-admin-line">
                <span className="text-xs font-bold text-admin-text-faint uppercase mb-2">Xem Trước Ảnh Biển Báo:</span>
                {config.locationSection.streetSignImage ? (
                  <div className="max-w-[260px] w-full rounded-lg overflow-hidden border border-admin-line shadow-md">
                    <img
                      src={config.locationSection.streetSignImage}
                      alt="Street sign preview"
                      className="w-full h-48 object-cover"
                    />
                    <p className="p-2 text-[11px] text-center text-admin-text-dim italic bg-black/60">
                      {config.locationSection.imageCaption?.[activeLang] || config.locationSection.imageCaption?.vi}
                    </p>
                  </div>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-admin-text-faint border border-dashed border-admin-line rounded-lg">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Texts Config */}
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-admin-text mb-4">Nội Dung Văn Bản Vị Trí Vàng</h2>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Tiêu đề mục ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                value={config.locationSection.title?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    locationSection: {
                      ...config.locationSection,
                      title: updateField(config.locationSection.title, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Đoạn văn giới thiệu bờ sông Sài Gòn ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[90px]"
                value={config.locationSection.text?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    locationSection: {
                      ...config.locationSection,
                      text: updateField(config.locationSection.text, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Vị trí chiến lược (403m, lưu thông hai chiều) ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[80px]"
                value={config.locationSection.strategicPosition?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    locationSection: {
                      ...config.locationSection,
                      strategicPosition: updateField(config.locationSection.strategicPosition, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Các điểm kết nối giao cắt ({activeLang.toUpperCase()})
              </label>
              <div className="space-y-3">
                {config.locationSection.connections.map((item, idx) => (
                  <div key={`conn-${idx}`} className="flex items-center gap-2">
                    <span className="text-xs text-admin-gold font-bold w-6">{idx + 1}.</span>
                    <input
                      type="text"
                      className="flex-1 px-3.5 py-2 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                      value={item?.[activeLang] || ''}
                      onChange={(e) => {
                        const newConns = [...config.locationSection.connections];
                        newConns[idx] = updateField(newConns[idx], e.target.value);
                        setConfig({
                          ...config,
                          locationSection: { ...config.locationSection, connections: newConns },
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newConns = config.locationSection.connections.filter((_, i) => i !== idx);
                        setConfig({
                          ...config,
                          locationSection: { ...config.locationSection, connections: newConns },
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Xóa điểm kết nối"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newConns = [...config.locationSection.connections, { vi: '', en: '' }];
                    setConfig({
                      ...config,
                      locationSection: { ...config.locationSection, connections: newConns },
                    });
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-admin-line text-xs font-bold text-admin-text rounded-lg hover:bg-admin-line-strong transition-colors"
                >
                  <Plus size={14} /> Thêm Điểm Kết Nối
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KIẾN TRÚC VÀ THƯƠNG MẠI */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-admin-text mb-4">Đặc Điểm Kiến Trúc &amp; Thương Mại</h2>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Tiêu đề mục ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                value={config.architectureSection.title?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    architectureSection: {
                      ...config.architectureSection,
                      title: updateField(config.architectureSection.title, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Các đặc điểm kiến trúc (Cao ốc văn phòng, Melinh Point, Khách sạn 5 sao...)
              </label>
              <div className="space-y-3">
                {config.architectureSection.features.map((item, idx) => (
                  <div key={`feat-${idx}`} className="flex items-start gap-2">
                    <span className="text-xs text-admin-gold font-bold w-6 pt-2">{idx + 1}.</span>
                    <textarea
                      className="flex-1 px-3.5 py-2 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[70px]"
                      value={item?.[activeLang] || ''}
                      onChange={(e) => {
                        const newFeats = [...config.architectureSection.features];
                        newFeats[idx] = updateField(newFeats[idx], e.target.value);
                        setConfig({
                          ...config,
                          architectureSection: { ...config.architectureSection, features: newFeats },
                        });
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newFeats = config.architectureSection.features.filter((_, i) => i !== idx);
                        setConfig({
                          ...config,
                          architectureSection: { ...config.architectureSection, features: newFeats },
                        });
                      }}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newFeats = [...config.architectureSection.features, { vi: '', en: '' }];
                    setConfig({
                      ...config,
                      architectureSection: { ...config.architectureSection, features: newFeats },
                    });
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-admin-line text-xs font-bold text-admin-text rounded-lg hover:bg-admin-line-strong transition-colors"
                >
                  <Plus size={14} /> Thêm Đặc Điểm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THƯỚC PHIM 35MM (FILM REEL) */}
      {activeTab === 'film' && (
        <div className="space-y-6">
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-admin-text mb-4 flex items-center gap-2">
              <Film className="text-admin-gold" size={20} />
              Quản Lý Thước Phim 35mm &amp; Thay Thế Hình Ảnh Khung Phim
            </h2>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Tiêu đề thước phim ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                value={config.filmReel.title?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    filmReel: {
                      ...config.filmReel,
                      title: updateField(config.filmReel.title, e.target.value),
                    },
                  })
                }
              />
            </div>

            {/* List of Film Frames */}
            <div className="space-y-6">
              {config.filmReel.frames.map((frame, index) => (
                <div
                  key={`frame-${frame.id}-${index}`}
                  className="p-5 bg-admin-bg/60 border border-admin-line-strong rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-admin-line pb-3">
                    <span className="font-bold text-admin-gold text-sm flex items-center gap-2">
                      <span>🎞️</span> Khung Hình {frame.id < 10 ? `0${frame.id}` : frame.id}
                      <span className="text-xs text-admin-text-faint font-normal">({frame.frameTag})</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Xóa khung hình ${frame.id}?`)) {
                          const newFrames = config.filmReel.frames.filter((_, i) => i !== index);
                          setConfig({
                            ...config,
                            filmReel: { ...config.filmReel, frames: newFrames },
                          });
                        }
                      }}
                      className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors"
                      title="Xóa khung hình"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Left: Image & Upload */}
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Hình ảnh khung phim
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-admin-card border border-admin-line rounded-lg text-xs text-admin-text focus:outline-none focus:border-admin-gold mb-2"
                        value={frame.image || ''}
                        onChange={(e) => {
                          const newFrames = [...config.filmReel.frames];
                          newFrames[index].image = e.target.value;
                          setConfig({
                            ...config,
                            filmReel: { ...config.filmReel, frames: newFrames },
                          });
                        }}
                        placeholder="Đường dẫn ảnh..."
                      />

                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-admin-line hover:bg-admin-line-strong text-admin-text rounded-lg text-xs font-bold transition-all w-full justify-center">
                        <Upload size={13} />
                        {uploadingTarget === `frame-${frame.id}` ? 'Đang tải...' : 'Tải Ảnh Mới Lên'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploadingTarget === `frame-${frame.id}`}
                          onChange={(e) =>
                            handleFileUpload(
                              e,
                              (url) => {
                                const newFrames = [...config.filmReel.frames];
                                newFrames[index].image = url;
                                setConfig({
                                  ...config,
                                  filmReel: { ...config.filmReel, frames: newFrames },
                                });
                              },
                              `frame-${frame.id}`
                            )
                          }
                        />
                      </label>

                      {frame.image && (
                        <div className="mt-2 h-28 rounded-lg overflow-hidden border border-admin-line">
                          <img src={frame.image} alt={frame.title?.vi} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Middle: Badge & Title */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-admin-text mb-1">
                          Badge danh mục ({activeLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-admin-card border border-admin-line rounded-lg text-xs text-admin-text focus:outline-none focus:border-admin-gold"
                          value={frame.badge?.[activeLang] || ''}
                          onChange={(e) => {
                            const newFrames = [...config.filmReel.frames];
                            newFrames[index].badge = updateField(newFrames[index].badge, e.target.value);
                            setConfig({
                              ...config,
                              filmReel: { ...config.filmReel, frames: newFrames },
                            });
                          }}
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-admin-text mb-1">
                          Tiêu đề khung hình ({activeLang.toUpperCase()})
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-admin-card border border-admin-line rounded-lg text-xs text-admin-text focus:outline-none focus:border-admin-gold"
                          value={frame.title?.[activeLang] || ''}
                          onChange={(e) => {
                            const newFrames = [...config.filmReel.frames];
                            newFrames[index].title = updateField(newFrames[index].title, e.target.value);
                            setConfig({
                              ...config,
                              filmReel: { ...config.filmReel, frames: newFrames },
                            });
                          }}
                        />
                      </div>
                    </div>

                    {/* Right: Description */}
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Mô tả chi tiết ({activeLang.toUpperCase()})
                      </label>
                      <textarea
                        className="w-full px-3 py-2 bg-admin-card border border-admin-line rounded-lg text-xs text-admin-text focus:outline-none focus:border-admin-gold min-h-[96px]"
                        value={frame.desc?.[activeLang] || ''}
                        onChange={(e) => {
                          const newFrames = [...config.filmReel.frames];
                          newFrames[index].desc = updateField(newFrames[index].desc, e.target.value);
                          setConfig({
                            ...config,
                            filmReel: { ...config.filmReel, frames: newFrames },
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newId = config.filmReel.frames.length + 1;
                  const newFrame: OurStoryFilmFrame = {
                    id: newId,
                    frameTag: `KODAK 500T • ${newId}A ▶`,
                    badge: { vi: `Trải nghiệm #${newId}`, en: `Experience #${newId}` },
                    title: { vi: `Khung Hình 0${newId} • Tiêu đề mới`, en: `Frame 0${newId} • New Title` },
                    desc: { vi: 'Mô tả khung phim...', en: 'Film frame description...' },
                    image: '/images/story/photo-bus.jpg',
                  };
                  setConfig({
                    ...config,
                    filmReel: { ...config.filmReel, frames: [...config.filmReel.frames, newFrame] },
                  });
                }}
                className="w-full py-3 border border-dashed border-admin-gold/40 hover:border-admin-gold text-admin-gold font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-admin-gold/5 transition-all"
              >
                <Plus size={16} /> Thêm Khung Hình 35mm Mới
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: KHÔNG KHÍ ĐÊM SÀI GÒN */}
      {activeTab === 'atmosphere' && (
        <div className="space-y-6">
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-admin-text mb-4 flex items-center gap-2">
              <ImageIcon className="text-admin-gold" size={20} />
              Hình Ảnh Không Khí Đêm Sài Gòn
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">
                  Đường dẫn ảnh phố đêm
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold mb-3"
                  value={config.atmosphereSection.nightStreetImage || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      atmosphereSection: { ...config.atmosphereSection, nightStreetImage: e.target.value },
                    })
                  }
                  placeholder="Ví dụ: /images/story/night-street.jpg hoặc https://..."
                />

                <div className="flex items-center gap-3">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-admin-line hover:bg-admin-line-strong text-admin-text rounded-lg text-xs font-bold transition-all">
                    <Upload size={14} />
                    {uploadingTarget === 'nightStreet' ? 'Đang tải ảnh lên...' : 'Tải Ảnh Mới Lên'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploadingTarget === 'nightStreet'}
                      onChange={(e) =>
                        handleFileUpload(
                          e,
                          (url) =>
                            setConfig({
                              ...config,
                              atmosphereSection: { ...config.atmosphereSection, nightStreetImage: url },
                            }),
                          'nightStreet'
                        )
                      }
                    />
                  </label>
                  <span className="text-xs text-admin-text-faint">Khuyên dùng ảnh ngang (tỷ lệ 16:9 hoặc 4:3)</span>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-admin-text mb-2">
                    Chú thích ảnh ({activeLang.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    className="w-full px-3.5 py-2 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                    value={config.atmosphereSection.imageCaption?.[activeLang] || ''}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        atmosphereSection: {
                          ...config.atmosphereSection,
                          imageCaption: updateField(config.atmosphereSection.imageCaption, e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center justify-center p-4 bg-admin-bg rounded-xl border border-admin-line">
                <span className="text-xs font-bold text-admin-text-faint uppercase mb-2">Xem Trước Ảnh Phố Đêm:</span>
                {config.atmosphereSection.nightStreetImage ? (
                  <div className="w-full max-w-sm rounded-lg overflow-hidden border border-admin-line shadow-md">
                    <img
                      src={config.atmosphereSection.nightStreetImage}
                      alt="Night street preview"
                      className="w-full h-44 object-cover"
                    />
                    <p className="p-2 text-[11px] text-center text-admin-text-dim italic bg-black/60">
                      {config.atmosphereSection.imageCaption?.[activeLang] || config.atmosphereSection.imageCaption?.vi}
                    </p>
                  </div>
                ) : (
                  <div className="w-full h-44 flex items-center justify-center text-admin-text-faint border border-dashed border-admin-line rounded-lg">
                    Chưa có ảnh
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Texts Config */}
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-admin-text mb-4">Nội Dung Không Khí Và Phong Cách</h2>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Tiêu đề mục ({activeLang.toUpperCase()})
              </label>
              <input
                type="text"
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                value={config.atmosphereSection.title?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    atmosphereSection: {
                      ...config.atmosphereSection,
                      title: updateField(config.atmosphereSection.title, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Buổi sáng năng động ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[70px]"
                value={config.atmosphereSection.morning?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    atmosphereSection: {
                      ...config.atmosphereSection,
                      morning: updateField(config.atmosphereSection.morning, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Buổi tối hoa lệ ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[70px]"
                value={config.atmosphereSection.evening?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    atmosphereSection: {
                      ...config.atmosphereSection,
                      evening: updateField(config.atmosphereSection.evening, e.target.value),
                    },
                  })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Điểm đến biểu tượng ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[70px]"
                value={config.atmosphereSection.landmark?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    atmosphereSection: {
                      ...config.atmosphereSection,
                      landmark: updateField(config.atmosphereSection.landmark, e.target.value),
                    },
                  })
                }
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ĐẶC SẢN ORIA SPA */}
      {activeTab === 'specialty' && (
        <div className="space-y-6">
          <div className="bg-admin-card border border-admin-line-strong rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-admin-text mb-4">Đặc Sản Địa Phương • Oria Barbershop &amp; Spa</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">
                  Kicker / Badge nhỏ ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                  value={config.specialtySection.badge?.[activeLang] || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialtySection: {
                        ...config.specialtySection,
                        badge: updateField(config.specialtySection.badge, e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">
                  Tiêu đề chính ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                  value={config.specialtySection.headline?.[activeLang] || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialtySection: {
                        ...config.specialtySection,
                        headline: updateField(config.specialtySection.headline, e.target.value),
                      },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Lời dẫn giới thiệu (Lead Text) ({activeLang.toUpperCase()})
              </label>
              <textarea
                className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold min-h-[70px]"
                value={config.specialtySection.lead?.[activeLang] || ''}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    specialtySection: {
                      ...config.specialtySection,
                      lead: updateField(config.specialtySection.lead, e.target.value),
                    },
                  })
                }
              />
            </div>

            {/* 4 Pillars */}
            <div className="pt-4 border-t border-admin-line">
              <h3 className="text-sm font-bold text-admin-gold mb-3 uppercase tracking-wider">
                4 Trụ Cột Dịch Vụ Phục Hồi ({activeLang.toUpperCase()})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.specialtySection.pillars.map((pillar, idx) => (
                  <div key={`pillar-cfg-${idx}`} className="p-4 bg-admin-bg/60 border border-admin-line rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        className="w-12 px-2 py-1 bg-admin-card border border-admin-line rounded text-center text-sm font-bold"
                        value={pillar.icon}
                        onChange={(e) => {
                          const newPillars = [...config.specialtySection.pillars];
                          newPillars[idx].icon = e.target.value;
                          setConfig({
                            ...config,
                            specialtySection: { ...config.specialtySection, pillars: newPillars },
                          });
                        }}
                        title="Biểu tượng Emoji"
                      />
                      <input
                        type="text"
                        className="flex-1 px-3 py-1.5 bg-admin-card border border-admin-line rounded-lg text-sm text-admin-text font-bold focus:outline-none focus:border-admin-gold"
                        value={pillar.title?.[activeLang] || ''}
                        onChange={(e) => {
                          const newPillars = [...config.specialtySection.pillars];
                          newPillars[idx].title = updateField(newPillars[idx].title, e.target.value);
                          setConfig({
                            ...config,
                            specialtySection: { ...config.specialtySection, pillars: newPillars },
                          });
                        }}
                        placeholder="Tiêu đề..."
                      />
                    </div>

                    <textarea
                      className="w-full px-3 py-1.5 bg-admin-card border border-admin-line rounded-lg text-xs text-admin-text focus:outline-none focus:border-admin-gold min-h-[55px]"
                      value={pillar.desc?.[activeLang] || ''}
                      onChange={(e) => {
                        const newPillars = [...config.specialtySection.pillars];
                        newPillars[idx].desc = updateField(newPillars[idx].desc, e.target.value);
                        setConfig({
                          ...config,
                          specialtySection: { ...config.specialtySection, pillars: newPillars },
                        });
                      }}
                      placeholder="Mô tả..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4 border-t border-admin-line grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">
                  Chữ trên nút Đặt lịch ({activeLang.toUpperCase()})
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                  value={config.specialtySection.ctaText?.[activeLang] || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialtySection: {
                        ...config.specialtySection,
                        ctaText: updateField(config.specialtySection.ctaText, e.target.value),
                      },
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-admin-text mb-2">
                  Đường dẫn nút Đặt lịch (Link URL)
                </label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 bg-admin-bg border border-admin-line rounded-xl text-sm text-admin-text focus:outline-none focus:border-admin-gold"
                  value={config.specialtySection.ctaLink || ''}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      specialtySection: { ...config.specialtySection, ctaLink: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
