/*
 * File: Standard/ServiceItem.tsx
 * Chức năng: Card hiển thị thông tin tóm tắt của một nhóm dịch vụ (Service Group).
 * Logic chi tiết:
 * - Hiển thị ảnh đại diện, tên dịch vụ (đa ngôn ngữ), và khoảng giá (Min - Max).
 * - Xử lý sự kiện click để mở MainSheet cho nhóm dịch vụ này.
 * - Hiển thị badge số lượng nếu đã có item trong giỏ hàng.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
'use client';
import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Service } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';

interface ServiceItemProps {
    service: Service;
    quantity: number;
    lang: string;
    isBestSeller?: boolean; // Prop mới
    onClick: () => void;
    onQuickAdd: () => void;
    onQuickRemove: () => void;
}

export default function ServiceItem({ service, quantity, lang, isBestSeller, onClick, onQuickAdd, onQuickRemove }: ServiceItemProps) {
    const name = service.names[lang as keyof typeof service.names] || service.names['en'];
    const desc = service.descriptions[lang as keyof typeof service.descriptions] || service.descriptions['en'];
    const isSelected = quantity > 0;
    const [isVideoLoading, setIsVideoLoading] = React.useState(true);

    const BEST_SELLER_LABEL = {
        en: 'BEST SELLER',
        vi: 'BÁN CHẠY',
        kr: '베스트셀러',
        cn: '热销',
        jp: 'ベストセラー'
    };

    return (
        <div
            onClick={onClick}
            className={`
        relative w-full rounded-2xl p-3 flex flex-row gap-4 items-center overflow-hidden
        transition-all duration-300 cursor-pointer active:scale-[0.98]
        ${isSelected ? 'bg-[#1c1c1e] border border-[#C9A96E]/30' : 'bg-[#0d0d0d] border border-transparent'}
        shadow-lg hover:bg-[#1c1c1e]
      `}
        >
            {/* [LOGIC NEW] Badge Best Seller */}
            {isBestSeller && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#C9A96E] to-[#B38728] text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg rounded-tr-2xl shadow-sm z-10 whitespace-nowrap">
                    {BEST_SELLER_LABEL[lang as keyof typeof BEST_SELLER_LABEL] || 'BEST SELLER'}
                </div>
            )}

            {/* 1. Ảnh vuông bo tròn / Video */}
            <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#1c1c1e] relative shadow-sm">
                {service.media_type === 'video' && service.media_url ? (
                    <>
                        <video
                            src={service.media_url}
                            poster={service.img}
                            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                            muted
                            autoPlay
                            playsInline
                            loop
                            onWaiting={() => setIsVideoLoading(true)}
                            onPlaying={() => setIsVideoLoading(false)}
                            onCanPlay={() => setIsVideoLoading(false)}
                        />
                        {isVideoLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <div className="w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </>
                ) : (
                    <img
                        src={service.media_type === 'image' && service.media_url ? service.media_url : service.img}
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                        alt={name}
                        onError={(e) => (e.currentTarget.src = 'https://placehold.co/100x100?text=SPA')}
                    />
                )}
            </div>

            {/* 2. Nội dung text (Không hiện giá) */}
            <div className="flex flex-col justify-center flex-1 min-w-0 py-1 min-h-[5rem]" style={{ paddingRight: '48px' }}>
                <h3 className="font-bold text-white text-[15px] leading-tight mb-1.5 line-clamp-2 font-luxury tracking-wide">
                    {name}
                </h3>
                <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed font-light">
                    {desc}
                </p>
            </div>



            {/* 3. Quick quantity controls. Events stay inside the control, not the card. */}
            <div className="absolute bottom-3 right-3 z-10">
                {isSelected ? (
                    <div className="flex items-center gap-1 rounded-full bg-[#1c1c1e] border border-[#C9A96E]/60 p-1 shadow-lg shadow-[#C9A96E]/20 animate-[pop_0.2s_ease-out]">
                        <button onClick={(event) => { event.stopPropagation(); onQuickRemove(); }} className="w-7 h-7 rounded-full text-gray-200 hover:bg-white/10 flex items-center justify-center" aria-label="Decrease quantity"><Minus size={14} /></button>
                        <span className="min-w-5 text-center text-[#f2dc9f] font-extrabold text-sm">{quantity}</span>
                        <button onClick={(event) => { event.stopPropagation(); onQuickAdd(); }} className="w-7 h-7 rounded-full bg-[#D4AF37] text-[#17120c] hover:bg-[#e8c96d] flex items-center justify-center" aria-label="Increase quantity"><Plus size={14} /></button>
                    </div>
                ) : (
                    <button onClick={(event) => { event.stopPropagation(); onQuickAdd(); }} className="w-9 h-9 rounded-full bg-gray-700/80 text-[#C9A96E] flex items-center justify-center backdrop-blur-sm hover:bg-gray-600 hover:text-white transition-colors" aria-label="Add service">
                        <Plus size={18} strokeWidth={2.5} />
                    </button>
                )}
            </div>
        </div>
    );
}
