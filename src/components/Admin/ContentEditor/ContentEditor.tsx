'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  Globe,
  Sliders,
  Plus,
  RotateCcw,
  FileCode,
  CheckCircle,
  Clock,
  Sparkles,
  Layers,
  ArrowLeft,
  Save,
} from 'lucide-react';
import type {
  ContentDocument,
  ContentBlock,
  SupportedLocale,
  FocalPoint,
} from '@/types/content';
import { SUPPORTED_LOCALES } from '@/types/content';
import { contentDocumentSchema } from '@/lib/content/schemas';
import { INITIAL_MOCK_DOCUMENT } from './initialMockDocument';
import { BlockToolbar } from './BlockToolbar';
import { BlockList } from './BlockList';
import { BlockInspector } from './BlockInspector';
import { MediaPickerModal } from '../MediaPicker/MediaPickerModal';
import { ImagePositionModal } from '../ImagePositionEditor/ImagePositionModal';
import { getMockMediaAsset } from '../MediaPicker/mockMedia';
import { createDefaultBlock, generateContentId } from './blockFactory';

export interface ContentEditorProps {
  initialDocument?: ContentDocument;
  onSaveMock?: (doc: ContentDocument) => void;
  documentTitle?: string;
  backHref?: string;
}

export function ContentEditor({
  initialDocument = INITIAL_MOCK_DOCUMENT,
  onSaveMock,
  documentTitle = 'Bài viết: Trải nghiệm Oria Holistic Healing',
  backHref = '/admin/posts',
}: ContentEditorProps) {
  // Local state for ContentDocument
  const [doc, setDoc] = useState<ContentDocument>(initialDocument);
  const [selectedBlockId, setSelectedBlockId] = useState<string | undefined>(
    () => initialDocument.blocks[0]?.id,
  );
  const [activeLocale, setActiveLocale] = useState<SupportedLocale>('vi');
  const [isDirty, setIsDirty] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modals & Panels state
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    'image' | 'gallery' | 'video' | 'video-poster' | null
  >(null);

  const [isPositionEditorOpen, setIsPositionEditorOpen] = useState(false);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const jsonDialogRef = useRef<HTMLDivElement>(null);
  const jsonCloseButtonRef = useRef<HTMLButtonElement>(null);
  const jsonTitleId = useId();

  // Mobile / Tablet Tab Switcher: 'canvas' | 'toolbar' | 'inspector'
  const [mobileActiveTab, setMobileActiveTab] = useState<'canvas' | 'toolbar' | 'inspector'>('canvas');

  // Currently selected block
  const selectedBlock = useMemo(() => {
    return doc.blocks.find((b) => b.id === selectedBlockId);
  }, [doc.blocks, selectedBlockId]);

  useEffect(() => {
    if (!isJsonModalOpen) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => jsonCloseButtonRef.current?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsJsonModalOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !jsonDialogRef.current) return;
      const focusable = Array.from(jsonDialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )).filter((element) => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!jsonDialogRef.current.contains(document.activeElement)
        || (event.shiftKey && document.activeElement === first)
        || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [isJsonModalOpen]);

  // Block Mutation Operations
  const handleInsertBlockAt = (index: number, type: ContentBlock['type']) => {
    const newBlock = createDefaultBlock(type, activeLocale);
    const updated = [...doc.blocks];
    updated.splice(index, 0, newBlock);

    setDoc({ ...doc, blocks: updated });
    setSelectedBlockId(newBlock.id);
    setIsDirty(true);
    setMobileActiveTab('inspector');
  };

  const handleInsertBlockFromToolbar = (type: ContentBlock['type']) => {
    if (selectedBlockId) {
      const idx = doc.blocks.findIndex((b) => b.id === selectedBlockId);
      if (idx !== -1) {
        handleInsertBlockAt(idx + 1, type);
        return;
      }
    }
    handleInsertBlockAt(doc.blocks.length, type);
  };

  const handleUpdateBlock = (updated: ContentBlock) => {
    setDoc({
      ...doc,
      blocks: doc.blocks.map((b) => (b.id === updated.id ? updated : b)),
    });
    setIsDirty(true);
  };

  const handleDeleteBlock = (id: string) => {
    const updated = doc.blocks.filter((b) => b.id !== id);
    setDoc({ ...doc, blocks: updated });
    if (selectedBlockId === id) {
      setSelectedBlockId(updated[0]?.id);
    }
    setIsDirty(true);
  };

  const handleDuplicateBlock = (id: string) => {
    const idx = doc.blocks.findIndex((b) => b.id === id);
    if (idx === -1) return;

    const source = doc.blocks[idx];
    const cloned: ContentBlock = {
      ...JSON.parse(JSON.stringify(source)),
      id: generateContentId(`blk-${source.type.slice(0, 4)}`),
    };

    const updated = [...doc.blocks];
    updated.splice(idx + 1, 0, cloned);
    setDoc({ ...doc, blocks: updated });
    setSelectedBlockId(cloned.id);
    setIsDirty(true);
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...doc.blocks];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setDoc({ ...doc, blocks: updated });
    setIsDirty(true);
  };

  const handleMoveDown = (index: number) => {
    if (index >= doc.blocks.length - 1) return;
    const updated = [...doc.blocks];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setDoc({ ...doc, blocks: updated });
    setIsDirty(true);
  };

  const handleToggleVisibility = (id: string) => {
    const target = doc.blocks.find((b) => b.id === id);
    if (!target) return;

    const currentVis = target.settings?.visibility?.[activeLocale] !== false;
    const updatedSettings = {
      ...target.settings,
      visibility: {
        ...target.settings?.visibility,
        [activeLocale]: !currentVis,
      },
    };

    handleUpdateBlock({ ...target, settings: updatedSettings });
  };

  // Media Picker Callback
  const handleMediaSelected = (mediaId: string) => {
    if (!selectedBlock) return;

    if (mediaPickerTarget === 'image' && selectedBlock.type === 'image') {
      handleUpdateBlock({
        ...selectedBlock,
        props: {
          ...selectedBlock.props,
          mediaId,
        },
      });
    } else if (mediaPickerTarget === 'gallery' && selectedBlock.type === 'gallery') {
      const items = selectedBlock.props.items || [];
      handleUpdateBlock({
        ...selectedBlock,
        props: {
          ...selectedBlock.props,
          items: [...items, { id: generateContentId('item'), mediaId }],
        },
      });
    } else if (mediaPickerTarget === 'video' && selectedBlock.type === 'video') {
      handleUpdateBlock({
        ...selectedBlock,
        props: {
          ...selectedBlock.props,
          source: { type: 'internal', mediaId },
        },
      });
    } else if (mediaPickerTarget === 'video-poster' && selectedBlock.type === 'video') {
      handleUpdateBlock({
        ...selectedBlock,
        props: {
          ...selectedBlock.props,
          posterMediaId: mediaId,
        },
      });
    }
  };

  // Image Focal & Zoom Save Callback
  const handleSavePosition = (focalPoint: FocalPoint, zoom: number) => {
    if (!selectedBlock || selectedBlock.type !== 'image') return;
    handleUpdateBlock({
      ...selectedBlock,
      props: {
        ...selectedBlock.props,
        focalPoint,
        zoom,
      },
    });
  };

  const activeImageBlock = selectedBlock?.type === 'image' ? selectedBlock : null;
  const activeImageAsset = activeImageBlock ? getMockMediaAsset(activeImageBlock.props.mediaId) : null;

  return (
    <div className="min-h-screen bg-admin-bg text-admin-text flex flex-col">
      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-admin-panel border-b border-admin-line shadow-xs">
        <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Left: Breadcrumbs & Status */}
          <div className="flex items-center gap-3">
            <a
              href={backHref}
              className="p-2 rounded-xl text-admin-text-faint hover:text-admin-text hover:bg-admin-line transition-colors flex items-center gap-1 text-xs"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Quay lại</span>
            </a>

            <div className="h-4 w-px bg-admin-line hidden sm:block" />

            <div>
              <div className="flex items-center gap-2">
                <span className="text-admin-gold font-serif text-sm">✦</span>
                <h1 className="text-sm font-bold text-admin-text line-clamp-1">{documentTitle}</h1>
                <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-admin-gold-dim text-admin-gold border border-admin-gold/30">
                  Schema v1.0.0
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-admin-text-faint mt-0.5">
                <span>{doc.blocks.length} khối nội dung</span>
                <span>•</span>
                {isDirty ? (
                  <span className="text-amber-600 flex items-center gap-1 font-medium">
                    <Clock size={11} /> Có thay đổi chưa lưu (Mock)
                  </span>
                ) : (
                  <span className="text-green-700 flex items-center gap-1 font-medium">
                    <CheckCircle size={11} /> Đã đồng bộ với Contract
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Center: Multilingual Tabs (Single shared block tree) */}
          <div className="flex items-center gap-1 bg-admin-panel-2 border border-admin-line p-1 rounded-xl">
            <Globe size={14} className="text-admin-gold ml-2 mr-1 hidden sm:inline" />
            {SUPPORTED_LOCALES.map((loc) => {
              const isActive = loc === activeLocale;
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => setActiveLocale(loc)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    isActive
                      ? 'bg-admin-gold text-[#241804] shadow-xs'
                      : 'text-admin-text-dim hover:text-admin-text hover:bg-admin-panel'
                  }`}
                  title={`Chuyển sang soạn thảo ngôn ngữ ${loc.toUpperCase()}`}
                >
                  {loc.toUpperCase()}
                </button>
              );
            })}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsJsonModalOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-admin-line text-admin-text text-xs font-semibold hover:border-admin-gold hover:bg-admin-panel-2 transition-all flex items-center gap-1.5"
              title="Xem cấu trúc JSON theo Content Contract V1"
            >
              <FileCode size={14} className="text-admin-gold" />
              <span className="hidden sm:inline">JSON Contract</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const result = contentDocumentSchema.safeParse(doc);
                if (!result.success) {
                  setValidationError(result.error.issues[0]?.message || 'ContentDocument không hợp lệ.');
                  return;
                }
                onSaveMock?.(doc);
                setValidationError(null);
                setIsDirty(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-admin-gold hover:bg-[#a67433] text-[#241804] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              title="Lưu bản nháp tạm thời vào bộ nhớ cục bộ"
            >
              <Save size={14} />
              <span className="hidden sm:inline">Lưu Mock</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDoc(initialDocument);
                setSelectedBlockId(initialDocument.blocks[0]?.id);
                setValidationError(null);
                setIsDirty(false);
              }}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-admin-line text-admin-text-dim text-xs font-semibold hover:text-admin-text hover:bg-admin-panel-2 transition-all flex items-center gap-1"
              title="Khôi phục dữ liệu mẫu ban đầu"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Đặt lại</span>
            </button>
          </div>
        </div>
      </header>

      {validationError && (
        <div role="alert" className="px-4 sm:px-6 py-2 bg-red-950 text-red-100 text-xs">
          Không thể lưu Mock: {validationError}
        </div>
      )}

      {/* Mobile / Tablet Tab Navigation Bar */}
      <div className="xl:hidden bg-admin-panel border-b border-admin-line px-4 py-2 flex items-center justify-around text-xs font-semibold">
        <button
          type="button"
          onClick={() => setMobileActiveTab('toolbar')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ${
            mobileActiveTab === 'toolbar' ? 'bg-admin-gold text-[#241804]' : 'text-admin-text-dim'
          }`}
        >
          <Plus size={14} /> Thêm khối
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveTab('canvas')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ${
            mobileActiveTab === 'canvas' ? 'bg-admin-gold text-[#241804]' : 'text-admin-text-dim'
          }`}
        >
          <Layers size={14} /> Khối ({doc.blocks.length})
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveTab('inspector')}
          className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 ${
            mobileActiveTab === 'inspector' ? 'bg-admin-gold text-[#241804]' : 'text-admin-text-dim'
          }`}
        >
          <Sliders size={14} /> Cài đặt
        </button>
      </div>

      {/* Main 3-Panel Workspace */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Block Toolbar (3 cols on desktop) */}
        <div
          className={`xl:col-span-3 xl:block sticky top-20 ${
            mobileActiveTab === 'toolbar' ? 'block' : 'hidden xl:block'
          }`}
        >
          <BlockToolbar onInsertBlock={handleInsertBlockFromToolbar} />

          {/* Guidance note */}
          <div className="mt-4 p-4 rounded-2xl bg-admin-panel border border-admin-line text-admin-text-dim text-xs space-y-2">
            <h4 className="font-bold text-admin-text flex items-center gap-1">
              <Sparkles size={13} className="text-admin-gold" /> Nguyên tắc kiến trúc
            </h4>
            <p className="text-[11px] leading-relaxed text-admin-text-faint">
              Một cây khối duy nhất cho mọi ngôn ngữ. Đổi tab ngôn ngữ ở trên chỉ đổi giá trị chuỗi hiển thị, bảo toàn thứ tự và liên kết Media ID.
            </p>
          </div>
        </div>

        {/* CENTER COLUMN: Ordered Block List Canvas (5 cols on desktop) */}
        <div
          className={`xl:col-span-5 ${
            mobileActiveTab === 'canvas' ? 'block' : 'hidden xl:block'
          }`}
        >
          <div className="bg-admin-panel border border-admin-line rounded-2xl p-4 sm:p-6 shadow-xs mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-admin-text">Khu vực sắp xếp khối nội dung</h2>
              <p className="text-xs text-admin-text-faint mt-0.5">
                Xem dạng danh sách tuần tự (Chuẩn bị kéo thả tại Phase 4)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-admin-gold bg-admin-gold-dim px-2 py-0.5 rounded-md">
              Đang xem: {activeLocale.toUpperCase()}
            </span>
          </div>

          <BlockList
            blocks={doc.blocks}
            selectedBlockId={selectedBlockId}
            activeLocale={activeLocale}
            onSelectBlock={(id) => {
              setSelectedBlockId(id);
              setMobileActiveTab('inspector');
            }}
            onMoveUp={handleMoveUp}
            onMoveDown={handleMoveDown}
            onDuplicate={handleDuplicateBlock}
            onDelete={handleDeleteBlock}
            onToggleVisibility={handleToggleVisibility}
            onInsertAt={handleInsertBlockAt}
          />
        </div>

        {/* RIGHT COLUMN: Selected Block Inspector (4 cols on desktop) */}
        <div
          className={`xl:col-span-4 xl:block sticky top-20 min-h-[500px] ${
            mobileActiveTab === 'inspector' ? 'block' : 'hidden xl:block'
          }`}
        >
          <BlockInspector
            block={selectedBlock}
            activeLocale={activeLocale}
            onUpdateBlock={handleUpdateBlock}
            onDeleteBlock={handleDeleteBlock}
            onCloseMobileInspector={() => setMobileActiveTab('canvas')}
            onOpenMediaPickerForImage={() => {
              setMediaPickerTarget('image');
              setIsMediaPickerOpen(true);
            }}
            onOpenPositionEditorForImage={() => {
              if (activeImageBlock) {
                setIsPositionEditorOpen(true);
              }
            }}
            onOpenMediaPickerForGallery={() => {
              setMediaPickerTarget('gallery');
              setIsMediaPickerOpen(true);
            }}
            onOpenMediaPickerForVideo={() => {
              setMediaPickerTarget('video');
              setIsMediaPickerOpen(true);
            }}
            onOpenMediaPickerForPoster={() => {
              setMediaPickerTarget('video-poster');
              setIsMediaPickerOpen(true);
            }}
          />
        </div>
      </div>

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => {
          setIsMediaPickerOpen(false);
          setMediaPickerTarget(null);
        }}
        onSelect={handleMediaSelected}
        currentMediaId={
          mediaPickerTarget === 'image'
            ? activeImageBlock?.props.mediaId
            : undefined
        }
        allowedTypes={mediaPickerTarget === 'video' ? ['video'] : ['image']}
        locale={activeLocale}
      />

      {/* Image Position Modal */}
      {activeImageBlock && activeImageAsset && (
        <ImagePositionModal
          isOpen={isPositionEditorOpen}
          onClose={() => setIsPositionEditorOpen(false)}
          onSave={handleSavePosition}
          imageUrl={activeImageAsset.url}
          initialFocalPoint={activeImageBlock.props.focalPoint}
          initialZoom={activeImageBlock.props.zoom}
          aspectRatio={activeImageBlock.props.aspectRatio}
        />
      )}

      {/* JSON Contract Inspector Modal */}
      {isJsonModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={jsonTitleId}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsJsonModalOpen(false);
          }}
        >
          <div ref={jsonDialogRef} className="bg-admin-panel border border-admin-line-strong rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-admin-line flex items-center justify-between">
              <div>
                <h3 id={jsonTitleId} className="text-sm font-bold text-admin-text flex items-center gap-2">
                  <FileCode size={16} className="text-admin-gold" />
                  Cấu trúc ContentDocument JSON (Contract v1.0.0)
                </h3>
                <p className="text-xs text-admin-text-faint mt-0.5">
                  Kiểm tra tính tương thích với định dạng đã đóng băng của Codex Phase 1.
                </p>
              </div>
              <button
                ref={jsonCloseButtonRef}
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="p-1.5 rounded-lg text-admin-text-faint hover:text-admin-text"
                aria-label="Đóng cửa sổ JSON Contract"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 bg-slate-950 font-mono text-xs text-emerald-400">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(doc, null, 2)}
              </pre>
            </div>

            <div className="px-6 py-3 border-t border-admin-line bg-admin-panel flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(doc, null, 2));
                  alert('Đã sao chép cấu trúc JSON vào bộ nhớ đệm!');
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-admin-gold text-[#241804] hover:bg-[#a67433] transition-colors cursor-pointer"
              >
                Sao chép JSON
              </button>
              <button
                type="button"
                onClick={() => setIsJsonModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-admin-line text-admin-text-dim hover:text-admin-text transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
