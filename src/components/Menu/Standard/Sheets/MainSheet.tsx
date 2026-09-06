/*
 * File: Standard/Sheets/MainSheet.tsx
 * Chức năng: Bảng chọn thời gian chi tiết (Popup chính).
 * Logic chi tiết:
 * - Render 2 chế độ:
 *   1. 'ADD': Grid các mốc thời gian (60', 90'...) để khách chọn mới.
 *   2. 'LIST': Danh sách các option đã chọn của nhóm này (nếu có).
 * - Xử lý animation slide-up (Entrance) mượt mà với state isVisible.
 * - Điều chỉnh giao diện ảnh header (tỷ lệ) tùy theo nội dung bên dưới.
 * Tác giả: TunHisu
 * Ngày cập nhật: 2026-01-31
 */
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Plus, ChevronDown, List, Pencil, PlusCircle } from 'lucide-react';
import { CartItem, Service } from '../../types';
import { formatCurrency } from '../../utils';
import { getCartSelectionKey } from '../../cartSelection';

interface MainSheetProps {
    group: Service[]; // Nhận vào cả nhóm món ăn
    cart: CartItem[];
    isOpen: boolean;
    lang: string;
    onClose: () => void;
    onAddToCart: (id: string, quantity: number, options?: any) => void;
    onSetSelectionQuantity: (reference: CartItem, quantity: number) => void;
}

// 🔧 UI CONFIGURATION
const CONFIG = {
    ANIMATION_DURATION: 300,
    BORDER_RADIUS: '30px',
    MAX_HEIGHT: '85vh',
    HEADER_IMAGE_HEIGHT: '12rem', // h-48 = 12rem = 192px
    OVERLAY_COLOR: 'bg-black/60',
    BG_COLOR: 'bg-[#0d0d0d]',
    // Time slot button stagger
    SLOT_STAGGER_DELAY: 0.06,     // Delay between each button appearing
    SLOT_START_DELAY: 0.15,       // Delay before first button
    SLOT_ANIMATION_DURATION: 0.3, // Each button's animation duration
};

// DICTIONARY
const TEXT = {
    selected_options: { vi: 'Dịch vụ đã chọn', en: 'Selected Options', cn: '已选服务', jp: '選択されたサービス', kr: '선택된 서비스' },
    selected_msg: {
        vi: (n: number, name: string) => `Bạn đã chọn ${n} mục cho ${name}`,
        en: (n: number, name: string) => `You have selected ${n} options for ${name}`,
        cn: (n: number, name: string) => `您已为 ${name} 选择 ${n} 个选项`,
        jp: (n: number, name: string) => `${name} のために ${n} つのオプションを選択しました`,
        kr: (n: number, name: string) => `${name}에 대해 ${n}개의 옵션을 선택했습니다`
    },
    duration: { vi: 'THỜI LƯỢNG', en: 'DURATION', cn: '时长', jp: '期間', kr: '소요 시간' },
    qty: { vi: 'SL', en: 'Qty', cn: '数量', jp: '数量', kr: '수량' },
    pax: { vi: 'khách', en: 'pax', cn: '人', jp: '名', kr: '명' },
    add_another: { vi: 'THÊM LỰA CHỌN KHÁC', en: 'Add another option', cn: '添加其他选项', jp: '別のオプションを追加', kr: '다른 옵션 추가' },
    select_duration: { vi: 'CHỌN THỜI GIAN', en: 'Select Duration', cn: '选择时长', jp: '期間を選択', kr: '시간 선택' },
    back_to_list: { vi: 'Quay lại danh sách', en: 'Back to list', cn: '返回列表', jp: 'リストに戻る', kr: '목록으로 돌아가기' },
    view_more: { vi: 'Xem thêm', en: 'View More', cn: '查看更多', jp: 'もっと見る', kr: '더 보기' },
    update_cart: { vi: 'Cập Nhật Giỏ', en: 'Update Cart', cn: '更新购物车', jp: 'カートを更新', kr: '장바구니 업데이트' },
    add_to_cart: { vi: 'Thêm Vào Giỏ', en: 'Add to Cart', cn: '加入购物车', jp: 'カートに追加', kr: '장바구니 담기' },
    mins: { vi: 'phút', en: 'mins', cn: '分钟', jp: '分', kr: '분' },
    custom_for_you: { vi: 'Tùy chỉnh dịch vụ', en: 'Custom for you', cn: '定制服务', jp: 'カスタムサービス', kr: '맞춤 서비스' },
    custom_selected: { vi: 'Đã tùy chỉnh', en: 'Customized', cn: '已定制', jp: 'カスタマイズ済み', kr: '맞춤 설정됨' },
    recommended: { vi: 'Gợi ý', en: 'Recommended', cn: '推荐', jp: 'おすすめ', kr: '추천' }
};

export default function MainSheet({ group, cart, isOpen, lang, onClose, onAddToCart, onSetSelectionQuantity }: MainSheetProps) {
    // Helper translate
    const t = (key: Exclude<keyof typeof TEXT, 'selected_msg'>) => {
        const dict = TEXT[key] as Record<string, string>;
        return dict[lang] || dict['en'];
    };
    // Helper translate msg (function)
    const tMsg = (n: number, name: string) => {
        const func = TEXT['selected_msg'][lang as keyof typeof TEXT['selected_msg']] || TEXT['selected_msg']['en'];
        return func(n, name);
    };

    // State lưu món đang được chọn trong nhóm (Mặc định là món đầu tiên)
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [qty, setQty] = useState(1);
    const [showAll, setShowAll] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [isVisible, setIsVisible] = useState(false); // State cho hiệu ứng mở (Entrance Animation)

    // MODE: 'LIST' (Xem danh sách đã chọn) | 'ADD' (Thêm mới)
    const [viewMode, setViewMode] = useState<'LIST' | 'ADD'>('ADD');
    const [editingSelection, setEditingSelection] = useState<CartItem | null>(null);

    const purchasedSelections = useMemo(() => {
        const serviceIds = new Set(group.map(service => service.id));
        const grouped = new Map<string, CartItem & { totalQty: number }>();
        cart.filter(item => serviceIds.has(item.id)).forEach(item => {
            const key = getCartSelectionKey(item);
            const existing = grouped.get(key);
            if (existing) existing.totalQty += item.qty;
            else grouped.set(key, { ...item, totalQty: item.qty });
        });
        return Array.from(grouped.values());
    }, [cart, group]);

    const serviceQuantity = (serviceId: string) =>
        cart.filter(item => item.id === serviceId).reduce((total, item) => total + item.qty, 0);

    useEffect(() => {
        if (isOpen && group.length > 0) {
            // 1. Sort lại group
            const sortedGroup = [...group].sort((a, b) => a.timeValue - b.timeValue);

            // 2. Kiểm tra xem trong cart đã có món nào thuộc group này chưa
            const hasPurchasedItems = purchasedSelections.length > 0;

            if (hasPurchasedItems) {
                // Nếu có -> Chuyển sang chế độ xem danh sách
                setViewMode('LIST');
            } else {
                // Nếu chưa -> Chuyển sang chế độ thêm mới (Chọn giờ default)
                setViewMode('ADD');
                setSelectedService(sortedGroup[0]);
                setQty(1);
            }

            setEditingSelection(null);
            setShowAll(false);
            setIsClosing(false);

            // Trigger animation mở sau khi render
            // setTimeout nhỏ để đảm bảo trình duyệt nhận diện trạng thái ban đầu (translate-y-full) trước
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        }
    }, [isOpen, group, purchasedSelections.length]);

    if (!isOpen) return null;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(onClose, 300);
    };

    const handleConfirm = () => {
        if (selectedService) {
            if (editingSelection) {
                onSetSelectionQuantity(editingSelection, qty);
                setEditingSelection(null);
                setViewMode('LIST');
            } else {
                onAddToCart(selectedService.id, qty);
            }
        }
    };

    // Chuyển sang sửa 1 món cụ thể
    const handleEditItem = (selection: CartItem & { totalQty: number }) => {
        setSelectedService(selection);
        setQty(selection.totalQty);
        setEditingSelection(selection);
        setViewMode('ADD');
    };

    // Lấy tên chung của nhóm (Lấy từ món đầu tiên)
    const representative = group[0];
    const groupName = representative?.names[lang as keyof typeof representative.names] || representative?.names['en'];

    // --- RENDER GIAO DIỆN ---
    return (
        <>
            <div className={`fixed inset-0 ${CONFIG.OVERLAY_COLOR} z-40 transition-opacity duration-${CONFIG.ANIMATION_DURATION} ${isClosing ? 'opacity-0' : 'opacity-100'}`} onClick={handleClose} />

            <div className={`
          fixed bottom-0 left-0 w-full ${CONFIG.BG_COLOR} rounded-t-[${CONFIG.BORDER_RADIUS}] z-50 overflow-hidden flex flex-col shadow-2xl
          transform transition-transform 
          duration-${CONFIG.ANIMATION_DURATION}
          ease-out
          pb-safe
          ${(isClosing || !isVisible) ? 'translate-y-full' : 'translate-y-0'}
        `} style={{ maxHeight: CONFIG.MAX_HEIGHT }}>

                {/* Nút đóng */}
                <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 bg-black/20 rounded-full flex items-center justify-center text-white z-20 hover:bg-black/40 transition-colors">
                    <X size={18} />
                </button>

                {/* --- HEADER CHUNG --- */}
                {viewMode === 'ADD' && selectedService && (
                    <div className="w-full px-5 pt-6 pb-2 shrink-0">
                        <h2 className="text-2xl font-bold text-[#C9A96E] font-luxury leading-tight">{groupName}</h2>
                        <p className="text-sm text-gray-400 mt-1 opacity-80 leading-snug">
                            {selectedService.descriptions[lang as keyof typeof selectedService.descriptions] || selectedService.descriptions['en']}
                        </p>
                    </div>
                )}

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 pt-4 pb-6">

                    {/* ================= MODE: LIST (Danh sách đã chọn) ================= */}
                    {viewMode === 'LIST' && (
                        <div className="px-5 pt-4">
                            <div className="flex items-center gap-3 mb-6">
                                <List className="text-[#C9A96E]" size={24} />
                                <div>
                                    <h2 className="text-xl font-bold text-white">{t('selected_options')}</h2>
                                    <p className="text-sm text-gray-400">{tMsg(purchasedSelections.length, groupName)}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {purchasedSelections.map(selection => (
                                    <div key={getCartSelectionKey(selection)} className="bg-[#1c1c1e]/80 p-4 rounded-xl border border-gray-700 flex justify-between items-center gap-3 group hover:border-gray-500 transition-colors">
                                        <div>
                                            <div className="flex items-baseline gap-2">
                                                {selection.timeValue > 0 && (
                                                    <>
                                                        <span className="text-[#C9A96E] font-bold text-xl">{selection.timeValue}{t('mins')}</span>
                                                        <span className="text-gray-500 text-xs uppercase tracking-wider">{t('duration')}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-white font-medium mt-1">
                                                {formatCurrency(selection.priceVND)} VND <span className="text-gray-600">/</span> <span className="text-emerald-600">{selection.priceUSD} USD</span>
                                            </div>
                                            <div className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                                                <span>{t('qty')}:</span>
                                                <span className="text-white font-bold">{selection.totalQty}</span>
                                                <span>{t('pax')}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            <button onClick={() => onSetSelectionQuantity(selection, selection.totalQty - 1)} className="w-9 h-9 rounded-full bg-gray-800 text-white flex items-center justify-center hover:bg-gray-700" aria-label="Decrease quantity"><Minus size={16} /></button>
                                            <button onClick={() => onSetSelectionQuantity(selection, selection.totalQty + 1)} className="w-9 h-9 rounded-full bg-[#C9A96E] text-black flex items-center justify-center hover:bg-[#dfc599]" aria-label="Increase quantity"><Plus size={16} /></button>
                                            <button onClick={() => handleEditItem(selection)} className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-[#C9A96E] hover:text-black transition-all shadow-lg" aria-label="Edit option"><Pencil size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Nút Add Option */}
                            <button
                                onClick={() => {
                                    setViewMode('ADD');
                                    setEditingSelection(null);
                                    // Reset về cái đầu tiên chưa chọn hoặc cái đầu list
                                    const sorted = [...group].sort((a, b) => a.timeValue - b.timeValue);
                                    setSelectedService(sorted[0]);
                                    setQty(1);
                                }}
                                className="w-full mt-6 py-4 border border-dashed border-gray-600 text-gray-400 rounded-xl flex items-center justify-center gap-2 hover:border-[#C9A96E] hover:text-[#C9A96E] hover:bg-[#C9A96E]/5 transition-all text-sm font-bold uppercase tracking-wide"
                            >
                                <PlusCircle size={20} />
                                <span>{t('add_another')}</span>
                            </button>
                        </div>
                    )}


                    {/* ================= MODE: ADD (Thêm/Sửa) ================= */}
                    {viewMode === 'ADD' && selectedService && (
                        <div className="px-5 mt-2">
                            {/* KHU VỰC CHỌN THỜI GIAN */}
                            <div className="mb-6">
                                {/* Nếu list có item -> Cho nút Back to list */}
                                {purchasedSelections.length > 0 && (
                                    <div className="flex justify-end mb-3">
                                        <button onClick={() => setViewMode('LIST')} className="text-xs text-[#C9A96E] font-bold hover:underline">
                                            {t('back_to_list')}
                                        </button>
                                    </div>
                                )}

                                <motion.div
                                    className="grid grid-cols-2 gap-3"
                                    initial="hidden"
                                    animate="visible"
                                    variants={{
                                        hidden: { opacity: 1 },
                                        visible: {
                                            opacity: 1,
                                            transition: {
                                                staggerChildren: CONFIG.SLOT_STAGGER_DELAY,
                                                delayChildren: CONFIG.SLOT_START_DELAY,
                                            },
                                        },
                                    }}
                                >
                                    {group
                                        .filter((svc, idx, arr) => arr.findIndex(s => s.timeValue === svc.timeValue && s.priceVND === svc.priceVND) === idx) // Dedup by time and price
                                        .sort((a, b) => a.timeValue - b.timeValue)
                                        .slice(0, 4)
                                        .map((svc) => (
                                            <motion.button
                                                key={svc.id}
                                                onClick={() => {
                                                    setSelectedService(svc);
                                                    setEditingSelection(null);
                                                    setQty(1);
                                                }}
                                                variants={{
                                                    hidden: { opacity: 0, scale: 0.85, y: 10 },
                                                    visible: {
                                                        opacity: 1,
                                                        scale: 1,
                                                        y: 0,
                                                        transition: {
                                                            duration: CONFIG.SLOT_ANIMATION_DURATION,
                                                            ease: [0.25, 0.46, 0.45, 0.94],
                                                        },
                                                    },
                                                }}
                                                whileTap={{ scale: 0.95 }}
                                                className={`
                                        flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-colors relative overflow-hidden
                                        ${selectedService.id === svc.id
                                                        ? 'bg-[#1c1c1e] text-white border-[#C9A96E] border-2 shadow-lg shadow-[#C9A96E]/10'
                                                        : 'bg-[#0d0d0d] text-gray-400 border-gray-700 hover:border-gray-500'}
                                    `}
                                            >
                                                {/* [LOGIC NEW] Badge Best Choice */}
                                                {svc.BEST_CHOICE && (
                                                    <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-md z-10 uppercase tracking-wider">
                                                        {t('recommended')}
                                                    </div>
                                                )}

                                                {svc.timeValue > 0 && (
                                                    <span className={`text-xl font-bold mb-1 ${selectedService.id === svc.id ? 'text-white' : 'text-gray-400'}`}>
                                                        {svc.timeValue}{t('mins')}
                                                    </span>
                                                )}
                                                <div className="text-sm font-medium flex gap-1 items-center justify-center w-full">
                                                    <span className="text-[#C9A96E] font-bold">{formatCurrency(svc.priceVND)}</span>
                                                    <span className="text-gray-500">/</span>
                                                    <span className="text-emerald-600 font-bold">{svc.priceUSD} USD</span>
                                                </div>

                                                {/* Badge số lượng nếu đã có trong giỏ (khi đang chọn món khác) */}
                                                {serviceQuantity(svc.id) > 0 && selectedService.id !== svc.id && (
                                                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#C9A96E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                        {serviceQuantity(svc.id)}
                                                    </div>
                                                )}
                                            </motion.button>
                                        ))}

                                    {/* Expanded items (appear with animation after View More) */}
                                    <AnimatePresence>
                                        {showAll && group
                                            .filter((svc, idx, arr) => arr.findIndex(s => s.timeValue === svc.timeValue && s.priceVND === svc.priceVND) === idx)
                                            .sort((a, b) => a.timeValue - b.timeValue)
                                            .slice(4)
                                            .map((svc, idx) => (
                                                <motion.button
                                                    key={`extra-${svc.id}`}
                                                    onClick={() => {
                                                        setSelectedService(svc);
                                                        setEditingSelection(null);
                                                        setQty(1);
                                                    }}
                                                    initial={{ opacity: 0, scale: 0.85, y: 10 }}
                                                    animate={{
                                                        opacity: 1,
                                                        scale: 1,
                                                        y: 0,
                                                        transition: {
                                                            duration: CONFIG.SLOT_ANIMATION_DURATION,
                                                            delay: idx * CONFIG.SLOT_STAGGER_DELAY,
                                                            ease: [0.25, 0.46, 0.45, 0.94],
                                                        },
                                                    }}
                                                    exit={{ opacity: 0, scale: 0.85 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    className={`
                                            flex flex-col items-center justify-center py-4 px-2 rounded-xl border transition-colors relative overflow-hidden
                                            ${selectedService.id === svc.id
                                                            ? 'bg-[#1c1c1e] text-white border-[#C9A96E] border-2 shadow-lg shadow-[#C9A96E]/10'
                                                            : 'bg-[#0d0d0d] text-gray-400 border-gray-700 hover:border-gray-500'}
                                        `}
                                                >
                                                    {svc.BEST_CHOICE && (
                                                        <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-md z-10 uppercase tracking-wider">
                                                            {t('recommended')}
                                                        </div>
                                                    )}
                                                    {svc.timeValue > 0 && (
                                                        <span className={`text-xl font-bold mb-1 ${selectedService.id === svc.id ? 'text-white' : 'text-gray-400'}`}>
                                                            {svc.timeValue}{t('mins')}
                                                        </span>
                                                    )}
                                                    <div className="text-sm font-medium flex gap-1 items-center justify-center w-full">
                                                        <span className="text-[#C9A96E] font-bold">{formatCurrency(svc.priceVND)}</span>
                                                        <span className="text-gray-500">/</span>
                                                        <span className="text-emerald-600 font-bold">{svc.priceUSD} USD</span>
                                                    </div>
                                                    {serviceQuantity(svc.id) > 0 && selectedService.id !== svc.id && (
                                                        <div className="absolute top-2 right-2 w-5 h-5 bg-[#C9A96E] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                                        {serviceQuantity(svc.id)}
                                                        </div>
                                                    )}
                                                </motion.button>
                                            ))}
                                    </AnimatePresence>
                                </motion.div>
                            </div>

                            {/* Button View More Logic */}
                            {!showAll && group.length > 4 && (
                                <motion.div
                                    className="flex justify-center mb-6"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                >
                                    <button
                                        onClick={() => setShowAll(true)}
                                        className="text-gray-400 flex items-center gap-1 text-sm hover:text-white transition-colors"
                                    >
                                        <span>{t('view_more')}</span>
                                        <motion.span
                                            animate={{ y: [0, 3, 0] }}
                                            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                                        >
                                            <ChevronDown size={16} />
                                        </motion.span>
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    )}
                </div>

                {/* FOOTER ACTION - CHỈ HIỆN Ở MODE ADD */}
                {viewMode === 'ADD' && selectedService && (
                    <div className="p-5 pt-2 bg-[#0d0d0d] border-t border-gray-700/50">
                        <div className="flex items-center justify-center mb-6">
                            <div className="flex items-center gap-6 bg-[#1c1c1e] rounded-full p-2 border border-gray-700 px-6">
                                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center hover:bg-gray-600 transition-colors"><Minus size={18} /></button>
                                <span className="text-xl font-bold text-white min-w-[30px] text-center font-mono">{qty}</span>
                                <button onClick={() => setQty(q => q + 1)} className="w-10 h-10 rounded-full bg-[#C9A96E] text-white flex items-center justify-center hover:bg-[#dfc599] transition-colors"><Plus size={18} /></button>
                            </div>
                        </div>

                        <button onClick={handleConfirm} className="w-full py-3.5 bg-gradient-to-r from-[#b6965b] to-[#C9A96E] text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 text-base uppercase hover:brightness-110 transition-all">
                            <span>{editingSelection ? t('update_cart') : t('add_to_cart')}</span>
                            <span className="opacity-40">|</span>
                            <span>{formatCurrency(selectedService.priceVND * qty)} VND</span>
                            <span className="opacity-40">/</span>
                            <span className="text-emerald-600 font-bold">{selectedService.priceUSD * qty} USD</span>
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}
