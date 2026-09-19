'use client';

import React, { useState, useEffect, useMemo, useId } from 'react';
import {
  X,
  Search,
  Image as ImageIcon,
  Film,
  Check,
  HardDrive,
  Globe,
  Database,
  Layers,
  AlertCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import type { MediaAsset, SupportedLocale } from '@/types/content';
import { MOCK_MEDIA_LIBRARY } from './mockMedia';

export interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (mediaId: string, asset: MediaAsset) => void;
  currentMediaId?: string;
  allowedTypes?: Array<'image' | 'video'>;
  locale?: SupportedLocale;
  title?: string;
  isLoading?: boolean;
}

export function MediaPickerModal({
  isOpen,
  onClose,
  onSelect,
  currentMediaId,
  allowedTypes = ['image', 'video'],
  locale = 'vi',
  title = 'Chọn tệp từ Thư viện Media',
  isLoading = false,
}: MediaPickerModalProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(currentMediaId);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'supabase' | 'gdrive' | 'external'>('all');
  const [brokenMediaIds, setBrokenMediaIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const titleId = useId();
  const searchInputId = useId();

  // Keep internal selection synced when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedId(currentMediaId);
    }
  }, [isOpen, currentMediaId]);

  // Keyboard accessibility: Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Filter media items
  const filteredMedia = useMemo(() => {
    return MOCK_MEDIA_LIBRARY.filter((item) => {
      // Type constraint
      if (!allowedTypes.includes(item.type)) return false;
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Source constraint
      if (sourceFilter !== 'all' && item.source !== sourceFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = item.title.toLowerCase().includes(query);
        const altMatch = item.alt_i18n?.[locale]?.toLowerCase().includes(query);
        const idMatch = item.id.toLowerCase().includes(query);
        return titleMatch || altMatch || idMatch;
      }

      return true;
    });
  }, [allowedTypes, typeFilter, sourceFilter, searchQuery, locale]);

  const selectedAsset = useMemo(() => {
    return MOCK_MEDIA_LIBRARY.find((item) => item.id === selectedId) || null;
  }, [selectedId]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedAsset) {
      // mediaId is canonical as per Contract V1
      onSelect(selectedAsset.id, selectedAsset);
      onClose();
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-admin-panel border border-admin-line-strong rounded-2xl w-full max-w-5xl h-[88vh] max-h-[820px] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-admin-line flex items-center justify-between bg-admin-panel">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-admin-text flex items-center gap-2">
              <span className="text-admin-gold">✦</span> {title}
            </h2>
            <p className="text-xs text-admin-text-dim mt-0.5">
              Hệ thống quản lý Media tập trung. Lựa chọn asset trả về canonical <code className="text-admin-gold font-mono">mediaId</code>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-admin-text-faint hover:text-admin-text hover:bg-admin-line transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="px-6 py-3 border-b border-admin-line bg-admin-panel-2 flex flex-wrap items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-faint" />
            <input
              id={searchInputId}
              type="search"
              placeholder="Tìm theo tiêu đề, alt text hoặc media ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-admin-panel border border-admin-line rounded-xl text-admin-text placeholder:text-admin-text-faint focus:outline-none focus:border-admin-gold focus:ring-1 focus:ring-admin-gold/30 transition-all"
            />
          </div>

          {/* Type filters */}
          <div className="flex items-center gap-1 bg-admin-panel border border-admin-line p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                typeFilter === 'all'
                  ? 'bg-admin-gold text-[#241804] shadow-xs'
                  : 'text-admin-text-dim hover:text-admin-text'
              }`}
            >
              Tất cả
            </button>
            {allowedTypes.includes('image') && (
              <button
                type="button"
                onClick={() => setTypeFilter('image')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  typeFilter === 'image'
                    ? 'bg-admin-gold text-[#241804] shadow-xs'
                    : 'text-admin-text-dim hover:text-admin-text'
                }`}
              >
                <ImageIcon size={14} /> Hình ảnh
              </button>
            )}
            {allowedTypes.includes('video') && (
              <button
                type="button"
                onClick={() => setTypeFilter('video')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                  typeFilter === 'video'
                    ? 'bg-admin-gold text-[#241804] shadow-xs'
                    : 'text-admin-text-dim hover:text-admin-text'
                }`}
              >
                <Film size={14} /> Video
              </button>
            )}
          </div>

          {/* Source filter */}
          <div className="flex items-center gap-1 text-xs">
            <span className="text-admin-text-faint hidden sm:inline">Nguồn:</span>
            <select
              value={sourceFilter}
              onChange={(e) =>
                setSourceFilter(e.target.value as 'all' | 'supabase' | 'gdrive' | 'external')
              }
              className="bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 text-admin-text text-xs focus:outline-none focus:border-admin-gold"
            >
              <option value="all">Tất cả nguồn</option>
              <option value="supabase">Supabase Storage</option>
              <option value="gdrive">Google Drive</option>
              <option value="external">External CDN</option>
            </select>
          </div>
        </div>

        {/* Body (Grid + Inspector) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Media Grid Panel */}
          <div className="flex-1 p-6 overflow-y-auto">
            {isLoading ? (
              <div className="h-full flex flex-col items-center justify-center text-admin-text-dim gap-3">
                <div className="w-8 h-8 border-2 border-admin-gold/30 border-t-admin-gold rounded-full animate-spin" />
                <p className="text-sm">Đang tải kho media...</p>
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-admin-line rounded-2xl">
                <ImageIcon size={48} className="text-admin-text-faint mb-3 opacity-60" />
                <h3 className="text-base font-semibold text-admin-text">Không tìm thấy tệp media nào</h3>
                <p className="text-xs text-admin-text-dim max-w-sm mt-1">
                  Không có mục nào khớp với từ khóa &ldquo;{searchQuery}&rdquo; hoặc bộ lọc đang chọn.
                </p>
                {(searchQuery || typeFilter !== 'all' || sourceFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setTypeFilter('all');
                      setSourceFilter('all');
                    }}
                    className="mt-4 px-4 py-1.5 text-xs font-medium text-admin-gold border border-admin-gold/40 rounded-lg hover:bg-admin-gold-dim transition-colors"
                  >
                    Đặt lại bộ lọc
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredMedia.map((item) => {
                  const isSelected = item.id === selectedId;
                  const isBroken = brokenMediaIds[item.id];

                  return (
                    <div
                      key={item.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedId(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedId(item.id);
                        }
                      }}
                      className={`group relative rounded-xl border overflow-hidden text-left transition-all cursor-pointer flex flex-col ${
                        isSelected
                          ? 'border-admin-gold ring-2 ring-admin-gold/40 bg-admin-amber-a/30 shadow-md'
                          : 'border-admin-line hover:border-admin-gold/60 bg-admin-panel hover:shadow-xs'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="aspect-4/3 bg-black/5 relative overflow-hidden flex items-center justify-center">
                        {isBroken ? (
                          <div className="flex flex-col items-center text-admin-text-faint p-2 text-center">
                            <AlertCircle size={24} className="text-amber-500 mb-1" />
                            <span className="text-[10px]">Lỗi hiển thị</span>
                          </div>
                        ) : item.type === 'video' ? (
                          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                            <Film size={28} className="text-white/80" />
                            <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              VIDEO
                            </span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.alt_i18n?.[locale] || item.title}
                            onError={() => setBrokenMediaIds((prev) => ({ ...prev, [item.id]: true }))}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        )}

                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-admin-gold text-[#241804] flex items-center justify-center shadow-md">
                            <Check size={14} strokeWidth={3} />
                          </div>
                        )}

                        {/* Source Pill */}
                        <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium flex items-center gap-1">
                          {item.source === 'supabase' && <Database size={10} />}
                          {item.source === 'gdrive' && <HardDrive size={10} />}
                          {item.source === 'external' && <Globe size={10} />}
                          <span className="capitalize">{item.source}</span>
                        </div>
                      </div>

                      {/* Card Meta */}
                      <div className="p-2.5 flex-1 flex flex-col justify-between">
                        <p className="text-xs font-semibold text-admin-text line-clamp-1 leading-snug">
                          {item.title}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-admin-text-faint mt-1.5">
                          <span>{item.width && item.height ? `${item.width}×${item.height}` : item.type}</span>
                          <span>{formatFileSize(item.file_size)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Asset Detail & Preview Inspector (Right) */}
          <div className="w-72 sm:w-80 border-l border-admin-line bg-admin-panel-2 p-5 flex flex-col justify-between overflow-y-auto">
            {selectedAsset ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-admin-text-dim">
                    Chi tiết Asset đã chọn
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-admin-gold-dim text-admin-gold font-semibold uppercase">
                    {selectedAsset.type}
                  </span>
                </div>

                {/* Big Preview */}
                <div className="aspect-4/3 rounded-xl overflow-hidden border border-admin-line bg-black/5 flex items-center justify-center relative shadow-inner">
                  {selectedAsset.type === 'video' ? (
                    <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white/80 gap-2">
                      <Film size={36} />
                      <span className="text-xs">Định dạng MP4</span>
                    </div>
                  ) : (
                    <img
                      src={selectedAsset.url}
                      alt={selectedAsset.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>

                {/* Metadata Properties */}
                <div className="space-y-2.5 text-xs">
                  <div>
                    <label className="block text-[11px] text-admin-text-faint">Tiêu đề asset</label>
                    <p className="font-semibold text-admin-text mt-0.5">{selectedAsset.title}</p>
                  </div>

                  <div>
                    <label className="block text-[11px] text-admin-text-faint">Canonical Media ID</label>
                    <div className="flex items-center justify-between bg-admin-panel border border-admin-line rounded-lg px-2.5 py-1.5 mt-0.5">
                      <code className="text-admin-gold font-mono text-[11px] truncate flex-1 mr-1">
                        {selectedAsset.id}
                      </code>
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(selectedAsset.id, e)}
                        className="text-admin-text-faint hover:text-admin-text p-1 rounded"
                        title="Sao chép Media ID"
                      >
                        {copiedId === selectedAsset.id ? (
                          <CheckCircle2 size={13} className="text-green-600" />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-admin-line">
                    <div>
                      <span className="text-[11px] text-admin-text-faint">Kích thước:</span>
                      <p className="font-medium text-admin-text">
                        {selectedAsset.width && selectedAsset.height
                          ? `${selectedAsset.width} × ${selectedAsset.height} px`
                          : 'Không rõ'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-admin-text-faint">Dung lượng:</span>
                      <p className="font-medium text-admin-text">{formatFileSize(selectedAsset.file_size)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[11px] text-admin-text-faint">MIME type:</span>
                      <p className="font-medium text-admin-text truncate">{selectedAsset.mime_type || '—'}</p>
                    </div>
                    <div>
                      <span className="text-[11px] text-admin-text-faint">Nguồn lưu trữ:</span>
                      <p className="font-medium text-admin-text capitalize">{selectedAsset.source}</p>
                    </div>
                  </div>

                  {selectedAsset.default_focal_point && (
                    <div className="p-2 rounded-lg bg-admin-panel border border-admin-line flex items-center justify-between">
                      <span className="text-[11px] text-admin-text-dim">Focal mặc định:</span>
                      <span className="font-mono text-[11px] text-admin-gold font-semibold">
                        X: {selectedAsset.default_focal_point.x}% / Y: {selectedAsset.default_focal_point.y}%
                      </span>
                    </div>
                  )}

                  {selectedAsset.alt_i18n?.[locale] && (
                    <div>
                      <span className="text-[11px] text-admin-text-faint">Alt ({locale.toUpperCase()}):</span>
                      <p className="text-admin-text text-[11px] italic mt-0.5 line-clamp-2">
                        &ldquo;{selectedAsset.alt_i18n[locale]}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-admin-text-faint">
                <Layers size={36} className="mb-2 opacity-50" />
                <p className="text-xs font-medium text-admin-text-dim">Chưa chọn tệp media nào</p>
                <p className="text-[11px] mt-1">Nhấp vào một hình ảnh hoặc video bên trái để xem thông tin chi tiết.</p>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-4 mt-4 border-t border-admin-line flex flex-col gap-2">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedAsset}
                className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs ${
                  selectedAsset
                    ? 'bg-admin-gold hover:bg-[#a67433] text-[#241804] cursor-pointer'
                    : 'bg-admin-line text-admin-text-faint cursor-not-allowed'
                }`}
              >
                <Check size={16} strokeWidth={2.5} />
                Xác nhận chọn Media
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 rounded-xl text-xs font-medium text-admin-text-dim hover:text-admin-text hover:bg-admin-line transition-colors"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
