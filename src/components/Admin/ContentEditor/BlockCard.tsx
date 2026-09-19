'use client';

import React from 'react';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Heading,
  Type,
  Image as ImageIcon,
  Images,
  Quote,
  Video as VideoIcon,
  MousePointerClick,
  Minus,
} from 'lucide-react';
import type { ContentBlock, SupportedLocale } from '@/types/content';
import { resolveLocalizedValue } from '@/lib/content/resolveLocalizedValue';

export interface BlockCardProps {
  block: ContentBlock;
  index: number;
  totalBlocks: number;
  isSelected: boolean;
  activeLocale: SupportedLocale;
  onSelect: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function BlockCard({
  block,
  index,
  totalBlocks,
  isSelected,
  activeLocale,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onDelete,
  onToggleVisibility,
}: BlockCardProps) {
  const isVisibleInLocale = block.settings?.visibility?.[activeLocale] !== false;

  // Type metadata
  const getBlockMeta = () => {
    switch (block.type) {
      case 'heading':
        return {
          label: `Tiêu đề (H${block.props.level})`,
          icon: Heading,
          color: 'text-blue-600 bg-blue-50 border-blue-200',
        };
      case 'richText':
        return {
          label: 'Văn bản định dạng',
          icon: Type,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
        };
      case 'image':
        return {
          label: `Hình ảnh (${block.props.aspectRatio || '16:9'})`,
          icon: ImageIcon,
          color: 'text-amber-600 bg-amber-50 border-amber-200',
        };
      case 'gallery':
        return {
          label: `Bộ sưu tập (${block.props.items?.length || 0} ảnh)`,
          icon: Images,
          color: 'text-cyan-600 bg-cyan-50 border-cyan-200',
        };
      case 'quote':
        return {
          label: 'Trích dẫn',
          icon: Quote,
          color: 'text-orange-600 bg-orange-50 border-orange-200',
        };
      case 'video':
        return {
          label: `Video (${block.props.source.type})`,
          icon: VideoIcon,
          color: 'text-violet-600 bg-violet-50 border-violet-200',
        };
      case 'cta':
        return {
          label: 'Nút hành động (CTA)',
          icon: MousePointerClick,
          color: 'text-admin-gold bg-admin-gold-dim border-admin-gold/40',
        };
      case 'divider':
        return {
          label: `Phân cách (${block.props.style})`,
          icon: Minus,
          color: 'text-stone-600 bg-stone-100 border-stone-200',
        };
      default:
        return {
          label: 'Khối nội dung',
          icon: Type,
          color: 'text-gray-600 bg-gray-50 border-gray-200',
        };
    }
  };

  const meta = getBlockMeta();
  const Icon = meta.icon;

  // Excerpt calculation using canonical fallback resolver
  const renderExcerpt = () => {
    switch (block.type) {
      case 'heading': {
        const res = resolveLocalizedValue(block.props.text, activeLocale);
        const isFallback = res.locale && res.locale !== activeLocale;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-admin-text line-clamp-1">
              {res.value || <em className="text-admin-text-faint">Chưa có tiêu đề</em>}
            </span>
            {isFallback && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-admin-line text-admin-text-faint font-mono">
                fallback: {res.locale?.toUpperCase()}
              </span>
            )}
          </div>
        );
      }
      case 'image': {
        return (
          <div className="text-xs text-admin-text-dim flex items-center gap-3">
            <span>
              Media: <code className="font-mono text-admin-gold">{block.props.mediaId || '(chưa chọn)'}</code>
            </span>
            {block.props.focalPoint && (
              <span className="font-mono text-[11px] text-admin-text-faint">
                Focal: {block.props.focalPoint.x}%/{block.props.focalPoint.y}%
              </span>
            )}
            {block.props.zoom && block.props.zoom > 1 && (
              <span className="font-mono text-[11px] text-admin-text-faint">Zoom: {block.props.zoom}x</span>
            )}
          </div>
        );
      }
      case 'richText': {
        const resolution = resolveLocalizedValue(block.props.content, activeLocale);
        const doc = resolution.value;
        const firstP = doc?.content?.find((node) => node.type === 'paragraph');
        const textSnippet = firstP?.content?.map((t) => t.text).join('') || '';
        return (
          <div className="flex items-center gap-2">
            <p className="text-xs text-admin-text-dim line-clamp-2 leading-relaxed">
              {textSnippet || <em className="text-admin-text-faint">Nội dung văn bản trống...</em>}
            </p>
            {resolution.locale && resolution.locale !== activeLocale && (
              <span className="shrink-0 text-[10px] px-1.5 rounded bg-admin-line text-admin-text-faint font-mono">
                fallback: {resolution.locale.toUpperCase()}
              </span>
            )}
          </div>
        );
      }
      case 'quote': {
        const qRes = resolveLocalizedValue(block.props.quote, activeLocale);
        const aRes = resolveLocalizedValue(block.props.author, activeLocale);
        return (
          <p className="text-xs text-admin-text-dim italic line-clamp-1">
            &ldquo;{qRes.value || 'Trích dẫn...'}&rdquo; {aRes.value ? `— ${aRes.value}` : ''}
          </p>
        );
      }
      case 'gallery': {
        return (
          <div className="text-xs text-admin-text-dim flex items-center gap-2">
            <span>Bố cục: {block.props.layout}</span>
            <span>•</span>
            <span>{block.props.items?.length || 0} hình ảnh trong thư viện</span>
          </div>
        );
      }
      case 'video': {
        const src = block.props.source;
        return (
          <div className="text-xs text-admin-text-dim flex items-center gap-2">
            <span>
              Nguồn: {src.type === 'internal' ? `Media ID (${src.mediaId})` : src.url}
            </span>
            {block.props.autoplay && (
              <span className="text-[10px] px-1.5 rounded bg-admin-panel border border-admin-line text-admin-text-faint">
                Tự động phát
              </span>
            )}
          </div>
        );
      }
      case 'cta': {
        const tRes = resolveLocalizedValue(block.props.title, activeLocale);
        const bRes = resolveLocalizedValue(block.props.buttonText, activeLocale);
        return (
          <div className="text-xs text-admin-text-dim flex items-center gap-3">
            <span className="font-semibold text-admin-text line-clamp-1">{tRes.value || 'Tiêu đề CTA'}</span>
            <span className="px-2 py-0.5 rounded bg-admin-gold-dim text-admin-gold font-bold text-[11px]">
              [{bRes.value || 'Nút bấm'}]
            </span>
            <span className="text-admin-text-faint truncate max-w-[150px]">{block.props.buttonUrl}</span>
          </div>
        );
      }
      case 'divider': {
        return (
          <div className="text-xs text-admin-text-faint flex items-center gap-2">
            <span className="w-12 h-px bg-admin-line-strong" />
            <span className="font-mono text-[11px]">{block.props.style}</span>
            <span className="w-12 h-px bg-admin-line-strong" />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(block.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(block.id);
        }
      }}
      className={`group relative rounded-2xl border transition-all text-left overflow-hidden cursor-pointer ${
        isSelected
          ? 'border-admin-gold ring-2 ring-admin-gold/30 bg-admin-amber-a/25 shadow-md'
          : 'border-admin-line bg-admin-panel hover:border-admin-gold/50 hover:bg-admin-panel-2 hover:shadow-xs'
      } ${!isVisibleInLocale ? 'opacity-60 border-dashed' : ''}`}
    >
      <div className="p-4 sm:p-5 flex items-start gap-3">
        {/* Drag Handle Indicator (prepared for Phase 4 DnD) */}
        <div
          className="mt-1 p-1 rounded text-admin-text-faint group-hover:text-admin-text-dim cursor-grab active:cursor-grabbing hover:bg-admin-line transition-colors shrink-0"
          title="Kéo thả sắp xếp (Phase 4 @dnd-kit)"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </div>

        {/* Index Number */}
        <span className="mt-1 font-mono text-xs font-bold text-admin-text-faint w-5 text-center shrink-0">
          #{index + 1}
        </span>

        {/* Main Content Info */}
        <div className="flex-1 min-w-0 pr-2">
          {/* Top Row: Type badge + Block ID + Visibility */}
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold border ${meta.color}`}
            >
              <Icon size={12} />
              {meta.label}
            </span>

            <code className="text-[10px] font-mono text-admin-text-faint bg-admin-panel-2 px-1.5 py-0.5 rounded border border-admin-line">
              {block.id}
            </code>

            {!isVisibleInLocale && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-admin-line text-admin-text-faint font-medium">
                <EyeOff size={10} /> Ẩn ở {activeLocale.toUpperCase()}
              </span>
            )}
          </div>

          {/* Excerpt / Summary */}
          <div className="mt-1">{renderExcerpt()}</div>
        </div>

        {/* Action Buttons Toolbar */}
        <div
          className="flex items-center gap-1 shrink-0 self-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Toggle visibility */}
          <button
            type="button"
            onClick={() => onToggleVisibility(block.id)}
            className={`p-1.5 rounded-lg transition-colors ${
              isVisibleInLocale
                ? 'text-admin-text-faint hover:text-admin-text hover:bg-admin-line'
                : 'text-amber-700 bg-amber-100 hover:bg-amber-200'
            }`}
            title={isVisibleInLocale ? `Ẩn khối này ở ngôn ngữ ${activeLocale.toUpperCase()}` : `Hiện khối này ở ngôn ngữ ${activeLocale.toUpperCase()}`}
            aria-label={isVisibleInLocale ? `Ẩn khối ở ${activeLocale.toUpperCase()}` : `Hiện khối ở ${activeLocale.toUpperCase()}`}
          >
            {isVisibleInLocale ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>

          {/* Move Up */}
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMoveUp(index)}
            className="p-1.5 rounded-lg text-admin-text-faint hover:text-admin-text hover:bg-admin-line disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="Di chuyển lên"
            aria-label="Di chuyển khối lên"
          >
            <ChevronUp size={15} />
          </button>

          {/* Move Down */}
          <button
            type="button"
            disabled={index === totalBlocks - 1}
            onClick={() => onMoveDown(index)}
            className="p-1.5 rounded-lg text-admin-text-faint hover:text-admin-text hover:bg-admin-line disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
            title="Di chuyển xuống"
            aria-label="Di chuyển khối xuống"
          >
            <ChevronDown size={15} />
          </button>

          {/* Duplicate */}
          <button
            type="button"
            onClick={() => onDuplicate(block.id)}
            className="p-1.5 rounded-lg text-admin-text-faint hover:text-admin-text hover:bg-admin-line transition-colors"
            title="Nhân bản khối này"
            aria-label="Nhân bản khối"
          >
            <Copy size={15} />
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(block.id)}
            className="p-1.5 rounded-lg text-admin-text-faint hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xóa khối"
            aria-label="Xóa khối"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
