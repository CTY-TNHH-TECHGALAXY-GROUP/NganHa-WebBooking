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
import { Plus } from 'lucide-react';
import { Service } from '@/components/Menu/types';
import { formatCurrency } from '@/components/Menu/utils';

interface ServiceItemProps {
    service: Service;
    quantity: number;
    lang: string;
    isBestSeller?: boolean; // Prop mới
    onClick: () => void;
}

export default function ServiceItem({ service, quantity, lang, isBestSeller, onClick }: ServiceItemProps) {
    const name = service.names[lang as keyof typeof service.names] || service.names['en'];
    const desc = service.descriptions[lang as keyof typeof service.descriptions] || service.descriptions['en'];
    const isSelected = quantity > 0;
    const [isVideoLoading, setIsVideoLoading] = React.useState(true);

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
                <div className="absolute top-0 right-0 bg-gradient-to-r from-[#C9A96E] to-[#B38728] text-white text-[9px] font-bold pl-2 pr-3 py-0.5 rounded-bl-lg rounded-tr-2xl shadow-sm z-10 whitespace-nowrap">
                    BEST SELLER
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
            <div className="flex flex-col justify-center flex-1 min-w-0 py-1 h-20" style={{ paddingRight: '70px' }}>
                <h3 className="font-bold text-white text-[15px] leading-tight mb-1.5 line-clamp-2 font-luxury tracking-wide">
                    {name}
                </h3>
                <p className="text-[11px] text-gray-400 line-clamp-3 leading-relaxed font-light">
                    {desc}
                </p>
            </div>



            {/* 3. Nút Cộng / Badge số lượng (Góc dưới phải tuyệt đối) */}
            <div className="absolute bottom-3 right-3 z-10">
                {isSelected ? (
                    // Nếu đã chọn: Hiện số lượng màu vàng
                    <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-white font-extrabold text-sm flex items-center justify-center shadow-lg shadow-[#C9A96E]/20 animate-[pop_0.2s_ease-out]">
                        {quantity}
                    </div>
                ) : (
                    // Chưa chọn: Hiện nút Plus xám tròn
                    <div className="w-9 h-9 rounded-full bg-gray-700/80 text-[#C9A96E] flex items-center justify-center backdrop-blur-sm hover:bg-gray-600 hover:text-white transition-colors">
                        <Plus size={18} strokeWidth={2.5} />
                    </div>
                )}
            </div>
        </div>
    );
}