'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2 } from 'lucide-react';

interface MediaPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaUrl: string;
  mediaType?: 'image' | 'video';
  poster?: string;
  title?: string;
  description?: string;
  lang?: string;
}

export default function MediaPreviewModal({
  isOpen,
  onClose,
  mediaUrl,
  mediaType = 'image',
  poster,
  title,
  description,
  lang = 'vi',
}: MediaPreviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset loading state whenever mediaUrl changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen, mediaUrl]);

  // Lock body scroll & listen for Escape key
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen || !mediaUrl) return null;

  const isVideo = mediaType === 'video';

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Media preview'}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/92 backdrop-blur-md p-3 sm:p-6 transition-opacity duration-300"
      onClick={onClose}
    >
      {/* Top right "X" close button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onTouchEnd={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/70 hover:bg-black/95 border border-[#C9A96E]/40 text-[#f7ebc7] hover:text-white flex items-center justify-center transition-all duration-200 z-[100000] cursor-pointer shadow-2xl hover:scale-105 active:scale-95 group focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        aria-label="Close"
      >
        <X size={24} strokeWidth={2.2} className="transition-transform group-hover:rotate-90 duration-200" />
      </button>

      {/* Main modal container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative max-w-5xl max-h-[92vh] w-full flex flex-col items-center justify-center"
      >
        {/* Media box */}
        <div className="relative overflow-hidden rounded-2xl border border-[#C9A96E]/30 bg-neutral-950 shadow-2xl flex items-center justify-center max-h-[78vh] w-auto max-w-full">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-xs z-10 pointer-events-none">
              <Loader2 className="w-8 h-8 text-[#C9A96E] animate-spin" />
            </div>
          )}

          {isVideo ? (
            <video
              src={mediaUrl}
              poster={poster}
              controls
              autoPlay
              playsInline
              loop
              onCanPlay={() => setIsLoading(false)}
              onLoadedData={() => setIsLoading(false)}
              className="max-h-[78vh] max-w-full w-auto h-auto object-contain rounded-2xl"
            />
          ) : (
            <img
              src={mediaUrl}
              alt={title || 'Full screen preview'}
              onLoad={() => setIsLoading(false)}
              ref={(node) => {
                if (node && node.complete && isLoading) {
                  setIsLoading(false);
                }
              }}
              onError={(e) => {
                setIsLoading(false);
                if (poster && e.currentTarget.src !== poster) {
                  e.currentTarget.src = poster;
                }
              }}
              className="max-h-[78vh] max-w-full w-auto h-auto object-contain rounded-2xl transition-opacity duration-300"
            />
          )}
        </div>

        {/* Title & Description caption */}
        {(title || description) && (
          <div className="mt-3 sm:mt-4 text-center px-4 max-w-2xl">
            {title && (
              <h3 className="text-[#D4AF37] font-bold text-base sm:text-lg tracking-wide font-luxury drop-shadow-md">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-gray-300 text-xs sm:text-sm mt-1 leading-relaxed opacity-90 line-clamp-3">
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
