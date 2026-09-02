import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface FocalPointEditorProps {
  src: string;
  mediaType: 'image' | 'video';
  aspectRatio: number;
  initialPosition: string; // "x% y%"
  onSave: (position: string) => void;
  onClose: () => void;
}

export default function FocalPointEditor({
  src,
  mediaType,
  aspectRatio,
  initialPosition,
  onSave,
  onClose
}: FocalPointEditorProps) {
  const parsePos = (pos: string) => {
    const parts = pos.split(' ');
    const x = parts[0] ? parseFloat(parts[0]) : 50;
    const y = parts[1] ? parseFloat(parts[1]) : 50;
    return { x: isNaN(x) ? 50 : x, y: isNaN(y) ? 50 : y };
  };

  const [pos, setPos] = useState(parsePos(initialPosition));
  const containerRef = useRef<HTMLDivElement>(null);
  
  const isDragging = useRef(false);
  const lastClientX = useRef(0);
  const lastClientY = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    lastClientX.current = e.clientX;
    lastClientY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const dx = e.clientX - lastClientX.current;
    const dy = e.clientY - lastClientY.current;
    
    lastClientX.current = e.clientX;
    lastClientY.current = e.clientY;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const percentX = (dx / width) * 100 * -1;
    const percentY = (dy / height) * 100 * -1;
    
    const SENSITIVITY = 1.2;

    setPos(prev => ({
      x: Math.min(100, Math.max(0, prev.x + percentX * SENSITIVITY)),
      y: Math.min(100, Math.max(0, prev.y + percentY * SENSITIVITY))
    }));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-admin-panel border border-admin-line-strong rounded-2xl p-6 w-full max-w-4xl flex flex-col shadow-2xl relative">
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-admin-text font-bold text-lg">Căn chỉnh hiển thị</h3>
            <p className="text-admin-text-faint text-sm">Kéo ảnh để chọn vùng hiển thị trên web</p>
          </div>
          <button onClick={onClose} className="text-admin-text-faint hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 min-h-[500px] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden relative p-8">
           <div 
             ref={containerRef}
             className="relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] border border-dashed border-white/40 cursor-move touch-none"
             style={{ 
               aspectRatio: `${aspectRatio}`, 
               width: aspectRatio >= 1 ? '100%' : 'auto', 
               height: aspectRatio < 1 ? '100%' : 'auto', 
               maxHeight: '100%', 
               maxWidth: '100%' 
             }}
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
             onPointerCancel={handlePointerUp}
             title="Kéo để di chuyển vùng hiển thị"
           >
             {mediaType === 'video' ? (
               <video 
                 src={src} 
                 autoPlay muted loop playsInline 
                 className="w-full h-full object-cover pointer-events-none"
                 style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
               />
             ) : (
               <img 
                 src={src} 
                 alt="Preview" 
                 className="w-full h-full object-cover pointer-events-none"
                 style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
               />
             )}
             
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/30 rounded-full pointer-events-none flex items-center justify-center">
                <div className="w-1 h-1 bg-white/70 rounded-full"></div>
             </div>
           </div>
        </div>

        <div className="mt-6 flex justify-between items-center">
          <div className="text-admin-text-dim text-sm font-mono">
            X: {Math.round(pos.x)}% <span className="mx-2">|</span> Y: {Math.round(pos.y)}%
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-6 py-2 rounded-lg text-admin-text hover:bg-admin-line transition-colors font-medium">
              Hủy
            </button>
            <button 
              onClick={() => onSave(`${Math.round(pos.x)}% ${Math.round(pos.y)}%`)}
              className="px-6 py-2 rounded-lg bg-admin-gold text-[#241804] hover:bg-[#a67433] transition-colors font-bold shadow-lg"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
