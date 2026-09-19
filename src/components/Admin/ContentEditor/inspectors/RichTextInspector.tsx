'use client';

import React from 'react';
import type { RichTextBlockProps, RichTextDocument, SupportedLocale } from '@/types/content';

export interface RichTextInspectorProps {
  props: RichTextBlockProps;
  activeLocale: SupportedLocale;
  onChange: (newProps: RichTextBlockProps) => void;
}

export function RichTextInspector({ props, activeLocale, onChange }: RichTextInspectorProps) {
  const currentDoc = props.content?.[activeLocale];
  const isPlainParagraphDocument = !currentDoc || currentDoc.content.every(
    (node) => node.type === 'paragraph' && (node.content || []).every(
      (child) => child.type === 'text' && !child.marks?.length && !child.content?.length,
    ),
  );

  // Extract raw text from doc
  const getRawText = (doc?: RichTextDocument) => {
    if (!doc?.content) return '';
    return doc.content
      .map((node) => {
        if (node.type === 'paragraph') {
          return node.content?.map((t) => t.text).join('') || '';
        }
        return '';
      })
      .join('\n\n');
  };

  const rawText = getRawText(currentDoc);

  // Convert plain text back to valid RichTextDocument AST
  const handleTextChange = (text: string) => {
    const paragraphs = text.split('\n\n');
    const newDoc: RichTextDocument = {
      type: 'doc',
      content: paragraphs.map((p) => ({
        type: 'paragraph',
        content: p ? [{ type: 'text', text: p }] : [],
      })),
    };

    onChange({
      ...props,
      content: {
        ...props.content,
        [activeLocale]: newDoc,
      },
    });
  };

  const paragraphCount = currentDoc?.content?.length || 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-medium text-admin-text-faint">
          Soạn thảo nội dung ({activeLocale.toUpperCase()})
        </label>
        <span className="text-[10px] font-mono text-admin-text-faint px-2 py-0.5 rounded bg-admin-panel-2 border border-admin-line">
          {paragraphCount} đoạn văn (AST node)
        </span>
      </div>

      <textarea
        rows={6}
        value={rawText}
        onChange={(e) => handleTextChange(e.target.value)}
        disabled={!isPlainParagraphDocument}
        placeholder={`Nhập các đoạn văn bản bằng tiếng ${activeLocale.toUpperCase()} (phân cách bằng 2 lần Enter)...`}
        className="w-full px-3.5 py-2.5 text-xs leading-relaxed bg-admin-panel border border-admin-line rounded-xl text-admin-text focus:outline-none focus:border-admin-gold focus:ring-1 focus:ring-admin-gold/30 font-sans"
      />

      {!isPlainParagraphDocument && (
        <p role="status" className="text-[11px] text-amber-700">
          Nội dung này có định dạng hoặc danh sách. Trình sửa văn bản đơn giản được khóa để tránh làm mất cấu trúc AST.
        </p>
      )}

      <div className="p-3 rounded-xl bg-admin-panel-2 border border-admin-line text-[11px] text-admin-text-dim space-y-1">
        <p className="font-semibold text-admin-text">Cấu trúc AST RichText chuẩn hóa:</p>
        <p className="text-admin-text-faint leading-snug">
          Văn bản được lưu trữ dưới dạng cây cú pháp trừu tượng (Doc Node). Tại Phase 4, trình soạn thảo Tiptap WYSIWYG sẽ gắn kết trực tiếp vào cấu trúc này.
        </p>
      </div>
    </div>
  );
}
