'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import {
  X,
  Crosshair,
  ZoomIn,
  RotateCcw,
  Check,
  Maximize2,
  Info,
} from 'lucide-react';
import type { FocalPoint, ImageAspectRatio } from '@/types/content';

export interface ImagePositionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (focalPoint: FocalPoint, zoom: number) => void;
  imageUrl: string;
  initialFocalPoint?: FocalPoint;
  initialZoom?: number;
  aspectRatio?: ImageAspectRatio;
  title?: string;
}

export function ImagePositionModal({
  isOpen,
  onClose,
  onSave,
  imageUrl,
  initialFocalPoint = { x: 50, y: 50 },
  initialZoom = 1.0,
  aspectRatio = '16:9',
  title = 'Căn chỉnh Góc nhìn & Tiêu điểm (Focal Point)',
}: ImagePositionModalProps) {
  const [focal, setFocal] = useState<FocalPoint>({
    x: Math.min(100, Math.max(0, initialFocalPoint?.x ?? 50)),
    y: Math.min(100, Math.max(0, initialFocalPoint?.y ?? 50)),
  });
  const [zoom, setZoom] = useState<number>(() => {
    const raw = initialZoom ?? 1.0;
    return Math.min(2.0, Math.max(1.0, Math.round(raw * 20) / 20));
  });

  const frameRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const titleId = useId();

  // Reset local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFocal({
        x: Math.min(100, Math.max(0, initialFocalPoint?.x ?? 50)),
        y: Math.min(100, Math.max(0, initialFocalPoint?.y ?? 50)),
      });
      const raw = initialZoom ?? 1.0;
      setZoom(Math.min(2.0, Math.max(1.0, Math.round(raw * 20) / 20)));
    }
  }, [isOpen, initialFocalPoint, initialZoom]);

  // Keyboard accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const updateCoordinatesFromPointer = (clientX: number, clientY: number) => {
    if (!frameRef.current) return;
    const rect = frameRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const relX = ((clientX - rect.left) / rect.width) * 100;
    const relY = ((clientY - rect.top) / rect.height) * 100;

    const clampedX = Math.round(Math.min(100, Math.max(0, relX)) * 10) / 10;
    const clampedY = Math.round(Math.min(100, Math.max(0, relY)) * 10) / 10;

    setFocal({ x: clampedX, y: clampedY });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDragging.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    updateCoordinatesFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    updateCoordinatesFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging.current) {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    // Enforce 0.05 step increments
    const snapped = Math.min(2.0, Math.max(1.0, Math.round(val * 20) / 20));
    setZoom(snapped);
  };

  const handleSave = () => {
    onSave(focal, zoom);
    onClose();
  };

  const handleResetCenter = () => {
    setFocal({ x: 50, y: 50 });
  };

  const handleResetZoom = () => {
    setZoom(1.0);
  };

  const getAspectClass = (ar: ImageAspectRatio) => {
    switch (ar) {
      case '16:9':
        return 'aspect-[16/9] w-full max-w-2xl';
      case '4:3':
        return 'aspect-[4/3] w-full max-w-xl';
      case '3:2':
        return 'aspect-[3/2] w-full max-w-xl';
      case '1:1':
        return 'aspect-square w-full max-w-md';
      case '3:4':
        return 'aspect-[3/4] w-full max-w-sm';
      case 'original':
      default:
        return 'aspect-[16/9] w-full max-w-2xl';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-[9995] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-admin-panel border border-admin-line-strong rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-admin-line flex items-center justify-between bg-admin-panel">
          <div>
            <h2 id={titleId} className="text-lg font-bold text-admin-text flex items-center gap-2">
              <Crosshair size={18} className="text-admin-gold" /> {title}
            </h2>
            <p className="text-xs text-admin-text-dim mt-0.5">
              Kéo thả hoặc nhấp vào ảnh để đặt điểm tiêu cự chuẩn hóa (0–100%). Giá trị lưu trữ là tọa độ phần trăm, không dùng pixel thô.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-admin-text-faint hover:text-admin-text hover:bg-admin-line transition-colors"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto flex flex-col lg:flex-row gap-6">
          {/* Main Visual Drag Frame */}
          <div className="flex-1 flex flex-col items-center justify-center bg-black/60 rounded-2xl p-4 sm:p-6 relative min-h-[380px]">
            {/* Aspect Ratio Badge */}
            <div className="absolute top-4 left-4 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-white text-[11px] font-mono flex items-center gap-1.5">
              <Maximize2 size={12} className="text-admin-gold" /> Khung hình: {aspectRatio}
            </div>

            {/* Interactive Target Frame */}
            <div
              ref={frameRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className={`relative rounded-xl overflow-hidden cursor-crosshair select-none touch-none shadow-2xl border-2 border-dashed border-admin-gold/60 ${getAspectClass(
                aspectRatio,
              )}`}
            >
              {/* Image Preview with focal positioning and zoom */}
              <img
                src={imageUrl}
                alt="Focal preview"
                className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                style={{
                  objectPosition: `${focal.x}% ${focal.y}%`,
                  transform: `scale(${zoom})`,
                  transformOrigin: `${focal.x}% ${focal.y}%`,
                }}
              />

              {/* Grid Lines (Rule of thirds) */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-25">
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-r border-b border-white" />
                <div className="border-b border-white" />
                <div className="border-r border-white" />
                <div className="border-r border-white" />
                <div />
              </div>

              {/* Draggable Focal Crosshair Target Indicator */}
              <div
                className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-all duration-75"
                style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
              >
                <div className="relative flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-admin-gold bg-admin-gold/20 backdrop-blur-xs flex items-center justify-center shadow-lg animate-pulse">
                    <div className="w-2 h-2 rounded-full bg-admin-gold" />
                  </div>
                  {/* Coordinate Label */}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 text-white text-[10px] font-mono px-1.5 py-0.5 rounded shadow-sm border border-white/10">
                    {focal.x}% / {focal.y}%
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-white/60 mt-3 text-center">
              Nhấp hoặc rê chuột trên khung hình để di chuyển tâm điểm chú ý
            </p>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-72 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Coordinates Summary */}
              <div className="p-4 rounded-xl bg-admin-panel-2 border border-admin-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-admin-text uppercase tracking-wide">Tọa độ tiêu điểm</span>
                  <button
                    type="button"
                    onClick={handleResetCenter}
                    className="text-[11px] text-admin-gold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={11} /> Căn giữa
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-admin-text-faint mb-1">Trục X (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={focal.x}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setFocal((prev) => ({ ...prev, x: Math.min(100, Math.max(0, val)) }));
                      }}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-admin-text-faint mb-1">Trục Y (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={focal.y}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val)) setFocal((prev) => ({ ...prev, y: Math.min(100, Math.max(0, val)) }));
                      }}
                      className="w-full px-3 py-1.5 text-xs font-mono bg-admin-panel border border-admin-line rounded-lg text-admin-text focus:outline-none focus:border-admin-gold"
                    />
                  </div>
                </div>
              </div>

              {/* Zoom Control */}
              <div className="p-4 rounded-xl bg-admin-panel-2 border border-admin-line space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-admin-text uppercase tracking-wide flex items-center gap-1.5">
                    <ZoomIn size={14} className="text-admin-gold" /> Độ thu phóng (Zoom)
                  </span>
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="text-[11px] text-admin-gold hover:underline flex items-center gap-1"
                  >
                    <RotateCcw size={11} /> 1.0x
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-admin-text-faint">Mức zoom:</span>
                    <span className="font-mono font-bold text-admin-gold">{zoom.toFixed(2)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="2.0"
                    step="0.05"
                    value={zoom}
                    onChange={handleZoomChange}
                    className="w-full accent-admin-gold cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-admin-text-faint font-mono">
                    <span>1.0x (Chuẩn)</span>
                    <span>1.5x</span>
                    <span>2.0x (Tối đa)</span>
                  </div>
                </div>
              </div>

              {/* Architecture Info Notice */}
              <div className="p-3 rounded-xl bg-admin-amber-a border border-admin-amber-b text-admin-text-dim text-[11px] flex gap-2">
                <Info size={16} className="text-admin-gold shrink-0 mt-0.5" />
                <p>
                  Thuộc tính <code className="font-mono text-admin-text">focalPoint</code> và <code className="font-mono text-admin-text">zoom</code> gắn trực tiếp theo phiên bản block instance, không làm thay đổi tệp gốc trong Media Library.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-admin-line">
              <button
                type="button"
                onClick={handleSave}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-admin-gold hover:bg-[#a67433] text-[#241804] flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
              >
                <Check size={16} strokeWidth={2.5} />
                Lưu căn chỉnh góc nhìn
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
