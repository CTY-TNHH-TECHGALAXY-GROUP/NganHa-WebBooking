'use client';

import React, { useEffect, useState, useCallback } from 'react';
import MediaPreviewModal from './MediaPreviewModal';
import { useTranslation } from '@/components/TranslationProvider';

interface PreviewData {
  isOpen: boolean;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  title?: string;
  description?: string;
}

export default function GlobalImagePreview() {
  const { currentLang } = useTranslation();
  const [preview, setPreview] = useState<PreviewData>({
    isOpen: false,
    mediaUrl: '',
    mediaType: 'image',
    title: '',
    description: '',
  });

  const handleClose = useCallback(() => {
    setPreview((prev) => ({ ...prev, isOpen: false }));
  }, []);

  useEffect(() => {
    // 1. Listen for custom programmatic preview events
    const handleCustomOpen = (e: Event) => {
      const customEvent = e as CustomEvent<{
        mediaUrl: string;
        mediaType?: 'image' | 'video';
        title?: string;
        description?: string;
      }>;
      if (customEvent.detail?.mediaUrl) {
        setPreview({
          isOpen: true,
          mediaUrl: customEvent.detail.mediaUrl,
          mediaType: customEvent.detail.mediaType || 'image',
        });
      }
    };

    window.addEventListener('open-media-preview', handleCustomOpen);

    // 2. Global click interceptor
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Never intercept inside an already open preview dialog or its close button
      if (target.closest('[role="dialog"]') || target.closest('button[aria-label="Close"]')) {
        return;
      }

      // Check if target is an image, watermark overlay, or photo container
      let img: HTMLImageElement | null = null;
      if (target.tagName.toLowerCase() === 'img') {
        img = target as HTMLImageElement;
      } else if (target.classList.contains('media-watermark') || target.tagName.toLowerCase() === 'figcaption') {
        img = target.parentElement?.querySelector('img') || null;
      } else {
        const container = target.closest('figure, [class*="filmFrame"], [class*="facilityImageFrame"], [class*="storyPhotoFrame"], [class*="highlightSlide"], [class*="highlightImgWrap"], [class*="filmScroller"], [class*="pillarMedia"], [class*="thumb"]');
        if (container) {
          img = container.querySelector('img');
        }
      }

      if (!img) return;

      // Exclusions:
      // A. Explicit no-preview attribute
      if (img.hasAttribute('data-no-preview') || img.closest('[data-no-preview="true"]')) {
        return;
      }

      // B. Admin routes
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        return;
      }

      // C. Tiny icons, flags, badges (< 38px)
      const rect = img.getBoundingClientRect();
      if (rect.width < 38 || rect.height < 38) {
        return;
      }

      // D. Header branding logo
      if (img.closest('header') && (img.alt?.toLowerCase().includes('logo') || img.src?.toLowerCase().includes('logo'))) {
        return;
      }

      // E. Form buttons / action controls
      const btn = target.closest('button');
      if (btn && (
        btn.type === 'submit' ||
        btn.getAttribute('aria-label')?.includes('Decrease') ||
        btn.getAttribute('aria-label')?.includes('Increase') ||
        btn.getAttribute('aria-label')?.includes('quantity') ||
        btn.getAttribute('aria-label')?.includes('Add service')
      )) {
        return;
      }

      // F. External navigation links that are not photo wrappers
      const link = target.closest('a');
      if (link && link.getAttribute('href') && !link.getAttribute('href')?.startsWith('#') && link.getAttribute('href') !== 'javascript:void(0)' && !link.classList.contains('cursor-zoom-in')) {
        if (link.textContent && link.textContent.trim().length > 20) {
          return;
        }
      }

      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:image/svg') || src.includes('placeholder.co')) {
        return;
      }

      // Intercept and open modal
      e.preventDefault();
      e.stopPropagation();

      setPreview({
        isOpen: true,
        mediaUrl: src,
        mediaType: 'image',
      });
    };

    // Capture phase listener
    document.addEventListener('click', handleGlobalClick, { capture: true });

    return () => {
      window.removeEventListener('open-media-preview', handleCustomOpen);
      document.removeEventListener('click', handleGlobalClick, { capture: true });
    };
  }, []);

  if (!preview.isOpen || !preview.mediaUrl) return null;

  return (
    <MediaPreviewModal
      isOpen={preview.isOpen}
      onClose={handleClose}
      mediaUrl={preview.mediaUrl}
      mediaType={preview.mediaType}
      lang={currentLang}
    />
  );
}
