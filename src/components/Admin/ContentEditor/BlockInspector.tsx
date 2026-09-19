'use client';

import React from 'react';
import { Sliders, X, Trash2, Layers } from 'lucide-react';
import type { ContentBlock, SupportedLocale } from '@/types/content';
import { BaseSettingsInspector } from './inspectors/BaseSettingsInspector';
import { HeadingInspector } from './inspectors/HeadingInspector';
import { RichTextInspector } from './inspectors/RichTextInspector';
import { ImageInspector } from './inspectors/ImageInspector';
import { GalleryInspector } from './inspectors/GalleryInspector';
import { QuoteInspector } from './inspectors/QuoteInspector';
import { VideoInspector } from './inspectors/VideoInspector';
import { CTAInspector } from './inspectors/CTAInspector';
import { DividerInspector } from './inspectors/DividerInspector';

export interface BlockInspectorProps {
  block?: ContentBlock;
  activeLocale: SupportedLocale;
  onUpdateBlock: (updatedBlock: ContentBlock) => void;
  onDeleteBlock: (id: string) => void;
  onCloseMobileInspector?: () => void;
  onOpenMediaPickerForImage: () => void;
  onOpenPositionEditorForImage: () => void;
  onOpenMediaPickerForGallery: () => void;
  onOpenMediaPickerForVideo: () => void;
  onOpenMediaPickerForPoster: () => void;
}

export function BlockInspector({
  block,
  activeLocale,
  onUpdateBlock,
  onDeleteBlock,
  onCloseMobileInspector,
  onOpenMediaPickerForImage,
  onOpenPositionEditorForImage,
  onOpenMediaPickerForGallery,
  onOpenMediaPickerForVideo,
  onOpenMediaPickerForPoster,
}: BlockInspectorProps) {
  if (!block) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 text-admin-text-faint bg-admin-panel border border-admin-line rounded-2xl">
        <div className="w-12 h-12 rounded-2xl bg-admin-panel-2 border border-admin-line flex items-center justify-center text-admin-text-faint mb-3">
          <Layers size={22} className="opacity-60" />
        </div>
        <h3 className="text-sm font-bold text-admin-text">Chưa chọn khối nội dung</h3>
        <p className="text-xs text-admin-text-dim max-w-[220px] mt-1 leading-relaxed">
          Nhấp vào bất kỳ khối nào trong danh sách ở giữa để cấu hình thuộc tính và nội dung đa ngôn ngữ.
        </p>
      </div>
    );
  }

  const renderSpecificInspector = () => {
    switch (block.type) {
      case 'heading':
        return (
          <HeadingInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
          />
        );
      case 'richText':
        return (
          <RichTextInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
          />
        );
      case 'image':
        return (
          <ImageInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
            onOpenMediaPicker={onOpenMediaPickerForImage}
            onOpenPositionEditor={onOpenPositionEditorForImage}
          />
        );
      case 'gallery':
        return (
          <GalleryInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
            onOpenMediaPickerForGallery={onOpenMediaPickerForGallery}
          />
        );
      case 'quote':
        return (
          <QuoteInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
          />
        );
      case 'video':
        return (
          <VideoInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
            onOpenMediaPickerForVideo={onOpenMediaPickerForVideo}
            onOpenMediaPickerForPoster={onOpenMediaPickerForPoster}
          />
        );
      case 'cta':
        return (
          <CTAInspector
            props={block.props}
            activeLocale={activeLocale}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
          />
        );
      case 'divider':
        return (
          <DividerInspector
            props={block.props}
            onChange={(newProps) => onUpdateBlock({ ...block, props: newProps })}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-admin-panel border border-admin-line rounded-2xl flex flex-col h-full overflow-hidden shadow-xs">
      {/* Inspector Header */}
      <div className="px-5 py-4 border-b border-admin-line bg-admin-panel flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sliders size={16} className="text-admin-gold" />
            <h2 className="text-sm font-bold text-admin-text capitalize">
              Cài đặt khối: {block.type}
            </h2>
          </div>
          <code className="text-[10px] font-mono text-admin-text-faint mt-0.5 block">
            ID: {block.id}
          </code>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onDeleteBlock(block.id)}
            className="p-1.5 rounded-lg text-admin-text-faint hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Xóa khối này"
          >
            <Trash2 size={16} />
          </button>
          {onCloseMobileInspector && (
            <button
              type="button"
              onClick={onCloseMobileInspector}
              className="lg:hidden p-1.5 rounded-lg text-admin-text-faint hover:text-admin-text transition-colors"
              title="Đóng bảng cài đặt"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 p-5 overflow-y-auto space-y-6">
        {/* Block specific controls */}
        {renderSpecificInspector()}

        {/* Common base settings */}
        <BaseSettingsInspector
          settings={block.settings}
          activeLocale={activeLocale}
          onChange={(newSettings) => onUpdateBlock({ ...block, settings: newSettings })}
        />
      </div>
    </div>
  );
}
